const express = require('express');
const axios = require('axios');
const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');
const {generatePdfLink} = require("../functions/generateLabel.js");
const { getPool } = require('../db');
const sql = require('mssql');
const { fulfillShopifyOrder } = require('../../src/functions/fulfillShopifyOrder.js');
const {capturePayment} = require('../../src/functions/payment.js');

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

// On any label failure
const refundUserBalance = async (balance_deduct_amount, auth_token) => {
    try {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/payment/balance/add`,
          { amount: balance_deduct_amount },
          { headers: { Authorization: `Bearer ${auth_token}` } }
        );
        console.log(`💰 Refunded ${balance_deduct_amount} to user balance`);
    } catch (refundError) {
      console.error('Failed to refund balance:', refundError.message);
    }
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
  const { shipment_id, documentSize, payment_id } = req.query;
  try {
     // Only capture payment if payment_id is a real value
    if (payment_id) {
      // Skip dummy placeholders like 'BALANCE_ONLY'
      if (payment_id !== 'BALANCE_ONLY') {
        const isCaptured = await capturePayment(payment_id);
        if (!isCaptured) {
          console.error('Payment capture failed for payment ID:', payment_id);
          return res.status(402).json({ error: 'Payment capture failed. Please contact support.' });
        }
      }
    }
    // Fetch the label
    const url = `https://secureship.ca/ship/api/v1/carriers/download/documents/${shipment_id}`;
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': process.env.SS_KEY },
      params: { documentSize },
      responseType: 'arraybuffer'
    });

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

