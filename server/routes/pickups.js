const express = require('express');
const axios = require('axios');

const router = express.Router();
const {authenticateToken} = require('../middleware/authenticateToken');

const { getPool } = require('../db');
const sql = require('mssql');

const { DateTime } = require('luxon');

//Make api call to eashship api and schedule pickup
router.post('/schedule-pickup', async (req, res) => {
  try {
    const {
      selected_date,
      selected_from_time,
      selected_to_time,
      courier_service_id,
      easyship_shipment_ids
    } = req.body;
     
    //testing
    console.log("Selected date: " + selected_date);
    console.log("Selected from time: " + selected_from_time);
    console.log("Selected to time: " + selected_to_time);
    const easyshipRequestData = {
      courier_service_id,
      selected_date,                 // e.g. "2025-06-20"
      selected_from_time,           // e.g. "14:00"
      selected_to_time,             // e.g. "18:00"
      easyship_shipment_ids
    };

    const url = 'https://public-api.easyship.com/2024-09/pickups';
    const response = await axios.post(url, easyshipRequestData, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `${process.env.ES_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ error: 'Failed to schedule pickup from the API' });
  }
});
//Make api call to GLS api and schedule pickup
router.post('/schedule-gls-pickup', async (req, res) => {
  try {
    const url = 'https://secureship.ca/ship/api/v1/pickups/schedule-pickup';
    const response = await axios.post(url, req.body, {
      headers: {
        'content-type': 'application/json',
        'X-API-KEY': `${process.env.SS_KEY}`
      }
    });
    console.log("gls schedule pickup response " + response.data);
    res.json(response.data);
  }catch(error){
    console.error('Error scheduling pickup:', error);
    res.status(500).json({ error: 'Failed to schedule pickup from the eashyship api' });
  }
});

//Retrieve pickup time slots
router.get('/get-time-slots', async (req, res) => {
  try {
     const { courier_service_id } = req.query; 

     if (!courier_service_id) {
       return res.status(400).json({ error: 'Missing courier_service_id' });
     }
     
    const url = `https://public-api.easyship.com/2024-09/courier_services/${courier_service_id}/pickup_slots`;
    const response = await axios.get(url, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `${process.env.ES_KEY}`
      }
    });
    res.json(response.data);
  }catch(error){
    console.error('Could not retrieve pickup times:', error);
    res.status(500).json({ error: 'Failed to retrieve pickup times' });
  }
});
//mark shipment status as scheduled in db
//mark shipment status as scheduled in db
router.post('/updatePickupDetails', authenticateToken, async (req, res) => {
  const { shipment_id, pickup_date, time_slot, pickup_id } = req.body;
  const userId = req.user.id;
  if (!shipment_id) {
       return res.status(400).json({ error: 'Missing shipment ID' });
  }
  try {
    //Update shipment status in Label DB table
      const pool = getPool();
      await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('user_id', sql.Int, userId)
        .input('pickup_date', sql.Date, pickup_date)
        .input('time_slot', sql.VarChar(20), time_slot)
        .input('pickup_id', sql.NVarChar(11), String(pickup_id))
        .query(`
          UPDATE Labels
          SET
              status = 'pickup_scheduled',
              pickup_date = @pickup_date,
              time_slot = @time_slot,
              pickup_id = @pickup_id
          WHERE shipment_id = @shipment_id
          AND user_id = @user_id
        `);
      
      // After updating the database, get the complete label details
      // to send WebSocket notification
      const labelResult = await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('user_id', sql.Int, userId)
        .query(`
          SELECT 
            shipment_id, 
            tracking_number, 
            pdf_url, 
            status, 
            recipient_name, 
            recipient_address, 
            courier_name, 
            courier_service_id,
            pickup_id,
            pickup_date,
            time_slot
          FROM Labels 
          WHERE shipment_id = @shipment_id 
          AND user_id = @user_id
        `);
      
      // If we found the label and the global WebSocket function exists
      if (labelResult.recordset.length > 0 && global.sendLabelUpdate) {
        const updatedLabel = labelResult.recordset[0];
        
        // Send the real-time update
        global.sendLabelUpdate(userId, {
          type: 'label_update',
          label: updatedLabel
        });
        
        console.log(`WebSocket notification sent to user ${userId} for scheduled pickup on shipment ${shipment_id}`);
      } else {
        console.log(`Either no label found or WebSocket function not available for shipment ${shipment_id}`);
      }
        
      // Send a success response after both operations succeed
    res.status(200).json({ message: 'Pickup status updated successfully!' });
  } catch(error) {
    console.error('Failed to update shipment status:', error);
    // Catch errors from both API request and database update
    res.status(500).json({ error: 'Failed to update shipment status' });
  }
});
//PickUp cancellation route
router.post('/cancelPickup', authenticateToken, async (req, res) => {
  const {pickup_id, shipment_id} = req.body;
  const userId = req.user.id;
 
  if (!pickup_id) {
    return res.status(400).json({ error: 'Invalid pickup ID' });
  }
  try {
        let url;
        let headers = {
          accept: 'application/json',
          'content-type': 'application/json',
        };
        let axiosMethod = 'post';
   
        if (shipment_id.startsWith('ESCA')) {
          url = `https://public-api.easyship.com/2024-09/pickups/${pickup_id}/cancel`;
          headers.authorization = `${process.env.ES_KEY}`;
        } else {
          const id = parseInt(pickup_id, 10);
          url = `https://secureship.ca/ship/api/v1/pickups/cancel/${id}`;
          headers['X-API-KEY'] = `${process.env.SS_KEY}`;
          axiosMethod = 'delete';
        }
   
        await axios({method: axiosMethod, url: url, headers: headers, data: {}});
     
     //update shipment status to cancelled pickup
    const pool = getPool();
    await pool.request()
      .input('shipment_id', sql.NVarChar(255), shipment_id)
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE Labels
        SET
            status = 'pickup_cancelled'
        WHERE shipment_id = @shipment_id
        AND user_id = @user_id
      `);
      
    // After updating the database, get the complete label details
    // to send WebSocket notification
    const labelResult = await pool.request()
      .input('shipment_id', sql.NVarChar(255), shipment_id)
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          shipment_id, 
          tracking_number, 
          pdf_url, 
          status, 
          recipient_name, 
          recipient_address, 
          courier_name, 
          courier_service_id,
          pickup_id,
          pickup_date,
          time_slot
        FROM Labels 
        WHERE shipment_id = @shipment_id 
        AND user_id = @user_id
      `);
    
    // If we found the label and the global WebSocket function exists
    if (labelResult.recordset.length > 0 && global.sendLabelUpdate) {
      const updatedLabel = labelResult.recordset[0];
      
      // Send the real-time update
      global.sendLabelUpdate(userId, {
        type: 'label_update',
        label: updatedLabel
      });
      
      console.log(`WebSocket notification sent to user ${userId} for cancelled pickup on shipment ${shipment_id}`);
    } else {
      console.log(`Either no label found or WebSocket function not available for shipment ${shipment_id}`);
    }
    
    res.status(200).json({ message: 'Pickup cancelled successfully!' });
  } catch(error) {
    console.error('Error cancelling pickup:', error);
    res.status(500).json({ error: 'Failed to cancel pickup' });
  }
});

module.exports = router;