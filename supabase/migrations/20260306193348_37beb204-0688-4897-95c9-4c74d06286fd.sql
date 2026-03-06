
-- Drop existing recursive policies
DROP POLICY IF EXISTS "Teachers can CRUD own classrooms" ON classrooms;
DROP POLICY IF EXISTS "Students can read enrolled classrooms" ON classrooms;
DROP POLICY IF EXISTS "Teachers can manage students in their classrooms" ON classroom_students;
DROP POLICY IF EXISTS "Students can join classrooms" ON classroom_students;
DROP POLICY IF EXISTS "Students can read own enrollments" ON classroom_students;

-- Recreate classrooms policies as PERMISSIVE
CREATE POLICY "Teachers can select own classrooms"
  ON classrooms FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own classrooms"
  ON classrooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own classrooms"
  ON classrooms FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own classrooms"
  ON classrooms FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can read enrolled classrooms"
  ON classrooms FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classroom_students
    WHERE classroom_students.classroom_id = classrooms.id
    AND classroom_students.user_id = auth.uid()
  ));

-- Recreate classroom_students policies as PERMISSIVE
CREATE POLICY "Students can join classrooms"
  ON classroom_students FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can read own enrollments"
  ON classroom_students FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Use security definer function to avoid recursion for teacher managing students
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_classroom_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classrooms
    WHERE id = _classroom_id AND teacher_id = _user_id
  )
$$;

CREATE POLICY "Teachers can manage students in their classrooms"
  ON classroom_students FOR ALL TO authenticated
  USING (public.is_classroom_teacher(classroom_id, auth.uid()));
