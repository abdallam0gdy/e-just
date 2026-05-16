-- =============================================
-- EduAttend - Lectures System Migration
-- نظام إدارة المحاضرات
-- =============================================

-- 1. جدول المحاضرات
CREATE TABLE IF NOT EXISTS public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- اسم المحاضرة (مثل: فيزياء 101 - محاضرة 3)
  description TEXT DEFAULT '',        -- وصف اختياري
  lecture_date DATE NOT NULL,         -- تاريخ المحاضرة
  start_time TIME NOT NULL,           -- وقت البداية
  end_time TIME NOT NULL,             -- وقت النهاية
  is_recurring BOOLEAN DEFAULT false, -- هل تتكرر أسبوعياً
  recurring_day INTEGER,              -- يوم التكرار (0=أحد, 1=اثنين, ..., 6=سبت)
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. إضافة عمود lecture_id لجدول الحضور (يقبل NULL للسجلات القديمة)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_logs' AND column_name = 'lecture_id'
  ) THEN
    ALTER TABLE public.attendance_logs 
      ADD COLUMN lecture_id UUID REFERENCES public.lectures(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. منع الطالب من تسجيل حضور مرتين لنفس المحاضرة
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance_per_lecture 
  ON public.attendance_logs(student_id, lecture_id) 
  WHERE lecture_id IS NOT NULL;

-- 4. Indexes لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_lectures_date ON public.lectures(lecture_date DESC);
CREATE INDEX IF NOT EXISTS idx_lectures_active ON public.lectures(is_active);
CREATE INDEX IF NOT EXISTS idx_lectures_created_by ON public.lectures(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_lecture ON public.attendance_logs(lecture_id);

-- =============================================
-- دالة لجلب المحاضرات النشطة الآن (بوقت السيرفر)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_lectures_now()
RETURNS SETOF public.lectures AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.lectures
  WHERE is_active = true
    AND lecture_date = (now() AT TIME ZONE 'Africa/Cairo')::DATE
    AND start_time <= (now() AT TIME ZONE 'Africa/Cairo')::TIME
    AND end_time >= (now() AT TIME ZONE 'Africa/Cairo')::TIME;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- دالة لجلب كل محاضرات اليوم (بوقت السيرفر)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_today_lectures()
RETURNS SETOF public.lectures AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.lectures
  WHERE is_active = true
    AND lecture_date = (now() AT TIME ZONE 'Africa/Cairo')::DATE
  ORDER BY start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- دالة لجلب وقت السيرفر (UTC-aware timestamp)
-- ملاحظة: تحويل التوقيت لمصر يتم في الفرونت اند
-- =============================================
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- دالة مساعدة: هل المستخدم أدمن أو دكتور
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin_or_doctor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'doctor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS لجدول lectures
-- =============================================
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- الكل يقدر يشوف المحاضرات النشطة
CREATE POLICY "Anyone can view active lectures"
  ON public.lectures FOR SELECT
  USING (true);

-- الأدمن والدكتور يقدروا يضيفوا محاضرات
CREATE POLICY "Admin and Doctor can insert lectures"
  ON public.lectures FOR INSERT
  WITH CHECK (public.is_admin_or_doctor());

-- الأدمن والدكتور يقدروا يعدلوا محاضرات
CREATE POLICY "Admin and Doctor can update lectures"
  ON public.lectures FOR UPDATE
  USING (public.is_admin_or_doctor())
  WITH CHECK (public.is_admin_or_doctor());

-- الأدمن والدكتور يقدروا يمسحوا محاضرات
CREATE POLICY "Admin and Doctor can delete lectures"
  ON public.lectures FOR DELETE
  USING (public.is_admin_or_doctor());

-- =============================================
-- دالة لتوليد المحاضرات المتكررة أسبوعياً
-- بتولد محاضرات للأسابيع الـ 4 الجاية
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_recurring_lectures()
RETURNS void AS $$
DECLARE
  rec RECORD;
  next_date DATE;
  i INTEGER;
BEGIN
  FOR rec IN 
    SELECT * FROM public.lectures 
    WHERE is_recurring = true AND is_active = true
  LOOP
    FOR i IN 1..4 LOOP
      -- حساب التاريخ القادم لنفس اليوم في الأسبوع
      next_date := rec.lecture_date + (i * 7);
      
      -- تأكد إن المحاضرة مش موجودة بالفعل
      IF NOT EXISTS (
        SELECT 1 FROM public.lectures 
        WHERE title = rec.title 
          AND lecture_date = next_date
          AND start_time = rec.start_time
      ) THEN
        INSERT INTO public.lectures (title, description, lecture_date, start_time, end_time, is_recurring, recurring_day, created_by, is_active)
        VALUES (rec.title, rec.description, next_date, rec.start_time, rec.end_time, false, rec.recurring_day, rec.created_by, true);
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
