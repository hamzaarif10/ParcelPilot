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
import { DateTime } from "luxon";
//test
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
    const day = date.getDay();
    
    if (day !== 0 && day !== 6) {
      const dateString = new Date(date).toISOString().split('T')[0];
      businessDays.push(dateString);
    }
    date.setDate(date.getDate() + 1);
  }
  
  return businessDays;
};

  const getPickupTime = async () => {
    if (courierId === 'GlsDicomExpressGround') {
    const businessDays = getNextBusinessDays(5);
    const slots = businessDays.map(date => ({
      date,
      time: "12:00 PM - 4:00 PM",
      time_slot_ids: ["GLS_FIXED_SLOT"]
    }));
    
    console.log("GLS slots created:", slots); // Add this log
    setFormattedPickupTimes(slots);
  } 
  else {
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
        if (courierId === 'GlsDicomExpressGround') {
      const localPickupDate = DateTime.fromISO(pickupDate).set({ hour: 12, minute: 0 });
      const readyDateTime = localPickupDate.toISO({ suppressMilliseconds: true }); // local time
      const closedDateTime = localPickupDate.plus({ hours: 4 }).toISO({ suppressMilliseconds: true }); // local + 4h

      const pickupData = {
        trackingNumbers: [shipmentId],
        readyDateTime,
        closedDateTime
      };

      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/pickups/schedule-gls-pickup`, pickupData);
        pickupId = response.data.id;

        Swal.fire({
          title: "Pickup Scheduled!",
          text: "Your GLS pickup has been successfully scheduled.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        Swal.fire({
          title: "Pickup Not Scheduled",
          text: "Could not schedule the pickup. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
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
      console.log("from time: " + fromTime);
      console.log("to time: " + toTime);
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
        {/* Next Day Pickup Cutoff Times */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ 
              marginRight: '8px', 
              fontSize: '18px' 
            }}>⏰</span>
            Next Day Pickup Cutoff Times
          </div>
          <div style={{
            fontSize: '13px',
            color: '#4a5568',
            marginBottom: '12px',
            fontStyle: 'italic'
          }}>
            Next-day pickup is unavailable after these cutoff times (EST)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <span>Canada Post</span>
              <span style={{ color: '#e53e3e', fontWeight: '600' }}>7:00 PM</span>
            </div>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <span>Canpar</span>
              <span style={{ color: '#dd6b20', fontWeight: '600' }}>8:00 PM</span>
            </div>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <span>Purolator</span>
              <span style={{ color: '#d69e2e', fontWeight: '600' }}>9:00 PM</span>
            </div>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'white', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <span>GLS</span>
              <span style={{ color: '#38a169', fontWeight: '600' }}>11:59 PM</span>
            </div>
          </div>
        </div>

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


