
DROP POLICY IF EXISTS "Students can read enrolled classrooms" ON classrooms;
DROP POLICY IF EXISTS "Anyone can read classrooms by invite code" ON classrooms;

CREATE POLICY "Students can read enrolled classrooms"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    auth.uid() = teacher_id
    OR
    EXISTS (
      SELECT 1 FROM classroom_students
      WHERE classroom_students.classroom_id = classrooms.id
      AND classroom_students.user_id = auth.uid()
    )
    OR
    invite_active = true
  );

DROP POLICY IF EXISTS "Students can read own enrollments" ON classroom_students;

CREATE POLICY "Students can read own enrollments"
  ON classroom_students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
