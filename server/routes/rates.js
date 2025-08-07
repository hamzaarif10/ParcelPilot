const express = require('express');
const axios = require('axios');
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');
const {generatePdfLink} = require("../functions/generateLabel.js");
const { getPool } = require('../db');
const sql = require('mssql');
const { fulfillShopifyOrder } = require('../../src/functions/fulfillShopifyOrder.js');

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
    if (!req.body?.destination_address?.postal_code) { 
    console.log('[ACCESS LOG] Rate requested with missing postal code'); 
    return res.status(400).json({ error: 'Destination postal code is required' }); 
  }
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
// Debug version with enhanced logging and error handling
router.get('/download-label', async (req, res) => {
  console.log("Query Params:", req.query);
 
  try {
    const { shipment_id, format, label, commercial_invoice, packing_slip, shopify_order_id, shopify_line_item_id, auth_token } = req.query;
    const url = `https://public-api.easyship.com/2024-09/shipments/${shipment_id}`;
   
    // [Your existing polling logic here - unchanged]
    const MAX_ATTEMPTS = 10;
    let attempts = 0;
    let success = false;
    let response;
   
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
       
        if (response.data?.shipment?.trackings?.[0]?.tracking_number &&
            response.data?.shipment?.shipping_documents?.[0]?.base64_encoded_strings?.[0]) {
          success = true;
        } else {
          attempts++;
          if (attempts < MAX_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error.message);
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
   
    if (!success) {
      return res.status(408).json({
        error: 'Timeout waiting for label data from EasyShip API'
      });
    }
   
    const trackingNumber = response.data.shipment.trackings[0].tracking_number;
    const labelBase64 = response.data.shipment.shipping_documents[0].base64_encoded_strings[0];
    const labelUrl = await generatePdfLink(labelBase64, trackingNumber);

    console.log(`Processing label update for shipment_id: ${shipment_id}`);
    console.log(`Tracking number: ${trackingNumber}`);
    console.log(`Label URL: ${labelUrl}`);

    // Shopify fulfillment logic (unchanged)
    if (shopify_order_id) {
      try {
        const courierNameResult = await pool.request()
          .input('shipment_id', sql.NVarChar(255), shipment_id)
          .query(`
            SELECT courier_name
            FROM Labels
            WHERE shipment_id = @shipment_id
          `);

        const dbCourierName = courierNameResult.recordset[0]?.courier_name || 'Unknown Courier';
        await fulfillShopifyOrder(shopify_order_id, shopify_line_item_id, trackingNumber, dbCourierName, auth_token);
        console.log('Shopify order fulfilled successfully');
      } catch (error) {
        console.error('Failed to fulfill Shopify order:', error);
      }
    }

    // ENHANCED DATABASE UPDATE SECTION
    try {
      console.log('=== Starting database update ===');
      
      // Get pool connection
      const pool = getPool();
      console.log('Pool connection obtained');
      
      // First, check if the record exists
      console.log(`Checking if record exists for shipment_id: ${shipment_id}`);
      const existingRecord = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .query(`
          SELECT shipment_id, status, tracking_number, pdf_url
          FROM Labels
          WHERE shipment_id = @shipment_id
        `);
      
      console.log(`Found ${existingRecord.recordset.length} existing records`);
      if (existingRecord.recordset.length > 0) {
        console.log('Existing record:', existingRecord.recordset[0]);
      }
      
      // Perform the update with detailed logging
      console.log('Executing UPDATE query...');
      const updateResult = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('tracking_number', sql.NVarChar(255), trackingNumber)
        .input('pdf_url', sql.NVarChar(4000), labelUrl) // Changed from sql.MAX to specific length
        .input('status', sql.VarChar(20), "ready")
        .query(`
          UPDATE Labels
          SET
            tracking_number = @tracking_number,
            pdf_url = @pdf_url,
            status = @status
          WHERE shipment_id = @shipment_id
        `);
      
      console.log(`Update result - rows affected: ${updateResult.rowsAffected[0]}`);
      
      // Verify the update actually happened
      const verifyUpdate = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .query(`
          SELECT shipment_id, status, tracking_number, pdf_url
          FROM Labels
          WHERE shipment_id = @shipment_id
        `);
      
      console.log('Record after update:', verifyUpdate.recordset[0]);
      
      // Check if update actually affected any rows
      if (updateResult.rowsAffected[0] === 0) {
        console.error(`⚠️  NO ROWS WERE UPDATED! Shipment ID ${shipment_id} might not exist in the database.`);
        return res.status(404).json({ 
          error: 'Shipment not found in database',
          shipment_id: shipment_id
        });
      }
      
      // Get user data for WebSocket notification
      const userResult = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .query(`
          SELECT user_id, recipient_name, recipient_address, courier_name, courier_service_id 
          FROM Labels 
          WHERE shipment_id = @shipment_id
        `);
      
      // WebSocket notification
      if (userResult.recordset.length > 0 && global.sendLabelUpdate) {
        const userId = userResult.recordset[0].user_id;
        
        const updatedLabel = {
          shipment_id: shipment_id,
          tracking_number: trackingNumber,
          pdf_url: labelUrl,
          status: "ready",
          recipient_name: userResult.recordset[0].recipient_name,
          recipient_address: userResult.recordset[0].recipient_address,
          courier_name: userResult.recordset[0].courier_name,
          courier_service_id: userResult.recordset[0].courier_service_id
        };
        
        global.sendLabelUpdate(userId, {
          type: 'label_update',
          label: updatedLabel
        });
        
        console.log(`✅ WebSocket notification sent to user ${userId} for shipment ${shipment_id}`);
      }
       
      console.log('=== Database update completed successfully ===');
      
      return res.status(200).json({
        success: true,
        tracking_number: trackingNumber,
        label_url: labelUrl
      });
     
    } catch (error) {
      console.error('❌ SQL update label error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        number: error.number,
        state: error.state,
        class: error.class,
        serverName: error.serverName,
        procName: error.procName,
        lineNumber: error.lineNumber
      });
      return res.status(500).json({ 
        error: 'Failed to update label in database',
        details: error.message
      });
    }
  } catch (error) {
    console.error('❌ Error updating the shipping label:', error);
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
