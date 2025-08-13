const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const sql = require('mssql');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a 6-digit verification code
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000);

// Setup Nodemailer Transporter for GoDaddy/Outlook
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // For Outlook/Microsoft 365
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // Should be support@parcelpilot.ca
    pass: process.env.EMAIL_PASS, // Your email password
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Only use in development; remove in production
  }
});

// Register Route with Email Verification
router.post("/register", async (req, res) => {
  const { firstName, email, password } = req.body;

  try {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    // Send email with the verification code
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Your verification code is: ${verificationCode}`,
    });
    
    // Store user details in the database
    await pool
      .request()
      .input("firstName", sql.VarChar(50), firstName)
      .input("email", sql.VarChar(50), email)
      .input("password", sql.VarChar(100), hashedPassword)
      .input("verificationToken", sql.Int, verificationCode)
      .input("isVerified", sql.Bit, 0)
      .query(
        "INSERT INTO Users (firstName, email, password, verificationToken, isVerified) VALUES (@firstName, @email, @password, @verificationToken, @isVerified)"
      );
    res.status(201).json({ message: "User registered. Check your email for the verification code." });
  } catch (error) {
    console.error("SQL error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
});
//Verify email route
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .query("SELECT verificationToken, isVerified FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.recordset[0];

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    if (user.verificationToken.trim() !== code.trim()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user as verified
    await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .query("UPDATE Users SET isVerified = 1, verificationToken = NULL WHERE email = @email");

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
});
//resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  const newCode = generateVerificationCode();

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update verification code
    await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .input("verificationToken", sql.Int, newCode)
      .query("UPDATE Users SET verificationToken = @verificationToken WHERE email = @email");

    // Send new code via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New Verification Code",
      text: `Your new verification code is: ${newCode}`,
    });

    res.json({ message: "A new verification code has been sent!" });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ message: "Failed to resend code" });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('email', sql.VarChar(50), email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = result.recordset[0];

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '5m' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in prod
      sameSite: 'lax', // Or 'none' if you embed it in Shopify iframe (see note below)
      maxAge: 5 * 60 * 1000  // 3 hours
    });

    res.json({ message: 'Login successful', token });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});
//Logout route
router.post('/logout', (req, res) => {
  try {
    // Destroy session if it exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: 'Error logging out' });
        }
        
        // Clear the session cookie
        res.clearCookie('sessionId');
        
        // Clear the auth token cookie
        res.clearCookie('authToken');
        
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      // No session to destroy, just clear cookies
      res.clearCookie('sessionId');
      res.clearCookie('authToken');
      res.json({ message: 'Logged out successfully' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});
// Password reset request endpoint
router.post("/reset-password-request", async (req, res) => {
  const { email } = req.body;

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.recordset[0];

    // Generate a unique token (using crypto for simplicity)
    const token = crypto.randomBytes(20).toString('hex');

    // Save the token and set an expiration time (1 hour)
    await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .input("resetPassToken", sql.VarChar(255), token)
      .query("UPDATE Users SET resetPassToken = @resetPassToken, resetPassTokenExpiry = DATEADD(HOUR, 1, GETDATE()) WHERE email = @email");

      const resetLink = `${process.env.REACT_APP_FRONTEND_URL}/reset-password?token=${token}`;


    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});
//Password reset endpoint
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("resetPassToken", sql.VarChar(255), token)
      .query("SELECT * FROM Users WHERE resetPassToken = @resetPassToken");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = result.recordset[0];

    // Check if token is expired
    if (new Date() > user.resetPassTokenExpiry) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Hash the new password (use bcrypt or another hashing method)
    const hashedPassword = await bcrypt.hash(password, 10); // Implement hashPassword

    // Update password in the database and clear the reset token
    await pool
      .request()
      .input("email", sql.VarChar(50), user.email)
      .input("password", sql.VarChar(255), hashedPassword)
      .query("UPDATE Users SET password = @password, resetPassToken = NULL, resetPassTokenExpiry = NULL WHERE email = @email");

    res.json({ message: "Password successfully reset. You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});


  module.exports = router;