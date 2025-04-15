import React, { useState, useEffect, useRef } from 'react';
import RateEstimate from './RateEstimate';
import "../styles/RateEstimateForm.css";
import getRegionFromPostalCode from '../functions/fetchRegion';
import { Spinner, Switch, FormControl, FormLabel, Button, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { EditIcon } from '@chakra-ui/icons'; 
import UserAddressModal from '../modals/UserAddressModal';

function RateEstimateForm(props) {
    // Create refs for elements we need to manipulate directly
    const formRef = useRef(null);
    
    // Sender info
    const [senderPostalCode, setSenderPostalCode] = useState("");
    const [senderCountryCode, setSenderCountryCode] = useState("CA");
    
    // Receiver info
    const receiverAddressLine1 = props.receiverAddressLine1 || "";
    const receiverAddressLine2 = props.receiverAddressLine2 || "";
    const receiverCity = props.receiverCity || "";
    const receiverName = props.receiverName || "";
    const receiverPhoneNumber = props.receiverPhoneNumber || "";
    const receiverEmail = props.receiverEmail || "";
    const [receiverPostalCode, setReceiverPostalCode] = useState(props.receiverPostalCode);
    const [receiverCountryCode, setReceiverCountryCode] = useState("CA");

    // Parcel info
    const [weight, setWeight] = useState("");
    const [dimensions, setDimensions] = useState({ length: "", width: "", depth: "" });

    // Residential switch state
    const [isResidential, setIsResidential] = useState(false);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [rateEstimateComponent, setRateEstimateComponent] = useState(null);
    const [loading, setLoading] = useState(false);

    const [labelsPrinted, setLabelsPrinted] = useState(0);
    const [errors, setErrors] = useState({});

    // Use Chakra UI's disclosure hook
    const { isOpen, onOpen, onClose } = useDisclosure();
    
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    // Track modal open/close state
    const [modalWasOpen, setModalWasOpen] = useState(false);

    // validate postal code function
    const validatePostalCode = (postalCode, countryCode) => {
        const postalCodeFormats = {
            CA: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, // Canada (e.g., K1A 0B1)
            US: /^\d{5}(-\d{4})?$/, // United States (e.g., 12345 or 12345-6789)
            GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, // United Kingdom
            AU: /^\d{4}$/, // Australia
            DE: /^\d{5}$/, // Germany
            FR: /^\d{5}$/, // France
            IT: /^\d{5}$/, // Italy
            ES: /^\d{5}$/, // Spain
            NL: /^\d{4} ?[A-Z]{2}$/, // Netherlands
        };
    
        const regex = postalCodeFormats[countryCode];
        return regex ? regex.test(postalCode) : true; // If no regex available, assume valid
    };    

    // Fix for the modal freezing issue
    useEffect(() => {
        if (isOpen) {
            // Modal is opening
            setModalWasOpen(true);
            // Make sure the body isn't locked
            document.body.style.overflow = 'visible';
            document.body.style.pointerEvents = 'auto';
        } else if (modalWasOpen) {
            // Modal was open and is now closing
            // Force body to be interactive
            document.body.style.overflow = 'visible';
            document.body.style.pointerEvents = 'auto';
            
            // Remove any modal-related classes or styles
            const modalBackdrops = document.querySelectorAll('.chakra-modal__overlay');
            modalBackdrops.forEach(el => {
                el.style.display = 'none';
            });
            
            // Delay to ensure everything is cleaned up
            setTimeout(() => {
                // Final cleanup after a short delay
                document.body.style.pointerEvents = 'auto';
                document.body.style.overflow = 'visible';
                
                // Force focus back to the form
                if (formRef.current) {
                    formRef.current.style.pointerEvents = 'auto';
                }
                
                setModalWasOpen(false);
            }, 100);
        }
    }, [isOpen, modalWasOpen]);
    
    // Check if it's the user's first login and open the modal if it is
    useEffect(() => {
        const checkFirstLogin = async () => {
            const token = localStorage.getItem("authToken");
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/isFirstLogon`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.isFirstLogin) {
                    setIsFirstLogin(true);
                    onOpen(); // Open the modal automatically
                }
            } catch (error) {
                console.error("Error checking first logon:", error.response?.data || error.message);
            }
        };
        checkFirstLogin();
    }, [onOpen]);
    
    //set labels printed and sender postal code
    useEffect(() => {
        //labels printed
        const fetchLabelsPrintedCount = async () => {
            const token = localStorage.getItem("authToken");
            try {
              const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/user/getLabelsPrinted`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              setLabelsPrinted(response.data.labels_printed);
            } catch (error) {
              console.error("Error fetching user account details:", error);
            }
          };
          //sender postal code
          const fetchSenderPostalCode = async () => {
            // Check if postal code is already cached in localStorage
            const cachedPostalCode = localStorage.getItem("userPostalCode");
    
            if (cachedPostalCode !== null && cachedPostalCode !== "null" && cachedPostalCode !== "undefined") {
                setSenderPostalCode(cachedPostalCode);
                return; // Stop here if we found cached values
            }
            // If not cached, fetch from API
            const token = localStorage.getItem("authToken"); // JWT token
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/user/getSenderPostalCode`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSenderPostalCode(response.data.postalCode);
    
                // Store in localStorage for future use
                localStorage.setItem("userPostalCode", response.data.postalCode);
            } catch (error) {
                console.error("Error fetching sender postal code:", error);
            }
        };
        fetchSenderPostalCode();
        fetchLabelsPrintedCount();
      }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({}); // Clear previous errors
        let newErrors = {};
        
        // Check required fields
        if (!senderPostalCode) newErrors.senderPostalCode = "Sender postal code is required.";
        if (!receiverPostalCode) newErrors.receiverPostalCode = "Receiver postal code is required.";
        if (!weight || weight <= 0) newErrors.weight = "Weight must be greater than 0.";
        if (!dimensions.length || !dimensions.width || !dimensions.depth) {
            newErrors.dimensions = "All dimensions (length, width, height) are required.";
        }
        
        // Validate postal codes
        if (senderPostalCode && !validatePostalCode(senderPostalCode, senderCountryCode)) {
            newErrors.senderPostalCode = "Invalid postal code format for the selected country.";
        }
        if (receiverPostalCode && !validatePostalCode(receiverPostalCode, receiverCountryCode)) {
            newErrors.receiverPostalCode = "Invalid postal code format for the selected country.";
        }
        // If there are errors, update state and stop submission
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false); // Reset submitting state
            return;
        }
    
        setLoading(true);
        try {
            const senderRegion = await getRegionFromPostalCode(senderPostalCode, senderCountryCode);
            const receiverRegion = await getRegionFromPostalCode(receiverPostalCode, receiverCountryCode);
            setRateEstimateComponent(
                <RateEstimate
                    senderPostalCode={senderPostalCode}
                    senderProvince={senderRegion}
                    senderCountry={senderCountryCode}
                    receiverAddressLine1={receiverAddressLine1}
                    receiverAddressLine2={receiverAddressLine2}
                    receiverCity={receiverCity}
                    receiverPostalCode={receiverPostalCode}
                    receiverProvince={receiverRegion}
                    receiverCountry={receiverCountryCode}
                    receiverName={receiverName}
                    receiverPhoneNumber={receiverPhoneNumber}
                    receiverEmail={receiverEmail}
                    weight={weight}
                    dimensions={dimensions}
                    isResidential={isResidential}
                    labelsPrinted={labelsPrinted}
                    orderId={props.orderId}
                    lineItemId={props.lineItemId}
                    onShopifyOrderModalClose={props.onShopifyOrderModalClose}
                />
            );
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };
    
    const handleGoBack = () => {
        setIsSubmitted(false); // Reset form visibility
        //setRateEstimateComponent(null); // Clear rate estimate
    };

    // Handler for when the UserAddressModal is closed
    const handleModalClose = () => {
        // First close the modal
        onClose();
        
        // Force enable interaction
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'visible';
        
        // Refresh the postal code after modal is closed
        const cachedPostalCode = localStorage.getItem("userPostalCode");
        if (cachedPostalCode) {
            setSenderPostalCode(cachedPostalCode);
        }
        
        // Ensure form is interactive after a slight delay
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.style.pointerEvents = 'auto';
            }
            document.body.style.pointerEvents = 'auto';
        }, 100);
    };

    return (
      <div className="shipping-form-container">
        {!isSubmitted ? (
          <form ref={formRef} onSubmit={handleSubmit} className="shipping-form">
            {/* Sender and Receiver Info */}
            <div className="sender-receiver-container">
            <div className="sender-info">
  <div style={{ display: "flex", alignItems: "center" }}>
    <h3 style={{ margin: 0 }}>Sender Info</h3>
    <button
      type="button"
      onClick={() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'visible';
        onOpen();
      }}
      style={{
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        padding: "5px",
        cursor: "pointer",
        borderRadius: "5px",
        height: "30px",
        display:
          window.location.href.includes("create-shipment") ||
          window.location.href.includes("integration")
            ? "flex"
            : "none",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: "10px",
      }}
    >
      <EditIcon color="white" />
    </button>
  </div>


                <div className="input-group">
                  <div className="postal-country-group">
                    <div className="postal-code">
                      <label
                        htmlFor="senderPostalCode"
                      >
                        Sender Postal Code
                      </label>
                      <input
                        type="text"
                        id="senderPostalCode"
                        value={senderPostalCode}
                        onChange={(e) => setSenderPostalCode(e.target.value)}
                        placeholder="Enter sender's postal code"
                        disabled={
                          window.location.pathname.includes("create-shipment") ||
                          window.location.pathname.includes("integration")
                        }
                        style={{
                          backgroundColor:
                            window.location.pathname.includes("create-shipment") ||
                            window.location.pathname.includes("integration")
                              ? "#f0f0f0"
                              : "#fff",
                          color:
                            window.location.pathname.includes("create-shipment") ||
                            window.location.pathname.includes("integration")
                              ? "#888"
                              : "#000",
                          cursor:
                            window.location.pathname.includes("create-shipment") ||
                            window.location.pathname.includes("integration")
                              ? "not-allowed"
                              : "text",
                        }}
                      />
                      {errors.senderPostalCode && (
                        <p className="error-message">{errors.senderPostalCode}</p>
                      )}
                    </div>
                    <div className="country-code">
                      <label htmlFor="senderCountryCode">Country</label>
                      <select
                        id="senderCountryCode"
                        value={senderCountryCode}
                        onChange={(e) => setSenderCountryCode(e.target.value)}
                        style={{backgroundColor: "lightblue"}}
                      >
                        <option value="" disabled>
                          Select a Country Code
                        </option>
                        <option value="US">United States (US)</option>
                        <option value="CA">Canada (CA)</option>
                        <option value="GB">United Kingdom (GB)</option>
                        <option value="AU">Australia (AU)</option>
                        <option value="NZ">New Zealand (NZ)</option>
                        <option value="DE">Germany (DE)</option>
                        <option value="FR">France (FR)</option>
                        <option value="IT">Italy (IT)</option>
                        <option value="ES">Spain (ES)</option>
                        <option value="SE">Sweden (SE)</option>
                        <option value="NO">Norway (NO)</option>
                        <option value="DK">Denmark (DK)</option>
                        <option value="FI">Finland (FI)</option>
                        <option value="CH">Switzerland (CH)</option>
                        <option value="JP">Japan (JP)</option>
                        <option value="SG">Singapore (SG)</option>
                        <option value="KR">South Korea (KR)</option>
                        <option value="IE">Ireland (IE)</option>
                        <option value="NL">Netherlands (NL)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            
              <div className="receiver-info">
                <h3>Receiver Info</h3>
                <div className="input-group">
                  <div className="postal-country-group">
                    <div className="postal-code">
                      <label htmlFor="receiverPostalCode">Receiver Postal Code</label>
                      <input
                        type="text"
                        id="receiverPostalCode"
                        value={receiverPostalCode}
                        onChange={(e) => setReceiverPostalCode(e.target.value)}
                        placeholder="Enter receiver's postal code"
                      />
                      {errors.receiverPostalCode && (
                        <p className="error-message">{errors.receiverPostalCode}</p>
                      )}
                    </div>
                    <div className="country-code">
                      <label htmlFor="receiverCountryCode">Country</label>
                      <select
                        id="receiverCountryCode"
                        value={receiverCountryCode}
                        onChange={(e) => setReceiverCountryCode(e.target.value)}
                        style={{backgroundColor: "lightblue"}}
                      >
                        <option value="" disabled>
                          Select a Country Code
                        </option>
                        <option value="US">United States (US)</option>
                        <option value="CA">Canada (CA)</option>
                        <option value="GB">United Kingdom (GB)</option>
                        <option value="AU">Australia (AU)</option>
                        <option value="NZ">New Zealand (NZ)</option>
                        <option value="DE">Germany (DE)</option>
                        <option value="FR">France (FR)</option>
                        <option value="IT">Italy (IT)</option>
                        <option value="ES">Spain (ES)</option>
                        <option value="SE">Sweden (SE)</option>
                        <option value="NO">Norway (NO)</option>
                        <option value="DK">Denmark (DK)</option>
                        <option value="FI">Finland (FI)</option>
                        <option value="CH">Switzerland (CH)</option>
                        <option value="JP">Japan (JP)</option>
                        <option value="SG">Singapore (SG)</option>
                        <option value="KR">South Korea (KR)</option>
                        <option value="IE">Ireland (IE)</option>
                        <option value="NL">Netherlands (NL)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weight and Residential Switch Grouped */}
            <div className="input-group weight-residential-group">
              <div className="weight-input">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  placeholder="Enter weight in kg"
                />
                {errors.weight && (
                  <p className="error-message">{errors.weight}</p>
                )}
              </div>
              <FormControl
                className="residential-switch"
                display="flex"
                alignItems="center"
              >
                <FormLabel htmlFor="residential-switch" mb="0">
                  Residential?
                </FormLabel>
                <Switch
                  id="residential-switch"
                  isChecked={isResidential}
                  onChange={() => setIsResidential(!isResidential)}
                />
              </FormControl>
            </div>
            
            {/* Dimensions Input */}
            <div className="input-group">
              <label>Dimensions (cm)</label>
              <div className="dimensions-inputs">
                <input
                  type="number"
                  placeholder="Length"
                  value={dimensions.length}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, length: parseFloat(e.target.value) })
                  }
                />
                <input
                  type="number"
                  placeholder="Width"
                  value={dimensions.width}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, width: parseFloat(e.target.value) })
                  }
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={dimensions.depth}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, depth: parseFloat(e.target.value) })
                  }
                />
              </div>
              {errors.dimensions && (
                <p className="error-message">{errors.dimensions}</p>
              )}
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              Get Rates
            </button>
          </form>
        ) : (
          <>
            {rateEstimateComponent}
            <Button onClick={handleGoBack} colorScheme="teal" mt={4}>
              Get New Rate
            </Button>
          </>
        )}
    
        {/* Show loading spinner */}
        {loading && <Spinner size="xl" color="teal.500" />}
        
        {/* Add the UserAddressModal component here */}
        <UserAddressModal 
          isOpen={isOpen} 
          onOpen={onOpen}
          onClose={handleModalClose}
          isFirstLogin={isFirstLogin}
          shouldReload={false}
        />
      </div>
    );
}
export default RateEstimateForm;




