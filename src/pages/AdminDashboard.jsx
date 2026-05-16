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
      const { error } = await supabase.from('attendance_logs').delete().eq('id', logId);
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
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
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
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1 h-full bg-navy-900 rounded-r-xl"></div>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-navy-900 mb-0.5">
              {isAdmin ? 'لوحة تحكم مدير النظام' : 'لوحة تحكم عضو هيئة التدريس'}
            </h1>
            <p className="text-navy-400 text-xs sm:text-sm">
              {isAdmin ? 'إدارة شاملة لسجلات حضور الطلاب' : 'متابعة سجلات حضور الطلاب'}
            </p>
          </div>
          <button 
            onClick={fetchLogs} 
            className="flex items-center gap-1.5 bg-navy-50 hover:bg-navy-100 text-navy-800 px-3 py-2 rounded-lg font-bold border border-navy-200 transition-colors text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5 border-t-3 border-t-navy-500 text-center">
          <h3 className="text-navy-400 font-bold mb-1 text-[10px] sm:text-xs">حضور اليوم</h3>
          <div className="text-2xl sm:text-4xl font-black text-navy-900">{loading ? '-' : stats.today}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5 border-t-3 border-t-gold-500 text-center">
          <h3 className="text-navy-400 font-bold mb-1 text-[10px] sm:text-xs">الطلاب</h3>
          <div className="text-2xl sm:text-4xl font-black text-navy-900">{loading ? '-' : stats.students}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5 border-t-3 border-t-navy-900 text-center">
          <h3 className="text-navy-400 font-bold mb-1 text-[10px] sm:text-xs">الإجمالي</h3>
          <div className="text-2xl sm:text-4xl font-black text-navy-900">{loading ? '-' : stats.total}</div>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg font-bold border text-xs ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-navy-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <h2 className="text-sm sm:text-base font-bold text-navy-900 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            سجل الحضور
          </h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="w-full pl-3 pr-8 py-1.5 sm:py-2 rounded-lg border border-navy-200 focus:border-navy-900 outline-none transition-colors text-xs sm:text-sm"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-2.5 top-2 sm:top-2.5 text-navy-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-navy-400">
            <div className="spinner !w-8 !h-8 mb-3"></div>
            <p className="font-bold text-xs">جاري التحميل...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-navy-900 mb-1">لا توجد سجلات</h3>
            <p className="text-navy-400 text-xs">لم يتم العثور على بيانات.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="px-3 sm:px-4 py-2.5 font-bold text-navy-600 text-[11px] sm:text-xs">الطالب</th>
                  <th className="px-3 sm:px-4 py-2.5 font-bold text-navy-600 text-[11px] sm:text-xs">البريد</th>
                  <th className="px-3 sm:px-4 py-2.5 font-bold text-navy-600 text-[11px] sm:text-xs text-center">الصور</th>
                  <th className="px-3 sm:px-4 py-2.5 font-bold text-navy-600 text-[11px] sm:text-xs">الوقت</th>
                  {isAdmin && <th className="px-3 sm:px-4 py-2.5 font-bold text-navy-600 text-[11px] sm:text-xs text-center">حذف</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                      <span className="font-bold text-navy-900 text-xs sm:text-sm">
                        {log.profiles?.full_name || 'غير معروف'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                      <span className="text-navy-500 font-mono text-[10px] sm:text-xs bg-navy-50 px-1.5 py-0.5 rounded border border-navy-100" dir="ltr">
                        {log.profiles?.email}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <div className="flex justify-center gap-1.5">
                        <img src={log.image_1_url} alt="1" className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover border border-gray-200 cursor-pointer hover:border-navy-900 shadow-sm transition-all" onClick={() => setSelectedImage(log.image_1_url)} loading="lazy" />
                        <img src={log.image_2_url} alt="2" className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover border border-gray-200 cursor-pointer hover:border-navy-900 shadow-sm transition-all" onClick={() => setSelectedImage(log.image_2_url)} loading="lazy" />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <span className="text-[10px] sm:text-xs font-bold text-navy-700 bg-navy-50 px-1.5 py-1 rounded border border-navy-100" dir="ltr">
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 sm:px-4 py-2.5 text-center">
                        <button onClick={() => deleteLog(log.id)} className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-colors border border-red-200" title="حذف">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="bg-navy-50 px-3 sm:px-4 py-2 border-t border-navy-100 flex justify-between items-center text-xs font-bold text-navy-500">
          <span>المعروض:</span>
          <span className="bg-navy-900 text-white px-2 py-0.5 rounded-full text-[10px]">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-navy-900/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-lg w-full bg-white p-2 rounded-xl shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 px-2 pt-1">
              <h4 className="font-bold text-sm text-navy-900">معاينة الصورة</h4>
              <button className="bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white p-1.5 rounded-full transition-colors" onClick={() => setSelectedImage(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img src={selectedImage} alt="Preview" className="w-full h-auto rounded-lg border border-gray-200 object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
