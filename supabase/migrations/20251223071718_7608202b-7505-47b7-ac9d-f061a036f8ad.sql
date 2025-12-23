-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium', 'pro');

-- Create profiles table (user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  subscription_plan subscription_plan DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  storage_used_mb DECIMAL(10, 2) DEFAULT 0,
  storage_limit_mb INTEGER DEFAULT 20,
  max_image_size_mb INTEGER DEFAULT 1,
  max_galleries INTEGER DEFAULT 3,
  max_images_per_gallery INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create galleries table
CREATE TABLE public.galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  unique_slug VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expiration_days INTEGER DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  cloudinary_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  file_size_mb DECIMAL(10, 2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_plans reference table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name subscription_plan UNIQUE NOT NULL,
  storage_limit_mb INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  max_galleries INTEGER NOT NULL,
  max_images_per_gallery INTEGER NOT NULL,
  max_image_size_mb INTEGER NOT NULL,
  max_expiration_days INTEGER NOT NULL,
  custom_expiration BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, storage_limit_mb, price_monthly, price_yearly, max_galleries, max_images_per_gallery, max_image_size_mb, max_expiration_days, custom_expiration)
VALUES
  ('free', 20, 0, 0, 3, 30, 1, 30, false),
  ('premium', 5120, 999, 9990, 50, 500, 50, 90, true),
  ('pro', 51200, 2599, 25990, 500, 5000, 50, 180, true);

-- Create indexes for performance
CREATE INDEX idx_galleries_slug ON public.galleries(unique_slug);
CREATE INDEX idx_galleries_user ON public.galleries(user_id);
CREATE INDEX idx_galleries_expires ON public.galleries(expires_at);
CREATE INDEX idx_images_gallery ON public.images(gallery_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Galleries RLS policies
CREATE POLICY "Users can view their own galleries"
ON public.galleries FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create galleries"
ON public.galleries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own galleries"
ON public.galleries FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own galleries"
ON public.galleries FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Public access for galleries (via slug, for clients)
CREATE POLICY "Anyone can view active galleries by slug"
ON public.galleries FOR SELECT
TO anon
USING (is_active = true AND expires_at > NOW());

-- Images RLS policies
CREATE POLICY "Users can view images in their galleries"
ON public.images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert images in their galleries"
ON public.images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images in their galleries"
ON public.images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Public access for images (when gallery is active)
CREATE POLICY "Anyone can view images in active galleries"
ON public.images FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.is_active = true
    AND galleries.expires_at > NOW()
  )
);

-- Subscription plans are readable by everyone
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated, anon
USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();