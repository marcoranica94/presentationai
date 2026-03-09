import { FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            I Miei Progetti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Nessun progetto</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Carica un documento per creare il tuo primo progetto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
