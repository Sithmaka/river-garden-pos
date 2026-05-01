/**
 * Database Seeding Script
 *
 * Seeds the database with sample categories and menu items for testing.
 * This script is idempotent - it can be run multiple times without creating duplicates.
 *
 * Usage: npm run seed
 *
 * Environment Variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anon key
 * - SEED_ADMIN_EMAIL: Admin user email (default: admin@codebell.com)
 * - SEED_ADMIN_PASSWORD: Admin user password (default: admin123)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@codebell.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  );
  console.error(
    "   Please ensure .env.local exists and contains these variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Seed data definitions
const categories = [
  { name: "Starters", emoji: "���", sort_order: 1 },
  { name: "Mains", emoji: "���️", sort_order: 2 },
  { name: "Desserts", emoji: "���", sort_order: 3 },
  { name: "Beverages", emoji: "☕", sort_order: 4 },
];

const menuItemsByCategory = {
  Starters: [
    {
      name: "Spring Rolls",
      description: "Crispy vegetable spring rolls with sweet chili sauce",
      price: 450.0,
    },
    {
      name: "Garlic Bread",
      description: "Toasted bread with garlic butter and herbs",
      price: 350.0,
    },
    {
      name: "Soup of the Day",
      description: "Chef's special homemade soup",
      price: 400.0,
    },
  ],
  Mains: [
    {
      name: "Grilled Chicken",
      description: "Tender grilled chicken with seasonal vegetables",
      price: 1250.0,
    },
    {
      name: "Pasta Carbonara",
      description: "Creamy pasta with bacon and parmesan",
      price: 950.0,
    },
    {
      name: "Fish & Chips",
      description: "Beer-battered fish with crispy fries",
      price: 1100.0,
    },
    {
      name: "Vegetable Stir Fry",
      description: "Fresh vegetables in savory sauce with rice",
      price: 850.0,
    },
  ],
  Desserts: [
    {
      name: "Chocolate Brownie",
      description: "Warm chocolate brownie with vanilla ice cream",
      price: 500.0,
    },
    {
      name: "Ice Cream Sundae",
      description: "Three scoops with toppings and whipped cream",
      price: 450.0,
    },
    {
      name: "Cheesecake",
      description: "Classic New York style cheesecake",
      price: 550.0,
    },
  ],
  Beverages: [
    {
      name: "Fresh Juice",
      description: "Choice of orange, apple, or mixed fruit",
      price: 300.0,
    },
    {
      name: "Coffee/Tea",
      description: "Hot or iced, your choice",
      price: 250.0,
    },
  ],
};

async function getRestaurantId() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .limit(1)
    .single();

  if (error) {
    console.error("❌ Failed to fetch restaurant:", error.message);
    return null;
  }

  return data.id;
}

async function seedCategories(restaurantId) {
  console.log("\n��� Seeding categories...");
  let created = 0;
  let skipped = 0;

  for (const cat of categories) {
    // Check if category already exists
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("name", cat.name)
      .maybeSingle();

    if (existing) {
      console.log(`   ⏭️  Category already exists: ${cat.emoji} ${cat.name}`);
      skipped++;
      continue;
    }

    // Insert category
    const { error } = await supabase.from("categories").insert({
      restaurant_id: restaurantId,
      name: cat.name,
      emoji: cat.emoji,
      sort_order: cat.sort_order,
    });

    if (error) {
      console.error(`   ❌ Failed to create ${cat.name}:`, error.message);
    } else {
      console.log(`   ✓ Created category: ${cat.emoji} ${cat.name}`);
      created++;
    }
  }

  console.log(`\n��� Categories: ${created} created, ${skipped} skipped`);
  return created;
}

async function seedMenuItems(restaurantId) {
  console.log("\n��� Seeding menu items...");
  let created = 0;
  let skipped = 0;

  // Fetch all categories to get their IDs
  const { data: categoryData, error: catError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("restaurant_id", restaurantId);

  if (catError) {
    console.error("❌ Failed to fetch categories:", catError.message);
    return 0;
  }

  // Create a map of category name to ID
  const categoryMap = {};
  categoryData.forEach((cat) => {
    categoryMap[cat.name] = cat.id;
  });

  // Insert menu items for each category
  for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
    const categoryId = categoryMap[categoryName];

    if (!categoryId) {
      console.error(`   ❌ Category not found: ${categoryName}`);
      continue;
    }

    for (const item of items) {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("menu_items")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("category_id", categoryId)
        .eq("name", item.name)
        .maybeSingle();

      if (existing) {
        console.log(`   ⏭️  Item already exists: ${item.name}`);
        skipped++;
        continue;
      }

      // Insert menu item
      const { error } = await supabase.from("menu_items").insert({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        is_available: true,
      });

      if (error) {
        console.error(`   ❌ Failed to create ${item.name}:`, error.message);
      } else {
        console.log(
          `   ✓ Created item: ${item.name} (Rs. ${item.price.toFixed(2)})`
        );
        created++;
      }
    }
  }

  console.log(`\n��� Menu items: ${created} created, ${skipped} skipped`);
  return created;
}

async function seed() {
  console.log("========================================");
  console.log("��� Database Seeding Script");
  console.log("========================================");

  try {
    // Authenticate as admin user
    console.log("\n��� Authenticating as admin user...");
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

    if (authError) {
      console.error("❌ Authentication failed:", authError.message);
      console.error("\n��� Make sure you have an admin user created with:");
      console.error(`   Email: ${adminEmail}`);
      console.error(`   Password: ${adminPassword}`);
      console.error(
        "\n   Or set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local"
      );
      process.exit(1);
    }

    console.log(`✓ Authenticated as: ${authData.user.email}`);

    // Get restaurant ID
    const restaurantId = await getRestaurantId();
    if (!restaurantId) {
      console.error("\n❌ No restaurant found. Please run migrations first.");
      process.exit(1);
    }

    console.log(`✓ Using restaurant ID: ${restaurantId}`);

    // Seed categories
    const categoriesCreated = await seedCategories(restaurantId);

    // Seed menu items
    const itemsCreated = await seedMenuItems(restaurantId);

    // Sign out
    await supabase.auth.signOut();

    // Summary
    console.log("\n========================================");
    console.log("✅ Seeding Complete!");
    console.log("========================================");
    console.log(`   Categories: ${categoriesCreated} created`);
    console.log(`   Menu Items: ${itemsCreated} created`);
    console.log("\n��� Tip: Run this script again anytime - it's idempotent!");
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ Seed script failed:", error.message);
    process.exit(1);
  }
}

// Run the seed function
seed();
