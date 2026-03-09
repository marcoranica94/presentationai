import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '@/lib/fileParser';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  const rejection = fileRejections[0]?.errors[0];
  const errorMsg =
    rejection?.code === 'file-too-large'
      ? 'File troppo grande (max 10 MB)'
      : rejection?.code === 'file-invalid-type'
      ? 'Tipo file non supportato (usa PDF, DOCX o TXT)'
      : rejection?.message;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && !isDragReject && 'border-border hover:border-primary/50 hover:bg-accent/50',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {isDragReject ? (
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        ) : isDragActive ? (
          <Upload className="mb-4 h-12 w-12 text-primary animate-bounce" />
        ) : (
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        )}

        <p className="text-lg font-medium">
          {isDragActive ? 'Rilascia il file qui' : 'Trascina il tuo documento'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          oppure <span className="text-primary underline">clicca per selezionare</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground">PDF, DOCX, TXT — Max 10 MB</p>
      </div>

      {errorMsg && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
