import React, { useEffect, useState } from 'react';
import '../styles/RenderRates.css';
import CreateShipmentForm from './CreateShipmentForm';
import upsLogo from './assets/couriers/ups.png';

function GetRates({ senderCountryCode, receiverAddressLine1, receiverAddressLine2, receiverCity, receiverCountryCode, receiverPostalCode, receiverProvince, receiverName, 
  receiverPhoneNumber, receiverEmail, dimensions, weight, rate1, rate2, rate3, rate4, rate5, rate6, rate7, rate8, url1, url2, url3, url4, url5, url6, url7, url8,
  courier1, courier2, courier3, courier4, courier5, courier6, courier7, courier8, deliveryTimes, serviceNames, orderId, lineItemId,
  onShopifyOrderModalClose }) {

  const [selectedCourier, setSelectedCourier] = useState(null);
  const [selectedCourierUrl, setSelectedCourierUrl] = useState(null);
  const [selectedCourierCost, setSelectedCourierCost] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [allowedButtons, setAllowedButtons] = useState({
    courier1: true,
    courier2: true,
    courier3: true,
    courier4: true,
    courier5: true,
    courier6: true,
    courier7: true,
    courier8: true
  });

  useEffect(() => {
    // Check if current viewport is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const currentUrl = window.location.href;
    if (!(currentUrl.includes('create-shipment') || currentUrl.includes('integration'))) {
      setAllowedButtons({
        courier1: false,
        courier2: false,
        courier3: false,
        courier4: false,
        courier5: false,
        courier6: false,
        courier7: false,
        courier8: false
      });
    }
  }, []);

  const handleSelectRate = (courierId, courierUrl, courierCost) => {
    setSelectedCourier(courierId);
    setSelectedCourierUrl(courierUrl);
    setSelectedCourierCost(courierCost);
  };

  return (
    <div className="rates-container">
      {selectedCourier ? (
        <CreateShipmentForm
          courierId={selectedCourier}
          courierUrl={selectedCourierUrl}
          courierCost={selectedCourierCost.toFixed(2)}
          senderCountry={senderCountryCode}
          receiverAddressLine1Prop={receiverAddressLine1}
          receiverAddressLine2Prop={receiverAddressLine2}
          receiverCityProp={receiverCity}
          receiverCountry={receiverCountryCode}
          receiverPostCode={receiverPostalCode}
          receiverProvinceProp={receiverProvince}
          receiverName={receiverName}
          receiverPhoneNumber={receiverPhoneNumber}
          receiverEmailProp={receiverEmail}
          measurements={dimensions}
          mass={weight}
          orderId={orderId}
          lineItemId={lineItemId}
          onShopifyOrderModalClose={onShopifyOrderModalClose}
        />
      ) : (
        <>
          {(() => {
            const rates = [
              { rate: rate1, url: url1, time: "2-6 business days", name: "GLS - Ground", courier: courier1, allowed: allowedButtons.courier1 },
              { rate: rate2, url: url2, time: deliveryTimes[0], name: serviceNames[0], courier: courier2, allowed: allowedButtons.courier2 },
              { rate: rate3, url: url3, time: deliveryTimes[1], name: serviceNames[1], courier: courier3, allowed: allowedButtons.courier3 },
              { rate: rate4, url: url4, time: deliveryTimes[2], name: serviceNames[2], courier: courier4, allowed: allowedButtons.courier4 },
              { rate: rate5, url: url5, time: deliveryTimes[3], name: serviceNames[3], courier: courier5, allowed: allowedButtons.courier5 },
              { rate: rate6, url: url6, time: deliveryTimes[4], name: serviceNames[4], courier: courier6, allowed: allowedButtons.courier6 },
              { rate: rate7, url: url7, time: deliveryTimes[5], name: serviceNames[5], courier: courier7, allowed: allowedButtons.courier7 },
              { rate: rate8, url: url8, time: deliveryTimes[6], name: serviceNames[6], courier: courier8, allowed: allowedButtons.courier8 },
            ]
              .filter(item => item.rate) // Filter out undefined/null rates
              .sort((a, b) => a.rate - b.rate); // Sort by rate, lowest to highest
  
            // Function to parse transit time into days (simplified for common formats)
            const parseTransitTime = (time) => {
              if (!time) return Infinity;
              const match = time.match(/(\d+)-(\d+) business days/) || time.match(/(\d+) business days/);
              if (!match) return Infinity;
              return match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10); // Use max range or single value
            };
  
            // Find the index of the second cheapest with fastest transit time
            const remainingRates = rates.slice(1); // Exclude the cheapest
            const bestValueIndex = remainingRates.length > 0
              ? rates.indexOf(
                  remainingRates.reduce((fastest, current) =>
                    parseTransitTime(current.time) < parseTransitTime(fastest.time) ? current : fastest
                  )
                )
              : -1;
  
            return rates.map((item, index) => (
              <div className={`rate-tile ${isMobile ? 'mobile-view' : ''}`} key={index}>
                {/* Desktop view - Preserve the original layout for desktop */}
                {!isMobile ? (
                  <>
                    {index === 0 && (
                      <span className="cheapest-tag">Cheapest</span>
                    )}
                    {index === bestValueIndex && (
                      <span className="best-value-tag">Best Value</span>
                    )}
                    <img
                        src={item.name.toLowerCase().startsWith('ups') ? upsLogo : item.url}
                        alt="Courier Logo"
                        className="gls-logo"
                      />
                    <div className="divider"></div>
                    <p className="shipping-time">Transit Time: {item.time}</p>
                    <div className="divider"></div>
                    <p className="service-name">{item.name}</p>
                    <div className="divider"></div>
                    <p className="rate-amount">${item.rate.toFixed(2)}</p>
                    {item.allowed && (
                      <button
                        onClick={() => handleSelectRate(item.courier, item.url, item.rate)}
                        type="button"
                        className="btn btn-success btn-block btn-lg gradient-custom-4 text-body"
                        style={{ width: "140px", marginLeft: "25px", maxWidth: "140px" }}
                      >
                        Select
                      </button>
                    )}
                  </>
                ) : (
                  // Mobile view - Optimized layout for small screens
                  <>
                    <div className="rate-tags">
                      {index === 0 && (
                        <span className="cheapest-tag">Cheapest</span>
                      )}
                      {index === bestValueIndex && (
                        <span className="best-value-tag mobile-best-value">Best Value</span>
                      )}
                    </div>
                    
                    <div className="rate-content">
                      <div className="courier-logo">
                      <img
                        src={item.name.toLowerCase().startsWith('ups') ? './assets/couriers/ups.png' : item.url}
                        alt="Courier Logo"
                        className="gls-logo"
                      />
                      </div>
                      
                      <div className="rate-details">
                        <div className="service-info">
                          <p className="service-name">{item.name}</p>
                          <p className="shipping-time">{item.time}</p>
                        </div>
                        <p className="rate-amount">${item.rate.toFixed(2)}</p>
                      </div>
                      
                      <div className="rate-action">
                        {item.allowed && (
                          <button
                            onClick={() => handleSelectRate(item.courier, item.url, item.rate)}
                            type="button"
                            className="mobile-select-button"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ));
          })()}
        </>
      )}
    </div>
  );
}

export default GetRates;
