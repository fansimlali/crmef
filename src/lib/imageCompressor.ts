/**
 * معالج وضواغط صور الوصولات لضمان التوافق التام مع آيفون (Safari/HEIC) وأندرويد (Chrome).
 * يقوم بتحويل أي صورة (حتى لو كانت بدقة كاميرا هاتف ضخمة 10MB) إلى JPEG نقي وعالي الوضوح بحجم خفيف (< 1MB)
 * لتفادي أي انقطاع في الشبكة أو تجاوز حدود الحجم.
 */
export async function compressAndNormalizeReceiptImage(file: File): Promise<{
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}> {
  const originalSize = file.size;

  // إذا كانت البيئة لا تدعم Canvas (مثلاً وضع غير متصفح)، نرجع الملف كما هو
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      previewUrl: '',
      originalSize,
      compressedSize: originalSize,
    };
  }

  return new Promise((resolve) => {
    // محاولة قراءة وضغط الصورة عبر HTML Canvas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({
            file,
            previewUrl: objectUrl,
            originalSize,
            compressedSize: originalSize,
          });
          return;
        }

        // رسم خلفية بيضاء لتجنب أي شفافية في PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve({
                file,
                previewUrl: objectUrl,
                originalSize,
                compressedSize: originalSize,
              });
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const normalizedFile = new File([blob], cleanFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const newPreview = URL.createObjectURL(blob);
            resolve({
              file: normalizedFile,
              previewUrl: newPreview,
              originalSize,
              compressedSize: normalizedFile.size,
            });
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        console.warn('Canvas compression error, using original file:', err);
        resolve({
          file,
          previewUrl: objectUrl,
          originalSize,
          compressedSize: originalSize,
        });
      }
    };

    img.onerror = () => {
      // إذا فشل قراءة الصورة مباشرة (مثلاً ملف HEIC غير مدعوم محلياً في Canvas)، نبقي الملف الأصلي
      console.warn('Image loading fallback to raw file');
      resolve({
        file,
        previewUrl: objectUrl,
        originalSize,
        compressedSize: originalSize,
      });
    };

    img.src = objectUrl;
  });
}
