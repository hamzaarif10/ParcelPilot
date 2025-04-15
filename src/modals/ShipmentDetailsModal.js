import React, { useEffect, useState } from "react";
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

const ShipmentDetailsModal = ({ recipientName, recipientAddress, courierName, trackingNumber, pdfLink, isOpen, onClose }) => {
  return (
    <>
      {/* Modal */}
      <Modal size="lg" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent position="absolute" top="5%" left="35%" transform="translate(-50%, -50%)">
          <ModalHeader textAlign="center">
            <h2>Print and Ship your package</h2>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box mb={3}>
              <Text fontWeight="bold">Recipient Name:</Text>
              <Text>{recipientName}</Text>
            </Box>

            <Box mb={3}>
              <Text fontWeight="bold">Recipient Address:</Text>
              <Text>{recipientAddress}</Text>
            </Box>

            <Box mb={3}>
              <Text fontWeight="bold">Courier Name:</Text>
              <Text>{courierName}</Text>
            </Box>

            <Box mb={3}>
              <Text fontWeight="bold">Tracking Number:</Text>
              <Text>{trackingNumber}</Text>
            </Box>

            <Box mb={3}>
              {pdfLink && (
                <a href={pdfLink} target="_blank" rel="noopener noreferrer">
                  <Text fontWeight="bold" color="teal.500">
                    View Shipping Label
                  </Text>
                </a>
              )}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShipmentDetailsModal;



