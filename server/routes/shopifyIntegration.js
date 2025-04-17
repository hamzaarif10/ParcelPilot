const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');
const sql = require('mssql');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32 characters (AES-256)
const IV_LENGTH = 16;

// Encrypt a token
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt a token
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Verifying the HMAC
function verifyHmac(queryParams) {
  const { hmac, ...params } = queryParams;
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');
  return hmac === calculatedHmac;
}

// Save Shopify domain
router.post('/save-shopify-domain', authenticateToken, async (req, res) => {
  const { shopifyDomain } = req.body;

  if (!shopifyDomain) {
    return res.status(400).send("Shopify domain is required");
  }

  try {
    const pool = getPool();
    await pool.request()
      .input('shopify_domain', sql.VarChar(255), shopifyDomain)
      .input('id', sql.Int, req.user.id)
      .query(`
        UPDATE Users 
        SET shopify_domain = @shopify_domain
        WHERE id = @id
      `);

    console.log(`[ACCESS LOG] User ${req.user.id} set shopify_domain: ${shopifyDomain}`);
    res.status(200).send("Shopify domain saved successfully");
  } catch (error) {
    console.error("Error saving Shopify domain:", error);
    res.status(500).send("Error saving Shopify domain");
  }
});

// Get Shopify auth details
router.get('/get-shopify-auth-details', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT shopify_domain, shopify_access_token, shopify_token_last_used 
        FROM Users 
        WHERE id = @id
      `);

    if (result.recordset.length > 0 && result.recordset[0].shopify_access_token) {
      const encryptedToken = result.recordset[0].shopify_access_token;
      const decryptedToken = decrypt(encryptedToken);

      // Update last used timestamp (for retention tracking)
      await pool.request()
        .input('id', sql.Int, req.user.id)
        .query(`
          UPDATE Users
          SET shopify_token_last_used = GETDATE()
          WHERE id = @id
        `);

      console.log(`[ACCESS LOG] Shopify token accessed by user ${req.user.id}`);
      res.json({
        shopify_access_token: decryptedToken,
        shopify_domain: result.recordset[0].shopify_domain
      });
    } else {
      res.json({ shopify_access_token: null });
    }
  } catch (error) {
    console.error('Error fetching Shopify access token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get OAuth URL
router.get('/auth', (req, res) => {
  const shopifyDomain = req.query.shop;

  const oauthUrl = `https://${shopifyDomain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.REACT_APP_SHOPIFY_SCOPE}&redirect_uri=${process.env.REACT_APP_SHOPIFY_REDIRECT_URI}`;
  res.json({ oauthUrl });
});

// Shopify callback route
router.get('/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  console.log("🔁 Incoming OAuth Callback:", req.query); // ✅ Log query params

  // HMAC Check
  if (!verifyHmac(req.query)) {
    console.error('❌ HMAC verification failed');
    return res.status(400).send('Invalid request');
  }

  // CSRF State check (optional if not using real state validation yet)
  if (state !== req.query.state) {
    console.error('❌ State parameter mismatch');
    return res.status(403).send('Request origin cannot be verified');
  }

  try {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const params = {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code,
    };

    const response = await axios.post(tokenUrl, params);
    console.log("✅ Shopify Token Exchange Response:", response.data);

    const { access_token } = response.data;
    if (!access_token) {
      console.error('❌ No access token in response');
      return res.status(500).send('Error receiving access token');
    }

    // Encrypt token
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.TOKEN_ENCRYPTION_KEY),
      iv
    );
    let encrypted = cipher.update(access_token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedToken = iv.toString('hex') + ':' + encrypted.toString('hex');

    console.log("🔐 Encrypted Token:", encryptedToken.substring(0, 30) + "...");

    // Store token in DB
    const pool = getPool();
    await pool.request()
      .input('shopify_access_token', sql.NVarChar(sql.MAX), encryptedToken)
      .input('shopify_domain', sql.NVarChar(255), shop)
      .query(`
        UPDATE Users 
        SET shopify_access_token = @shopify_access_token, shopify_token_last_used = GETDATE()
        WHERE shopify_domain = @shopify_domain
      `);

    console.log(`✅ Token stored for ${shop}`);
    res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/integration`);
  } catch (error) {
    console.error('❌ Error during OAuth:', error.response?.data || error.message || error);
    res.status(500).send('Error during OAuth');
  }
});


module.exports = router;