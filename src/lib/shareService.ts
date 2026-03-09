import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export async function setContentPublic(contentId: string, isPublic: boolean) {
  await updateDoc(doc(db, 'generated_content', contentId), { isPublic });
}

export function buildShareUrl(contentId: string): string {
  const base = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return `${base}/#/share/${contentId}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
