const MENU_TEMPLATE_HEADERS = [
  "id",
  "name",
  "category",
  "price",
  "cost_price",
  "description",
  "is_available",
  "item_number",
];

function parseCsv(text, fileLabel) {
  if (!text?.trim()) return [];

  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error(`${fileLabel} contains an unterminated quoted field.`);
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [rawHeaders, ...dataRows] = rows;
  if (!rawHeaders) return [];
  const headers = rawHeaders.map((header) => header.trim().toLowerCase());

  if (new Set(headers).size !== headers.length) {
    throw new Error(`${fileLabel} contains duplicate column names.`);
  }

  return dataRows
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values, index) => {
      if (values.length !== headers.length) {
        throw new Error(
          `${fileLabel} row ${index + 2} has ${values.length} columns; expected ${headers.length}.`
        );
      }

      return {
        line: index + 2,
        values: Object.fromEntries(
          headers.map((header, columnIndex) => [header, values[columnIndex].trim()])
        ),
      };
    });
}

function required(row, field, fileLabel) {
  const value = row.values[field];
  if (!value) throw new Error(`${fileLabel} row ${row.line}: ${field} is required.`);
  return value;
}

function parseNumber(value, field, row, { required: isRequired = false } = {}) {
  if (!value && !isRequired) return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Menu items row ${row.line}: ${field} must be a number of 0 or more.`);
  }
  return number;
}

function parseBoolean(value, row) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  throw new Error(
    `Menu items row ${row.line}: is_available must be true/false, yes/no, or 1/0.`
  );
}

function parseDate(value, field, fileLabel, row) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fileLabel} row ${row.line}: ${field} is not a valid date.`);
  }
  return date;
}

function makeKey(name) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
}

function stableId(value, prefix) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function prepareMenuCsvImport({
  menuItemsText,
  categoriesText = "",
  existingCategories = [],
}) {
  const menuRows = parseCsv(menuItemsText, "Menu items CSV");
  if (menuRows.length === 0) throw new Error("Menu items CSV has no data rows.");

  const itemHeaders = Object.keys(menuRows[0].values);
  for (const header of ["name", "price"]) {
    if (!itemHeaders.includes(header)) {
      throw new Error(`Menu items CSV is missing the ${header} column.`);
    }
  }

  const categoryRows = parseCsv(categoriesText, "Categories CSV");
  const categoryById = new Map();
  const categoryByName = new Map();
  const categories = [];

  for (const category of existingCategories) {
    if (!category?.id || !category?.name) continue;
    categoryById.set(category.id, { id: category.id, name: category.name });
    categoryByName.set(category.name.trim().toLowerCase(), {
      id: category.id,
      name: category.name,
    });
  }

  for (const row of categoryRows) {
    const id = required(row, "id", "Categories CSV");
    const name = required(row, "name", "Categories CSV");
    const normalizedName = name.toLowerCase();
    const category = { id, name };

    if (categories.some((entry) => entry.id === id)) {
      throw new Error(`Categories CSV row ${row.line}: duplicate id ${id}.`);
    }

    categoryById.set(id, category);
    categoryByName.set(normalizedName, category);
    categories.push({
      id,
      data: {
        name,
        key: makeKey(name),
        emoji: row.values.emoji || "",
        sortOrder: parseNumber(row.values.sort_order, "sort_order", row),
        sourceRestaurantId: row.values.restaurant_id || "",
        createdAt: parseDate(row.values.created_at, "created_at", "Categories CSV", row),
        updatedAt: parseDate(row.values.updated_at, "updated_at", "Categories CSV", row),
      },
    });
  }

  const items = [];
  const itemIds = new Set();

  for (const row of menuRows) {
    const name = required(row, "name", "Menu items CSV");
    const price = parseNumber(
      required(row, "price", "Menu items CSV"),
      "price",
      row,
      { required: true }
    );
    const sourceCategoryId = row.values.category_id;
    const sourceCategoryName = row.values.category || row.values.category_name;
    let category = sourceCategoryId ? categoryById.get(sourceCategoryId) : null;

    if (!category && sourceCategoryName) {
      category = categoryByName.get(sourceCategoryName.toLowerCase());
      if (!category) {
        const id = stableId(sourceCategoryName.toLowerCase(), "category");
        category = { id, name: sourceCategoryName };
        categoryById.set(id, category);
        categoryByName.set(sourceCategoryName.toLowerCase(), category);
        categories.push({
          id,
          data: {
            name: sourceCategoryName,
            key: makeKey(sourceCategoryName),
            emoji: "",
            sortOrder: categoryByName.size,
            createdAt: null,
            updatedAt: null,
          },
        });
      }
    }

    if (!category) {
      const detail = sourceCategoryId
        ? `category_id ${sourceCategoryId} was not found`
        : "category or category_id is required";
      throw new Error(`Menu items CSV row ${row.line}: ${detail}.`);
    }

    const id = row.values.id || stableId(`${category.id}\u0000${name.toLowerCase()}`, "menu");
    if (itemIds.has(id)) {
      throw new Error(`Menu items CSV row ${row.line}: duplicate item id ${id}.`);
    }
    itemIds.add(id);

    const available = parseBoolean(row.values.is_available, row);
    items.push({
      id,
      data: {
        name,
        description: row.values.description || "",
        imageUrl: row.values.image_url || "",
        sellingPrice: price,
        price,
        costPrice: parseNumber(row.values.cost_price, "cost_price", row),
        categoryId: category.id,
        categoryName: category.name,
        isAvailable: available,
        isActive: available,
        itemNumber: row.values.item_number || "",
        ingredients: [],
        sourceRestaurantId: row.values.restaurant_id || "",
        createdAt: parseDate(row.values.created_at, "created_at", "Menu items CSV", row),
        updatedAt: parseDate(row.values.updated_at, "updated_at", "Menu items CSV", row),
      },
    });
  }

  return { categories, items };
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function createMenuCsvTemplate() {
  const example = [
    "",
    "Chicken Fried Rice",
    "RICE",
    "1200",
    "700",
    "Optional description",
    "true",
    "101",
  ];
  return `${MENU_TEMPLATE_HEADERS.join(",")}\r\n${example.map(escapeCsv).join(",")}\r\n`;
}
