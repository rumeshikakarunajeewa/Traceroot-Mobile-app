# TraceRoot Database

This directory contains the database schema, migrations, RLS (Row Level Security) policies, and database triggers for PostgreSQL / Supabase.

## Structure

```text
database/
├── config.toml           # Supabase project configuration
└── migrations/           # Versioned SQL migrations (001 - 018)
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_storage_buckets.sql
    ├── 005_auth_trigger.sql
    ├── 006_update_farming_journey_stages.sql
    ├── 007_schema_extensions_and_orders.sql
    ├── 008_supplier_buyback_and_activities.sql
    ├── 009_admin_verification_and_governance.sql
    ├── 010_immutability_and_security.sql
    ├── 011_rls_and_performance_indexes.sql
    ├── 012_buyer_profile_schema_safeguard.sql
    ├── 013_fix_profiles_infinite_recursion.sql
    ├── 014_supplier_profile_schema_safeguard.sql
    ├── 015_buyer_avatar_and_storage_safeguard.sql
    ├── 016_buyer_real_location_safeguard.sql
    ├── 017_order_placement_and_inventory.sql
    └── 018_admin_audit_and_oversight.sql
```

## Applying Migrations

To apply pending migrations to your remote Supabase PostgreSQL database:

```bash
# Push migrations to linked project
supabase db push

# Or apply manually using the Supabase SQL Editor in the Dashboard
```
