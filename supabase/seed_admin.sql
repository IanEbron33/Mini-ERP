-- =================================================================
-- CREATE INITIAL ADMIN USER FOR TESTING LOG IN
-- Execute this script in Supabase SQL Editor
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@minierp.com',
  crypt('AdminPassword123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jane Smith", "role": "Admin", "department": "Executive Management", "employee_id": "EMP-001"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@minierp.com'
);

