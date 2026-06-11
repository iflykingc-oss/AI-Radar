-- AI Radar Database Schema
-- Migration 002: Add crawler provenance columns to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_mentions TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMPTZ;
