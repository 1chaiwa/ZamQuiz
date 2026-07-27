-- Users table (extends Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  grade TEXT,
  school TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grades table
CREATE TABLE public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES public.grades(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER DEFAULT 0,
  time_limit INTEGER, -- in minutes
  is_paid BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB, -- For multiple choice: {"A": "option1", "B": "option2", ...}
  correct_answer TEXT,
  marks INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id),
  quiz_id UUID REFERENCES public.quizzes(id),
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  wrong_answers INTEGER,
  time_taken INTEGER, -- in seconds
  is_paid BOOLEAN DEFAULT FALSE,
  payment_reference TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Student answers table
CREATE TABLE public.student_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id),
  selected_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  quiz_id UUID REFERENCES public.quizzes(id),
  amount DECIMAL(10,2),
  payment_method TEXT,
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Insert initial data
INSERT INTO public.grades (name, level) VALUES
  ('Form 1', 1),
  ('Form 2', 2),
  ('Form 3', 3),
  ('Grade 10', 10),
  ('Grade 11', 11),
  ('Grade 12', 12);

INSERT INTO public.subjects (name, code) VALUES
  ('ICT', 'ICT'),
  ('Mathematics', 'MATH'),
  ('English', 'ENG'),
  ('Chemistry', 'CHEM'),
  ('Biology', 'BIO'),
  ('Religious Education', 'RE'),
  ('Civic Education', 'CE'),
  ('Geography', 'GEO'),
  ('Business Studies', 'BS'),
  ('Social Studies', 'SS');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can read all profiles, insert/update their own
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Quizzes: Everyone can read active quizzes
CREATE POLICY "Everyone can read active quizzes" ON public.quizzes FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers can insert quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update own quizzes" ON public.quizzes FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own quizzes" ON public.quizzes FOR DELETE USING (teacher_id = auth.uid());

-- Questions: Everyone can read questions for active quizzes
CREATE POLICY "Everyone can read questions" ON public.questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_active = true));
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND teacher_id = auth.uid()));

-- Quiz attempts: Students can manage their own attempts
CREATE POLICY "Students can manage own attempts" ON public.quiz_attempts FOR ALL USING (student_id = auth.uid());

-- Student answers: Students can manage their own answers
CREATE POLICY "Students can manage own answers" ON public.student_answers FOR ALL USING (EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = attempt_id AND student_id = auth.uid()));

-- Payments: Users can read own payments
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX idx_quizzes_grade_id ON public.quizzes(grade_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_student_answers_attempt_id ON public.student_answers(attempt_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);