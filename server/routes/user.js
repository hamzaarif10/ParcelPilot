const express = require('express');
const { getPool } = require('../db');
const sql = require('mssql');
const { authenticateToken } = require('../middleware/authenticateToken');
const axios = require('axios');
const router = express.Router();
const { PDFDocument } = require('pdf-lib');

//Submit label to database route
router.post('/submitLabel', authenticateToken, async (req, res) => {
  const { shipment_id, recipientName, recipientAddress, courierName, courierServiceId, trackingNumber, pdf_url, status} = req.body;
  const userId = req.user.id;

  try {

    const pool = getPool();
    const transaction = pool.transaction();

    await transaction.begin();

    // Insert into Labels table
    await transaction.request()
      .input('user_id', sql.Int, userId)
      .input('shipment_id', sql.NVarChar(255), shipment_id)
      .input('recipient_name', sql.NVarChar(255), recipientName)
      .input('recipient_address', sql.NVarChar(255), recipientAddress)
      .input('courier_name', sql.NVarChar(50), courierName)
      .input('courier_service_id', sql.NVarChar(255), courierServiceId)
      .input('tracking_number', sql.NVarChar(255), trackingNumber)
      .input('pdf_url', sql.NVarChar(sql.MAX), pdf_url)
      .input('status', sql.VarChar(20), status)
      .query(`
        INSERT INTO Labels (
          user_id, shipment_id, recipient_name, 
          recipient_address, courier_name, courier_service_id, 
          tracking_number, pdf_url, status
        ) 
        VALUES (
          @user_id, @shipment_id, @recipient_name, 
          @recipient_address, @courier_name, @courier_service_id, 
          @tracking_number, @pdf_url, @status
        )
      `);

    // Increment labels printed count for the specific user
    await transaction.request()
      .input('id', sql.Int, userId)
      .query(`
        UPDATE Users
        SET labels_printed = labels_printed + 1
        WHERE id = @id
      `);

    await transaction.commit();

    res.status(201).json({ message: 'Label submitted successfully' });
  } catch (error) {
    console.error('SQL error:', error);

    // Rollback transaction on error
    if (transaction) await transaction.rollback();

    res.status(500).json({ message: 'Failed to submit label' });
  }
});

