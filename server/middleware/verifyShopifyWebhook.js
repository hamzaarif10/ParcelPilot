const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');

  if (!hmacHeader) {
    return res.status(401).send('Unauthorized - Missing HMAC header');
  }

  let rawBody;
  try {
    rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body); // fallback in case body is parsed
  } catch (err) {
    console.error('Failed to read raw body:', err);
    return res.status(401).send('Unauthorized - Unable to read body');
  }

  try {
    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmacHeader, 'utf8'),
      Buffer.from(generatedHmac, 'utf8')
    );

    if (isValid) {
      return next();
    } else {
      return res.status(401).send('Unauthorized - Invalid HMAC');
    }
  } catch (err) {
    console.error('Webhook verification error:', err);
    return res.status(401).send('Unauthorized - Exception thrown');
  }
}

module.exports = verifyShopifyWebhook;


