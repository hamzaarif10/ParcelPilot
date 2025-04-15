const axios = require('axios');
const express = require('express');
const authenticateToken = require('../middleware/authenticateToken'); 

const router = express.Router();

// Shopify GraphQL query to fetch unfulfilled orders
const getUnfulfilledOrdersQuery = `
  query getUnfulfilledOrders($first: Int!) {
  orders(first: $first, query: "fulfillment_status:unfulfilled") {
    edges {
      node {
        id
        name
        customer {
          firstName
          lastName
          email
          phone
        }
        shippingAddress {
          address1
          address2
          city
          province
          country
          zip
        }
        displayFulfillmentStatus
      }
    }
  }
}
`;


router.get("/orders/sync", async (req, res) => {
    const { shopifyDomain, shopifyAccessToken } = req.query; // Get these from query params
  
    if (!shopifyDomain || !shopifyAccessToken) {
      return res.status(400).json({ error: "Missing Shopify domain or access token." });
    }
    const url = `https://${shopifyDomain}/admin/api/2025-01/graphql.json`;
    try {
        const response = await axios.post(
          url,
          {
            query: getUnfulfilledOrdersQuery,
            variables: { first: 10 },
          },
          {
            headers: {
              'X-Shopify-Access-Token': shopifyAccessToken,
              "Content-Type": "application/json",
            },
          }
        );
      
        const orders = response.data.data.orders.edges.map((order) => order.node);
        res.json({ orders });
      } catch (error) {
        console.error("Error fetching unfulfilled orders:", error.response || error.message);
        res.status(500).json({ error: "Failed to fetch orders from Shopify." });
      }
  });

