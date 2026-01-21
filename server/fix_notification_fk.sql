-- Drop the existing constraint that points to auth.users
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Add new constraint pointing to public.users
ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id)
ON DELETE CASCADE;
