export const calculateRateWithMargin = (baseCharge, residentialFee, isResidential, labelsPrinted) => {
    if (isResidential) {
      baseCharge += residentialFee;
    }
    const stripeFee = baseCharge * 0.029 + 0.30; // Stripe fee calculation
    baseCharge += stripeFee;
    return baseCharge; 
  };