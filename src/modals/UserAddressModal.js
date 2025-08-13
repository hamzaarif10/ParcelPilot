import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast
} from "@chakra-ui/react";
import loadGoogleMapsAPI from "../functions/loadGoogleMapsApi";
import initAutocomplete from "../functions/initAutoComplete";
import getProvinceCode from "../functions/getProvinceCode";
import { canadianProvinces, usStates, ukCountries, australianStates, newZealandRegions, germanStates, frenchRegions, 
  italianRegions, spanishAutonomousCommunities, swedishCounties, norwegianCounties,  
  danishRegions, finnishRegions, swissCantons, japanesePrefectures, singaporeRegions} from '../data/locationData';

const UserAddressModal = ({ isOpen, onClose, isFirstLogin, shouldReload }) => {
  const [senderAddressLine1, setSenderAddressLine1] = useState("");
  const [senderAddressLine2, setSenderAddressLine2] = useState("");
  const [senderProvince, setSenderProvince] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderCompanyName, setSenderCompanyName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const senderCountry = "CA";
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [errors, setErrors] = useState({});
  const toast = useToast();
  //state to prevent Database overloading with spam
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProvinceChange = (e) => {
    setSenderProvince(e.target.value);
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
  const provinceOptions = getProvincesOrStates(senderCountry);

  // USE EFFECT #1 - Initialize Google Maps autocomplete when modal opens
  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      timeoutId = setTimeout(() => {
        loadGoogleMapsAPI(() => {
          const addressInput = document.getElementById('senderAddressLine1');
          if (addressInput) {
            initAutocomplete(
              setSenderAddressLine1,
              setSenderCity,
              setSenderProvince,
              setSenderPostalCode,
              senderCountry,
              false,
              addressInput
            );
            // 👇 Force layout reflow using a safer method
            if (window.dispatchEvent) {
              window.dispatchEvent(new Event('resize'));
            }
          } else {
            console.error("Address input element not found");
          }
        });
      }, 500);
    }
  
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, senderCountry]);
    
  // Load existing user data if available
  useEffect(() => {
    const fetchUserData = async () => {
      if (isOpen) {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/user/getAddress`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const userData = response.data;
          if (userData) {
            if (userData.address) setSenderAddressLine1(userData.address);
            if (userData.address2) setSenderAddressLine2(userData.address2);
            if (userData.city) setSenderCity(userData.city);
            if (userData.postalCode) setSenderPostalCode(userData.postalCode);
            if (userData.province) setSenderProvince(userData.province);
            if (userData.companyName) setSenderCompanyName(userData.companyName);
            if (userData.phone) setSenderPhone(userData.phone);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    
    fetchUserData();
  }, [isOpen]);

  // handle errors
  const validateForm = () => {
    let newErrors = {};
  
    if (!senderAddressLine1.trim()) newErrors.senderAddressLine1 = "Address Line 1 is required.";
    if (!senderCity.trim()) newErrors.senderCity = "City is required.";
    if (!senderPostalCode.trim()) {
      newErrors.senderPostalCode = "Postal code is required.";
    } else if (!/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(senderPostalCode)) {
      newErrors.senderPostalCode = "Invalid postal code format (e.g., A1A 1A1).";
    }
    if (!senderProvince.trim()) newErrors.senderProvince = "Province is required.";
    if (!senderCompanyName) newErrors.senderCompanyName = "Company name is required.";
    if (!senderPhone.trim()) {
      newErrors.senderPhone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(senderPhone)) {
      newErrors.senderPhone = "Phone number must be 10 digits.";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;
  
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2200); // re-enable after 2.2 seconds
  
    const provinceCode = await getProvinceCode(senderProvince);
    if (!validateForm()) {
      return;
    }
    if (!provinceCode) {
      setErrors({ senderProvince: "Province is required or invalid." });
      return;
    }
  
    const token = localStorage.getItem("authToken");
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/user/updateAddress`,
        {
          userAddress: senderAddressLine1,
          userAddress2: senderAddressLine2,
          userProvince: provinceCode,
          userCity: senderCity,
          userPostalCode: senderPostalCode,
          userCompanyName: senderCompanyName,
          userPhone: senderPhone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (isFirstLogin) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/user/completeFirstLogon`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
  
      setFormSubmitted(true);
      localStorage.setItem("userPostalCode", senderPostalCode);
  
      if (onClose) {
        onClose();
      }
  
      if (shouldReload) {
        toast({
          title: "Success",
          description: "Your address has been updated successfully! Redirecting to rate estimate",
          status: "success",
          duration: 2500,
          isClosable: true,
          position: "bottom",
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "Success",
          description: "Your details have been updated successfully!",
          status: "success",
          duration: 2500,
          isClosable: true,
          position: "bottom",
        });
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast({
        title: "Error",
        description: "Failed to update information.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Custom close handler that ensures we cleanup properly
  const handleClose = () => {
    if (onClose) {
      // Ensure we reset any modal-related styles
      onClose();
    }
  };

  // Check if URL contains 'account-home' to make modal unclosable
  const shouldDisableClose = !formSubmitted && (isFirstLogin || window.location.href.includes('account-home'));

  return (
    <Modal 
      size="lg" 
      isOpen={isOpen} 
      onClose={shouldDisableClose ? undefined : handleClose}
      closeOnOverlayClick={!shouldDisableClose}
      closeOnEsc={!shouldDisableClose}
      motionPreset="scale"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">Please enter the address you will be shipping from (you can change this later)</ModalHeader>
        {/* Conditionally disable the close button */}
        {!shouldDisableClose && <ModalCloseButton />}
        <ModalBody>
          <div className="input-group">
            <label htmlFor="senderAddressLine1">Address Line 1</label>
            <input
              type="text"
              id="senderAddressLine1"
              value={senderAddressLine1}
              onChange={(e) => setSenderAddressLine1(e.target.value)}
              placeholder="Enter your address"
            />
            {errors.senderAddressLine1 && <p style={{ color: "red" }}>{errors.senderAddressLine1}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="senderAddressLine2">Address Line 2 (Optional)</label>
            <input
              type="text"
              id="senderAddressLine2"
              value={senderAddressLine2}
              onChange={(e) => setSenderAddressLine2(e.target.value)}
              placeholder="Enter your address line 2 (Optional)"
            />
          </div>
          <div className="input-group">
            <label htmlFor="senderCity">City</label>
            <input
              type="text"
              id="senderCity"
              value={senderCity}
              onChange={(e) => setSenderCity(e.target.value)}
              placeholder="Enter your city"
            />
            {errors.senderCity && <p style={{ color: "red" }}>{errors.senderCity}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="senderPostalCode">Postal Code</label>
            <input
              type="text"
              id="senderPostalCode"
              value={senderPostalCode}
              onChange={(e) => setSenderPostalCode(e.target.value)}
              placeholder="Enter your postal code"
            />
            {errors.senderPostalCode && <p style={{ color: "red" }}>{errors.senderPostalCode}</p>}
          </div>
          <div className="input-group">
          <label htmlFor="senderProvince">Province</label>
          <select value={senderProvince} onChange={handleProvinceChange}>
            <option value="">Select a Province/State</option>
            {provinceOptions.map((province, index) => (
              <option key={index} value={province}>{province}</option>
            ))}
          </select>
          {errors.senderProvince && <p style={{ color: "red" }}>{errors.senderProvince}</p>}
        </div>
          <div className="input-group">
            <label htmlFor="senderCompanyName">Company Name</label>
            <input
              type="text"
              id="senderCompanyName"
              value={senderCompanyName}
              onChange={(e) => setSenderCompanyName(e.target.value)}
              placeholder="Enter your company name"
            />
            {errors.senderCompanyName && <p style={{ color: "red" }}>{errors.senderCompanyName}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="senderPhone">Phone</label>
            <input
              type="text"
              id="senderPhone"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
            {errors.senderPhone && <p style={{ color: "red" }}>{errors.senderPhone}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
        <Button colorScheme="blue" onClick={handleSubmit} isDisabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Submit"}
        </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default UserAddressModal;






