import React, { useState } from "react";
import { InfoIcon } from '@chakra-ui/icons';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text
} from "@chakra-ui/react";

const AddPaymentMethodModal = ({ isOpen, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

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
          card: cardNumberElement,
        });

      if (error) {
        throw new Error(error.message);
      }
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/add-payment-method`,
        { paymentMethodId: stripePaymentMethod.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMessage("Payment method added successfully!");
        setPaymentMethod(response.data.paymentMethod);
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
            <Text textAlign="center" fontSize="xl" fontWeight="bold">
            Payment Method
          </Text>
          </ModalHeader>

        <ModalBody>
          <VStack spacing="4" align="stretch" px={6} pb={6}>
            {/* Friendly message with an icon */}
            <Alert status="info" variant="subtle" colorScheme="teal" borderRadius="lg" p="2" mb="4" w="full">
              <AlertIcon as={InfoIcon} boxSize="18px" color="teal.500" />
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                No payment method found. Please add one to continue.
              </Text>
            </Alert>

            <form onSubmit={handleAddPaymentMethod}>
              <VStack spacing="4" align="stretch">
                <FormControl isRequired>
                  <FormLabel>Card Number</FormLabel>
                  <Box p="2" border="1px solid" borderColor="gray.300" rounded="lg" width="full">
                    <CardNumberElement />
                  </Box>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Expiry Date</FormLabel>
                  <Box p="2" border="1px solid" borderColor="gray.300" rounded="lg" width="full">
                    <CardExpiryElement />
                  </Box>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>CVC</FormLabel>
                  <Box p="2" border="1px solid" borderColor="gray.300" rounded="lg" width="full">
                    <CardCvcElement />
                  </Box>
                </FormControl>

                <Button type="submit" colorScheme="teal" size="lg" width="full" isLoading={loading}>
                  Add Payment Method
                </Button>
              </VStack>
            </form>

            {message && (
              <Alert status={message.includes("successfully") ? "success" : "error"} mt="4">
                <AlertIcon />
                {message}
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddPaymentMethodModal;