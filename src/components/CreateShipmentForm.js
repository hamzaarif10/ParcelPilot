import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ShipmentDetailsModal from '../modals/ShipmentDetailsModal';
import UserAddressModal from '../modals/UserAddressModal';
import { getCreateShipmentData } from '../data/esdata';
import { getGlsCreateShipmentData } from '../data/glsData';
import { canadianProvinces, usStates, ukCountries, australianStates, newZealandRegions, germanStates, frenchRegions, 
  italianRegions, spanishAutonomousCommunities, swedishCounties, norwegianCounties,  
  danishRegions, finnishRegions, swissCantons, japanesePrefectures, singaporeRegions} from '../data/locationData';
import { Button, useDisclosure, Spinner, Input, useToast, AbsoluteCenter } from '@chakra-ui/react'; 
import loadGoogleMapsAPI from "../functions/loadGoogleMapsApi";
import initAutocomplete from "../functions/initAutoComplete";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { authorizePayment, capturePayment, voidPayment } from '../functions/payment';
import { generatePdfLink, submitLabel } from '../functions/generateLabel';
import { fetchUserAddress } from '../functions/fetchUserAddress';
import { fulfillShopifyOrder } from '../functions/fulfillShopifyOrder';
import { submitTransaction } from '../functions/submitTransaction';
import { Box, Center } from "@chakra-ui/react";
import LoadingAnimation from "../LoadingAnimations/LoadingAnimation2";

function CreateShipmentForm({courierId, courierUrl, courierCost, senderCountry, receiverAddressLine1Prop, receiverAddressLine2Prop, receiverCityProp, 
  receiverCountry, receiverPostCode, receiverProvinceProp, receiverName, receiverPhoneNumber, receiverEmailProp, measurements, mass,
  orderId, lineItemId, onShopifyOrderModalClose}) {

  const [senderAddressLine1, setSenderAddressLine1] = useState("");
  const [senderAddressLine2, setSenderAddressLine2] = useState("");
  const [senderProvince, setSenderProvince] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderCompanyName, setSenderCompanyName] = useState("");
  const [senderContactName, setSenderContactName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [receiverAddressLine1, setReceiverAddressLine1] = useState(receiverAddressLine1Prop);
  const [receiverAddressLine2, setReceiverAddressLine2] = useState(receiverAddressLine2Prop);
  const [receiverProvince, setReceiverProvince] = useState(receiverProvinceProp);
  const [receiverCity, setReceiverCity] = useState(receiverCityProp);
  const [receiverPostalCode, setReceiverPostalCode] = useState(receiverPostCode);
  const [receiverContactName, setReceiverContactName] = useState(receiverName);
  const [receiverPhone, setReceiverPhone] = useState(receiverPhoneNumber);
  const [receiverEmail, setReceiverEmail] = useState(receiverEmailProp);
  const [receiverCountryCode, setReceiverCountryCode] = useState(receiverCountry);
  const [weight, setWeight] = useState(mass);
  const [dimensions, setDimensions] = useState({ length: measurements.length, width: measurements.width, depth: measurements.depth });

  const [pdfLink, setPdfLink] = useState(null);

  const [userAddressDetails, setUserAddressDetails] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalType, setModalType] = useState(null); // To track which modal to open

  const [isLoading, setIsLoading] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [courierName, setCourierName] = useState("");
  const [labelState, setLabelState] = useState("");

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const [userBalance, setUserBalance] = useState(0);

  const toast = useToast();
  const showToast = (title, description, status = 'error') => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
    });
  };
  

  // Load Stripe with your publishable key
   const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISH_KEY);

   //error messages object
   const [errors, setErrors] = useState({
    receiverAddressLine1: '',
    receiverCity: '',
    receiverProvince: '',
    receiverContactName: '',
    receiverPhone: '',
    receiverEmail: '',
  });

  //Address autocomplete functionality
  useEffect(() => {
    loadGoogleMapsAPI(() => {
      initAutocomplete(setReceiverAddressLine1,setReceiverCity,setReceiverProvince, setReceiverPostalCode, receiverCountry, true);
    });
  }, []);
  const handleProvinceChange = (e) => {
    setReceiverProvince(e.target.value);
  };

  const getProvincesOrStates = (countryCode) => {
    const countryMap = {
      "CA": canadianProvinces, "US": usStates, "GB": ukCountries, "AU": australianStates, "NZ": newZealandRegions,   
      "DE": germanStates, "FR": frenchRegions, "IT": italianRegions, "ES": spanishAutonomousCommunities, 
      "SE": swedishCounties, "NO": norwegianCounties, "DK": danishRegions, "FI": finnishRegions,"CH": swissCantons,        
      "JP": japanesePrefectures, "SG": singaporeRegions     
    };
    return countryMap[countryCode] || []; // Return empty array if country code is not found
  };
  // Inside your component
  const provinceOptions = getProvincesOrStates(receiverCountryCode);
