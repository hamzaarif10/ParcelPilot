// SupportPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  useToast,
  ChakraProvider,
  extendTheme,
  Text,
  Flex
} from '@chakra-ui/react';
import SideBar from "../components/SideBar.js";

// Custom theme definition with modern palette
const theme = extendTheme({
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#d8e0ff',
      200: '#b1c1ff',
      300: '#89a2ff',
      400: '#6283ff',
      500: '#3a64ff',
      600: '#2951e6',
      700: '#1c41cc',
      800: '#0e31a3',
      900: '#05255a',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'medium',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'md',
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: 'md',
      },
    },
  },
});

// Support Page Component
const SupportPageContent = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get the authentication token from localStorage or wherever you store it
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('You must be logged in to submit a support request');
      }
      
      // Send the support request to your backend
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/support/submitTicket`, 
        { title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(true);
      setTitle('');
      setMessage('');
      
      toast({
        title: 'Request Submitted',
        description: "We've received your support request and will get back to you soon.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" minHeight="100vh" bgGradient="linear(to-br, blue.50, purple.50)">
      {/* Sidebar */}
      <Box w={{ base: '80px', md: '250px' }} bg="gray.800" color="white" shadow="lg">
        <SideBar />
      </Box>
      
      {/* Main content */}
      <Box flex="1" p={{ base: 4, md: 8 }}>
        <Container maxW="container.md" py={8}>
          {/* Page header */}
          <Flex direction="column" align="flex-start" mb={8}>
            <Heading size="xl" mb={2}>Help & Support</Heading>
            <Text color="gray.600">How can we help you today?</Text>
          </Flex>
          
          {/* Support form */}
          <Box 
            bg="white" 
            borderRadius="xl" 
            boxShadow="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.100"
          >
            {success ? (
              <Alert
                status="success"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="xl"
                p={8}
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={2} fontSize="xl">
                  Message Sent!
                </AlertTitle>
                <AlertDescription maxW="sm">
                  Your support request has been submitted successfully. We'll get back to you soon.
                </AlertDescription>
                <Button 
                  mt={6} 
                  colorScheme="brand" 
                  onClick={() => setSuccess(false)}
                  size="lg"
                  shadow="md"
                >
                  Send another message
                </Button>
              </Alert>
            ) : (
              <Box p={8}>
                <form onSubmit={handleSubmit}>
                  {error && (
                    <Alert status="error" mb={6} borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <VStack spacing={6} align="stretch">
                    <FormControl isRequired>
                      <FormLabel htmlFor="title" fontWeight="medium">
                        Subject
                      </FormLabel>
                      <Input
                        id="title"
                        placeholder="What's your question about?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        size="lg"
                        bg="gray.50"
                        _focus={{ bg: "white", borderColor: "brand.300", shadow: "outline" }}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="message" fontWeight="medium">
                        Message
                      </FormLabel>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help you..."
                        size="lg"
                        resize="vertical"
                        rows={8}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        bg="gray.50"
                        _focus={{ bg: "white", borderColor: "brand.300", shadow: "outline" }}
                      />
                    </FormControl>
                    
                    <Button
                      mt={2}
                      colorScheme="brand"
                      isLoading={loading}
                      loadingText="Sending..."
                      type="submit"
                      size="lg"
                      height="60px"
                      shadow="md"
                      _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
                      _active={{ transform: 'translateY(0px)' }}
                      transition="all 0.2s"
                    >
                      Send Message
                    </Button>
                  </VStack>
                </form>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

// Wrapped component with theme
const SupportPage = () => {
  return (
    <ChakraProvider theme={theme}>
      <SupportPageContent />
    </ChakraProvider>
  );
};

export default SupportPage;

// If you want to use the theme elsewhere in your app:
export { theme };