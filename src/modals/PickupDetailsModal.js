import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Box,
} from "@chakra-ui/react";
import axios from "axios"; 
import Swal from "sweetalert2";

const PickupDetailsModal = ({ shipmentId, courierName, pickupId, pickupDate, pickupTime, isOpen, onClose }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelClick = () => {
    setIsCancelling(true);
  };

  const handleCancelPickup = async() => {
    setIsLoading(true);
    try{
        const token = localStorage.getItem("authToken");
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/pickups/cancelPickup`, 
            {pickup_id: pickupId, shipment_id: shipmentId}, 
            {headers: { Authorization: `Bearer ${token}` } });

        Swal.fire({
                  title: "Pickup cancelled!",
                  text: "We were able to successfully cancel this pickup!",
                  icon: "success",
                  confirmButtonText: "OK",
                }).then(() => {
                });
       } catch(error)
       {
        Swal.fire({
            title: "Could not cancel Pickup!",
            text: "We were unable to cancel this pickup, please reach out to support or try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
       }finally {
        setIsCancelling(false);
        setIsLoading(false);
        onClose();
      }
  };

  const handleGoBack = () => {
    setIsCancelling(false);
  };

  return (
    <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent position="absolute" top="5%" left="35%" transform="translate(-50%, -50%)">
        <ModalHeader textAlign="center">
          {isCancelling ? "Confirm Cancellation" : "Pickup Details"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isCancelling ? (
            <Text>Are you sure you want to cancel this pickup?</Text>
          ) : (
            <>
              <Box mb={3}>
                <Text fontWeight="bold">Courier:</Text>
                <Text>{courierName}</Text>
              </Box>

              <Box mb={3}>
                <Text fontWeight="bold">Pick up Date:</Text>
                <Text>{pickupDate}</Text>
              </Box>

              <Box mb={3}>
                <Text fontWeight="bold">Pick up Time:</Text>
                <Text>{pickupTime}</Text>
              </Box>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {isCancelling ? (
            <>
              <Button variant="ghost" mr={3} onClick={handleGoBack}>
                No, go back
              </Button>
              <Button colorScheme="red" onClick={handleCancelPickup} isLoading={isLoading}>
                Yes, cancel it
            </Button>
            </>
          ) : (
            <>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant="ghost" colorScheme="red" onClick={handleCancelClick}>
                Cancel Pick up
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PickupDetailsModal;

