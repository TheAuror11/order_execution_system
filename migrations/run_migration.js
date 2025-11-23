const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/*
Database Migration Runner
This script runs the SQL migration file to create the database schema.
Usage: npm run migrate
Make sure your .env file has the correct PostgreSQL credentials.
*/

//DB Configuration
const config = {
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || "orders",
};

//Function to run the migration
async function runMigration() {
  //Create a new pool connection to the database
  const pool = new Pool(config);

  try {
    console.log("Connecting to PostgreSQL...");

    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✓ Connected to PostgreSQL");

    // Read migration file
    const migrationPath = path.join(__dirname, "001_create_orders_table.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Remove comments and CREATE DATABASE statements
    const cleanSQL = migrationSQL
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("--");
      })
      .join("\n");

    console.log("Running migration: 001_create_orders_table.sql");

    // Execute migration
    await pool.query(cleanSQL);

    console.log("✓ Migration completed successfully!");
    console.log("✓ Orders table created with indexes");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

//Run the migration
runMigration();
