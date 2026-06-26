export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DetectedFace = {
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/** Matches the on-screen oval guide (normalized 0-1). */
export const estimateCenterFaceBox = (): FaceBox => ({
  x: 0.28,
  y: 0.15,
  width: 0.44,
  height: 0.55,
});

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to read captured image.'));
    img.src = src;
  });

const detectWithFaceDetector = async (
  dataUrl: string,
  sourceWidth: number,
  sourceHeight: number
): Promise<FaceBox | null> => {
  const FaceDetectorCtor = (window as any).FaceDetector as
    | (new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: ImageBitmapSource) => Promise<DetectedFace[]>;
      })
    | undefined;

  if (!FaceDetectorCtor || !sourceWidth || !sourceHeight) {
    return null;
  }

  try {
    const img = await loadImage(dataUrl);
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    if (!faces?.length || !faces[0].boundingBox) return null;

    const box = faces[0].boundingBox;
    return {
      x: box.x / sourceWidth,
      y: box.y / sourceHeight,
      width: box.width / sourceWidth,
      height: box.height / sourceHeight,
    };
  } catch {
    return null;
  }
};

/** Uses native FaceDetector when available; otherwise falls back to guide-based box. */
export const detectFaceInImage = async (
  dataUrl: string,
  sourceWidth: number,
  sourceHeight: number
): Promise<FaceBox> => {
  const detected = await detectWithFaceDetector(dataUrl, sourceWidth, sourceHeight);
  return detected || estimateCenterFaceBox();
};

export const isFaceDetectionSupported = () => Boolean((window as any).FaceDetector);
