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
    <header className="bg-white border-b-2 border-navy-100 shadow-sm sticky top-0 z-50 w-full" dir="rtl">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 w-full">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo and University Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/logo.png" 
              alt="E-JUST Logo" 
              className="h-10 sm:h-14 object-contain"
            />
            <div className="hidden sm:block border-r-2 border-navy-200 pr-4">
              <h1 className="text-base sm:text-lg font-bold text-navy-900 leading-tight">الجامعة المصرية اليابانية</h1>
              <h2 className="text-xs sm:text-sm font-semibold text-navy-500">للعلوم والتكنولوجيا</h2>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && profile && (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-sm font-bold text-navy-900">{profile.full_name}</p>
                  <p className="text-xs text-navy-400 font-medium" dir="ltr">{user.email}</p>
                </div>
                
                <span className="bg-navy-900 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold hidden sm:inline-flex">
                  {roleLabels[profile.role] || 'مستخدم'}
                </span>

                <button
                  onClick={handleSignOut}
                  className="bg-navy-50 text-navy-800 border border-navy-200 hover:bg-navy-900 hover:text-white hover:border-navy-900 py-1.5 px-4 sm:py-2 sm:px-5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap"
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
