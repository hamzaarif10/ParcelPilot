export const calculateRateWithMargin = (
  baseCharge,
  residentialFee,
  isResidential,
  labelsPrinted
) => {
  // Add residential fee if applicable
  if (isResidential) {
    baseCharge += residentialFee;
  }

  // Apply tiered margin before Stripe fees
  if (labelsPrinted <= 7) {
    baseCharge -= 2.50;  // stronger hook
  } else if (labelsPrinted <= 15) {
    baseCharge += 0;  // small profit but still attractive
  } else {
    baseCharge += 1.75;  // steady profit
  }

  // Add Stripe fees last so they don’t eat into your margin
  const stripeFee = baseCharge * 0.029 + 0.30;
  baseCharge += stripeFee;

  return Math.round(baseCharge * 100) / 100; // round to 2 decimals
};