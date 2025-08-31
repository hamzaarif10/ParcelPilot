import React, { useState } from 'react';
import { Box, Button, VStack, Text, Icon, IconButton } from '@chakra-ui/react';
import { FaExchangeAlt, FaShippingFast, FaBox, FaUserCog, FaSignOutAlt, FaCreditCard, FaPlug, FaHeadset } from 'react-icons/fa';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import axios from 'axios';

const SideBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
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
      
      // Close mobile menu if open
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      
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
    { id: 8, label: 'Support', icon: FaHeadset, route: '/support' }
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <IconButton
        icon={isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        onClick={toggleMobileMenu}
        position="fixed"
        top="4"
        left="4"
        zIndex="modal"
        bg="teal.500"
        color="white"
        _hover={{ bg: 'teal.600' }}
        size="md"
        display={{ base: 'flex', md: 'none' }}
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0,0,0,0.5)"
          zIndex="overlay"
          onClick={handleMobileNavClick}
          display={{ base: 'block', md: 'none' }}
        />
      )}

      {/* Your Original Desktop Sidebar - exactly as you had it */}
      <Box
        w={isCollapsed ? '80px' : '250px'}
        h="100vh"
        bgGradient="linear(to-b,rgb(0, 77, 77),rgb(102, 204, 204))"
        color="white"
        transition="width 0.3s"
        boxShadow="lg"
        display={{ base: 'none', md: 'flex' }} // Hide on mobile, show on desktop
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
              onClick={() => navigate(item.route)}
              _hover={{
                bg: 'teal.600',
                textDecor: 'none',
                transform: 'scale(1.05)',
              }}
              _focus={{
                boxShadow: 'none',
              }}
              borderRadius="8px"
              p={3}
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
            onClick={handleLogout}
            _hover={{
              bg: 'red.500',
              textDecor: 'none',
              transform: 'scale(1.05)',
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
            transform: 'rotate(180deg)',
          }}
          borderRadius="50%"
          boxSize="40px"
        >
          {isCollapsed ? '>' : '<'}
        </Button>
      </Box>

      {/* Mobile Sidebar */}
      <Box
        w="250px"
        h="100vh"
        bgGradient="linear(to-b,rgb(0, 77, 77),rgb(102, 204, 204))"
        color="white"
        boxShadow="lg"
        display={{ base: 'flex', md: 'none' }} // Show on mobile, hide on desktop
        flexDirection="column"
        justifyContent="space-between"
        position="fixed"
        left={isMobileMenuOpen ? "0" : "-250px"}
        top="0"
        zIndex="modal"
        transition="left 0.3s ease-in-out"
        p={4}
        pt="60px"
      >
        <VStack spacing={4} align="start" flex="1" width="full">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              colorScheme="white"
              width="full"
              justifyContent="flex-start"
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              onClick={() => {
                navigate(item.route);
                handleMobileNavClick();
              }}
              _hover={{
                bg: 'teal.600',
                textDecor: 'none',
                transform: 'scale(1.05)',
              }}
              _focus={{
                boxShadow: 'none',
              }}
              borderRadius="8px"
              p={3}
            >
              <Text ml={2} fontWeight="semibold">{item.label}</Text>
            </Button>
          ))}

          {/* Mobile Logout Button */}
          <Button
            variant="ghost"
            colorScheme="white"
            width="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FaSignOutAlt} boxSize={5} />}
            onClick={() => {
              handleLogout();
              handleMobileNavClick();
            }}
            _hover={{
              bg: 'red.500',
              textDecor: 'none',
              transform: 'scale(1.05)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            borderRadius="8px"
            p={3}
          >
            <Text ml={2} fontWeight="semibold">Logout</Text>
          </Button>
        </VStack>
      </Box>
    </>
  );
};

export default SideBar;