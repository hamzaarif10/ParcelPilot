import axios from 'axios';
//authorize payment
export const authorizePayment = async (paymentAmount, currency = "cad") => {
  const token = localStorage.getItem("authToken");
  
  // Validate inputs
  if (!token) {
      console.error("No authentication token found");
      return { 
          success: false, 
          error: "Authentication token is missing. Please log in again." 
      };
  }

  // Robust number conversion
  const amountInCents = Math.round(Number(paymentAmount) * 100);

  // Validate amount
  if (isNaN(amountInCents) || amountInCents <= 0) {
      console.error("Invalid payment amount:", paymentAmount);
      return { 
          success: false, 
          error: `Invalid payment amount: ${paymentAmount}` 
      };
  }

  try {
      const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/payment/authorize`,
          {
              amount: amountInCents,
              currency
          },
          {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          }
      );

      const paymentIntentId = response.data.paymentIntentId;
      
      if (!paymentIntentId) {
          throw new Error("No payment intent ID received");
      }
      return { success: true, paymentIntentId };
  } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown authorization error";
      console.error("Payment authorization failed:", {
          errorMessage,
          amount: paymentAmount,
          amountInCents
      });

      return { 
          success: false, 
          error: errorMessage 
      };
  }
};
  //Finalize the payment once shipment is created
export const capturePayment = async (paymentIntentId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/capture`,
        { paymentIntentId }
      );
      return true; // Capture was successful
    } catch (error) {
      console.error("Failed to capture payment:", error.response?.data || error.message);
      throw new Error("Payment capture failed");
    }
  };
  //if shipment creation fails, void the shipment and release the funds
  export const voidPayment = async (paymentIntentId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/void`,
        { paymentIntentId }
      );
      return true; // Void was successful
    } catch (error) {
      console.error("Failed to void payment:", error.response?.data || error.message);
      throw new Error("Payment voiding failed");
    }
  };
export default {authorizePayment, capturePayment, voidPayment};