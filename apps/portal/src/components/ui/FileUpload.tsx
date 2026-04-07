"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { clsx } from "clsx";

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon;
  return FileText;
}

export function FileUpload({
  onFilesChange,
  accept = "image/*,.pdf",
  maxFiles = 5,
  maxSizeMb = 10,
  label = "Trascina file qui o clicca per selezionare",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const arr = Array.from(newFiles);
      const valid: File[] = [];

      for (const file of arr) {
        if (files.length + valid.length >= maxFiles) {
          setError(`Massimo ${maxFiles} file consentiti`);
          break;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
          setError(`${file.name} supera il limite di ${maxSizeMb} MB`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length > 0) {
        const updated = [...files, ...valid];
        setFiles(updated);
        onFilesChange(updated);
      }
    },
    [files, maxFiles, maxSizeMb, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-2",
          "border-2 border-dashed rounded-xl p-8 cursor-pointer",
          "transition-colors duration-150",
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
        )}
      >
        <Upload
          className={clsx(
            "w-8 h-8 transition-colors",
            isDragging ? "text-indigo-500" : "text-gray-400"
          )}
        />
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">
          Max {maxSizeMb} MB per file — {accept.replace(/\./g, "").toUpperCase()}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => {
            const Icon = getFileIcon(file);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <Icon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Rimuovi ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
