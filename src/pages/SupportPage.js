// SupportPage.jsx
import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Flex,
  VStack,
  Icon,
  Link,
  ChakraProvider,
  extendTheme,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { EmailIcon, ExternalLinkIcon } from '@chakra-ui/icons';
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
  },
});

// Support Page Component
const SupportPageContent = () => {
  const handleEmailClick = () => {
    window.location.href = 'mailto:support@parcelpilot.ca?subject=Support Request&body=Hi ParcelPilot Support Team,%0D%0A%0D%0APlease describe your issue or question below:%0D%0A%0D%0A';
  };

  const bgGradient = useColorModeValue("linear(to-br, blue.50, purple.50)", "linear(to-br, gray.900, gray.800)");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box display="flex" minHeight="100vh" bgGradient={bgGradient}>
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
            <Text color={textColor}>We're here to help you with any questions or issues.</Text>
          </Flex>
          
          {/* Support contact card */}
          <Box 
            bg={cardBg}
            borderRadius="xl" 
            boxShadow="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.100"
            p={8}
          >
            <VStack spacing={6} textAlign="center">
              {/* Email icon */}
              <Box
                bg="brand.50"
                borderRadius="full"
                p={4}
                border="2px solid"
                borderColor="brand.100"
              >
                <Icon as={EmailIcon} boxSize={10} color="brand.500" />
              </Box>
              
              {/* Heading */}
              <VStack spacing={2}>
                <Heading size="lg" color="gray.800">
                  Contact Our Support Team
                </Heading>
                <Text color={textColor} fontSize="lg" maxW="md" lineHeight="tall">
                  For any questions, technical issues, or assistance with ParcelPilot, 
                  please reach out to our support team directly via email.
                </Text>
              </VStack>
              
              {/* Email address display */}
              <Box
                bg="gray.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="gray.200"
                w="full"
                maxW="sm"
              >
                <Text fontSize="lg" fontWeight="medium" color="brand.600">
                  support@parcelpilot.ca
                </Text>
              </Box>
              
              {/* Action buttons */}
              <VStack spacing={3} w="full" maxW="sm">
                <Button
                  size="lg"
                  colorScheme="brand"
                  leftIcon={<EmailIcon />}
                  onClick={handleEmailClick}
                  w="full"
                  height="60px"
                  shadow="md"
                  _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
                  _active={{ transform: 'translateY(0px)' }}
                  transition="all 0.2s"
                >
                  Send Email
                </Button>
                
                <HStack spacing={4} w="full">
                  <Button
                    variant="outline"
                    colorScheme="brand"
                    size="md"
                    flex={1}
                    onClick={() => navigator.clipboard.writeText('support@parcelpilot.ca')}
                  >
                    Copy Email
                  </Button>
                  
                  <Link 
                    href="mailto:support@parcelpilot.ca" 
                    isExternal
                    flex={1}
                  >
                    <Button
                      variant="ghost"
                      colorScheme="brand"
                      size="md"
                      w="full"
                      rightIcon={<ExternalLinkIcon />}
                    >
                      Open Mail App
                    </Button>
                  </Link>
                </HStack>
              </VStack>
              
              {/* Additional info */}
              <Box
                bg="blue.50"
                borderRadius="lg"
                p={4}
                w="full"
                borderLeft="4px solid"
                borderLeftColor="brand.400"
              >
                <VStack spacing={2} align="start">
                  <Text fontWeight="medium" color="gray.800">
                    💡 Tips to get better support:
                  </Text>
                  <VStack spacing={1} align="start" fontSize="sm" color="gray.600">
                    <Text>• Include specific details about your issue</Text>
                    <Text>• Attach screenshots if relevant</Text>
                    <Text>• Include any error messages you received</Text>
                  </VStack>
                </VStack>
              </Box>
              
              {/* Response time */}
              <Text fontSize="sm" color="gray.500" textAlign="center">
                We typically respond within 30 mins to all requests received between 8am-6pm.
              </Text>
            </VStack>
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