import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { uploadDoubleSelfie } from '../lib/imgbbUpload';

// Timezone helpers: always use Cairo time regardless of browser timezone
const getCairoTimeHHMM = (date) =>
  date.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false });

// 12-hour display helper
const formatTime12h = (time24, t) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr);
  const period = h >= 12 ? t('pm') : t('am');
  const hour = h % 12 || 12;
  return `${hour}:${mStr?.slice(0, 2) || '00'} ${period}`;
};

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const webcamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState({ img1: null, img2: null });
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState('idle');
  const [facingMode, setFacingMode] = useState('user');

  // Lectures
  const [todayLectures, setTodayLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [serverNow, setServerNow] = useState(null);
  const [attendedIds, setAttendedIds] = useState(new Set());

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoadingLogs(true);
    setLoadingLectures(true);
    try {
      const [{ data: lecsData }, { data: timeData }, { data: logsData }] = await Promise.all([
        supabase.rpc('get_today_lectures'),
        supabase.rpc('get_server_time'),
        supabase.from('attendance_logs').select('*, lectures:lecture_id (title)').eq('student_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);
      setTodayLectures(lecsData || []);
      if (timeData) setServerNow(new Date(timeData));
      setLogs(logsData || []);
      // Build set of lecture IDs already attended
      const attended = new Set((logsData || []).filter(l => l.lecture_id).map(l => l.lecture_id));
      setAttendedIds(attended);
    } catch (err) { console.error(err); }
    finally { setLoadingLogs(false); setLoadingLectures(false); }
  };

  const getLectureStatus = (lec) => {
    if (!serverNow) return 'unknown';
    const nowTime = getCairoTimeHHMM(serverNow);
    if (nowTime < lec.start_time?.slice(0, 5)) return 'upcoming';
    if (nowTime > lec.end_time?.slice(0, 5)) return 'ended';
    return 'active';
  };

  const flipCamera = () => setFacingMode(p => p === 'user' ? 'environment' : 'user');

  const captureNextSelfie = useCallback(() => {
    if (!webcamRef.current) return;
    setMessage({ type: '', text: '' });
    try {
      const img = webcamRef.current.getScreenshot();
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      if (!img) throw new Error(t('student.captureError'));
      if (!capturedImages.img1) {
        setCapturedImages({ img1: img, img2: null });
        setFacingMode('environment');
      } else {
        setCapturedImages({ img1: capturedImages.img1, img2: img });
        setStep('preview');
      }
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }, [capturedImages]);

  const submitAttendance = async () => {
    setUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const { url1, url2 } = await uploadDoubleSelfie(capturedImages.img1, capturedImages.img2);
      const { error } = await supabase.from('attendance_logs').insert({
        student_id: user.id,
        lecture_id: selectedLecture?.id || null,
        image_1_url: url1,
        image_2_url: url2,
      });
      if (error) {
        if (error.code === '23505') throw new Error(t('student.alreadyRegistered'));
        throw error;
      }
      setMessage({ type: 'success', text: `${t('student.successMsg')}${selectedLecture ? ' - ' + selectedLecture.title : ''}` });
      setStep('done');
      setCapturedImages({ img1: null, img2: null });
      setCameraOpen(false);
      setFacingMode('user');
      setSelectedLecture(null);
      fetchAll();
    } catch (err) { setMessage({ type: 'error', text: err.message || t('student.failMsg') }); }
    finally { setUploading(false); }
  };

  const resetCapture = () => { setCapturedImages({ img1: null, img2: null }); setFacingMode('user'); setStep('camera'); setMessage({ type: '', text: '' }); };
  const goBackToLectures = () => { setStep('idle'); setCameraOpen(false); setSelectedLecture(null); setCapturedImages({ img1: null, img2: null }); setFacingMode('user'); };

  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const startAttendance = (lec) => {
    setSelectedLecture(lec);
    setCameraOpen(true);
    setStep('camera');
    setFacingMode('user');
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-gold-500 rounded-r-xl"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-0.5">{t('student.welcome', { name: profile?.full_name })}</h2>
            <p className="text-navy-400 text-xs sm:text-sm">{t('student.platformDesc')}</p>
          </div>
          <span className="bg-navy-900 text-white font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full">{t('student.portal')}</span>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg font-bold border text-xs ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {t('student.attendance')}
            </h3>

            {/* STEP: Select Lecture */}
            {(step === 'idle' || step === 'done') && !cameraOpen && (
              <div>
                <p className="text-xs text-navy-500 font-bold mb-3">{t('student.todayLectures')}</p>
                {loadingLectures ? (
                  <div className="py-8 text-center"><div className="spinner mx-auto mb-2 !w-6 !h-6"></div><p className="text-xs text-navy-400">{t('student.loadingLectures')}</p></div>
                ) : todayLectures.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-sm font-bold text-navy-900 mb-1">{t('student.noLectures')}</p>
                    <p className="text-navy-400 text-xs">{t('student.noLecturesDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayLectures.map(lec => {
                      const status = getLectureStatus(lec);
                      const attended = attendedIds.has(lec.id);
                      const isActive = status === 'active';
                      const canAttend = isActive && !attended;

                      return (
                        <div key={lec.id} className={`p-3 rounded-xl border transition-all ${attended ? 'bg-green-50/50 border-green-200' : isActive ? 'bg-white border-navy-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-navy-900 text-xs sm:text-sm truncate">{lec.title}</p>
                                {/* Status badge */}
                                {attended ? (
                                  <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">{t('student.registered')}</span>
                                ) : status === 'active' ? (
                                  <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full animate-pulse shrink-0">{t('student.active')}</span>
                                ) : status === 'upcoming' ? (
                                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full shrink-0">{t('student.upcoming')}</span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{t('student.ended')}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-navy-400 font-bold" dir="ltr">🕐 {formatTime12h(lec.start_time, t)} - {formatTime12h(lec.end_time, t)}</p>
                              {lec.description && <p className="text-[10px] text-navy-400 mt-0.5">{lec.description}</p>}
                            </div>
                            {canAttend ? (
                              <button onClick={() => startAttendance(lec)} className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-3 sm:px-4 rounded-lg text-[11px] sm:text-xs transition-all shadow-sm shrink-0">
                                {t('student.registerBtn')}
                              </button>
                            ) : attended ? (
                              <span className="text-green-600 shrink-0">✅</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP: Camera */}
            {step === 'camera' && cameraOpen && (
              <div className="space-y-3">
                {/* Selected lecture badge */}
                <div className="flex items-center justify-between bg-navy-50 p-2 rounded-lg border border-navy-100">
                  <span className="text-xs font-bold text-navy-800">📚 {selectedLecture?.title}</span>
                  <button onClick={goBackToLectures} className="text-[10px] text-red-600 font-bold hover:underline">{t('student.back')}</button>
                </div>
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${!capturedImages.img1 ? 'bg-navy-900 text-white' : 'bg-green-100 text-green-700'}`}>{capturedImages.img1 ? '✓' : '1'} {t('student.selfie')}</div>
                  <div className="w-6 h-0.5 bg-gray-300"></div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${capturedImages.img1 ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-400'}`}>2 {t('student.idCard')}</div>
                </div>
                <div className="relative max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-inner border-2 border-gray-800">
                  <Webcam key={facingMode} ref={webcamRef} audio={false} screenshotFormat="image/jpeg" screenshotQuality={0.8} videoConstraints={{ facingMode, width: 480, height: 360 }} className="w-full h-auto object-cover" mirrored={facingMode === 'user'} />
                  {flash && <div className="absolute inset-0 bg-white opacity-80 z-10" />}
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>{facingMode === 'user' ? t('student.frontCam') : t('student.backCam')}</div>
                  <div className="absolute bottom-2 left-2 bg-navy-900/80 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{!capturedImages.img1 ? t('student.captureSelfie') : t('student.captureId')}</div>
                  {capturedImages.img1 && (
                    <div className="absolute bottom-2 right-2 border-2 border-white rounded-lg shadow-lg overflow-hidden w-14 h-14 bg-black"><img src={capturedImages.img1} alt="Selfie" className="w-full h-full object-cover" /><div className="absolute bottom-0 w-full bg-black/60 text-white text-[7px] text-center py-0.5 font-bold">{t('student.selfie')} ✓</div></div>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  <button onClick={flipCamera} className="bg-navy-100 hover:bg-navy-200 text-navy-800 font-bold p-2 rounded-lg transition-all" title="قلب الكاميرا">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                  <button onClick={captureNextSelfie} className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-5 rounded-lg transition-all flex items-center gap-1.5 text-xs sm:text-sm">
                    📸 {!capturedImages.img1 ? t('student.captureSelfieBtn') : t('student.captureIdBtn')}
                  </button>
                  <button onClick={goBackToLectures} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs">{t('cancel')}</button>
                </div>
              </div>
            )}

            {/* STEP: Preview */}
            {step === 'preview' && (
              <div className="space-y-3">
                <div className="bg-navy-50/50 p-2 rounded-lg border border-navy-100 text-center"><span className="text-xs font-bold text-navy-800">📚 {selectedLecture?.title}</span></div>
                <div className="bg-navy-50/50 p-3 rounded-xl border border-navy-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-center text-[10px] font-bold text-navy-800 mb-2 bg-navy-50 py-1 rounded">{t('student.theSelfie')}</p>
                      <img src={capturedImages.img1} alt="Selfie" className="w-full rounded-lg object-cover" />
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-center text-[10px] font-bold text-navy-800 mb-2 bg-navy-50 py-1 rounded">{t('student.theId')}</p>
                      <img src={capturedImages.img2} alt="ID" className="w-full rounded-lg object-cover" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <button onClick={submitAttendance} disabled={uploading} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-xs">
                    {uploading ? (<><div className="spinner !w-4 !h-4 !border-2"></div>{t('student.uploading')}</>) : (<>{t('student.confirmSubmit')}</>)}
                  </button>
                  <button onClick={resetCapture} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs" disabled={uploading}>{t('student.retake')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full">
            <h3 className="text-sm font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('student.yourLog')}
            </h3>
            {loadingLogs ? (
              <div className="py-8 text-center"><div className="spinner !w-6 !h-6 mx-auto mb-2"></div><p className="text-[11px] text-gray-500 font-bold">{t('loading')}</p></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-bold text-xs">{t('student.noLogs')}</p>
                <p className="text-[10px] mt-0.5">{t('student.noLogsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="p-2.5 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <p className="text-xs font-bold text-navy-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {log.lectures?.title || t('student.logLecture')}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5 bg-gray-200/50 inline-block px-1.5 py-0.5 rounded" dir="ltr">{formatDate(log.created_at)}</p>
                      </div>
                      <span className="bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px]">✓</span>
                    </div>
                    <div className="flex gap-2 justify-center bg-white p-1.5 rounded border border-gray-100">
                      <div className="text-center"><img src={log.image_1_url} alt="Selfie" className="w-11 h-11 rounded-md bg-gray-100 object-cover border border-gray-200 shadow-sm" loading="lazy" /><span className="text-[8px] text-navy-400 font-bold">{t('student.selfie')}</span></div>
                      <div className="text-center"><img src={log.image_2_url} alt="ID" className="w-11 h-11 rounded-md bg-gray-100 object-cover border border-gray-200 shadow-sm" loading="lazy" /><span className="text-[8px] text-navy-400 font-bold">{t('student.idCard')}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
