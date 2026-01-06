import React, { useState, useEffect } from 'react';
import GetRates from './GetRates';
import axios from 'axios';
import { calculateRateWithMargin } from '../functions/calculateRate';
import getProvinceCode from "../functions/getProvinceCode";
import LoadingAnimation from "../LoadingAnimations/LoadingAnimation1";
import { useToast } from '@chakra-ui/react';

function RateEstimate({
  senderPostalCode,
  senderProvince,
  senderCountry,
  receiverAddressLine1,
  receiverAddressLine2,
  receiverCity,
  receiverPostalCode,
  receiverProvince,
  receiverCountry,
  receiverName,
  receiverPhoneNumber,
  receiverEmail,
  weight,
  dimensions,
  isResidential,
  labelsPrinted,
  orderId,
  lineItemId,
  onShopifyOrderModalClose
}) {
  const [rate1, setRate1] = useState('');
  const [rate2, setRate2] = useState('');
  const [rate3, setRate3] = useState('');
  const [rate4, setRate4] = useState('');
  const [rate5, setRate5] = useState('');
  const [rate6, setRate6] = useState('');
  const [rate7, setRate7] = useState('');
  const [rate8, setRate8] = useState('');
  const [courier1, setCourier1] = useState('');
  const [courier2, setCourier2] = useState('');
  const [courier3, setCourier3] = useState('');
  const [courier4, setCourier4] = useState('');
  const [courier5, setCourier5] = useState('');
  const [courier6, setCourier6] = useState('');
  const [courier7, setCourier7] = useState('');
  const [courier8, setCourier8] = useState('');
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [url3, setUrl3] = useState('');
  const [url4, setUrl4] = useState('');
  const [url5, setUrl5] = useState('');
  const [url6, setUrl6] = useState('');
  const [url7, setUrl7] = useState('');
  const [url8, setUrl8] = useState('');
  
  const [deliveryTimes, setDeliveryTimes] = useState([]);
  const [serviceNames, setServiceNames] = useState([]);

  const category = 'Parcel';
  const quantity = 1;
  const parcelType = "Box";

  const [isMobile, setIsMobile] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768); // You can adjust the width as needed
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  // rate estimate data
  const rateEstimateData = {
    origin_address: {
      state: senderProvince,
      city: "new",
      postal_code: senderPostalCode,
      country_alpha2: senderCountry
    },
    destination_address: {
      country_alpha2: receiverCountry,
      line_1: "new",
      state: receiverProvince,
      city: "new",
      postal_code: receiverPostalCode
    },
    incoterms: "DDU",
    courier_settings: {
      show_courier_logo_url: true
    },
    shipping_settings: {
      units: {
        weight: "kg",
        dimensions: "cm"
      },
      output_currency: "CAD"
    },
    parcels: [
      {
        box: {
          slug: null,
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.depth
        },
        items: [
          {
            description: "Package contents",
            category: "general",
            contains_battery_pi966: false,
            contains_battery_pi967: false,
            contains_liquids: false,
            origin_country_alpha2: "CA",
            quantity: 1,
            declared_currency: "CAD",
            actual_weight: weight,
            declared_customs_value: 0.1,
            hs_code: "85171400"
          }
        ],
        total_actual_weight: weight
      }
    ]
  };
  //ICS data
  const glsData = {
    "fromAddress": {
      "addr1": "1500 Bank St.",
      "countryCode": "CA",
      "postalCode": senderPostalCode,
      "city": "null",
      "residential": false,
      "isSaturday": false,
      "isInside": false,
      "isTailGate": false,
      "isTradeShow": false,
      "isLimitedAccess": false,
      "isStopinOnly": false
    },
    "toAddress": {
      "addr1": "1500 Bank St.",
      "countryCode": "CA",
      "postalCode": receiverPostalCode,
      "city": "null",
      "residential": false,
      "isSaturday": false,
      "isInside": false,
      "isTailGate": false,
      "isTradeShow": false,
      "isLimitedAccess": false,
      "isStopinOnly": false
    },
    "packages": [
      {
        "packageType": "MyPackage",
        "weight": weight,
        "weightUnits": "Kgs",
        "length": dimensions.length,
        "width": dimensions.width,
        "height": dimensions.depth,
        "dimUnits": "CM",
        "insurance": 0,
        "isAdditionalHandling": false,
        "signatureOptions": "None",
        "description": "Gift for darling",
        "temperatureProtection": false,
        "isDangerousGoods": false,
        "isNonStackable": false
      }
    ],
    "currencyCode": "CAD",
    "billingOptions": "Prepaid",
    "isDocumentsOnly": true
  }
  //Fetch gls Rate
  const fetchGlsRate = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/get-gls-rate`, glsData);
  
      if (response.data.rates && response.data.rates.length > 0) {
        const firstRate = response.data.rates.find(rate => rate.selectedService === "GlsDicomExpressGround");
        if (firstRate  && firstRate.total) {
          setRate1(calculateRateWithMargin(firstRate.total, 0, false, labelsPrinted));
          setUrl1("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/GLS_Logo_2021.svg/640px-GLS_Logo_2021.svg.png");
          setCourier1(firstRate.selectedService);
        }
      }
    } catch (error) {
      console.error('Error fetching GLS rate:', error);
      if (error.response?.status === 429) {
        toast({
          title: "Rate limit exceeded",
          description: "Too many requests. Please try again shortly.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error fetching rates",
          description: error.response?.data?.message || error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
      }
    }
  };
  // Fetch rates
const fetchRates = async () => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/get-rate`, rateEstimateData);
    if (response.data.rates && response.data.rates.length > 0) {
      const excludedCourierIds = [
        'e65debff-8b0d-450b-a008-5a337ae8ce72'
        // Note: You mentioned the same ID twice, so I'm only including it once
        // If you have a different second ID, replace this comment with it
      ];

      const filteredRates = response.data.rates
      .filter(
        (rate) =>
          rate.cost_rank >= 1 &&
          rate.cost_rank <= 9 &&
          rate.total_charge !== undefined &&
          rate.total_charge !== null &&
          rate.courier_service !== undefined &&
          rate.courier_service !== null &&
          // Add filter to exclude specific courier IDs
          !excludedCourierIds.includes(rate.courier_service.courier_id)
      )
      .sort((a, b) => a.cost_rank - b.cost_rank);

      if (filteredRates[0]) {
        setRate2(calculateRateWithMargin(filteredRates[0]?.total_charge, filteredRates[0]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl2(filteredRates[0]?.courier_service.logo);
        setCourier2(filteredRates[0]?.courier_service.id);
      }
      if (filteredRates[1]) {
        setRate3(calculateRateWithMargin(filteredRates[1]?.total_charge, filteredRates[1]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl3(filteredRates[1]?.courier_service.logo);
        setCourier3(filteredRates[1]?.courier_service.id);
      }
      if (filteredRates[2]) {
        setRate4(calculateRateWithMargin(filteredRates[2]?.total_charge, filteredRates[2]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl4(filteredRates[2]?.courier_service.logo);
        setCourier4(filteredRates[2]?.courier_service.id);
      }
      if (filteredRates[3]) {
        setRate5(calculateRateWithMargin(filteredRates[3]?.total_charge, filteredRates[3]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl5(filteredRates[3]?.courier_service.logo);
        setCourier5(filteredRates[3]?.courier_service.id);
      }
      if (filteredRates[4]) {
        setRate6(calculateRateWithMargin(filteredRates[4]?.total_charge, filteredRates[4]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl6(filteredRates[4]?.courier_service.logo);
        setCourier6(filteredRates[4]?.courier_service.id);
      }
      if (filteredRates[5]) {
        setRate7(calculateRateWithMargin(filteredRates[5]?.total_charge, filteredRates[5]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl7(filteredRates[5]?.courier_service.logo);
        setCourier7(filteredRates[5]?.courier_service.id);
      }
      if (filteredRates[6]) {
        setRate8(calculateRateWithMargin(filteredRates[6]?.total_charge, filteredRates[6]?.residential_full_fee, isResidential, labelsPrinted));
        setUrl8(filteredRates[6]?.courier_service.logo);
        setCourier8(filteredRates[6]?.courier_service.id);
      }

      const newDeliveryTimes = [];
      const newServiceNames = [];

      filteredRates.forEach(rate => {
        const timeRange = rate.max_delivery_time === rate.min_delivery_time
          ? `${rate.max_delivery_time} business days`
          : `${rate.min_delivery_time}-${rate.max_delivery_time} business days`;

        newDeliveryTimes.push(timeRange);
        newServiceNames.push(rate.courier_service.name);
      });

      setDeliveryTimes(newDeliveryTimes);
      setServiceNames(newServiceNames);
    }
  } catch (error) {
    console.error('Error fetching rates:', error);
    if (error.response?.status === 429) {
      toast({
        title: "Rate limit exceeded",
        description: "Too many requests. Please try again shortly.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error fetching rates",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }
};
  
    //core fetching rate logic
    useEffect(() => {
        fetchRates();
        fetchGlsRate();
    }, []);
    return (
      <div style={{ marginTop: isMobile ? "25px" : "-6px", backgroundColor: "#005160" }}>
        {(rate2 || rate3 || rate4 || rate5 || rate6 || rate7 || rate8) ? (
  <GetRates
    senderCountryCode={senderCountry}
    receiverAddressLine1={receiverAddressLine1}
    receiverAddressLine2={receiverAddressLine2}
    receiverCity={receiverCity}
    receiverCountryCode={receiverCountry}
    receiverPostalCode={receiverPostalCode}
    receiverProvince={receiverProvince}
    receiverName={receiverName}
    receiverPhoneNumber={receiverPhoneNumber}
    receiverEmail={receiverEmail}
    dimensions={dimensions}
    weight={weight}
    rate1={rate1}
    rate2={rate2}
    rate3={rate3}
    rate4={rate4}
    rate5={rate5}
    rate6={rate6}
    rate7={rate7}
    rate8={rate8}
    url1={url1}
    url2={url2}
    url3={url3}
    url4={url4}
    url5={url5}
    url6={url6}
    url7={url7}
    url8={url8}
    courier1={courier1}
    courier2={courier2}
    courier3={courier3}
    courier4={courier4}
    courier5={courier5}
    courier6={courier6}
    courier7={courier7}
    courier8={courier8}
    deliveryTimes={deliveryTimes}
    serviceNames={serviceNames}
    orderId={orderId}
    lineItemId={lineItemId}
    onShopifyOrderModalClose={onShopifyOrderModalClose}
  />
) : (
  <LoadingAnimation />
)}
      </div>
    );
}

export default RateEstimate;




