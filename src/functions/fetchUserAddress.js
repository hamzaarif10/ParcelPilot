import axios from 'axios';
export async function fetchUserAddress({setUserAddressDetails, setSenderAddressLine1, setSenderAddressLine2, setSenderProvince,
    setSenderCity, setSenderPostalCode, setSenderCompanyName, setSenderContactName, setSenderPhone, setSenderEmail}) 
{
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/getUserAddress`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      const newAddress = response.data.userAddressDetails;

      setUserAddressDetails(newAddress);
      setSenderAddressLine1(newAddress.userAddress);
      setSenderAddressLine2(newAddress.userAddress2);
      setSenderProvince(newAddress.userProvince);
      setSenderCity(newAddress.userCity);
      setSenderPostalCode(newAddress.userPostalCode);
      setSenderCompanyName(newAddress.userCompanyName);
      setSenderContactName(newAddress.userCompanyName);
      setSenderPhone(newAddress.userPhone);
      setSenderEmail(newAddress.email);
      
    } catch (error) {
      console.error("Error fetching user address:", error);
    }
  }