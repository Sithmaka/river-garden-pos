// src/components/cashier/CustomerReceipt.jsx
// Uses unified receipt generator service (same method as test print)
import { ReceiptGeneratorService } from '../../services/receiptGeneratorService';

export default function CustomerReceipt({ receiptData, settings }) {
  if (!receiptData) return null;

  // Generate HTML using the unified receipt generator
  const htmlContent = ReceiptGeneratorService.generateCustomerReceipt(receiptData, settings);

  return (
    <div className="customer-receipt" dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}