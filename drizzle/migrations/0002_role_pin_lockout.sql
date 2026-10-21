ALTER TABLE public.role_pins ADD COLUMN failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.role_pins ADD COLUMN locked_until timestamptz;