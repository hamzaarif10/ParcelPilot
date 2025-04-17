import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Input,
  Button,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  useToast,
  Container,
} from "@chakra-ui/react";

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const toast = useToast();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleResetRequest = async () => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setDisabled(true);
    setCountdown(5);

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDisabled(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/reset-password-request`,
        { email }
      );
      toast({
        title: "Success",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, blue.500, purple.500)"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="xl">
          <VStack spacing={6}>
            <Heading size="lg" color="blue.700">
              Reset Your Password
            </Heading>
            <Text color="gray.600" textAlign="center">
              Enter your email, and we'll send you a reset link.
            </Text>

            <FormControl>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                focusBorderColor="blue.500"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              width="full"
              _hover={{ bg: "blue.600", transform: "scale(1.05)" }}
              transition="0.2s"
              onClick={handleResetRequest}
              disabled={disabled}
            >
              {disabled ? `Please wait... (${countdown})` : "Send Reset Link"}
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPasswordRequest;
