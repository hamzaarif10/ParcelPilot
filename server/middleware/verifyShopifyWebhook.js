const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const rawBody = req.body.toString('utf8');

  const generatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (
    hmacHeader &&
    crypto.timingSafeEqual(Buffer.from(hmacHeader, 'utf8'), Buffer.from(generatedHmac, 'utf8'))
  ) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

module.exports = verifyShopifyWebhook;
