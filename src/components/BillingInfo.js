import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  List,
  ListItem,
  ListIcon,
  keyframes,
  Circle,
  SimpleGrid
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Motion components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

// Animation keyframes
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Custom icons
const CustomCheckIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C4B4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 7 9 18l-5-5"></path>
  </Box>
);

const CustomShipIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 20a8 8 0 1 1 16 0c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z"></path>
    <path d="M7 16V6a4 4 0 1 1 8 0v10"></path>
  </Box>
);

const CustomDollarIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </Box>
);

const CustomTruckIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E6E6FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 17h4V5H2v12h3"></path>
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path>
    <path d="M14 17h1"></path>
    <circle cx="7.5" cy="17.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </Box>
);


export default function PricingPage() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // Background pattern
  const backgroundPattern = () => {
    const particles = [...Array(12)].map((_, i) => (
      <Box
        key={i}
        position="absolute"
        w="4px"
        h="4px"
        borderRadius="full"
        bg="#E6E6FA"
        opacity={0.6}
        top={`${Math.random() * 100}%`}
        left={`${Math.random() * 100}%`}
        animation={`${floatAnimation} ${3 + Math.random() * 2}s infinite ease-in-out`}
        style={{ animationDelay: `${Math.random() * 2}s` }}
      />
    ));

    return (
      <>
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bgGradient="radial(#2D3250, #E6E6FA)"
          opacity="0.05"
          zIndex="-1"
        />
        {particles}
      </>
    );
  };

  const features = [
    "Import orders from Shopify automatically",
    "Compare rates from multiple carriers instantly",
    "Print shipping labels with discounted rates",
    "Real-time tracking for all shipments",
    "Bulk shipping operations",
    "Email support"
  ];

  const howItWorks = [
    {
      icon: <CustomTruckIcon boxSize={8} />,
      title: "Connect for Free",
      description: "Link your Shopify store to ParcelPilot web platform - no setup fees, no monthly charges."
    },
    {
      icon: <CustomShipIcon boxSize={8} />,
      title: "Ship & Pay",
      description: "Create shipping labels and pay only discounted shipping rates from carriers."
    },
    {
      icon: <CustomDollarIcon boxSize={8} />,
      title: "Save Money",
      description: "Get up to 70% off regular shipping rates with no markup - we pass savings to you."
    }
  ];

  return (
    <Box 
      bg="#f8fafc"
      minH="100vh" 
      position="relative" 
      overflow="hidden"
      pt={8}
      pb={16}
      fontFamily="'Inter', sans-serif"
    >
      {backgroundPattern()}
      
      <Container maxW="5xl" px={6} py={8} position="relative" zIndex={1}>
        {/* Header Section */}
        <MotionBox
          textAlign="center"
          mb={12}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <MotionHeading
            as="h1"
            size="2xl"
            color="#2D3250"
            mb={4}
            fontWeight="extrabold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Free to Use, Pay Per <span style={{ color: "#00C4B4" }}>Shipment</span>
          </MotionHeading>
          <MotionText
            fontSize="lg"
            color="#64748b"
            maxW="2xl"
            mx="auto"
            lineHeight="1.6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            No monthly fees, no contracts. Connect your Shopify store to ParcelPilot and only pay discounted shipping rates when you ship.
          </MotionText>
        </MotionBox>
        
        {/* Main Pricing Card */}
        <MotionBox
          bg="#fff"
          borderRadius="3xl"
          p={10}
          boxShadow="0 20px 40px rgba(0, 196, 180, 0.1)"
          border="2px solid #00C4B4"
          position="relative"
          transition="all 0.3s"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          transform={hovered ? "translateY(-8px)" : "translateY(0)"}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          maxW="4xl"
          mx="auto"
          mb={12}
        >
          <VStack align="stretch" spacing={8}>
            <Box textAlign="center">
              <Circle size="20" bg="#e0fffe" mx="auto" mb={4}>
                <CustomCheckIcon boxSize={10} />
              </Circle>
              <Heading as="h2" size="xl" color="#2D3250" mb={2}>
                ParcelPilot Platform Access
              </Heading>
              <Text color="#64748b" fontSize="lg">
                Everything you need to streamline your shipping
              </Text>
            </Box>
            
            <Box textAlign="center">
              <Flex align="baseline" justify="center" mb={2}>
                <Text fontSize="5xl" fontWeight="bold" color="#2D3250">
                  $0
                </Text>
                <Text fontSize="xl" color="#64748b" ml={2}>
                  /month
                </Text>
              </Flex>
              <Text color="#00C4B4" fontSize="lg" fontWeight="semibold">
                Pay only when you ship
              </Text>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {features.map((feature, index) => (
                <Flex key={index} align="center">
                  <CustomCheckIcon boxSize={5} mr={3} />
                  <Text color="#64748b">{feature}</Text>
                </Flex>
              ))}
            </SimpleGrid>
            
            <Button
              bg="#00C4B4"
              color="white"
              size="lg"
              borderRadius="xl"
              _hover={{ 
                transform: "scale(1.02)",
                boxShadow: "0 8px 25px rgba(0, 196, 180, 0.4)"
              }}
              transition="all 0.3s"
              animation={hovered ? `${pulseAnimation} 2s infinite` : "none"}
              fontSize="lg"
              py={6}
              onClick={() => navigate("/register")}
            >
              Sign Up Today
            </Button>
          </VStack>
        </MotionBox>
        
        {/* How Shipping Costs Work */}
        <MotionBox
          bg="linear-gradient(135deg, #fff5f5 0%, #fffbf0 100%)"
          borderRadius="2xl"
          p={8}
          mb={12}
          border="1px solid #fed7d7"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Flex align="center" justify="center" mb={6}>
            <CustomShipIcon boxSize={8} color="#FF6B6B" />
            <Heading as="h3" size="lg" color="#2D3250" ml={3}>
              How Shipping Costs Work
            </Heading>
          </Flex>
          <VStack spacing={4} align="stretch">
            <Text color="#64748b" textAlign="center" fontSize="lg" lineHeight="1.6">
              <strong>Simple & Transparent:</strong> When you create a shipping label through ParcelPilot, 
              you pay discounted carrier rates (like Canada Post, UPS, FedEx). We pass the savings directly to you - no markup!
            </Text>
            <Box bg="#fff" borderRadius="xl" p={4} border="1px solid #e2e8f0">
              <Text color="#2D3250" textAlign="center" fontWeight="semibold">
                Example: Canada Post regular rate $20.00 → You pay only $12.50 (discounted rate)
              </Text>
            </Box>
            <Text color="#64748b" textAlign="center" fontSize="sm">
              Shipping costs vary by package size, weight, destination, and chosen carrier service level.
            </Text>
          </VStack>
        </MotionBox>
        
        {/* How It Works */}
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          mb={12}
        >
          <Heading as="h2" size="xl" color="#2D3250" textAlign="center" mb={8}>
            How It Works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {howItWorks.map((step, index) => (
              <Box key={index} textAlign="center">
                <Circle size="16" bg="#f1f5f9" mx="auto" mb={4}>
                  {step.icon}
                </Circle>
                <Heading as="h3" size="md" color="#2D3250" mb={2}>
                  {step.title}
                </Heading>
                <Text color="#64748b" lineHeight="1.6">
                  {step.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </MotionBox>
        
        {/* FAQ/Contact */}
        <MotionBox
          textAlign="center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Text color="#64748b" fontSize="lg" mb={6}>
            We're transparent about all costs. No surprises, no hidden fees.
          </Text>
        </MotionBox>
      </Container>
    </Box>
  );
}