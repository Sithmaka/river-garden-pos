/**
 * Unified Receipt Generator Service
 * Uses the proven test print HTML generation method for ALL receipt types
 * Ensures consistent formatting across customer receipts and kitchen slips
 *
 * This service generates complete HTML with embedded CSS (no external dependencies)
 * The method is proven to work reliably with all thermal printers
 */

export class ReceiptGeneratorService {
  /**
   * Generate receipt CSS that works reliably for thermal printing
   * Uses same method as test print which is proven to work
   */
  static getReceiptCSS() {
    return `
      @media print {
        @page {
          size: 72mm auto;
          margin: 0;
          padding: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 72mm !important;
        }
        body * {
          visibility: hidden !important;
        }
        .receipt-container, .receipt-container * {
          visibility: visible !important;
        }
        .receipt-container {
          position: static !important;
          width: 72mm !important;
          max-width: 72mm !important;
          margin: 0 !important;
          padding: 1mm 1.5mm !important;
          background: white !important;
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 8pt !important;
          line-height: 1.2 !important;
          color: #000 !important;
          box-sizing: border-box !important;
          transform: scale(0.96) !important;
          transform-origin: top left !important;
          width: calc(72mm / 0.96) !important;
        }
        button, nav, header, footer { display: none !important; }
      }
      @media screen {
        .receipt-container {
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          background: #fff;
          border: 1px solid #ddd;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11pt;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      }
      .receipt-header {
        text-align: center;
        margin-bottom: 4px;
        padding-bottom: 2px;
        border-bottom: 1px dashed #000;
      }
      @media print {
        .receipt-header { margin-bottom: 4px; padding-bottom: 2px; }
      }
      @media screen {
        .receipt-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #333; }
      }
      .receipt-header h1, .receipt-header h2 {
        font-size: 10pt;
        font-weight: bold;
        margin: 0 0 1px 0;
      }
      @media screen {
        .receipt-header h1, .receipt-header h2 { font-size: 20pt; margin: 0; }
      }
      .receipt-header p, .receipt-info p {
        font-size: 8pt;
        margin: 0px 0;
      }
      @media screen {
        .receipt-header p, .receipt-info p { font-size: 13pt; margin: 4px 0; }
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 3px 0;
        font-size: 8.5pt;
        table-layout: fixed;
        font-weight: bold;
      }
      @media screen {
        .items-table { font-size: 12pt; margin: 6px 0; }
      }
      .items-table th, .items-table td {
        padding: 1px 0.5px;
        border-bottom: 1px dotted #ccc;
        word-break: break-word;
        overflow: visible;
      }
      .items-table th {
        border-bottom: 1px solid #000;
        font-weight: bold;
      }
      .items-table th:nth-child(1), .items-table td:nth-child(1) {
        width: 48%;
      }
      .items-table th:nth-child(2), .items-table td:nth-child(2) {
        width: 14%;
        text-align: right;
        white-space: normal;
      }
      .items-table th:nth-child(3), .items-table td:nth-child(3) {
        width: 19%;
        text-align: right;
        white-space: normal;
      }
      .items-table th:nth-child(4), .items-table td:nth-child(4) {
        width: 19%;
        text-align: right;
        white-space: normal;
      }
      .kitchen-items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 3px 0;
        font-size: 10pt;
        table-layout: fixed;
      }
      @media screen {
        .kitchen-items-table { font-size: 14pt; margin: 6px 0; }
      }
      .kitchen-items-table th, .kitchen-items-table td {
        padding: 1px 0.5px;
        border-bottom: 1px dotted #ccc;
        word-break: break-word;
        overflow: visible;
      }
      .kitchen-items-table th {
        border-bottom: 1px solid #000;
        font-weight: bold;
      }
      .kitchen-items-table th:nth-child(1), .kitchen-items-table td:nth-child(1) {
        width: 68%;
      }
      .kitchen-items-table th:nth-child(2), .kitchen-items-table td:nth-child(2) {
        width: 32%;
        text-align: right;
        white-space: nowrap;
      }
      .totals {
        margin: 4px 0;
        padding-top: 2px;
        border-top: 1px solid #000;
        font-size: 8.5pt;
        font-weight: bold;
      }
      @media screen {
        .totals { font-size: 12pt; }
      }
      .total-line {
        display: flex;
        justify-content: space-between;
        margin: 0px 0;
      }
      .grand-total {
        font-size: 9.5pt;
        font-weight: bold;
        margin-top: 2px;
        border-top: 1px solid #000;
        padding-top: 2px;
      }
      @media screen {
        .grand-total { font-size: 14pt; }
      }
      .payment-info {
        text-align: center;
        margin: 6px 0 0;
        font-size: 8.5pt;
      }
      @media screen {
        .payment-info { font-size: 12pt; }
      }
      .footer {
        text-align: center;
        margin: 6px 0 0;
        font-size: 8.5pt;
        border-top: 1px dashed #000;
        padding-top: 4px;
      }
      @media screen {
        .footer { margin-top: 15px; padding-top: 10px; border-top: 2px dashed #333; font-size: 12pt; }
      }
      .watermark {
        text-align: center;
        margin-top: 4px;
        font-size: 8pt;
        font-weight: bold;
        line-height: 1.3;
      }
      @media screen {
        .watermark { font-size: 10pt; margin-top: 15px; }
      }
      .special-instructions {
        margin-top: 6px;
        padding-top: 4px;
        border-top: 1px dashed #000;
        font-size: 8.5pt;
      }
      @media screen {
        .special-instructions { font-size: 12pt; }
      }
    `;
  }

