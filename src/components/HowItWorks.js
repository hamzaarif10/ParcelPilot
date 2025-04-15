import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  VStack,
  useMediaQuery,
  keyframes,
  Circle,
  chakra
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Import courier logos
import canadaPostLogo from './assets/couriers/canadapost.png';
import upsLogo from './assets/couriers/ups.png';
import fedexLogo from './assets/couriers/sendle.png';
import purolatorLogo from './assets/couriers/purolator.png';
import glsLogo from './assets/couriers/gls.png';
import canparLogo from './assets/couriers/canpar.webp';

// Motion components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionFlex = motion(Flex);
const MotionGrid = motion(Grid);

// Animation keyframes
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(5px); }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Custom search icon with floating courier logos
const CustomSearchIcon = (props) => {
  const fadeInAnimation = keyframes`
    from { opacity: 0; }
    to { opacity: 1.0; }
  `;
  
  const floatingAnimation = keyframes`
    0% { transform: translate(-50%, -50%); }
    25% { transform: translate(-50%, -50%); }
    50% { transform: translate(-50%, -50%); }
    75% { transform: translate(-50%, -50%); }
    100% { transform: translate(-50%, -50%); }
  `;
  
  const courierLogos = [
    { path: upsLogo, alt: "UPS", delay: "0.5s", top: "30%", left: "-10%" },
    { path: canadaPostLogo, alt: "Canada Post", delay: "1s", top: "105%", left: "50%" },
    { path: purolatorLogo, alt: "Purolator", delay: "1.5s", top: "30%", left: "125%" },
    { path: glsLogo, alt: "GLS", delay: "2s", top: "-10%", left: "50%" },
    { path: canparLogo, alt: "Canpar", delay: "2.5s", top: "65%", left: "-30%" },
    { path: fedexLogo, alt: "Sendle", delay: "3s", top: "65%", left: "125%" }
  ];
  
  return (
    <Box position="relative" width={props.boxSize} height={props.boxSize} {...props}>
      {courierLogos.map((logo, index) => (
        <Box
          key={index}
          position="absolute"
          width={`${Number(props.boxSize || 12) * 3.0}px`}
          height={`${Number(props.boxSize || 12) * 3.0}px`}
          opacity="0"
          top={logo.top}
          left={logo.left}
          transform="translate(-50%, -50%)"
          sx={{ 
            animation: `${fadeInAnimation} 0.5s forwards ${index * 0.2}s, ${floatingAnimation} ${3 + index * 0.4}s infinite ease-in-out ${0.5 + index * 0.2}s`
          }}
          zIndex="1"
          filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"
          _hover={{ animation: `${rotateAnimation} 2s linear infinite` }}
        >
          <Box 
            as="img" 
            src={logo.path} 
            alt={logo.alt} 
            width="100%" 
            height="100%" 
            objectFit="contain"
          />
        </Box>
      ))}
      
      <Box 
        as="svg" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="2"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </Box>
    </Box>
  );
};

// Other custom icon components with updated colors
const CustomCreditCardIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C4B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
    <line x1="2" x2="22" y1="10" y2="10"></line>
  </Box>
);

const CustomTruckIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 17h4V5H2v12h3"></path>
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path>
    <path d="M14 17h1"></path>
    <circle cx="7.5" cy="17.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </Box>
);

const CustomBarChartIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M3 9h18"></path>
    <path d="M9 21V9"></path>
    <path d="m9 15 3-3 3 3"></path>
  </Box>
);

const CustomZapIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
  </Box>
);

const CustomShieldIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C4B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 7 9 18l-5-5"></path>
    <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"></path>
  </Box>
);

const CustomPackageIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  </Box>
);

const CustomRepeatIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E6E6FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m17 2 4 4-4 4"></path>
    <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
    <path d="m7 22-4-4 4-4"></path>
    <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
  </Box>
);

const CustomArrowRightIcon = (props) => (
  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C4B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </Box>
);

