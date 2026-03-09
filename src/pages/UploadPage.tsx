import { Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Documento
          </CardTitle>
          <CardDescription>
            Carica un documento PDF, DOCX o TXT per generare una presentazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 hover:bg-accent/50">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Trascina qui il tuo file</p>
            <p className="mt-1 text-sm text-muted-foreground">
              oppure clicca per selezionare
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              PDF, DOCX, TXT - Max 10 MB
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            La funzionalita' di upload sara' disponibile nello Sprint 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
