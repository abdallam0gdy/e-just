import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-50 text-right w-full" dir="rtl">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
