# Document Upload Fix - DR7 Empire

## Issue
Document uploads from the main website were not working due to:
1. Incorrect `busboy` import in the Netlify function
2. Missing environment variable configuration
3. Potentially missing Supabase RLS (Row Level Security) policies

## What Was Fixed

### 1. Updated `/netlify/functions/upload-file.ts`
- Fixed busboy import to use `import * as busboy from 'busboy'` and `busboy.default()`
- Hardcoded Supabase URL (already present in client code)
- Added better error logging
- Improved error messages for debugging

### 2. Environment Variables Required

You **MUST** set the following environment variable in your Netlify dashboard:

**Location**: Netlify Dashboard → Site Settings → Environment Variables

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get your Service Role Key:**
1. Go to <YOUR_SUPABASE_URL>/settings/api
2. Copy the "service_role" key (NOT the anon key)
3. Add it to Netlify environment variables

### 3. Supabase Storage Bucket RLS Policies

The SQL file `fix-storage-buckets-final.sql` contains all necessary RLS policies. Run this in your Supabase SQL Editor if uploads still fail:

**Location**: Supabase Dashboard → SQL Editor → New Query

Run the contents of `/fix-storage-buckets-final.sql`

This will:
- Drop all old conflicting policies
- Create proper INSERT, SELECT, UPDATE, DELETE policies for:
  - `carta-identita` bucket
  - `codice-fiscale` bucket
  - `driver-licenses` bucket
- Grant admin access to all buckets

## Testing the Fix

### Local Testing
```bash
# Make sure environment variables are set
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Start local dev server
npm run dev

# Test upload from the signup page
# Go to http://localhost:8888/signup
```

### After Deployment

1. **Deploy to Netlify:**
   ```bash
   git add .
   git commit -m "Fix document upload functionality"
   git push origin main
   ```

2. **Verify Environment Variable:**
   - Go to Netlify Dashboard
   - Navigate to: Site Settings → Environment Variables
   - Confirm `SUPABASE_SERVICE_ROLE_KEY` is set
   - If you just added it, trigger a new deployment

3. **Test Upload:**
   - Go to your live website
   - Complete signup process
   - Try uploading documents in the modal
   - Check browser console for any errors
   - Check Netlify function logs if issues persist

## Troubleshooting

### If uploads still fail:

1. **Check Netlify Function Logs:**
   - Netlify Dashboard → Functions → upload-file
   - Look for error messages

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors starting with "Upload error:"

3. **Verify Supabase Buckets Exist:**
   - Supabase Dashboard → Storage
   - Ensure these buckets exist:
     - `carta-identita`
     - `codice-fiscale`
     - `driver-licenses`

4. **Check RLS Policies:**
   ```sql
   -- Run in Supabase SQL Editor to see current policies
   SELECT policyname, cmd, tablename
   FROM pg_policies
   WHERE schemaname = 'storage'
   AND tablename = 'objects';
   ```

5. **Test Service Role Key:**
   ```bash
   # Test if the key works
   curl '<YOUR_SUPABASE_URL>/rest/v1/' \
     -H "apikey: YOUR_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Server configuration error - missing credentials" | Add `SUPABASE_SERVICE_ROLE_KEY` to Netlify env vars |
| "new row violates row-level security policy" | Run `fix-storage-buckets-final.sql` in Supabase |
| "The resource already exists" | Normal - file was uploaded, policy is working |
| "File too large (max 15MB)" | Reduce file size or increase MAX_FILE_SIZE in function |

## Files Modified
- `/netlify/functions/upload-file.ts` - Fixed busboy import and error handling

## Files to Reference
- `/fix-storage-buckets-final.sql` - RLS policies (run if needed)
- `/components/ui/DocumentUploadModal.tsx` - Frontend upload component
- `/pages/account/DocumentsVerification.tsx` - Document verification page
