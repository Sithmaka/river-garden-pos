import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import {
  importMenuFromCsv,
  validateMenuCsvImport,
} from "../../services/menuService";
import { createMenuCsvTemplate } from "../../utils/menuCsvImport";

function downloadTemplate() {
  const blob = new Blob([createMenuCsvTemplate()], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "menu_items_import_template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ImportMenuCsvModal({
  isOpen,
  onClose,
  categories,
  onImported,
}) {
  const [menuItemsText, setMenuItemsText] = useState("");
  const [categoriesText, setCategoriesText] = useState("");
  const [menuFileName, setMenuFileName] = useState("");
  const [categoriesFileName, setCategoriesFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMenuItemsText("");
      setCategoriesText("");
      setMenuFileName("");
      setCategoriesFileName("");
      setPreview(null);
      setError("");
      setIsImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!menuItemsText) {
      setPreview(null);
      setError("");
      return;
    }

    try {
      const plan = validateMenuCsvImport(
        menuItemsText,
        categoriesText,
        categories
      );
      setPreview(plan);
      setError("");
    } catch (validationError) {
      setPreview(null);
      setError(validationError.message || "The selected CSV is invalid.");
    }
  }, [menuItemsText, categoriesText, categories]);

  const readFile = async (file, setText, setFileName) => {
    if (!file) {
      setText("");
      setFileName("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    try {
      setText(await file.text());
      setFileName(file.name);
    } catch {
      setError(`Could not read ${file.name}.`);
    }
  };

  const handleImport = async () => {
    if (!preview || isImporting) return;

    setIsImporting(true);
    setError("");
    const { data, error: importError } = await importMenuFromCsv(
      menuItemsText,
      categoriesText,
      categories
    );

    if (importError) {
      setError(importError.message || "Menu import failed.");
      setIsImporting(false);
      return;
    }

    await onImported(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isImporting && onClose()}
      title="Import Menu from CSV"
      maxWidth="max-w-3xl"
    >
      <div className="p-6 space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Simple import</p>
          <p className="mt-1">
            Download the template, add one menu item per row, then upload it below.
            Categories are matched by name and created automatically when needed.
          </p>
          <Button
            onClick={downloadTemplate}
            variant="secondary"
            className="mt-3"
            data-testid="download-menu-csv-template"
          >
            Download CSV Template
          </Button>
        </div>

        <div>
          <label
            htmlFor="menuItemsCsv"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Menu items CSV *
          </label>
          <input
            id="menuItemsCsv"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              readFile(event.target.files?.[0], setMenuItemsText, setMenuFileName)
            }
            disabled={isImporting}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {menuFileName && (
            <p className="mt-1 text-xs text-gray-500">Selected: {menuFileName}</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-5">
          <label
            htmlFor="categoriesCsv"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Categories CSV (optional)
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Use this only for the legacy two-file export where menu items use a
            category_id column.
          </p>
          <input
            id="categoriesCsv"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              readFile(event.target.files?.[0], setCategoriesText, setCategoriesFileName)
            }
            disabled={isImporting}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-gray-700 hover:file:bg-gray-200"
          />
          {categoriesFileName && (
            <p className="mt-1 text-xs text-gray-500">
              Selected: {categoriesFileName}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {preview && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-900">CSV ready to import</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-green-800">
              <div>
                <span className="block text-2xl font-bold">{preview.items.length}</span>
                menu items
              </div>
              <div>
                <span className="block text-2xl font-bold">
                  {preview.categories.length}
                </span>
                categories to create or update
              </div>
            </div>
            <p className="mt-3 text-xs text-green-700">
              Re-importing the same rows updates their documents instead of creating
              duplicates.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
          <Button onClick={onClose} variant="secondary" disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || isImporting}
            data-testid="confirm-menu-csv-import"
          >
            {isImporting ? "Importing..." : "Import Menu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