  /**
   * Generate Customer Receipt HTML (works for both takeaway and dine-in)
   * Uses same format as test print
   */
  static generateCustomerReceipt(receiptData, settings) {
    const formatCurrency = (value) => {
      if (!value) return "0.00";
      return parseFloat(value).toFixed(2);
    };

    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const headerText = settings?.receipt_header || "River Garden Restaurant";
    const footerText =
      settings?.receipt_footer || "Thank you for dining with us!";
    const address = settings?.restaurant_address;
    const phone = settings?.restaurant_phone;
    const currencyCode = settings?.currency_code || "LKR";

    let itemsHTML = "";
    if (receiptData.items && receiptData.items.length > 0) {
      itemsHTML = receiptData.items
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${currencyCode} ${formatCurrency(item.unitPrice)}</td>
          <td>${currencyCode} ${formatCurrency(item.lineTotal)}</td>
        </tr>
      `
        )
        .join("");
    }

    const specialInstructionsHTML = receiptData.specialInstructions
      ? `
      <div class="special-instructions">
        <p style="font-weight: bold; margin: 0 0 2px 0;">Special Instructions:</p>
        <p style="margin: 0;">${receiptData.specialInstructions}</p>
      </div>
    `
      : "";

    // Only show service charge for dine-in orders, NOT for takeaway
    const serviceChargeHTML =
      receiptData.orderType === "dine-in"
        ? `
              <div class="total-line">
                <span>Service Charge (${
                  receiptData.serviceChargePercent
                }%):</span>
                <span>${currencyCode} ${formatCurrency(
            receiptData.serviceChargeAmount
          )}</span>
              </div>
            `
        : "";

    return `
      <html>
        <head>
          <title>Customer Receipt</title>
          <style>
            ${this.getReceiptCSS()}
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>${headerText}</h1>
              ${address ? `<p>${address}</p>` : ""}
              ${phone ? `<p>${phone}</p>` : ""}
              <p>Order #${receiptData.orderNumber}</p>
              <p>${formatDate(receiptData.timestamp)}</p>
              ${
                receiptData.orderType === "dine-in"
                  ? `
                <p style="font-weight: bold;">Dine-In • Table #${receiptData.tableNumber}</p>
              `
                  : '<p style="font-weight: bold;">Takeaway</p>'
              }
            </div>

            ${
              receiptData.customerName
                ? `
              <div class="receipt-info" style="border-bottom: 1px dashed #000; padding-bottom: 4px;">
                <p>Customer: ${receiptData.customerName}</p>
                ${
                  receiptData.customerPhone
                    ? `<p>Phone: ${receiptData.customerPhone}</p>`
                    : ""
                }
              </div>
            `
                : ""
            }

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>${currencyCode} ${formatCurrency(
      receiptData.subtotal
    )}</span>
              </div>
              ${serviceChargeHTML}
              <div class="total-line grand-total">
                <span>TOTAL:</span>
                <span>${currencyCode} ${formatCurrency(
      receiptData.total
    )}</span>
              </div>
            </div>

            ${specialInstructionsHTML}

            <div class="payment-info">
              <p>Payment: ${receiptData.paymentMethod.toUpperCase()}</p>
            </div>

            <div class="footer">
              <p>${footerText}</p>
            </div>

            <div class="watermark">
              <div>Codebell POS System</div>
              <div style="font-size: 7pt; margin-top: 1px;">www.codebell.online</div>
              <div style="font-size: 7pt;">Info@codebell.online</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate Kitchen Slip HTML
   * Uses same format as test print, larger fonts for kitchen
   */
  static generateKitchenSlip(receiptData) {
    const formatDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    let itemsHTML = "";
    if (receiptData.items && receiptData.items.length > 0) {
      itemsHTML = receiptData.items
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
        </tr>
      `
        )
        .join("");
    }

    const specialInstructionsHTML = receiptData.specialInstructions
      ? `
      <div class="special-instructions">
        <p style="font-weight: bold; margin: 0 0 2px 0;">Special Instructions:</p>
        <p style="margin: 0;">${receiptData.specialInstructions}</p>
      </div>
    `
      : "";

    return `
      <html>
        <head>
          <title>Kitchen Slip</title>
          <style>
            ${this.getReceiptCSS()}
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h2>KITCHEN COPY</h2>
              <p>Order #${receiptData.orderNumber}</p>
              <p>${formatDate(receiptData.timestamp)}</p>
              ${
                receiptData.orderType === "dine-in"
                  ? `
                <p style="font-weight: bold;">Dine-In • Table #${receiptData.tableNumber}</p>
              `
                  : '<p style="font-weight: bold;">Takeaway</p>'
              }
            </div>

            <table class="kitchen-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            ${specialInstructionsHTML}

            <div class="watermark">
              <div>Codebell POS System</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
