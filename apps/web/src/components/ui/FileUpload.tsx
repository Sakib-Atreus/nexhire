'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, CheckCircle, Loader2, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onUpload: (url: string) => void;
  onFileSelected?: (file: File) => void;
  accept?: string;
  label?: string;
  hint?: string;
  currentUrl?: string;
}

export function FileUpload({
  onUpload,
  onFileSelected,
  accept,
  label = 'Upload a file',
  hint,
  currentUrl,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { mutate, isPending } = useFileUpload();

  function handleFile(file: File) {
    setUploadedName(file.name);
    setUploadSuccess(false);
    setUploadError(null);
    onFileSelected?.(file);
    mutate(file, {
      onSuccess: (data) => {
        setUploadSuccess(true);
        onUpload(data.url);
      },
      onError: () => {
        setUploadedName(null);
        setUploadError('Upload failed. Please try again or paste a URL instead.');
      },
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const isSuccess = uploadSuccess && uploadedName;

  return (
    <div className="space-y-2">
      {currentUrl && !isSuccess && (
        <div className="flex items-center gap-2 text-sm text-fg-tertiary">
          <FileText className="w-4 h-4 text-fg-subtle" />
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline truncate max-w-xs"
          >
            Current file
          </a>
          <span className="text-fg-subtle">·</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary-600 hover:underline text-xs"
          >
            Replace
          </button>
        </div>
      )}

      <div
        onClick={() => !isPending && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors',
          dragging
            ? 'border-primary-400 bg-primary-50'
            : 'border-line hover:border-primary-300 hover:bg-muted',
          isPending ? 'cursor-not-allowed opacity-70' : '',
        ].join(' ')}
      >
        {isPending ? (
          <>
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-fg-muted">Uploading {uploadedName}…</p>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-sm font-medium text-fg-secondary">{uploadedName}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUploadedName(null);
                setUploadSuccess(false);
                inputRef.current?.click();
              }}
              className="text-xs text-primary-600 hover:underline"
            >
              Replace file
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg-secondary">{label}</p>
            {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
            <p className="text-xs text-fg-subtle">Drag & drop or click to browse</p>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
