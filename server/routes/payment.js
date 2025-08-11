const express = require("express");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const {authenticateToken} = require('../middleware/authenticateToken');
const { getPool } = require('../db');
const sql = require('mssql');


const getCard = async (card_id, res) => {
  try {
    // Retrieve the customer object from Stripe
    const customer = await stripe.customers.retrieve(card_id);
    
    // Get the default payment method for the customer
    const paymentMethodId = customer.invoice_settings.default_payment_method;

    if (!paymentMethodId) {
      return res.status(404).json({ error: "No payment method found for this customer" });
    }

    // Retrieve the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    res.json({ success: true, paymentMethod });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
// Create or retrieve a Stripe Customer and attach a payment method
router.post("/add-payment-method", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    let email = '';
    
    // Query to get user email
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT email FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Email not found." });
    }
    
    email = result.recordset[0].email;  // Correct way to extract the email

    const { paymentMethodId } = req.body; // Extract paymentMethodId from the request body

    // Validate inputs
    if (!paymentMethodId) {
      return res.status(400).json({ error: "PaymentMethodId is required" });
    }

    // Retrieve or create Stripe customer
    let customer;
    const customers = await stripe.customers.list({ email });
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });

    // Set the default payment method for the customer
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // Update Stripe customer ID in the database
    await pool.request()
      .input('stripe_customer_id', sql.VarChar(255), customer.id)
      .input('id', sql.Int, userId)
      .query(`
        UPDATE Users
        SET stripe_customer_id = @stripe_customer_id
        WHERE id = @id
      `);

    // Respond with success
    res.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error(error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT') {
      res.status(500).json({ error: 'Database connection issue.' });
    } else if (error instanceof stripe.errors.StripeError) {
      res.status(400).json({ error: 'Stripe API error: ' + error.message });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});  
  // Get the payment method for a Stripe customer
  router.get("/get-payment-method", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id; // Get the user ID from the token
      const pool = getPool();
      
      // Query to check if the customer has a valid payment method on file
      const result = await pool.request()
        .input('id', sql.Int, userId)
        .query('SELECT stripe_customer_id FROM Users WHERE id = @id');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "customer stripe id not found." });
      }
  
      // Call getCard function here
      await getCard(result.recordset[0].stripe_customer_id, res);  // Make sure to pass res along to the getCard function
  
    } catch (error) {
      console.error("Error getting stripe customer id:", error.message);
      res.status(500).json({ message: "Failed to fetch stripe customer id.", error: error.message });
    }
  });
  //authorize payment to bill customer
  router.post("/authorize", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id; // Get the user ID from the token
      const { amount, currency } = req.body;
  
      if (!amount || !currency) {
        return res.status(400).json({ error: "Amount and currency are required" });
      }
  
      const pool = getPool();
      const result = await pool.request()
        .input('id', sql.Int, userId)
        .query('SELECT stripe_customer_id FROM Users WHERE id = @id');
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "customer stripe id not found." });
      }
  
      const customerId = result.recordset[0].stripe_customer_id;
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethod = customer.invoice_settings.default_payment_method;
  
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method: defaultPaymentMethod,
        capture_method: "manual",
        automatic_payment_methods: {
          enabled: true,      // Enable automatic payment methods
          allow_redirects: "never"  // Prevent redirects
        }
      });
      // Ensure the PaymentIntent ID exists
      if (!paymentIntent.id) {
        return res.status(500).json({ error: "Failed to create PaymentIntent" });
      }
  
      res.json({ success: true, paymentIntentId: paymentIntent.id });
    } catch (error) {
      console.error(error);
      if (error.type === 'StripeCardError') {
        res.status(402).json({ error: "Your card was declined." });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  });
//finalize the authorized payment after shipment creation is successful
router.post("/capture", async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    // Step 1: Retrieve the PaymentIntent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Step 2: Confirm the PaymentIntent if it requires confirmation
    if (paymentIntent.status === 'requires_confirmation') {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    }

    // Step 3: Handle automatic capture (if payment method is set to automatic capture)
    if (paymentIntent.capture_method === 'automatic') {
      if (paymentIntent.status === 'succeeded') {
        res.status(200).json({ success: true, paymentIntent });
      } else {
        res.status(400).json({ error: `PaymentIntent is not in a capturable state: ${paymentIntent.status}` });
      }
    } 
    // Step 4: Handle manual capture
    else if (paymentIntent.capture_method === 'manual' && paymentIntent.status === 'requires_capture') {
      const capturedPaymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      res.status(200).json({ success: true, paymentIntent: capturedPaymentIntent });
    } else {
      res.status(400).json({ error: `PaymentIntent is not in a capturable state: ${paymentIntent.status}` });
    }
  } catch (error) {
    console.error("Error capturing payment:", error.message);
    res.status(500).json({ error: "Payment capture failed" });
  }
});
//route to cancel the authorized payment if shipment creation fails
router.post("/void", async (req, res) => {
  const { paymentIntentId } = req.body;
  try {
    // Step 1: Cancel the payment intent
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    // Step 2: Confirm cancellation
    res.status(200).json({ success: true, paymentIntent });
  } catch (error) {
    console.error("Error voiding payment:", error.message);
    res.status(500).json({ error: "Payment voiding failed" });
  }
});
//Route to check if there is a payment method on file
router.get("/doesPaymentMethodExist", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT stripe_customer_id FROM Users WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    const doesPaymentMethodExist = result.recordset[0].stripe_customer_id;

    // Respond with the status
    res.status(200).json({ doesPaymentMethodExist});
  } catch (error) {
    console.error("Error checking payment method:", error.message);
    res.status(500).json({ message: "Failed to check whether payment method exists.", error: error.message });
  }
});
module.exports = router;