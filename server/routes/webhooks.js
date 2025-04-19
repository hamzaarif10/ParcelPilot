const express = require('express');
const router = express.Router();
const verifyShopifyWebhook = require('../middleware/verifyShopifyWebhook');

router.post('/customers_data_request', verifyShopifyWebhook, (req, res) => {
  const data = JSON.parse(req.body.toString('utf8'));
  console.log('Data Request:', data);
  res.status(200).send('OK');
});

router.post('/customers_redact', verifyShopifyWebhook, (req, res) => {
  const data = JSON.parse(req.body.toString('utf8'));
  console.log('Customer Redact:', data);
  res.status(200).send('OK');
});

router.post('/shop_redact', verifyShopifyWebhook, (req, res) => {
    const data = JSON.parse(req.body.toString('utf8'));
    console.log('Shop Redact:', data);
    res.status(200).send('OK');
  });
module.exports = router;

  