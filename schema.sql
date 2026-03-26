-- ============================================================
-- SafeWalk — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- PROFILES
-- Extended user data linked to auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  role          TEXT         NOT NULL DEFAULT 'user'   CHECK (role IN ('user', 'guardian', 'admin')),
  is_guardian   BOOLEAN      NOT NULL DEFAULT FALSE,
  aura_score    INTEGER      NOT NULL DEFAULT 0,
  aura_level    TEXT         NOT NULL DEFAULT 'New'
                             CHECK (aura_level IN ('New', 'Trusted', 'High', 'Very High', 'Elite')),
  patrol_active BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- "Mark Unsafe" events from users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- PostGIS geography for accurate distance queries
  location      GEOGRAPHY(POINT, 4326) NOT NULL,
  -- Convenience columns for fast reads
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  severity      TEXT         NOT NULL DEFAULT 'moderate'
                             CHECK (severity IN ('low', 'moderate', 'high', 'sos')),
  description   TEXT,
  is_resolved   BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Spatial index for proximity queries
CREATE INDEX IF NOT EXISTS reports_location_idx
  ON public.reports USING GIST (location);

-- Time-based index for heat map queries
CREATE INDEX IF NOT EXISTS reports_created_at_idx
  ON public.reports (created_at DESC);

-- ============================================================
-- GUARDIAN_RESPONSES
-- Tracks when a guardian acknowledges a nudge
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guardian_responses (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     UUID         NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  guardian_id   UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT         NOT NULL DEFAULT 'notified'
                             CHECK (status IN ('notified', 'acknowledged', 'on_way', 'arrived', 'dismissed')),
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, guardian_id)
);

-- ============================================================
-- GUARDIAN LOCATIONS
-- Real-time patrol positions (updated frequently)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guardian_locations (
  guardian_id   UUID         PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  location      GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  heading       DOUBLE PRECISION,  -- compass bearing 0-360
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guardian_locations_idx
  ON public.guardian_locations USING GIST (location);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Find guardians within X meters of a point
CREATE OR REPLACE FUNCTION public.find_nearby_guardians(
  lat    DOUBLE PRECISION,
  lon    DOUBLE PRECISION,
  radius INTEGER DEFAULT 1000  -- metres
)
RETURNS TABLE (
  guardian_id   UUID,
  display_name  TEXT,
  aura_level    TEXT,
  distance_m    DOUBLE PRECISION,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id             AS guardian_id,
    p.display_name,
    p.aura_level,
    ST_Distance(
      gl.location::geometry,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geometry
    ) * 111139          AS distance_m,
    gl.latitude,
    gl.longitude
  FROM public.guardian_locations gl
  JOIN public.profiles p ON p.id = gl.guardian_id
  WHERE
    p.patrol_active = TRUE
    AND ST_DWithin(
      gl.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      radius
    )
  ORDER BY distance_m ASC
$$;

-- Recalculate aura level from score
CREATE OR REPLACE FUNCTION public.update_aura_level()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.aura_level := CASE
    WHEN NEW.aura_score >= 500  THEN 'Elite'
    WHEN NEW.aura_score >= 200  THEN 'Very High'
    WHEN NEW.aura_score >= 100  THEN 'High'
    WHEN NEW.aura_score >= 25   THEN 'Trusted'
    ELSE 'New'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER aura_level_sync
  BEFORE UPDATE OF aura_score ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_aura_level();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_locations ENABLE ROW LEVEL SECURITY;

-- Profiles: users see all, edit own
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Reports: everyone reads; authenticated users insert
CREATE POLICY "reports_select_all"   ON public.reports FOR SELECT USING (TRUE);
CREATE POLICY "reports_insert_auth"  ON public.reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Guardian locations: guardians manage own
CREATE POLICY "gl_select_all"        ON public.guardian_locations FOR SELECT USING (TRUE);
CREATE POLICY "gl_upsert_own"        ON public.guardian_locations FOR ALL
  USING (auth.uid() = guardian_id);

-- Guardian responses: guardians manage own
CREATE POLICY "gr_select_all"        ON public.guardian_responses FOR SELECT USING (TRUE);
CREATE POLICY "gr_upsert_own"        ON public.guardian_responses FOR ALL
  USING (auth.uid() = guardian_id);

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- Enable Realtime on key tables in Supabase Dashboard:
--   Table Editor → reports → Enable Realtime
--   Table Editor → guardian_locations → Enable Realtime
--   Table Editor → guardian_responses → Enable Realtime
-- ============================================================
