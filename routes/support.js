const express = require('express');
const { getPool } = require('../db');
const sql = require('mssql');
const router = express.Router();
const nodemailer = require('nodemailer');
const authenticateToken = require('../middleware/authenticateToken');

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Support ticket submission endpoint
router.post("/submitTicket", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { title, message } = req.body;
 
    try {
      // Validate request
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      
      const pool = getPool();
      const result = await pool.request()
                .input("id", sql.Int, userId)
                .query("SELECT email, id, firstName FROM Users WHERE id = @id");
 
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const user = result.recordset[0];
      
      // Create email with better formatting
      const mailOptions = {
        from: process.env.EMAIL_USER, // This should be your service email
        to: process.env.SUPPORT_EMAIL,
        replyTo: user.email, // This ensures replies go to the user
        subject: `Support Request: ${title}`,
        html: `
          <h2>Support Request from User</h2>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>FirstName:</strong> ${user.firstName || 'N/A'}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Subject:</strong> ${title}</p>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      res.json({ message: "Support ticket has been successfully submitted." });
    } catch (error) {
      console.error("Support ticket submission error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

module.exports = router;