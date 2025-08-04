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

// REMOVED: save-shopify-domain endpoint - no longer needed

// Check if shop has valid Shopify OAuth
router.post('/check-shopify-oauth', authenticateToken, async (req, res) => {
  const { shop } = req.body;
  
  if (!shop) {
    return res.json({ isAuthenticated: false });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('shopify_domain', sql.NVarChar(255), shop)
      .input('user_id', sql.Int, req.user.id)
      .query(`
        SELECT shopify_access_token 
        FROM Users 
        WHERE shopify_domain = @shopify_domain 
        AND id = @user_id 
        AND shopify_access_token IS NOT NULL
      `);

    const isAuthenticated = result.recordset.length > 0;
    console.log(`[SHOPIFY CHECK] Shop ${shop} OAuth status for user ${req.user.id}: ${isAuthenticated}`);
    
    res.json({ isAuthenticated });
  } catch (error) {
    console.error('Error checking Shopify OAuth status:', error);
    res.json({ isAuthenticated: false });
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

// Get OAuth URL - Entry point from Shopify ONLY
router.get('/', async (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  // ALWAYS initiate OAuth when accessed from Shopify
  const backendUrl = process.env.BACKEND_URL || process.env.SERVER_URL || 'https://parcelpilot.onrender.com';
  const redirectUri = `${backendUrl}/auth/callback`;
  const scopes = process.env.REACT_APP_SHOPIFY_SCOPE || process.env.SHOPIFY_SCOPE;

  // Generate a unique state parameter and store it temporarily
  const state = crypto.randomBytes(16).toString('hex');
  
  // In production, you'd store this state in a session or temporary storage
  // For now, we'll include it in the OAuth URL
  const oauthUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;

  console.log(`[SHOPIFY AUTH] Starting OAuth for shop: ${shop}`);
  console.log(`[SHOPIFY AUTH] OAuth URL: ${oauthUrl}`);
  
  res.redirect(oauthUrl);
});

// Shopify callback route
router.get('/callback', async (req, res) => {
  const { shop, code, state, hmac, host } = req.query;

  console.log(`[SHOPIFY CALLBACK] Received callback for shop: ${shop}`);

  if (!verifyHmac(req.query)) {
    console.error('HMAC verification failed');
    return res.status(400).send('Invalid request');
  }

  // In production, verify the state parameter matches what was stored
  if (!state) {
    console.error('Missing state parameter');
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
    const { access_token } = response.data;

    if (!access_token) {
      console.error('No access token received from Shopify');
      return res.status(500).send('Error receiving access token');
    }

    // Encrypt and store the token
    const encryptedToken = encrypt(access_token);
    const pool = getPool();
    
    // First check if there's already a user with this shopify_domain
    const existingUser = await pool.request()
      .input('shopify_domain', sql.NVarChar(255), shop)
      .query(`
        SELECT id FROM Users WHERE shopify_domain = @shopify_domain
      `);

    if (existingUser.recordset.length > 0) {
      // Update existing user
      await pool.request()
        .input('shopify_access_token', sql.NVarChar(sql.MAX), encryptedToken)
        .input('shopify_domain', sql.NVarChar(255), shop)
        .query(`
          UPDATE Users 
          SET shopify_access_token = @shopify_access_token, 
              shopify_token_last_used = GETDATE()
          WHERE shopify_domain = @shopify_domain
        `);
    } else {
      // For new installations, we need to associate with a logged-in user
      // This will be handled in the verification page
      console.log(`[SHOPIFY AUTH] New shop ${shop} - will need user association`);
    }

    console.log(`[ACCESS LOG] Shopify token stored for domain ${shop}`);
    
    // Always redirect to verification page for proper user association
    const verifyUrl = `${process.env.REACT_APP_FRONTEND_URL}/shopify-verify?shop=${shop}&host=${host || ''}`;
    return res.redirect(verifyUrl);
    
  } catch (error) {
    console.error('Error during OAuth:', error);
    res.status(500).send('Error during OAuth');
  }
});

// New endpoint to associate Shopify shop with logged-in user
router.post('/associate-shop', authenticateToken, async (req, res) => {
  const { shop, accessToken } = req.body;
  
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  try {
    const pool = getPool();
    
    // Check if shop already has a token (from OAuth callback)
    const shopResult = await pool.request()
      .input('shopify_domain', sql.NVarChar(255), shop)
      .query(`
        SELECT shopify_access_token FROM Users WHERE shopify_domain = @shopify_domain
      `);

    if (shopResult.recordset.length === 0) {
      // If we have an access token from the request, use it
      if (accessToken) {
        const encryptedToken = encrypt(accessToken);
        await pool.request()
          .input('shopify_access_token', sql.NVarChar(sql.MAX), encryptedToken)
          .input('shopify_domain', sql.NVarChar(255), shop)
          .input('user_id', sql.Int, req.user.id)
          .query(`
            UPDATE Users 
            SET shopify_access_token = @shopify_access_token,
                shopify_domain = @shopify_domain,
                shopify_token_last_used = GETDATE()
            WHERE id = @user_id
          `);
      } else {
        return res.status(400).json({ error: 'No access token available for this shop' });
      }
    } else {
      // Shop already has token, just associate with current user
      const existingToken = shopResult.recordset[0].shopify_access_token;
      await pool.request()
        .input('shopify_access_token', sql.NVarChar(sql.MAX), existingToken)
        .input('shopify_domain', sql.NVarChar(255), shop)
        .input('user_id', sql.Int, req.user.id)
        .query(`
          UPDATE Users 
          SET shopify_access_token = @shopify_access_token,
              shopify_domain = @shopify_domain,
              shopify_token_last_used = GETDATE()
          WHERE id = @user_id
        `);
    }

    console.log(`[SHOPIFY ASSOCIATION] Shop ${shop} associated with user ${req.user.id}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error associating shop:', error);
    res.status(500).json({ error: 'Failed to associate shop with user' });
  }
});

module.exports = router;