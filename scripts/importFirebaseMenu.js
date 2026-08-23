import fs from "node:fs";
import process from "node:process";
import { initializeApp } from "firebase/app";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  Timestamp,
  doc,
  getFirestore,
  writeBatch,
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function parseArguments(args) {
  const options = { dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--categories") {
      options.categoriesPath = args[++index];
    } else if (argument === "--items") {
      options.itemsPath = args[++index];
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!options.categoriesPath || !options.itemsPath) {
    throw new Error(
      "Usage: npm run import:menu -- --categories <categories.csv> --items <menu_items.csv> [--dry-run]"
    );
  }

  return options;
}

function parseCsv(text) {
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

  if (quoted) throw new Error("CSV contains an unterminated quoted field");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows
    .filter((values) => values.some((value) => value !== ""))
    .map((values, rowIndex) => {
      if (values.length !== headers.length) {
        throw new Error(
          `CSV row ${rowIndex + 2} has ${values.length} columns; expected ${headers.length}`
        );
      }
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    });
}

function required(row, field, source) {
  const value = row[field]?.trim();
  if (!value) throw new Error(`${source} row is missing ${field}`);
  return value;
}

function parseTimestamp(value, field, sourceId) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${sourceId} has an invalid ${field}: ${value}`);
  }
  return Timestamp.fromDate(date);
}

function parseBoolean(value, field, sourceId) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${sourceId} has an invalid ${field}: ${value}`);
}

function makeKey(name) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
}

function buildDocuments(categoryRows, itemRows) {
  const categoryIds = new Set();
  const categories = categoryRows.map((row) => {
    const id = required(row, "id", "Category");
    const name = required(row, "name", id);
    if (categoryIds.has(id)) throw new Error(`Duplicate category id: ${id}`);
    categoryIds.add(id);

    return {
      id,
      data: {
        name,
        key: makeKey(name),
        emoji: row.emoji || "",
        sortOrder: Number(row.sort_order) || 0,
        sourceRestaurantId: row.restaurant_id || "",
        createdAt: parseTimestamp(row.created_at, "created_at", id),
        updatedAt: parseTimestamp(row.updated_at, "updated_at", id),
      },
    };
  });

  const categoryNames = new Map(categories.map(({ id, data }) => [id, data.name]));
  const itemIds = new Set();
  const items = itemRows.map((row) => {
    const id = required(row, "id", "Menu item");
    const categoryId = required(row, "category_id", id);
    const name = required(row, "name", id);
    const price = Number(required(row, "price", id));

    if (itemIds.has(id)) throw new Error(`Duplicate menu item id: ${id}`);
    if (!categoryIds.has(categoryId)) {
      throw new Error(`${id} refers to missing category ${categoryId}`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`${id} has an invalid price: ${row.price}`);
    }
    itemIds.add(id);

    return {
      id,
      data: {
        name,
        description: row.description || "",
        imageUrl: row.image_url || "",
        sellingPrice: price,
        price,
        costPrice: 0,
        categoryId,
        categoryName: categoryNames.get(categoryId),
        isAvailable: parseBoolean(row.is_available, "is_available", id),
        isActive: parseBoolean(row.is_available, "is_available", id),
        itemNumber: "",
        ingredients: [],
        sourceRestaurantId: row.restaurant_id || "",
        createdAt: parseTimestamp(row.created_at, "created_at", id),
        updatedAt: parseTimestamp(row.updated_at, "updated_at", id),
      },
    };
  });

  return { categories, items };
}

function firebaseConfigFromEnvironment() {
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  for (const [key, value] of Object.entries(config)) {
    if (!value) throw new Error(`Missing Firebase setting: ${key}`);
  }
  return config;
}

async function commitDocuments(db, documents, collectionName) {
  const chunkSize = 400;
  for (let offset = 0; offset < documents.length; offset += chunkSize) {
    const batch = writeBatch(db);
    for (const document of documents.slice(offset, offset + chunkSize)) {
      batch.set(doc(db, collectionName, document.id), document.data, { merge: true });
    }
    await batch.commit();
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const categoryRows = parseCsv(fs.readFileSync(options.categoriesPath, "utf8"));
  const itemRows = parseCsv(fs.readFileSync(options.itemsPath, "utf8"));
  const documents = buildDocuments(categoryRows, itemRows);

  console.log(
    `Validated ${documents.categories.length} categories and ${documents.items.length} menu items.`
  );

  if (options.dryRun) {
    console.log("Dry run complete; Firestore was not changed.");
    return;
  }

  const email = process.env.FIREBASE_ADMIN_EMAIL;
  const password = process.env.FIREBASE_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD for an active admin account. Credentials are used only for this process."
    );
  }

  const app = initializeApp(firebaseConfigFromEnvironment());
  const auth = getAuth(app);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const db = getFirestore(app);

  await commitDocuments(db, documents.categories, "menu_categories");
  await commitDocuments(db, documents.items, "menu_items");
  await auth.signOut();

  console.log(
    `Imported ${documents.categories.length} categories and ${documents.items.length} menu items as ${credential.user.email}.`
  );
}

main().catch((error) => {
  console.error(`Menu import failed: ${error.message}`);
  process.exitCode = 1;
});
