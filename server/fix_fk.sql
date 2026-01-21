
-- Drop the existing foreign key constraint (referencing auth.users)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Add a new foreign key constraint referencing public.users
ALTER TABLE notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
