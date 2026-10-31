-- ══════════════════════════════════════════════════════════════════════════
-- Bug report loop (2026-10-31)
-- ══════════════════════════════════════════════════════════════════════════
-- Backs the admin page's bug triage and the "we fixed it" email.
--
-- Closes a hole: the open-report UPDATE policy let anyone, signed in or not,
-- overwrite any report that was still 'open'. Updates now go through nobody
-- on the client; only the service role (which bypasses grants) may change a
-- report.
--
-- Submit goes through submit_bug_report(): an insert that, on a repeated
-- report_id, does nothing and returns the existing row's id (a retry from the
-- offline queue is safe and cannot rewrite the original). user_id is stored
-- only when it matches the caller, so nobody can file a report as someone
-- else. The table's own length CHECKs still apply.
--
-- Older clients in the wild send an upsert (INSERT ... ON CONFLICT DO
-- UPDATE). That needs UPDATE, which is revoked, so every upsert from them is
-- denied, new report or not. Their queue keeps the report as a retryable
-- failure; once the app updates, the new client drains that same queue
-- through submit_bug_report(), so nothing is lost, only delayed.
-- A plain direct INSERT stays allowed, under a tightened policy: a client may
-- only insert an open, unstamped report, with user_id empty or equal to its
-- own id. So nobody can file as someone else or pre-set the "told them" stamp.
--
-- fixed_notified_at: stamped by the server when the reporter has been told
-- the fix shipped. Clients cannot set it: UPDATE is revoked and the insert
-- policy requires it to be empty.
--
-- Apply: Supabase Dashboard → SQL Editor. Run once (safe to re-run).
-- ══════════════════════════════════════════════════════════════════════════

do $guard$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'is_admin() not found — apply Phase C′ migration first.';
  end if;
  if to_regclass('public.user_bug_reports') is null then
    raise exception 'user_bug_reports not found — apply 20260718_user_bug_reports first.';
  end if;
end$guard$;

ALTER TABLE public.user_bug_reports ADD COLUMN IF NOT EXISTS fixed_notified_at timestamptz;

DROP POLICY IF EXISTS user_bug_reports_update_own_open ON public.user_bug_reports;
REVOKE UPDATE ON public.user_bug_reports FROM anon, authenticated;

DROP POLICY IF EXISTS user_bug_reports_insert ON public.user_bug_reports;
CREATE POLICY user_bug_reports_insert ON public.user_bug_reports
  FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND fixed_notified_at IS NULL AND status = 'open');

CREATE OR REPLACE FUNCTION public.submit_bug_report(
  p_report_id   text,
  p_title       text,
  p_description text,
  p_steps       text,
  p_body        text,
  p_context     jsonb,
  p_user_id     uuid
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO public.user_bug_reports (report_id, title, description, steps, body, context, user_id)
  VALUES (
    p_report_id, p_title, p_description, p_steps, p_body, p_context,
    CASE WHEN p_user_id IS NOT NULL AND p_user_id = auth.uid() THEN p_user_id ELSE NULL END
  )
  ON CONFLICT (report_id) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.user_bug_reports WHERE report_id = p_report_id;
  END IF;
  RETURN v_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.submit_bug_report(text, text, text, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_bug_report(text, text, text, text, text, jsonb, uuid) TO anon, authenticated;

-- ROLLBACK: DROP POLICY IF EXISTS user_bug_reports_insert ON public.user_bug_reports; CREATE POLICY user_bug_reports_insert ON public.user_bug_reports FOR INSERT TO anon, authenticated WITH CHECK (true); DROP FUNCTION IF EXISTS public.submit_bug_report(text, text, text, text, text, jsonb, uuid); ALTER TABLE public.user_bug_reports DROP COLUMN IF EXISTS fixed_notified_at; GRANT UPDATE ON public.user_bug_reports TO anon, authenticated; DROP POLICY IF EXISTS user_bug_reports_update_own_open ON public.user_bug_reports; CREATE POLICY user_bug_reports_update_own_open ON public.user_bug_reports FOR UPDATE TO anon, authenticated USING (status = 'open') WITH CHECK (status = 'open');
