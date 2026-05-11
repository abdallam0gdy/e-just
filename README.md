# EduAttend System - نظام تسجيل الحضور الإلكتروني

نظام متكامل لتسجيل حضور الطلاب للجامعة المصرية اليابانية للعلوم والتكنولوجيا (E-JUST)، باستخدام التحقق عبر الصور (Selfie Verification) والمصادقة الآمنة.

## 🚀 المميزات الأساسية (Features)
- **تسجيل دخول آمن:** نظام Role-based Access Control (أدمن، دكتور، طالب).
- **التقاط صور حية:** التحقق من الحضور عبر الكاميرا (Live Camera) مع منع رفع صور قديمة.
- **تخزين سحابي:** رفع الصور على ImgBB لتوفير مساحة قواعد البيانات.
- **إدارة الحضور:** لوحة تحكم متكاملة لمدير النظام لمتابعة وتصفية سجلات الحضور.
- **تصميم تفاعلي:** واجهات مستخدم احترافية تدعم اللغة العربية (RTL) ومتوافقة مع جميع الشاشات.

## 🛠️ التقنيات المستخدمة (Tech Stack)
- **Frontend:** React.js (Vite), Tailwind CSS v4, React Router
- **Backend/Database:** Supabase (PostgreSQL, Auth, RLS Policies)
- **Image Hosting:** ImgBB API
- **Deployment:** Cloudflare Pages

## 📦 خطوات التشغيل المحلي (Local Setup)
1. قم بتثبيت الاعتمادات:
   ```bash
   npm install
   ```
2. قم بإنشاء ملف `.env` ونسخ محتويات `.env.example` إليه، ثم أضف مفاتيح الـ API الخاصة بك:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_IMGBB_API_KEY=your_imgbb_api_key
   ```
3. تشغيل خادم التطوير:
   ```bash
   npm run dev
   ```

## 🌐 النشر (Deployment on Cloudflare Pages)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- تم إضافة ملف `public/_redirects` لضمان عمل الـ React Router بشكل صحيح على Cloudflare.

---
*تم التطوير كجزء من نظام جامعة E-JUST.*
