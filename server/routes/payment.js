const express = require("express");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const {authenticateToken} = require('../middleware/authenticateToken');
const { getPool } = require('../db');
const sql = require('mssql');

// Function to update user balance (use this in your credit purchase confirmation)
const updateUserBalance = async (userId, creditAmount) => {
  const pool = getPool();
  
  try {
    // First, get the current balance
    const currentBalanceResult = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT userBalance FROM Users WHERE id = @id');
    
    if (currentBalanceResult.recordset.length === 0) {
      throw new Error('User not found');
    }
    
    const currentBalance = currentBalanceResult.recordset[0].userBalance || 0;
    const newBalance = currentBalance + creditAmount;
    
    // Update the balance
    await pool.request()
      .input('id', sql.Int, userId)
      .input('newBalance', sql.Decimal(10, 2), newBalance)
      .query('UPDATE Users SET userBalance = @newBalance WHERE id = @id');
    
    return newBalance;
  } catch (error) {
    console.error("Error updating user balance:", error.message);
    throw error;
  }
};
router.post("/balance/deduct", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { courierCost } = req.body;

    const pool = getPool();

    // Atomic deduction: only deduct if userBalance >= courierCost
    const result = await pool.request()
      .input("id", sql.Int, userId)
      .input("courierCost", sql.Decimal(10, 2), courierCost)
      .query(`
        UPDATE Users
        SET userBalance = userBalance - @courierCost
        WHERE id = @id AND userBalance >= @courierCost;

        SELECT userBalance FROM Users WHERE id = @id;
      `);

    // If no row was affected, user had insufficient funds
    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ success: false, message: "Insufficient funds" });
    }

    const newBalance = parseFloat(result.recordset[0].userBalance);

    res.status(200).json({
      success: true,
      message: "Label cost deducted successfully",
      balance: newBalance,
    });
  } catch (error) {
    console.error("Error deducting balance:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Add funds (refund / credit) to user balance
router.post("/balance/add", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const pool = getPool();

    // Add to user balance
    const result = await pool.request()
      .input("id", sql.Int, userId)
      .input("amount", sql.Decimal(10, 2), amount)
      .query(`
        UPDATE Users
        SET userBalance = userBalance + @amount
        WHERE id = @id;

        SELECT userBalance FROM Users WHERE id = @id;
      `);

    const newBalance = parseFloat(result.recordset[0].userBalance);

    res.status(200).json({
      success: true,
      message: "Balance credited successfully",
      balance: newBalance,
    });
  } catch (error) {
    console.error("Error adding balance:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Create or retrieve a Stripe Customer and attach a payment method
router.post("/add-payment-method", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    let email = '';
    let stripeCustomerId = null;
    
    // Query to get user email AND existing stripe_customer_id
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT email, stripe_customer_id FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    email = result.recordset[0].email;
    stripeCustomerId = result.recordset[0].stripe_customer_id;

    const { paymentMethodId } = req.body; // Extract paymentMethodId from the request body

    // Validate inputs
    if (!paymentMethodId) {
      return res.status(400).json({ error: "PaymentMethodId is required" });
    }

    // Retrieve or create Stripe customer (prioritize existing customer ID)
    let customer;
    if (stripeCustomerId) {
      // Try to retrieve existing customer from DB
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        // If customer doesn't exist in Stripe, create a new one
        customer = await stripe.customers.create({ email });
        stripeCustomerId = customer.id;
      }
    } else {
      // No customer ID in DB, check by email as fallback
      const customers = await stripe.customers.list({ email });
      if (customers.data.length > 0) {
        customer = customers.data[0];
        stripeCustomerId = customer.id;
      } else {
        customer = await stripe.customers.create({ email });
        stripeCustomerId = customer.id;
      }
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });

    // Set the default payment method for the customer
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // Update Stripe customer ID in the database if it's new or changed
      await pool.request()
        .input('stripe_customer_id', sql.VarChar(255), stripeCustomerId)
        .input('hasManualPaymentMethodAdded', sql.Bit, 1) // set to true
        .input('id', sql.Int, userId)
        .query(`
          UPDATE Users
          SET stripe_customer_id = @stripe_customer_id,
              hasManualPaymentMethodAdded = @hasManualPaymentMethodAdded
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
    const userId = req.user.id;
    const pool = getPool();

    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query(`
        SELECT stripe_customer_id, hasManualPaymentMethodAdded 
        FROM Users 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const user = result.recordset[0];

    // If user has a payment method, get card details
    if (user.hasManualPaymentMethodAdded && user.stripe_customer_id) {
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      const paymentMethodId = customer.invoice_settings.default_payment_method;

      let paymentMethod = null;
      if (paymentMethodId) {
        paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      }

      return res.json({
        success: true,
        paymentMethod,
        hasManualPaymentMethodAdded: user.hasManualPaymentMethodAdded
      });
    }

    // No manual payment method added
    return res.json({
      success: true,
      paymentMethod: null,
      hasManualPaymentMethodAdded: false
    });

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
      .query('SELECT hasManualPaymentMethodAdded FROM Users WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    const doesPaymentMethodExist = result.recordset[0].hasManualPaymentMethodAdded;

    // Respond with the status
    res.status(200).json({ doesPaymentMethodExist});
  } catch (error) {
    console.error("Error checking payment method:", error.message);
    res.status(500).json({ message: "Failed to check whether payment method exists.", error: error.message });
  }
});
//Get the user balance and display it on payment page
router.get("/balance", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the token
    const pool = getPool();
    
    // Query to get the userBalance
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT userBalance FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    const userBalance = parseFloat(result.recordset[0].userBalance) || 0;

res.status(200).json({ 
  success: true, 
  balance: userBalance 
});
  } catch (error) {
    console.error("Error getting user balance:", error.message);
    res.status(500).json({ message: "Failed to fetch balance.", error: error.message });
  }
});
// Route: POST /payment/confirm-credit-purchase
router.post("/confirm-credit-purchase", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    // Retrieve the checkout session and expand the payment method
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.payment_method"]
    });

    if (!session) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    // Verify session belongs to the logged-in user
    if (session.metadata.userId !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to session' });
    }

    // Ensure payment succeeded
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const creditAmount = parseFloat(session.metadata.creditAmount);
    const customerId = session.customer;
    const paymentMethodId = session.payment_intent?.payment_method?.id;

    // Set default payment method if exists
    if (paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
    }

    // Update user balance (your existing function)
    const newBalance = await updateUserBalance(userId, creditAmount);

    // Return success response
    res.json({
      success: true,
      amount: creditAmount,
      newBalance,
      customerId,
      paymentMethodId,
      message: 'Credits added successfully'
    });

  } catch (error) {
    console.error('Error confirming credit purchase:', error);
    res.status(500).json({ error: 'Failed to confirm credit purchase', details: error.message });
  }
});
// Route: POST /payment/create-credit-checkout
router.post('/create-credit-checkout', authenticateToken, async (req, res) => {
  try {
    const { amount, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const pool = getPool();

    // Validate amount
    if (!amount || amount < 1 || amount > 1000) {
      return res.status(400).json({ error: 'Invalid amount. Must be between $1.00 and $1000.00' });
    }

    // Get user email and existing Stripe customer ID
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT email, stripe_customer_id FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const { email, stripe_customer_id } = result.recordset[0];
    let customerId = stripe_customer_id;

    // Create or retrieve Stripe customer
    let customer;
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId);
      } catch {
        // If customer does not exist in Stripe, create a new one
        customer = await stripe.customers.create({ email });
        customerId = customer.id;
      }
    } else {
      // Check if a customer exists with this email
      const customers = await stripe.customers.list({ email });
      if (customers.data.length > 0) {
        customer = customers.data[0];
        customerId = customer.id;
      } else {
        customer = await stripe.customers.create({ email });
        customerId = customer.id;
      }

      // Save new customerId in DB
      await pool.request()
        .input('stripe_customer_id', sql.VarChar(255), customerId)
        .input('id', sql.Int, userId)
        .query('UPDATE Users SET stripe_customer_id = @stripe_customer_id WHERE id = @id');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId, // Use Stripe customer object
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Account Credits',
            description: `Add $${amount.toFixed(2)} to your account balance`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save card for future payments
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        creditAmount: amount.toString(),
        type: 'credit_purchase',
      }
    });

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT') {
      res.status(500).json({ error: 'Database connection issue.' });
    } else if (error instanceof stripe.errors.StripeError) {
      res.status(400).json({ error: 'Stripe API error: ' + error.message });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

module.exports = router;