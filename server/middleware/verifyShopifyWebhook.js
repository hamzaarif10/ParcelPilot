const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');

  if (!hmacHeader) {
    return res.status(401).send('Unauthorized - Missing HMAC');
  }

  const rawBuffer = req.body;

  try {
    const generatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBuffer) // ✅ Use raw Buffer, not toString()
      .digest('base64');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedHmac, 'utf8'),
      Buffer.from(hmacHeader, 'utf8')
    );

    if (isValid) {
      return next();
    } else {
      return res.status(401).send('Unauthorized - Invalid HMAC');
    }
  } catch (err) {
    console.error('HMAC verification error:', err);
    return res.status(401).send('Unauthorized - Error');
  }
}

module.exports = verifyShopifyWebhook;