//Get Shopify order id for fullfillment later
router.get('/get-fulfillment-orders', async (req, res) => {
  const { shopifyDomain, shopifyAccessToken, orderId } = req.query;

  // Validate required parameters
  if (!shopifyDomain || !shopifyAccessToken || !orderId) {
    return res.status(400).json({
      error: 'Missing required parameters: shopifyDomain, shopifyAccessToken, or orderId',
    });
  }

  try {
    // Clean the order ID - remove any existing gid prefix
    const cleanOrderId = orderId.replace('gid://shopify/Order/', '');

    // Make the request to Shopify GraphQL API to fetch order and fulfillment data
    const response = await axios.post(
      `https://${shopifyDomain}/admin/api/2023-01/graphql.json`,
      {
        query: `
          query getOrderDetails($orderId: ID!) {
            order(id: $orderId) {
              id
              name
              displayFulfillmentStatus
              fullyPaid
              customer {
                id
                displayName
                email
                phone
              }
              lineItems(first: 100) {
                edges {
                  node {
                    id
                    name
                    sku
                    quantity
                    currentQuantity
                    requiresShipping
                    fulfillmentStatus
                    fulfillmentService {
                      serviceName
                    }
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    discountedUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    totalDiscountSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              fulfillments(first: 10) {
                id
                status
                trackingInfo {
                  number
                  url
                  company
                }
                fulfillmentLineItems(first: 100) {
                  edges {
                    node {
                      lineItem {
                        id
                        name
                      }
                      quantity
                    }
                  }
                }
              }
              shippingLine {
                title
                price
                carrierIdentifier
                code
              }
              tags
              note
            }
          }
        `,
        variables: {
          orderId: `gid://shopify/Order/${cleanOrderId}`,
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      console.error('Shopify GraphQL Errors:', response.data.errors);
      return res.status(400).json({
        error: 'GraphQL errors occurred',
        details: response.data.errors,
      });
    }

    // Check if the response contains the order
    if (response.data?.data?.order) {
      const order = response.data.data.order;

      // Transform the data for easier consumption
      const transformedOrder = {
        id: order.id,
        orderName: order.name,
        fulfillmentStatus: order.displayFulfillmentStatus,
        fullyPaid: order.fullyPaid,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        lineItems: order.lineItems.edges.map((edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          sku: edge.node.sku,
          quantity: edge.node.quantity,
          currentQuantity: edge.node.currentQuantity,
          requiresShipping: edge.node.requiresShipping,
          fulfillmentStatus: edge.node.fulfillmentStatus,
          fulfillmentService: edge.node.fulfillmentService?.serviceName,
          originalUnitPrice: edge.node.originalUnitPriceSet?.shopMoney,
          discountedUnitPrice: edge.node.discountedUnitPriceSet?.shopMoney,
          totalDiscount: edge.node.totalDiscountSet?.shopMoney,
        })),
        fulfillments: (order.fulfillments || []).map((fulfillment) => ({
          id: fulfillment.id,
          status: fulfillment.status,
          trackingInfo: fulfillment.trackingInfo,
          createdAt: fulfillment.createdAt,
          updatedAt: fulfillment.updatedAt,
          lineItems: fulfillment.fulfillmentLineItems?.edges?.map((fEdge) => ({
            fulfillmentLineItemId: fEdge.node.id,  // Fulfillment Line Item ID
            lineItemId: fEdge.node.lineItem.id,    // Original Line Item ID
            name: fEdge.node.lineItem.name,
            quantity: fEdge.node.quantity,
          })) || [],
        })),
        shippingMethod: order.shippingLine,
        tags: order.tags,
        notes: order.note,
      };

      res.json(transformedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error fetching order details:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error while fetching order details';

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.errors?.message || error.response.statusText;
    } else if (error.request) {
      errorMessage = 'No response received from Shopify API';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data?.errors || error.message,
    });
  }
});


// Route to fulfill Shopify order
router.post('/fulfill-order', async (req, res) => {
  const { shopifyDomain, shopifyAccessToken, orderId, lineItemId, trackingNumber, trackingCompany } = req.body;
  // Validate required parameters
  if (!shopifyDomain || !shopifyAccessToken || !orderId || !lineItemId || !trackingNumber || !trackingCompany) {
    return res.status(400).json({
      error: 'Missing required parameters: shopifyDomain, shopifyAccessToken, orderId, lineItemId, trackingNumber, or trackingCompany',
    });
  }
  try {
    // First, query to get the fulfillment order ID(s) for this order
    const getFulfillmentOrdersQuery = `
      query getOrderFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
                lineItems(first: 10) {
                  edges {
                    node {
                      id
                      lineItem {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    // Get the fulfillment orders first
    const fulfillmentOrdersResponse = await axios.post(
      `https://${shopifyDomain}/admin/api/2023-01/graphql.json`,
      {
        query: getFulfillmentOrdersQuery,
        variables: { orderId },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Check for GraphQL errors in the response
    if (fulfillmentOrdersResponse.data.errors) {
      console.error('GraphQL errors:', fulfillmentOrdersResponse.data.errors);
      return res.status(400).json({
        error: 'GraphQL errors occurred',
        details: fulfillmentOrdersResponse.data.errors.map((err) => err.message).join(', '),
      });
    }

    // Extract the fulfillment order ID from the response
    const fulfillmentOrders = fulfillmentOrdersResponse.data.data.order.fulfillmentOrders.edges;
    if (fulfillmentOrders.length === 0) {
      return res.status(404).json({ error: 'No fulfillment orders found for this order' });
    }

    // Find the right fulfillment order that contains our line item
    let fulfillmentOrderId;
    let fulfillmentOrderLineItemId;

    // Loop through fulfillment orders to find the one containing our line item
    for (const orderEdge of fulfillmentOrders) {
      const lineItems = orderEdge.node.lineItems.edges;
      for (const lineItemEdge of lineItems) {
        // Check if this line item matches the one we're looking for
        if (lineItemEdge.node.lineItem.id === lineItemId) {
          fulfillmentOrderId = orderEdge.node.id;
          fulfillmentOrderLineItemId = lineItemEdge.node.id; // This is the fulfillment order line item ID
          break;
        }
      }
      if (fulfillmentOrderId) break;
    }

    if (!fulfillmentOrderId || !fulfillmentOrderLineItemId) {
      return res.status(404).json({ 
        error: 'Line item not found in any fulfillment order',
        lineItemId: lineItemId,
        availableFulfillmentOrders: fulfillmentOrders
      });
    }

    // Construct GraphQL mutation for creating fulfillment
    const mutation = `
      mutation FulfillmentCreate($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment {
            fulfillmentLineItems(first: 10) {
              edges {
                node {
                  id
                  lineItem {
                    title
                    variant {
                      id
                    }
                  }
                  quantity
                  originalTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            status
            trackingInfo(first: 10) {
              company
              number
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Construct the fulfillment input object using the correct structure
    const fulfillment = {
      lineItemsByFulfillmentOrder: [
        {
          fulfillmentOrderId: fulfillmentOrderId,
          fulfillmentOrderLineItems: [
            {
              id: fulfillmentOrderLineItemId,
              quantity: 1 // You might want to make this configurable
            }
          ]
        }
      ],
      trackingInfo: {
        number: trackingNumber,
        company: trackingCompany,
      }
    };

    // Make the request to Shopify GraphQL API
    const response = await axios.post(
      `https://${shopifyDomain}/admin/api/2023-01/graphql.json`,
      {
        query: mutation,
        variables: { fulfillment },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Check for GraphQL errors in the response
    if (response.data.errors) {
      console.error('Error fulfilling order:', response.data.errors);
      return res.status(400).json({
        error: 'GraphQL errors occurred',
        details: response.data.errors.map((err) => err.message).join(', '),
      });
    }

    const { data } = response.data;

    // Check for user errors in the response
    if (data.fulfillmentCreateV2.userErrors.length > 0) {
      console.error('User errors:', data.fulfillmentCreateV2.userErrors);
      return res.status(400).json({
        error: 'User errors occurred',
        details: data.fulfillmentCreateV2.userErrors.map((err) => err.message).join(', '),
      });
    }

    // Return the fulfillment data
    const fulfillmentData = data.fulfillmentCreateV2.fulfillment;
    res.json(fulfillmentData);
  } catch (error) {
    console.error('Error fulfilling Shopify order:', error);
    
    // Add more detailed error handling
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      return res.status(error.response.status).json({
        error: 'API error',
        details: error.response.data,
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;