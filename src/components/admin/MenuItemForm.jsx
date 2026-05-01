import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../services/firebase";
import Button from "../ui/Button";

function createEmptyIngredient() {
  return {
    itemId: "",
    name: "",
    qty: "",
    sku: "",
    unitId: "",
    unitName: "",
  };
}

export default function MenuItemForm({
  onSubmit,
  onCancel,
  categories = [],
  inventoryItems = [],
  isLoading = false,
  initialValues = null,
  onAddCategory = null,
}) {
  const [name, setName] = useState(initialValues?.name || "");
  const [sellingPrice, setSellingPrice] = useState(
    initialValues?.sellingPrice?.toString() ||
      initialValues?.price?.toString() ||
      ""
  );
  const [costPrice, setCostPrice] = useState(
    initialValues?.costPrice?.toString() || ""
  );
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId || initialValues?.category_id || ""
  );
  const [description, setDescription] = useState(initialValues?.description || "");
  const [isAvailable, setIsAvailable] = useState(
    initialValues?.isAvailable ?? initialValues?.is_available ?? true
  );

  const [loadedInventoryItems, setLoadedInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const [ingredients, setIngredients] = useState(
    Array.isArray(initialValues?.ingredients) && initialValues.ingredients.length > 0
      ? initialValues.ingredients.map((ing) => ({
          itemId: ing.itemId || "",
          name: ing.name || "",
          qty: ing.qty?.toString() || "",
          sku: ing.sku || "",
          unitId: ing.unitId || "",
          unitName: ing.unitName || "",
        }))
      : [createEmptyIngredient()]
  );

  const [ingredientSearch, setIngredientSearch] = useState(
    Array.isArray(initialValues?.ingredients) && initialValues.ingredients.length > 0
      ? initialValues.ingredients.map((ing) => ing.name || "")
      : [""]
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadInventoryItems() {
      setLoadingInventory(true);

      try {
        const q = query(collection(db, "items"), orderBy("name"));
        const snapshot = await getDocs(q);

        const rows = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          return {
            id: docSnap.id,
            ...data,
            name: data.name || "",
            sku: data.sku || "",
            unitId: data.unitId || "",
            unitName: data.unitName || data.unit || "",
            currentStock: Number(data.currentStock || 0),
          };
        });

        setLoadedInventoryItems(rows);
      } catch (error) {
        console.error("Failed to load ingredients from items collection:", error);
      } finally {
        setLoadingInventory(false);
      }
    }

    loadInventoryItems();
  }, []);

  const allInventoryItems = useMemo(() => {
    const map = new Map();

    [...loadedInventoryItems, ...(inventoryItems || [])].forEach((item) => {
      if (!item?.id) return;
      map.set(item.id, {
        id: item.id,
        ...item,
        name: item.name || "",
        sku: item.sku || "",
        unitId: item.unitId || "",
        unitName: item.unitName || item.unit || "",
        currentStock: Number(item.currentStock || 0),
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [loadedInventoryItems, inventoryItems]);

  const inventoryMap = useMemo(() => {
    const map = {};
    allInventoryItems.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [allInventoryItems]);

  const getFilteredInventoryItems = (index) => {
    const search = String(ingredientSearch[index] || "").toLowerCase().trim();

    if (!search) return allInventoryItems;

    return allInventoryItems.filter((item) => {
      const itemName = String(item.name || "").toLowerCase();
      const sku = String(item.sku || "").toLowerCase();
      return itemName.includes(search) || sku.includes(search);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    const sellingNum = parseFloat(sellingPrice);
    if (!sellingPrice) {
      newErrors.sellingPrice = "Selling price is required";
      isValid = false;
    } else if (isNaN(sellingNum)) {
      newErrors.sellingPrice = "Selling price must be a valid number";
      isValid = false;
    } else if (sellingNum <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than 0";
      isValid = false;
    }

    if (costPrice !== "") {
      const costNum = parseFloat(costPrice);
      if (isNaN(costNum) || costNum < 0) {
        newErrors.costPrice = "Cost price must be 0 or greater";
        isValid = false;
      }
    }

    if (!categoryId) {
      newErrors.category = "Category is required";
      isValid = false;
    }

    const cleanedIngredients = ingredients.filter(
      (ing) => ing.itemId || ing.name || ing.qty
    );

    for (let i = 0; i < cleanedIngredients.length; i++) {
      const ing = cleanedIngredients[i];
      const qtyNum = parseFloat(ing.qty);

      if (!ing.itemId) {
        newErrors[`ingredient_${i}_itemId`] = "Ingredient item is required";
        isValid = false;
      }

      if (!ing.qty) {
        newErrors[`ingredient_${i}_qty`] = "Ingredient qty is required";
        isValid = false;
      } else if (isNaN(qtyNum) || qtyNum <= 0) {
        newErrors[`ingredient_${i}_qty`] =
          "Ingredient qty must be greater than 0";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const updateIngredientSearch = (index, value) => {
    setIngredientSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const updateIngredient = (index, field, value) => {
    setIngredients((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      if (field === "itemId") {
        const selected = inventoryMap[value];

        if (selected) {
          updated[index] = {
            ...updated[index],
            itemId: selected.id,
            name: selected.name || "",
            sku: selected.sku || "",
            unitId: selected.unitId || "",
            unitName: selected.unitName || "",
          };

          setIngredientSearch((prevSearch) => {
            const searchUpdated = [...prevSearch];
            searchUpdated[index] = selected.name || "";
            return searchUpdated;
          });
        } else {
          updated[index] = {
            ...updated[index],
            itemId: "",
            name: "",
            sku: "",
            unitId: "",
            unitName: "",
          };
        }
      }

      return updated;
    });
  };

  const addIngredientRow = () => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
    setIngredientSearch((prev) => [...prev, ""]);
  };

  const removeIngredientRow = (index) => {
    setIngredients((prev) => {
      if (prev.length === 1) return [createEmptyIngredient()];
      return prev.filter((_, i) => i !== index);
    });

    setIngredientSearch((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    const cleanedIngredients = ingredients
      .filter((ing) => ing.itemId && ing.qty)
      .map((ing) => ({
        itemId: ing.itemId,
        name: ing.name || "",
        qty: parseFloat(ing.qty),
        sku: ing.sku || "",
        unitId: ing.unitId || "",
        unitName: ing.unitName || "",
      }));

    const selectedCategory = categories.find((cat) => cat.id === categoryId);

    const formData = {
      name: name.trim(),
      price: parseFloat(sellingPrice),
      sellingPrice: parseFloat(sellingPrice),
      costPrice: costPrice === "" ? 0 : parseFloat(costPrice),
      categoryId,
      categoryName: selectedCategory?.name || "",
      description: description.trim() || "",
      isAvailable,
      isActive: isAvailable,
      ingredients: cleanedIngredients,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Chicken Fried Rice"
          className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selling Price (LKR) *
          </label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
              errors.sellingPrice ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading}
          />
          {errors.sellingPrice && (
            <p className="text-sm text-red-600 mt-1">{errors.sellingPrice}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price (LKR)
          </label>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
              errors.costPrice ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading}
          />
          {errors.costPrice && (
            <p className="text-sm text-red-600 mt-1">{errors.costPrice}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          value={categoryId}
          onChange={(e) => {
            if (e.target.value === "__ADD_NEW__") {
              onAddCategory && onAddCategory();
            } else {
              setCategoryId(e.target.value);
            }
          }}
          className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
            errors.category ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isLoading}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          {onAddCategory && <option value="__ADD_NEW__">+ Add Category</option>}
        </select>
        {errors.category && (
          <p className="text-sm text-red-600 mt-1">{errors.category}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          disabled={isLoading}
        />
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ingredients
            </label>
            <p className="text-xs text-gray-500">
              Loaded from Firestore <b>items</b> collection. Search by name or SKU.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={addIngredientRow}
            disabled={isLoading || loadingInventory}
          >
            + Add Ingredient
          </Button>
        </div>

        {loadingInventory && (
          <div className="mb-3 rounded-lg bg-white border border-gray-200 p-3 text-sm text-gray-600">
            Loading ingredients...
          </div>
        )}

        <div className="space-y-3">
          {ingredients.map((ingredient, index) => {
            const filteredItems = getFilteredInventoryItems(index);
            const selectedItem = inventoryMap[ingredient.itemId];

            return (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start border rounded-lg p-3 bg-white"
              >
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={ingredientSearch[index] || ""}
                    onChange={(e) => updateIngredientSearch(index, e.target.value)}
                    placeholder="Search ingredient name or SKU..."
                    className="w-full h-11 px-3 border rounded-lg focus:ring-2 focus:ring-teal-500 border-gray-300"
                    disabled={isLoading || loadingInventory}
                  />
                </div>

                <div className="md:col-span-4">
                  <select
                    value={ingredient.itemId}
                    onChange={(e) =>
                      updateIngredient(index, "itemId", e.target.value)
                    }
                    className={`w-full h-11 px-3 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                      errors[`ingredient_${index}_itemId`]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={isLoading || loadingInventory}
                  >
                    <option value="">
                      {filteredItems.length ? "Select inventory item" : "No items found"}
                    </option>
                    {filteredItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.sku ? `(${item.sku})` : ""} — Stock:{" "}
                        {item.currentStock ?? 0} {item.unitName || ""}
                      </option>
                    ))}
                  </select>

                  {errors[`ingredient_${index}_itemId`] && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors[`ingredient_${index}_itemId`]}
                    </p>
                  )}

                  {selectedItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      SKU: {selectedItem.sku || "-"} | Stock:{" "}
                      {selectedItem.currentStock ?? 0} {selectedItem.unitName || ""}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    value={ingredient.qty}
                    onChange={(e) => updateIngredient(index, "qty", e.target.value)}
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    className={`w-full h-11 px-3 border rounded-lg focus:ring-2 focus:ring-teal-500 ${
                      errors[`ingredient_${index}_qty`]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`ingredient_${index}_qty`] && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors[`ingredient_${index}_qty`]}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <input
                    type="text"
                    value={ingredient.unitName || ""}
                    placeholder="Unit"
                    className="w-full h-11 px-3 border rounded-lg bg-gray-100 border-gray-300"
                    disabled
                  />
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(index)}
                    className="w-full h-11 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="w-5 h-5"
          disabled={isLoading}
        />
        <label className="ml-3 text-sm font-medium text-gray-700">
          Available for ordering
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading
            ? initialValues
              ? "Saving..."
              : "Creating..."
            : initialValues
            ? "Save Changes"
            : "Create Item"}
        </Button>
      </div>
    </form>
  );
}