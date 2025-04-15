import React, { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import SideBar from "../components/SideBar.js";
import {
  Box,
  Flex,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  VStack,
  Text,
  HStack,
  Image,
  Spinner, // Add Spinner for loading indicator
} from "@chakra-ui/react";

const AddPaymentMethod = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // State for fetching payment method
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchPaymentMethod = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/payment/get-payment-method`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data) {
          setPaymentMethod(response.data.paymentMethod.card);
        }
      } catch (error) {
        console.error("Error fetching payment method:", error);
      } finally {
        setFetching(false); // Set fetching to false once data is fetched
      }
    };
    fetchPaymentMethod();
  }, []);

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!stripe || !elements) {
      setMessage("Stripe is not loaded yet.");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const cardNumberElement = elements.getElement(CardNumberElement);
      const { paymentMethod: stripePaymentMethod, error } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardNumberElement
        });

      if (error) {
        throw new Error(error.message);
      }
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/add-payment-method`,
        {
          paymentMethodId: stripePaymentMethod.id
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setMessage("Payment method added successfully!");
        setPaymentMethod(response.data.paymentMethod);
        setTimeout(() => {
          window.location.reload();
        }, 1500); 
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction={{ base: "column", md: "row" }} h="100vh" bg="gray.100">
      {/* Sidebar */}
      <Box 
        w={{ base: "80px", md: "250px" }} 
        bg="gray.700" 
        color="white" 
        shadow="lg"
      >
        <SideBar />
      </Box>
      <Box flex="1" p={{ base: "6", md: "10" }} bg="creamyWhite" borderRadius="lg" boxShadow="lg">
        <Box
          maxW="lg"
          mx="auto"
          p="8"
          boxShadow="lg"
          rounded="xl"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading as="h2" size="xl" mb="8" textAlign="center" fontWeight="bold" color="blackAlpha.700">
            Payment Method
          </Heading>

          {fetching ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Spinner size="lg" color="teal.500" />
            </Box>
          ) : paymentMethod ? (
            <Box mb="4" textAlign="center" position="relative">
              
              <Box
                mt="4"
                p="6"
                borderRadius="lg"
                boxShadow="md"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                maxWidth="sm"
                mx="auto"
                position="relative"
              >
                {/* Card Icon in Front */}
                <Image
                  src={`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9ZNXfc4_B0l22XpjnRKVB7ZRQ3F48RtiYlA&s`} // Replace with your preferred card icon
                  alt="Card Icon"
                  boxSize="100px"
                  position="absolute"
                  top="45%"
                  left="15px"  // Adjust to place it where you want on the card
                  transform="translateY(-50%)" // Center vertically
                  zIndex="2"  // Ensure it's in front of the card details
                />
                <Text fontSize="md" ml="12" mt="0"> {/* Added left margin to avoid text overlap */}
                  Card ending in ****-{paymentMethod.last4} <br />
                  Card Type: {paymentMethod.brand.charAt(0).toUpperCase() +
                    paymentMethod.brand.slice(1)}
                  <br />
                  Expiry: {paymentMethod.exp_month}/{paymentMethod.exp_year}
                </Text>
              </Box>
              {/* Change this button to "Add Another Payment Method" */}
              <Button
                colorScheme="orange"
                size="md"
                width="full"
                mt="4"
                onClick={() => setPaymentMethod(null)}  // Clear the current payment method to add a new one
              >
                Edit Payment Method
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleAddPaymentMethod}>
              <VStack spacing="4" align="stretch">
                <FormControl isRequired>
                  <FormLabel>Card Number</FormLabel>
                  <Box
                    p="2"
                    border="1px solid"
                    borderColor="gray.300"
                    rounded="lg"
                    bg="gray.50"
                    _hover={{ borderColor: "teal.500" }}
                  >
                    <CardNumberElement />
                  </Box>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Expiry Date</FormLabel>
                  <Box
                    p="2"
                    border="1px solid"
                    borderColor="gray.300"
                    rounded="lg"
                    bg="gray.50"
                    _hover={{ borderColor: "teal.500" }}
                  >
                    <CardExpiryElement />
                  </Box>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>CVC</FormLabel>
                  <Box
                    p="2"
                    border="1px solid"
                    borderColor="gray.300"
                    rounded="lg"
                    bg="gray.50"
                    _hover={{ borderColor: "teal.500" }}
                  >
                    <CardCvcElement />
                  </Box>
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="teal"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Adding..."
                  fontWeight="bold"
                >
                  Add Payment Method
                </Button>
              </VStack>
            </form>
          )}

          {message && (
            <Alert
              status={message === "Payment method added successfully!" ? "success" : "error"}
              mt="6"
              rounded="lg"
            >
              <AlertIcon />
              {message}
            </Alert>
          )}

<Text mt="6" fontSize="sm" color="gray.500" textAlign="center" as="span">
  Your payment information is securely handled with Stripe.
  <HStack as="span" spacing="5" align="center" mt="25">
  <Image
      src={`https://scanlonspharmacy.com/wp-content/uploads/2018/04/secure-stripe-payment-logo.png`}
      alt="stripe logo"
      boxSize="100px"
      height="80px"
      width="500px"
    />
  </HStack>
</Text>



        </Box>
      </Box>
    </Flex>
  );
};

export default AddPaymentMethod;





