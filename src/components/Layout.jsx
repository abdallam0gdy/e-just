import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-50 w-full" dir="rtl">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
