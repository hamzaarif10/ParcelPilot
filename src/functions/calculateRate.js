export const calculateRateWithMargin = (baseCharge, residentialFee, isResidential, labelsPrinted) => {

    let margin = 1;

    //if (labelsPrinted >= 300){
    //  margin = 2.00;
    //}else {
     // baseCharge+=0;
    //}

    if (isResidential) {
      baseCharge += residentialFee;
      //baseCharge += 0.36;
    }
    //const stripeFee = (baseCharge * margin) * 0.029 + 0.30; // Stripe fee calculation
    return baseCharge * margin; // Add profit margin and Stripe fees
  };