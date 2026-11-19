# TraceRoot Backend

This directory houses the backend serverless edge functions and APIs powering the TraceRoot platform.

## Structure

```text
backend/
└── functions/
    ├── send-notification/     # Push notification delivery via Expo API
    ├── sync-offline-records/  # Offline record synchronization & conflict resolution
    └── verify-live-capture/   # Cryptographic & integrity verification for farm records
```

## Deployment

Deploy edge functions directly to Supabase using the Supabase CLI:

```bash
# Deploy a single function
supabase functions deploy <function-name> --project-ref <project-ref>

# Example
supabase functions deploy send-notification
supabase functions deploy sync-offline-records
supabase functions deploy verify-live-capture
```

## Local Development & Testing

```bash
# Serve all functions locally
supabase functions serve
```
