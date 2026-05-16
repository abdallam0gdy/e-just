import { Outlet } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const { dir } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-navy-50 w-full" dir={dir}>
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
