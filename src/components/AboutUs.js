import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Flex,
  Button,
  useColorModeValue,
  Stack,
  Icon,
} from '@chakra-ui/react';
import { FaRocket, FaHeadset, FaLeaf } from 'react-icons/fa';

const AboutUs = () => {
  // Colors for light/dark mode backgrounds
  const bgColor = useColorModeValue('#f7fafc', '#1a202c');
  const cardBg = useColorModeValue('#ffffff', '#2d3748');
  const textColor = useColorModeValue('#4a5568', '#e2e8f0');
  // Precompute Timeline background colors
  const timelineBgEven = useColorModeValue('#f7fafc', '#2d3748');
  const timelineBgOdd = useColorModeValue('#ffffff', '#2d3748');
  const timelineHoverBg = useColorModeValue('#edf2f7', '#4a5568');

  // Define colors locally
  const primaryBlue = '#007bff';
  const vibrantOrange = '#ff6200';
  const richPurple = '#6b46c1';
  const heroGradient = 'linear-gradient(135deg, #007bff 0%, #6b46c1 100%)';
  const ctaGradient = 'linear-gradient(135deg, #ff6200 0%, #6b46c1 100%)';
  const sectionGradient = 'linear-gradient(to bottom, #ffffff, #edf2f7)';
  const darkSectionGradient = 'linear-gradient(to bottom, #2d3748, #1a202c)';
  const blueToPurple = 'linear-gradient(to right, #007bff, #6b46c1)';
  const purpleToOrange = 'linear-gradient(to right, #6b46c1, #ff6200)';
  const orangeToBlue = 'linear-gradient(to right, #ff6200, #007bff)';

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient={heroGradient}
        color="#ffffff"
        py={{ base: '80px', md: '120px' }}
        textAlign="center"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1,
        }}
      >
        <Container maxW="container.lg" position="relative" zIndex={2}>
          <Heading
            as="h1"
            fontSize={{ base: '4xl', md: '5xl' }}
            mb="24px"
            fontWeight="bold"
            fontFamily="'Poppins', sans-serif"
          >
            About Parcel Pilot
          </Heading>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            maxW="700px"
            mx="auto"
            mb="32px"
            fontFamily="'Open Sans', sans-serif"
          >
            Parcel Pilot is Canada’s trusted shipping partner, serving businesses and individuals nationwide. Specializing in domestic shipping, we provide competitive rates and innovative technology to streamline logistics. Join us to experience efficient, reliable shipping tailored for Canada.
          </Text>
          <Button
            size="lg"
            bg={vibrantOrange}
            color="#ffffff"
            fontWeight="bold"
            borderRadius="md"
            px="32px"
            py="12px"
            _hover={{
              bg: '#cc4e00',
              transform: 'scale(1.05)',
              transition: 'all 0.2s',
            }}
            as="a"
            href="/register"
            fontFamily="'Poppins', sans-serif"
          >
            Start Shipping Now
          </Button>
        </Container>
      </Box>

      {/* Who We Are Section */}
      <Container maxW="container.xl" py={{ base: '64px', md: '96px' }}>
        <VStack spacing="40px" textAlign="center">
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            bgGradient={blueToPurple}
            bgClip="text"
            fontFamily="'Poppins', sans-serif"
          >
            Who We Are
          </Heading>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color={textColor}
            maxW="900px"
            lineHeight="1.8"
            fontFamily="'Open Sans', sans-serif"
          >
            Founded in Toronto in 2020, Parcel Pilot was created to address the shipping needs of Canadian businesses. We’re committed to connecting communities across Canada with affordable, reliable domestic shipping and empowering businesses to expand internationally. Our platform offers a seamless experience, from rate comparisons to tracking, backed by technology designed for efficiency. Our team, driven by Canadian values of trust and innovation, provides 24/7 support to ensure your shipments are delivered on time. With integrations for platforms like Shopify, we help small businesses and entrepreneurs thrive in a competitive market. At Parcel Pilot, we’re more than a shipping platform—we’re your partner in building success across Canada and beyond.
          </Text>
          <Button
            size="lg"
            border="2px solid"
            borderColor={vibrantOrange}
            color={vibrantOrange}
            bg="transparent"
            fontWeight="bold"
            borderRadius="md"
            px="32px"
            py="12px"
            _hover={{
              bg: vibrantOrange,
              color: '#ffffff',
              transform: 'scale(1.05)',
              transition: 'all 0.2s',
            }}
            as="a"
            href="/how-it-works"
            fontFamily="'Poppins', sans-serif"
          >
            See How It Works
          </Button>
        </VStack>
      </Container>

      {/* Our Mission Section */}
      <Box
        bg={cardBg}
        py={{ base: '64px', md: '96px' }}
        borderTop="4px solid"
        borderColor={richPurple}
      >
        <Container maxW="container.xl">
          <VStack spacing="40px" textAlign="center">
            <Heading
              as="h2"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              bgGradient={purpleToOrange}
              bgClip="text"
              fontFamily="'Poppins', sans-serif"
            >
              Our Mission
            </Heading>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color={textColor}
              maxW="900px"
              lineHeight="1.8"
              fontFamily="'Open Sans', sans-serif"
            >
              Parcel Pilot helps Canadian Shopify sellers ship across Canada easily and affordably. Our mission is to make domestic shipping simple, fast, and cost-effective, so you can focus on growing your business.

