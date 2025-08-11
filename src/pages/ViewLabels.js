import React, { useEffect, useState, useRef } from "react";
import {
  Box, Text, Table, Thead, Tbody, Tr, Th, Td, Button, Icon, useDisclosure, Center, Spinner, Flex, IconButton, useToast, AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Menu, MenuButton, MenuList, MenuItem, Button as ChakraButton, Checkbox, HStack, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton, UnorderedList, ListItem
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import { MdPerson, MdLocationOn, MdLocalShipping, MdClose, MdPrint } from "react-icons/md";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa";
import axios from "axios";
import SideBar from "../components/SideBar.js";
import ShipmentDetailsModal from "../modals/ShipmentDetailsModal.js";
import SchedulePickupModal from "../modals/SchedulePickupModal.js";
import PickupDetailsModal from "../modals/PickupDetailsModal.js";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

function ViewLabels() {
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const {
    isOpen: isPickupOpen,
    onOpen: onPickupOpen,
    onClose: onPickupClose,
  } = useDisclosure();

  const {
    isOpen: isPickupDetailsOpen,
    onOpen: onPickupDetailsOpen,
    onClose: onPickupDetailsClose,
  } = useDisclosure();

  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onClose: onCancelClose,
  } = useDisclosure();

  const [shippingLabels, setShippingLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(new Set());
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const token = localStorage.getItem("authToken");
  const cancelRef = React.useRef();
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // WebSocket reference
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchShippingLabels = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/user/getShippingLabels?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setShippingLabels(response.data.shippingLabelDetails || []);
        setTotalCount(response.data.totalCount || 0);
      } catch (error) {
        console.error("Error fetching shipping labels:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchShippingLabels();
    
    // Set up WebSocket connection
    const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3002'}/ws/shipping-labels`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connection established');
      
      // Send authentication message
      if (token) {
        wsRef.current.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle label update
        if (data.type === 'label_update' && data.label) {
          setShippingLabels(prevLabels => 
            prevLabels.map(label => 
              label.shipment_id === data.label.shipment_id ? data.label : label
            )
          );
          
          // Optionally show a toast notification
          toast({
            title: "Status Updated",
            description: `Shipment status has been updated`,
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    // Clean up WebSocket connection on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentPage, token]);

  // Clear selections when page changes
  useEffect(() => {
    setSelectedForPrint(new Set());
  }, [currentPage]);

  const currentLabels = shippingLabels; 
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  function handleDetailsClick(label) {
    setSelectedLabel(label);
    onDetailsOpen();
  }

  function handlePickupClick(label) {
    setSelectedLabel(label);
    onPickupOpen();
  }

  function handlePickupDetailsClick(label) {
    setSelectedLabel(label);
    onPickupDetailsOpen();
  }
  
  function handleCancelShipment(label) {
    setSelectedLabel(label);
    onCancelOpen();
  }

  function handleCheckboxChange(shipmentId) {
    const newSelected = new Set(selectedForPrint);
    if (newSelected.has(shipmentId)) {
      newSelected.delete(shipmentId);
    } else {
      newSelected.add(shipmentId);
    }
    setSelectedForPrint(newSelected);
  }

  function handleSelectAll(isChecked) {
    if (isChecked) {
      // Select all labels that have pdf_url and are not cancelled
      const selectableLabels = currentLabels.filter(
        label => label.pdf_url && label.status !== 'cancelled' && label.status !== 'pending'
      );
      setSelectedForPrint(new Set(selectableLabels.map(label => label.shipment_id)));
    } else {
      setSelectedForPrint(new Set());
    }
  }

  async function handleBulkPrint() {
    if (selectedForPrint.size === 0) return;

    setIsBulkPrinting(true);
    
    try {
      // Get the selected labels with their PDF URLs
      const selectedLabels = currentLabels.filter(
        label => selectedForPrint.has(label.shipment_id) && label.pdf_url
      );

      if (selectedLabels.length === 0) {
        toast({
          title: "No PDFs Available",
          description: "Selected labels don't have PDF files available.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        setIsBulkPrinting(false);
        return;
      }

      // If only one label is selected, open it directly
      if (selectedLabels.length === 1) {
        window.open(selectedLabels[0].pdf_url, '_blank');
        setSelectedForPrint(new Set());
        setIsBulkPrinting(false);
        return;
      }

      // For multiple labels, call backend endpoint to combine PDFs
      const shipmentIds = selectedLabels.map(label => label.shipment_id);
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/user/bulkPrintLabels`,
        { shipment_ids: shipmentIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob' // Important for handling PDF response
        }
      );

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Open the combined PDF in a new window
      window.open(pdfUrl, '_blank');
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);

      toast({
        title: "Success",
        description: `Combined ${selectedLabels.length} labels into one PDF.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Clear selections after printing
      setSelectedForPrint(new Set());

    } catch (error) {
      console.error('Error bulk printing:', error);
      toast({
        title: "Error",
        description: "Failed to combine and print labels. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsBulkPrinting(false);
    }
  }
  
  const handleConfirmCancel = async () => {
    const token = localStorage.getItem("authToken");
    setIsLoading(true);

    try {
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/user/cancelShipment`,
            { shipment_id: selectedLabel.shipment_id },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 200) {
            toast({
                title: "Shipment Cancelled",
                description: "The shipment has been successfully cancelled.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onCancelClose();
            
            // Remove from selected for print if it was selected
            const newSelected = new Set(selectedForPrint);
            newSelected.delete(selectedLabel.shipment_id);
            setSelectedForPrint(newSelected);
            
            // Optional: Update local state immediately for a faster UI response
            // The WebSocket will eventually synchronize the state
            setShippingLabels(prevLabels =>
              prevLabels.map(label =>
                label.shipment_id === selectedLabel.shipment_id
                  ? { ...label, status: 'cancelled' }
                  : label
              )
            );
        }
    } catch (error) {
        console.error('Error cancelling shipment:', error.response?.data || error.message);

        toast({
            title: "Error Cancelling Shipment",
            description: "Failed to cancel the shipment. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    } finally {
        setIsLoading(false);
    }
  };

  // Check if all selectable labels are selected
  const selectableLabels = currentLabels.filter(
    label => label.pdf_url && label.status !== 'cancelled' && label.status !== 'pending'
  );
  const isAllSelected = selectableLabels.length > 0 && 
    selectableLabels.every(label => selectedForPrint.has(label.shipment_id));

  return (
    <Box
      display="flex"
      minHeight="100vh"
      bgGradient="linear(to-br, teal.50, blue.50, purple.100)"
    >
      {/* Sidebar */}
      <Box w={{ base: "80px", md: "250px" }} bg="gray.800" color="white" shadow="lg">
        <SideBar />
      </Box>

      {/* Main Content */}
      <Box flex="1" p={3} bg="white" borderRadius="lg" shadow="2xl" m={2}>
        {/* Header */}
        <Center
          bgGradient="linear(to-r, teal.400, blue.400)"
          py={3}
          mb={2}
          borderRadius="lg"
          shadow="lg"
        >
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="semibold" color="white">
            Your Shipping Labels
          </Text>
        </Center>

        {/* Bulk Print Button */}
        {!isLoading && currentLabels.length > 0 && (
          <Flex justify="flex-end" mb={4}>
            <Button
              leftIcon={<MdPrint />}
              colorScheme="purple"
              size="lg"
              onClick={handleBulkPrint}
              isDisabled={selectedForPrint.size === 0}
              isLoading={isBulkPrinting}
              loadingText="Processing..."
              _hover={{
                transform: selectedForPrint.size > 0 ? "scale(1.05)" : "none",
                boxShadow: selectedForPrint.size > 0 ? "0px 4px 12px rgba(128, 0, 128, 0.4)" : "none",
              }}
              transition="all 0.2s ease-in-out"
            >
              {selectedForPrint.size > 0 
                ? `Bulk Print (${selectedForPrint.size} selected)`
                : "Select one or more to bulk print"
              }
            </Button>
          </Flex>
        )}

        {/* Loading Animation */}
        {isLoading ? (
          <Center height="60vh">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="teal.500"
              size="xl"
            />
          </Center>
        ) : (
          /* Labels Table */
          <Box
            overflowX="auto"
            borderRadius="lg"
            bgGradient="linear(to-b, white, gray.50)"
            shadow="lg"
            p={4}
          >
            <Table variant="simple">
              <Thead bg="teal.600">
                <Tr>
                  <Th color="white" fontSize="lg">
                    <Checkbox
                      colorScheme="orange"
                      isChecked={isAllSelected}
                      isIndeterminate={selectedForPrint.size > 0 && !isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      isDisabled={selectableLabels.length === 0}
                    />
                  </Th>
                  <Th color="white" fontSize="lg">
                    <Icon as={MdPerson} mr={2} color="orange" /> Name
                  </Th>
                  <Th color="white" fontSize="lg">
                    <Icon as={MdLocationOn} mr={2} color="orange" /> Address
                  </Th>
                  <Th color="white" fontSize="lg">
                    <Icon as={MdLocalShipping} mr={2} color="orange" /> Courier
                  </Th>
                  <Th color="white" fontSize="lg">
                    <Icon as={FaBarcode} mr={2} color="orange" /> Tracking ID
                  </Th>
                  <Th color="white" fontSize="lg">
                    <Icon as={FaBarcode} mr={2} color="orange" /> Date Created
                  </Th>
                  <Th color="white" fontSize="lg">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
              {currentLabels.map((label) => (
                  <Tr
                    key={label.id}
                    _hover={{ bg: "teal.50", transform: "scale(1.02)" }}
                    transition="0.2s"
                  >
                    <Td>
                      <Checkbox
                        colorScheme="purple"
                        isChecked={selectedForPrint.has(label.shipment_id)}
                        onChange={() => handleCheckboxChange(label.shipment_id)}
                        isDisabled={!label.pdf_url || label.status === 'cancelled' || label.status === 'pending'}
                      />
                    </Td>
                    <Td fontWeight="bold">{label.recipient_name}</Td>
                    <Td>
                      <Box as="span" display="inline-flex" alignItems="center" mr={2} fontSize="1.3rem">
                        🇨🇦
                      </Box>
                      {label.recipient_address}
                    </Td>
                    <Td>{label.courier_name}</Td>
                    <Td>{label.tracking_number}</Td>
                    <Td>
                      {label.status === 'cancelled' ? (
                        <Flex align="center">
                          <AiOutlineExclamationCircle color="red" size={17} />
                          <Text color="red.500" fontWeight="bold"> Shipment Cancelled</Text>
                        </Flex>
                      ) : label.status === 'pending' ? (
                        <Flex align="center">
                          <AiOutlineExclamationCircle color="orange" size={17} />
                          <Text color="orange.500" fontWeight="bold"> Shipment Pending</Text>
                        </Flex>
                      ) : label.status === 'failed' ? (
                         <Flex align="center">
                          <AiOutlineExclamationCircle color="orange" size={17} />
                          <Text color="orange.500" fontWeight="bold"> Failed to generate label. please try again.</Text>
                        </Flex>
                      ) : 
                       label.status === 'ready' ? (
                        <Flex gap={4}>
                          <Button
                            flex="1"
                            size="md"
                            leftIcon={<FiEye />}
                            colorScheme="blue"
                            onClick={() => handleDetailsClick(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(0, 0, 255, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            View Details
                          </Button>

                          <Button
                            flex="1"
                            size="md"
                            colorScheme="orange"
                            onClick={() => handlePickupClick(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(255, 165, 0, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            Schedule Pickup
                          </Button>

                          <Button
                            flex="1"
                            size="md"
                            colorScheme="red"
                            leftIcon={<MdClose />}
                            onClick={() => handleCancelShipment(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(255, 0, 0, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            Cancel
                          </Button>
                        </Flex>
                      ) : label.status === 'pickup_scheduled' ? (
                        <Flex gap={4}>
                          <Button
                            flex="1"
                            size="md"
                            leftIcon={<FiEye />}
                            colorScheme="blue"
                            onClick={() => handleDetailsClick(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(0, 0, 255, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            View Details
                          </Button>

                          <Flex
                            align="center"
                            justify="center"
                            bg="green.100"
                            color="green.700"
                            p={2}
                            borderRadius="md"
                            width="fit-content"
                          >
                            <Text mr={3}>✅ Scheduled</Text>
                            <Box
                              as="button"
                              color="blue.500" 
                              textAlign="center"
                              onClick={() => handlePickupDetailsClick(label)}
                              _hover={{ color: "blue.700", textDecoration: "underline" }}
                              display="flex"
                              flexDirection="column"
                              lineHeight="tight"
                            >
                              <Text m={0} p={0}>View</Text>
                            </Box>
                          </Flex>

                          <Button
                            flex="1"
                            size="md"
                            colorScheme="red"
                            leftIcon={<MdClose />}
                            onClick={() => handleCancelShipment(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(255, 0, 0, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            Cancel
                          </Button>
                        </Flex>
                      ) : label.status === 'pickup_cancelled' ? (
                        <Flex gap={4}>
                          <Button
                            flex="1"
                            size="md"
                            leftIcon={<FiEye />}
                            colorScheme="blue"
                            onClick={() => handleDetailsClick(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(0, 0, 255, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            View Details
                          </Button>

                          <Flex
                            align="center"
                            justify="center"
                            bg="red.100"
                            color="red.700"
                            p={2}
                            borderRadius="md"
                            width="fit-content"
                          >
                            <Text mr={3}>Pickup Cancelled</Text>
                          </Flex>

                          <Button
                            flex="1"
                            size="md"
                            colorScheme="red"
                            leftIcon={<MdClose />}
                            onClick={() => handleCancelShipment(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(255, 0, 0, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            Cancel
                          </Button>
                        </Flex>
                      ) : (
                        <Flex gap={4}>
                          <Button
                            flex="1"
                            size="md"
                            leftIcon={<FiEye />}
                            colorScheme="blue"
                            onClick={() => handleDetailsClick(label)}
                            _hover={{
                              boxShadow: "0px 4px 12px rgba(0, 0, 255, 0.4)",
                              transform: "scale(1.05)",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            View Details
                          </Button>
                        </Flex>
                      )}
                      
                      <AlertDialog isOpen={isCancelOpen} leastDestructiveRef={cancelRef} onClose={onCancelClose}>
                        <AlertDialogOverlay>
                          <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                              Cancel Shipment
                            </AlertDialogHeader>

                            <AlertDialogBody>
                              Are you sure you want to cancel this shipment?
                              This action cannot be undone.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                              <ChakraButton ref={cancelRef} onClick={onCancelClose}>
                                Cancel
                              </ChakraButton>
                              <ChakraButton colorScheme="red" onClick={handleConfirmCancel} ml={3}>
                                Confirm
                              </ChakraButton>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialogOverlay>
                      </AlertDialog>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Flex justifyContent="center" mt={4} gap={2}>
              <IconButton
                icon={<FiChevronLeft />}
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              />
              <Text fontSize="lg">Page {currentPage} of {totalPages}</Text>
              <IconButton
                icon={<FiChevronRight />}
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
            </Flex>
          </Box>
        )}
        {/* Modals remain the same */}
        {selectedLabel && (
          <ShipmentDetailsModal
            recipientName={selectedLabel.recipient_name}
            recipientAddress={selectedLabel.recipient_address}
            courierName={selectedLabel.courier_name}
            trackingNumber={selectedLabel.tracking_number}
            pdfLink={selectedLabel.pdf_url}
            isOpen={isDetailsOpen}
            onClose={() => {
              onDetailsClose();
              setSelectedLabel(null);
            }}
          />
        )}
        {selectedLabel && (
          <SchedulePickupModal
            shipmentId={selectedLabel.shipment_id}
            trackingNumber={selectedLabel.tracking_number}
            courierId={selectedLabel.courier_service_id}
            isOpen={isPickupOpen}
            onClose={() => {
              onPickupClose();
              setSelectedLabel(null);
            }}
          />
        )}
        {selectedLabel && (
          <PickupDetailsModal
            shipmentId={selectedLabel.shipment_id}
            courierName={selectedLabel.courier_name}
            pickupId={selectedLabel.pickup_id}
            pickupDate={selectedLabel.pickup_date}
            pickupTime={selectedLabel.time_slot}
            isOpen={isPickupDetailsOpen}
            onClose={() => {
              onPickupDetailsClose();
              setSelectedLabel(null);
            }}
          />
        )}
        
      </Box>
    </Box>
  );
}

export default ViewLabels;








