import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-right w-full overflow-x-hidden">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
