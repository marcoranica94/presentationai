import JSZip from 'jszip';

/**
 * Export each .section of the generated HTML as a 1080x1350 PNG (Instagram 4:5).
 * Strategy: open the page in a popup window (so scripts/charts render),
 * inject html2canvas + capture script, receive blobs via postMessage, ZIP them.
 */
export async function exportAsInstagram(
  htmlContent: string,
  filename: string,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<void> {
  const IG_W = 1080;
  const IG_H = 1350;

  const captureScript = `
<script>
(function() {
  function loadScript(src) {
    return new Promise(function(res) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; document.head.appendChild(s);
    });
  }

  window.__startCapture = async function() {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');

    var sections = Array.from(document.querySelectorAll('.section'));
    var total = sections.length;
    var results = [];

    for (var i = 0; i < total; i++) {
      var sec = sections[i];
      window.opener && window.opener.postMessage({ type: 'ig-progress', current: i + 1, total: total }, '*');

      var origStyle = { minHeight: sec.style.minHeight, height: sec.style.height, overflow: sec.style.overflow };
      sec.style.minHeight = '${IG_H}px';
      sec.style.height = '${IG_H}px';
      sec.style.overflow = 'hidden';

      var canvas = await html2canvas(sec, {
        width: ${IG_W}, height: ${IG_H}, scale: 2,
        useCORS: true, allowTaint: true, logging: false,
        windowWidth: ${IG_W},
      });

      var blob = await new Promise(function(res) { canvas.toBlob(res, 'image/png'); });
      results.push(blob);

      sec.style.minHeight = origStyle.minHeight;
      sec.style.height = origStyle.height;
      sec.style.overflow = origStyle.overflow;
    }

    window.opener && window.opener.postMessage({ type: 'ig-done', blobs: results }, '*');
  };

  window.addEventListener('message', function(e) {
    if (e.data === 'ig-start') window.__startCapture();
  });
})();
</script>`;

  const injectedHTML = htmlContent.replace('</body>', captureScript + '\n</body>');

  const popupWindow = window.open('', '_blank', `width=${IG_W},height=900,scrollbars=yes,toolbar=no,menubar=no`);
  if (!popupWindow) throw new Error('Popup bloccato dal browser. Abilita i popup per questo sito e riprova.');
  const popup: Window = popupWindow;

  popup.document.open();
  popup.document.write(injectedHTML);
  popup.document.close();

  // Wait for page + charts to fully render
  await new Promise<void>((resolve) => {
    const check = () => {
      if (popup.document.readyState === 'complete') resolve();
      else setTimeout(check, 200);
    };
    setTimeout(check, 500);
  });
  await new Promise((r) => setTimeout(r, 2500)); // extra time for Chart.js

  popup.postMessage('ig-start', '*');
  onProgress?.(0, 0, 'Avvio cattura sezioni...');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      popup.close();
      reject(new Error('Timeout esportazione Instagram. Riprova.'));
    }, 180_000);

    async function handler(e: MessageEvent) {
      if (e.source !== popup) return;

      if (e.data?.type === 'ig-progress') {
        onProgress?.(e.data.current, e.data.total, `Cattura sezione ${e.data.current}/${e.data.total}...`);
      } else if (e.data?.type === 'ig-done') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        popup.close();

        onProgress?.(e.data.blobs.length, e.data.blobs.length, 'Creazione ZIP...');

        const zip = new JSZip();
        (e.data.blobs as Blob[]).forEach((blob, i) => {
          zip.file(`post-${String(i + 1).padStart(2, '0')}.png`, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-instagram.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        resolve();
      }
    }

    window.addEventListener('message', handler);
  });
}
