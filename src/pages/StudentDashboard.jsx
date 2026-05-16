import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadDoubleSelfie } from '../lib/imgbbUpload';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const webcamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState({ img1: null, img2: null });
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState('idle'); // idle | camera | preview | done
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const captureNextSelfie = useCallback(() => {
    if (!webcamRef.current) return;
    setMessage({ type: '', text: '' });
    try {
      const img = webcamRef.current.getScreenshot();
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      if (!img) throw new Error('فشل التقاط الصورة، تأكد من إعطاء صلاحية الكاميرا');

      if (!capturedImages.img1) {
        // First image captured (selfie) → auto-flip to back camera for ID card
        setCapturedImages({ img1: img, img2: null });
        setFacingMode('environment');
      } else {
        // Second image captured (ID card)
        setCapturedImages({ img1: capturedImages.img1, img2: img });
        setStep('preview');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }, [capturedImages]);

  const submitAttendance = async () => {
    setUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const { url1, url2 } = await uploadDoubleSelfie(capturedImages.img1, capturedImages.img2);
      const { error } = await supabase.from('attendance_logs').insert({
        student_id: user.id,
        image_1_url: url1,
        image_2_url: url2,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'تم تسجيل حضورك بنجاح.' });
      setStep('done');
      setCapturedImages({ img1: null, img2: null });
      setCameraOpen(false);
      setFacingMode('user');
      fetchLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'فشل تسجيل الحضور.' });
    } finally {
      setUploading(false);
    }
  };

  const resetCapture = () => {
    setCapturedImages({ img1: null, img2: null });
    setFacingMode('user');
    setStep('camera');
    setMessage({ type: '', text: '' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-gold-500 rounded-r-xl"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-0.5">
              مرحباً، {profile?.full_name}
            </h2>
            <p className="text-navy-400 text-xs sm:text-sm">منصة تسجيل الحضور الإلكتروني</p>
          </div>
          <span className="bg-navy-900 text-white font-bold text-[10px] sm:text-xs px-3 py-1 sm:px-4 sm:py-1.5 rounded-full">
            بوابة الطالب
          </span>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg font-bold border text-xs ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Camera Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              تسجيل الحضور
            </h3>

            {(step === 'idle' || step === 'done') && !cameraOpen && (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-navy-300 transition-colors">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-3 sm:mb-4 border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-base text-navy-900 font-bold mb-1">تسجيل حضور المحاضرة</h4>
                <p className="text-navy-400 text-[11px] sm:text-xs mb-4 sm:mb-6 max-w-sm mx-auto leading-relaxed px-4">
                  سيتم التقاط صورة سيلفي ثم صورة للكارنيه الجامعي.
                </p>
                <button
                  onClick={() => { setCameraOpen(true); setStep('camera'); setFacingMode('user'); setMessage({ type: '', text: '' }); }}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-5 sm:py-2.5 sm:px-6 rounded-lg transition-all shadow-sm text-xs sm:text-sm"
                >
                  فتح الكاميرا
                </button>
              </div>
            )}

            {step === 'camera' && cameraOpen && (
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${!capturedImages.img1 ? 'bg-navy-900 text-white' : 'bg-green-100 text-green-700'}`}>
                    {capturedImages.img1 ? '✓' : '1'}
                    <span>سيلفي</span>
                  </div>
                  <div className="w-6 h-0.5 bg-gray-300"></div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${capturedImages.img1 ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <span>2</span>
                    <span>كارنيه</span>
                  </div>
                </div>

                <div className="relative max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-inner border-2 border-gray-800">
                  <Webcam
                    key={facingMode}
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.8}
                    videoConstraints={{ facingMode: facingMode, width: 480, height: 360 }}
                    className="w-full h-auto object-cover"
                    mirrored={facingMode === 'user'}
                  />
                  {flash && <div className="absolute inset-0 bg-white opacity-80 z-10 transition-opacity duration-150" />}

                  {/* Camera status badge */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {facingMode === 'user' ? 'أمامية' : 'خلفية'}
                  </div>

                  {/* Current step label */}
                  <div className="absolute bottom-2 left-2 bg-navy-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {!capturedImages.img1 ? '📸 التقط صورة سيلفي' : '🪪 صوّر الكارنيه'}
                  </div>

                  {/* Thumbnail of first image */}
                  {capturedImages.img1 && (
                    <div className="absolute bottom-2 right-2 border-2 border-white rounded-lg shadow-lg overflow-hidden w-14 h-14 bg-black">
                      <img src={capturedImages.img1} alt="Selfie" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 w-full bg-black/60 text-white text-[7px] text-center py-0.5 font-bold">سيلفي ✓</div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-center gap-2">
                  {/* Flip camera button */}
                  <button
                    onClick={flipCamera}
                    className="bg-navy-100 hover:bg-navy-200 text-navy-800 font-bold p-2 rounded-lg transition-all shadow-sm"
                    title="قلب الكاميرا"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  {/* Capture button */}
                  <button
                    onClick={captureNextSelfie}
                    className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {!capturedImages.img1 ? 'التقاط السيلفي' : 'التقاط الكارنيه'}
                  </button>

                  {/* Cancel button */}
                  <button
                    onClick={() => { setCameraOpen(false); setStep('idle'); setCapturedImages({ img1: null, img2: null }); setFacingMode('user'); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg transition-all text-xs sm:text-sm"
                    disabled={capturing}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="bg-navy-50/50 p-3 sm:p-4 rounded-xl border border-navy-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-center text-[10px] sm:text-xs font-bold text-navy-800 mb-2 bg-navy-50 py-1 rounded flex items-center justify-center gap-1">
                        📸 السيلفي
                      </p>
                      <img src={capturedImages.img1} alt="Selfie" className="w-full rounded-lg object-cover" />
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-center text-[10px] sm:text-xs font-bold text-navy-800 mb-2 bg-navy-50 py-1 rounded flex items-center justify-center gap-1">
                        🪪 الكارنيه
                      </p>
                      <img src={capturedImages.img2} alt="ID Card" className="w-full rounded-lg object-cover" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-2 sm:gap-3">
                  <button
                    onClick={submitAttendance}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-4 sm:px-6 rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    {uploading ? (
                      <><div className="spinner !w-4 !h-4 !border-2"></div> جاري الرفع...</>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> تأكيد وتسجيل</>
                    )}
                  </button>
                  <button
                    onClick={resetCapture}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 sm:px-6 rounded-lg transition-all text-xs sm:text-sm"
                    disabled={uploading}
                  >
                    إعادة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full">
            <h3 className="text-sm font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              سجل حضورك
            </h3>

            {loadingLogs ? (
              <div className="flex flex-col justify-center items-center py-8">
                <div className="spinner !border-navy-500 !w-6 !h-6 mb-2"></div>
                <p className="text-[11px] text-gray-500 font-bold">جاري التحميل...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-bold text-xs">لا توجد سجلات</p>
                <p className="text-[10px] mt-0.5">لم تقم بتسجيل الحضور بعد</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-navy-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          محاضرة مسجلة
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 bg-gray-200/50 inline-block px-1.5 py-0.5 rounded" dir="ltr">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px]">✓</span>
                    </div>
                    <div className="flex gap-2 justify-center bg-white p-1.5 rounded border border-gray-100">
                      <div className="text-center">
                        <img src={log.image_1_url} alt="Selfie" className="w-12 h-12 rounded-md bg-gray-100 object-cover border border-gray-200 shadow-sm" loading="lazy" />
                        <span className="text-[8px] text-navy-400 font-bold">سيلفي</span>
                      </div>
                      <div className="text-center">
                        <img src={log.image_2_url} alt="ID" className="w-12 h-12 rounded-md bg-gray-100 object-cover border border-gray-200 shadow-sm" loading="lazy" />
                        <span className="text-[8px] text-navy-400 font-bold">كارنيه</span>
                      </div>
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
