import axios from 'axios';

//upload file to AWS storage
async function uploadFileToStorage(file) {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      // Send the request using Axios
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fileUpload/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Ensure content type is set correctly
        },
      });
  
      // Assuming the server responds with the file's permanent URL
      return response.data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("File upload failed");
    }
  }
export async function generatePdfLink(base64String, tracking) {
    try {
      let blob = null;

      // Clean up the Base64 string (remove any extra spaces or newlines)
      const sanitizedBase64String = base64String.trim();
  
      // Decode Base64 to a byte array
      const byteCharacters = atob(sanitizedBase64String);
      const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
        // Create a Blob from the byte array
        blob = new Blob([byteArray], { type: "application/pdf" });

      // Convert Blob to a File (required for some storage APIs)
      const file = new File([blob], `${tracking}.pdf`, {
        type: "application/pdf",
      });
      // Upload the file to permanent storage (e.g., AWS S3)
      const permanentUrl = await uploadFileToStorage(file);
  
      // Set the URL in state for immediate use
      return permanentUrl;
    } catch (error) {
      console.error("Error generating PDF link:", error);
    }
  }
  // Submit shipment label details to the database
  export async function submitLabel({shipment_id, 
    name, 
    addressLine1, 
    city, 
    postalCode, 
    countryCode, 
    courierName, 
    courierId, 
    trackingNum, 
    pdfLink,
    labelState}) {
    const token = localStorage.getItem("authToken");
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/user/submitLabel`,
        {
          shipment_id: shipment_id,
          recipientName: name,
          recipientAddress: `${addressLine1}, ${city}, ${postalCode}, ${countryCode}`,
          courierName: courierName,
          courierServiceId: courierId,
          trackingNumber: trackingNum,
          pdf_url: pdfLink,
          status: labelState
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Failed to submit label.");
    }
  }