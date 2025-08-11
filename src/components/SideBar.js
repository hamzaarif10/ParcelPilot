import React, { useState } from 'react';
import { Box, Button, VStack, Text, Icon } from '@chakra-ui/react';
import { FaExchangeAlt, FaShippingFast, FaBox, FaUserCog, FaSignOutAlt, FaCreditCard, FaPlug, FaHeadset } from 'react-icons/fa'; // Updated icons
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import axios from 'axios';

const SideBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Function to handle logout
  const handleLogout = async () => {
  try {
    // Call server logout endpoint to destroy session
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`, {}, {
      withCredentials: true, // Include cookies
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Don't block logout on server error - continue with cleanup
  } finally {
    // Clear local storage regardless of server response
    localStorage.removeItem("authToken");
    localStorage.removeItem("userPostalCode");
    localStorage.removeItem("shopifyOrders");
    localStorage.removeItem("lastSyncTime");
    
    // Clear any session storage too
    sessionStorage.removeItem('pendingShopifyShop');
    sessionStorage.removeItem('pendingShopifyHost');
    
    // Redirect to login
    navigate('/login');
  }
};

  const menuItems = [
    { id: 2, label: 'Create Shipment', icon: FaShippingFast, route: '/create-shipment' },
    { id: 3, label: 'Manage Shipments', icon: FaBox, route: '/view-labels' },
    { id: 4, label: 'Connect Shopify', icon: FaPlug, route: '/integration' },
    { id: 5, label: 'Transactions', icon: ArrowLeftRight, route: '/view-transactions' },
    { id: 6, label: 'Billing', icon: FaCreditCard, route: '/billing' },
    { id: 7, label: 'Account', icon: FaUserCog, route: '/account' },
    {id: 8, label: 'Support', icon: FaHeadset, route: '/support'}

  ];

  return (
    <Box
  w={isCollapsed ? '70px' : '200px'}
  h="100vh"
  bgGradient="linear(to-b,rgb(0, 77, 77),rgb(102, 204, 204))" // Cyanish blue gradient
  color="white"
  transition="width 0.3s"
  boxShadow="lg"
  display="flex"
  flexDirection="column"
  justifyContent="space-between"
  position={'fixed'}
  p={4}
>
      {/* Sidebar Menu */}
      <VStack spacing={4} align="start" flex="1" width="full">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            colorScheme="white"
            width="full"
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            leftIcon={<Icon as={item.icon} boxSize={5} />}
            onClick={() => navigate(item.route)} // Navigate to the route
            _hover={{
              bg: 'teal.600', // Subtle hover effect
              textDecor: 'none',
              transform: 'scale(1.05)', // Slight zoom effect for interactivity
            }}
            _focus={{
              boxShadow: 'none',
            }}
            borderRadius="8px" // Rounded button borders
            p={3} // Padding for larger clickable area
          >
            {!isCollapsed && <Text ml={2} fontWeight="semibold">{item.label}</Text>}
          </Button>
        ))}

        {/* Logout Button */}
        <Button
          variant="ghost"
          colorScheme="white"
          width="full"
          justifyContent={isCollapsed ? 'center' : 'flex-start'}
          leftIcon={<Icon as={FaSignOutAlt} boxSize={5} />}
          onClick={handleLogout} // Call the logout handler
          _hover={{
            bg: 'red.500',
            textDecor: 'none',
            transform: 'scale(1.05)', // Subtle hover effect
          }}
          _focus={{
            boxShadow: 'none',
          }}
          borderRadius="8px"
          p={3}
        >
          {!isCollapsed && <Text ml={2} fontWeight="semibold">Logout</Text>}
        </Button>
      </VStack>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        colorScheme="whiteAlpha"
        onClick={toggleSidebar}
        position="absolute"
        bottom="4"
        left={isCollapsed ? '30%' : 'calc(100% - 40px)'}
        transition="left 0.3s"
        _hover={{
          bg: 'teal.500',
          transform: 'rotate(180deg)', // Rotate the button for a fun effect
        }}
        borderRadius="50%"
        boxSize="40px" // Circular collapse button
      >
        {isCollapsed ? '>' : '<'}
      </Button>
    </Box>
  );
};

export default SideBar;
















