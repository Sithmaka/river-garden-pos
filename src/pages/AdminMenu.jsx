/**
 * Admin Menu Page
 *
 * Menu management page for admin users.
 * Displays menu items list and provides access to add/edit/delete functionality.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuList from "../components/admin/MenuList";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import MenuItemForm from "../components/admin/MenuItemForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useMenu } from "../hooks/useMenu";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  createCategory,
  deleteCategory,
} from "../services/menuService";

export default function AdminMenu() {
  const navigate = useNavigate();
  const { menuItems, categories, loading, error, refetch } = useMenu(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [forceDeleteCategory, setForceDeleteCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [deletingItem, setDeletingItem] = useState(null);
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingItemId, setTogglingItemId] = useState(null);

  const showTemporarySuccess = (message, timeout = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, timeout);
  };

  const showTemporaryError = (setter, message, timeout = 3000) => {
    setter(message);
    setTimeout(() => {
      setter(null);
    }, timeout);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result;

      if (editingItem) {
        result = await updateMenuItem(editingItem.id, formData);
      } else {
        result = await createMenuItem(formData);
      }

      const { error } = result;

      if (error) {
        setSubmitError(
          error.message ||
            (editingItem
              ? "Failed to update menu item. Please try again."
              : "Failed to create menu item. Please try again.")
        );
        setIsSubmitting(false);
        return;
      }

      await refetch();

      showTemporarySuccess(
        editingItem
          ? "Menu item updated successfully!"
          : "Menu item created successfully!"
      );

      setTimeout(() => {
        setIsModalOpen(false);
        setEditingItem(null);
        setIsSubmitting(false);
      }, 500);
    } catch (err) {
      console.error("Error saving menu item:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setSubmitError(null);
  };

  const handleAddCategory = () => {
    setIsCategoryModalOpen(true);
    setNewCategoryName("");
    setCategoryError(null);
  };

  const handleAddCategoryFromForm = () => {
    setIsCategoryModalOpen(true);
    setNewCategoryName("");
    setCategoryError(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || newCategoryName.trim().length < 2) {
      setCategoryError("Category name must be at least 2 characters");
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      const { error } = await createCategory({
        name: newCategoryName.trim(),
        sort_order: categories.length + 1,
      });

      if (error) {
        setCategoryError(error.message || "Failed to create category");
        setIsCreatingCategory(false);
        return;
      }

      await refetch();

      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      setIsCreatingCategory(false);

      showTemporarySuccess("Category created successfully!");
    } catch (err) {
      console.error("Error creating category:", err);
      setCategoryError("An unexpected error occurred");
      setIsCreatingCategory(false);
    }
  };

  const handleCancelCategory = () => {
    setIsCategoryModalOpen(false);
    setNewCategoryName("");
    setCategoryError(null);
  };

  const handleDeleteItem = (item) => {
    setDeletingItem(item);
    setShowFirstConfirm(true);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleSecondConfirm = async () => {
    setIsDeleting(true);

    try {
      const { error } = await deleteMenuItem(deletingItem.id);

      if (error) {
        setSubmitError(error.message || "Failed to delete item. Please try again.");
        setIsDeleting(false);
        return;
      }

      await refetch();

      setShowSecondConfirm(false);
      setDeletingItem(null);
      setIsDeleting(false);

      showTemporarySuccess(`${deletingItem.name} has been deleted`);
    } catch (err) {
      console.error("Error deleting menu item:", err);
      setSubmitError("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(false);
    setDeletingItem(null);
    setIsDeleting(false);
    setSubmitError(null);
  };

  const handleToggleAvailability = async (item) => {
    setTogglingItemId(item.id);

    try {
      const currentStatus = item.isAvailable ?? item.is_available ?? true;
      const { error } = await toggleItemAvailability(item.id, currentStatus);

      if (error) {
        setTogglingItemId(null);
        showTemporaryError(
          setSubmitError,
          error.message || "Failed to update availability. Please try again."
        );
        return;
      }

      await refetch();
      setTogglingItemId(null);
      showTemporarySuccess("Item availability updated", 2000);
    } catch (err) {
      console.error("Error toggling availability:", err);
      setTogglingItemId(null);
      showTemporaryError(
        setSubmitError,
        "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {successMessage && (
        <div
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in"
          role="alert"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex justify-start">
            <Button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2"
            >
              ← Go Back
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Menu Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your restaurant menu items and categories
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setCategoryError(null);
                  setShowDeleteCategoryModal(true);
                }}
                variant="secondary"
              >
                Delete Category
              </Button>

              <Button onClick={handleAddItem} data-testid="add-item-button">
                Add New Item
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setDeletingCategory(null);
          setForceDeleteCategory(false);
          setCategoryError(null);
        }}
        title="Delete Category"
      >
        <div className="space-y-4">
          {categoryError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{categoryError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Category to Delete
            </label>

            <select
              value={deletingCategory?.id || ""}
              onChange={(e) => {
                const category = categories.find((c) => c.id === e.target.value);
                setDeletingCategory(category || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {deletingCategory && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forceDelete"
                  checked={forceDeleteCategory}
                  onChange={(e) => setForceDeleteCategory(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="forceDelete" className="text-sm text-gray-700">
                  Delete all menu items in this category
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  {forceDeleteCategory
                    ? "Warning: This will delete the category and all its menu items. This cannot be undone."
                    : "Warning: The category can only be deleted if it has no menu items."}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowDeleteCategoryModal(false);
                setDeletingCategory(null);
                setForceDeleteCategory(false);
                setCategoryError(null);
              }}
              variant="secondary"
              disabled={isDeletingCategory}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (!deletingCategory) return;

                setIsDeletingCategory(true);
                setCategoryError(null);

                try {
                  const { success, error } = await deleteCategory(
                    deletingCategory.id,
                    forceDeleteCategory
                  );

                  if (!success || error) {
                    throw error || new Error("Failed to delete category");
                  }

                  await refetch();

                  setShowDeleteCategoryModal(false);
                  setDeletingCategory(null);
                  setForceDeleteCategory(false);

                  showTemporarySuccess("Category deleted successfully!");
                } catch (err) {
                  console.error("Error deleting category:", err);
                  setCategoryError(err.message || "Failed to delete category");
                } finally {
                  setIsDeletingCategory(false);
                }
              }}
              variant="danger"
              disabled={!deletingCategory || isDeletingCategory}
            >
              {isDeletingCategory ? "Deleting..." : "Delete Category"}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuList
          menuItems={menuItems}
          loading={loading}
          error={error}
          refetch={refetch}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onToggleAvailability={handleToggleAvailability}
          togglingItemId={togglingItemId}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}
      >
        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <MenuItemForm
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
          initialValues={editingItem}
          onAddCategory={handleAddCategoryFromForm}
        />
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={handleCancelCategory}
        title="Add New Category"
      >
        {categoryError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{categoryError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="categoryName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category Name *
            </label>
            <input
              id="categoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreatingCategory) {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Appetizers, Main Course, Desserts"
              disabled={isCreatingCategory}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={handleCancelCategory}
              variant="secondary"
              disabled={isCreatingCategory}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showFirstConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleFirstConfirm}
        title="Delete Menu Item?"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showSecondConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleSecondConfirm}
        title="Confirm Deletion"
        message={`This action cannot be undone. Confirm deletion of "${deletingItem?.name}"?`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}