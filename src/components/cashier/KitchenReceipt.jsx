// src/components/cashier/KitchenReceipt.jsx
// Uses unified receipt generator service (same method as test print)
import { ReceiptGeneratorService } from '../../services/receiptGeneratorService';

export default function KitchenReceipt({ receiptData }) {
  if (!receiptData) return null;

  // Generate HTML using the unified receipt generator
  const htmlContent = ReceiptGeneratorService.generateKitchenSlip(receiptData);

  return (
    <div className="kitchen-slip" dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}