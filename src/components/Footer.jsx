export default function Footer() {
  return (
    <footer className="bg-[#102a43] text-white py-6 mt-auto w-full border-t-4 border-[#d99a0b]" dir="rtl">
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">الجامعة المصرية اليابانية للعلوم والتكنولوجيا</h3>
            <p className="text-gray-400 text-sm">نظام EduAttend لتسجيل الحضور الإلكتروني</p>
          </div>
          <div className="text-gray-400 text-sm" dir="ltr">
            &copy; {new Date().getFullYear()} E-JUST. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
