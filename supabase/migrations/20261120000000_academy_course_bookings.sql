CREATE TABLE IF NOT EXISTS academy_course_settings (
  course_slug text PRIMARY KEY,
  capacity integer NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_course_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name text NOT NULL,
  participant_email text NOT NULL,
  age integer NOT NULL CHECK (age >= 1 AND age <= 120),
  farming_interest text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_course_bookings_slug_status
  ON academy_course_bookings(course_slug, status);
CREATE INDEX IF NOT EXISTS idx_academy_course_bookings_email
  ON academy_course_bookings(participant_email);

ALTER TABLE academy_course_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_course_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_academy_course_settings" ON academy_course_settings;
CREATE POLICY "admin_manage_academy_course_settings"
  ON academy_course_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_manage_academy_course_bookings" ON academy_course_bookings;
CREATE POLICY "admin_manage_academy_course_bookings"
  ON academy_course_bookings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO academy_course_settings (course_slug, capacity)
VALUES
  ('farmer-for-a-day', 24),
  ('weekend-farming', 16),
  ('professional-farming', 12)
ON CONFLICT (course_slug) DO NOTHING;

CREATE OR REPLACE FUNCTION academy_course_availability(p_course_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'capacity', COALESCE((SELECT capacity FROM academy_course_settings s WHERE s.course_slug = p_course_slug), 0),
    'accepted', (SELECT count(*)::integer FROM academy_course_bookings b WHERE b.course_slug = p_course_slug AND b.status = 'accepted'),
    'pending', (SELECT count(*)::integer FROM academy_course_bookings b WHERE b.course_slug = p_course_slug AND b.status = 'pending'),
    'remaining', GREATEST(
      COALESCE((SELECT capacity FROM academy_course_settings s WHERE s.course_slug = p_course_slug), 0)
      - (SELECT count(*)::integer FROM academy_course_bookings b WHERE b.course_slug = p_course_slug AND b.status = 'accepted'),
      0
    )
  );
$$;

CREATE OR REPLACE FUNCTION submit_academy_course_booking(
  p_course_slug text,
  p_participant_name text,
  p_participant_email text,
  p_age integer,
  p_farming_interest text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_accepted integer;
  v_booking_id uuid;
BEGIN
  IF btrim(p_participant_name) = '' OR btrim(p_participant_email) = '' OR btrim(p_farming_interest) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'required_fields');
  END IF;
  IF p_age < 1 OR p_age > 120 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_age');
  END IF;

  SELECT capacity INTO v_capacity
  FROM academy_course_settings
  WHERE course_slug = p_course_slug;

  IF v_capacity IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'course_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM academy_course_bookings
    WHERE course_slug = p_course_slug
      AND lower(participant_email) = lower(btrim(p_participant_email))
      AND status IN ('pending', 'accepted')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate');
  END IF;

  SELECT count(*)::integer INTO v_accepted
  FROM academy_course_bookings
  WHERE course_slug = p_course_slug AND status = 'accepted';

  IF v_accepted >= v_capacity THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full');
  END IF;

  INSERT INTO academy_course_bookings (
    course_slug, user_id, participant_name, participant_email, age, farming_interest, status
  ) VALUES (
    p_course_slug, auth.uid(), btrim(p_participant_name), lower(btrim(p_participant_email)),
    p_age, btrim(p_farming_interest), 'pending'
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

REVOKE ALL ON FUNCTION academy_course_availability(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION submit_academy_course_booking(text, text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION academy_course_availability(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_academy_course_booking(text, text, text, integer, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION enforce_academy_course_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_accepted integer;
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'accepted') THEN
    SELECT capacity INTO v_capacity
    FROM academy_course_settings
    WHERE course_slug = NEW.course_slug;

    SELECT count(*)::integer INTO v_accepted
    FROM academy_course_bookings
    WHERE course_slug = NEW.course_slug AND status = 'accepted';

    IF v_capacity IS NULL OR v_accepted >= v_capacity THEN
      RAISE EXCEPTION 'course_capacity_reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_academy_course_capacity_trigger ON academy_course_bookings;
CREATE TRIGGER enforce_academy_course_capacity_trigger
  BEFORE INSERT OR UPDATE OF status, course_slug
  ON academy_course_bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_academy_course_capacity();
