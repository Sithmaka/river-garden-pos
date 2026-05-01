/**
 * Printer Diagnostics Page
 * Shows printer status, available printers, and test print functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { printerService } from '../services/printerService';
import Button from '../components/ui/Button';

export default function PrinterDiagnostics() {
  const navigate = useNavigate();
  const [printers, setPrinters] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [testPrinting, setTestPrinting] = useState(false);
  const [printResult, setPrintResult] = useState(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  async function loadDiagnostics() {
    try {
      setLoading(true);
      setError(null);
      
      const [printerList, serviceStatus] = await Promise.all([
        printerService.getPrinters(),
        printerService.getStatus(),
      ]);
      
      setPrinters(printerList);
      setStatus(serviceStatus);
      
      if (printerList.length > 0) {
        setSelectedPrinter(printerList[0]);
      }
      
      console.log('✅ [PrinterDiagnostics] Loaded', { printerList, serviceStatus });
    } catch (err) {
      setError(err.message);
      console.error('❌ [PrinterDiagnostics] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestPrint() {
    if (!selectedPrinter) {
      setPrintResult({ success: false, message: 'No printer selected' });
      return;
    }

    try {
      setTestPrinting(true);
      setPrintResult(null);

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; font-size: 16px; font-weight: bold; }
              .info { margin-top: 10px; font-size: 12px; }
              .test { color: green; }
            </style>
          </head>
          <body>
            <div class="header">🖨️ PRINTER TEST</div>
            <div class="info">
              <div>Printer: ${selectedPrinter.name}</div>
              <div>Type: ${selectedPrinter.type}</div>
              <div>Time: ${new Date().toLocaleString()}</div>
              <div class="test">✓ If this printed, your printer works!</div>
            </div>
          </body>
        </html>
      `;

      const result = await printerService.print(
        selectedPrinter.name,
        htmlContent,
        { paperSize: 'Letter', orientation: 'portrait' }
      );

      setPrintResult({ success: true, message: 'Test print sent successfully!', details: result });
    } catch (err) {
      setPrintResult({ success: false, message: err.message });
      console.error('❌ [PrinterDiagnostics] Test print failed:', err);
    } finally {
      setTestPrinting(false);
    }
  }

  const getPrinterIcon = (printer) => {
    switch (printer.type) {
      case 'browser': return '🌐';
      case 'system-default': return '🖨️';
      case 'usb': return '🔌';
      default: return '📋';
    }
  };

  const getPrinterTypeLabel = (printer) => {
    switch (printer.type) {
      case 'browser': return 'Browser Print';
      case 'system-default': return 'System Default';
      case 'usb': return 'USB Printer';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="mt-4 text-gray-600">Loading printer diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-700 mb-2">🖨️ Printer Diagnostics</h1>
              <p className="text-gray-600">
                Check printer availability and test print functionality
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              title="Go back"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="font-semibold">Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Service Status */}
        {status && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Service Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-lg font-bold text-teal-600">✅ Ready</div>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Printers Found</div>
                <div className="text-lg font-bold text-teal-600">{printers.length}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Service Worker</div>
                <div className="text-lg font-bold text-blue-600">
                  {status.hasServiceWorker ? '✅' : '❌'}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">USB Support</div>
                <div className="text-lg font-bold text-purple-600">
                  {status.hasUSB ? '✅' : '⚠️'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printers List */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Available Printers</h2>
          
          {printers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              No printers found. At least "Browser Print" should be available.
            </div>
          ) : (
            <div className="space-y-3">
              {printers.map((printer) => (
                <div
                  key={`${printer.type}-${printer.name}`}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPrinter?.name === printer.name
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                  onClick={() => setSelectedPrinter(printer)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <span>{getPrinterIcon(printer)}</span>
                        {printer.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {getPrinterTypeLabel(printer)}
                        {printer.vendor && printer.type !== 'browser' && (
                          <> • {printer.vendor}</>
                        )}
                      </div>
                    </div>
                    {selectedPrinter?.name === printer.name && (
                      <div className="text-teal-500 font-bold text-lg ml-2">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Print */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Test Print</h2>
          
          {selectedPrinter && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>Selected:</strong> {selectedPrinter.name}
              </div>
            </div>
          )}

          <Button
            onClick={handleTestPrint}
            disabled={!selectedPrinter || testPrinting}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full"
          >
            {testPrinting ? '⏳ Printing...' : '🖨️ Send Test Print'}
          </Button>

          {printResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              printResult.success
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="font-semibold">
                {printResult.success ? '✅ Success!' : '❌ Failed'}
              </div>
              <div className="text-sm mt-1">{printResult.message}</div>
              {printResult.details && (
                <div className="text-xs mt-2 font-mono bg-white bg-opacity-50 p-2 rounded">
                  {JSON.stringify(printResult.details, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={loadDiagnostics}
            variant="outline"
            className="flex-1"
          >
            🔄 Refresh
          </Button>
          <Button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
