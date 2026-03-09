/**
 * Inject print-pdf mode into a Reveal.js HTML string.
 * Reveal.js renders all slides in a print-friendly layout when
 * the body has class "print-pdf" and the reveal.css print stylesheet is loaded.
 */
export function injectPrintMode(html: string): string {
  // Add print-pdf class to <body> and inject the Reveal print CSS
  const printCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/css/print/pdf.css" media="print">`;

  return html
    .replace(/<body([^>]*)>/, (_m, attrs: string) => {
      const hasClass = /class=["']([^"']*)["']/.test(attrs);
      if (hasClass) {
        return `<body${attrs.replace(/class=["']([^"']*)["']/, 'class="$1 print-pdf"')}>`;
      }
      return `<body${attrs} class="print-pdf">`;
    })
    .replace('</head>', `${printCss}\n</head>`);
}

/**
 * Open the HTML in a new window and trigger the browser print dialog.
 * User can then "Save as PDF" via the browser's print dialog.
 */
export function printAsPDF(html: string, filename: string) {
  const printHtml = injectPrintMode(html);
  const blob = new Blob([printHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');
  if (!win) {
    alert('Abilita i popup per questa pagina per esportare il PDF.');
    URL.revokeObjectURL(url);
    return;
  }

  win.addEventListener('load', () => {
    setTimeout(() => {
      win.document.title = filename;
      win.print();
      // Cleanup after print dialog closes
      win.addEventListener('afterprint', () => {
        win.close();
        URL.revokeObjectURL(url);
      });
    }, 1500); // Wait for Reveal.js to init
  });
}

/**
 * Download the HTML file directly.
 */
export function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
