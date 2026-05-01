import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * UpdateNotification Component
 * Listens for update events from Electron and shows notifications
 */
export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    // Only run in Electron environment
    if (!window.electronAPI) {
      return;
    }

    // Listen for update available event
    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable?.(() => {
      setUpdateAvailable(true);
      toast(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-semibold">Update Available</p>
            <p className="text-sm text-gray-600">Downloading new version...</p>
          </div>
        </div>,
        { duration: 10000 }
      );
    });

    // Listen for update downloaded event
    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded?.(() => {
      setUpdateDownloaded(true);
      toast.custom(
        (t) => (
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Update Ready</p>
                <p className="text-sm">Restart to apply the new version</p>
              </div>
            </div>
            <button
              onClick={() => {
                window.electronAPI.restartForUpdate?.();
                toast.dismiss(t.id);
              }}
              className="bg-white text-green-500 px-4 py-2 rounded font-semibold hover:bg-green-50 transition"
            >
              Restart Now
            </button>
          </div>
        ),
        { duration: Infinity }
      );
    });

    // Listen for update error
    const unsubscribeError = window.electronAPI.onUpdateError?.((error) => {
      console.error('Update error:', error);
      toast.error(`Update error: ${error}`);
    });

    // Cleanup
    return () => {
      unsubscribeAvailable?.();
      unsubscribeDownloaded?.();
      unsubscribeError?.();
    };
  }, []);

  // Component doesn't render anything - just listens for events
  return null;
}
