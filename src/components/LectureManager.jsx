import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Timezone helpers: always use Cairo time regardless of browser timezone
const getCairoTimeHHMM = (date) =>
  date.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false });
const getCairoDateISO = (date) =>
  date.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // returns YYYY-MM-DD

// 12-hour time helpers
const to12hParts = (time24) => {
  if (!time24) return { hour: '9', minute: '00', period: 'AM' };
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr);
  return { hour: String(h % 12 || 12), minute: (mStr || '00').slice(0, 2), period: h >= 12 ? 'PM' : 'AM' };
};
const from12hTo24h = (hour, minute, period) => {
  let h = parseInt(hour);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute}`;
};
const formatTime12h = (time24, t) => {
  if (!time24) return '';
  const { hour, minute, period } = to12hParts(time24);
  return `${hour}:${minute} ${period === 'AM' ? t('am') : t('pm')}`;
};

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

/** 12-hour Time Picker Component */
function TimePicker12h({ value, onChange, label }) {
  const parts = to12hParts(value);
  const update = (field, val) => {
    const p = { ...parts, [field]: val };
    onChange(from12hTo24h(p.hour, p.minute, p.period));
  };
  return (
    <div>
      <label className="block text-[11px] font-bold text-navy-700 mb-1">{label}</label>
      <div className="flex items-center gap-1.5" dir="ltr">
        <select value={parts.hour} onChange={e => update('hour', e.target.value)}
          className="px-2 py-2 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm bg-white font-bold text-center appearance-none cursor-pointer">
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-navy-400 font-bold text-lg">:</span>
        <select value={parts.minute} onChange={e => update('minute', e.target.value)}
          className="px-2 py-2 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm bg-white font-bold text-center appearance-none cursor-pointer">
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => update('period', 'AM')}
            className={`px-2.5 py-2 text-[11px] font-bold transition-colors ${parts.period === 'AM' ? 'bg-navy-900 text-white' : 'bg-white text-navy-500 hover:bg-navy-50'}`}>AM</button>
          <button type="button" onClick={() => update('period', 'PM')}
            className={`px-2.5 py-2 text-[11px] font-bold transition-colors border-r border-gray-200 ${parts.period === 'PM' ? 'bg-navy-900 text-white' : 'bg-white text-navy-500 hover:bg-navy-50'}`}>PM</button>
        </div>
      </div>
    </div>
  );
}

export default function LectureManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [serverNow, setServerNow] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', lecture_date: '', start_time: '', end_time: '', is_recurring: false,
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: lecs }, { data: timeData }] = await Promise.all([
        supabase.from('lectures').select('*').order('lecture_date', { ascending: false }).order('start_time', { ascending: true }),
        supabase.rpc('get_server_time'),
      ]);
      setLectures(lecs || []);
      if (timeData) setServerNow(new Date(timeData));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', lecture_date: '', start_time: '', end_time: '', is_recurring: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (form.start_time >= form.end_time) { setMsg({ type: 'error', text: t('lectures.timeError') }); return; }

    try {
      const dayOfWeek = new Date(form.lecture_date).getDay();
      const payload = {
        title: form.title, description: form.description, lecture_date: form.lecture_date,
        start_time: form.start_time, end_time: form.end_time,
        is_recurring: form.is_recurring, recurring_day: form.is_recurring ? dayOfWeek : null,
        created_by: user.id,
      };

      if (editing) {
        const { error } = await supabase.from('lectures').update(payload).eq('id', editing);
        if (error) throw error;
        setMsg({ type: 'success', text: t('lectures.editSuccess') });
      } else {
        const { error } = await supabase.from('lectures').insert(payload);
        if (error) throw error;
        // Generate recurring copies if weekly
        if (form.is_recurring) {
          const copies = [];
          for (let i = 1; i <= 4; i++) {
            const d = new Date(form.lecture_date);
            d.setDate(d.getDate() + i * 7);
            copies.push({ ...payload, lecture_date: d.toISOString().split('T')[0], is_recurring: false });
          }
          await supabase.from('lectures').insert(copies);
        }
        setMsg({ type: 'success', text: form.is_recurring ? t('lectures.addSuccessRecurring') : t('lectures.addSuccess') });
      }
      resetForm();
      fetchAll();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const deleteLecture = async (id) => {
    if (!confirm(t('lectures.confirmDelete'))) return;
    try {
      const { error } = await supabase.from('lectures').delete().eq('id', id);
      if (error) throw error;
      setMsg({ type: 'success', text: t('deleted') });
      fetchAll();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const toggleActive = async (id, current) => {
    const { error } = await supabase.from('lectures').update({ is_active: !current }).eq('id', id);
    if (!error) fetchAll();
  };

  const startEdit = (lec) => {
    setForm({ title: lec.title, description: lec.description || '', lecture_date: lec.lecture_date, start_time: lec.start_time, end_time: lec.end_time, is_recurring: lec.is_recurring });
    setEditing(lec.id);
    setShowForm(true);
  };

  const getStatus = (lec) => {
    if (!lec.is_active) return { label: t('lectures.disabled'), cls: 'bg-gray-100 text-gray-500' };
    if (!serverNow) return { label: '...', cls: 'bg-gray-100 text-gray-400' };
    const lecDate = lec.lecture_date;
    const today = getCairoDateISO(serverNow);
    if (lecDate > today) return { label: t('lectures.upcomingDate'), cls: 'bg-blue-50 text-blue-700' };
    if (lecDate < today) return { label: t('lectures.ended'), cls: 'bg-gray-100 text-gray-500' };
    const nowTime = getCairoTimeHHMM(serverNow);
    if (nowTime >= lec.start_time?.slice(0, 5) && nowTime <= lec.end_time?.slice(0, 5)) return { label: t('lectures.activeNow'), cls: 'bg-green-50 text-green-700 animate-pulse' };
    if (nowTime < lec.start_time?.slice(0, 5)) return { label: t('lectures.upcomingToday'), cls: 'bg-blue-50 text-blue-600' };
    return { label: t('lectures.ended'), cls: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-navy-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-sm sm:text-base font-bold text-navy-900 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          {t('lectures.manage')}
        </h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1">
          {showForm ? t('lectures.closeForm') : t('lectures.addNew')}
        </button>
      </div>

      {msg.text && (
        <div className={`mx-3 mt-3 p-2.5 rounded-lg text-xs font-bold border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{msg.text}</div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-navy-700 mb-1">{t('lectures.titleLabel')}</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm" placeholder={t('lectures.titlePlaceholder')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-navy-700 mb-1">{t('lectures.descLabel')}</label>
              <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm" placeholder={t('lectures.descPlaceholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-navy-700 mb-1">{t('lectures.dateLabel')}</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-navy-600 outline-none text-sm" value={form.lecture_date} onChange={e => setForm({ ...form, lecture_date: e.target.value })} required dir="ltr" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <TimePicker12h label={t('lectures.from')} value={form.start_time} onChange={v => setForm({ ...form, start_time: v })} />
              </div>
              <div className="flex-1">
                <TimePicker12h label={t('lectures.to')} value={form.end_time} onChange={v => setForm({ ...form, end_time: v })} />
              </div>
            </div>
          </div>
          {!editing && (
            <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-gray-200">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} className="w-4 h-4 accent-navy-900" />
              <span className="text-xs font-bold text-navy-800">{t('lectures.recurring')}</span>
            </label>
          )}
          <div className="flex gap-2">
            <button type="submit" className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors">
              {editing ? t('lectures.saveEdit') : t('lectures.addLecture')}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs transition-colors">{t('cancel')}</button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center"><div className="spinner mx-auto mb-2"></div><p className="text-xs text-navy-400">{t('loading')}</p></div>
      ) : lectures.length === 0 ? (
        <div className="py-10 text-center text-navy-400"><p className="text-sm font-bold">{t('lectures.noLectures')}</p><p className="text-xs mt-1">{t('lectures.noLecturesDesc')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="px-3 py-2.5 text-[11px] font-bold text-navy-600 rtl:text-right ltr:text-left">{t('lectures.tableLecture')}</th>
                <th className="px-3 py-2.5 text-[11px] font-bold text-navy-600 rtl:text-right ltr:text-left">{t('lectures.tableDate')}</th>
                <th className="px-3 py-2.5 text-[11px] font-bold text-navy-600 rtl:text-right ltr:text-left">{t('lectures.tableTime')}</th>
                <th className="px-3 py-2.5 text-[11px] font-bold text-navy-600 text-center">{t('lectures.tableStatus')}</th>
                <th className="px-3 py-2.5 text-[11px] font-bold text-navy-600 text-center">{t('lectures.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lectures.map(lec => {
                const status = getStatus(lec);
                return (
                  <tr key={lec.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-navy-900 text-xs">{lec.title}</p>
                      {lec.description && <p className="text-[10px] text-navy-400 mt-0.5">{lec.description}</p>}
                      {lec.is_recurring && <span className="text-[9px] bg-purple-50 text-purple-600 font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block">{t('lectures.weekly')}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-navy-700 font-bold whitespace-nowrap" dir="ltr">{lec.lecture_date}</td>
                    <td className="px-3 py-2.5 text-xs text-navy-600 whitespace-nowrap" dir="ltr">{formatTime12h(lec.start_time, t)} - {formatTime12h(lec.end_time, t)}</td>
                    <td className="px-3 py-2.5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span></td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => startEdit(lec)} className="text-navy-600 hover:bg-navy-100 p-1 rounded transition-colors" title="تعديل">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => toggleActive(lec.id, lec.is_active)} className={`p-1 rounded transition-colors ${lec.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={lec.is_active ? 'تعطيل' : 'تفعيل'}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={lec.is_active ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} /></svg>
                        </button>
                        <button onClick={() => deleteLecture(lec.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="حذف">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="bg-navy-50 px-3 py-2 border-t border-navy-100 text-xs font-bold text-navy-500 flex justify-between">
        <span>{t('lectures.totalLectures')}</span>
        <span className="bg-navy-900 text-white px-2 py-0.5 rounded-full text-[10px]">{lectures.length}</span>
      </div>
    </div>
  );
}
