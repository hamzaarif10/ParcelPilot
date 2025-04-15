import getProvinceCode from "../functions/getProvinceCode";

export const getIcsCreateShipmentData = ({
  senderAddressLine1,
  senderProvince,
  senderCity,
  senderPostalCode,
  senderCompanyName,
  senderContactName,
  senderPhone,
  senderEmail,
  receiverAddressLine1,
  receiverProvince,
  receiverCity,
  receiverPostalCode,
  receiverContactName,
  receiverPhone,
  receiverEmail,
  receiverCountryCode,
  dimensions,
  weight,
  courierId,
}) => ({
  "to_address": {
    "name": receiverContactName,
    "company": receiverContactName,
    "address1": receiverAddressLine1,
    "address2": "",
    "city": receiverCity,
    "province_code": getProvinceCode(receiverProvince),
    "postal_code": receiverPostalCode,
    "country_code": receiverCountryCode,
    "phone": receiverPhone,
    "email": receiverEmail,
    "is_residential": true
  },
  "return_address": {
    "name": senderContactName,
    "company": senderCompanyName,
    "address1": senderAddressLine1,
    "address2": "",
    "city": senderCity,
    "province_code": getProvinceCode(senderProvince),
    "postal_code": senderPostalCode,
    "country_code": "CA",
    "phone": senderPhone,
    "email": senderEmail,
    "is_residential": true
  },
  "is_return": false,
  "weight_unit": "kg",
  "weight": weight,
  "length": dimensions.length,
  "width": dimensions.width,
  "height": dimensions.depth,
  "size_unit": "cm",
  "items": [
    {
      "description": "NA",
      "sku": "SKU123",
      "quantity": 1,
      "value": 10,
      "currency": "CAD"
    }
  ],
  "package_type": "Parcel",
  "signature_confirmation": false,
  "postage_type": courierId,
  "label_format": "pdf",
  "is_fba": false,
  "is_draft": false,
  "insured": false
});