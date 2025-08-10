import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ShipmentDetailsModal from '../modals/ShipmentDetailsModal';
import UserAddressModal from '../modals/UserAddressModal';
import AddPaymentMethodModal from '../modals/AddPaymentMethodModal';
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

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  let newTrackingNumber = "";
  let newShipmentId = "";
  let newCourierName = "";
  let newLabelState = "";
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

  let formIsValid = true;

  // Validate receiver address line 1
  if (!receiverAddressLine1) {
    setErrors(prev => ({ ...prev, receiverAddressLine1: 'Address Line 1 is required.' }));
    formIsValid = false;
  }

  // Validate city
  if (!receiverCity) {
    setErrors(prev => ({ ...prev, receiverCity: 'City is required.' }));
    formIsValid = false;
  }

  // Validate province
  if (!receiverProvince) {
    setErrors(prev => ({ ...prev, receiverProvince: 'Province is required.' }));
    formIsValid = false;
  }

  // Validate contact name
  if (!receiverContactName) {
    setErrors(prev => ({ ...prev, receiverContactName: 'Contact Name is required.' }));
    formIsValid = false;
  }

  // Validate phone number (must be 10 digits)
  if (!receiverPhone || !/^\+?\d{10,}$/.test(receiverPhone)) {
    setErrors(prev => ({ ...prev, receiverPhone: 'Phone Number must be at least 10 digits.' }));
    formIsValid = false;
}


  // Validate email (proper email format)
  if (receiverEmail && !/\S+@\S+\.\S+/.test(receiverEmail)) {
  setErrors(prev => ({ ...prev, receiverEmail: 'Email is invalid.' }));
  formIsValid = false;
}

  // If form is valid, proceed with the rest of the logic
  if (!formIsValid) {
    showToast('Validation Error', 'Please check all required fields', 'warning');
    return;
  }
  //ACTUAL LOGIC!!!
  setReceiverCountryCode(receiverCountry);
  // Check to see if there is a payment method on file, if not open add payment method modal
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/payment/doesPaymentMethodExist`, {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    if (!response.data.doesPaymentMethodExist) {
      setModalType("paymentMethod");
      onOpen();
      return; // Exit the function if stripe_customer_id is null
    }
    // Proceed with further logic if needed
  } catch (error) {
    console.error("Error checking payment method:", error.response?.data || error.message);
  }
  //continue with payment
  let paymentId = "";
  try {
    // Step 1: Authorize payment
    const { success: isAuthorized, paymentIntentId, error } = await authorizePayment(courierCost);

    if (!isAuthorized) {
      showToast('Payment Failed', `Payment authorization failed: ${error}`, 'error');
      return;
    }
    paymentId = paymentIntentId; // Assign paymentIntentId here
    if (!paymentId) {
      throw new Error('PaymentIntent ID is missing');
    }
    // Step 2: Proceed to create the shipment
    //CORE LOGIC TO CREATE LABEL BASED ON THE COURIER SELECTED 
    if (courierId == "GlsDicomExpressGround")
    {
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
      newCourierName="GLS Canada";
      newTrackingNumber = response.data.carrierTrackingNos[0];
      newLabelState = "ready";
    }else{
      //state of the label (pending / generated)
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
      // Extract shipment details
      newShipmentId = response.data.shipment.easyship_shipment_id;
      newCourierName = response.data.shipment.courier_service.name;
      newLabelState="pending";
    }
    if (newShipmentId) {
        //DOWNLOAD SHIPPING LABELS AND OPEN SHIPMENT DETAILS MODAL
        if (courierId == "GlsDicomExpressGround"){
        try {
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/download-gls-label`, {
            params: { shipment_id: newShipmentId, documentSize: 'Thermal', payment_id: paymentId}
          });
          setPdfLink(await generatePdfLink(response.data.base64String, newTrackingNumber));
          //setting label values in state
          setShipmentId(newShipmentId);
          setCourierName(newCourierName);
          setTrackingNumber(newTrackingNumber);
          setLabelState(newLabelState);
          setIsLoading(false);
          // set modal type
          setModalType("shipmentDetails");
          // Open the modal
          onOpen();
        } catch (error) {
          console.error("Error fetching GLS label:", error);
          showToast('Error', 'Failed to fetch GLS label. Please try again.', 'error');
        }
      }
      else {
        // POLL the NON gls label route until there is a response and update label in db with tracking and pdf url
        // setting label values in state
        setShipmentId(newShipmentId);
        setCourierName(newCourierName);
        setLabelState(newLabelState); 
        setIsLoading(false);
        // set modal type
        setModalType("shipmentDetails");
        // Open the modal
        onOpen();
        
        try {
          // Get auth token from localStorage
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
              payment_id: paymentId
            }
          });
          // You can handle the response here if needed
        } catch (error) {
          console.error("Error fetching label:", error);
          showToast('Error', 'Failed to fetch label. Please try again.', 'error');
        }
      }
    } else {
      console.error("Base64 encoded string for label not found.");
      showToast('Error', 'Shipment label generation failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error("Error in shipment creation:", error);
    // Step 4: Void the payment if shipment creation fails
    if (paymentId) {
      try {
        await voidPayment(paymentId);
      } catch (voidError) {
        console.error("Failed to void payment:", voidError.message);
      }
    }
    showToast('Shipment Error', 'Failed to create shipment. Please try again or reach out to support.', 'error');
  } 
}finally {
  //Mark the order as fulfilled in shopify if this is a shopify store order, only do so here for gls shipments, rest will be marked when label is generated in the backend
    if(newShipmentId && orderId && courierId === 'GlsDicomExpressGround')
    {
      // Get auth token from localStorage
      const authToken = localStorage.getItem("authToken");
      fulfillShopifyOrder(orderId, lineItemId, newTrackingNumber, newCourierName, authToken);
    }
    // Ensure loading state is turned off
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
    {modalType === 'paymentMethod' && (
      <Elements stripe={stripePromise}>
        <AddPaymentMethodModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setModalType(null);
          }}
        />
      </Elements>
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