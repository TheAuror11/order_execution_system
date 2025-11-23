# Database Migrations

This directory contains database migration files for setting up the order execution system schema.

## Quick Start

### 1: Using npm script (Recommended)

```bash
npm run migrate
```

## Prerequisites

1. **PostgreSQL must be running** on your system
2. **Database must exist** - Create it manually if needed:
   ```sql
   CREATE DATABASE orders;
   ```
3. **Environment variables** must be set in `.env`:
   ```
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_password
   PGDATABASE=orders
   ```

## What Gets Created

The migration creates:

- `orders` table with all required columns
- Indexes on `user_id`, `status`, `created_at`, and `tx_hash` for performance
- Table and column comments for documentation

## Manual Setup

If you prefer to run SQL manually:

1. Connect to PostgreSQL:

   ```bash
   psql -U postgres
   ```

2. Create database (if needed):

   ```sql
   CREATE DATABASE orders;
   \c orders
   ```

3. Run the migration file:
   ```sql
   \i migrations/001_create_orders_table.sql
   ```

## Verification

After running the migration, verify the table was created:

```sql
\c orders
\d orders
```

You should see the `orders` table with all columns and indexes.
