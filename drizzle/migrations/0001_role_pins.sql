CREATE TABLE public.role_pins (
  role text PRIMARY KEY,
  pin_hash text NOT NULL,
  salt text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.role_pins TO service_role;
ALTER TABLE public.role_pins ENABLE ROW LEVEL SECURITY;