//USE EFFECT HOOKS
useEffect(() => {
  const handleSubmit = async () => {
  if (modalType === "shipmentDetails" && isOpen) {
      await submitLabel({
        shipment_id: shipmentId,
        name: receiverContactName,
        addressLine1: receiverAddressLine1,
        city: receiverCity,
        postalCode: receiverPostalCode,
        countryCode: receiverCountryCode,
        courierName: courierName,
        courierId: courierId,
        trackingNum: trackingNumber,
        pdfLink: pdfLink,
        labelState: labelState
      });
      //Submit transaction details to DB
      submitTransaction({
        description: "Shipment for " + receiverContactName + " shipped via " + courierName,
        amount: courierCost
      });
      setIsButtonDisabled(true);      
  }
}
handleSubmit();
}, [modalType, isOpen]);

useEffect(() => {
  fetchUserAddress({setUserAddressDetails, setSenderAddressLine1, setSenderAddressLine2, setSenderProvince,
    setSenderCity, setSenderPostalCode, setSenderCompanyName, setSenderContactName, setSenderPhone, setSenderEmail});
}, [userAddressDetails]); // List the dependencies that trigger fetching address when they change.

useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Assuming you store JWT here
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
    fetchBalance();
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  let newTrackingNumber = "";
  let newShipmentId = "";
  let newCourierName = "";
  let newLabelState = "";
  let paymentId = "";
  let balanceDeductAmount = 0; //this is to do balance refund in case of shipment creation failure

  try {
    // Clear previous errors
    setErrors({
      receiverAddressLine1: '',
      receiverCity: '',
      receiverProvince: '',
      receiverContactName: '',
      receiverPhone: '',
      receiverEmail: '',
    });

    // Basic validations
    let formIsValid = true;
    if (!receiverAddressLine1) {
      setErrors(prev => ({ ...prev, receiverAddressLine1: 'Address Line 1 is required.' }));
      formIsValid = false;
    }
    if (!receiverCity) {
      setErrors(prev => ({ ...prev, receiverCity: 'City is required.' }));
      formIsValid = false;
    }
    if (!receiverProvince) {
      setErrors(prev => ({ ...prev, receiverProvince: 'Province is required.' }));
      formIsValid = false;
    }
    if (!receiverContactName) {
      setErrors(prev => ({ ...prev, receiverContactName: 'Contact Name is required.' }));
      formIsValid = false;
    }
    if (!receiverPhone || !/^\+?\d{10,}$/.test(receiverPhone)) {
      setErrors(prev => ({ ...prev, receiverPhone: 'Phone Number must be at least 10 digits.' }));
      formIsValid = false;
    }
    if (receiverEmail && !/\S+@\S+\.\S+/.test(receiverEmail)) {
      setErrors(prev => ({ ...prev, receiverEmail: 'Email is invalid.' }));
      formIsValid = false;
    }

    if (!formIsValid) {
      showToast('Validation Error', 'Please check all required fields', 'warning');
      setIsLoading(false);
      return; // ✅ stop here
    }

    setReceiverCountryCode(receiverCountry);

  

// 🔑 PAYMENT / BALANCE CHECK - Fixed Version
try {
  const token = localStorage.getItem("authToken");
  const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/payment/doesPaymentMethodExist`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // ✅ Convert to numbers at the start
  const numericUserBalance = parseFloat(userBalance) || 0;
  const numericCourierCost = parseFloat(courierCost) || 0;

  console.log('Payment debug:', {
    numericUserBalance,
    numericCourierCost,
    doesPaymentMethodExist: response.data.doesPaymentMethodExist,
  });

  const hasPaymentMethod = response.data.doesPaymentMethodExist == 1; // Use == instead of === to handle string/number

  console.log('Payment method check:', {
    rawValue: response.data.doesPaymentMethodExist,
    type: typeof response.data.doesPaymentMethodExist,
    hasPaymentMethod
  });

  // ✅ ONLY fail if NO payment method AND insufficient balance
  if (response.data.doesPaymentMethodExist != 1) {
    // No payment method on file - can only use balance
    if (numericUserBalance < numericCourierCost) {
      console.log('❌ FAILING: No payment method AND insufficient balance');
      showToast(
        'Payment Required', 
        'You do not have enough balance to cover the shipping cost and no payment method is on file. Please add funds or a payment method.', 
        'error'
      );
      setIsLoading(false);
      return;
    }
    
    // Balance covers the cost - deduct from balance
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
      { courierCost: numericCourierCost },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!res.data.success) {
      showToast('Payment Error', 'Failed to deduct from balance', 'error');
      setIsLoading(false);
      return;
    }
    balanceDeductAmount = numericCourierCost;
    setUserBalance(res.data.balance);
    
  } else {
    // ✅ HAS payment method - handle all scenarios without failing on balance check
    console.log('✅ Has payment method - processing payment...');
    
    if (numericUserBalance >= numericCourierCost) {
      // Balance fully covers - use balance only
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
        { courierCost: numericCourierCost },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.data.success) {
        showToast('Payment Error', 'Failed to deduct from balance', 'error');
        setIsLoading(false);
        return;
      }
      balanceDeductAmount = numericCourierCost;
      setUserBalance(res.data.balance);
      
    } else if (numericUserBalance > 0) {
      // Partial balance + card charge
      const remainingAmount = numericCourierCost - numericUserBalance;

      // First deduct available balance
      const balanceRes = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/payment/balance/deduct`,
        { courierCost: numericUserBalance },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!balanceRes.data.success) {
        showToast('Payment Error', 'Failed to deduct from balance', 'error');
        setIsLoading(false);
        return;
      }
      balanceDeductAmount = numericUserBalance;
      setUserBalance(balanceRes.data.balance);

      // Then authorize card for remainder
      const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(remainingAmount);
      if (!isAuthorized || !paymentIntentId) {
        showToast('Payment Failed', `Payment authorization failed: ${error || 'Unknown error'}`, 'error');
        setIsLoading(false);
        return;
      }
      paymentId = paymentIntentId;
      
    } else {
      // No balance - charge full amount to card
      const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(numericCourierCost);
      if (!isAuthorized || !paymentIntentId) {
        showToast('Payment Failed', `Payment authorization failed: ${error || 'Unknown error'}`, 'error');
        setIsLoading(false);
        return;
      }
      paymentId = paymentIntentId;
    }
  }
  
} catch (error) {
  console.error("Error in payment processing:", error.response?.data || error.message);
  
  // ✅ FIXED: Don't show generic insufficient funds message here
  // Only show this if it's actually a server/network error
  if (error.response?.status >= 500 || !error.response) {
    showToast('Payment Error', 'Server error occurred. Please try again.', 'error');
  } else {
    showToast('Payment Error', 'Payment processing failed. Please check your payment details.', 'error');
  }
  
  setIsLoading(false);
  return;
}

    // 🔑 CREATE SHIPMENT (only reached if payment succeeded / balance was deducted)
    try {
      if (courierId === "GlsDicomExpressGround") {
        const glsShipmentData = getGlsCreateShipmentData({
          senderAddressLine1, senderAddressLine2, senderProvince, senderCity, senderPostalCode,
          senderCompanyName, senderContactName, senderPhone, senderEmail,
          receiverAddressLine1, receiverAddressLine2, receiverProvince, receiverCity, receiverPostalCode,
          receiverContactName, receiverPhone, receiverEmail, receiverCountryCode,
          dimensions, weight, courierId
        });

        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/get-gls-label`,
          glsShipmentData
        );
        newShipmentId = response.data.trackingNumber;
        newCourierName = "GLS Canada";
        newTrackingNumber = response.data.carrierTrackingNos[0];
        newLabelState = "ready";
      } else {
        const shipmentData = getCreateShipmentData({
          senderAddressLine1, senderAddressLine2, senderProvince, senderCity, senderPostalCode,
          senderCompanyName, senderContactName, senderPhone, senderEmail,
          receiverAddressLine1, receiverAddressLine2, receiverProvince, receiverCity, receiverPostalCode,
          receiverContactName, receiverPhone, receiverEmail, receiverCountryCode,
          dimensions, weight, courierId
        });

        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/get-label`,
          shipmentData
        );
        newShipmentId = response.data.shipment.easyship_shipment_id;
        newCourierName = response.data.shipment.courier_service.name;
        newLabelState = "pending";
      }

      if (newShipmentId) {
        if (courierId === "GlsDicomExpressGround") {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/api/download-gls-label`,
              {
                params: {
                  shipment_id: newShipmentId,
                  documentSize: 'Thermal',
                  ...(paymentId && { payment_id: paymentId }),
                },
              }
            );
            setPdfLink(await generatePdfLink(response.data.base64String, newTrackingNumber));
            setShipmentId(newShipmentId);
            setCourierName(newCourierName);
            setTrackingNumber(newTrackingNumber);
            setLabelState(newLabelState);
            setModalType("shipmentDetails");
            onOpen();
          } catch (error) {
            console.error("Error fetching GLS label:", error);
            showToast('Error', 'Failed to fetch GLS label. Please try again.', 'error');
          }
        } else {
          setShipmentId(newShipmentId);
          setCourierName(newCourierName);
          setLabelState(newLabelState);
          setIsLoading(false);
          setModalType("shipmentDetails");
          onOpen();

          try {
            const authToken = localStorage.getItem("authToken");
            await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/download-label`, {
              params: {
                shipment_id: newShipmentId,
                format: 'PDF',
                label: 'A4',
                commercial_invoice: 'A4',
                packing_slip: 'none',
                shopify_order_id: orderId,
                shopify_line_item_id: lineItemId,
                auth_token: authToken,
                courier_name: newCourierName,
                ...(paymentId && { payment_id: paymentId }),
                balance_deduct_amount: balanceDeductAmount
              },
            });
          } catch (error) {
            console.error("Error fetching label:", error);
            showToast('Error', 'Failed to fetch label. Please try again.', 'error');
          }
        }
      } else {
        showToast('Error', 'Shipment label generation failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error("Error in shipment creation:", error);
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
            `${process.env.REACT_APP_BACKEND_URL}/payment/balance/add`, // You'll need this endpoint
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
      showToast('Shipment Error', 'Failed to create shipment. Please try again or contact support.', 'error');
      setIsLoading(false);
      return; // ✅ stop after failure
    }
  } finally {
    if (newShipmentId && orderId && courierId === 'GlsDicomExpressGround') {
      const authToken = localStorage.getItem("authToken");
      fulfillShopifyOrder(orderId, lineItemId, newTrackingNumber, newCourierName, authToken);
    }
    setIsLoading(false);
  }
};
return (
  <div
    className="shipping-form-container"
    style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Subtle gradient
      padding: '40px 20px',
      minHeight: '100vh',
      marginTop: "0px"
    }}
  >
    <form
      onSubmit={handleSubmit}
      className="shipping-form"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        padding: '30px',
        marginTop: "-27px"
      }}
    >
      <div
        className="courier-info"
        style={{
          marginBottom: '20px',
        }}
      >
        <div
          className="courier-details"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '15px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="courier-image">
            <img
              src={courierUrl}
              alt="GLS Logo"
              className="gls-logo"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
              }}
            />
          </div>
          <div className="courier-cost">
            <h3
              style={{
                margin: 0,
                fontSize: '1.5em',
                color: '#1e293b',
                fontWeight: '600',
                letterSpacing: '0.02em',
              }}
            >
              $ {courierCost}
            </h3>
          </div>
        </div>
      </div>
      {/* Sender and Receiver Info */}
      <div
        className="sender-receiver-container"
        style={{
          marginBottom: '20px',
        }}
      >
        <div
          className="input-group"
          style={{
            marginBottom: '15px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.25em',
              color: '#1e293b',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Ship From:
            <Button
              onClick={() => {
                setModalType('userAddress');
                onOpen();
              }}
              style={{
                color: '#ffffff',
                backgroundColor: '#06b6d4',
                border: 'none',
                borderRadius: '6px',
                padding: '2px 6px', // Reduced padding
                fontSize: '0.8em',   // Slightly smaller text
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(6, 182, 212, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#06b6d4';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(6, 182, 212, 0.3)';
              }}
            >
              Change
            </Button>

          </h3>
          <span
            style={{
              fontSize: '1em',
              color: '#475569',
              marginTop: '8px',
              display: 'block',
            }}
          >
            {userAddressDetails ? (
              <>
                {userAddressDetails.userAddress}
                {userAddressDetails.userAddress2 ? `, ${userAddressDetails.userAddress2}` : ''}, {userAddressDetails.userProvince}
                <br />
                {userAddressDetails.userPostalCode}
              </>
) : 'Loading...'}
          </span>
          {modalType === 'userAddress' && (
            <UserAddressModal
              isOpen={isOpen}
              onOpen={onOpen}
              onClose={() => {
                onClose();
                fetchUserAddress({
                  setUserAddressDetails,
                  setSenderAddressLine1,
                  setSenderAddressLine2,
                  setSenderProvince,
                  setSenderCity,
                  setSenderPostalCode,
                  setSenderCompanyName,
                  setSenderContactName,
                  setSenderPhone,
                  setSenderEmail,
                });
                setModalType(null);
              }}
              shouldReload={true}
            />
          )}
        </div>
        <h3
          style={{
            margin: '0 0 15px 0',
            fontSize: '1.25em',
            color: '#1e293b',
            fontWeight: '600',
          }}
        >
          Ship To:
        </h3>
        <div
          className="sender-info"
          style={{
            marginBottom: '20px',
          }}
        >
          <div
            className="input-group"
            style={{
              marginBottom: '0px',
            }}
          >
            <label
              htmlFor="receiverContactName"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
                marginTop: '-20px'
              }}
            >
              Contact Name
            </label>
            <input
              type="text"
              id="receiverContactName"
              value={receiverContactName}
              onChange={(e) => setReceiverContactName(e.target.value)}
              placeholder="Enter receiver's contact name"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.receiverContactName && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverContactName}
              </p>
            )}
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
            }}
          >
            <label
              htmlFor="receiverAddressLine1"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              Address Line 1
            </label>
            <input
              type="text"
              id="receiverAddressLine1"
              value={receiverAddressLine1}
              onChange={(e) => setReceiverAddressLine1(e.target.value)}
              placeholder="Enter receiver's address line 1"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                marginBottom: '-20px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.receiverAddressLine1 && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverAddressLine1}
              </p>
            )}
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
            }}
          >
            <label
              htmlFor="receiverAddressLine2"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              id="receiverAddressLine2"
              value={receiverAddressLine2}
              onChange={(e) => setReceiverAddressLine2(e.target.value)}
              placeholder="Enter receiver's address line 2"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
              marginTop: '-20px'
            }}
          >
            <label
              htmlFor="receiverCity"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              City
            </label>
            <input
              type="text"
              id="receiverCity"
              value={receiverCity}
              onChange={(e) => setReceiverCity(e.target.value)}
              placeholder="Enter receiver's city"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.receiverCity && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverCity}
              </p>
            )}
          </div>
        </div>
        <div className="receiver-info">
          <div
            className="input-group"
            style={{
              marginBottom: '0px',
            }}
          >
            <label
              htmlFor="receiverProvince"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
                marginTop: '-20px'
              }}
            >
              Province
            </label>
            <select
              value={receiverProvince}
              onChange={handleProvinceChange}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                backgroundSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            >
              <option value="">Select a Province/State</option>
              {provinceOptions.map((province, index) => (
                <option key={index} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.receiverProvince && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverProvince}
              </p>
            )}
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
            }}
          >
            <label
              htmlFor="receiverPostalCode"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
              }}
            >
              Postal Code
            </label>
            <input
              type="text"
              id="receiverPostalCode"
              value={receiverPostalCode}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: 'lightgray',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              readOnly
            />
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
            }}
          >
            <label
              htmlFor="receiverPhone"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
                marginTop: '-20px'
              }}
            >
              Phone Number
            </label>
            <input
              type="text"
              id="receiverPhone"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="Enter receiver's phone number"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.receiverPhone && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverPhone}
              </p>
            )}
          </div>
          <div
            className="input-group"
            style={{
              marginBottom: '15px',
            }}
          >
            <label
              htmlFor="receiverEmail"
              style={{
                fontSize: '0.9em',
                color: '#1e293b',
                fontWeight: '500',
                marginBottom: '6px',
                display: 'block',
                marginTop: '-20px'
              }}
            >
              Email (optional)
            </label>
            <input
              type="text"
              id="receiverEmail"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="Enter receiver's email"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1em',
                backgroundColor: '#f8fafc',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.receiverEmail && (
              <p
                className="error-message"
                style={{
                  color: '#dc2626',
                  fontSize: '0.85em',
                  margin: '4px 0 0',
                }}
              >
                {errors.receiverEmail}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className="input-group"
        style={{
          marginBottom: '5px',
          marginTop: '-50px'
        }}
      >
        <label
          style={{
            fontSize: '0.9em',
            color: '#1e293b',
            fontWeight: '500',
            marginBottom: '6px',
            display: 'block',
            marginTop: '-10px'
          }}
        >
          Dimensions (cm)
        </label>
        <div
          className="dimensions-inputs"
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="number"
            placeholder="Length"
            value={dimensions.length}
            readOnly
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '5px',
              fontSize: '1em',
              backgroundColor: 'lightgray',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onChange={(e) =>
              setDimensions({ ...dimensions, length: parseFloat(e.target.value) || 0 })
            }
          />
          <input
            type="number"
            placeholder="Width"
            value={dimensions.width}
            readOnly
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '5px',
              fontSize: '1em',
              backgroundColor: 'lightgray',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onChange={(e) =>
              setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 0 })
            }
          />
          <input
            type="number"
            placeholder="Height"
            value={dimensions.depth}
            readOnly
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '5px',
              fontSize: '1em',
              backgroundColor: 'lightgray',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onChange={(e) =>
              setDimensions({ ...dimensions, depth: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>
      <div
        className="input-group"
        style={{
          marginBottom: '15px',
        }}
      >
        <label
          htmlFor="weight"
          style={{
            fontSize: '0.9em',
            color: '#1e293b',
            fontWeight: '500',
            marginBottom: '6px',
            display: 'block',
            marginTop: '-10px'
          }}
        >
          Weight (kg)
        </label>
        <input
          type="number"
          id="weight"
          value={weight}
          readOnly
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '5px',
            fontSize: '1em',
            backgroundColor: 'lightgray',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
          placeholder="Enter weight in kg"
        />
      </div>
      <button
        type="submit"
        className="button"
        disabled={isButtonDisabled}
        style={{
          backgroundColor: isButtonDisabled ? '#ccc' : '#06b6d4',
          color: isButtonDisabled ? '#666' : '#ffffff',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1em',
          fontWeight: '600',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isButtonDisabled ? 'none' : '0 3px 8px rgba(235, 131, 52, 0.3)',
          outline: 'none',
          opacity: isButtonDisabled ? 0.6 : 1,
        }}
        onMouseOver={(e) => {
          if (!isButtonDisabled) {
            e.currentTarget.style.backgroundColor = '#f26513';
            e.currentTarget.style.boxShadow = '0 5px 12px rgba(153, 19, 242, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (!isButtonDisabled) {
            e.currentTarget.style.backgroundColor = '#06b6d4';
            e.currentTarget.style.boxShadow = '0 3px 8px rgba(235, 131, 52, 0.3)';
          }
        }}
      >
        Create Shipment
      </button>
    </form>
    {modalType === 'shipmentDetails' && (
      <ShipmentDetailsModal
        recipientName={receiverContactName}
        recipientAddress={receiverAddressLine1}
        courierName={courierName}
        trackingNumber={trackingNumber}
        pdfLink={pdfLink}
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setModalType(null);
          if (orderId) {
            onShopifyOrderModalClose();
          }
        }}
      />
    )}
    {isLoading && (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
        }}
      >
        <Center
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <LoadingAnimation />
        </Center>
      </Box>
    )}
  </div>
);
  }
export default CreateShipmentForm;