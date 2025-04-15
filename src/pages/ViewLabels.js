import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Icon,
  useDisclosure,
  Center,
  Spinner,
  Flex,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Menu, MenuButton, MenuList, MenuItem,
  Button as ChakraButton
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import { MdPerson, MdLocationOn, MdLocalShipping, MdClose } from "react-icons/md"; // MdClose for the "X" icon
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
  const token = localStorage.getItem("authToken");
  const cancelRef = React.useRef();
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
        setTotalCount(response.data.totalCount || 0);  // Set the total count from the response
      } catch (error) {
        console.error("Error fetching shipping labels:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchShippingLabels();
  }, [currentPage]); 

  const currentLabels = shippingLabels; 
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  function handleDetailsClick(label) {
    setSelectedLabel(label);
    onDetailsOpen();
  }
//schedule pickup function
  function handlePickupClick(label) {
    setSelectedLabel(label); // Optional: Store the label info if needed
    onPickupOpen();
  }
//view pickup details function
  function handlePickupDetailsClick(label) {
    setSelectedLabel(label);
    onPickupDetailsOpen();
  }
  function handleCancelShipment(label) {
    setSelectedLabel(label); // Store the label info for cancel
    onCancelOpen();
  }
  const handleConfirmCancel = async () => {
    const token = localStorage.getItem("authToken");
    setIsLoading(true); // Start spinner

    try {
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/user/cancelShipment`,
            { shipment_id: selectedLabel.shipment_id }, // Send in body
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // If successful show success message
        if (response.status === 200) {
            toast({
                title: "Shipment Cancelled",
                description: "The shipment has been successfully cancelled.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onCancelClose(); // Close modal
            window.location.reload(); 
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
        setIsLoading(false); // Stop spinner

    }
};

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

                          {label.status === 'pickup_scheduled' ? (
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
                                ) : label.status === 'pickup_cancelled' ? (
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
                                    <Box
                                      as="button"
                                      color="gray.500"
                                      textAlign="center"
                                      _hover={{ color: "gray.700", textDecoration: "underline" }}
                                      display="flex"
                                      flexDirection="column"
                                      lineHeight="tight"
                                    >
                                    </Box>
                                  </Flex>
                            ) : (
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
                            )}

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

                          <AlertDialog isOpen={isCancelOpen} leastDestructiveRef={cancelRef} onClose={onCancelClose}>
                              <AlertDialogOverlay>
                                  <AlertDialogContent>
                                      <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                          Cancel Shipment
                                      </AlertDialogHeader>

                                      <AlertDialogBody>
                                          Are you sure you want to cancel this shipment?
                                          Refunds will be processed within 10 business days.
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
                      </Flex>
                  )}
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
        {/* Shipment Details Modal */}
        {selectedLabel && (
          <ShipmentDetailsModal
            recipientName={selectedLabel.recipient_name}
            recipientAddress={selectedLabel.recipient_address}
            courierName={selectedLabel.courier_name}
            trackingNumber={selectedLabel.tracking_number}
            pdfLink={selectedLabel.pdf_url}
            isOpen={isDetailsOpen}
            onClose={() => {
              onDetailsClose(); // Ensure state updates correctly
              setSelectedLabel(null); // Reset selected label to avoid lingering state
            }}
          />
        )}
        {/* Schedule Pickup Modal */}
        {selectedLabel && (
          <SchedulePickupModal
            shipmentId={selectedLabel.shipment_id}
            trackingNumber={selectedLabel.tracking_number}
            courierId={selectedLabel.courier_service_id}
            isOpen={isPickupOpen}
            onClose={() => {
              onPickupClose(); // Ensure state updates correctly
              setSelectedLabel(null); // Reset selected label to avoid lingering state
            }}
          />
        )}
        {/* Pickup Details Modal */}
        {selectedLabel && (
          <PickupDetailsModal
            shipmentId={selectedLabel.shipment_id}
            courierName={selectedLabel.courier_name}
            pickupId={selectedLabel.pickup_id}
            pickupDate={selectedLabel.pickup_date}
            pickupTime={selectedLabel.time_slot}
            isOpen={isPickupDetailsOpen}
            onClose={() => {
              onPickupDetailsClose(); // Ensure state updates correctly
              setSelectedLabel(null); // Reset selected label to avoid lingering state
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default ViewLabels;









