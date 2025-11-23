-- Migration: Create orders table
-- Run this file to set up the database schema for the order execution system

-- Create database 
CREATE DATABASE orders;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dex_used TEXT,
  executed_price DOUBLE PRECISION,
  tx_hash TEXT,
  fail_reason TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash) WHERE tx_hash IS NOT NULL;


