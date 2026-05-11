import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const roleLabels = {
  admin: 'مدير النظام',
  doctor: 'عضو هيئة التدريس',
  student: 'طالب',
};

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 w-full" dir="rtl">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 w-full">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo and University Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/logo.png" 
              alt="E-JUST Logo" 
              className="h-12 sm:h-16 object-contain"
            />
            <div className="hidden sm:block border-r-2 border-gray-300 pr-4">
              <h1 className="text-lg sm:text-xl font-bold text-[#102a43] leading-tight">الجامعة المصرية اليابانية</h1>
              <h2 className="text-xs sm:text-sm font-semibold text-[#486581]">للعلوم والتكنولوجيا</h2>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user && profile && (
              <>
                <div className="hidden md:block text-left" dir="ltr">
                  <p className="text-sm font-bold text-[#102a43] text-right">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 text-right">{user.email}</p>
                </div>
                
                <span className="bg-[#102a43] text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold hidden sm:inline-flex">
                  {roleLabels[profile.role] || 'مستخدم'}
                </span>

                <button
                  onClick={handleSignOut}
                  className="bg-white text-[#102a43] border-2 border-[#e2e8f0] hover:border-[#102a43] hover:bg-[#f0f4f8] py-1.5 px-4 sm:py-2 sm:px-6 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
                >
                  تسجيل الخروج
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
