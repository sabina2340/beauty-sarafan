"use client";

import { useId } from "react";

type Props = {
  label: string;
  buttonText?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  hintEmpty?: string;
  showNamesList?: boolean;
  id?: string;
};

export function FileUploadField({
  label,
  buttonText = "Выбрать файл",
  files,
  onFilesChange,
  accept = "*/*",
  multiple = false,
  required = false,
  hintEmpty = "Файл не выбран",
  showNamesList = false,
  id,
}: Props) {
  const autoId = useId();
  const inputId = id || `file-upload-${autoId}`;

  const hint = files.length === 0
    ? hintEmpty
    : files.length === 1
      ? files[0].name
      : `Выбрано файлов: ${files.length}`;

  return (
    <div className="fileUploadField">
      <label className="label">{label}</label>
      <label className="btn btnGhost fileBtn" htmlFor={inputId}>{buttonText}</label>
      <input
        id={inputId}
        type="file"
        className="hiddenFileInput"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={(e) => onFilesChange(Array.from(e.target.files ?? []))}
      />
      <p className="fileHint">{hint}</p>
      {showNamesList && files.length > 1 ? (
        <div className="uploadNamesList" aria-live="polite">
          {files.map((file, index) => <span key={`${file.name}-${file.lastModified}-${index}`} className="uploadNameChip">{file.name}</span>)}
        </div>
      ) : null}
    </div>
  );
}
