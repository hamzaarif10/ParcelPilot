// Function to get the state/province from a postal code using Google Maps Geocoding API
async function getRegionFromPostalCode(postalCode, country) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},${country}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results.length > 0) {
        // Look through the address components to find the state/province
        const addressComponents = data.results[0].address_components;
        
        for (let component of addressComponents) {
          if (component.types.includes('administrative_area_level_1')) {
            return component.long_name; // The full name of the state/province
          }
        }
        
        throw new Error('State/Province not found in address components');
      } else {
        throw new Error('No results found for the postal code');
      }
    } catch (error) {
      console.error('Error fetching state/province:', error);
      return null;
    }
  }
  export default getRegionFromPostalCode;