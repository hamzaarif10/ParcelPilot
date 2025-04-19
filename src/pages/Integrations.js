import { useState, useEffect } from "react";
import { 
  Box, Button, Text, VStack, Icon, Input, Modal, 
  ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, 
  ModalCloseButton, useDisclosure, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  Flex, Heading, Badge, useToast, HStack, Divider, Tooltip
} from "@chakra-ui/react";
import { FaStore, FaSync, FaShippingFast, FaLink, FaBoxOpen, FaPlug } from "react-icons/fa";
import SideBar from "../components/SideBar.js";
import axios from 'axios';
import ShipShopifyOrderModal from "../modals/ShipShopifyOrderModal.js";

function Integrations() {
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [isShopifyIntegrated, setIsShopifyIntegrated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const toast = useToast();

  const { isOpen: isShopifyModalOpen, onOpen: onShopifyModalOpen, onClose: onShopifyModalClose } = useDisclosure();
  const { isOpen: isShipOrderModalOpen, onOpen: onShipOrderModalOpen, onClose: onShipOrderModalClose } = useDisclosure();

  useEffect(() => {
    async function getShopifyToken() {
      const token = localStorage.getItem("authToken");
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.shopify_access_token) {
          setIsShopifyIntegrated(true);
          syncOrders(true);
        } else {
          setIsShopifyIntegrated(false);
        }
      } catch (error) {
        console.error("Error fetching Shopify token:", error);
        toast({
          title: "Connection Error",
          description: "Unable to verify integration status.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right"
        });
      } finally {
        setLoading(false);
      }
    }
    getShopifyToken();
  }, [toast]);

  async function handleConnectShopify(shopifyDomain) {
    if (!shopifyDomain.includes('.myshopify.com')) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid store domain ending with .myshopify.com",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
      return;
    }
    
    const token = localStorage.getItem("authToken");
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/save-shopify-domain`, 
        { shopifyDomain }, 
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const oauthUrl = `https://${shopifyDomain}/admin/oauth/authorize?client_id=${process.env.REACT_APP_SHOPIFY_CLIENT_ID}&scope=${process.env.REACT_APP_SHOPIFY_SCOPE}&redirect_uri=${process.env.REACT_APP_SHOPIFY_REDIRECT_URI}`;
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Error connecting to Shopify:", error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to your store. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
    }
  }

  const syncOrders = async (showAnimation = false) => {
    const token = localStorage.getItem("authToken");
    let shopifyDomain = "";
    let shopifyAccessToken = "";
    setLoading(true);
    setShowLoadingAnimation(showAnimation);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      shopifyDomain = response.data.shopify_domain;
      shopifyAccessToken = response.data.shopify_access_token;
    } catch (error) {
      console.error("Error retrieving Shopify domain name or access token:", error);
      toast({
        title: "Authentication Error",
        description: "Unable to retrieve store credentials.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/fetchShopifyOrders/orders/sync`, {
        params: { shopifyDomain, shopifyAccessToken },
      });
      setOrders(response.data.orders);
      toast({
        title: "Orders Synced",
        description: `Successfully synced ${response.data.orders.length} orders from your store.`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right"
      });
    } catch (error) {
      console.error("Error syncing orders:", error);
      toast({
        title: "Sync Failed",
        description: "Unable to sync orders from your store.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
    } finally {
      setLoading(false);
      setShowLoadingAnimation(false);
    }
  };

  const handleShipOrder = (order) => {
    setSelectedOrder(order);
    onShipOrderModalOpen();
  };

  return (
    <Box display="flex" minHeight="100vh" bg="gray.50">
      <Box w={{ base: "80px", md: "250px" }} bg="blue.900" color="white" shadow="lg">
        <SideBar />
      </Box>

      <Box flex="1" p={6} overflowY="auto">
        <Flex direction="column" h="100%">
          {/* Header */}
          <Flex mb={6} justify="space-between" align="center">
            <Box>
              <Heading size="lg" color="blue.800" fontWeight="bold">
                Integrations
              </Heading>
              <Text color="gray.600" mt={1}>
                Connect your store platforms and manage your orders
              </Text>
            </Box>
            {isShopifyIntegrated && (
              <HStack spacing={4}>
                <Badge colorScheme="green" px={3} py={2} borderRadius="md" fontSize="sm">
                  <Flex align="center">
                    <Icon as={FaStore} mr={2} />
                    Store Connected
                  </Flex>
                </Badge>
                <Tooltip label="Sync latest orders">
                  <Button 
                    colorScheme="blue" 
                    size="md" 
                    onClick={() => syncOrders(true)} 
                    isLoading={loading}
                    leftIcon={<FaSync />}
                    variant="outline"
                  >
                    Sync Orders
                  </Button>
                </Tooltip>
              </HStack>
            )}
          </Flex>

          {loading && showLoadingAnimation ? (
            <VStack justify="center" align="center" flex="1" spacing={6}>
              <Spinner size="xl" thickness="4px" color="blue.500" emptyColor="gray.200" />
              <Text mt={4} color="gray.600" fontSize="lg">
                Syncing with your store...
              </Text>
            </VStack>
          ) : !isShopifyIntegrated ? (
            <Flex justify="center" align="center" flex="1">
              <VStack
                bg="white" 
                p={8} 
                borderRadius="xl" 
                shadow="xl" 
                spacing={6}
                maxW="500px"
                mx="auto"
                textAlign="center"
                borderTop="4px solid"
                borderColor="blue.500"
              >
                <Flex 
                  justify="center" 
                  align="center" 
                  bg="blue.50" 
                  w={20} 
                  h={20} 
                  borderRadius="full"
                >
                  <Icon as={FaPlug} boxSize={10} color="blue.500" />
                </Flex>
                <Box>
                  <Heading size="md" fontWeight="bold" color="gray.800">
                    Connect Your Store
                  </Heading>
                  <Text fontSize="md" color="gray.600" mt={2} lineHeight="tall">
                    Import your store orders seamlessly and automate your shipping process.
                    Manage all your orders in one place.
                  </Text>
                </Box>
                <Divider />
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={onShopifyModalOpen}
                  rightIcon={<FaLink />}
                  px={8}
                  py={6}
                  fontWeight="bold"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Connect My Store
                </Button>
              </VStack>
            </Flex>
          ) : (
            <Box bg="white" borderRadius="xl" shadow="md" overflow="hidden" borderTop="4px solid" borderColor="blue.500">
              <Box p={4} bg="blue.50">
                <Heading size="md" color="blue.800">
                  <Flex align="center">
                    <Icon as={FaBoxOpen} mr={2} />
                    Store Orders
                  </Flex>
                </Heading>
              </Box>

              {orders.length === 0 ? (
                <VStack py={10} px={4}>
                  <Text color="gray.500">No orders found. Sync to fetch latest orders.</Text>
                </VStack>
              ) : (
                <Box overflowX="auto">
                  <Table
                    key={orders.length}
                    variant="simple" 
                    size="md" 
                    width="100%"
                  >
                    <Thead bg="gray.50">
                      <Tr>
                        <Th color="gray.600" fontSize="sm" fontWeight="semibold" py={4}>
                          Customer
                        </Th>
                        <Th color="gray.600" fontSize="sm" fontWeight="semibold" py={4}>
                          Shipping Address
                        </Th>
                        <Th color="gray.600" fontSize="sm" fontWeight="semibold" py={4}>
                          Contact
                        </Th>
                        <Th color="gray.600" fontSize="sm" fontWeight="semibold" py={4} textAlign="center">
                          Actions
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {orders.map((order, index) => (
                        <Tr 
                          key={order.id} 
                          _hover={{ bg: "blue.50" }}
                          bg={index % 2 === 0 ? "white" : "gray.50"}
                          transition="background-color 0.2s"
                          borderBottom="1px" 
                          borderColor="gray.100"
                        >
                          <Td py={4}>
                            <Text fontWeight="medium" color="gray.800">
                              {`${order.customer.firstName} ${order.customer.lastName}`}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                              Order #{order.id.split('/').pop()}
                            </Text>
                          </Td>
                          <Td fontSize="sm" py={4}>
                            <Text color="gray.700">
                              {order.shippingAddress.address1}
                              {order.shippingAddress.address2 && `, ${order.shippingAddress.address2}`}
                            </Text>
                            <Text color="gray.700">
                              {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                              {order.shippingAddress.country}
                            </Text>
                          </Td>
                          <Td fontSize="sm" py={4}>
                            {order.customer.phone && (
                              <Text color="gray.700">
                                {/* Mask phone number, showing only last 4 digits */}
                                {order.customer.phone.replace(/^(.*)(\d{4})$/, '••••••$2')}
                              </Text>
                            )}
                            <Text color="blue.600">
                              {/* Mask email, showing only first part and domain */}
                              {order.customer.email ? 
                                `${order.customer.email.split('@')[0].substring(0, 3)}•••@${order.customer.email.split('@')[1]}` : 
                                "N/A"}
                            </Text>
                          </Td>
                          <Td textAlign="center" py={4}>
                            <Button
                              colorScheme="blue" 
                              size="md" 
                              onClick={() => handleShipOrder(order)}
                              leftIcon={<FaShippingFast />}
                              borderRadius="md"
                              _hover={{ bg: "blue.600" }}
                              shadow="sm"
                            >
                              Ship Order
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </Flex>
      </Box>

      {/* Connect Store Modal */}
      <Modal 
        isOpen={isShopifyModalOpen} 
        onClose={() => {
          onShopifyModalClose();
          setShopifyDomain('');
        }} 
        size="lg"
        key={isShopifyModalOpen ? 'open' : 'closed'}
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" shadow="2xl">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100" py={4} px={6}>
            <Flex align="center">
              <Icon as={FaStore} mr={3} color="blue.500" />
              <Text>Connect Your Store</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} px={6}>
          <VStack spacing={4} align="stretch">
            <Text>Please enter your store domain:</Text>
            <Input
              value={shopifyDomain}
              onChange={(e) => setShopifyDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              size="lg"
              borderRadius="md"
              borderColor="gray.300"
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
            />
            <Text fontSize="sm" color="gray.500">
              Your domain should end with .myshopify.com
            </Text>
            {/* Add privacy disclosure */}
            <Box p={3} bg="blue.50" borderRadius="md" fontSize="sm">
              <Text fontWeight="medium" mb={1}>Data Access Information:</Text>
              <Text>By connecting, we'll access order information including customer names, addresses, phone numbers, and emails as well as order details solely for order fulfillment purposes. See our 
                 <Button variant="link" colorScheme="blue" onClick={() => window.open('/privacy-policy', '_blank')}>Privacy Policy</Button> for details on how we handle and protect customer data.</Text>
            </Box>
          </VStack>
        </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth="1px" borderColor="gray.100" borderBottomRadius="xl" px={6} py={4}>
            <HStack spacing={3}>
              <Button 
                onClick={onShopifyModalClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                colorScheme="blue"
                onClick={() => handleConnectShopify(shopifyDomain)}
                disabled={!shopifyDomain}
                leftIcon={<FaLink />}
                px={6}
              >
                Connect Now
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ship Order Modal */}
      {selectedOrder && (
        <ShipShopifyOrderModal 
          isOpen={isShipOrderModalOpen} 
          onClose={() => {
            onShipOrderModalClose();
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </Box>
  );
}
export default Integrations;
