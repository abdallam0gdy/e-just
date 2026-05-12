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

  const captureNextSelfie = useCallback(() => {
    if (!webcamRef.current) return;
    setMessage({ type: '', text: '' });

    try {
      const img = webcamRef.current.getScreenshot();
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      if (!img) {
        throw new Error('فشل التقاط الصورة، تأكد من إعطاء صلاحية الكاميرا');
      }

      if (!capturedImages.img1) {
        setCapturedImages({ img1: img, img2: null });
      } else {
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
      const { url1, url2 } = await uploadDoubleSelfie(
        capturedImages.img1,
        capturedImages.img2
      );

      const { error } = await supabase.from('attendance_logs').insert({
        student_id: user.id,
        image_1_url: url1,
        image_2_url: url2,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم تسجيل حضورك بنجاح للمحاضرة الحالية.' });
      setStep('done');
      setCapturedImages({ img1: null, img2: null });
      setCameraOpen(false);
      fetchLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'فشل تسجيل الحضور. يرجى المحاولة مرة أخرى.' });
    } finally {
      setUploading(false);
    }
  };

  const resetCapture = () => {
    setCapturedImages({ img1: null, img2: null });
    setStep('camera');
    setMessage({ type: '', text: '' });
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

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-gold-500 rounded-r-2xl"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-1">
              مرحباً بك، {profile?.full_name}
            </h2>
            <p className="text-gray-500 font-medium">منصة تسجيل الحضور الإلكتروني للطلاب</p>
          </div>
          <span className="bg-navy-900 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-sm">
            بوابة الطالب
          </span>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.type === 'success' ? '✅ نجاح: ' : '❌ خطأ: '}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-navy-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              تسجيل الحضور (التقاط الصور)
            </h3>

            {(step === 'idle' || step === 'done') && !cameraOpen && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-navy-400 transition-colors">
                <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-xl text-navy-900 font-bold mb-2">تسجيل حضور المحاضرة</h4>
                <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                  يرجى التأكد من إضاءة المكان بشكل جيد. سيتم التقاط صورتين متتاليتين للتحقق من هويتك كطالب.
                </p>
                <button
                  onClick={() => { setCameraOpen(true); setStep('camera'); setMessage({ type: '', text: '' }); }}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  فتح الكاميرا وبدء التسجيل
                </button>
              </div>
            )}

            {step === 'camera' && cameraOpen && (
              <div className="space-y-6">
                <div className="relative max-w-lg mx-auto bg-black rounded-2xl overflow-hidden shadow-inner border-4 border-gray-800">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.8}
                    videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                    className="w-full h-auto object-cover"
                    mirrored={true}
                  />
                  {flash && <div className="absolute inset-0 bg-white opacity-80 z-10 transition-opacity duration-150" />}
                  
                  {/* Camera overlay UI */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    الكاميرا نشطة
                  </div>

                  {/* Show Thumbnail of first image if taken */}
                  {capturedImages.img1 && (
                    <div className="absolute bottom-4 right-4 border-2 border-white rounded-lg shadow-lg overflow-hidden w-24 h-24 bg-black">
                      <img src={capturedImages.img1} alt="First shot" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] text-center py-1 font-bold">اللقطة الأولى</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={captureNextSelfie}
                    className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {!capturedImages.img1 ? 'التقاط الصورة الأولى' : 'التقاط الصورة الثانية'}
                  </button>
                  <button
                    onClick={() => { setCameraOpen(false); setStep('idle'); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl transition-all w-full sm:w-auto"
                    disabled={capturing}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-8">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-center text-sm font-bold text-navy-800 mb-3 bg-gray-50 py-2 rounded-lg">اللقطة الأولى</p>
                      <img src={capturedImages.img1} alt="Preview 1" className="w-full rounded-lg shadow-inner object-cover" />
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-center text-sm font-bold text-navy-800 mb-3 bg-gray-50 py-2 rounded-lg">اللقطة الثانية</p>
                      <img src={capturedImages.img2} alt="Preview 2" className="w-full rounded-lg shadow-inner object-cover" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <button
                    onClick={submitAttendance}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {uploading ? (
                      <>
                        <div className="spinner !w-5 !h-5 !border-2"></div>
                        جاري التسجيل والرفع...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        تأكيد الصورة وتسجيل الحضور
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetCapture}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl transition-all w-full sm:w-auto"
                    disabled={uploading}
                  >
                    إعادة الالتقاط
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h3 className="text-lg font-bold text-navy-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              سجل حضورك الأخير
            </h3>

            {loadingLogs ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="spinner !border-navy-500 !w-8 !h-8 mb-4"></div>
                <p className="text-sm text-gray-500 font-bold">جاري تحميل السجلات...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-bold">لا توجد سجلات</p>
                <p className="text-xs mt-1">لم تقم بتسجيل الحضور من قبل</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          محاضرة مسجلة
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1.5 bg-gray-200/50 inline-block px-2 py-1 rounded" dir="ltr">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 font-bold px-2 py-1 rounded-md text-[10px]">مسجل بنجاح</span>
                    </div>
                    <div className="flex gap-3 justify-center bg-white p-2 rounded-lg border border-gray-100">
                      <img src={log.image_1_url} alt="Record 1" className="w-16 h-16 rounded-lg bg-gray-100 object-cover border border-gray-200 shadow-sm group-hover:border-navy-300 transition-colors" loading="lazy" />
                      <img src={log.image_2_url} alt="Record 2" className="w-16 h-16 rounded-lg bg-gray-100 object-cover border border-gray-200 shadow-sm group-hover:border-navy-300 transition-colors" loading="lazy" />
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
