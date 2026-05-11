const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Upload a base64 image to ImgBB
 * @param {string} base64Image - The base64 encoded image (with or without data:image prefix)
 * @param {string} name - Optional name for the image
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export async function uploadToImgBB(base64Image, name = 'attendance') {
  if (!IMGBB_API_KEY) {
    throw new Error('❌ Missing VITE_IMGBB_API_KEY in .env file!');
  }

  // Remove the data:image/...;base64, prefix if present
  const base64Data = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Data);
  formData.append('name', `${name}_${Date.now()}`);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'فشل رفع الصورة على ImgBB');
    }

    return data.data.display_url;
  } catch (error) {
    console.error('ImgBB Upload Error:', error);
    throw new Error('فشل رفع الصورة. تأكد من اتصال الإنترنت ومفتاح API.');
  }
}

/**
 * Upload both double selfie images to ImgBB
 * @param {string} image1Base64 - First selfie base64
 * @param {string} image2Base64 - Second selfie base64
 * @returns {Promise<{url1: string, url2: string}>}
 */
export async function uploadDoubleSelfie(image1Base64, image2Base64) {
  const [url1, url2] = await Promise.all([
    uploadToImgBB(image1Base64, 'selfie_1'),
    uploadToImgBB(image2Base64, 'selfie_2'),
  ]);

  return { url1, url2 };
}