router.get('/download-label', async (req, res) => {
  console.log("Query Params:", req.query);
 
  try {
    const { shipment_id, format, label, commercial_invoice, packing_slip, shopify_order_id, shopify_line_item_id, auth_token, courier_name, payment_id, balance_deduct_amount } = req.query;
    const url = `https://public-api.easyship.com/2024-09/shipments/${shipment_id}`;
   
    // IMPROVED POLLING CONFIGURATION WITH EXPLICIT TIMEOUT HANDLING
    const TOTAL_TIMEOUT_MS = 240000; // 4 minutes total 
    const startTime = Date.now();
    let attempts = 0;
    let success = false;
    let response;
    let timeoutReached = false; // Add explicit timeout flag
    
    console.log(`Starting polling for shipment ${shipment_id} with ${TOTAL_TIMEOUT_MS/1000}s total timeout`);
   
    // Simplified polling: 5s for first 30s, then 15s after that
    const getWaitTime = (attemptNumber) => {
      if (attemptNumber <= 6) return 5000;       // First 30 seconds: check every 5s (6 attempts)
      return 15000;                              // After that: check every 15s
    };
   
    while (!success && !timeoutReached) {
      attempts++;
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      
      // Check timeout at the start of each iteration
      if ((Date.now() - startTime) >= TOTAL_TIMEOUT_MS) {
        console.log(`⏰ Total timeout reached before attempt ${attempts}`);
        timeoutReached = true;
        break;
      }
      
      try {
        console.log(`Polling attempt ${attempts} (${elapsedTime}s elapsed)`);
        
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
          },
          timeout: 15000 // 15 second timeout per request
        });
       
        // Check if the response has the required data
        if (response.data?.shipment?.trackings?.[0]?.tracking_number &&
            response.data?.shipment?.shipping_documents?.[0]?.base64_encoded_strings?.[0]) {
          success = true;
          console.log(`✅ Label data received after ${elapsedTime}s (${attempts} attempts)`);
          break; // Explicit break on success
        } else {
          // Calculate wait time for next attempt
          const waitTime = getWaitTime(attempts);
          const remainingTime = TOTAL_TIMEOUT_MS - (Date.now() - startTime);
          
          // More conservative timeout check - ensure we have enough time for wait + next request
          const minimumTimeNeeded = waitTime + 20000; // Wait time + buffer for next request
          
          if (remainingTime > minimumTimeNeeded) {
            console.log(`⏳ Label not ready, waiting ${waitTime/1000}s before next attempt (${Math.round(remainingTime/1000)}s remaining)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.log(`⏰ Insufficient time remaining (${Math.round(remainingTime/1000)}s) for another cycle`);
            timeoutReached = true;
            break;
          }
        }
      } catch (error) {
        const waitTime = getWaitTime(attempts);
        const remainingTime = TOTAL_TIMEOUT_MS - (Date.now() - startTime);
        const minimumTimeNeeded = waitTime + 20000;
        
        console.error(`❌ Polling attempt ${attempts} failed:`, error.message);
        
        if (remainingTime > minimumTimeNeeded) {
          console.log(`Retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.log(`⏰ Insufficient time remaining for retry, stopping attempts`);
          timeoutReached = true;
          break;
        }
      }
    }
   
    // Final timeout check with explicit flags
    const totalElapsed = Math.round((Date.now() - startTime) / 1000);
    
    if (!success) {
      console.error(`❌ Polling completed unsuccessfully after ${totalElapsed}s (${attempts} attempts). Success: ${success}, TimeoutReached: ${timeoutReached}`);
      
      // Refund balance if it was used
      if (balance_deduct_amount > 0) {
        await refundUserBalance(balance_deduct_amount, auth_token);
      }
      
      try {
        const pool = getPool();
        const updateResult = await pool.request()
          .input('shipment_id', sql.NVarChar(255), shipment_id)
          .input('status', sql.VarChar(20), "failed")
          .query(`
            UPDATE Labels
            SET status = @status
            WHERE shipment_id = @shipment_id
          `);
        
        console.log(`Updated label status to 'failed' for shipment_id: ${shipment_id}`);
        
      } catch (error) {
        console.error('SQL update label error:', error);
      }
      
      return res.status(408).json({
        error: 'Timeout waiting for label data.',
        elapsed_time: `${totalElapsed}s`,
        attempts: attempts
      });
    }

    // Proceed if successfully fetched label
    // Capture the payment
    // Only capture payment if payment_id is a real value
    if (payment_id) {
      // Skip dummy placeholders like 'BALANCE_ONLY'
      if (payment_id !== 'BALANCE_ONLY') {
        const isCaptured = await capturePayment(payment_id);
        if (!isCaptured) {
          console.error('Payment capture failed for payment ID:', payment_id);
          return res.status(402).json({ error: 'Payment capture failed. Please contact support.' });
        }
      }
    }

    // Proceed with fulfillment and updating db once payment captured
    const trackingNumber = response.data.shipment.trackings[0].tracking_number;
    const labelBase64 = response.data.shipment.shipping_documents[0].base64_encoded_strings[0];
    const labelUrl = await generatePdfLink(labelBase64, trackingNumber);

    // Mark shopify order as fulfilled NOTE PROCEED WITH CREATING LABEL EVEN IF THIS FAILS
    if (shopify_order_id) {
      try {
        await fulfillShopifyOrder(shopify_order_id, shopify_line_item_id, trackingNumber, courier_name, auth_token);
        console.log('Shopify order fulfilled successfully');
      } catch (error) {
        console.error('Failed to fulfill Shopify order:', error);
        // Continue with label processing even if Shopify fails
      }
    }
    
    // Update DB label with the tracking number and amazon aws pdf link url
    try {
      console.log(`🗄️ Updating database for shipment ${shipment_id}`);
      
      const pool = getPool();
      const updateResult = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('tracking_number', sql.NVarChar(255), trackingNumber)
        .input('pdf_url', sql.NVarChar(4000), labelUrl) // Changed from sql.MAX
        .input('status', sql.VarChar(20), "ready")
        .query(`
          UPDATE Labels
          SET
            tracking_number = @tracking_number,
            pdf_url = @pdf_url,
            status = @status
          WHERE shipment_id = @shipment_id
        `);
      
      console.log(`Database update result: ${updateResult.rowsAffected[0]} rows affected`);
      
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
        };
        
        // Send the real-time update
        global.sendLabelUpdate(userId, {
          type: 'label_update',
          label: updatedLabel
        });
        
        console.log(`✅ WebSocket notification sent to user ${userId} for shipment ${shipment_id}`);
      }
       
      console.log(`✅ Label processing completed successfully for ${shipment_id} after ${totalElapsed}s`);
       
      // Return success response with the label URL and tracking number
      return res.status(200).json({
        success: true,
        tracking_number: trackingNumber,
        label_url: labelUrl,
        processing_time: `${totalElapsed}s`
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
