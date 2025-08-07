import { useState, useEffect } from "react";
import { 
  Box, Button, Text, VStack, Icon, Input, Modal, 
  ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalFooter, 
  ModalCloseButton, useDisclosure, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  Flex, Heading, Badge, useToast, HStack, Divider, Tooltip, Link, Code, OrderedList, ListItem
} from "@chakra-ui/react";
import { FaStore, FaSync, FaShippingFast, FaTrash, FaLink, FaBoxOpen, FaPlug, FaExternalLinkAlt } from "react-icons/fa";
import SideBar from "../components/SideBar.js";
import axios from 'axios';
import ShipShopifyOrderModal from "../modals/ShipShopifyOrderModal.js";

function Integrations() {
  const [isShopifyIntegrated, setIsShopifyIntegrated] = useState(false);
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('shopifyOrders');
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        // Validate that it's an array and has valid structure
        if (Array.isArray(parsedOrders)) {
          return parsedOrders;
        }
      }
    } catch (error) {
      console.warn('Error loading orders from localStorage:', error);
      localStorage.removeItem('shopifyOrders'); // Clear corrupted data
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Rate limiting state
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const stored = localStorage.getItem('lastSyncTime');
    return stored ? parseInt(stored) : null;
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const toast = useToast();
  const RATE_LIMIT_MINUTES = 3;
  const RATE_LIMIT_MS = RATE_LIMIT_MINUTES * 10 * 1000; // 3 minutes in milliseconds

  const { isOpen: isInstallModalOpen, onOpen: onInstallModalOpen, onClose: onInstallModalClose } = useDisclosure();
  const { isOpen: isShipOrderModalOpen, onOpen: onShipOrderModalOpen, onClose: onShipOrderModalClose } = useDisclosure();

  // Rate limiting effect
  useEffect(() => {
    let interval;
    
    if (lastSyncTime) {
      const checkRateLimit = () => {
        const now = Date.now();
        const timeDiff = now - lastSyncTime;
        const remaining = RATE_LIMIT_MS - timeDiff;
        
        if (remaining > 0) {
          setIsRateLimited(true);
          setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
        } else {
          setIsRateLimited(false);
          setTimeRemaining(0);
          // Clear from localStorage when rate limit expires
          localStorage.removeItem('lastSyncTime');
          setLastSyncTime(null);
          if (interval) {
            clearInterval(interval);
          }
        }
      };
      
      // Check immediately
      checkRateLimit();
      
      // Then check every second if rate limited
      if (isRateLimited) {
        interval = setInterval(checkRateLimit, 1000);
      }
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastSyncTime, isRateLimited, RATE_LIMIT_MS]);

  // Format time remaining for display
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function checkIntegrationStatus() {
      const token = localStorage.getItem("authToken");
      
      // Check if we're returning from Shopify installation
      const params = new URLSearchParams(window.location.search);
      const shop = params.get('shop');
      const host = params.get('host');
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/get-shopify-auth-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.shopify_access_token) {
          setIsShopifyIntegrated(true);
          // Only auto-sync if we're returning from Shopify installation
          if (shop || host) {
            syncOrders(true);
          } else {
            setLoading(false);
            setShowLoadingAnimation(false);
          }
        } else {
          setIsShopifyIntegrated(false);
          setLoading(false);
          setShowLoadingAnimation(false);
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
        setLoading(false);
        setShowLoadingAnimation(false);
      }
    }
    checkIntegrationStatus();
  }, [toast]);

  const syncOrders = async (showAnimation = false) => {
    // Check rate limit
    if (isRateLimited) {
      toast({
        title: "Rate Limited",
        description: `Please wait ${formatTimeRemaining(timeRemaining)} before syncing again.`,
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right"
      });
      return;
    }

    const token = localStorage.getItem("authToken");
    let shopifyDomain = "";
    let shopifyAccessToken = "";
    setLoading(true);
    setShowLoadingAnimation(showAnimation);
    
    // Set the sync time at the start of the request
    const syncTime = Date.now();
    setLastSyncTime(syncTime);
    localStorage.setItem('lastSyncTime', syncTime.toString());
    
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
      // Reset rate limit if sync failed
      localStorage.removeItem('lastSyncTime');
      setLastSyncTime(null);
      setIsRateLimited(false);
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/fetchShopifyOrders/orders/sync`, {
        params: { shopifyDomain, shopifyAccessToken },
      });
      setOrders(response.data.orders);
      // Persist orders to localStorage
      localStorage.setItem('shopifyOrders', JSON.stringify(response.data.orders));
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
      // Reset rate limit if sync failed
      localStorage.removeItem('lastSyncTime');
      setLastSyncTime(null);
      setIsRateLimited(false);
    } finally {
      setLoading(false);
      setShowLoadingAnimation(false);
    }
  };

  const handleShipOrder = (order) => {
    setSelectedOrder(order);
    onShipOrderModalOpen();
  };

  // Remove the test install URL function since we're showing the URL template instead
  const copyInstallUrl = (storeSubdomain) => {
    if (!storeSubdomain) {
      toast({
        title: "Store subdomain required",
        description: "Please enter your store subdomain to generate the install URL",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right"
      });
      return;
    }
    
    const installUrl = `https://${storeSubdomain}.myshopify.com/admin/oauth/authorize?client_id=${process.env.REACT_APP_SHOPIFY_CLIENT_ID}&scope=${process.env.REACT_APP_SHOPIFY_SCOPE}&redirect_uri=${process.env.REACT_APP_SHOPIFY_REDIRECT_URI}`;
    
    navigator.clipboard.writeText(installUrl).then(() => {
      toast({
        title: "URL Copied!",
        description: "Installation URL copied to clipboard",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right"
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right"
      });
    });
  };

  const handleDeleteStore = async() => {
    if (window.confirm('Are you sure you want to delete this store connection?')) {
      // Perform deletion logic here
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.patch(
          `${process.env.REACT_APP_BACKEND_URL}/auth/delete-shop`,
          {}, // empty data object for PATCH
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Clear stored orders when disconnecting store
        localStorage.removeItem('shopifyOrders');
        localStorage.removeItem('lastSyncTime');
        
        toast({
          title: "Store Disconnected.",
          description: "Your Shopify store connection has been removed.",
          status: "success",
          duration: 4000,
          isClosable: true,
          position: "bottom-right"
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error disconnecting shopify store:", error);
        toast({
          title: "Error",
          description: "Unable to disconnect store.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom-right"
        });
      }
    };
  }

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
                  <Tooltip 
                    label={
                      isRateLimited 
                        ? `Rate limited. Wait ${formatTimeRemaining(timeRemaining)} before syncing again.`
                        : "Sync latest orders"
                    }
                  >
                    <Button 
                      colorScheme="blue" 
                      size="md" 
                      onClick={() => syncOrders(true)} 
                      isLoading={loading}
                      isDisabled={isRateLimited}
                      leftIcon={<FaSync />}
                      variant="outline"
                    >
                      {isRateLimited ? `Sync (${formatTimeRemaining(timeRemaining)})` : "Sync Orders"}
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete store connection">
                    <Button 
                      colorScheme="red" 
                      size="md" 
                      onClick={() => handleDeleteStore()} 
                      leftIcon={<FaTrash />}
                      variant="outline"
                    >
                      Delete Store
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
                    Connect Your Shopify Store
                  </Heading>
                  <Text fontSize="md" color="gray.600" mt={2} lineHeight="tall">
                    Install our app directly from your Shopify admin to import orders 
                    and automate your shipping process.
                  </Text>
                </Box>
                <Divider />
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={onInstallModalOpen}
                  rightIcon={<FaExternalLinkAlt />}
                  px={8}
                  py={6}
                  fontWeight="bold"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  View Installation Instructions
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
                              {order.customer ? 
                                `${order.customer.firstName || 'Unknown'} ${order.customer.lastName || ''}` : 
                                'Unknown Customer'
                              }
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                              Order #{order.id ? order.id.split('/').pop() : 'Unknown'}
                            </Text>
                          </Td>
                          <Td fontSize="sm" py={4}>
                            {order.shippingAddress ? (
                              <>
                                <Text color="gray.700">
                                  {order.shippingAddress.address1 || 'No address'}
                                  {order.shippingAddress.address2 && `, ${order.shippingAddress.address2}`}
                                </Text>
                                <Text color="gray.700">
                                  {order.shippingAddress.city || 'Unknown'}, {order.shippingAddress.province || 'Unknown'} {order.shippingAddress.zip || ''}
                                </Text>
                                <Text color="gray.600" fontSize="sm">
                                  {order.shippingAddress.country || 'Unknown'}
                                </Text>
                              </>
                            ) : (
                              <Text color="gray.500" fontSize="sm">
                                No shipping address
                              </Text>
                            )}
                          </Td>
                          <Td fontSize="sm" py={4}>
                            {order.customer?.phone && (
                              <Text color="gray.700">
                                {order.customer.phone.replace(/^(.*)(\d{4})$/, '••••••$2')}
                              </Text>
                            )}
                            <Text color="blue.600">
                              {order.customer?.email ? 
                                `${order.customer.email.split('@')[0].substring(0, 3)}•••@${order.customer.email.split('@')[1]}` : 
                                "No email"}
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

      {/* Installation Instructions Modal */}
      <Modal 
        isOpen={isInstallModalOpen} 
        onClose={onInstallModalClose}
        size="lg"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" shadow="2xl">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100" py={4} px={6}>
            <Flex align="center">
              <Icon as={FaStore} mr={3} color="blue.500" />
              <Text>Install from Shopify</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} px={6}>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="semibold" fontSize="lg">How to Install Parcel Pilot</Text>

              <Text fontWeight="semibold" fontSize="md" mb={2}>Installation Instructions:</Text>
              
              <OrderedList spacing={3} pl={4}>
                <ListItem>
                  <Text>Click this link to install the app: <a href="https://apps.shopify.com/ship-master">apps.shopify.com/ship-master</a></Text>
                </ListItem>
                <ListItem>
                  <Text>Review the permissions and click <Code>Install app</Code></Text>
                </ListItem>
                <ListItem>
                  <Text>After installing you will be redirected here and all of your orders will be pulled up.</Text>
                </ListItem>
                <ListItem>
                  <Text>You'll be redirected back here automatically once installation is complete</Text>
                </ListItem>
              </OrderedList>
              {/* Privacy disclosure */}
              <Box p={3} bg="blue.50" borderRadius="md" fontSize="sm" mt={4}>
                <Text fontWeight="medium" mb={1}>Data Access Information:</Text>
                <Text>
                  By installing, we'll access order information including customer names, 
                  addresses, phone numbers, and emails solely for order fulfillment purposes. 
                  See our{' '}
                  <Button 
                    variant="link" 
                    colorScheme="blue" 
                    size="sm"
                    onClick={() => window.open('/privacy-policy', '_blank')}
                  >
                    Privacy Policy
                  </Button>{' '}
                  for details on how we handle and protect customer data.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth="1px" borderColor="gray.100" borderBottomRadius="xl" px={6} py={4}>
            <Button onClick={onInstallModalClose}>
              Close
            </Button>
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