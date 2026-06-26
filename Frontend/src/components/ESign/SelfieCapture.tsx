import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';

type SelfieCaptureProps = {
  disabled?: boolean;
  onSubmit: (imageBase64: string) => Promise<void> | void;
};

const SelfieCapture: React.FC<SelfieCaptureProps> = ({ disabled = false, onSubmit }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
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
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera. You can upload a photo instead.');
    } finally {
      setIsStartingCamera(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setPreview(result);
      stopCamera();
      setCameraError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async () => {
    if (!preview || disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(preview);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = async () => {
    setPreview('');
    await startCamera();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-[#F7F3EE] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Camera className="h-4 w-4 text-[#260559]" />
          Selfie verification
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Position your face in the frame and capture a clear selfie, similar to KYC verification.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-black">
          {preview ? (
            <img src={preview} alt="Captured selfie preview" className="mx-auto max-h-80 w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="mx-auto max-h-80 w-full object-contain"
            />
          )}
        </div>

        {cameraError && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {cameraError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!preview ? (
            <>
              <button
                type="button"
                onClick={captureSelfie}
                disabled={disabled || isStartingCamera}
                className="inline-flex items-center justify-center rounded-lg bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
              >
                {isStartingCamera ? 'Starting camera…' : 'Capture selfie'}
              </button>
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled || isStartingCamera}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart camera
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled || isSubmitting}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Retake
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}
            className="inline-flex items-center justify-center rounded-lg border border-[#260559]/35 bg-white px-4 py-2 text-sm font-medium text-[#260559] hover:bg-[#260559]/5 disabled:opacity-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || !preview}
          className="inline-flex items-center justify-center rounded-xl bg-[#260559] px-4 py-2 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit selfie'}
        </button>
      </div>
    </div>
  );
};

export default SelfieCapture;
