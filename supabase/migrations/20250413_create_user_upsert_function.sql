
-- Create a SQL function to safely upsert user data
CREATE OR REPLACE FUNCTION public.upsert_user_data(
  p_id uuid,
  p_discord_id text,
  p_discord_username text,
  p_email text,
  p_discriminator text,
  p_avatar text,
  p_access_token text,
  p_refresh_token text,
  p_token_expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create or update user record
  INSERT INTO public.users (
    id, 
    discord_id,
    discord_username,
    email,
    discriminator,
    avatar,
    access_token,
    refresh_token,
    token_expires_at
  ) VALUES (
    p_id,
    p_discord_id,
    p_discord_username,
    p_email,
    p_discriminator,
    p_avatar,
    p_access_token,
    p_refresh_token,
    p_token_expires_at
  )
  ON CONFLICT (discord_id)
  DO UPDATE SET
    discord_username = p_discord_username,
    email = p_email,
    discriminator = p_discriminator,
    avatar = p_avatar,
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    token_expires_at = p_token_expires_at,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_user_data TO authenticated;
