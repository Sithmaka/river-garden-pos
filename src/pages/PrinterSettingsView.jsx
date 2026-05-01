import { useNavigate } from "react-router-dom";
import { usePrinterConfiguration } from "../hooks/usePrinterConfiguration";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";

/**
 * Printer Configuration View Page (Read-only)
 * For Cashier / Waiter roles to view printer settings.
 * Admins can modify settings from the admin settings page.
 */
export default function PrinterSettingsView() {
  const navigate = useNavigate();
  const { customerPrinter, kitchenPrinter, loading, error } =
    usePrinterConfiguration();
  const { role } = useAuth();

  const getDashboardPath = () => {
    return role === "waiter" ? "/waiter/dashboard" : "/cashier/dashboard";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-gray-600">Loading printer settings...</div>
        </div>
      </div>
    );
  }

  const errorText =
    typeof error === "string"
      ? error
      : error?.message || "Failed to load printer settings";

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-700 mb-2">
                🖨️ Printer Configuration
              </h1>
              <p className="text-gray-600">
                View current printer settings for your restaurant
              </p>
            </div>

            <button
              onClick={() => navigate(getDashboardPath())}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorText}
          </div>
        )}

        {/* Printer Configuration Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Active Printer Settings
          </h2>

          <div className="space-y-6">
            {/* Customer Receipt Printer */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Customer Receipt Printer
              </label>

              <div className="bg-white p-4 rounded border border-gray-300">
                {customerPrinter ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl">✓</span>
                    <p className="text-gray-900 font-semibold">
                      {customerPrinter}
                    </p>
                    {customerPrinter === "Browser Print (window.print)" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Browser Print
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No printer configured</p>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Receipts will be printed to this printer after completing orders.
              </p>
            </div>

            {/* Kitchen Order Printer */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kitchen Order Printer
              </label>

              <div className="bg-white p-4 rounded border border-gray-300">
                {kitchenPrinter ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl">✓</span>
                    <p className="text-gray-900 font-semibold">
                      {kitchenPrinter}
                    </p>
                    {kitchenPrinter === "Browser Print (window.print)" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Browser Print
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No printer configured</p>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Kitchen slips will be printed to this printer when confirming
                orders.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> These are the current printer settings
              configured by your administrator. To change printer settings,
              contact your admin or open the Settings page if you have admin
              access.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => navigate(getDashboardPath())}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}