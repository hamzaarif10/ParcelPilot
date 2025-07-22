import axios from 'axios';

export async function fulfillShopifyOrder(orderId, lineItemId, trackingNumber, trackingCompany) {
    const token = localStorage.getItem("authToken"); // Assuming you're using the token for authorization
    let shopify_domain = "";
    let shopify_access_token = "";

    //DEBUG
    console.log("Order id: " + orderId);
    console.log("line item id: " + lineItemId);
    console.log("tracking number: " + trackingNumber);
    console.log("tracking company: " + trackingCompany);
  
    if (!token) {
      console.error("Authentication token is missing");
      return;
    }
  
    // Get Shopify domain and access token
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      shopify_domain = response.data.shopify_domain;
      shopify_access_token = response.data.shopify_access_token;
    } catch (error) {
      console.error("Error retrieving Shopify domain name or access token:", error);
    }
  
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/fetchShopifyOrders/fulfill-order`,  
        {
          shopifyDomain: shopify_domain, // Replace with the Shopify domain
          shopifyAccessToken: shopify_access_token, // Replace with the Shopify access token
          orderId,
          lineItemId,
          trackingNumber,
          trackingCompany
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Passing the token in headers if needed
            'Content-Type': 'application/json'
          }
        }
      );
      // You can add logic here to update the UI or notify the user that the order is fulfilled.
    } catch (error) {
      console.error("Error fulfilling the order:", error);
      // You can display an error message to the user here.
    }
  };
  