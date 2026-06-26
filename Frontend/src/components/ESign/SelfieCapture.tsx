import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { detectFaceInImage, type FaceBox } from '../../utils/faceDetection';

export type SelfieCaptureResult = {
  imageBase64: string;
  faceBox: FaceBox;
};

type SelfieCaptureProps = {
  disabled?: boolean;
  onSubmit: (payload: SelfieCaptureResult) => Promise<void> | void;
};

const SelfieCapture: React.FC<SelfieCaptureProps> = ({ disabled = false, onSubmit }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState<string>('');
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captureSize, setCaptureSize] = useState({ width: 0, height: 0 });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setIsStartingCamera(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this device or browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPreview('');
      setFaceBox(null);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera.');
    } finally {
      setIsStartingCamera(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const detectedFace = await detectFaceInImage(dataUrl, canvas.width, canvas.height);

    setCaptureSize({ width: canvas.width, height: canvas.height });
    setFaceBox(detectedFace);
    setPreview(dataUrl);
    setCameraError('');
    stopCamera();
  };

  const handleSubmit = async () => {
    if (!preview || !faceBox || disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ imageBase64: preview, faceBox });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = async () => {
    setPreview('');
    setFaceBox(null);
    setCameraError('');
    await startCamera();
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-black">
        {preview ? (
          <img src={preview} alt="Selfie preview" className="mx-auto max-h-80 w-full object-contain" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay className="mx-auto max-h-80 w-full object-contain" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-40 rounded-[50%] border-2 border-white/80" />
            </div>
          </>
        )}
      </div>

      {cameraError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {cameraError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!preview ? (
          <>
            <button
              type="button"
              onClick={captureSelfie}
              disabled={disabled || isStartingCamera}
              className="inline-flex items-center justify-center rounded-lg bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
            >
              {isStartingCamera ? 'Starting…' : 'Capture'}
            </button>
            <button
              type="button"
              onClick={startCamera}
              disabled={disabled || isStartingCamera}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled || isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying…' : 'Submit'}
            </button>
          </>
        )}
      </div>
      {captureSize.width > 0 && faceBox && (
        <span className="sr-only">Captured frame {captureSize.width}x{captureSize.height}</span>
      )}
    </div>
  );
};

export default SelfieCapture;
