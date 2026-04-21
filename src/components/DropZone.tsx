"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isValidFile(file: File): boolean {
  return (
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

export default function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!isValidFile(file)) {
        setError("Format invalide. Veuillez déposer un fichier PDF ou DOCX.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Le fichier dépasse la limite de 10 Mo.");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative w-full rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-4
          py-16 px-8 cursor-pointer transition-all duration-300
          ${
            disabled
              ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50"
              : isDragging
              ? "border-cabrh-sky bg-cabrh-skyLight scale-[1.01] drop-active"
              : "border-cabrh-sky hover:border-cabrh-navy hover:bg-cabrh-skyLight bg-white"
          }
        `}
      >
        {/* Icône */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-transform duration-300"
          style={{
            background: isDragging
              ? "linear-gradient(135deg, #009ADE, #004D71)"
              : "linear-gradient(135deg, #E6F5FB, #009ADE20)",
          }}
        >
          <svg
            className="w-10 h-10 transition-colors duration-300"
            style={{ color: isDragging ? "white" : "#009ADE" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>
        </div>

        {/* Texte principal */}
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: "#004D71" }}>
            {isDragging
              ? "Déposez le fichier ici"
              : "Glissez-déposez votre CV ici"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ou{" "}
            <span
              className="font-medium underline"
              style={{ color: "#009ADE" }}
            >
              parcourez vos fichiers
            </span>
          </p>
        </div>

        {/* Formats acceptés */}
        <div className="flex items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            PDF
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            DOCX
          </span>
          <span className="text-xs text-gray-400">• Max 10 Mo</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
