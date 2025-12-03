-- Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status);
CREATE INDEX IF NOT EXISTS idx_user_documents_upload_date ON user_documents(upload_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON user_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" ON user_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents" ON user_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can update all documents (for verification)
CREATE POLICY "Admins can update all documents" ON user_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Create storage bucket for user documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-documents bucket
-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all user documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can delete documents
CREATE POLICY "Admins can delete user documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-documents'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
