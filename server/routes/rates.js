const express = require('express');
const axios = require('axios');
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');
const {generatePdfLink} = require("../functions/generateLabel.js");
const { getPool } = require('../db');
const sql = require('mssql');

const router = express.Router();

// Set up Upstash Redis
const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
  token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim(),
});

// Create the limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '15 m'), // 100 requests per 15 minutes
});

// Middleware
const rateLimitMiddleware = async (req, res, next) => {
  const identifier = req.sessionID || req.ip;

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", reset);

  if (!success) {
    return res.status(429).json({
      message: "Too many requests — try again in a few minutes",
      reset,
    });
  }

  next();
};

//Fetch gls rate
router.post('/get-gls-rate', rateLimitMiddleware, async (req, res) => {
  try {
    //added logging for shopify compliance
    console.log(`[ACCESS LOG] Rate requested for recipient postal code: ${req.body?.destination_address?.postal_code}`);
    
    const url = 'https://secureship.ca/ship/api/v2/carriers/rates';

    const response = await axios.post(url, req.body, {
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': `${process.env.SS_KEY}`
          }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({ error: 'Failed to fetch rate from GLS API' });
  }
});
//Fetch tracking number and shipping label etc from gls api
router.post('/get-gls-label', async (req, res) => {
  try {
    const url = 'https://secureship.ca/ship/api/v1/carriers/create-label';
    const response = await axios.post(url, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': `${process.env.SS_KEY}`
      }
    });
    res.json(response.data);
  }catch(error){
    console.error('Error making the api call to GLS and creating shipping label:', error);
    res.status(500).json({ error: 'Failed to create shipping label from GLS api' });
  }
});
router.get('/download-gls-label', async (req, res) => {
  try {
    const { shipment_id, documentSize } = req.query;
    

    if (!shipment_id) {
      return res.status(400).json({ error: 'shipment_id is required' });
    }

    const url = `https://secureship.ca/ship/api/v1/carriers/download/documents/${shipment_id}`;
    const response = await axios.get(url, {
      headers: {
        'X-API-KEY': `${process.env.SS_KEY}`
      },
      params: {
        documentSize 
      },
      responseType: 'arraybuffer' // Expect binary data
    });

    // Convert binary data to base64
    const base64String = Buffer.from(response.data, 'binary').toString('base64');

    res.json({ base64String });
  } catch (error) {
    console.error('Error fetching the shipping label:', error);
    res.status(500).json({ error: 'Failed to fetch shipping label' });
  }
});
// Fetch rate from API
router.post('/get-rate', rateLimitMiddleware, async (req, res) => {
  try {
    //added logging for shopify compliance
    console.log(`[ACCESS LOG] Rate requested for recipient postal code: ${req.body?.destination_address?.postal_code}`);

    const url = 'https://public-api.easyship.com/2024-09/rates';

    const response = await axios.post(url, req.body, {
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `${process.env.ES_KEY}`
          }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({ error: 'Failed to fetch rate from API' });
  }
});

//Fetch tracking number and shipping label etc from api
router.post('/get-label', async (req, res) => {
  try {
    const url = 'https://public-api.easyship.com/2024-09/shipments';
    const response = await axios.post(url, req.body, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `${process.env.ES_KEY}`
      }
    });
    res.json(response.data);
  }catch(error){
    console.error('Error making the api call and creating shipping label:', error);
    res.status(500).json({ error: 'Failed to create shipping label from eashyship api' });
  }
});
router.get('/download-label', async (req, res) => {
  console.log("Query Params:", req.query);
 
  try {
    const { shipment_id, format, label, commercial_invoice, packing_slip } = req.query;
    const url = `https://public-api.easyship.com/2024-09/shipments/${shipment_id}`;
   
    // Maximum number of polling attempts (10 attempts * 3 seconds = 30 seconds max wait time)
    const MAX_ATTEMPTS = 10;
    let attempts = 0;
    let success = false;
    let response;
   
    // Add polling logic
    while (!success && attempts < MAX_ATTEMPTS) {
      try {
        response = await axios.get(url, {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `${process.env.ES_KEY}`
          },
          params: {
            format,
            label,
            commercial_invoice,
            packing_slip
          }
        });
       
        // Check if the response has the required data
        if (response.data?.shipment?.trackings?.[0]?.tracking_number &&
            response.data?.shipment?.shipping_documents?.[0]?.base64_encoded_strings?.[0]) {
          success = true;
        } else {
          // If not successful, increment attempts and wait 3 seconds before retrying
          attempts++;
          if (attempts < MAX_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      } catch (error) {
        // If the request fails, increment attempts and wait 3 seconds before retrying
        console.error(`Polling attempt ${attempts + 1} failed:`, error.message);
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
   
    // If we've reached max attempts without success, return an error response
    if (!success) {
      return res.status(408).json({
        error: 'Timeout waiting for label data from EasyShip API'
      });
    }
   
    // Process the successful response
    const trackingNumber = response.data.shipment.trackings[0].tracking_number;
    const labelBase64 = response.data.shipment.shipping_documents[0].base64_encoded_strings[0];
    const labelUrl = await generatePdfLink(labelBase64, trackingNumber);

    //DEBUGGIN LOG
    console.log("TRACKING NUMBER: " + trackingNumber);
    console.log("PDFLINK: " + labelUrl);
   
    // Update DB label with the tracking number and amazon aws pdf link url
    try {
      const pool = getPool();
      await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('tracking_number', sql.NVarChar(255), trackingNumber)
        .input('pdf_url', sql.NVarChar(sql.MAX), labelUrl)
        .input('status', sql.VarChar(20), "ready")
        .query(`
          UPDATE Labels
          SET
            tracking_number = @tracking_number,
            pdf_url = @pdf_url,
            status = @status
          WHERE shipment_id = @shipment_id
        `);
      
      // After successfully updating the database, get the user ID associated with this shipment
      // to send WebSocket notification
      const userResult = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .query(`
          SELECT user_id, recipient_name, recipient_address, courier_name, courier_service_id 
          FROM Labels 
          WHERE shipment_id = @shipment_id
        `);
      
      // If we found the user and the global WebSocket function exists
      if (userResult.recordset.length > 0 && global.sendLabelUpdate) {
        const userId = userResult.recordset[0].user_id;
        
        // Construct the complete label object to send to the client
        const updatedLabel = {
          shipment_id: shipment_id,
          tracking_number: trackingNumber,
          pdf_url: labelUrl,
          status: "ready",
          recipient_name: userResult.recordset[0].recipient_name,
          recipient_address: userResult.recordset[0].recipient_address,
          courier_name: userResult.recordset[0].courier_name,
          courier_service_id: userResult.recordset[0].courier_service_id
          // Add any other fields that your front-end expects
        };
        
        // Send the real-time update
        global.sendLabelUpdate(userId, {
          type: 'label_update',
          label: updatedLabel
        });
        
        console.log(`WebSocket notification sent to user ${userId} for shipment ${shipment_id}`);
      }
       
      // Return success response with the label URL and tracking number
      return res.status(200).json({
        success: true,
        tracking_number: trackingNumber,
        label_url: labelUrl
      });
     
    } catch (error) {
      console.error('SQL update label error:', error);
      return res.status(500).json({ error: 'Failed to update label in database' });
    }
  } catch (error) {
    console.error('Error updating the shipping label:', error);
    return res.status(500).json({ error: 'Failed to process shipping label' });
  }
});
// //Fetch rate from GLS api
// router.post('/get-gls-rate', async (req, res) => {
//   try {
//     const base64Credentials = Buffer.from(process.env.GLS_CREDENTIALS).toString('base64');
//     const url = 'https://smart4i.gls-canada.com/v1/rate?rateType=NEG';

//     const response = await axios.post(url, req.body, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Basic ${base64Credentials}`,
//       },
//     });
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error fetching rate:', error);
//     res.status(500).json({ error: 'Failed to fetch rate from GLS API' });
//   }
// });
// //Create Shipment Gls api
// router.post('/create-gls-shipment', async (req, res) => {
//   try {
//     const base64Credentials = Buffer.from(process.env.GLS_CREDENTIALS).toString('base64');
//     const url = 'https://smart4i.gls-canada.com/v1/shipment';

//     const response = await axios.post(url, req.body, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Basic ${base64Credentials}`,
//       },
//     });
//     res.json(response.data);
//   } catch (error)
//   {
//     console.error("Error Creating Gls Shipment.", error);
//     res.status(500).json({ error: 'Failed to create shipment from GLS API' });
//   }

// })
// //Fetch label from Gls api
// router.get('/get-gls-label/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res.status(400).json({ error: 'Label ID is required' });
//     }

//     const base64Credentials = Buffer.from(process.env.GLS_CREDENTIALS).toString('base64');
//     const url = `https://smart4i.gls-canada.com/v1/shipment/label/${id}?idType=id&labelType=FourByFive&rotation=Default&mediaType=ThermalTransfert&zplSettings=Server&ZplEnableCutter=True`;

//     const response = await axios.get(url, {
//       headers: {
//         'Authorization': `Basic ${base64Credentials}`,
//         'Accept': 'application/pdf',
//         'Content-Type': 'application/pdf',
//       },
//       responseType: 'arraybuffer',  // Get response as arraybuffer (to handle binary data)
//     });
//     if (response.data.length === 0) {
//       return res.status(500).json({ error: 'Received empty data from GLS API' });
//     }
//     res.set({
//       'Content-Type': 'application/pdf', 
//       'Content-Disposition': response.headers['content-disposition'],
//     });
//     res.send(response.data);
//   } catch (error) {
//     console.error('Error fetching label:', error);
//     res.status(500).json({ error: 'Failed to fetch label from GLS API' });
//   }
// });


module.exports = router;
