import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { detectFaceInImage, isFaceDetectionSupported, type FaceBox } from '../../utils/faceDetection';

export type LivenessCaptureResult = {
  imageBase64: string;
  secondaryImageBase64: string;
  faceBox: FaceBox;
  secondaryFaceBox: FaceBox;
};

type LivenessCaptureProps = {
  disabled?: boolean;
  onSubmit: (payload: LivenessCaptureResult) => Promise<void> | void;
};

const STEPS = [
  { id: 'center', label: 'Step 1: Look straight' },
  { id: 'turn_left', label: 'Step 2: Turn head slightly left' },
] as const;

const LivenessCapture: React.FC<LivenessCaptureProps> = ({ disabled = false, onSubmit }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [primaryPreview, setPrimaryPreview] = useState('');
  const [primaryFaceBox, setPrimaryFaceBox] = useState<FaceBox | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState('');
  const [secondaryFaceBox, setSecondaryFaceBox] = useState<FaceBox | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (!isFaceDetectionSupported()) {
        throw new Error('Use Chrome or Edge for liveness verification.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet.');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const face = await detectFaceInImage(dataUrl, canvas.width, canvas.height);
    if (!face) {
      setCameraError('No face detected. Follow the guide and try again.');
      return null;
    }

    return { dataUrl, face };
  };

  const handleCapture = async () => {
    const captured = await captureFrame();
    if (!captured) return;

    setCameraError('');
    if (stepIndex === 0) {
      setPrimaryPreview(captured.dataUrl);
      setPrimaryFaceBox(captured.face);
      setStepIndex(1);
      await startCamera();
      return;
    }

    setSecondaryPreview(captured.dataUrl);
    setSecondaryFaceBox(captured.face);
    stopCamera();
  };

  const handleSubmit = async () => {
    if (!primaryPreview || !secondaryPreview || !primaryFaceBox || !secondaryFaceBox || disabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        imageBase64: primaryPreview,
        secondaryImageBase64: secondaryPreview,
        faceBox: primaryFaceBox,
        secondaryFaceBox,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = async () => {
    setStepIndex(0);
    setPrimaryPreview('');
    setPrimaryFaceBox(null);
    setSecondaryPreview('');
    setSecondaryFaceBox(null);
    setCameraError('');
    await startCamera();
  };

  const currentPreview = stepIndex === 1 && secondaryPreview ? secondaryPreview : primaryPreview;
  const showLiveCamera = !currentPreview || (stepIndex === 1 && !secondaryPreview);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-900">{STEPS[stepIndex].label}</div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-black">
        {showLiveCamera ? (
          <>
            <video ref={videoRef} playsInline muted className="mx-auto max-h-80 w-full object-contain" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-40 rounded-[50%] border-2 border-white/80" />
            </div>
          </>
        ) : (
          <img src={currentPreview} alt="Liveness preview" className="mx-auto max-h-80 w-full object-contain" />
        )}
      </div>

      {cameraError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {cameraError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {stepIndex < 2 && !secondaryPreview && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={disabled || isStartingCamera}
            className="inline-flex items-center justify-center rounded-lg bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
          >
            {isStartingCamera ? 'Starting…' : 'Capture'}
          </button>
        )}
        {secondaryPreview && (
          <>
            <button
              type="button"
              onClick={handleRestart}
              disabled={disabled || isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Restart
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
        {!secondaryPreview && (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled || isStartingCamera}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart camera
          </button>
        )}
      </div>
    </div>
  );
};

export default LivenessCapture;
