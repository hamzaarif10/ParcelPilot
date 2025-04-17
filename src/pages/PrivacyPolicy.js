import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  Container,
  Stack,
} from "@chakra-ui/react";

const PrivacyPolicy = () => {
  return (
    <Container maxW="6xl" py={10} px={10} bg="white" boxShadow="xl" borderRadius="lg">
      <Stack spacing={10} align="flex-start">
        <Box width="100%">
          <Heading as="h1" fontSize="4xl" fontWeight="bold" color="teal.700" textAlign="left">
            Privacy Policy
          </Heading>
          <Text fontSize="md" color="gray.600" mt={2} textAlign="left">
            Last Updated: {new Date().toLocaleDateString()}
          </Text>
        </Box>

        <Divider />

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            1. Introduction
          </Heading>
          <Text color="gray.700" textAlign="left">
            At ParcelPilot, your privacy is paramount. This Privacy Policy outlines our data practices when using our Shopify-integrated shipping and fulfillment app. By using our service, you agree to the terms outlined below.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            2. Information We Collect
          </Heading>
          <Text color="gray.700" textAlign="left">
            We collect the minimum personal data necessary to provide our core services:
          </Text>
          <Box pl={6} pt={2} width="100%" textAlign="left">
            <ul style={{ listStyleType: "disc", textAlign: "left" }}>
              <li>Full name and shipping address of the recipient</li>
              <li>Email address for shipping updates</li>
              <li>Phone number for delivery coordination</li>
              <li>Order details including item name, quantity</li>
            </ul>
          </Box>
          <Text mt={3} color="gray.700" textAlign="left">
            We do not collect payment information, passwords, or sensitive identification data.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            3. Why We Collect This Data
          </Heading>
          <Text color="gray.700" textAlign="left">
            The data is used exclusively to fulfill shipments and provide logistical support:
          </Text>
          <Box pl={6} pt={2} width="100%" textAlign="left">
            <ul style={{ listStyleType: "disc", textAlign: "left" }}>
              <li>To generate accurate shipping labels</li>
              <li>To calculate real-time courier rates</li>
              <li>To update order fulfillment status in Shopify</li>
              <li>To resolve shipping issues or inquiries</li>
            </ul>
          </Box>
          <Text mt={3} color="gray.700" textAlign="left">
            We never use this data for marketing, data profiling, or third-party sales.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            4. Data Retention
          </Heading>
          <Text color="gray.700" textAlign="left">
            We retain customer and shipment data only as long as necessary to complete fulfillment and comply with regulatory obligations. Data is regularly purged, and merchants can request early deletion upon written notice.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            5. Data Security
          </Heading>
          <Text color="gray.700" textAlign="left">
            All data is encrypted both in transit and at rest. Access is limited to essential personnel. We regularly audit our systems to prevent unauthorized access.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            6. Access Logs
          </Heading>
          <Text color="gray.700" textAlign="left">
            Every request to protected customer data is logged with a timestamp and purpose. Logs are reviewed to ensure data is accessed responsibly, in accordance with Shopify's protected customer data policy.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            7. Third-Party Services
          </Heading>
          <Text color="gray.700" textAlign="left">
            We use shipping APIs strictly to perform shipment-related tasks. These services are contractually required to protect customer data.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            8. Your Rights
          </Heading>
          <Text color="gray.700" textAlign="left">
            You may access, correct, or request deletion of your personal data at any time. Merchants may submit data access or deletion requests by contacting us using the information below.
          </Text>
        </Box>

        <Box width="100%">
          <Heading as="h2" fontSize="2xl" mb={3} color="teal.600" textAlign="left">
            9. Contact Us
          </Heading>
          <Text color="gray.700" textAlign="left">
            For questions about this Privacy Policy, please contact us:
            <br />
            <strong>Email:</strong> support@parcelpilot.ca
          </Text>
        </Box>
      </Stack>
    </Container>
  );
};

export default PrivacyPolicy;



