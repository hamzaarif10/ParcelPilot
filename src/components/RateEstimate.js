import React, { useState, useEffect } from 'react';
import GetRates from './GetRates';
import axios from 'axios';
import { calculateRateWithMargin } from '../functions/calculateRate';
import getProvinceCode from "../functions/getProvinceCode";
import LoadingAnimation from "../LoadingAnimations/LoadingAnimation1";

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
      
      // Ensure that the 'rates' array is not empty
      if (response.data.rates && response.data.rates.length > 0) {
        const firstRate = response.data.rates.find(rate => rate.selectedService === "GlsDicomExpressGround");
        if (firstRate){
           //Update the rates with calculated margins
           setRate1(calculateRateWithMargin(firstRate.total,0,false, labelsPrinted));  // Assuming 'total' is the correct value for your calculation
           setUrl1("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/GLS_Logo_2021.svg/640px-GLS_Logo_2021.svg.png");
           setCourier1(firstRate.selectedService);
        }
     } else {
       console.error('No rates available in the response');
      }
    } catch (error) {
      console.error('Error fetching GLS rate:', error);
    }
  }
  
  
  // Fetch rates
  const fetchRates = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/get-rate`, rateEstimateData);
      if (response.data.rates && response.data.rates.length > 0) {
        const filteredRates = response.data.rates.filter(
          (rate) => rate.cost_rank >= 1 && rate.cost_rank <= 7
        );
      
        const sortedRates = filteredRates.sort((a, b) => a.cost_rank - b.cost_rank);

        setRate2(calculateRateWithMargin(sortedRates[0].total_charge, sortedRates[0].residential_full_fee, isResidential, labelsPrinted));
        setUrl2(sortedRates[0].courier_service.logo);
        setCourier2(sortedRates[0].courier_service.id);
      
        setRate3(calculateRateWithMargin(sortedRates[1].total_charge, sortedRates[1].residential_full_fee, isResidential, labelsPrinted));
        setUrl3(sortedRates[1].courier_service.logo);
        setCourier3(sortedRates[1].courier_service.id);
      
        setRate4(calculateRateWithMargin(sortedRates[2].total_charge, sortedRates[2].residential_full_fee, isResidential,  labelsPrinted));
        setUrl4(sortedRates[2].courier_service.logo);
        setCourier4(sortedRates[2].courier_service.id);
    
          setRate5(calculateRateWithMargin(sortedRates[3].total_charge, sortedRates[3].residential_full_fee, isResidential,  labelsPrinted));
          setUrl5(sortedRates[3].courier_service.logo);
          setCourier5(sortedRates[3].courier_service.id);
        
        
          setRate6(calculateRateWithMargin(sortedRates[4].total_charge, sortedRates[4].residential_full_fee, isResidential,  labelsPrinted));
          setUrl6(sortedRates[4].courier_service.logo);
          setCourier6(sortedRates[4].courier_service.id);

          setRate7(calculateRateWithMargin(sortedRates[5].total_charge, sortedRates[5].residential_full_fee, isResidential,  labelsPrinted));
          setUrl7(sortedRates[5].courier_service.logo);
          setCourier7(sortedRates[5].courier_service.id);

          setRate8(calculateRateWithMargin(sortedRates[6].total_charge, sortedRates[6].residential_full_fee, isResidential,  labelsPrinted));
          setUrl8(sortedRates[6].courier_service.logo);
          setCourier8(sortedRates[6].courier_service.id);

          //Set delivery times
          const newDeliveryTimes = [];
          const newServiceNames = [];

           for (let i = 0; i < sortedRates.length; i++) {
             if ((sortedRates[i].max_delivery_time - sortedRates[i].min_delivery_time) === 0) {
                newDeliveryTimes.push(sortedRates[i].max_delivery_time + " business days");
                newServiceNames.push(sortedRates[i].courier_service.name);
              } else {
                newDeliveryTimes.push(sortedRates[i].min_delivery_time + "-" + sortedRates[i].max_delivery_time + " business days");
                newServiceNames.push(sortedRates[i].courier_service.name);
              }
            }

          setDeliveryTimes(newDeliveryTimes);
          setServiceNames(newServiceNames);
      } 
    } catch (error) {
      console.error('Error fetching rate:', error);
    } 
  };
    //core fetching rate logic
    useEffect(() => {
        fetchRates();
        fetchGlsRate();
    }, []);

    return (
      <div style={{ marginTop: isMobile ? "25px" : "-6px", backgroundColor: "#005160" }}>
        {rate2 && rate3 && rate4 ? (
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




