import { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const toast = useToast();

  const handleResetPassword = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Password cannot be empty.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setDisabled(true);
    setCountdown(4);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDisabled(false);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/reset-password`, {
        token,
        password,
      });

      toast({
        title: "Success",
        description: res.data.message,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Password reset failed. Please try again.",
        status: "error",
        duration: 3000,
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
              Enter your new password below.
            </Text>

            <FormControl>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  focusBorderColor="blue.500"
                />
                <InputRightElement>
                  <Button
                    size="sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                    variant="ghost"
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              colorScheme="blue"
              width="full"
              _hover={{ bg: "blue.600", transform: "scale(1.05)" }}
              transition="0.2s"
              onClick={handleResetPassword}
              disabled={disabled}
            >
              {disabled ? `Please wait... (${countdown})` : "Reset Password"}
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPassword;
