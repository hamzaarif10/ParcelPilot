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

  const [userBalance, setUserBalance] = useState(0);

  // Add this useEffect to fetch balance
useEffect(() => {
  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/payment/balance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setUserBalance(res.data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  
  if (isOpen) { // Only fetch when modal opens
    fetchBalance();
  }
}, [isOpen]);

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
  let paymentId = "";
  let balanceDeductAmount = 0; // Track balance deduction for potential refund

  try {
    // 🔑 PAYMENT / BALANCE CHECK - Only for non-GLS couriers with pickup fees
    if (courierId !== 'GlsDicomExpressGround' && pickupFee > 0) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/payment/doesPaymentMethodExist`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Convert to numbers at the start
        const numericUserBalance = parseFloat(userBalance) || 0;
        const numericPickupFee = parseFloat(pickupFee) || 0;

        console.log('Pickup Payment debug:', {
          numericUserBalance,
          numericPickupFee,
          doesPaymentMethodExist: response.data.doesPaymentMethodExist,
        });

        const hasPaymentMethod = response.data.doesPaymentMethodExist == 1;

        // ✅ ONLY fail if NO payment method AND insufficient balance
        if (!hasPaymentMethod) {
          // No payment method on file - can only use balance
          if (numericUserBalance < numericPickupFee) {
            Swal.fire({
              title: 'Payment Required',
              text: 'You do not have enough balance to cover the pickup fee and no payment method is on file. Please add funds or a payment method.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            setIsLoading(false);
            return;
          }
          
          // Balance covers the cost - deduct from balance
          const res = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
            { courierCost: numericPickupFee },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (!res.data.success) {
            Swal.fire({
              title: 'Payment Error',
              text: 'Failed to deduct from balance',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            setIsLoading(false);
            return;
          }
          balanceDeductAmount = numericPickupFee;
          setUserBalance(res.data.balance);
          
        } else {
          // ✅ HAS payment method - handle all scenarios
          console.log('✅ Has payment method - processing payment...');
          
          if (numericUserBalance >= numericPickupFee) {
            // Balance fully covers - use balance only
            const res = await axios.post(
              `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
              { courierCost: numericPickupFee },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (!res.data.success) {
              Swal.fire({
                title: 'Payment Error',
                text: 'Failed to deduct from balance',
                icon: 'error',
                confirmButtonText: 'OK'
              });
              setIsLoading(false);
              return;
            }
            balanceDeductAmount = numericPickupFee;
            setUserBalance(res.data.balance);
            
          } else if (numericUserBalance > 0) {
            // Partial balance + card charge
            const remainingAmount = numericPickupFee - numericUserBalance;

            // First deduct available balance
            const balanceRes = await axios.post(
              `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
              { courierCost: numericUserBalance },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (!balanceRes.data.success) {
              Swal.fire({
                title: 'Payment Error',
                text: 'Failed to deduct from balance',
                icon: 'error',
                confirmButtonText: 'OK'
              });
              setIsLoading(false);
              return;
            }
            balanceDeductAmount = numericUserBalance;
            setUserBalance(balanceRes.data.balance);

            // Then authorize card for remainder
            const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(remainingAmount);
            if (!isAuthorized || !paymentIntentId) {
              Swal.fire({
                title: 'Payment Failed',
                text: `Payment authorization failed: ${error || 'Unknown error'}`,
                icon: 'error',
                confirmButtonText: 'OK'
              });
              setIsLoading(false);
              return;
            }
            paymentId = paymentIntentId;
            
          } else {
            // No balance - charge full amount to card
            const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(numericPickupFee);
            if (!isAuthorized || !paymentIntentId) {
              Swal.fire({
                title: 'Payment Failed',
                text: `Payment authorization failed: ${error || 'Unknown error'}`,
                icon: 'error',
                confirmButtonText: 'OK'
              });
              setIsLoading(false);
              return;
            }
            paymentId = paymentIntentId;
          }
        }
        
      } catch (error) {
        console.error("Error in pickup payment processing:", error.response?.data || error.message);
        
        if (error.response?.status >= 500 || !error.response) {
          Swal.fire({
            title: 'Payment Error',
            text: 'Server error occurred. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            title: 'Payment Error',
            text: 'Payment processing failed. Please check your payment details.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
        
        setIsLoading(false);
        return;
      }
    }

    // 🔑 SCHEDULE PICKUP (only reached if payment succeeded or no payment needed)
    if (courierId === 'GlsDicomExpressGround') {
      const localPickupDate = DateTime.fromISO(pickupDate).set({ hour: 12, minute: 0 });
      const readyDateTime = localPickupDate.toISO({ suppressMilliseconds: true });
      const closedDateTime = localPickupDate.plus({ hours: 4 }).toISO({ suppressMilliseconds: true });

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
        throw new Error("Failed to schedule GLS pickup");
      }
    } else {
      // Regular pickup scheduling
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

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/pickups/schedule-pickup`,
          pickupData
        );
        pickupId = response.data.pickup.easyship_pickup_id;

        // Capture payment only if we have a paymentId (card payment)
        if (paymentId && pickupId) {
          let isCaptured = false;
          try {
            isCaptured = await capturePayment(paymentId);
          } catch (e) {
            console.error("capturePayment threw an error:", e.message || e);
            throw new Error("Payment capture failed");
          }

          if (!isCaptured) {
            throw new Error("Payment capture failed");
          }
        }

        Swal.fire({
          title: "Pickup Scheduled!",
          text: "Your pickup has been successfully scheduled.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        throw new Error("Failed to schedule pickup");
      }
    }

  } catch (error) {
    console.error("Error in pickup scheduling:", error);
    
    // Handle payment rollback on failure
    if (paymentId) {
      try {
        await voidPayment(paymentId);
      } catch (voidError) {
        console.error("Failed to void payment:", voidError.message);
      }
    }
    
    // ✅ REFUND BALANCE if any was deducted
    if (balanceDeductAmount > 0) {
      try {
        const token = localStorage.getItem("authToken");
        const refundRes = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/payment/balance/add`,
          { amount: balanceDeductAmount },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (refundRes.data.success) {
          setUserBalance(refundRes.data.balance);
        }
      } catch (refundError) {
        console.error("Failed to refund balance:", refundError.message);
      }
    }

    Swal.fire({
      title: "Pickup Not Scheduled",
      text: "Could not schedule the pickup. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  } finally {
    // Update the database
    if (pickupId) {
      const token = localStorage.getItem("authToken");
      try {
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
    setIsLoading(false);
    onClose();
  }
};
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
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Pickup Fee: ${pickupFee.toFixed(2)}</strong>
              </div>
            </div>
          
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


