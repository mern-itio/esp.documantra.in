import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, X } from 'lucide-react';
import { usePublicSign } from './PublicSignContext';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, setFiles } = usePublicSign();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setError(null);
      const next: File[] = [];
      let skipped = 0;

      Array.from(fileList).forEach((file) => {
        const isPdf =
          file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (!isPdf) {
          skipped += 1;
          return;
        }
        next.push(file);
      });

      if (skipped > 0 && next.length === 0) {
        setError('Only PDF files are supported.');
        return;
      }
      if (skipped > 0) {
        setError(`${skipped} non-PDF file(s) were skipped.`);
      }

      setFiles((prev) => {
        const merged = [...prev, ...next].slice(0, 10);
        return merged;
      });
    },
    [setFiles]
  );

  const onNext = () => {
    if (files.length === 0) {
      setError('Please upload at least one PDF to continue.');
      return;
    }
    navigate('/public-sign/action');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Upload a document to sign
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Drag and drop your PDF or browse from your device. No account needed to
        get started.
      </p>

      <div
        className={`mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? 'border-[#2563eb] bg-sky-50'
            : 'border-slate-300 hover:border-[#2563eb]/60 hover:bg-slate-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="mb-3 h-10 w-10 text-[#2563eb]" />
        <p className="text-sm font-semibold text-slate-900">Drop your files here</p>
        <p className="mt-1 text-xs text-slate-500">or click to browse</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-full bg-[#2563eb] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="mt-3 text-[11px] text-slate-500">PDF only · up to 10 files</p>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-[#2563eb]" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                onClick={() =>
                  setFiles((prev) => prev.filter((_, i) => i !== index))
                }
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={files.length === 0}
          className="rounded-full bg-[#2563eb] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
