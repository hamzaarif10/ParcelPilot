import getProvinceCode from "../functions/getProvinceCode"

export const getGlsCreateShipmentData = ({
    senderAddressLine1,
    senderAddressLine2,
    senderProvince,
    senderCity,
    senderPostalCode,
    senderCompanyName,
    senderContactName,
    senderPhone,
    senderEmail,
    receiverAddressLine1,
    receiverAddressLine2,
    receiverProvince,
    receiverCity,
    receiverPostalCode,
    receiverContactName,
    receiverPhone,
    receiverEmail,
    receiverCountryCode,
    dimensions,
    weight,
    courierId
  }) => {
    // Generate today's date in ISO format
    const today = new Date().toISOString();
    
    return {
      "selectedService": courierId,
      "fromAddress": {
        "company": senderCompanyName,
        "contact": senderContactName,
        "phone": senderPhone,
        "addr1": senderAddressLine1,
        "addr2": senderAddressLine2,
        "addr3": "",
        "countryCode": "CA",
        "postalCode": senderPostalCode,
        "city": senderCity,
        "province": getProvinceCode(senderProvince),
        "residential": true,
        "emails": [
          senderEmail
        ],
        "isInside": false,
        "isTailGate": false,
        "isTradeShow": false,
        "isLimitedAccess": false,
        "isSaturday": false,
        "isStopinOnly": false
      },
      "toAddress": {
        "company": receiverContactName,
        "contact": receiverContactName,
        "phone": receiverPhone,
        "addr1": receiverAddressLine1,
        "addr2": receiverAddressLine2,
        "addr3": "",
        "countryCode": receiverCountryCode,
        "postalCode": receiverPostalCode,
        "city": receiverCity,
        "province": getProvinceCode(receiverProvince),
        "residential": true,
        "emails": [
          receiverEmail || ""
        ],
        "isInside": false,
        "isTailGate": false,
        "isTradeShow": false,
        "isLimitedAccess": false,
        "isSaturday": false,
        "isStopinOnly": false
      },
      "packages": [
        {
          "packageType": "MyPackage",
          "userDefinedPackageType": "",
          "weight": weight,
          "weightUnits": "Kgs",
          "length": dimensions.length,
          "width": dimensions.width,
          "height": dimensions.depth,
          "dimUnits": "CM",
          "insurance": 0,
          "isAdditionalHandling": false,
          "signatureOptions": "None",
          "description": "",
          "temperatureProtection": false,
          "isDangerousGoods": false,
          "isNonStackable": false
        }
      ],
      "shipDateTime": today,
      "deliveryEmails": [
        receiverEmail || ""
      ],
      "billingOption": "Prepaid",
      "billingAccountNumber": "126645",
      "documentsOnly": false,
      "isNonStackable": false,
      "references": [],
      "comments": "",
      "clearInProgress": true,
      "editTrackingNumber": "",
      "returnSampleLabelOnly": true
    };
  };