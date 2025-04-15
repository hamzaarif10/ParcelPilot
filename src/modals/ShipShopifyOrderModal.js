import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Grid,
  Box,
  Text,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import RateEstimateForm from "../components/RateEstimateForm";
import { fetchUserAddress } from "../functions/fetchUserAddress";

function ShipShopifyOrderModal({ isOpen, onClose, order }) {

  const [userAddressDetails, setUserAddressDetails] = useState(null);
  const [senderAddressLine1, setSenderAddressLine1] = useState("");
  const [senderAddressLine2, setSenderAddressLine2] = useState("");
  const [senderProvince, setSenderProvince] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderCompanyName, setSenderCompanyName] = useState("");
  const [senderContactName, setSenderContactName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderCountry, setSenderCountry] = useState("CA");

  const [fulfillmentOrders, setFulfillmentOrders] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLineItem, setSelectedLineItem] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    email: "",
    phone: "",
    length: "",
    width: "",
    height: "",
    weight: "",
  });

  useEffect(() => {
    fetchUserAddress({
      setUserAddressDetails,
      setSenderAddressLine1,
      setSenderAddressLine2,
      setSenderProvince,
      setSenderCity,
      setSenderPostalCode,
      setSenderCompanyName,
      setSenderContactName,
      setSenderPhone,
      setSenderEmail,
    });
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customer?.firstName + " " + order.customer?.lastName || "",
        address1: order.shippingAddress?.address1 || "",
        address2: order.shippingAddress?.address2 || "",
        city: order.shippingAddress?.city || "",
        province: order.shippingAddress?.province || "",
        postalCode: order.shippingAddress?.zip || "",
        country: order.shippingAddress?.country || "",
        email: order.customer?.email || "",
        phone: order.customer?.phone || "",
        length: "",
        width: "",
        height: "",
        weight: "",
      });
    }
  }, [order]);

  useEffect(() => {
    const fetchFulfillmentDetails = async () => {
      if (!order?.id) return;

      const token = localStorage.getItem("authToken");

      try {
        const authResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const shopifyDomain = authResponse.data.shopify_domain;
        const shopifyAccessToken = authResponse.data.shopify_access_token;

        const fulfillmentResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/fetchShopifyOrders/get-fulfillment-orders`,
          {
            params: { shopifyDomain, shopifyAccessToken, orderId: order.id },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fulfillmentData = fulfillmentResponse.data;

        const formattedLineItems = fulfillmentData.lineItems?.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          originalUnitPrice: item.originalUnitPrice,
          fulfillmentStatus: item.fulfillmentStatus,
          requiresShipping: item.requiresShipping,
        })) || [];
        setFulfillmentOrders(fulfillmentData); // Fixed: Use fetched data
        setLineItems(formattedLineItems);
      } catch (error) {
        console.error("Error fetching fulfillment order data:", error?.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setLoading(true);
      fetchFulfillmentDetails();
    } else {
      setLoading(false);
      setFulfillmentOrders([]);
      setLineItems([]);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const handleProceedToShip = (lineItem) => {
    setSelectedLineItem(lineItem);
  };

  const unfulfilledLineItems = lineItems.filter(item => item.fulfillmentStatus !== 'fulfilled');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent borderRadius="md" p={4}>
        <ModalCloseButton />
        <ModalHeader>
          Ship Order {order.name}:{" "}
          {selectedLineItem && (
            selectedLineItem.name.length > 25
              ? `${selectedLineItem.name.slice(0, 60)}...`
              : selectedLineItem.name
          )}
        </ModalHeader>
        <ModalBody>
          {selectedLineItem ? (
            <RateEstimateForm
              senderPostalCode={order.shippingAddress?.zip}
              receiverAddressLine1={order.shippingAddress?.address1}
              receiverAddressLine2={order.shippingAddress?.address2}
              receiverCity={order.shippingAddress?.city}
              receiverPostalCode={order.shippingAddress?.zip}
              receiverName={order.customer?.firstName + " " + order.customer?.lastName}
              receiverPhoneNumber={order.customer?.phone}
              receiverEmail={order.customer?.email}
              orderId={order?.id}
              lineItemId={selectedLineItem?.id}
              onShopifyOrderModalClose={onClose}
            />
          ) : loading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" color="teal.500" />
              <Text ml={4}>Loading line items...</Text>
            </Flex>
          ) : (
            <Grid templateColumns="repeat(1, 1fr)" gap={4}>
              {unfulfilledLineItems.length > 0 ? (
                <Box>
                  {unfulfilledLineItems.map((item, index) => (
                    <Box
                      key={index}
                      borderWidth="1px"
                      borderRadius="xl"
                      p={4}
                      mb={4}
                      boxShadow="md"
                      bg="gray.50"
                      _hover={{ bg: "gray.100" }}
                    >
                      <Grid templateColumns="repeat(3, 1fr)" alignItems="start" gap={4}>
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">Product:</Text>
                          <Text fontSize="md">{item.name}</Text>
                        </Box>
                        <Box>
                          <Text><b>Quantity:</b> {item.quantity}</Text>
                        </Box>
                        <Box>
                          <Text><b>Price:</b> ${item?.originalUnitPrice?.amount} {item?.originalUnitPrice?.currencyCode}</Text>
                          <Button
                            mt={2}
                            size="md"
                            px={6}
                            fontSize="md"
                            fontWeight="bold"
                            colorScheme="blue"
                            borderRadius="xl"
                            boxShadow="md"
                            _hover={{ boxShadow: "lg", transform: "scale(1.03)" }}
                            _active={{ boxShadow: "inner", transform: "scale(0.98)" }}
                            transition="all 0.2s ease-in-out"
                            onClick={() => handleProceedToShip(item)}
                          >
                            Proceed to Ship
                          </Button>
                        </Box>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>No line items available for this order. This order may have already been fulfilled.</Box>
              )}
            </Grid>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} ml={3} size="md" px={6} variant="outline" colorScheme="orange">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ShipShopifyOrderModal;










