import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const { profile, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, students: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          profiles:student_id (
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);

      const today = new Date().toDateString();
      const todayLogs = (data || []).filter(
        (l) => new Date(l.created_at).toDateString() === today
      );
      const uniqueStudents = new Set((data || []).map((l) => l.student_id));

      setStats({
        total: (data || []).length,
        today: todayLogs.length,
        students: uniqueStudents.size,
      });
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (logId) => {
    if (!isAdmin) return;
    if (!confirm('هل أنت متأكد من حذف سجل الحضور هذا نهائياً؟')) return;

    try {
      const { error } = await supabase
        .from('attendance_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      setMessage({ type: 'success', text: 'تم حذف السجل بنجاح' });
      fetchLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.profiles?.full_name?.toLowerCase().includes(term) ||
      log.profiles?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-10" dir="rtl" style={{ textAlign: 'right' }}>
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative mb-12">
        <div className="absolute top-0 right-0 w-2 h-full bg-[#102a43]"></div>
        <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="text-3xl font-black text-[#102a43] mb-2 tracking-tight">
              {isAdmin ? 'لوحة تحكم مدير النظام' : 'لوحة تحكم عضو هيئة التدريس'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isAdmin ? 'إدارة شاملة لسجلات حضور الطلاب في النظام الجامعي' : 'متابعة سجلات حضور الطلاب للمحاضرات'}
            </p>
          </div>
          <button 
            onClick={fetchLogs} 
            className="flex items-center justify-center gap-2 bg-[#f0f4f8] hover:bg-[#d9e2ec] text-[#102a43] px-6 py-3 rounded-lg font-bold border border-[#bcccdc] transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* 2. Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 border-t-4 border-t-[#486581]">
          <h3 className="text-gray-500 font-bold mb-4 text-lg">سجلات حضور اليوم</h3>
          <div className="text-6xl font-black text-[#102a43]">{loading ? '-' : stats.today}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 border-t-4 border-t-[#d99a0b]">
          <h3 className="text-gray-500 font-bold mb-4 text-lg">الطلاب المسجلين لحضور</h3>
          <div className="text-6xl font-black text-[#102a43]">{loading ? '-' : stats.students}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 border-t-4 border-t-[#102a43]">
          <h3 className="text-gray-500 font-bold mb-4 text-lg">إجمالي الحركات في النظام</h3>
          <div className="text-6xl font-black text-[#102a43]">{loading ? '-' : stats.total}</div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg font-bold border ${message.type === 'success' ? 'bg-[#edf7ed] text-[#1e6f3e] border-[#c6e7c6]' : 'bg-[#fdecea] text-[#9b1c1c] border-[#f5c6cb]'}`}>
          {message.text}
        </div>
      )}

      {/* 3. Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="p-8 border-b border-gray-200 bg-[#f8f9fa] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h2 className="text-xl font-bold text-[#102a43] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#486581]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            سجل الحضور الشامل
          </h2>
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              className="w-full pl-4 pr-12 py-3 rounded-lg border-2 border-gray-200 focus:border-[#102a43] outline-none transition-colors"
              placeholder="البحث بالاسم أو البريد الجامعي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#102a43] rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-lg">جاري تحميل السجلات...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-24 bg-white">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد سجلات</h3>
            <p className="text-gray-500">لم يتم العثور على أية بيانات تطابق بحثك الحالي.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#f0f4f8] border-b-2 border-gray-200">
                  <th className="px-6 py-4 font-bold text-[#334e68] uppercase tracking-wider text-sm">الطالب</th>
                  <th className="px-6 py-4 font-bold text-[#334e68] uppercase tracking-wider text-sm">البريد الجامعي</th>
                  <th className="px-6 py-4 font-bold text-[#334e68] uppercase tracking-wider text-sm text-center">صور التحقق</th>
                  <th className="px-6 py-4 font-bold text-[#334e68] uppercase tracking-wider text-sm">وقت التسجيل</th>
                  {isAdmin && <th className="px-6 py-4 font-bold text-[#334e68] uppercase tracking-wider text-sm text-center">حذف</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="font-bold text-[#102a43] text-base">
                        {log.profiles?.full_name || 'طالب غير معروف'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-gray-600 font-mono text-sm bg-gray-100 px-3 py-1 rounded-md inline-block border border-gray-200" dir="ltr">
                        {log.profiles?.email}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-3">
                        <img
                          src={log.image_1_url}
                          alt="Selfie 1"
                          className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200 cursor-pointer hover:border-[#102a43] shadow-sm transition-all hover:scale-105"
                          onClick={() => setSelectedImage(log.image_1_url)}
                          loading="lazy"
                        />
                        <img
                          src={log.image_2_url}
                          alt="Selfie 2"
                          className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200 cursor-pointer hover:border-[#102a43] shadow-sm transition-all hover:scale-105"
                          onClick={() => setSelectedImage(log.image_2_url)}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-[#243b53] bg-[#e0e7ff] px-3 py-1.5 rounded-md inline-block border border-[#c7d2fe]" dir="ltr">
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-[#e12d39] bg-[#fdecea] hover:bg-[#e12d39] hover:text-white p-2.5 rounded-lg transition-colors border border-[#f5c6cb]"
                          title="حذف هذا السجل نهائياً"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="bg-[#f0f4f8] p-4 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-[#486581]">
          <span>العدد الإجمالي المعروض:</span>
          <span className="bg-[#102a43] text-white px-4 py-1 rounded-full">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Lightbox for viewing images clearly */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#102a43]/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white p-3 rounded-2xl shadow-2xl animate-[slide-up_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-4 pt-2">
              <h4 className="font-bold text-xl text-[#102a43]">معاينة الصورة</h4>
              <button
                className="bg-gray-100 hover:bg-[#e12d39] text-gray-600 hover:text-white p-2 rounded-full transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-xl border border-gray-200 object-contain max-h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
