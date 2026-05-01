/**
 * Printer Selector Component
 * Allows users to select from available printers
 */

import { useState, useEffect } from 'react';
import { printerService } from '../../services/printerService';
import Button from './Button';

export function PrinterSelector({ onSelect, currentPrinter }) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(currentPrinter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  async function loadPrinters() {
    try {
      setLoading(true);
      setError(null);
      const allPrinters = await printerService.getPrinters();
      setPrinters(allPrinters);
      console.log('✅ [PrinterSelector] Printers loaded:', allPrinters);
    } catch (err) {
      setError(err.message);
      console.error('❌ [PrinterSelector] Failed to load printers:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelect = () => {
    if (selectedPrinter) {
      onSelect(selectedPrinter);
    }
  };

  const getPrinterIcon = (printer) => {
    switch (printer.type) {
      case 'browser':
        return '🌐';
      case 'system-default':
        return '🖨️';
      case 'usb':
        return '🔌';
      default:
        return '📋';
    }
  };

  const getPrinterTypeLabel = (printer) => {
    switch (printer.type) {
      case 'browser':
        return 'Browser Print';
      case 'system-default':
        return 'System Default';
      case 'usb':
        return 'USB Printer';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-600 text-center">
        <div className="animate-spin inline-block">⏳</div>
        <div>Loading printers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="font-semibold">Error Loading Printers</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-semibold text-gray-700">
          📋 Select Printer:
        </label>
        <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-sm">
          {printers.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              No printers available
            </div>
          ) : (
            printers.map((printer) => (
              <div
                key={`${printer.type}-${printer.name}`}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedPrinter?.name === printer.name
                    ? 'bg-teal-50 border-l-4 border-l-teal-500'
                    : 'hover:bg-gray-50'
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
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSelect}
          disabled={!selectedPrinter || loading}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
        >
          Select Printer
        </Button>
        <Button
          onClick={loadPrinters}
          variant="outline"
          className="px-4"
          title="Refresh printer list"
        >
          🔄
        </Button>
      </div>
    </div>
  );
}

export default PrinterSelector;
