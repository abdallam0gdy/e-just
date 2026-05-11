import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('eduattend-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('eduattend-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setDark(!dark)}
      className="relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        background: dark
          ? 'linear-gradient(135deg, #1a1a3e, #312e81)'
          : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        boxShadow: dark
          ? '0 0 15px rgba(99, 102, 241, 0.3), inset 0 2px 4px rgba(0,0,0,0.3)'
          : '0 0 15px rgba(251, 191, 36, 0.3), inset 0 2px 4px rgba(0,0,0,0.1)',
      }}
      aria-label={dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
    >
      {/* Toggle Circle */}
      <span
        className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all duration-300"
        style={{
          left: dark ? '34px' : '4px',
          background: dark ? '#0f0f23' : '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
