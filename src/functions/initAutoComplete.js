const initAutocomplete = (setAddressLine1, setCity, setProvince, setPostalCode, countryCode, isReceiver) => {
  let input = "";
  if (isReceiver) {
    input = document.getElementById("receiverAddressLine1");
  }else{
    input = document.getElementById("senderAddressLine1");
  }
    if (!input) {
      console.error("Input element not found for autocomplete.");
      return;
    }
  
    if (!window.google || !window.google.maps) {
      console.error("Google Maps script not loaded correctly.");
      return;
    }
  
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: countryCode },
      fields: ["address_components", "formatted_address"],
    });
  
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
  
      if (!place.address_components) {
        console.error("Address components not available in place object.");
        return;
      }
  
      const addressComponents = place.address_components;

      const street_num = addressComponents.find((c) => 
         c.types.includes("street_number")
    )?.long_name || "";

    const route = addressComponents.find((c) => 
        c.types.includes("route")
   )?.long_name || "";

   const streetAddress = street_num + " " + route;

      const city = addressComponents.find((c) =>
        c.types.includes("locality")
      )?.long_name || "";
  
      const province = addressComponents.find((c) =>
        c.types.includes("administrative_area_level_1")
      )?.long_name || "";

      const postalCode = addressComponents.find((c) => 
        c.types.includes("postal_code")
      )?.long_name

  
      setAddressLine1(streetAddress || "");
      setCity(city);
      setProvince(province);
      if (!isReceiver)
      {
        setPostalCode(postalCode);
      }
    });
  };
  
  export default initAutocomplete;