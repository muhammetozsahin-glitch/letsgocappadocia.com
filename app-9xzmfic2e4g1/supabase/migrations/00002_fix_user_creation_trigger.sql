-- Drop the confirmed trigger since verification is disabled
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Update the direct creation trigger to be more robust
CREATE OR REPLACE FUNCTION handle_new_user_direct()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_email text;
BEGIN
  -- Get current user count
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Use email from NEW, fallback to empty string if null
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
  
  -- Insert profile with ON CONFLICT to handle race conditions
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    user_email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth operation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_direct();
