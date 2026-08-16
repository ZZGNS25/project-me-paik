const PHOTO_EDGE = 256;
const PHOTO_QUALITY = 0.72;

export function readPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("이미지 파일만 올릴 수 있습니다."));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = PHOTO_EDGE / Math.max(image.width, image.height, 1);
      const width = Math.max(1, Math.round(image.width * Math.min(1, scale)));
      const height = Math.max(1, Math.round(image.height * Math.min(1, scale)));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지를 처리하지 못했습니다."));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽지 못했습니다."));
    };

    image.src = objectUrl;
  });
}
