"use client";

import { ChangeEvent, useId, useMemo, useState } from "react";

type FileUploadFieldProps = {
  id?: string;
  label: string;
  buttonText: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  selectedFiles?: File[];
  emptyText?: string;
  showFileList?: boolean;
  onFilesChange: (files: File[]) => void;
};

export function FileUploadField({
  id,
  label,
  buttonText,
  accept,
  multiple = false,
  required = false,
  selectedFiles,
  emptyText = "Файл не выбран",
  showFileList = false,
  onFilesChange,
}: FileUploadFieldProps) {
  const generatedId = useId();
  const inputId = id || `file-upload-${generatedId}`;
  const [internalFiles, setInternalFiles] = useState<File[]>([]);

  const files = selectedFiles ?? internalFiles;

  const hintText = useMemo(() => {
    if (!files.length) return emptyText;
    if (files.length === 1) return files[0].name;
    return `Выбрано файлов: ${files.length}`;
  }, [emptyText, files]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setInternalFiles(nextFiles);
    onFilesChange(nextFiles);
  };

  return (
    <div>
      <label className="label" htmlFor={inputId}>{label}</label>
      <label className="btn btnGhost fileBtn" htmlFor={inputId}>{buttonText}</label>
      <input id={inputId} type="file" className="hiddenFileInput" accept={accept} multiple={multiple} required={required} onChange={onChange} />
      <p className="fileHint">{hintText}</p>
      {showFileList && files.length > 1 ? (
        <div className="uploadNamesList" aria-live="polite">
          {files.map((file, index) => <span key={`${file.name}-${file.lastModified}-${index}`} className="uploadNameChip">{file.name}</span>)}
        </div>
      ) : null}
    </div>
  );
}
