/**
 * Ojasvita - Food Master Import Script
 * 
 * This script imports food data from CSV into MongoDB.
 * 
 * HOW TO RUN THIS SCRIPT:
 * ========================
 * 
 * Method 1 - Using Node directly:
 *   node scripts/importFoods.js
 * 
 * Method 2 - Using npm script (add to package.json):
 *   "import-foods": "node scripts/importFoods.js"
 *   Then run: npm run import-foods
 * 
 * PREREQUISITES:
 * ==============
 * 1. Make sure MongoDB is running
 * 2. Make sure the database connection is configured in config/db.js
 * 3. The CSV file should be in the project root (ojasvita_food_list.csv)
 * 
 * WHAT THIS SCRIPT DOES:
 * =====================
 * 1. Connects to MongoDB
 * 2. Reads the CSV file (ojasvita_food_list.csv)
 * 3. Parses CSV data and transforms it to match FoodMaster model schema
 * 4. Inserts foods into MongoDB (using upsert to prevent duplicates)
 *    - If a food with the same name exists, it updates the record
 *    - This allows running the script multiple times without duplicates
 * 5. Reports success/failure with count of imported foods
 * 
 * CSV FORMAT EXPECTED:
 * ==================
 * food_name,calories,carbs_g,protein_g,fat_g,category,food_type
 * Roti,120,22,3,1,Breakfast,veg
 * Paratha,260,35,6,12,Breakfast,veg
 * ...
 * 
 * DATA TRANSFORMATION:
 * ===================
 * - food_name -> name
 * - calories -> calories
 * - carbs_g -> carbs
 * - protein_g -> protein
 * - fat_g -> fats
 * - category -> category
 * - food_type -> foodType
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import the FoodMaster model
const FoodMaster = require('../models/FoodMaster');

// Import database connection
const connectDB = require('../config/db');

/**
 * Main import function
 * 
 * Orchestrates the entire import process:
 * 1. Connect to database
 * 2. Read CSV file
 * 3. Parse and transform data
 * 4. Insert into database
 * 5. Report results
 */
async function importFoods() {
  try {
    // Step 1: Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Step 2: Read CSV file
    const csvFilePath = path.join(__dirname, '..', 'ojasvita_food_list.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    console.log('✓ CSV file read successfully');

    // Step 3: Parse CSV content
    console.log('Parsing CSV data...');
    const foods = parseCSV(csvContent);
    console.log(`✓ Parsed ${foods.length} food items from CSV`);

    if (foods.length === 0) {
      console.log('No foods to import. Exiting.');
      process.exit(0);
    }

    // Step 4: Insert foods into database
    console.log('Importing foods to MongoDB...');
    const importResult = await insertFoods(foods);
    console.log(`✓ Import complete!`);

    // Step 5: Display results
    console.log('\n========== IMPORT SUMMARY ==========');
    console.log(`Total foods in CSV: ${foods.length}`);
    console.log(`New foods inserted: ${importResult.insertedCount}`);
    console.log(`Existing foods updated: ${importResult.updatedCount}`);
    console.log(`Total in database: ${importResult.totalCount}`);
    console.log('=====================================\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    // Exit process
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR DURING IMPORT:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Parse CSV content into array of food objects
 * 
 * CSV PARSING LOGIC:
 * ==================
 * 1. Split content by newlines to get rows
 * 2. First row is header - parse to get field names
 * 3. For each subsequent row:
 *    - Split by comma
 *    - Map values to field names
 *    - Transform data types (strings to numbers)
 *    - Return food object
 * 
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Array of food objects
 */
function parseCSV(csvContent) {
  // Split by newlines (handle both Windows and Unix line endings)
  const lines = csvContent.split(/\r?\n/);
  
  // Remove empty lines
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  
  if (nonEmptyLines.length === 0) {
    return [];
  }

  // First line is header
  // Expected header: food_name,calories,carbs_g,protein_g,fat_g,category,food_type
  const header = nonEmptyLines[0].split(',').map(field => field.trim());
  
  // Create mapping from CSV column index to field name
  // CSV: food_name,calories,carbs_g,protein_g,fat_g,category,food_type
  // Model: name,calories,carbs,protein,fats,category,foodType
  const fieldMapping = {
    0: 'name',        // food_name
    1: 'calories',   // calories
    2: 'carbs',       // carbs_g
    3: 'protein',     // protein_g
    4: 'fats',        // fat_g
    5: 'category',   // category
    6: 'foodType'    // food_type
  };

  const foods = [];

  // Process each data row (skip header)
  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;

    // Split by comma (simple CSV parsing)
    const values = line.split(',').map(v => v.trim());

    // Create food object using mapping
    const food = {};
    
    for (const [index, fieldName] of Object.entries(fieldMapping)) {
      let value = values[parseInt(index)];
      
      // Convert numeric fields
      if (['calories', 'carbs', 'protein', 'fats'].includes(fieldName)) {
        value = parseFloat(value) || 0;
      }
      
      food[fieldName] = value;
    }

    // Only add if name exists
    if (food.name) {
      foods.push(food);
    }
  }

  return foods;
}

/**
 * Insert foods into MongoDB using upsert
 * 
 * DUPLICATE PREVENTION LOGIC:
 * ===========================
 * Uses upsert (update + insert) to prevent duplicates:
 * - For each food, try to find by name
 * - If found: update the record
 * - If not found: insert new record
 * 
 * This approach ensures:
 * 1. No duplicate foods even if script runs multiple times
 * 2. Existing data is updated with any changes from CSV
 * 
 * @param {Array} foods - Array of food objects to insert
 * @returns {Object} - Import results
 */
async function insertFoods(foods) {
  let insertedCount = 0;
  let updatedCount = 0;

  // Process each food individually to use upsert
  for (const food of foods) {
    // Use upsert: update if exists, insert if not
    // Match by name to prevent duplicates
    const result = await FoodMaster.findOneAndUpdate(
      { name: food.name },  // Query: find by name
      food,                // Data to update/insert
      { 
        upsert: true,      // Create if doesn't exist
        new: true,         // Return updated document
        runValidators: true // Run schema validators
      }
    );

    // Check if this was an insert or update
    // Note: This is a simplified check - in production you might track this differently
    const existsBefore = await FoodMaster.countDocuments({ name: food.name });
    if (existsBefore > 1) {
      // This was an update (document existed)
      updatedCount++;
    } else {
      // This was an insert
      insertedCount++;
    }
  }

  // Get total count
  const totalCount = await FoodMaster.countDocuments();

  return {
    insertedCount,
    updatedCount,
    totalCount
  };
}
importFoods();
