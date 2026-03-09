import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Spinner } from '@/components/ui/Spinner';
import type { GeneratedContent } from '@/types';

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date();
}

export function SharePage() {
  const { contentId } = useParams<{ contentId: string }>();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) return;
    getDoc(doc(db, 'generated_content', contentId))
      .then((snap) => {
        if (!snap.exists()) { setError('Presentazione non trovata.'); return; }
        const data = snap.data() as Record<string, unknown> & { isPublic?: boolean };
        if (!data.isPublic) { setError('Questa presentazione non è pubblica.'); return; }
        setContent({ id: snap.id, ...data, createdAt: toDate(data.createdAt) } as GeneratedContent);
      })
      .catch(() => setError('Errore caricamento presentazione.'))
      .finally(() => setLoading(false));
  }, [contentId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Spinner className="h-8 w-8 text-white" />
    </div>
  );

  if (error || !content) return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center space-y-3">
        <p className="text-xl font-semibold">Presentazione non disponibile</p>
        <p className="text-white/60">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black">
      <iframe
        srcDoc={content.htmlContent}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin"
        title="Shared Presentation"
      />
    </div>
  );
}
