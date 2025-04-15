// googleMapsApi.js
const loadGoogleMapsAPI = (onLoadCallback) => {
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
  
      script.onload = () => {
        onLoadCallback(); // Initialize autocomplete after script loads
      };
  
      script.onerror = (error) => {
        console.error("Error loading the Google Maps API script:", error);
      };
  
      document.head.appendChild(script);
    } else {
      onLoadCallback(); // If script is already loaded, initialize autocomplete
    }
  };
  
  export default loadGoogleMapsAPI;