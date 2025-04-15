import React, { useState, useEffect } from "react";
import axios from 'axios';
import Swal from "sweetalert2";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel
} from "@chakra-ui/react";
import { authorizePayment, capturePayment, voidPayment } from '../functions/payment';

function SchedulePickupModal({ shipmentId, trackingNumber, courierId, isOpen, onClose }) {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [formattedPickupTimes, setFormattedPickupTimes] = useState([]);
  const [pickupSlotId, setPickupSlotId] = useState("");

  const [pickupFee, setPickupFee] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  //Get pickup fee based on the courier selected
  const getPickupFee = (courierId) => {
    const courierPickUpFees = {
      "a11cebea-6091-4bd3-a195-522d6552b4dc":4.25,
      "5eabaf48-e547-463b-976f-706885c54349":4.25,
      "3caab04a-1292-4c76-940c-7731024c1e38":4.25,
      "a7b95023-2ebf-4481-85e9-be838e33c5b5":4.25,
      "510d9128-a506-4050-8cbe-14757490be24":4.00,
      "94690a4a-9a7d-40e4-863e-3bf4fb274a3c":4.00,
      "2ad740a4-79e1-4841-8f2d-a2a2e086c210":4.00
    }
    if (courierId in courierPickUpFees) {
      setPickupFee(courierPickUpFees[courierId]);
    } else{
      setPickupFee(0);
    }
  }

  // Helper to get next 5 business days
  const getNextBusinessDays = (count) => {
    const businessDays = [];
    let date = new Date();
    while (businessDays.length < count) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        businessDays.push(new Date(date).toISOString().split('T')[0]);
      }
    }
    return businessDays;
  };

  const getPickupTime = async () => {
    if (courierId === 'GlsDicomExpressGround') {
      // GLS – Fixed next 5 business days with 10am – 5pm slot
      const businessDays = getNextBusinessDays(5);
      const slots = businessDays.map(date => ({
        date,
        time: "10:00 AM - 5:00 PM",
        time_slot_ids: ["GLS_FIXED_SLOT"] // Fixed slot ID
      }));
      setFormattedPickupTimes(slots);
    } else {
      // Other couriers – Fetch from API
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/pickups/get-time-slots`, {
          params: { courier_service_id: courierId }
        });

        const pickupSlots = response.data.courier_service_handover_option.pickup_slots;
        const formattedTimes = pickupSlots
          .filter(slot => slot.time_slots.length > 0)
          .map(slot => ({
            date: slot.date,
            time: slot.time_slots.map(timeSlot => `${timeSlot.from_time} - ${timeSlot.to_time}`).join(', '),
            time_slot_ids: slot.time_slots.map(timeSlot => timeSlot.time_slot_id)
          }));

        setFormattedPickupTimes(formattedTimes);
      } catch (error) {
        console.error('Error fetching pickup slots:', error.response?.data || error.message);
      }
    }
  };

  useEffect(() => {
    getPickupTime();
    getPickupFee(courierId);
  }, [courierId]);


  const handleSchedule = async () => {
    setIsLoading(true);
    let pickupId = '';

    try{
    if (courierId === 'GlsDicomExpressGround')
    {
    const pickupDateObj = new Date(pickupDate);
    const readyDateTime = new Date(pickupDateObj.setHours(6, 0, 0)).toISOString(); // 10:00 AM
    const closedDateTime = new Date(pickupDateObj.setHours(13, 0, 0)).toISOString(); // 5:00 PM

    const pickupData = {
      trackingNumbers: [shipmentId],
      readyDateTime: readyDateTime, 
      closedDateTime: closedDateTime 
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/pickups/schedule-gls-pickup`, pickupData);
      pickupId = response.data.id;

      Swal.fire({
        title: "Pickup Scheduled!",
        text: "Your GLS pickup has been successfully scheduled.",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      Swal.fire({
        title: "Pickup Not Scheduled",
        text: "Could not schedule the pickup. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      })
    }
    } 
    else     //SCHEDULE PICK UP
    {
    
    // Regular expression to capture the from and to times and date
    const [, date, fromTime, toTime] = pickupTime.match(/(\d{4}-\d{2}-\d{2}): (\d{2}:\d{2}) - (\d{2}:\d{2})/);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const pickupData = {
        user_time_zone: userTimeZone,
        courier_service_id: courierId,
        selected_from_time: fromTime,
        selected_to_time: toTime,
        selected_date: date,
        easyship_shipment_ids: [shipmentId]
      };
      //continue with payment
      let paymentId = "";
      try {
        if (pickupFee > 0) 
        {
        const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(pickupFee);
        
            if (!isAuthorized) {
              alert(`Payment authorization failed: ${error}`);
              return;
            }
            paymentId = paymentIntentId; // Assign paymentIntentId here
            if (!paymentId) {
              throw new Error('PaymentIntent ID is missing');
            }
        }
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/pickups/schedule-pickup`,
          pickupData
        );
        pickupId = response.data.pickup.easyship_pickup_id;
        if (pickupFee > 0 && pickupId) // If pickup was successfully scheduled
        {
          let isCaptured = false;
              try {
                isCaptured = await capturePayment(paymentId);
              } catch (e) {
                console.error("capturePayment threw an error:", e.message || e);
                Swal.fire({
                  title: "Payment Capture Failed",
                  text: "Payment was authorized, but capturing failed. Contact support.",
                  icon: "error",
                  confirmButtonText: "OK",
                })
                return;
              }

              if (!isCaptured) {
                Swal.fire({
                  title: "Payment Capture Failed",
                  text: "Could not capture the payment. Please try again.",
                  icon: "error",
                  confirmButtonText: "OK",
                })
                return;
              }
        }

        Swal.fire({
          title: "Pickup Scheduled!",
          text: "Your pickup has been successfully scheduled.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.reload();
        });
      } catch (error) {
        // Step 4: Void the payment if shipment creation fails
            if (paymentId) {
              try {
                await voidPayment(paymentId);
              } catch (voidError) {
                console.error("Failed to void payment:", voidError.message);
              }
            }
        Swal.fire({
          title: "Pickup Not Scheduled",
          text: "Could not schedule the pickup. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } 
    }
  }catch (e) { //Handle any unexpected failure
    Swal.fire({
      title: "An unexpected error occurred. Please try again",
      text: "Could not schedule the pickup. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  }finally {
    //Update the db
    if (pickupId)
    {
      const token = localStorage.getItem("authToken");
      try{
        const timeRange = pickupTime.split(": ")[1];
              await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/pickups/updatePickupDetails`,
                { shipment_id: shipmentId, pickup_date: pickupDate, time_slot: timeRange, pickup_id: pickupId },
                { headers: { Authorization: `Bearer ${token}` } }
              );
         } catch (cancelError) {
        console.error("Failed to update shipment status:", cancelError);
        }
     }
    onClose();
  }
}
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Schedule Pickup</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mt={4}>
            <FormLabel>Pickup Time:</FormLabel>
            <select
              id="pickupTime"
              value={pickupTime}
              onChange={(e) => {
                const selectedTime = e.target.value;
                setPickupTime(selectedTime);

                // Set pickupSlotId when time is selected
                const [date, time] = selectedTime.split(": ");
                const selectedSlot = formattedPickupTimes.find(slot => slot.date === date);
                const selectedTimeSlotId = selectedSlot?.time_slot_ids.find((id, idx) => {
                  return `${date}: ${selectedSlot.time.split(', ')[idx]}` === selectedTime;
                });
                setPickupSlotId(selectedTimeSlotId || "GLS_FIXED_SLOT");
                setPickupDate(date);
              }}
            >
              <option value="">Select a time</option>
              {formattedPickupTimes.map((slot, index) => (
                <optgroup key={index} label={slot.date}>
                  {slot.time.split(', ').map((time, idx) => (
                    <option key={idx} value={`${slot.date}: ${time}`}>
                      {`${slot.date}: ${time}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {pickupFee != null && <label>Pickup Fee: ${pickupFee}</label>} 

          </FormControl>
        </ModalBody>

        <ModalFooter>
        <Button colorScheme="teal" mr={3} onClick={handleSchedule} isLoading={isLoading}>
            Schedule
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SchedulePickupModal;