export default function HowItWorks() {
  const [isLargerThan768] = useMediaQuery('(min-width: 768px)');
  const [hoverStep, setHoverStep] = useState(null);

  // Intersection observer hooks
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [stepsRef, stepsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.3 });

  // Background pattern with particles
  const backgroundPattern = () => {
    const particles = [...Array(20)].map((_, i) => (
      <Box
        key={i}
        position="absolute"
        w="6px"
        h="6px"
        borderRadius="full"
        bg="#E6E6FA"
        opacity={0.4}
        top={`${Math.random() * 100}%`}
        left={`${Math.random() * 100}%`}
        animation={`${floatAnimation} ${4 + Math.random() * 3}s infinite ease-in-out`}
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
          opacity="0.1"
          zIndex="-1"
        />
        {particles}
      </>
    );
  };
  
  const steps = [
    {
      icon: <CustomSearchIcon boxSize={14} color="#E6E6FA" />,
      visualIcon: <CustomSearchIcon boxSize={24} color="#00C4B4" />,
      title: "Compare Shipping Rates",
      description: "Find the best carrier rates tailored to your needs in seconds.",
      gradient: "linear(to-r,rgb(122, 235, 225), #40E0D0)",
      bgColor: "#E6E6FA",
      accentColor: "#00C4B4",
      textColor: "#2D3250"
    },
    {
      icon: <CustomCreditCardIcon boxSize={14} color="#FF6B6B" />,
      visualIcon: <CustomCreditCardIcon boxSize={24} color="#FF6B6B" />,
      title: "Purchase & Generate Labels",
      description: "Create shipping labels effortlessly with no contracts.",
      gradient: "linear(to-r,rgb(19, 205, 211),rgb(27, 228, 218))",
      bgColor: "#FFF5F5",
      accentColor: "#FF6B6B",
      textColor: "#2D3250"
    },
    {
      icon: <CustomTruckIcon boxSize={14} color="#FFD700" />,
      visualIcon: <CustomTruckIcon boxSize={24} color="#FFD700" />,
      title: "Ship & Track",
      description: "Manage pickups and track packages in real-time.",
      gradient: "linear(to-r, #FFD700, #FFE766)",
      bgColor: "#FFFACD",
      accentColor: "#FFD700",
      textColor: "#2D3250"
    },
    {
      icon: <CustomBarChartIcon boxSize={14} color="#E6E6FA" />,
      visualIcon: <CustomBarChartIcon boxSize={24} color="#E6E6FA" />,
      title: "Analyze & Optimize",
      description: "Leverage analytics to cut costs and streamline logistics.",
      gradient: "linear(to-r,rgb(99, 99, 222),rgb(0, 46, 146))",
      bgColor: "#F0F8FF",
      accentColor: "#E6E6FA",
      textColor: "#2D3250"
    }
  ];
  
  const features = [
    {
      icon: <CustomZapIcon boxSize={8} color="#FFD700" />,
      title: "Lightning Fast",
      description: "Instant quotes and labels at your fingertips.",
      bg: "#FFFACD",
      accentColor: "#FFD700",
      borderColor: "#FFFACD"
    },
    {
      icon: <CustomShieldIcon boxSize={8} color="#00C4B4" />,
      title: "Secure & Reliable",
      description: "Your data is protected with top-tier security.",
      bg: "#E0FFFF",
      accentColor: "#00C4B4",
      borderColor: "#E0FFFF"
    },
    {
      icon: <CustomPackageIcon boxSize={8} color="#FF6B6B" />,
      title: "Multi-Carrier Support",
      description: "All major carriers in one seamless platform.",
      bg: "#FFF5F5",
      accentColor: "#FF6B6B",
      borderColor: "#FFF5F5"
    },
    {
      icon: <CustomRepeatIcon boxSize={8} color="#E6E6FA" />,
      title: "Automation Ready",
      description: "Integrate with APIs for a custom workflow.",
      bg: "#F0F8FF",
      accentColor: "#E6E6FA",
      borderColor: "#F0F8FF"
    }
  ];

  // Particle generator
  const generateParticles = (count, color) => {
    return [...Array(count)].map((_, i) => (
      <Box
        key={i}
        position="absolute"
        w="6px"
        h="6px"
        borderRadius="full"
        bg={color || "#E6E6FA"}
        opacity={0.6}
        top={`${Math.random() * 100}%`}
        left={`${Math.random() * 100}%`}
        animation={`${floatAnimation} ${3 + Math.random() * 4}s infinite ease-in-out`}
        style={{ animationDelay: `${Math.random() * 2}s` }}
      />
    ));
  };

  return (
    <Box 
      bg="#00b2cb"
      minH="100vh" 
      position="relative" 
      overflow="hidden"
      pt={12}
      pb={20}
      fontFamily="'Inter', sans-serif"
    >
      {backgroundPattern()}
      
      <Container maxW="7xl" px={6} py={12} position="relative" zIndex={1}>
        {/* Hero Section */}
        <MotionBox
          ref={heroRef}
          textAlign="center"
          mb={20}
          p={12}
          borderRadius="3xl"
          bg="rgba(5, 109, 147, 0.89)"
          backdropFilter="blur(10px)"
          boxShadow="0 8px 32px rgba(244, 236, 236, 0.95)"
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{marginTop: "-50px"}}
        >
          <MotionHeading
            as="h1"
            size="2xl"
            color="#ffffff"
            mb={6}
            fontWeight="extrabold"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span style={{ color: "#0305a1" }}>Discover</span> Parcel<span style={{ color: "#f5c800" }}>Pilot</span>
          </MotionHeading>
          <MotionText
            fontSize="xl"
            color="#FFFFFF"
            maxW="3xl"
            mx="auto"
            lineHeight="1.6"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform your shipping with a platform designed for speed, simplicity, and savings.
          </MotionText>
          <MotionBox
            mt={8}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              bg="#faae15"
              color="#FFF"
              size="lg"
              fontWeight="bold"
              px={10}
              py={6}
              borderRadius="full"
              _hover={{ bg: "#FF8C8C", transform: "scale(1.05)", boxShadow: "0 0 20px rgba(255, 107, 107, 0.5)" }}
              transition="all 0.3s"
              onClick={() => window.location.href = '/register'}
            >
              Get Started Now
            </Button>
          </MotionBox>
        </MotionBox>
        
        {/* Steps Timeline Section */}
        <Box ref={stepsRef} mb={32} position="relative">
          {/* Timeline line */}
          {isLargerThan768 && (
            <Box
              position="absolute"
              left="50%"
              top="0"
              bottom="0"
              w="4px"
              bgGradient="linear(to-b, #00C4B4, #E6E6FA)"
              transform="translateX(-50%)"
              zIndex="0"
            />
          )}
          <VStack spacing={24} align="stretch">
            {steps.map((step, index) => (
              <MotionFlex
                key={index}
                direction={{ base: "column", md: "row" }}
                align="center"
                onMouseEnter={() => setHoverStep(index)}
                onMouseLeave={() => setHoverStep(null)}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={stepsInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                position="relative"
                zIndex="1"
              >
                {/* Left side */}
                <Box
                  w={{ base: "full", md: "50%" }}
                  mb={{ base: 8, md: 0 }}
                  order={{ base: 1, md: index % 2 === 1 ? 2 : 1 }}
                >
                  <MotionBox
                    bg="#FFF"
                    borderRadius="3xl"
                    p={10}
                    boxShadow="inset 4px 4px 8px rgba(230, 230, 250, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.9)"
                    transition="all 0.4s"
                    transform={hoverStep === index ? "scale(1.03)" : "scale(1)"}
                    border="1px solid"
                    borderColor="rgba(230, 230, 250, 0.3)"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={stepsInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Flex justify="center" mb={6}>
                      <Circle size="20" bg={step.bgColor} p={4} boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)">
                        {step.icon}
                      </Circle>
                    </Flex>
                    <Heading
                      as="h3"
                      size="lg"
                      textAlign="center"
                      mb={4}
                      color={step.textColor}
                      fontWeight="bold"
                    >
                      {step.title}
                    </Heading>
                    <Text color="#2D3250" textAlign="center" fontSize="md" lineHeight="1.6">
                      {step.description}
                    </Text>
                  </MotionBox>
                </Box>
                
                {/* Arrow connector */}
                <Flex
                  display={{ base: "none", md: "flex" }}
                  justify="center"
                  align="center"
                  w="16"
                  order={{ md: index % 2 === 1 ? 1 : 2 }}
                >
                  <Circle
                    size="12"
                    bg="#00C4B4"
                    boxShadow="0 0 20px rgba(0, 196, 180, 0.5)"
                    zIndex="2"
                  >
                    <CustomArrowRightIcon
                      boxSize={6}
                      color="#FFF"
                      transform={index % 2 === 1 ? "rotate(180deg)" : "none"}
                      transition="all 0.3s"
                    />
                  </Circle>
                </Flex>
                
                {/* Right side - visualization */}
                <Box
                  w={{ base: "full", md: "50%" }}
                  order={{ base: 2, md: index % 2 === 1 ? 1 : 3 }}
                >
                  <MotionBox
                    position="relative"
                    h={{ base: "250px", md: "300px" }}
                    bgGradient={step.gradient}
                    borderRadius="3xl"
                    overflow="hidden"
                    boxShadow="0 10px 30px rgba(0, 0, 0, 0.2)"
                    _hover={{
                      boxShadow: `0 15px 40px ${step.accentColor}80`
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={stepsInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                  >
                    <Flex position="absolute" inset="0" align="center" justify="center">
                      {/* Step number */}
                      <Flex
                        position="absolute"
                        top="6"
                        left="6"
                        bg="#FFF"
                        borderRadius="full"
                        w="50px"
                        h="50px"
                        align="center"
                        justify="center"
                        boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                        fontWeight="extrabold"
                        fontSize="xl"
                        color="#2D3250"
                      >
                        {index + 1}
                      </Flex>
                      
                      {/* Decorative elements */}
                      <Box
                        position="absolute"
                        bottom="-30px"
                        right="-30px"
                        w="160px"
                        h="160px"
                        bg="rgba(255, 255, 255, 0.2)"
                        borderRadius="full"
                      />
                      <Box
                        position="absolute"
                        top="-20px"
                        left="20%"
                        w="80px"
                        h="80px"
                        bg="rgba(255, 255, 255, 0.2)"
                        borderRadius="full"
                      />
                      
                      {/* Main Icon */}
                      <Box
                        transform="scale(1.8)"
                        animation={hoverStep === index ? `${pulseAnimation} 2s infinite ease-in-out` : "none"}
                      >
                        {step.visualIcon}
                      </Box>
                      
                      {/* Particles */}
                      {hoverStep === index && generateParticles(20, step.accentColor)}
                    </Flex>
                  </MotionBox>
                </Box>
              </MotionFlex>
            ))}
          </VStack>
        </Box>
        
        {/* Features Section */}
        <MotionBox
          ref={featuresRef}
          mb={32}
          p={12}
          borderRadius="3xl"
          bg="rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          initial={{ opacity: 0, y: 50 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <MotionHeading
            as="h2"
            size="xl"
            textAlign="center"
            mb={16}
            color="#000c83"
            fontWeight="extrabold"
            position="relative"
            _after={{
              content: '""',
              display: 'block',
              width: '100px',
              height: '4px',
              bgGradient: 'linear(to-r, #00C4B4, #FF6B6B)',
              borderRadius: 'full',
              mx: 'auto',
              mt: '4'
            }}
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Why <span style={{ color: "#ffffff" }}>Parcel</span><span style={{ color: "#fed924" }}>Pilot</span>
          </MotionHeading>
          <MotionGrid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap={8}
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
          >
            {features.map((feature, index) => (
              <MotionBox
                key={index}
                bg={feature.bg}
                borderRadius="2xl"
                p={8}
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-10px)",
                  boxShadow: `0 10px 20px ${feature.accentColor}80`
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Flex
                  justify="center"
                  mb={6}
                  bg="#FFF"
                  w="16"
                  h="16"
                  borderRadius="full"
                  align="center"
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                >
                  {feature.icon}
                </Flex>
                <Heading as="h3" size="md" fontWeight="bold" textAlign="center" mb={3} color="#2D3250">
                  {feature.title}
                </Heading>
                <Text color="#2D3250" textAlign="center" fontSize="sm" lineHeight="1.6">
                  {feature.description}
                </Text>
              </MotionBox>
            ))}
          </MotionGrid>
        </MotionBox>
        
        {/* CTA Section */}
        <MotionBox
          ref={ctaRef}
          bgGradient="linear(to-r, #00C4B4, #FF6B6B)"
          borderRadius="3xl"
          p={{ base: 10, md: 16 }}
          textAlign="center"
          color="#FFF"
          boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
          position="relative"
          overflow="hidden"
          mb={12}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {generateParticles(30, "#FFF")}
          <MotionHeading
            as="h2"
            size="2xl"
            mb={6}
            fontWeight="extrabold"
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Start Shipping Smarter
          </MotionHeading>
          <MotionText
            fontSize="lg"
            mb={10}
            maxW="3xl"
            mx="auto"
            lineHeight="1.6"
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join thousands of businesses revolutionizing their logistics with ParcelPilot.
          </MotionText>
          <MotionFlex
            direction={{ base: "column", sm: "row" }}
            justify="center"
            gap={6}
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              bg="#FFD700"
              color="#2D3250"
              size="lg"
              fontWeight="bold"
              px={12}
              py={7}
              borderRadius="full"
              _hover={{ bg: "#FFE766", transform: "scale(1.05)", boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)" }}
              transition="all 0.3s"
              onClick={() => window.location.href = '/register'}
            >
              Try for Free
            </Button>
          </MotionFlex>
        </MotionBox>
      </Container>
    </Box>
  );
}