import { formatCurrency } from "../../utils/formatting";
import "../../print.css";

export default function Receipt({ receiptData, settings }) {
  if (!receiptData) return null;

  const formatDate = (value) => {
    if (!value) return "";

    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const headerText = settings?.receipt_header || "River Garden Restaurant";
  const footerText =
    settings?.receipt_footer || "Thank you for dining with us!";
  const address = settings?.restaurant_address || "";
  const phone = settings?.restaurant_phone || "";

  const items = Array.isArray(receiptData.items) ? receiptData.items : [];
  const paymentMethod = receiptData.paymentMethod || "pending";
  const timestamp = formatDate(receiptData.timestamp);

  return (
    <div className="receipt-container">
      {/* Customer Receipt */}
      <div className="customer-receipt">
        <div className="receipt-header">
          <h1>{headerText}</h1>
          {address && <p className="text-xs">{address}</p>}
          {phone && <p className="text-xs">{phone}</p>}
          <p>Order #{receiptData.orderNumber || "-"}</p>
          {timestamp && <p>{timestamp}</p>}
          {receiptData.orderType === "dine-in" && (
            <p className="text-sm font-bold text-teal-700">
              Dine-In • Table #{receiptData.tableNumber || "-"}
            </p>
          )}
        </div>

        {receiptData.customerName && (
          <div className="customer-info">
            <p>Customer: {receiptData.customerName}</p>
            {receiptData.customerPhone && (
              <p>Phone: {receiptData.customerPhone}</p>
            )}
          </div>
        )}

        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-line">
            <span>Subtotal:</span>
            <span>{formatCurrency(receiptData.subtotal || 0)}</span>
          </div>
          <div className="total-line">
            <span>
              Service Charge ({receiptData.serviceChargePercent || 0}%):
            </span>
            <span>{formatCurrency(receiptData.serviceChargeAmount || 0)}</span>
          </div>
          <div className="total-line grand-total">
            <span>TOTAL:</span>
            <span>{formatCurrency(receiptData.total || 0)}</span>
          </div>
        </div>

        <div className="payment-info">
          <p>Payment: {String(paymentMethod).toUpperCase()}</p>
        </div>

        <div className="footer">
          <p>{footerText}</p>
        </div>

        {/* Watermark + Logo - Customer */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            marginTop: "8px",
            fontSize: "0.8em",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          <img
            src="/logo.png"
            alt="Codebell POS"
            style={{
              width: "20mm",
              height: "auto",
              marginBottom: "4px",
              opacity: 0.7,
            }}
          />
          <div>Codebell POS System</div>
          <div style={{ fontSize: "0.9em", marginTop: "2px" }}>
            www.codebell.online
          </div>
          <div style={{ fontSize: "0.9em" }}>Info@codebell.online</div>
        </div>
      </div>

      {/* Kitchen Slip */}
      <div className="kitchen-slip">
        <div className="kitchen-header">
          <h2>KITCHEN COPY</h2>
          <p>Order #{receiptData.orderNumber || "-"}</p>
          {timestamp && <p>{timestamp}</p>}
          {receiptData.orderType === "dine-in" && (
            <p className="text-sm font-bold text-teal-700">
              Dine-In • Table #{receiptData.tableNumber || "-"}
            </p>
          )}
        </div>

        <table className="kitchen-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="special-instructions">
          <p>
            Special Instructions:{" "}
            {receiptData.specialInstructions || "_______________"}
          </p>
        </div>

        {/* Watermark + Logo - Kitchen */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            marginTop: "8px",
            fontSize: "0.8em",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          <div>Codebell POS System</div>
        </div>
      </div>
    </div>
  );
}