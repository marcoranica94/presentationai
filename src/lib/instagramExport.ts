/**
 * Export each .section of the generated HTML as a 1080x1350 PNG (Instagram 4:5).
 * Strategy: open popup, capture + ZIP + download entirely inside the popup,
 * only send progress/completion notifications back to the opener.
 * This avoids Blob transfer across windows (unreliable in some browsers).
 */
export async function exportAsInstagram(
  htmlContent: string,
  filename: string,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<void> {
  const IG_W = 1080;
  const IG_H = 1350;
  const safeFilename = JSON.stringify(filename.replace(/[^a-z0-9_-]/gi, '_'));

  const captureScript = `
<script>
(function() {
  var __igFilename = ${safeFilename};

  function loadScript(src) {
    return new Promise(function(res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = function() { rej(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  window.__igCapture = async function() {
    try {
      // Load html2canvas and JSZip
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

      // Set page width to Instagram width
      document.body.style.width = '${IG_W}px';
      document.documentElement.style.width = '${IG_W}px';
      document.body.style.overflow = 'visible';

      var sections = Array.from(document.querySelectorAll('.section'));
      var total = sections.length;

      if (total === 0) {
        try { window.opener.postMessage({ type: 'ig-error', message: 'No sections found' }, '*'); } catch(e) {}
        return;
      }

      var zip = new JSZip();

      for (var i = 0; i < total; i++) {
        var sec = sections[i];

        try { window.opener.postMessage({ type: 'ig-progress', current: i + 1, total: total }, '*'); } catch(e) {}

        // Save original styles
        var origMinH = sec.style.minHeight;
        var origH    = sec.style.height;
        var origOv   = sec.style.overflow;

        // Force section to Instagram dimensions
        sec.style.minHeight = '${IG_H}px';
        sec.style.height    = '${IG_H}px';
        sec.style.overflow  = 'hidden';
        sec.style.width     = '${IG_W}px';

        var canvas = await html2canvas(sec, {
          width: ${IG_W},
          height: ${IG_H},
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          windowWidth: ${IG_W},
          x: sec.getBoundingClientRect().left,
          y: sec.getBoundingClientRect().top,
        });

        // Restore
        sec.style.minHeight = origMinH;
        sec.style.height    = origH;
        sec.style.overflow  = origOv;
        sec.style.width     = '';

        var blob = await new Promise(function(res) { canvas.toBlob(res, 'image/png', 0.95); });
        if (blob) {
          zip.file('post-' + String(i + 1).padStart(2, '0') + '.png', blob);
        }
      }

      // Generate + download ZIP from inside popup
      var zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      var url = URL.createObjectURL(zipBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = __igFilename + '-instagram.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try { window.opener.postMessage({ type: 'ig-done', count: total }, '*'); } catch(e) {}

      // Close popup after short delay
      setTimeout(function() { window.close(); }, 1500);

    } catch(err) {
      try { window.opener.postMessage({ type: 'ig-error', message: String(err) }, '*'); } catch(e) {}
    }
  };

  window.addEventListener('message', function(e) {
    if (e.data === 'ig-start') window.__igCapture();
  });
})();
</script>`;

  const injectedHTML = htmlContent.replace('</body>', captureScript + '\n</body>');

  // Open popup
  const popupWindow = window.open(
    '',
    '_blank',
    `width=${IG_W},height=900,scrollbars=yes,toolbar=no,menubar=no,resizable=yes`
  );
  if (!popupWindow) {
    throw new Error('Popup bloccato dal browser. Abilita i popup per questo sito nelle impostazioni del browser e riprova.');
  }
  const popup: Window = popupWindow;

  popup.document.open();
  popup.document.write(injectedHTML);
  popup.document.close();

  // Wait for page to be ready (charts need time to render)
  await new Promise<void>((resolve) => {
    const check = () => {
      if (popup.document.readyState === 'complete') resolve();
      else setTimeout(check, 200);
    };
    setTimeout(check, 500);
  });
  await new Promise((r) => setTimeout(r, 3000)); // extra time for Chart.js + fonts

  popup.postMessage('ig-start', '*');
  onProgress?.(0, 0, 'Avvio cattura sezioni...');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      try { popup.close(); } catch (_) {}
      reject(new Error('Timeout esportazione. Riprova.'));
    }, 300_000);

    function handler(e: MessageEvent) {
      if (e.source !== popup) return;

      if (e.data?.type === 'ig-progress') {
        onProgress?.(e.data.current, e.data.total, `Cattura sezione ${e.data.current}/${e.data.total}...`);
      } else if (e.data?.type === 'ig-done') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        onProgress?.(e.data.count, e.data.count, 'ZIP scaricato!');
        resolve();
      } else if (e.data?.type === 'ig-error') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        try { popup.close(); } catch (_) {}
        reject(new Error(e.data.message ?? 'Errore sconosciuto durante l\'esportazione.'));
      }
    }

    window.addEventListener('message', handler);
  });
}
