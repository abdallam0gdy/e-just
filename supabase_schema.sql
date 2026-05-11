-- =============================================
-- EduAttend - Database Schema (تحديث لحل مشكلة Infinite Recursion)
-- =============================================

-- 1. إنشاء جدول profiles (لو مش موجود)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'doctor', 'student')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. إنشاء جدول سجلات الحضور (لو مش موجود)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_1_url TEXT NOT NULL,
  image_2_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. تفعيل Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- دوال مساعدة (Security Definer) لحل مشكلة التكرار اللانهائي (Infinite Recursion)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- حذف الـ Policies القديمة (عشان لو كانت موجودة وتسببت في المشكلة)
-- =============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Students can insert their own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Students can view their own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Doctors can view all logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins can delete any log" ON public.attendance_logs;

-- =============================================
-- RLS Policies لجدول profiles
-- =============================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- استخدام الدوال الجديدة لحل مشكلة الـ Recursion
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Doctors can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_doctor());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS Policies لجدول attendance_logs
-- =============================================

CREATE POLICY "Students can insert their own attendance"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own logs"
  ON public.attendance_logs FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all logs"
  ON public.attendance_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Doctors can view all logs"
  ON public.attendance_logs FOR SELECT
  USING (public.is_doctor());

CREATE POLICY "Admins can delete any log"
  ON public.attendance_logs FOR DELETE
  USING (public.is_admin());

-- =============================================
-- Trigger لإنشاء بروفايل تلقائي
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف التريجر القديم قبل إنشاءه
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Indexes لتسريع الاستعلامات
-- =============================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON public.attendance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