// Update user address route
router.post('/updateAddress', authenticateToken, async (req, res) => {
  const {userAddress, userAddress2, userProvince, userCity, userPostalCode, userCompanyName, userPhone } = req.body;
  const userId = req.user.id;
  try {
    const pool = getPool();
    await pool.request()
      .input('userAddress', sql.VarChar(255), userAddress)
      .input('userAddress2', sql.VarChar(50), userAddress2)
      .input('userProvince', sql.VarChar(2), userProvince)
      .input('userCity', sql.VarChar(100), userCity) 
      .input('userPostalCode', sql.VarChar(10), userPostalCode)
      .input('userCompanyName', sql.VarChar(255), userCompanyName)
      .input('userPhone', sql.VarChar(20), userPhone)
      .input('id', sql.Int, userId) // Ensure userId is passed as a parameter
      .query(`
        UPDATE Users
        SET 
            userAddress = @userAddress,
            userAddress2 = @userAddress2,
            userProvince = @userProvince,
            userCity = @userCity,
            userPostalCode = @userPostalCode,
            userCompanyName = @userCompanyName,
            userPhone = @userPhone
        WHERE id = @id
      `);
    res.status(201).json({ message: 'User Address Updated Successfully!' });
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).json({ message: 'Failed to update address.' });
  }
});
// Route to update the `isFirstLogon` field
router.post("/completeFirstLogon", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` is populated by `authenticateToken`
    const pool = getPool();
    // Update `isFirstLogon` to false
    const result = await pool.request()
      .input('id', sql.Int, userId) // Specify the userId parameter with its type
      .query("UPDATE Users SET isFirstLogin = 0 WHERE id = @id"); // Use @id as the parameter

    // Check if the update was successful
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found or already updated." });
    }

    res.status(200).json({ message: "First logon process completed successfully!" });
  } catch (error) {
    console.error("Error updating first logon status:", error.message);
    res.status(500).json({ message: "Failed to update first logon status.", error: error.message });
  }
});
// Route to check if it's the user's first logon
router.get("/isFirstLogon", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    // Query to check the `isFirstLogin` status
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT isFirstLogin FROM Users WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    const isFirstLogin = result.recordset[0].isFirstLogin;

    // Respond with the `isFirstLogin` status
    res.status(200).json({ isFirstLogin });
  } catch (error) {
    console.error("Error checking first logon:", error.message);
    res.status(500).json({ message: "Failed to check first logon.", error: error.message });
  }
});
//Get the user address on file and display it on create shipment page
router.get("/getUserAddress", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    // Query to check the `isFirstLogin` status
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT email, userAddress, userAddress2, userProvince, userCity, userPostalCode, userCompanyName, userPhone FROM Users WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "address not found." });
    }
    const userAddressDetails = result.recordset[0];
    // Respond with the `isFirstLogin` status
    res.status(200).json({ userAddressDetails });
  } catch (error) {
    console.error("Error getting user address:", error.message);
    res.status(500).json({ message: "Failed to fetch address.", error: error.message });
  }
});
// Get shipping labels for view labels route with pagination
router.get("/getShippingLabels", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const limit = parseInt(req.query.limit) || 10; // Default to 10 labels per page if no limit is specified
    const offset = (page - 1) * limit;

    const pool = getPool();

    // Get the total count of labels (for pagination)
    const countResult = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT COUNT(*) AS totalCount FROM Labels WHERE user_id = @user_id');
    const totalCount = countResult.recordset[0].totalCount;

    // Fetch the labels for the current page
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT shipment_id, recipient_name, recipient_address, courier_name, courier_service_id, tracking_number, pdf_url, status, secure_ship_tracking_number, pickup_date, time_slot, pickup_id, date_created 
        FROM Labels 
        WHERE user_id = @user_id
        ORDER BY label_id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No labels found." });
    }

    const shippingLabelDetails = result.recordset;

    // Send the paginated results and the total count to the frontend
    res.status(200).json({ shippingLabelDetails, totalCount });
  } catch (error) {
    console.error("Error getting shipping label details:", error.message);
    res.status(500).json({ message: "Failed to fetch shipping label details.", error: error.message });
  }
});

//Fetch user Account details
router.get("/getAccountDetails", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT firstName, email, userAddress, userProvince, userCity, userPostalCode, userCompanyName, userPhone FROM Users WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No account details found." });
    }
    const userAccountDetails = result.recordset[0];
    res.status(200).json({ userAccountDetails });
  } catch (error) {
    console.error("Error getting user account details:", error.message);
    res.status(500).json({ message: "Failed to fetch account details.", error: error.message });
  }
});
//HAndle shipment cancellation
router.post('/cancelShipment', authenticateToken, async (req, res) => {
  const { shipment_id } = req.body;
  const userId = req.user.id;

  if (!shipment_id) {
       return res.status(400).json({ error: 'Missing shipment ID' });
  }
  try { 
    let url;
    let headers = {
      accept: 'application/json',
      'content-type': 'application/json',
    };
    let axiosMethod = 'post';

    if (shipment_id.startsWith('ESCA')) {
      url = `https://public-api.easyship.com/2024-09/shipments/${shipment_id}/cancel`;
      headers.authorization = `${process.env.ES_KEY}`;
    } else {
      url = `https://secureship.ca/ship/api/v1/history/${shipment_id}`;
      headers['X-API-KEY'] = `${process.env.SS_KEY}`;
      axiosMethod = 'delete';
    }

    const response = await axios({method: axiosMethod, url: url, headers: headers, data: {}});

    //Update shipment status in Label DB table
      const pool = getPool();
      await pool.request()
        .input('shipment_id', sql.NVarChar(255), shipment_id)
        .input('user_id', sql.Int, userId)
        .query(`
          UPDATE Labels
          SET 
              status = 'cancelled'
          WHERE shipment_id = @shipment_id
          AND user_id = @user_id
        `);
      // Send a success response after both operations succeed
    res.status(200).json({ message: 'Shipment canceled and status updated successfully!' });
  }catch(error){
    console.error('Error processing cancellation:', error);
    // Catch errors from both API request and database update
    res.status(500).json({ error: 'Failed to cancel shipment or update shipment status' });
  }
});
//get number of labels printed
router.get("/getLabelsPrinted", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT labels_printed FROM Users WHERE id = @id');

      const labels_printed = result.recordset[0]?.labels_printed; 
    res.status(200).json({ labels_printed });
  } catch (error) {
    console.error("Error getting labels printed number:", error.message);
    res.status(500).json({ message: "Failed to fetch labels printed number.", error: error.message });
  }
});
//fetch user postal code
router.get("/getSenderPostalCode", authenticateToken, async (req, res) => {
  try {
      const userId = req.user.id; // Extract from JWT token

      // Fetch from database
      const pool = getPool();
      const result = await pool.request()
          .input("id", sql.Int, userId)
          .query("SELECT userPostalCode FROM Users WHERE id = @id");

      if (result.recordset.length > 0) {
          res.json({postalCode: result.recordset[0].userPostalCode});
      } else {
          res.status(404).json({ message: "Postal code not found" });
      }
  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Server error" });
  }
});
//Submit transaction to the database
router.post("/submitTransaction", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { description, amount } = req.body; // Expect description & amount from the request body

  try {
    const pool = getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('referenceNumber', sql.UniqueIdentifier, crypto.randomUUID()) // Generate a unique reference number
      .input('description', sql.VarChar(255), description)
      .input('amount', sql.Decimal(10,2), amount)
      .input('createdAt', sql.Date, new Date().toISOString().split('T')[0]) // Store only the date
      .query(`
        INSERT INTO transactions (user_id, reference_number, description, amount, created_at)
        VALUES (@userId, @referenceNumber, @description, @amount, @createdAt)
      `);

    res.status(201).json({ message: 'Transaction submitted successfully!' });
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).json({ message: 'Failed to submit transaction.' });
  }
});
// Retrieve transactions with pagination
router.get("/getTransactions", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = getPool();

    // Fetch the transactions for the current page
    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .input("limit", sql.Int, limit)
      .input("offset", sql.Int, offset)
      .query(`
        SELECT reference_number, description, amount, created_at
        FROM Transactions
        WHERE user_id = @userId
        ORDER BY created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    // Fetch the total count of transactions for pagination
    const totalCountResult = await pool.request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS totalCount
        FROM Transactions
        WHERE user_id = @userId
      `);

    const totalCount = totalCountResult.recordset[0].totalCount;
    const totalPages = Math.ceil(totalCount / limit); // Calculate total pages

    res.status(200).json({
      transactions: result.recordset,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve transactions." });
  }
});
// Bulk print labels route
router.post("/bulkPrintLabels", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const { shipment_ids } = req.body;

    if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
      return res.status(400).json({ error: "No shipment IDs provided" });
    }

    const pool = getPool();

    // Create parameterized query for SQL injection protection
    const placeholders = shipment_ids.map((_, index) => `@shipment_id${index}`).join(',');
    
    // Build the query
    let query = `
      SELECT shipment_id, pdf_url, recipient_name, tracking_number 
      FROM Labels 
      WHERE user_id = @user_id 
      AND shipment_id IN (${placeholders})
      AND pdf_url IS NOT NULL
    `;

    // Create the request and add parameters
    const request = pool.request();
    request.input('user_id', sql.Int, userId);
    
    // Add each shipment_id as a parameter
    shipment_ids.forEach((id, index) => {
      request.input(`shipment_id${index}`, sql.NVarChar, id);
    });

    // Execute the query
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No labels found for the specified shipment IDs" });
    }

    const labels = result.recordset;

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Download and merge each PDF
    for (const label of labels) {
      try {
        console.log(`Processing PDF for shipment ${label.shipment_id}`);
        
        const response = await axios.get(label.pdf_url, { 
          responseType: 'arraybuffer',
          timeout: 30000 // 30 second timeout
        });
        
        const pdfToMerge = await PDFDocument.load(response.data);
        const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        
        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (pdfError) {
        console.error(`Failed to process PDF for shipment ${label.shipment_id}:`, pdfError.message);
        // Continue with other PDFs even if one fails
      }
    }

    // Check if we have any pages in the merged PDF
    if (mergedPdf.getPageCount() === 0) {
      return res.status(500).json({ error: "Failed to merge any PDFs" });
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();

    // Send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=shipping-labels.pdf');
    res.setHeader('Content-Length', mergedPdfBytes.length);
    res.send(Buffer.from(mergedPdfBytes));

    console.log(`Successfully merged ${labels.length} PDFs for user ${userId}`);
    
  } catch (error) {
    console.error("Error merging PDFs:", error);
    res.status(500).json({ error: "Failed to merge PDFs", details: error.message });
  }
});
module.exports = router;
