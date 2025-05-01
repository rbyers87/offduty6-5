/*
      # Initial Schema Setup for Vehicle Usage Forms

      1. New Tables
        - profiles
          - id (uuid, references auth.users)
          - full_name (text)
          - role (text)
          - badge_number (text)
          - created_at (timestamp)
          - updated_at (timestamp)
        
        - pdf_templates
          - id (uuid)
          - name (text)
          - file_url (text)
          - created_at (timestamp)
          - updated_at (timestamp)
        
        - pdf_fields
          - id (uuid)
          - template_id (uuid, references pdf_templates)
          - name (text)
          - type (text)
          - value (text)
          - x (numeric)
          - y (numeric)
          - width (numeric)
          - height (numeric)
          - page (integer)
          - created_at (timestamp)
          - updated_at (timestamp)

      2. Security
        - Enable RLS on all tables
        - Add policies for authenticated users based on their role
    */

    -- Create profiles table
    CREATE TABLE profiles (
      id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      full_name text,
      role text CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
      badge_number text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Create pdf_templates table
    CREATE TABLE pdf_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      file_url text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Create pdf_fields table
    CREATE TABLE pdf_fields (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id uuid REFERENCES pdf_templates ON DELETE CASCADE,
      name text NOT NULL,
      type text CHECK (type IN ('editable', 'prefilled')) NOT NULL,
      value text,
      x numeric NOT NULL,
      y numeric NOT NULL,
      width numeric NOT NULL,
      height numeric NOT NULL,
      page integer NOT NULL DEFAULT 1,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE pdf_fields ENABLE ROW LEVEL SECURITY;

    -- Profiles policies
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);

    -- PDF Templates policies
    CREATE POLICY "Anyone can view templates"
      ON pdf_templates FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Only admins can manage templates"
      ON pdf_templates FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Authenticated users can insert templates"
      ON pdf_templates FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- PDF Fields policies
    CREATE POLICY "Anyone can view fields"
      ON pdf_fields FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Only admins can manage fields"
      ON pdf_fields FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Authenticated users can insert fields"
      ON pdf_fields FOR INSERT
      TO authenticated
      WITH CHECK (
        template_id IS NULL OR EXISTS (
          SELECT 1 FROM pdf_templates
          WHERE pdf_templates.id = template_id
        )
      );

    -- Create a function to get profiles with email
    CREATE OR REPLACE FUNCTION get_profiles_with_email()
    RETURNS TABLE (
      id uuid,
      full_name text,
      role text,
      badge_number text,
      email text
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Grant read access to auth.users for this function
      GRANT SELECT ON auth.users TO authenticated;
      RETURN QUERY
      SELECT
        p.id,
        p.full_name,
        p.role,
        p.badge_number,
        u.email
      FROM profiles p
      INNER JOIN auth.users u ON p.id = u.id
      ORDER BY p.created_at DESC;
    END;
    $$;
