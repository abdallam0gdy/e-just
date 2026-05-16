export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white py-4 sm:py-5 mt-auto w-full border-t-3 border-gold-500" dir="rtl">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-right gap-2 sm:gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base mb-0.5">الجامعة المصرية اليابانية للعلوم والتكنولوجيا</h3>
            <p className="text-navy-300 text-[11px] sm:text-xs">نظام EduAttend لتسجيل الحضور الإلكتروني</p>
          </div>
          <div className="text-navy-400 text-[11px] sm:text-xs" dir="ltr">
            &copy; {new Date().getFullYear()} E-JUST. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
