
-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#e50914',
  icon TEXT NOT NULL DEFAULT '📚',
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  invite_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classroom_students table
CREATE TABLE public.classroom_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

-- RLS for classrooms
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own classrooms" ON public.classrooms FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create classrooms" ON public.classrooms FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own classrooms" ON public.classrooms FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their own classrooms" ON public.classrooms FOR DELETE USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view classrooms they belong to" ON public.classrooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classroom_students WHERE classroom_id = id AND user_id = auth.uid())
);

-- RLS for classroom_students
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own enrollments" ON public.classroom_students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can join classrooms" ON public.classroom_students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view students in their classrooms" ON public.classroom_students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teachers can remove students from their classrooms" ON public.classroom_students FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);
