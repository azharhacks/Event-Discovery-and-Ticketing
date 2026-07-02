const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

const splitPayment = (totalAmount) => {
  const total = Number(totalAmount);
  const platformFee = Math.round(total * PLATFORM_FEE_PERCENT) / 100;
  const organizerShare = Math.round((total - platformFee) * 100) / 100;
  return { platformFee, organizerShare };
};

module.exports = { PLATFORM_FEE_PERCENT, splitPayment };
