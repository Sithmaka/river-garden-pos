import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, updateSettings } from "../services/settingsService";
import { printerService } from "../services/printerService";
import {
  getPrinterConfiguration,
  savePrinterConfiguration,
} from "../services/printerConfigService";
import Button from "../components/ui/Button";

/**
 * Settings page for configuring restaurant-wide settings
 * Admin only - accessible at /admin/settings
 */
export default function Settings() {
  const navigate = useNavigate();

  const [printers, setPrinters] = useState([]);
  const [customerPrinter, setCustomerPrinter] = useState("");
  const [kitchenPrinter, setKitchenPrinter] = useState("");
  const [printerLoading, setPrinterLoading] = useState(false);
  const [printerError, setPrinterError] = useState(null);
  const [printerSuccess, setPrinterSuccess] = useState(null);

  const [serviceCharge, setServiceCharge] = useState("10.00");
  const [currencyCode, setCurrencyCode] = useState("LKR");
  const [receiptHeader, setReceiptHeader] = useState("River Garden Restaurant");
  const [receiptFooter, setReceiptFooter] = useState(
    "Thank you for dining with us! 🌿"
  );
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [tableCount, setTableCount] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadSettings();
    loadPrinterConfiguration();
    fetchPrinters();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  async function fetchPrinters() {
    setPrinterLoading(true);
    setPrinterError(null);

    try {
      const found = await printerService.getPrinters();
      const printerNames = found.map((p) => p.name);

      // Always allow browser print as fallback
      const options = Array.from(
        new Set(["Browser Print (window.print)", ...printerNames])
      );

      setPrinters(options);
    } catch (err) {
      console.error("Error fetching printers:", err);
      setPrinters(["Browser Print (window.print)"]);
      setPrinterError(
        "Using Browser Print only. Direct printer service: " +
          (err.message || "Not available")
      );
    }

    setPrinterLoading(false);
  }

  async function loadPrinterConfiguration() {
    try {
      const config = await getPrinterConfiguration();
      setCustomerPrinter(config.customerReceiptPrinter || "");
      setKitchenPrinter(config.kitchenOrderPrinter || "");
    } catch (err) {
      console.error("Error loading printer configuration:", err);
    }
  }

  async function handleTestPrint(type) {
    setPrinterError(null);
    setPrinterSuccess(null);

    const printer = type === "customer" ? customerPrinter : kitchenPrinter;

    if (!printer) {
      setPrinterError(
        "Please select a printer for " +
          (type === "customer" ? "Customer Receipt" : "Kitchen Order")
      );
      return;
    }

    try {
      const printType = type === "customer" ? "Customer Receipt" : "Kitchen Order";
      const testTime = new Date();
      const formattedTime = testTime.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const htmlContent = `
        <html>
          <head>
            <title>Test Print - ${printType}</title>
            <style>
              @media print {
                @page {
                  size: 63.5mm auto;
                  margin: 0;
                  padding: 0;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 63.5mm !important;
                }
                body * {
                  visibility: hidden !important;
                }
                .receipt-container, .receipt-container * {
                  visibility: visible !important;
                }
                .receipt-container {
                  position: static !important;
                  width: 63.5mm !important;
                  max-width: 63.5mm !important;
                  margin: 0 !important;
                  padding: 2mm !important;
                  background: white !important;
                  font-family: 'Courier New', Courier, monospace !important;
                  font-size: 9.5pt !important;
                  line-height: 1.3 !important;
                  color: #000 !important;
                  transform: scale(0.96) !important;
                  transform-origin: top left !important;
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
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 1px dashed #000;
              }
              @media screen {
                .receipt-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px dashed #333; }
              }
              .receipt-header h2 {
                font-size: 12pt;
                font-weight: bold;
                margin: 0 0 2px 0;
              }
              @media screen {
                .receipt-header h2 { font-size: 20pt; margin: 0; }
              }
              .receipt-header p {
                font-size: 8.5pt;
                margin: 0;
              }
              @media screen {
                .receipt-header p { font-size: 12pt; margin: 4px 0; }
              }
              .test-content {
                margin: 6px 0;
                font-size: 8.5pt;
              }
              @media screen {
                .test-content { margin: 15px 0; font-size: 12pt; }
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
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="receipt-header">
                <h2>*** TEST PRINT ***</h2>
                <p>${printType}</p>
              </div>
              <div class="test-content">
                <p>Printer Test: ${printer}</p>
                <p>Date: ${formattedTime}</p>
                <p>System: Codebell POS</p>
                <p style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px;">✓ If you can read this, the printer is working correctly!</p>
              </div>
              <div class="footer">
                <p>Test Print Successful</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await printerService.print(printer, htmlContent, {
        orientation: "portrait",
        paperSize: "Letter",
      });

      setPrinterSuccess(`✅ Test print sent to ${printer}.`);
    } catch (err) {
      console.error("Test print failed:", err);
      setPrinterError("Test print failed: " + err.message);
    }
  }

  async function handleSavePrinters() {
    setPrinterError(null);
    setPrinterSuccess(null);

    if (!customerPrinter || !kitchenPrinter) {
      setPrinterError("Please select both printers.");
      return;
    }

    try {
      const { success, error } = await savePrinterConfiguration(
        customerPrinter,
        kitchenPrinter
      );

      if (!success || error) {
        throw error || new Error("Failed to save printer assignments");
      }

      setPrinterSuccess(
        "Printer assignments saved! All dashboards will use these settings."
      );
    } catch (err) {
      console.error("Error saving printers:", err);
      setPrinterError(
        "Failed to save printer assignments: " + (err.message || err)
      );
    }
  }

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getSettings();

    if (fetchError) {
      setError("Failed to load settings. Please refresh the page.");
      console.error("Error loading settings:", fetchError);
    } else if (data) {
      setServiceCharge((data.service_charge_percentage ?? 10).toString());
      setCurrencyCode(data.currency_code || "LKR");
      setReceiptHeader(data.receipt_header || "River Garden Restaurant");
      setReceiptFooter(
        data.receipt_footer || "Thank you for dining with us! 🌿"
      );
      setRestaurantAddress(data.restaurant_address || "");
      setRestaurantPhone(data.restaurant_phone || "");
      setTableCount(data.table_count || 10);
    }

    setLoading(false);
  }

  function validateServiceCharge(value) {
    if (!value || value.trim() === "") {
      return "Service charge is required";
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return "Service charge must be a number";
    }

    if (numValue < 0 || numValue > 20) {
      return "Service charge must be between 0 and 20";
    }

    const decimalPlaces = (value.split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      return "Service charge can have at most 2 decimal places";
    }

    return null;
  }

  function handleServiceChargeChange(e) {
    const value = e.target.value;
    setServiceCharge(value);
    setValidationError(validateServiceCharge(value));
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSave() {
    const validationErr = validateServiceCharge(serviceCharge);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    const safeTableCount = Math.max(
      1,
      Math.min(100, parseInt(tableCount, 10) || 10)
    );

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const { error: saveError } = await updateSettings(
      parseFloat(serviceCharge),
      currencyCode,
      receiptHeader,
      receiptFooter,
      restaurantAddress,
      restaurantPhone,
      safeTableCount
    );

    if (saveError) {
      setError("Failed to save settings. Please try again.");
      console.error("Error saving settings:", saveError);
    } else {
      setTableCount(safeTableCount);
      setSuccessMessage("Settings updated successfully");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-start">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2"
          >
            ← Go Back
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold text-gray-900"
            data-testid="settings-title"
          >
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure restaurant-wide settings
          </p>
        </div>

        {error && (
          <div
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
            data-testid="error-message"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded"
            data-testid="success-message"
          >
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Printer Configuration
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Receipt Printer
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={customerPrinter}
                onChange={(e) => setCustomerPrinter(e.target.value)}
                disabled={printerLoading}
              >
                <option value="">Select printer...</option>
                {printers.map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kitchen Order Printer
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={kitchenPrinter}
                onChange={(e) => setKitchenPrinter(e.target.value)}
                disabled={printerLoading}
              >
                <option value="">Select printer...</option>
                {printers.map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white border border-gray-200 rounded">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Customer Receipt</p>
                <p className="font-semibold text-sm text-teal-600">
                  {customerPrinter || "⚠️ Not Set"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Kitchen Order</p>
                <p className="font-semibold text-sm text-orange-600">
                  {kitchenPrinter || "⚠️ Not Set"}
                </p>
              </div>
            </div>

            <div className="flex gap-4 mb-4 flex-wrap">
              <Button
                onClick={() => handleTestPrint("customer")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
              >
                Test Customer Print
              </Button>
              <Button
                onClick={() => handleTestPrint("kitchen")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
              >
                Test Kitchen Print
              </Button>
              <Button
                onClick={fetchPrinters}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2"
              >
                Refresh Printers
              </Button>
            </div>

            <div className="flex gap-4 mb-4 flex-wrap">
              <Button
                onClick={handleSavePrinters}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2"
              >
                Save Printer Settings
              </Button>
              <Button
                onClick={() => navigate("/admin/printer-diagnostics")}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2"
              >
                🔧 Printer Diagnostics
              </Button>
            </div>

            {printerError && <div className="mb-2 text-red-600">{printerError}</div>}
            {printerSuccess && (
              <div className="mb-2 text-green-600">{printerSuccess}</div>
            )}
            {printerLoading && (
              <div className="mb-2 text-gray-600">Loading printers...</div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label
              htmlFor="tableCount"
              className="block text-sm font-medium text-gray-700 mb-2 text-center"
            >
              Number of Dine-In Tables
            </label>
            <div className="flex items-center justify-center gap-2">
              <input
                id="tableCount"
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="w-32 px-3 py-2 border rounded-md text-center border-gray-300 focus:ring-teal-500 focus:outline-none focus:ring-2"
                data-testid="table-count-input"
              />
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">
              Set the number of tables available for dine-in service (1-100)
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label
              htmlFor="serviceCharge"
              className="block text-sm font-medium text-gray-700 mb-2 text-center"
            >
              Service Charge (%)
            </label>
            <div className="flex items-center justify-center gap-2">
              <input
                id="serviceCharge"
                type="text"
                value={serviceCharge}
                onChange={handleServiceChargeChange}
                className={`w-32 px-3 py-2 border rounded-md text-center ${
                  validationError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-teal-500"
                } focus:outline-none focus:ring-2`}
                data-testid="service-charge-input"
              />
              <span className="text-gray-600">%</span>
            </div>
            {validationError && (
              <p
                className="mt-2 text-sm text-red-600 text-center"
                data-testid="validation-error"
              >
                {validationError}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-500 text-center">
              Service charge applied to subtotal of all orders
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Currency
            </label>
            <select
              id="currency"
              value={currencyCode}
              onChange={(e) => {
                setCurrencyCode(e.target.value);
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              data-testid="currency-select"
            >
              <option value="LKR">LKR - Sri Lankan Rupees</option>
              <option value="USD">USD - US Dollars</option>
            </select>
            <p className="mt-3 text-sm text-gray-500">
              Currency format affects all price displays
            </p>
            <div className="mt-4 bg-white p-4 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Format Examples:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <span className="font-semibold">LKR:</span> Rs. 1,250.00
                </li>
                <li>
                  <span className="font-semibold">USD:</span> $1,250.00
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Receipt Information
            </h3>

            <div className="mb-4">
              <label
                htmlFor="receiptHeader"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Receipt Header (Restaurant Name)
              </label>
              <input
                id="receiptHeader"
                type="text"
                value={receiptHeader}
                onChange={(e) => {
                  setReceiptHeader(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="River Garden Restaurant"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="restaurantAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Restaurant Address (Optional)
              </label>
              <textarea
                id="restaurantAddress"
                value={restaurantAddress}
                onChange={(e) => {
                  setRestaurantAddress(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="123 Main Street, Colombo, Sri Lanka"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="restaurantPhone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Restaurant Phone (Optional)
              </label>
              <input
                id="restaurantPhone"
                type="text"
                value={restaurantPhone}
                onChange={(e) => {
                  setRestaurantPhone(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+94 77 123 4567"
              />
            </div>

            <div>
              <label
                htmlFor="receiptFooter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Receipt Footer Message
              </label>
              <input
                id="receiptFooter"
                type="text"
                value={receiptFooter}
                onChange={(e) => {
                  setReceiptFooter(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Thank you for your order!"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !!validationError}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2"
              data-testid="save-button"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}