With real-time tracking and seamless Shopify integration, managing shipments has never been easier. We’re committed to providing reliable service and friendly support, helping Canadian businesses of all sizes succeed.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* What We Do Section */}
      <Container maxW="container.xl" py={{ base: '64px', md: '96px' }}>
        <VStack spacing="40px" textAlign="center">
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            bgGradient={orangeToBlue}
            bgClip="text"
            fontFamily="'Poppins', sans-serif"
          >
            What We Do
          </Heading>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            color={textColor}
            maxW="900px"
            lineHeight="1.8"
            fontFamily="'Open Sans', sans-serif"
          >
            Parcel Pilot makes shipping simple for Canadian Shopify businesses. We provide discounted rates from trusted couriers for shipments across Canada, along with tools to manage your orders efficiently.

Our platform is built with Canadian entrepreneurs in mind, featuring seamless Shopify integration to save you time and effort.

With our Canada-based support team, every shipment is handled with care, giving you reliability and peace of mind. With Parcel Pilot, shipping becomes easy, affordable, and stress-free for your business.
          </Text>
        </VStack>
      </Container>

      {/* Values Section */}
      <Box
        bgGradient={useColorModeValue(sectionGradient, darkSectionGradient)}
        py={{ base: '64px', md: '96px' }}
      >
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            textAlign="center"
            mb="48px"
            bgGradient={blueToPurple}
            bgClip="text"
            fontFamily="'Poppins', sans-serif"
          >
            Our Core Values
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="32px">
            <VStack
              bg={cardBg}
              p="32px"
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
              spacing="16px"
              align="center"
              _hover={{
                transform: 'scale(1.03)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s',
              }}
            >
              <Icon as={FaRocket} w="56px" h="56px" color={primaryBlue} />
              <Heading
                as="h3"
                fontSize="xl"
                fontWeight="bold"
                color={primaryBlue}
                fontFamily="'Poppins', sans-serif"
              >
                Efficiency
              </Heading>
              <Text
                color={textColor}
                fontSize="md"
                textAlign="center"
                fontFamily="'Open Sans', sans-serif"
              >
                We streamline shipping nationwide, ensuring packages move quickly and cost-effectively from urban centers to remote communities.
              </Text>
            </VStack>
            <VStack
              bg={cardBg}
              p="32px"
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
              spacing="16px"
              align="center"
              _hover={{
                transform: 'scale(1.03)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s',
              }}
            >
              <Icon as={FaHeadset} w="56px" h="56px" color={richPurple} />
              <Heading
                as="h3"
                fontSize="xl"
                fontWeight="bold"
                color={richPurple}
                fontFamily="'Poppins', sans-serif"
              >
                Canadian Support
              </Heading>
              <Text
                color={textColor}
                fontSize="md"
                textAlign="center"
                fontFamily="'Open Sans', sans-serif"
              >
                Our Canada-based team offers 24/7 assistance, delivering personalized service with reliability and care.
              </Text>
            </VStack>
            <VStack
              bg={cardBg}
              p="32px"
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
              spacing="16px"
              align="center"
              _hover={{
                transform: 'scale(1.03)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s',
              }}
            >
              <Icon as={FaLeaf} w="56px" h="56px" color={vibrantOrange} />
              <Heading
                as="h3"
                fontSize="xl"
                fontWeight="bold"
                color={vibrantOrange}
                fontFamily="'Poppins', sans-serif"
              >
                Canadian Pride
              </Heading>
              <Text
                color={textColor}
                fontSize="md"
                textAlign="center"
                fontFamily="'Open Sans', sans-serif"
              >
                We champion Canada’s entrepreneurial spirit, supporting businesses to succeed locally and on the global stage.
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Timeline Section */}
      <Box
        bg={cardBg}
        py={{ base: '64px', md: '96px' }}
        borderTop="4px solid"
        borderColor={vibrantOrange}
      >
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            textAlign="center"
            mb="48px"
            bgGradient={purpleToOrange}
            bgClip="text"
            fontFamily="'Poppins', sans-serif"
          >
            Our Canadian Journey
          </Heading>
          <Stack spacing="32px">
            {[
              {
                year: '2020',
                event: 'Founded in Canada',
                details: 'Parcel Pilot launched with a mission to simplify shipping for Canadian businesses.',
              },
              {
                year: '2021',
                event: 'Serving 1,000 Customers',
                details: 'Became a trusted platform for small businesses seeking affordable shipping solutions.',
              },
              {
                year: '2023',
                event: 'Nationwide Growth',
                details: 'Expanded partnerships with couriers to serve businesses across Canada.',
              },
              {
                year: '2025',
                event: 'Leading the Industry',
                details: 'Recognized as a top platform for domestic shipping in Canada.',
              },
            ].map((milestone, index) => (
              <Flex
                key={index}
                align="center"
                direction={{ base: 'column', md: 'row' }}
                bg={index % 2 === 0 ? timelineBgEven : timelineBgOdd}
                p="24px"
                borderRadius="lg"
                _hover={{
                  bg: timelineHoverBg,
                  transition: 'all 0.3s',
                }}
              >
                <Box
                  bgGradient={blueToPurple}
                  color="#ffffff"
                  px="24px"
                  py="12px"
                  borderRadius="md"
                  minW="120px"
                  textAlign="center"
                  mr={{ base: 0, md: '32px' }}
                  mb={{ base: '16px', md: 0 }}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="lg"
                    fontFamily="'Poppins', sans-serif"
                  >
                    {milestone.year}
                  </Text>
                </Box>
                <Box>
                  <Heading
                    as="h3"
                    fontSize="lg"
                    fontWeight="bold"
                    mb="8px"
                    color={primaryBlue}
                    fontFamily="'Poppins', sans-serif"
                  >
                    {milestone.event}
                  </Heading>
                  <Text
                    color={textColor}
                    fontSize="md"
                    fontFamily="'Open Sans', sans-serif"
                  >
                    {milestone.details}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        bgGradient={ctaGradient}
        color="#ffffff"
        py={{ base: '80px', md: '120px' }}
        textAlign="center"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      >
        <Container maxW="container.lg" position="relative" zIndex={2}>
          <Heading
            as="h2"
            fontSize={{ base: '4xl', md: '5xl' }}
            fontWeight="bold"
            mb="24px"
            fontFamily="'Poppins', sans-serif"
          >
            Ship with Confidence
          </Heading>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            mb="32px"
            maxW="700px"
            mx="auto"
            fontFamily="'Open Sans', sans-serif"
          >
            Ready to optimize your shipping across Canada? Join thousands of Canadian businesses trusting Parcel Pilot for affordable rates, innovative tools, and exceptional support.
          </Text>
          <Button
            size="lg"
            bg={vibrantOrange}
            color="#ffffff"
            fontWeight="bold"
            borderRadius="md"
            px="32px"
            py="12px"
            _hover={{
              bg: '#cc4e00',
              transform: 'scale(1.1)',
              transition: 'all 0.3s',
            }}
            as="a"
            href="/register"
            fontFamily="'Poppins', sans-serif"
          >
            Get Started Today
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutUs;