export function calculateBillDiscount(grossTotal, type = "amount", rawValue = 0) {
  const gross = Math.max(0, Number(grossTotal) || 0);
  const discountType = type === "percentage" ? "percentage" : "amount";
  const enteredValue = Math.max(0, Number(rawValue) || 0);
  const discountValue =
    discountType === "percentage" ? Math.min(enteredValue, 100) : enteredValue;
  const calculatedAmount =
    discountType === "percentage"
      ? gross * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.round(Math.min(calculatedAmount, gross) * 100) / 100;

  return {
    discountType: discountAmount > 0 ? discountType : null,
    discountValue:
      discountAmount > 0
        ? discountType === "amount"
          ? discountAmount
          : discountValue
        : 0,
    discountAmount,
    total: Math.round((gross - discountAmount) * 100) / 100,
  };
}
