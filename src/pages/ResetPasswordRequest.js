import { useState } from "react";
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
  const toast = useToast();

  const handleResetRequest = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/reset-password-request`, { email });
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
            >
              Send Reset Link
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPasswordRequest;

