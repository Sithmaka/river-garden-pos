/**
 * MenuList Component
 *
 * Displays menu items grouped by category with collapsible sections.
 * Handles loading, error, and empty states.
 */

import { useState } from "react";
import { formatCurrency } from "../../utils/formatting";
import Button from "../ui/Button";
import Toggle from "../ui/Toggle";

export default function MenuList({
  menuItems = [],
  loading,
  error,
  refetch,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
  togglingItemId,
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    const categoryId = item.category?.id || item.categoryId || "uncategorized";
    const categoryName =
      item.category?.name || item.categoryName || "Uncategorized";
    const categoryEmoji = item.category?.emoji || "🍽️";
    const categorySortOrder = item.category?.sort_order ?? 999;

    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        emoji: categoryEmoji,
        sortOrder: categorySortOrder,
        items: [],
      };
    }

    acc[categoryId].items.push(item);
    return acc;
  }, {});

  const sortedGroups = Object.values(groupedItems).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-gray-600">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    const errorText =
      typeof error === "string" ? error : error?.message || "Failed to load menu";

    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-red-600 text-lg mb-4">⚠️ {errorText}</div>
        <Button onClick={refetch} variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No menu items yet
        </h3>
        <p className="text-gray-600 mb-6">
          Add your first menu item to get started
        </p>
        <Button onClick={onAddItem} disabled={!onAddItem}>
          Add First Item
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => {
        const isExpanded = !expandedCategories.has(group.id);

        return (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <button
              onClick={() => toggleCategory(group.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{group.emoji}</div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {group.items.length} {group.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              <div className="text-gray-400">{isExpanded ? "▼" : "▶"}</div>
            </button>

            {isExpanded && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => {
                    const isAvailable =
                      item.isAvailable ?? item.is_available ?? true;
                    const ingredients = Array.isArray(item.ingredients)
                      ? item.ingredients
                      : [];

                    return (
                      <div
                        key={item.id}
                        className={`border border-gray-200 rounded-lg p-4 transition-all ${
                          !isAvailable ? "opacity-60 bg-gray-50" : "hover:shadow-md"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${
                                isAvailable ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {item.name}
                            </h4>

                            {!isAvailable && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                Unavailable
                              </span>
                            )}

                            {ingredients.length > 0 && (
                              <p className="mt-1 text-xs text-gray-500">
                                {ingredients.length} ingredient
                                {ingredients.length === 1 ? "" : "s"}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 ml-3">
                            <div
                              className="flex items-center gap-2"
                              data-testid={`toggle-availability-${item.id}`}
                            >
                              <span className="text-xs text-gray-600">
                                {isAvailable ? "Available" : "Unavailable"}
                              </span>
                              <Toggle
                                enabled={isAvailable}
                                onChange={() =>
                                  onToggleAvailability && onToggleAvailability(item)
                                }
                                disabled={
                                  !onToggleAvailability || togglingItemId === item.id
                                }
                                label={`Toggle availability for ${item.name}`}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <p
                          className={`text-lg font-semibold mb-3 ${
                            isAvailable ? "text-teal-600" : "text-gray-400"
                          }`}
                        >
                          {formatCurrency(item.price)}
                        </p>

                        {item.description && (
                          <p
                            className={`text-sm mb-3 line-clamp-2 ${
                              isAvailable ? "text-gray-600" : "text-gray-400"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditItem && onEditItem(item)}
                            disabled={!onEditItem}
                            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md min-h-[48px] md:min-h-0 ${
                              onEditItem
                                ? "text-teal-600 bg-teal-50 hover:bg-teal-100 active:bg-teal-200"
                                : "text-gray-400 bg-gray-100 cursor-not-allowed"
                            }`}
                            data-testid={`edit-item-${item.id}`}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => onDeleteItem && onDeleteItem(item)}
                            disabled={!onDeleteItem}
                            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md min-h-[48px] md:min-h-0 ${
                              onDeleteItem
                                ? "text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200"
                                : "text-gray-400 bg-gray-100 cursor-not-allowed"
                            }`}
                            data-testid={`delete-item-${item.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}