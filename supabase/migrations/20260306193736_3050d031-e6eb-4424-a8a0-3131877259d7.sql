
-- Allow anyone authenticated to read a classroom by invite_code (needed for join flow)
CREATE POLICY "Anyone can read classrooms by invite code"
  ON classrooms FOR SELECT TO authenticated
  USING (invite_active = true);
