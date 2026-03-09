📊 DOCUMENTAZIONE TECNICA COMPLETA
Piattaforma AI per Generazione e Editing Presentazioni Web
Versione: 2.0Data: Marzo 2025Autore: Technical Documentation Team

📑 INDICE

Executive Summary
Requisiti Funzionali
Requisiti Non Funzionali
Architettura Sistema
Stack Tecnologico
Database Schema
API e Integrazioni
Editor Visuale
Pubblicazione
Sicurezza
Costi
Piano di Sviluppo


🎯 EXECUTIVE SUMMARY
Obiettivo del Progetto
Creare una piattaforma web completa che permetta di:

Caricare documenti (PDF, DOCX, TXT)
Generare automaticamente presentazioni web interattive tramite AI
Modificare visualmente le presentazioni con editor drag-and-drop
Pubblicare online con un click
Esportare in PDF e immagini

Caratteristiche Principali
✅ Autenticazione sicura (GitHub OAuth + codice personale)✅ AI-powered generation (Claude 3.5 Sonnet)✅ Editor visuale completo (GrapesJS)✅ Librerie moderne (Reveal.js, Chart.js, AOS, Particles.js)✅ Export client-side (PDF/PNG senza server)✅ Pubblicazione automatica (Netlify)✅ Costi minimi ($9-11/mese)
Architettura
Frontend (GitHub Pages)
↕
Firebase Backend (Auth, Firestore, Storage, Functions)
↕
External APIs (Claude, DALL-E, Netlify)

Budget Mensile
Infrastruttura: $0 (tier gratuiti)
Claude API: $9/mese (100 generazioni)
DALL-E (opzionale): $2/mese (10 immagini)
TOTALE: $9-11/mese


📋 REQUISITI FUNZIONALI
RF-001: Autenticazione a Doppio Livello
Priorità: AltaEpic: Sicurezza e Accesso
Descrizione:Sistema di autenticazione che combina GitHub OAuth con un codice di accesso personale per garantire accesso esclusivo.
User Story:
Come utente autorizzato
Voglio accedere con GitHub e un codice personale
Per garantire che solo io possa usare la piattaforma

Flusso Dettagliato:

Landing Page

Pulsante "Login con GitHub"
Breve descrizione servizio
Link a documentazione


GitHub OAuth

Redirect a https://github.com/login/oauth/authorize
Scope richiesti: user:email, read:user
Callback URL: https://username.github.io/app/callback


Verifica Whitelist

Controllo username GitHub in Firestore
Collection: users
Field: githubUsername
Se non autorizzato → Messaggio errore + logout


Richiesta Codice Accesso

Modal con input codice (6 cifre)
Primo accesso: "Imposta il tuo codice"
Accessi successivi: "Inserisci codice"
Max 5 tentativi → Lockout 15 minuti


Verifica Codice

Hash SHA-256 del codice inserito
Confronto con hash salvato in Firestore
Se corretto → Creazione sessione JWT


Sessione Persistente

JWT salvato in localStorage
Durata: 7 giorni
Refresh automatico se attivo
Logout manuale disponibile



Validazioni:

Username GitHub deve corrispondere esattamente
Codice deve essere 6 cifre numeriche
Hash SHA-256 con salt univoco per utente
Token GitHub valido e non scaduto
Rate limiting: max 10 tentativi login/ora

Gestione Errori:

Username non autorizzato → "Accesso negato"
Codice errato → "Codice non valido (X tentativi rimasti)"
Troppi tentativi → "Account temporaneamente bloccato"
Token scaduto → Redirect a login

Tecnologie:

Firebase Authentication (GitHub Provider)
Firestore (whitelist e hash)
crypto-js (SHA-256 hashing)
JWT (sessione client)


RF-002: Upload e Processing Documenti
Priorità: AltaEpic: Gestione Documenti
Descrizione:Sistema di caricamento documenti con parsing automatico del contenuto tramite Cloud Functions.
User Story:
Come utente
Voglio caricare un documento PDF/DOCX/TXT
Per generare automaticamente una presentazione

Formati Supportati:



Formato
Estensione
Max Size
MIME Type
Libreria Parser



PDF
.pdf
10 MB
application/pdf
pdf-parse


Word
.docx
10 MB
application/vnd.openxmlformats-officedocument.wordprocessingml.document
mammoth.js


Testo
.txt
5 MB
text/plain
native


Flusso Dettagliato:

UI Upload

Componente drag-and-drop
Click per selezionare file
Preview file selezionato (nome, icona, dimensione)
Progress bar durante upload


Validazione Client-Side
Controlli:
- Tipo MIME corretto
- Dimensione entro limiti
- Estensione valida
- Nome file valido (no caratteri speciali)


Upload Firebase Storage
Path: /documents/{userId}/{timestamp}-{filename}
Metadata:
- contentType: MIME type
- customMetadata: { uploadedBy: userId, originalName: filename }


Creazione Record Firestore
Collection: projects
Document: auto-generated ID
Initial status: "uploading"


Trigger Cloud Function
Function: processDocument
Trigger: Storage onFinalize
Automatic execution quando upload completo


Download in Function
Bucket.file(storagePath).download()
Buffer in memoria (max 10 MB)


Parsing Documento
PDF (pdf-parse):
- Estrazione testo per pagina
- Rilevamento layout (colonne, tabelle)
- Estrazione metadata (autore, titolo, data)
- Gestione font embedded
- OCR se immagini (opzionale)

DOCX (mammoth.js):
- Estrazione testo con formattazione base
- Conversione heading → H1-H6
- Liste ordered/unordered
- Tabelle → HTML table
- Immagini → estrazione separata

TXT:
- Lettura diretta UTF-8
- Rilevamento encoding automatico
- Normalizzazione line breaks


Analisi Contenuto
Statistiche:
- Word count (split by whitespace)
- Paragraph count (split by \n\n)
- Page count (per PDF)
- Character count

Rilevamento Lingua:
- Analisi frequenza parole
- Confronto con dizionari IT/EN
- Confidence score

Estrazione Struttura:
- Titoli/Heading (regex pattern)
- Sezioni (numerazione, indentazione)
- Liste (bullet points)
- Citazioni (quote markers)

Generazione Preview:
- Primi 500 caratteri
- Sanitizzazione HTML
- Truncate parole intere


Salvataggio Dati Estratti
Update Firestore project:
- extractedText: string (full content)
- metadata: object (statistics)
- status: "ready"
- processedAt: timestamp


Notifica Client
Firestore onSnapshot listener
Real-time update quando status cambia
UI mostra "Pronto per generazione"



Output Metadata Esempio:
{
"projectId": "proj_abc123",
"userId": "user_xyz789",
"originalFile": {
"name": "Marketing_Report_Q1.pdf",
"size": 2048576,
"type": "application/pdf",
"storagePath": "/documents/user_xyz789/1710345600-Marketing_Report_Q1.pdf",
"uploadedAt": "2024-03-13T10:00:00Z"
},
"extractedText": "# Marketing Report Q1 2024\n\nExecutive Summary...",
"metadata": {
"wordCount": 1234,
"pageCount": 5,
"paragraphCount": 45,
"characterCount": 8567,
"language": "it",
"languageConfidence": 0.95,
"detectedSections": [
"Executive Summary",
"Market Analysis",
"Sales Performance",
"Conclusions"
],
"hasImages": true,
"hasTables": true,
"hasCharts": false,
"uploadedAt": "2024-03-13T10:00:00Z",
"processedAt": "2024-03-13T10:00:15Z",
"processingTime": 15000
},
"status": "ready",
"createdAt": "2024-03-13T10:00:00Z",
"updatedAt": "2024-03-13T10:00:15Z"
}

Gestione Errori:



Errore
Causa
Messaggio
Azione



File corrotto
PDF/DOCX danneggiato
"File non leggibile"
Richiedi nuovo upload


Formato non supportato
Estensione errata
"Formato non valido"
Mostra formati supportati


Dimensione eccessiva
> 10 MB
"File troppo grande"
Suggerisci compressione


Timeout processing
> 120s
"Elaborazione fallita"
Retry automatico (max 3)


Testo non estratto
PDF immagine
"Contenuto non rilevato"
Suggerisci OCR o conversione


Performance:

Processing time medio: 10-20 secondi
Timeout: 120 secondi
Retry automatico: max 3 tentativi
Concurrent processing: max 5 documenti


RF-003: Generazione HTML con AI
Priorità: AltaEpic: AI Generation
Descrizione:Generazione automatica di presentazione HTML interattiva utilizzando Claude AI e librerie moderne.
User Story:
Come utente
Voglio generare una presentazione web dal mio documento
Per avere slide professionali automaticamente

Librerie Integrate:



Libreria
Versione
Scopo
CDN
Dimensione



Reveal.js
5.0.4
Framework presentazioni
jsdelivr
150 KB


AOS
2.3.4
Animazioni on-scroll
jsdelivr
15 KB


Chart.js
4.4.0
Grafici interattivi
jsdelivr
200 KB


CountUp.js
2.8.0
Numeri animati
jsdelivr
10 KB


Particles.js
2.0.0
Sfondi animati
jsdelivr
30 KB


Typed.js
2.1.0
Effetto typing
jsdelivr
15 KB


Lucide Icons
latest
Icone SVG
unpkg
50 KB


Flusso Generazione:

Selezione Progetto

Dashboard mostra progetti "ready"
Click su "Genera Pagina Web"


Modal Configurazione
┌─────────────────────────────────────────┐
│ Configurazione Presentazione            │
├─────────────────────────────────────────┤
│                                         │
│ Stile Visivo:                           │
│ ○ Modern (gradients, colori vivaci)    │
│ ○ Minimal (bianco/nero, elegante)      │
│ ○ Professional (corporate, sobrio)     │
│ ○ Creative (asimmetrico, audace)       │
│                                         │
│ Palette Colori:                         │
│ ○ Blu/Viola (default)                  │
│ ○ Verde/Teal                           │
│ ○ Arancione/Rosso                      │
│ ○ Monocromatico                        │
│ ○ Custom [🎨 Scegli colori]           │
│                                         │
│ Numero Slide:                           │
│ ○ Automatico (8-12)                    │
│ ○ Manuale: [10] slide                  │
│                                         │
│ Librerie Opzionali:                     │
│ ☑ Chart.js (grafici)                   │
│ ☑ Particles.js (hero background)       │
│ ☑ Typed.js (effetto typing)            │
│ ☑ CountUp.js (numeri animati)          │
│                                         │
│ Animazioni AOS:                         │
│ Intensità: ○ Bassa ● Media ○ Alta     │
│                                         │
│ [Annulla] [Genera Presentazione →]     │
└─────────────────────────────────────────┘


Preparazione Prompt Claude
System Prompt:
Sei un esperto web designer specializzato in presentazioni interattive.

COMPITO:
Crea una presentazione HTML completa utilizzando Reveal.js e librerie moderne.

REQUISITI TECNICI OBBLIGATORI:
1. Framework base: Reveal.js 5.0.4
2. Animazioni: AOS (Animate On Scroll)
3. Grafici: Chart.js (solo se dati numerici presenti)
4. Statistiche: CountUp.js (per numeri importanti)
5. Hero background: Particles.js
6. Effetti: Typed.js (opzionale)
7. Icone: Lucide Icons

STRUTTURA HTML:
- DOCTYPE html5 completo
- Meta tags (viewport, description, og:tags)
- Tutti script CDN (jsdelivr/unpkg)
- CSS inline completo
- JavaScript inizializzazione
- Responsive mobile-first
- Dark mode support

LAYOUT SLIDE OBBLIGATORIO:
1. Hero (particles.js, titolo grande, sottotitolo)
2. Agenda (bullet points con AOS)
   3-N. Contenuto (layout variabili)
4. Statistiche (se dati presenti)
5. Quote (se citazioni)
6. Conclusioni
7. Call to Action

ANIMAZIONI:
- data-aos su tutti elementi
- Delay progressivi (100ms, 200ms...)
- Fragment class per bullet points
- Transizioni Reveal.js

OUTPUT:
Solo codice HTML, niente spiegazioni.

User Prompt Template:
Crea presentazione web da questo documento.

DOCUMENTO:
{extractedText}

CONFIGURAZIONE:
- Stile: {style}
- Palette: {palette}
- Slide: {slideCount}
- Librerie: {libraries}

ISTRUZIONI:
- 1 slide = 1 concetto chiave
- Layout variabili (evita monotonia)
- Grafici Chart.js se dati numerici
- CountUp se statistiche
- Quote slide se citazioni
- Hero con particles.js
- CTA finale con Typed.js

Genera HTML standalone completo.


Chiamata Claude API
Endpoint: https://api.anthropic.com/v1/messages
Request:
{
"model": "claude-3-5-sonnet-20241022",
"max_tokens": 8000,
"temperature": 0.7,
"system": "{system_prompt}",
"messages": [{
"role": "user",
"content": "{user_prompt}"
}]
}

Headers:
x-api-key: {ANTHROPIC_API_KEY}
anthropic-version: 2023-06-01
content-type: application/json


Parsing Risposta
- Estrazione HTML da response.content[0].text
- Rimozione markdown code blocks (```)
- Validazione HTML5 (html-validator)
- Verifica presenza librerie CDN


Post-Processing
Ottimizzazioni:
- Minification HTML (html-minifier)
- Compressione CSS inline
- Rimozione commenti
- Ottimizzazione whitespace

Injection:
- Meta tags SEO completi
- Favicon (base64 inline)
- Analytics snippet (opzionale)
- Service Worker (opzionale)

Validazioni:
- HTML5 validator
- CSS validator
- JavaScript syntax check
- Accessibility check (WCAG)


Salvataggio Storage
Path: /generated/{userId}/html/{projectId}-{timestamp}.html
Metadata:
- contentType: text/html
- customMetadata: {
  projectId,
  style,
  palette,
  slideCount,
  libraries: JSON.stringify(libraries)
  }


Creazione Record Firestore
Collection: generated_content
Document: auto-generated
Data: {
projectId,
userId,
type: 'html',
storagePath,
metadata: {
style,
palette,
slideCount,
fileSize,
libraries,
generatedAt
}
}


Generazione Signed URL
Valido: 24 ore
Action: read
URL: https://storage.googleapis.com/...


Response al Client
{
"success": true,
"contentId": "content_abc123",
"downloadUrl": "https://...",
"previewUrl": "https://...",
"metadata": {
"slideCount": 12,
"fileSize": 245678,
"libraries": ["reveal", "aos", "chart", "particles"]
}
}



Struttura HTML Generata (Template):
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITOLO}}</title>

  <!-- SEO -->
  <meta name="description" content="{{DESCRIZIONE}}">
  <meta property="og:title" content="{{TITOLO}}">
  <meta property="og:description" content="{{DESCRIZIONE}}">
  <meta property="og:type" content="article">

  <!-- Reveal.js -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/white.css">

  <!-- AOS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css">

  <!-- Custom Styles -->
  <style>
    /* CSS personalizzato inline */
  </style>
</head>
<body>

  <div class="reveal">
    <div class="slides">

      <!-- Slide 1: Hero -->
      <section class="hero-slide">
        <div id="particles-js"></div>
        <h1 data-aos="fade-up">{{TITOLO}}</h1>
        <p data-aos="fade-up" data-aos-delay="200">{{SOTTOTITOLO}}</p>
      </section>
      
      <!-- Slide 2-N: Content -->
      <!-- ... -->
      
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/countup.js@2.8.0/dist/countUp.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/typed.js@2.1.0/dist/typed.umd.js"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

  <script>
    // Inizializzazione librerie
  </script>
</body>
</html>

Caratteristiche HTML:
Reveal.js Features:

Slide verticali/orizzontali
Transizioni: slide, zoom, fade, convex, concave
Navigation: keyboard, touch, mouse wheel
Progress bar
Slide numbers
Overview mode (ESC)
Fullscreen (F)
Speaker notes
Auto-slide (opzionale)

AOS Animations:

fade-up, fade-down, fade-left, fade-right
slide-up, slide-down, slide-left, slide-right
zoom-in, zoom-out
flip-up, flip-down
Delay progressivi
Duration personalizzabile

Chart.js Types:

Line, Bar, Pie, Doughnut
Radar, Polar Area
Scatter, Bubble
Animazioni smooth
Responsive
Tooltips interattivi

CountUp.js:

Animazione numeri da 0 a valore
Separatori migliaia
Decimali
Prefissi/suffissi (€, %, +)
Trigger on-scroll

Particles.js:

Particelle animate
Connessioni tra particelle
Interattività mouse
Configurazione densità/velocità

Typed.js:

Testo che si scrive
Multiple strings con loop
Velocità personalizzabile
Cursore animato

Performance:

Lighthouse score target: > 90
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
Total bundle size: ~500 KB (con tutte librerie)

Costi AI:
Input medio: 10K tokens (documento) = $0.03
Output medio: 4K tokens (HTML) = $0.06
TOTALE per generazione: $0.09

100 generazioni/mese = $9


RF-004: Export PDF Client-Side
Priorità: MediaEpic: Export e Condivisione
Descrizione:Conversione HTML in PDF multi-pagina completamente client-side, senza server.
User Story:
Come utente
Voglio esportare la presentazione in PDF
Per condividerla o stamparla offline

Tecnologia: html2pdf.js
Caratteristiche:

✅ Completamente client-side (zero costi server)
✅ Basata su jsPDF + html2canvas
✅ Supporto CSS completo
✅ Fonts embedded
✅ Immagini/grafici inclusi
✅ Page-break automatico

CDN:
https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js

Dimensione: 120 KB
Flusso Export:

Click "Esporta PDF"

Button nella dashboard o viewer


Modal Configurazione
┌─────────────────────────────────────┐
│ Esporta PDF                         │
├─────────────────────────────────────┤
│                                     │
│ Formato Pagina:                     │
│ ○ A4 (210 x 297 mm)                │
│ ○ Letter (216 x 279 mm)            │
│ ○ A3 (297 x 420 mm)                │
│                                     │
│ Orientamento:                       │
│ ○ Portrait (verticale)             │
│ ○ Landscape (orizzontale)          │
│                                     │
│ Margini:                            │
│ ○ Piccoli (5mm)                    │
│ ○ Medi (10mm)                      │
│ ○ Grandi (20mm)                    │
│ ○ Nessuno (0mm)                    │
│                                     │
│ Qualità Immagini:                   │
│ ○ Alta (100%)                      │
│ ○ Media (80%)                      │
│ ○ Bassa (60%)                      │
│                                     │
│ Slide da Esportare:                 │
│ ○ Tutte (12 slide)                 │
│ ○ Solo alcune: [1,3,5,7]           │
│                                     │
│ [Annulla] [Genera PDF →]           │
└─────────────────────────────────────┘


Preparazione HTML
// Carica HTML della presentazione
const htmlElement = document.querySelector('.reveal');

// Applica CSS per stampa
const printStyles = `
  @media print {
    .slide {
      page-break-after: always;
      page-break-inside: avoid;
    }
    .slide:last-child {
      page-break-after: auto;
    }
    .nav-dots, .progress-bar {
      display: none !important;
    }
  }
`;


Configurazione html2pdf
const options = {
margin: [10, 10, 10, 10], // mm [top, right, bottom, left]
filename: 'presentazione.pdf',
image: {
type: 'jpeg',
quality: 0.98
},
html2canvas: {
scale: 2,              // Retina quality
useCORS: true,         // Cross-origin images
logging: false,
letterRendering: true
},
jsPDF: {
unit: 'mm',
format: 'a4',
orientation: 'portrait',
compress: true
},
pagebreak: {
mode: ['avoid-all', 'css', 'legacy'],
before: '.slide',
after: '.slide',
avoid: '.no-break'
}
};


Generazione PDF
// Progress indicator
showProgress('Generazione PDF in corso...');

// Generate
html2pdf()
.set(options)
.from(htmlElement)
.toPdf()
.get('pdf')
.then(pdf => {
// Metadata
pdf.setProperties({
title: 'Presentazione',
subject: 'Generato con GammaClone',
author: 'User',
keywords: 'presentation, slides',
creator: 'GammaClone'
});
})
.save()
.then(() => {
hideProgress();
showSuccess('PDF scaricato con successo!');
})
.catch(error => {
hideProgress();
showError('Errore generazione PDF');
});


Download Automatico

Browser scarica file presentazione.pdf
Dimensione tipica: 2-5 MB (12 slide)



Gestione Slide:
Ogni .slide diventa una pagina PDF separata:
@media print {
.slide {
page-break-after: always;
page-break-inside: avoid;
min-height: 100vh;
}

.slide:last-child {
page-break-after: auto;
}

/* Nascondi elementi UI */
.nav-dots,
.progress-bar,
.controls {
display: none !important;
}

/* Ottimizza per stampa */
body {
background: white;
}

.slide {
background: white;
color: black;
}
}

Opzioni Avanzate:



Opzione
Valori
Descrizione



format
a4, letter, a3, [w,h]
Dimensione pagina


orientation
portrait, landscape
Orientamento


margin
[t,r,b,l] in mm
Margini


image.quality
0-1
Qualità JPEG


html2canvas.scale
1-4
Risoluzione (2=retina)


jsPDF.compress
boolean
Compressione PDF


Performance:

Tempo generazione: 5-15 secondi (12 slide)
Dimensione file: 2-5 MB
Qualità: Alta (equivalente 300 DPI)

Vantaggi vs Server-Side:

⚡ Nessun upload/download
💰 Zero costi server
🔒 Privacy totale (tutto in browser)
📱 Funziona offline
🚀 Nessun timeout


RF-005: Export Immagini Client-Side
Priorità: MediaEpic: Export e Condivisione
Descrizione:Generazione immagini PNG/JPG per ogni slide, completamente client-side.
User Story:
Come utente
Voglio esportare ogni slide come immagine
Per condividerle sui social o usarle altrove

Tecnologie:

html2canvas (screenshot HTML)
JSZip (creazione ZIP)
FileSaver.js (download)

CDN:
html2canvas: https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
JSZip: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
FileSaver: https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

Dimensioni: 80 KB + 100 KB + 5 KB = 185 KB totale
Flusso Export:

Click "Esporta Immagini"

Modal Configurazione
┌─────────────────────────────────────────┐
│ Esporta Immagini                        │
├─────────────────────────────────────────┤
│                                         │
│ Formato:                                │
│ ○ PNG (lossless, trasparenza)          │
│ ○ JPG (compresso, no trasparenza)      │
│ ○ WebP (moderno, compresso)            │
│                                         │
│ Qualità (JPG/WebP):                     │
│ ▓▓▓▓▓▓▓▓░░ 80%                         │
│                                         │
│ Dimensioni:                             │
│ ○ Full HD (1920 x 1080)                │
│ ○ 4K (3840 x 2160)                     │
│ ○ Social Media (1200 x 630)            │
│ ○ Instagram Post (1080 x 1080)         │
│ ○ Instagram Story (1080 x 1920)        │
│ ○ Custom: [____] x [____]              │
│                                         │
│ Opzioni:                                │
│ ☑ Retina (2x resolution)               │
│ ☐ Sfondo trasparente (solo PNG)        │
│ ☐ Watermark: [Testo...]                │
│                                         │
│ Esporta:                                │
│ ○ Tutte le slide (12)                  │
│ ○ Solo alcune: [1,3,5,7]               │
│                                         │
│ Formato Download:                       │
│ ○ ZIP con tutte le immagini            │
│ ○ Singole immagini                     │
│                                         │
│ [Annulla] [Genera Immagini →]          │
└─────────────────────────────────────────┘


Iterazione Slide
const slides = document.querySelectorAll('.slide');
const images = [];

for (let i = 0; i < slides.length; i++) {
// Progress update
updateProgress(`Slide ${i+1}/${slides.length}`);

// Scroll to slide
slides[i].scrollIntoView({ behavior: 'auto' });

// Wait for animations
await sleep(800);

// Capture
const canvas = await html2canvas(slides[i], {
allowTaint: false,
useCORS: true,
scale: retina ? 2 : 1,
width: dimensions.width,
height: dimensions.height,
backgroundColor: transparent ? null : '#ffffff',
logging: false,
imageTimeout: 15000
});

// Convert to blob
const blob = await canvasToBlob(canvas, format, quality);

images.push({
slideNumber: i + 1,
blob: blob,
size: blob.size
});
}


Conversione Formato
function canvasToBlob(canvas, format, quality) {
return new Promise((resolve) => {
switch(format) {
case 'png':
canvas.toBlob(resolve, 'image/png', 1.0);
break;
case 'jpg':
canvas.toBlob(resolve, 'image/jpeg', quality);
break;
case 'webp':
canvas.toBlob(resolve, 'image/webp', quality);
break;
}
});
}


Watermark (Opzionale)
if (watermark) {
const ctx = canvas.getContext('2d');

// Font settings
ctx.font = '24px Arial';
ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
ctx.textAlign = 'right';
ctx.textBaseline = 'bottom';

// Shadow for readability
ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
ctx.shadowBlur = 4;

// Draw text
ctx.fillText(
watermarkText,
canvas.width - 20,
canvas.height - 20
);
}


Creazione ZIP
const zip = new JSZip();

// Add images
for (const img of images) {
const filename = `slide-${String(img.slideNumber).padStart(2, '0')}.${format}`;
zip.file(filename, img.blob);
}

// Generate ZIP
const zipBlob = await zip.generateAsync({
type: 'blob',
compression: 'DEFLATE',
compressionOptions: { level: 9 }
});


Download
// Download ZIP
saveAs(zipBlob, 'presentazione-images.zip');

// Or download individual images
for (const img of images) {
const filename = `slide-${img.slideNumber}.${format}`;
saveAs(img.blob, filename);
}



Ottimizzazione Qualità/Dimensione:



Formato
Qualità
Dimensione Media (1920x1080)
Uso Consigliato



PNG
Lossless
2-3 MB
Stampa, editing, trasparenze


JPG 90%
Alta
800 KB
Presentazioni, web


JPG 80%
Buona
400 KB
Email, condivisione


JPG 60%
Media
200 KB
Social media, preview


WebP 80%
Alta
300 KB
Web moderno, performance


Preset Dimensioni:



Preset
Dimensioni
Aspect Ratio
Uso



Full HD
1920 x 1080
16:9
Standard presentation


4K
3840 x 2160
16:9
High quality


Social Media
1200 x 630
1.91:1
Facebook, Twitter, LinkedIn


Instagram Post
1080 x 1080
1:1
Instagram feed


Instagram Story
1080 x 1920
9:16
Instagram/Facebook stories


YouTube Thumbnail
1280 x 720
16:9
YouTube


Performance:

Tempo per slide: 1-2 secondi
Totale 12 slide: 15-25 secondi
Dimensione ZIP: 5-15 MB (dipende da formato/qualità)

Vantaggi:

⚡ Veloce (tutto in browser)
💰 Zero costi
🔒 Privacy (nessun upload)
📱 Funziona offline
🎨 Qualità perfetta (rendering nativo)


RF-006: Pubblicazione Online (Netlify)
Priorità: AltaEpic: Export e Condivisione
Descrizione:Deploy automatico della presentazione HTML su Netlify per URL pubblico.
User Story:
Come utente
Voglio pubblicare la presentazione online
Per condividerla con un link pubblico

Tecnologia: Netlify API
Caratteristiche Netlify (Free Tier):

✅ Bandwidth: 100 GB/mese
✅ Sites: Illimitati
✅ Deploy: Illimitati
✅ SSL automatico (HTTPS)
✅ CDN globale
✅ Custom domain
✅ Deploy preview
✅ Rollback versioni

Flusso Pubblicazione:

Click "Pubblica Online"

Modal Configurazione
┌─────────────────────────────────────────┐
│ Pubblica Presentazione Online           │
├─────────────────────────────────────────┤
│                                         │
│ La tua presentazione sarà accessibile   │
│ pubblicamente tramite un link.          │
│                                         │
│ Nome Sito (opzionale):                  │
│ [presentazione-marketing]               │
│                                         │
│ URL Risultante:                         │
│ presentazione-marketing.netlify.app     │
│ oppure                                  │
│ random-name-123.netlify.app             │
│                                         │
│ Custom Domain (opzionale):              │
│ [____________].tuodominio.com           │
│                                         │
│ Opzioni:                                │
│ ☑ Abilita tracking visualizzazioni     │
│ ☐ Richiedi password per accesso        │
│   Password: [__________]                │
│ ☐ Aggiungi watermark                   │
│   Testo: [Creato con GammaClone]       │
│                                         │
│ ⚠️ La presentazione sarà pubblica e    │
│    indicizzabile dai motori di ricerca.│
│                                         │
│ [Annulla] [Pubblica →]                 │
└─────────────────────────────────────────┘


Cloud Function: publishToNetlify
Trigger: HTTPS Callable
Input:
{
contentId: string,
siteName?: string,
customDomain?: string,
password?: string,
watermark?: string,
trackViews: boolean
}


Preparazione HTML
// Recupera HTML da Storage
const htmlContent = await getHTMLContent(contentId);

// Aggiungi watermark se richiesto
if (watermark) {
htmlContent = injectWatermark(htmlContent, watermark);
}

// Aggiungi password protection se richiesto
if (password) {
htmlContent = wrapWithPasswordProtection(htmlContent, password);
}

// Aggiungi tracking se richiesto
if (trackViews) {
htmlContent = injectViewTracking(htmlContent, contentId);
}


Creazione ZIP
const zip = new JSZip();
zip.file('index.html', htmlContent);

// Aggiungi file aggiuntivi se necessario
if (customAssets) {
zip.file('assets/logo.png', logoBlob);
}

const zipBlob = await zip.generateAsync({ type: 'blob' });


Deploy Netlify API
Endpoint: https://api.netlify.com/api/v1/sites
Step 1: Crea Site
const createSiteResponse = await fetch(
'https://api.netlify.com/api/v1/sites',
{
method: 'POST',
headers: {
'Authorization': `Bearer ${NETLIFY_TOKEN}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
name: siteName || generateRandomName(),
custom_domain: customDomain || null
})
}
);

const site = await createSiteResponse.json();
const siteId = site.id;

Step 2: Deploy Files
const deployResponse = await fetch(
`https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
{
method: 'POST',
headers: {
'Authorization': `Bearer ${NETLIFY_TOKEN}`,
'Content-Type': 'application/zip'
},
body: zipBlob
}
);

const deploy = await deployResponse.json();

Step 3: Attendi Deploy
let deployStatus = 'building';
while (deployStatus === 'building') {
await sleep(2000);

const statusResponse = await fetch(
`https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deploy.id}`,
{
headers: {
'Authorization': `Bearer ${NETLIFY_TOKEN}`
}
}
);

const status = await statusResponse.json();
deployStatus = status.state;
}


Salvataggio Firestore
await db.collection('generated_content').doc(contentId).update({
published: {
isPublic: true,
publicUrl: `https://${site.name}.netlify.app`,
provider: 'netlify',
siteId: siteId,
deployId: deploy.id,
deployedAt: admin.firestore.FieldValue.serverTimestamp(),
stats: {
views: 0,
lastViewedAt: null
}
}
});


Response al Client
{
"success": true,
"publicUrl": "https://presentazione-marketing.netlify.app",
"siteId": "abc123",
"deployTime": 15,
"qrCode": "data:image/png;base64,..."
}


UI Risultato
┌─────────────────────────────────────────┐
│ ✅ Presentazione Pubblicata!            │
├─────────────────────────────────────────┤
│                                         │
│ URL Pubblico:                           │
│ https://presentazione-marketing         │
│        .netlify.app                     │
│ [📋 Copia Link] [🔗 Apri]              │
│                                         │
│ QR Code:                                │
│ ┌─────────────┐                        │
│ │ [QR IMAGE]  │                        │
│ └─────────────┘                        │
│ [⬇️ Scarica QR]                        │
│                                         │
│ Condividi:                              │
│ [Twitter] [LinkedIn] [Facebook] [Email]│
│                                         │
│ Gestione:                               │
│ • Visualizzazioni: 0                   │
│ • Pubblicato: 2 minuti fa              │
│ • Provider: Netlify                    │
│                                         │
│ [Modifica] [Rimuovi] [Chiudi]          │
└─────────────────────────────────────────┘



Funzionalità Aggiuntive:
Password Protection:
<!-- Wrapper con password -->
<div id="password-gate">
  <div class="password-modal">
    <h2>Presentazione Protetta</h2>
    <input type="password" id="pwd-input" placeholder="Inserisci password">
    <button onclick="checkPassword()">Accedi</button>
  </div>
</div>

<div id="content" style="display:none;">
  <!-- HTML presentazione -->
</div>

<script>
  function checkPassword() {
    const input = document.getElementById('pwd-input').value;
    const hash = sha256(input);
    if (hash === '{{PASSWORD_HASH}}') {
      document.getElementById('password-gate').style.display = 'none';
      document.getElementById('content').style.display = 'block';
    } else {
      alert('Password errata');
    }
  }
</script>

View Tracking:
<script>
  // Track view
  fetch('https://us-central1-{project}.cloudfunctions.net/trackView', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId: '{{CONTENT_ID}}',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    })
  });
</script>

QR Code Generation:
// Usa libreria qrcode.js
import QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(publicUrl, {
width: 300,
margin: 2,
color: {
dark: '#000000',
light: '#ffffff'
}
});

Gestione Pubblicazioni:
Dashboard mostra lista presentazioni pubblicate:
┌─────────────────────────────────────────────┐
│ Presentazioni Pubblicate (5)                │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Marketing Report Q1                 │   │
│ │ https://marketing-q1.netlify.app    │   │
│ │ 👁️ 156 views • Pubblicato 5 gg fa   │   │
│ │ [🔗 Apri] [✏️ Modifica] [🗑️ Elimina] │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Product Launch                      │   │
│ │ https://product-launch.netlify.app  │   │
│ │ 👁️ 89 views • Pubblicato 2 sett fa  │   │
│ │ [🔗 Apri] [✏️ Modifica] [🗑️ Elimina] │   │
│ └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

Azioni:

Apri: Nuova tab con presentazione
Modifica: Apre editor (vedi RF-007)
Elimina: Rimuove site da Netlify + record Firestore

Costi:

✅ Netlify Free Tier: 100 GB bandwidth/mese
✅ Stima: 1 presentazione = 500 KB
✅ 100 GB = ~200,000 visualizzazioni/mese
✅ Ampiamente sufficiente per uso personale


RF-007: Editor Visuale (GrapesJS)
Priorità: AltaEpic: Editor e Personalizzazione
Descrizione:Editor drag-and-drop completo per modificare visualmente la presentazione HTML generata.
User Story:
Come utente
Voglio modificare la presentazione generata
Per personalizzarla senza scrivere codice

Tecnologia: GrapesJS
Caratteristiche:

✅ Drag &amp; drop completo
✅ WYSIWYG editor
✅ Component-based
✅ Style Manager visuale
✅ Asset Manager
✅ Layer Manager
✅ Responsive preview
✅ Undo/Redo
✅ Auto-save
✅ Export HTML pulito

CDN:
CSS: https://unpkg.com/grapesjs@0.21.7/dist/css/grapes.min.css
JS: https://unpkg.com/grapesjs@0.21.7/dist/grapes.min.js

Plugin:
grapesjs-blocks-basic: Blocchi base
grapesjs-preset-webpage: Preset webpage
grapesjs-plugin-forms: Form builder
grapesjs-charts: Chart.js integration
grapesjs-typed: Typed.js integration

Dimensione Totale: ~300 KB (core + plugin)
Interfaccia Editor:
┌──────────────────────────────────────────────────────────────┐
│  [Logo] Editor Presentazione          [Save] [Preview] [×]   │
├──────┬───────────────────────────────────────────────┬───────┤
│      │                                               │       │
│      │                                               │       │
│ BLO  │              CANVAS (Slide)                   │ LAYER │
│ CKS  │                                               │   S   │
│      │  ┌─────────────────────────────────────┐     │       │
│ 📝   │  │                                     │     │ Slide │
│ Text │  │   [Drag components here]            │     │  1    │
│      │  │                                     │     │  ├─H1 │
│ 🖼️   │  │                                     │     │  ├─P  │
│Image │  │                                     │     │  └─Btn│
│      │  │                                     │     │       │
│ 📊   │  └─────────────────────────────────────┘     │ Slide │
│Chart │                                               │  2    │
│      │                                               │  ├─H2 │
│ 🎬   │                                               │  └─Img│
│Video │                                               │       │
│      │                                               │ [+Add]│
│ 🔘   │                                               │       │
│Button│                                               │       │
│      │                                               │       │
├──────┴───────────────────────────────────────────────┴───────┤
│                    STYLE MANAGER                              │
│  [Typography] [Colors] [Spacing] [Border] [Effects]          │
│                                                               │
│  Font Size: [24] px                                          │
│  Color: [🎨 #2D3748]                                         │
│  Margin: [10] px                                             │
└───────────────────────────────────────────────────────────────┘

Componenti Personalizzati:
1. Slide Component
   Descrizione: Contenitore slide con proprietà Reveal.js
   Traits (Proprietà):
   ┌─────────────────────────────────┐
   │ Slide Settings                  │
   ├─────────────────────────────────┤
   │                                 │
   │ Background:                     │
   │ ○ Solid Color                   │
   │   [🎨 #667eea]                  │
   │                                 │
   │ ○ Gradient                      │
   │   From: [🎨 #667eea]            │
   │   To: [🎨 #764ba2]              │
   │   Angle: [135] deg              │
   │                                 │
   │ ○ Image                         │
   │   [Upload] [URL] [Library]      │
   │                                 │
   │ ○ Video                         │
   │   [Upload] [YouTube] [Vimeo]    │
   │                                 │
   │ Transition:                     │
   │ Type: [▼ slide]                 │
   │ Speed: [▼ default]              │
   │                                 │
   │ Layout:                         │
   │ ○ Centered                      │
   │ ○ Two Columns                   │
   │ ○ Three Columns                 │
   │ ○ Custom Grid                   │
   │                                 │
   │ Animations (AOS):               │
   │ ☑ Enable                        │
   │ Default: [▼ fade-up]            │
   │ Delay: [200] ms                 │
   │                                 │
   └─────────────────────────────────┘

Implementazione GrapesJS:
editor.DomComponents.addType('slide', {
model: {
defaults: {
tagName: 'section',
classes: ['slide'],
attributes: {
'data-transition': 'slide'
},
traits: [
{
type: 'select',
label: 'Background Type',
name: 'bg-type',
options: [
{ value: 'color', name: 'Solid Color' },
{ value: 'gradient', name: 'Gradient' },
{ value: 'image', name: 'Image' },
{ value: 'video', name: 'Video' }
]
},
{
type: 'color',
label: 'Background Color',
name: 'bg-color'
},
{
type: 'select',
label: 'Transition',
name: 'data-transition',
options: [
{ value: 'slide', name: 'Slide' },
{ value: 'zoom', name: 'Zoom' },
{ value: 'fade', name: 'Fade' },
{ value: 'convex', name: 'Convex' }
]
}
]
}
}
});

2. Text Component (con TipTap)
   Descrizione: Testo ricco con editor inline
   Funzionalità:

Rich text (bold, italic, underline)
Headings (H1-H6)
Lists (ordered, unordered)
Links
Text color
Alignment

Editor Inline:
Doppio click su testo → Toolbar floating:
┌──────────────────────────────────────────────────┐
│ [B] [I] [U] [S] │ [H1▼] [●▼] [≡] [🔗] [🎨] [×] │
└──────────────────────────────────────────────────┘

Integrazione TipTap:
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';

const tiptapEditor = new Editor({
element: textElement,
extensions: [
StarterKit,
Link,
TextAlign.configure({
types: ['heading', 'paragraph'],
}),
Color
],
content: initialContent,
onUpdate: ({ editor }) => {
// Sync con GrapesJS
grapesComponent.set('content', editor.getHTML());
}
});

3. Image Component
   Descrizione: Immagine con upload, URL, libreria, AI generation
   Modal Upload:
   ┌─────────────────────────────────────────────┐
   │ Add Image                                   │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ [Upload] [URL] [Library] [AI Generate]     │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │  AI Image Generation                │   │
   │ │                                     │   │
   │ │  Describe your image:               │   │
   │ │  ┌───────────────────────────────┐ │   │
   │ │  │ Modern office workspace with  │ │   │
   │ │  │ laptop and coffee, natural    │ │   │
   │ │  │ lighting, professional        │ │   │
   │ │  └───────────────────────────────┘ │   │
   │ │                                     │   │
   │ │  Style:                             │   │
   │ │  ○ Photorealistic                  │   │
   │ │  ○ Digital Art                     │   │
   │ │  ○ Illustration                    │   │
   │ │  ○ Abstract                        │   │
   │ │  ○ Minimalist                      │   │
   │ │                                     │   │
   │ │  Size:                              │   │
   │ │  ○ Square (1024x1024)              │   │
   │ │  ○ Landscape (1792x1024)           │   │
   │ │  ○ Portrait (1024x1792)            │   │
   │ │                                     │   │
   │ │  Quality:                           │   │
   │ │  ○ Standard ($0.04)                │   │
   │ │  ○ HD ($0.08)                      │   │
   │ │                                     │   │
   │ │  [Generate Image →]                 │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ [Cancel] [Insert]                           │
   └─────────────────────────────────────────────┘

AI Generation (DALL-E 3):
async function generateImage(prompt, options) {
const response = await fetch(
'https://api.openai.com/v1/images/generations',
{
method: 'POST',
headers: {
'Authorization': `Bearer ${OPENAI_API_KEY}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
model: 'dall-e-3',
prompt: prompt,
size: options.size,
quality: options.quality,
n: 1
})
}
);

const data = await response.json();
return data.data[0].url;
}

Style Manager:
┌─────────────────────────────────┐
│ Image Settings                  │
├─────────────────────────────────┤
│                                 │
│ Size:                           │
│ Width: [100] %                  │
│ Height: [Auto]                  │
│                                 │
│ Object Fit:                     │
│ ○ Cover                         │
│ ○ Contain                       │
│ ○ Fill                          │
│ ○ None                          │
│                                 │
│ Border Radius:                  │
│ [8] px                          │
│                                 │
│ Shadow:                         │
│ ☑ Enable                        │
│ X: [0] Y: [4] Blur: [20]       │
│ Color: [🎨 rgba(0,0,0,0.15)]   │
│                                 │
│ Filters:                        │
│ Grayscale: [0] %                │
│ Brightness: [100] %             │
│ Contrast: [100] %               │
│ Blur: [0] px                    │
│ Saturate: [100] %               │
│                                 │
│ Hover Effect:                   │
│ ○ None                          │
│ ○ Zoom                          │
│ ○ Lift                          │
│ ○ Tilt                          │
│                                 │
└─────────────────────────────────┘

4. Chart Component
   Descrizione: Grafico Chart.js con editor dati
   Editor Grafico:
   ┌─────────────────────────────────────────────┐
   │ Chart Editor                                │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Chart Type: [▼ Bar Chart]                  │
   │                                             │
   │ Data Source:                                │
   │ ○ Manual Entry                             │
   │ ○ CSV Import                               │
   │ ○ Google Sheets                            │
   │ ○ JSON                                     │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ Manual Data Entry                   │   │
   │ │                                     │   │
   │ │ Label      │ Value    │ Color      │   │
   │ │────────────┼──────────┼───────────│   │
   │ │ January    │ 65       │ #667eea   │   │
   │ │ February   │ 59       │ #764ba2   │   │
   │ │ March      │ 80       │ #f093fb   │   │
   │ │ April      │ 81       │ #4facfe   │   │
   │ │ May        │ 56       │ #43e97b   │   │
   │ │ June       │ 55       │ #fa709a   │   │
   │ │                                     │   │
   │ │ [+ Add Row] [- Remove]              │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ Chart Options:                              │
   │ Title: [Monthly Sales]                     │
   │ ☑ Show Legend                              │
   │ ☑ Show Grid                                │
   │ ☑ Animate on Scroll                        │
   │ Animation: [▼ Ease-in-out] [2000] ms      │
   │                                             │
   │ Axes:                                       │
   │ X-Axis Label: [Month]                      │
   │ Y-Axis Label: [Sales ($)]                  │
   │                                             │
   │ [Preview] [Apply]                          │
   └─────────────────────────────────────────────┘

Google Sheets Integration:
┌─────────────────────────────────────────────┐
│ Import from Google Sheets                   │
├─────────────────────────────────────────────┤
│                                             │
│ Spreadsheet URL:                            │
│ ┌───────────────────────────────────────┐ │
│ │ https://docs.google.com/spreadsheets/ │ │
│ │ d/1ABC123.../edit                     │ │
│ └───────────────────────────────────────┘ │
│                                             │
│ Sheet Name: [▼ Sheet1]                     │
│ Range: [A1:B10]                            │
│                                             │
│ ☑ Auto-update (refresh every 5 min)        │
│                                             │
│ Preview:                                    │
│ ┌───────────────────────────────────────┐ │
│ │ Month     │ Sales                     │ │
│ │───────────┼───────────────────────────│ │
│ │ January   │ 65                        │ │
│ │ February  │ 59                        │ │
│ │ ...       │ ...                       │ │
│ └───────────────────────────────────────┘ │
│                                             │
│ [Import Data]                               │
└─────────────────────────────────────────────┘

Chart.js Integration:
editor.DomComponents.addType('chart', {
model: {
defaults: {
tagName: 'canvas',
attributes: { class: 'chart-component' },
traits: [
{
type: 'select',
label: 'Chart Type',
name: 'chart-type',
options: [
{ value: 'line', name: 'Line' },
{ value: 'bar', name: 'Bar' },
{ value: 'pie', name: 'Pie' },
{ value: 'doughnut', name: 'Doughnut' },
{ value: 'radar', name: 'Radar' }
]
},
{
type: 'button',
label: 'Edit Data',
name: 'edit-data',
command: 'open-chart-editor'
}
]
}
},
view: {
onRender() {
const canvas = this.el;
const chartData = this.model.get('chartData');

      new Chart(canvas, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options
      });
    }
}
});

5. Video Component
   Descrizione: Video YouTube, Vimeo, o upload diretto
   Modal Video:
   ┌─────────────────────────────────────────────┐
   │ Add Video                                   │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ [YouTube] [Vimeo] [Upload]                 │
   │                                             │
   │ YouTube URL:                                │
   │ ┌───────────────────────────────────────┐ │
   │ │ https://www.youtube.com/watch?v=...   │ │
   │ └───────────────────────────────────────┘ │
   │                                             │
   │ Options:                                    │
   │ ☑ Autoplay                                 │
   │ ☑ Loop                                     │
   │ ☑ Show Controls                            │
   │ ☐ Muted                                    │
   │ ☐ Modest Branding (hide YouTube logo)     │
   │                                             │
   │ Start Time: [0] seconds                    │
   │ End Time: [Auto]                           │
   │                                             │
   │ Cover Image (poster):                       │
   │ [Upload] [Auto-generate from video]        │
   │                                             │
   │ [Insert Video]                              │
   └─────────────────────────────────────────────┘

Embed Code:
<!-- YouTube -->
<iframe
width="100%"
height="100%"
src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&amp;loop=1&amp;controls=1"
frameborder="0"
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
allowfullscreen>
</iframe>

<!-- Vimeo -->
<iframe
src="https://player.vimeo.com/video/VIDEO_ID?autoplay=1&amp;loop=1"
width="100%"
height="100%"
frameborder="0"
allow="autoplay; fullscreen; picture-in-picture"
allowfullscreen>
</iframe>

<!-- Upload diretto -->
<video
width="100%"
height="100%"
controls
autoplay
loop
muted
poster="cover.jpg">
  <source src="video.mp4" type="video/mp4">
</video>

6. Button Component
   Descrizione: Pulsante con link, stili, animazioni
   Traits:
   ┌─────────────────────────────────┐
   │ Button Settings                 │
   ├─────────────────────────────────┤
   │                                 │
   │ Text: [Learn More]              │
   │                                 │
   │ Link Type:                      │
   │ ○ URL                           │
   │ ○ Anchor (same page)            │
   │ ○ Email                         │
   │ ○ Phone                         │
   │ ○ Download File                 │
   │                                 │
   │ URL: [https://...]              │
   │ ☑ Open in new tab               │
   │                                 │
   │ Style Preset:                   │
   │ ○ Primary (filled)              │
   │ ○ Secondary                     │
   │ ○ Outline                       │
   │ ○ Ghost                         │
   │ ○ Link                          │
   │                                 │
   │ Size:                           │
   │ ○ Small  ○ Medium  ○ Large     │
   │                                 │
   │ Icon:                           │
   │ Position: [▼ Right]             │
   │ Icon: [🔍 Search icons...]      │
   │                                 │
   │ Colors:                         │
   │ Background: [🎨 #667eea]        │
   │ Text: [🎨 #ffffff]              │
   │ Border: [🎨 #667eea]            │
   │                                 │
   │ Hover:                          │
   │ Background: [🎨 #5568d3]        │
   │ Transform: [▼ Scale 1.05]       │
   │                                 │
   │ Animation:                      │
   │ ○ None                          │
   │ ○ Pulse                         │
   │ ○ Bounce                        │
   │ ○ Shake                         │
   │                                 │
   └─────────────────────────────────┘

7. Icon Component
   Descrizione: Icona SVG da Lucide Icons
   Icon Picker:
   ┌─────────────────────────────────────────────┐
   │ Choose Icon                                 │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Search: [🔍 arrow]                         │
   │                                             │
   │ Categories:                                 │
   │ [All] [Arrows] [UI] [Media] [Social] ...   │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ ➡️  ⬅️  ⬆️  ⬇️  ↗️  ↘️  ↙️  ↖️       │   │
   │ │ 🔄  ↩️  ↪️  ⤴️  ⤵️  🔃  ⟲  ⟳       │   │
   │ │ ✓  ✗  ➕  ➖  ✏️  🗑️  ⚙️  🔍       │   │
   │ │ ... (1000+ icons, scrollable)       │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ Selected: arrow-right                       │
   │                                             │
   │ Size: [24] px                              │
   │ Color: [🎨 #667eea]                        │
   │ Stroke Width: [2] px                       │
   │                                             │
   │ Rotation: [0] deg                          │
   │                                             │
   │ Animation:                                  │
   │ ○ None                                     │
   │ ○ Spin                                     │
   │ ○ Pulse                                    │
   │ ○ Bounce                                   │
   │                                             │
   │ [Insert Icon]                               │
   └─────────────────────────────────────────────┘

8. Form Component
   Descrizione: Form builder con campi personalizzabili
   Form Builder:
   ┌─────────────────────────────────────────────┐
   │ Form Builder                                │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Form Fields:                                │
   │ ┌─────────────────────────────────────┐   │
   │ │ [≡] Name (Text)              [×]    │   │
   │ │     Required: ☑                     │   │
   │ │     Placeholder: Your name          │   │
   │ │                                     │   │
   │ │ [≡] Email (Email)            [×]    │   │
   │ │     Required: ☑                     │   │
   │ │     Validation: Email format        │   │
   │ │                                     │   │
   │ │ [≡] Message (Textarea)       [×]    │   │
   │ │     Required: ☑                     │   │
   │ │     Rows: 5                         │   │
   │ │                                     │   │
   │ │ [+ Add Field ▼]                     │   │
   │ │   • Text Input                      │   │
   │ │   • Email                           │   │
   │ │   • Phone                           │   │
   │ │   • Number                          │   │
   │ │   • Textarea                        │   │
   │ │   • Select Dropdown                 │   │
   │ │   • Checkbox                        │   │
   │ │   • Radio Buttons                   │   │
   │ │   • File Upload                     │   │
   │ │   • Date Picker                     │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ Submit Action:                              │
   │ ○ Send Email                               │
   │   To: [your@email.com]                     │
   │   Subject: [New form submission]           │
   │                                             │
   │ ○ Webhook (POST)                           │
   │   URL: [https://...]                       │
   │   Headers: [+ Add]                         │
   │                                             │
   │ ○ Google Sheets                            │
   │   Spreadsheet: [▼ Select]                  │
   │   Sheet: [Responses]                       │
   │                                             │
   │ ○ Firestore                                │
   │   Collection: [form_submissions]           │
   │                                             │
   │ Success Message:                            │
   │ [Thank you! We'll be in touch soon.]       │
   │                                             │
   │ Error Message:                              │
   │ [Oops! Something went wrong.]              │
   │                                             │
   │ [Save Form]                                 │
   └─────────────────────────────────────────────┘

Form Submission Handler:
async function handleFormSubmit(formData, action) {
switch(action.type) {
case 'email':
await sendEmail(action.to, formData);
break;

    case 'webhook':
      await fetch(action.url, {
        method: 'POST',
        headers: action.headers,
        body: JSON.stringify(formData)
      });
      break;
    
    case 'sheets':
      await appendToGoogleSheet(action.spreadsheet, formData);
      break;
    
    case 'firestore':
      await db.collection(action.collection).add({
        ...formData,
        timestamp: new Date()
      });
      break;
}
}

9. Countdown Component
   Descrizione: Timer countdown per eventi
   Settings:
   ┌─────────────────────────────────┐
   │ Countdown Settings              │
   ├─────────────────────────────────┤
   │                                 │
   │ Target Date &amp; Time:             │
   │ [2024-12-31] [23:59]           │
   │                                 │
   │ Timezone:                       │
   │ [▼ Europe/Rome (GMT+1)]        │
   │                                 │
   │ Display Units:                  │
   │ ☑ Days                          │
   │ ☑ Hours                         │
   │ ☑ Minutes                       │
   │ ☑ Seconds                       │
   │                                 │
   │ Labels:                         │
   │ ○ Full (Days, Hours...)         │
   │ ○ Short (D, H, M, S)            │
   │ ○ None                          │
   │                                 │
   │ Separator: [:]                  │
   │                                 │
   │ On Complete:                    │
   │ ○ Hide countdown                │
   │ ○ Show message:                 │
   │   [Event started!]              │
   │ ○ Redirect to:                  │
   │   [https://...]                 │
   │ ○ Trigger confetti 🎉          │
   │                                 │
   │ Style:                          │
   │ ○ Minimal                       │
   │ ○ Cards                         │
   │ ○ Flip Clock                    │
   │ ○ Circle Progress               │
   │                                 │
   └─────────────────────────────────┘

10. Code Component
    Descrizione: Blocco codice con syntax highlighting
    Settings:
    ┌─────────────────────────────────────────────┐
    │ Code Block                                  │
    ├─────────────────────────────────────────────┤
    │                                             │
    │ Language: [▼ JavaScript]                   │
    │                                             │
    │ Theme:                                      │
    │ ○ Light                                    │
    │ ○ Dark                                     │
    │ ○ Monokai                                  │
    │ ○ Dracula                                  │
    │ ○ GitHub                                   │
    │ ○ VS Code                                  │
    │                                             │
    │ ☑ Show line numbers                        │
    │ ☑ Enable copy button                       │
    │ ☑ Highlight lines: [1,5-7,12]             │
    │                                             │
    │ Code:                                       │
    │ ┌───────────────────────────────────────┐ │
    │ │ function hello() {                    │ │
    │ │   console.log("Hello World");         │ │
    │ │   return true;                        │ │
    │ │ }                                     │ │
    │ │                                       │ │
    │ │ hello();                              │ │
    │ └───────────────────────────────────────┘ │
    │                                             │
    │ [Apply]                                     │
    └─────────────────────────────────────────────┘

Syntax Highlighting (Prism.js):
<pre><code class="language-javascript">
function hello() {
  console.log("Hello World");
}
</code></pre>

<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>


Pannelli Editor:
Blocks Panel (Sinistra)
┌─────────────────────────────┐
│ BLOCKS                      │
├─────────────────────────────┤
│ 🔍 Search blocks...         │
├─────────────────────────────┤
│                             │
│ 📝 Basic                    │
│ ├─ Text                     │
│ ├─ Heading                  │
│ ├─ Paragraph                │
│ ├─ List                     │
│ └─ Quote                    │
│                             │
│ 🖼️ Media                    │
│ ├─ Image                    │
│ ├─ Video                    │
│ ├─ Icon                     │
│ ├─ Divider                  │
│ └─ Spacer                   │
│                             │
│ 📊 Data                     │
│ ├─ Chart                    │
│ ├─ Table                    │
│ ├─ Countdown                │
│ ├─ Progress Bar             │
│ └─ Stats Counter            │
│                             │
│ 🎨 Layout                   │
│ ├─ Container                │
│ ├─ Row                      │
│ ├─ Column                   │
│ ├─ Grid                     │
│ └─ Tabs                     │
│                             │
│ 🔘 Interactive              │
│ ├─ Button                   │
│ ├─ Form                     │
│ ├─ Link                     │
│ ├─ Accordion                │
│ └─ Modal                    │
│                             │
│ 💻 Advanced                 │
│ ├─ Code                     │
│ ├─ Embed                    │
│ ├─ Custom HTML              │
│ ├─ Map                      │
│ └─ Social Share             │
│                             │
│ 🎭 Effects                  │
│ ├─ Particles                │
│ ├─ Typed Text               │
│ ├─ Parallax                 │
│ └─ Scroll Animation         │
│                             │
│ 📦 Saved Blocks             │
│ └─ (Your custom blocks)     │
│                             │
└─────────────────────────────┘

Layers Panel (Destra)
┌─────────────────────────────┐
│ LAYERS                      │
├─────────────────────────────┤
│ 🔍 Search layers...         │
├─────────────────────────────┤
│                             │
│ 📄 Slide 1 (Hero)          │
│ ├─ 🎨 Particles BG    [👁️] │
│ ├─ 📝 H1 Title        [👁️] │
│ └─ 📝 Subtitle        [👁️] │
│                             │
│ 📄 Slide 2 (Content)       │
│ ├─ 📝 H2 Heading      [👁️] │
│ ├─ 🎨 Container       [👁️] │
│ │  ├─ 📝 Text         [👁️] │
│ │  └─ 🖼️ Image        [👁️] │
│ └─ 🔘 Button          [👁️] │
│                             │
│ 📄 Slide 3 (Chart)         │
│ ├─ 📝 H2 Heading      [👁️] │
│ └─ 📊 Bar Chart       [👁️] │
│                             │
│ 📄 Slide 4 (Stats)         │
│ ├─ 📝 H2 Heading      [👁️] │
│ └─ 🎨 Grid            [👁️] │
│    ├─ 📊 Counter 1    [👁️] │
│    ├─ 📊 Counter 2    [👁️] │
│    └─ 📊 Counter 3    [👁️] │
│                             │
│ [+ Add Slide]               │
│                             │
│ Actions:                    │
│ • Drag to reorder           │
│ • Click to select           │
│ • Right-click for menu      │
│ • 👁️ Toggle visibility      │
│ • 🔒 Lock element           │
│                             │
└─────────────────────────────┘

Context Menu (Right-Click):
┌─────────────────────┐
│ ✂️ Cut              │
│ 📋 Copy             │
│ 📄 Paste            │
│ 📑 Duplicate        │
│ 🗑️ Delete           │
│ ─────────────       │
│ ⬆️ Move Up          │
│ ⬇️ Move Down        │
│ ⬆️ Move to Top      │
│ ⬇️ Move to Bottom   │
│ ─────────────       │
│ 🔒 Lock             │
│ 👁️ Hide             │
│ ─────────────       │
│ 🎨 Copy Styles      │
│ 🎨 Paste Styles     │
│ ─────────────       │
│ 💾 Save as Block    │
└─────────────────────┘

Style Manager (Destra, Tab 2)
┌─────────────────────────────────┐
│ STYLE MANAGER                   │
├─────────────────────────────────┤
│                                 │
│ [General] [Typography] [Layout] │
│ [Decorations] [Extra]           │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ GENERAL                   ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Display:                        │
│ [▼ Block]                       │
│                                 │
│ Position:                       │
│ [▼ Relative]                    │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ DIMENSIONS                ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Width:  [100] [▼ %]            │
│ Height: [Auto]                  │
│                                 │
│ Min/Max:                        │
│ Min W: [0] Max W: [None]       │
│ Min H: [0] Max H: [None]       │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ SPACING                   ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Margin:                         │
│     [10]                        │
│ [10] ⊞ [10]                    │
│     [10]                        │
│ [🔗 Link values]               │
│                                 │
│ Padding:                        │
│     [20]                        │
│ [20] ⊞ [20]                    │
│     [20]                        │
│ [🔗 Link values]               │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ TYPOGRAPHY                ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Font Family:                    │
│ [▼ Inter]                       │
│                                 │
│ Font Size:                      │
│ [24] [▼ px]                    │
│                                 │
│ Font Weight:                    │
│ [▼ 600 - Semibold]             │
│                                 │
│ Line Height:                    │
│ [1.5]                           │
│                                 │
│ Letter Spacing:                 │
│ [0] px                          │
│                                 │
│ Text Transform:                 │
│ [▼ None]                        │
│                                 │
│ Text Align:                     │
│ [◧] [▭] [◨] [≡]                │
│                                 │
│ Text Color:                     │
│ [🎨 #2D3748]                    │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ BACKGROUND                ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Type:                           │
│ [▼ Solid Color]                 │
│                                 │
│ Color:                          │
│ [🎨 #667eea]                    │
│                                 │
│ Gradient (if selected):         │
│ Type: [▼ Linear]                │
│ Angle: [135] deg                │
│ Color 1: [🎨 #667eea]           │
│ Color 2: [🎨 #764ba2]           │
│                                 │
│ Image (if selected):            │
│ [Upload] [URL] [Library]        │
│ Size: [▼ Cover]                 │
│ Position: [▼ Center]            │
│ Repeat: [▼ No-repeat]           │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ BORDER                    ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Width: [1] px                   │
│ Style: [▼ Solid]                │
│ Color: [🎨 #e2e8f0]             │
│                                 │
│ Radius:                         │
│ [8] [8]                         │
│ [8] [8]                         │
│ [🔗 Link corners]              │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ SHADOW                    ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Box Shadow:                     │
│ ☑ Enable                        │
│ X: [0] Y: [4]                   │
│ Blur: [6] Spread: [0]          │
│ Color: [🎨 rgba(0,0,0,0.1)]    │
│                                 │
│ Text Shadow:                    │
│ ☐ Enable                        │
│                                 │
│ ╔═══════════════════════════╗  │
│ ║ EFFECTS                   ║  │
│ ╚═══════════════════════════╝  │
│                                 │
│ Opacity: [100] %                │
│                                 │
│ Transform:                      │
│ Rotate: [0] deg                 │
│ Scale: [1]                      │
│ Translate X: [0] px             │
│ Translate Y: [0] px             │
│                                 │
│ Transition:                     │
│ Duration: [300] ms              │
│ Easing: [▼ Ease]                │
│                                 │
│ Filter:                         │
│ Blur: [0] px                    │
│ Brightness: [100] %             │
│ Contrast: [100] %               │
│ Grayscale: [0] %                │
│ Saturate: [100] %               │
│                                 │
└─────────────────────────────────┘

Asset Manager (Modal)
┌─────────────────────────────────────────────┐
│ ASSET MANAGER                     [×]       │
├─────────────────────────────────────────────┤
│                                             │
│ [All] [Images] [Videos] [Documents] [Fonts] │
│                                             │
│ [📤 Upload] [🔗 Add URL] [🤖 AI Generate]  │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🔍 Search assets...                 │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Folders:                                    │
│ [📁 All Assets] [📁 Images] [📁 Videos]    │
│ [📁 Documents] [+ New Folder]              │
│                                             │
│ ┌───────┬───────┬───────┬───────┐         │
│ │ img1  │ img2  │ img3  │ img4  │         │
│ │ [📷]  │ [📷]  │ [📷]  │ [📷]  │         │
│ │ 2.3MB │ 1.8MB │ 3.1MB │ 890KB │         │
│ │ 1920x │ 1280x │ 3840x │ 1200x │         │
│ │ 1080  │ 720   │ 2160  │ 630   │         │
│ └───────┴───────┴───────┴───────┘         │
│ ┌───────┬───────┬───────┬───────┐         │
│ │ img5  │ img6  │ video1│ doc1  │         │
│ │ [📷]  │ [📷]  │ [🎥]  │ [📄]  │         │
│ │ 1.2MB │ 4.5MB │ 15MB  │ 500KB │         │
│ │ 1080x │ 2560x │ 1920x │ PDF   │         │
│ │ 1080  │ 1440  │ 1080  │       │         │
│ └───────┴───────┴───────┴───────┘         │
│                                             │
│ Selected: img3.jpg                          │
│ ┌─────────────────────────────────────┐   │
│ │ [Preview Image]                     │   │
│ │                                     │   │
│ │ Filename: img3.jpg                  │   │
│ │ Size: 3.1 MB                        │   │
│ │ Dimensions: 3840 x 2160             │   │
│ │ Format: JPEG                        │   │
│ │ Uploaded: 2024-01-15 10:30          │   │
│ │                                     │   │
│ │ Tags: [presentation] [hero] [+Add]  │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [🗑️ Delete] [✏️ Rename] [Insert]          │
└─────────────────────────────────────────────┘


Funzionalità Avanzate:
1. Slide Templates
   ┌─────────────────────────────────────────────┐
   │ SLIDE TEMPLATES                             │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ [Hero] [Content] [Stats] [Team] [CTA]      │
   │ [Gallery] [Pricing] [FAQ] [Contact]        │
   │                                             │
   │ ┌──────────┬──────────┬──────────┐         │
   │ │ Hero 1   │ Hero 2   │ Hero 3   │         │
   │ │ [Preview]│ [Preview]│ [Preview]│         │
   │ │ Centered │ Left Aln │ Video BG │         │
   │ │ Particles│ Gradient │ Parallax │         │
   │ └──────────┴──────────┴──────────┘         │
   │                                             │
   │ ┌──────────┬──────────┬──────────┐         │
   │ │ Content 1│ Content 2│ Content 3│         │
   │ │ [Preview]│ [Preview]│ [Preview]│         │
   │ │ 2 Column │ 3 Column │ Grid     │         │
   │ │ Text+Img │ Cards    │ Features │         │
   │ └──────────┴──────────┴──────────┘         │
   │                                             │
   │ ┌──────────┬──────────┬──────────┐         │
   │ │ Stats 1  │ Stats 2  │ Stats 3  │         │
   │ │ [Preview]│ [Preview]│ [Preview]│         │
   │ │ Counters │ Progress │ Charts   │         │
   │ │ 3 Cards  │ Bars     │ Mixed    │         │
   │ └──────────┴──────────┴──────────┘         │
   │                                             │
   │ [Use Template] [Preview] [Customize]        │
   └─────────────────────────────────────────────┘

2. Global Styles
   ┌─────────────────────────────────────────────┐
   │ GLOBAL STYLES                               │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ COLOR PALETTE                         ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Primary:   [🎨 #667eea] [Apply to all]     │
   │ Secondary: [🎨 #764ba2] [Apply to all]     │
   │ Accent:    [🎨 #f093fb] [Apply to all]     │
   │ Text:      [🎨 #2d3748] [Apply to all]     │
   │ Background:[🎨 #ffffff] [Apply to all]     │
   │ Success:   [🎨 #48bb78] [Apply to all]     │
   │ Warning:   [🎨 #ed8936] [Apply to all]     │
   │ Error:     [🎨 #f56565] [Apply to all]     │
   │                                             │
   │ [Import Palette] [Export Palette]           │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ TYPOGRAPHY                            ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Font Families:                              │
   │ Headings: [▼ Inter]                        │
   │ Body:     [▼ Inter]                        │
   │ Code:     [▼ Fira Code]                    │
   │                                             │
   │ [+ Add Google Font]                         │
   │                                             │
   │ Font Sizes:                                 │
   │ H1: [48] px  [Apply to all H1]             │
   │ H2: [36] px  [Apply to all H2]             │
   │ H3: [24] px  [Apply to all H3]             │
   │ H4: [20] px  [Apply to all H4]             │
   │ Body: [16] px [Apply to all text]          │
   │ Small: [14] px                              │
   │                                             │
   │ Font Weights:                               │
   │ Headings: [▼ 700 - Bold]                   │
   │ Body: [▼ 400 - Regular]                    │
   │                                             │
   │ Line Heights:                               │
   │ Headings: [1.2]                             │
   │ Body: [1.6]                                 │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ SPACING                               ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Base Unit: [8] px                           │
   │                                             │
   │ Spacing Scale (multiples of base):         │
   │ xs:  [4] px  (0.5x)                        │
   │ sm:  [8] px  (1x)                          │
   │ md:  [16] px (2x)                          │
   │ lg:  [24] px (3x)                          │
   │ xl:  [32] px (4x)                          │
   │ 2xl: [48] px (6x)                          │
   │                                             │
   │ Slide Padding:                              │
   │ Desktop: [64] px                            │
   │ Tablet:  [48] px                            │
   │ Mobile:  [32] px                            │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ ANIMATIONS                            ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Reveal.js:                                  │
   │ Default Transition: [▼ Slide]              │
   │ Transition Speed:   [▼ Default]            │
   │ Background Trans:   [▼ Fade]               │
   │                                             │
   │ AOS (Animate On Scroll):                    │
   │ ☑ Enable globally                          │
   │ Default Animation: [▼ fade-up]             │
   │ Default Duration:  [800] ms                │
   │ Default Delay:     [0] ms                  │
   │ Easing: [▼ ease-in-out]                    │
   │                                             │
   │ Hover Effects:                              │
   │ Buttons: [▼ Scale 1.05]                    │
   │ Images:  [▼ Zoom 1.1]                      │
   │ Cards:   [▼ Lift + Shadow]                 │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ RESPONSIVE                            ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Breakpoints:                                │
   │ Mobile:  < [640] px                        │
   │ Tablet:  [640] - [1024] px                 │
   │ Desktop: > [1024] px                       │
   │                                             │
   │ Mobile Adjustments:                         │
   │ ☑ Stack columns vertically                 │
   │ ☑ Reduce font sizes (85%)                  │
   │ ☑ Increase touch targets (44px min)        │
   │ ☑ Hide decorative elements                 │
   │                                             │
   │ [Apply to All Slides] [Reset to Defaults]   │
   └─────────────────────────────────────────────┘

3. Responsive Editing
   Device Toolbar:
   ┌─────────────────────────────────────────────┐
   │ [🖥️ Desktop] [💻 Laptop] [📱 Tablet] [📱 Mobile] │
   │                                             │
   │ Current: Desktop (1920 x 1080)              │
   │                                             │
   │ Custom: [____] x [____] px [Apply]         │
   └─────────────────────────────────────────────┘

Responsive Settings Panel:
┌─────────────────────────────────┐
│ RESPONSIVE SETTINGS             │
├─────────────────────────────────┤
│                                 │
│ Current Device: Mobile          │
│ Viewport: 375 x 667 px          │
│                                 │
│ Override for Mobile:            │
│                                 │
│ Visibility:                     │
│ ☑ Hide this element             │
│                                 │
│ Layout:                         │
│ ☑ Stack columns                 │
│ ☑ Full width                    │
│                                 │
│ Typography:                     │
│ Font Size: [85] % of desktop   │
│ Line Height: [1.4]              │
│                                 │
│ Spacing:                        │
│ Padding: [75] % of desktop     │
│ Margin: [75] % of desktop      │
│                                 │
│ [Apply] [Reset]                 │
│                                 │
└─────────────────────────────────┘


Salvataggio e Versioning:
Auto-Save
Funzionamento:

Salvataggio automatico ogni 5 secondi
Debounce su modifiche (attende 2s di inattività)
Indicatore stato in toolbar

Indicatore:
[💾 Salvato] → [💾 Salvando...] → [💾 Salvato]
↓
[⚠️ Errore salvataggio]

Struttura Dati Salvata:
{
projectId: string,
userId: string,
version: number,
lastSaved: timestamp,

// GrapesJS JSON structure
grapesData: {
assets: [
{
type: 'image',
src: 'https://...',
name: 'hero-bg.jpg'
}
],
styles: [
{
selectors: ['.slide'],
style: {
'background-color': '#667eea',
'padding': '4rem'
}
}
],
pages: [{
id: 'page-1',
frames: [{
component: {
type: 'wrapper',
components: [
{
type: 'slide',
attributes: { 'data-transition': 'zoom' },
components: [
{
type: 'text',
content: '<h1>Title</h1>'
}
]
}
]
},
css: '...'
}]
}]
},

// Metadata
metadata: {
slideCount: 12,
totalComponents: 45,
usedBlocks: ['text', 'image', 'chart', 'button'],
totalAssets: 8,
lastModifiedBy: userId
}
}

Version History
UI:
┌─────────────────────────────────────────────┐
│ VERSION HISTORY                   [×]       │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ ● Current (unsaved changes)         │   │
│ │   Just now                          │   │
│ │   [Discard Changes]                 │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Version 15 (Auto-save)              │   │
│ │   5 minutes ago                     │   │
│ │   12 slides, 47 components          │   │
│ │   Modified: Added chart to slide 5  │   │
│ │   [Restore] [Preview] [Compare]     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Version 14 "Final review"           │   │
│ │   2 hours ago                       │   │
│ │   12 slides, 45 components          │   │
│ │   Modified: Updated colors          │   │
│ │   [Restore] [Preview] [Compare]     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Version 13 (Auto-save)              │   │
│ │   Yesterday at 3:45 PM              │   │
│ │   12 slides, 43 components          │   │
│ │   [Restore] [Preview] [Compare]     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ... (scrollable, max 20 versions)          │
│                                             │
│ [Load More] [Clear Old Versions]            │
└─────────────────────────────────────────────┘

Funzionalità:

Snapshot automatico ogni ora
Snapshot manuale con nome custom
Max 20 versioni salvate (auto-delete oldest)
Restore versione precedente
Preview versione (apre in modal)
Compare diff tra versioni (visual diff)

Compare Diff:
┌─────────────────────────────────────────────┐
│ COMPARE VERSIONS                  [×]       │
├─────────────────────────────────────────────┤
│                                             │
│ Version 14 ←→ Version 15                    │
│                                             │
│ Changes:                                    │
│ ┌─────────────────────────────────────┐   │
│ │ + Added: Chart component (Slide 5)  │   │
│ │ ~ Modified: Button color (Slide 7)  │   │
│ │ - Removed: Image (Slide 3)          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Visual Diff:                                │
│ ┌──────────────┬──────────────┐           │
│ │ Version 14   │ Version 15   │           │
│ │ [Preview]    │ [Preview]    │           │
│ │              │              │           │
│ │ Slide 5:     │ Slide 5:     │           │
│ │ [Old view]   │ [New view]   │           │
│ │              │ + Chart      │           │
│ └──────────────┴──────────────┘           │
│                                             │
│ [Restore Version 14] [Keep Version 15]      │
└─────────────────────────────────────────────┘


Export da Editor:
Dopo editing, toolbar mostra:
┌─────────────────────────────────────────────┐
│ [💾 Save] [👁️ Preview] [🚀 Publish] [⬇️ Export ▼] │
└─────────────────────────────────────────────┘

Export Menu:
┌─────────────────────┐
│ 📄 Export HTML      │
│ 📕 Export PDF       │
│ 🖼️ Export Images    │
│ 📦 Export All (ZIP) │
│ ─────────────       │
│ 🔗 Get Embed Code   │
│ 📋 Copy to Clipboard│
└─────────────────────┘

Get Embed Code:
┌─────────────────────────────────────────────┐
│ EMBED CODE                        [×]       │
├─────────────────────────────────────────────┤
│                                             │
│ Embed this presentation in your website:   │
│                                             │
│ ┌───────────────────────────────────────┐ │
│ │ <iframe                               │ │
│ │   src="https://yoursite.netlify.app"  │ │
│ │   width="100%"                        │ │
│ │   height="600"                        │ │
│ │   frameborder="0"                     │ │
│ │   allowfullscreen>                    │ │
│ │ </iframe>                             │ │
│ └───────────────────────────────────────┘ │
│                                             │
│ Options:                                    │
│ Width: [100] [▼ %]                         │
│ Height: [600] [▼ px]                       │
│ ☑ Allow fullscreen                         │
│ ☐ Auto-play                                │
│                                             │
│ [📋 Copy Code]                             │
└─────────────────────────────────────────────┘


Costi Editor:
Librerie:
✅ GrapesJS: GRATIS (BSD-3-Clause)
✅ TipTap: GRATIS (MIT)
✅ Tutti i plugin: GRATIS

AI Image Generation (opzionale):
💰 DALL-E 3: $0.04 per immagine standard
💰 DALL-E 3 HD: $0.08 per immagine HD

Stima uso:
- 5 immagini AI per presentazione = $0.20-0.40
- 10 presentazioni/mese = $2-4/mese

Storage Firestore (editor state):
✅ ~100 KB per progetto salvato
✅ 1000 progetti = 100 MB (dentro 1 GB free)

TOTALE COSTI EDITOR: $0-4/mese


RF-008: Dashboard e Gestione Progetti
Priorità: AltaEpic: UI e UX
Descrizione:Interfaccia centrale per visualizzare, gestire ed esportare tutti i progetti.
User Story:
Come utente
Voglio vedere tutti i miei progetti in un dashboard
Per gestirli facilmente e accedere rapidamente

Layout Dashboard:
┌──────────────────────────────────────────────────────────────┐
│  [Logo] GammaClone                    [👤 User] [⚙️] [Logout] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┬─────────────────────────────────────────┐  │
│  │            │                                         │  │
│  │ SIDEBAR    │         MAIN CONTENT                    │  │
│  │            │                                         │  │
│  │ 📊 Dashboard│  ┌────────────────────────────────┐   │  │
│  │ 📄 Projects │  │ I Miei Progetti        [+ Nuovo]│   │  │
│  │ 🌐 Published│  ├────────────────────────────────┤   │  │
│  │ 📈 Analytics│  │                                │   │  │
│  │ ⚙️ Settings │  │ 🔍 [Search...] [▼Filters]     │   │  │
│  │ 📚 Help     │  │                                │   │  │
│  │            │  │ ┌──────────────────────────┐   │   │  │
│  │            │  │ │ 📄 Marketing Report Q1   │   │  │
│  │            │  │ │ 15 Gen • 1,234 words     │   │  │
│  │            │  │ │ ✓ Ready                  │   │  │
│  │            │  │ │                          │   │  │
│  │            │  │ │ Generated:               │   │  │
│  │            │  │ │ • HTML (12 slides)       │   │  │
│  │            │  │ │ • Published online       │   │  │
│  │            │  │ │ • 156 views              │   │  │
│  │            │  │ │                          │   │  │
│  │            │  │ │ [View] [Edit] [Export]   │   │  │
│  │            │  │ └──────────────────────────┘   │   │  │
│  │            │  │                                │   │  │
│  │            │  │ ... more projects              │   │  │
│  │            │  │                                │   │  │
│  │            │  └────────────────────────────────┘   │  │
│  │            │                                         │  │
│  └────────────┴─────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Sezioni Dashboard:
1. Overview (Home)
   ┌─────────────────────────────────────────────┐
   │ Welcome back, Mario! 👋                     │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Quick Stats:                                │
   │ ┌──────────┬──────────┬──────────┐         │
   │ │ Projects │ Published│ Views    │         │
   │ │    12    │    5     │  1,234   │         │
   │ └──────────┴──────────┴──────────┘         │
   │                                             │
   │ Recent Activity:                            │
   │ • Published "Marketing Q1" 2h ago          │
   │ • Edited "Product Launch" 5h ago           │
   │ • Created "Annual Report" yesterday        │
   │                                             │
   │ Quick Actions:                              │
   │ [+ New Project] [📤 Upload] [🌐 Publish]   │
   │                                             │
   └─────────────────────────────────────────────┘

2. Projects List
   Filtri:
   ┌─────────────────────────────────────────────┐
   │ Filters:                                    │
   │ [All] [Ready] [Processing] [Published]     │
   │                                             │
   │ Sort by:                                    │
   │ [▼ Date (newest)] [▼ Name] [▼ Size]       │
   │                                             │
   │ Date range:                                 │
   │ [Last 7 days ▼]                            │
   └─────────────────────────────────────────────┘

Card Progetto:
┌─────────────────────────────────────────────┐
│ 📄 Marketing Report Q1 2024                 │
├─────────────────────────────────────────────┤
│                                             │
│ Uploaded: 15 Gen 2024, 10:30               │
│ Document: marketing_q1.pdf (2.3 MB)        │
│ Status: ✓ Ready                            │
│                                             │
│ Content:                                    │
│ • 1,234 words                              │
│ • 5 pages                                  │
│ • Language: Italian                        │
│                                             │
│ Generated Content:                          │
│ ┌─────────────────────────────────────┐   │
│ │ 🌐 HTML Presentation                │   │
│ │    12 slides • Modern style         │   │
│ │    Generated: 15 Gen, 10:35         │   │
│ │    [👁️ Preview] [✏️ Edit]           │   │
│ │                                     │   │
│ │    Published:                       │   │
│ │    https://marketing-q1.netlify.app │   │
│ │    👁️ 156 views                     │   │
│ │    [🔗 Open] [📋 Copy Link]         │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Actions:                                    │
│ [📤 Export PDF] [🖼️ Export Images]         │
│ [🔄 Regenerate] [📑 Duplicate] [🗑️ Delete] │
│                                             │
└─────────────────────────────────────────────┘

Stati Progetto:



Icona
Status
Descrizione



⏳
Uploading
File in caricamento


🔄
Processing
Parsing documento


✓
Ready
Pronto per generazione


🎨
Generating
AI sta generando HTML


✅
Generated
HTML generato


🌐
Published
Pubblicato online


⚠️
Error
Errore processing


3. Published (Presentazioni Online)
   ┌─────────────────────────────────────────────┐
   │ Presentazioni Pubblicate (5)                │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ Marketing Report Q1                 │   │
   │ │ https://marketing-q1.netlify.app    │   │
   │ │                                     │   │
   │ │ 👁️ 156 views                        │   │
   │ │ Last viewed: 2 hours ago            │   │
   │ │ Published: 5 days ago               │   │
   │ │                                     │   │
   │ │ [🔗 Open] [✏️ Edit] [📊 Analytics]  │   │
   │ │ [📋 Copy Link] [🗑️ Unpublish]       │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ ┌─────────────────────────────────────┐   │
   │ │ Product Launch                      │   │
   │ │ https://product-launch.netlify.app  │   │
   │ │                                     │   │
   │ │ 👁️ 89 views                         │   │
   │ │ Last viewed: 1 day ago              │   │
   │ │ Published: 2 weeks ago              │   │
   │ │                                     │   │
   │ │ [🔗 Open] [✏️ Edit] [📊 Analytics]  │   │
   │ │ [📋 Copy Link] [🗑️ Unpublish]       │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   └─────────────────────────────────────────────┘

4. Analytics
   ┌─────────────────────────────────────────────┐
   │ Analytics Overview                          │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Time Range: [Last 30 days ▼]               │
   │                                             │
   │ Total Views: 1,234                          │
   │ Unique Visitors: 567                        │
   │ Avg. Time on Page: 3m 45s                  │
   │                                             │
   │ Views Over Time:                            │
   │ ┌─────────────────────────────────────┐   │
   │ │ [Line Chart]                        │   │
   │ │                                     │   │
   │ │   ╱╲                                │   │
   │ │  ╱  ╲      ╱╲                       │   │
   │ │ ╱    ╲    ╱  ╲    ╱╲                │   │
   │ │╱      ╲  ╱    ╲  ╱  ╲               │   │
   │ │        ╲╱      ╲╱    ╲              │   │
   │ └─────────────────────────────────────┘   │
   │                                             │
   │ Top Presentations:                          │
   │ 1. Marketing Q1 - 456 views                │
   │ 2. Product Launch - 234 views              │
   │ 3. Annual Report - 189 views               │
   │                                             │
   │ Traffic Sources:                            │
   │ • Direct: 45%                              │
   │ • Social Media: 30%                        │
   │ • Email: 15%                               │
   │ • Other: 10%                               │
   │                                             │
   │ Devices:                                    │
   │ • Desktop: 60%                             │
   │ • Mobile: 30%                              │
   │ • Tablet: 10%                              │
   │                                             │
   └─────────────────────────────────────────────┘

5. Settings
   ┌─────────────────────────────────────────────┐
   │ Settings                                    │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ [Account] [Security] [Preferences] [Billing]│
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ ACCOUNT                               ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ GitHub Account:                             │
   │ @username                                   │
   │ email@example.com                           │
   │                                             │
   │ Access Code:                                │
   │ [Change Code]                               │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ SECURITY                              ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Two-Factor Authentication:                  │
   │ ☑ Enabled                                  │
   │ [Manage 2FA]                                │
   │                                             │
   │ Active Sessions:                            │
   │ • Chrome on Windows (current)              │
   │ • Safari on iPhone (2 days ago)            │
   │ [Revoke All Sessions]                       │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ PREFERENCES                           ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Theme:                                      │
   │ ○ Light  ○ Dark  ● Auto                   │
   │                                             │
   │ Default Style:                              │
   │ [▼ Modern]                                 │
   │                                             │
   │ Default Palette:                            │
   │ [▼ Blue/Purple]                            │
   │                                             │
   │ Auto-save:                                  │
   │ ☑ Enable (every 5 seconds)                 │
   │                                             │
   │ Notifications:                              │
   │ ☑ Email notifications                      │
   │ ☑ Processing complete                      │
   │ ☑ Weekly summary                           │
   │                                             │
   │ ╔═══════════════════════════════════════╗  │
   │ ║ USAGE &amp; BILLING                       ║  │
   │ ╚═══════════════════════════════════════╝  │
   │                                             │
   │ Current Plan: Personal (Free)               │
   │                                             │
   │ Usage This Month:                           │
   │ • Projects: 12 / ∞                         │
   │ • AI Generations: 24 / ∞                   │
   │ • Storage: 245 MB / 5 GB                   │
   │ • Published Sites: 5 / ∞                   │
   │                                             │
   │ AI Costs (optional features):               │
   │ • Image Generation: $2.40                  │
   │   (60 images × $0.04)                      │
   │                                             │
   │ [View Detailed Usage]                       │
   │                                             │
   │ [Save Changes]                              │
   └─────────────────────────────────────────────┘


📊 REQUISITI NON FUNZIONALI
RNF-001: Performance
Priorità: Alta
Metriche Target (Lighthouse):



Metrica
Target
Misurazione



First Contentful Paint
< 1.5s
Lighthouse


Time to Interactive
< 3.0s
Lighthouse


Largest Contentful Paint
< 2.5s
Lighthouse


Cumulative Layout Shift
< 0.1
Lighthouse


Total Blocking Time
< 300ms
Lighthouse


Speed Index
< 3.0s
Lighthouse


Ottimizzazioni Frontend:
Build (Vite):

Code splitting automatico per routes
Tree shaking (rimozione codice non usato)
Minification JS/CSS
Asset optimization (immagini, fonts)
Lazy loading componenti pesanti
Preload risorse critiche

Runtime:

React.lazy() per componenti editor
useMemo/useCallback per computazioni costose
Virtual scrolling per liste lunghe (react-window)
Debounce su input/search (300ms)
Service Worker per caching assets
IndexedDB per cache dati offline

Ottimizzazioni Backend:
Cloud Functions:

Cold start optimization:
Minimal dependencies
Global variable caching
Connection pooling Firestore


Memory allocation appropriata:
processDocument: 512 MB
generateHTML: 1 GB
publishToNetlify: 512 MB


Timeout adeguati:
processDocument: 120s
generateHTML: 60s
publishToNetlify: 120s


Retry logic con exponential backoff

Firestore:

Composite indexes per query complesse
Pagination (limit + startAfter)
Client-side caching (5 minuti)
Batch operations per scritture multiple
Offline persistence abilitata

Storage:

CDN automatico Firebase
Signed URLs con cache headers
Compressione file (gzip)
Lazy loading immagini

Monitoraggio:

Firebase Performance Monitoring
Real User Monitoring (RUM)
Error tracking (Firebase Crashlytics)
Custom performance marks


RNF-002: Sicurezza
Priorità: Critica
Autenticazione:
GitHub OAuth:

PKCE (Proof Key for Code Exchange)
State parameter per CSRF protection
Scope minimi necessari: user:email, read:user
Token refresh automatico
Revoca token su logout

Codice Accesso:

Hash SHA-256 con salt univoco per utente
Salt generato con crypto.randomBytes(32)
Stored hash format: ${salt}:${hash}
Verifica timing-safe (constant-time comparison)
Rate limiting: max 5 tentativi/15 minuti
Lockout progressivo: 15min, 1h, 24h

Sessione:

JWT con firma HMAC-SHA256
Payload minimo (solo userId, exp)
Durata: 7 giorni
Refresh automatico se < 24h a scadenza
Stored in httpOnly cookie (se possibile) o localStorage
Invalidazione su cambio password

Autorizzazione:
Firestore Security Rules:
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuth() &amp;&amp; request.auth.uid == userId;
    }
    
    function isWhitelisted() {
      return isAuth() &amp;&amp; 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &amp;&amp;
             get(/databases/$(database)/documents/users/$(request.auth.uid))
               .data.githubUsername == 'TUO_USERNAME';
    }
    
    // Users
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuth() &amp;&amp; request.auth.uid == userId;
      allow update: if isOwner(userId) &amp;&amp; isWhitelisted();
      allow delete: if false; // Never delete users
    }
    
    // Projects
    match /projects/{projectId} {
      allow read: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
      allow create: if isAuth() &amp;&amp; 
                       request.resource.data.userId == request.auth.uid &amp;&amp;
                       isWhitelisted();
      allow update: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
      allow delete: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
    }
    
    // Generated Content
    match /generated_content/{contentId} {
      allow read: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
      allow create: if isAuth() &amp;&amp; 
                       request.resource.data.userId == request.auth.uid &amp;&amp;
                       isWhitelisted();
      allow update: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
      allow delete: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
    }
    
    // Shared Links (public read)
    match /shared_links/{linkId} {
      allow read: if true; // Public
      allow create, update, delete: if isOwner(resource.data.userId) &amp;&amp; isWhitelisted();
    }
}
}

Storage Security Rules:
rules_version = '2';
service firebase.storage {
match /b/{bucket}/o {

    function isAuth() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuth() &amp;&amp; request.auth.uid == userId;
    }
    
    function validFileSize(maxSizeMB) {
      return request.resource.size < maxSizeMB * 1024 * 1024;
    }
    
    function validContentType(allowedTypes) {
      return request.resource.contentType in allowedTypes;
    }
    
    // Documents
    match /documents/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &amp;&amp; 
                      validFileSize(10) &amp;&amp;
                      validContentType([
                        'application/pdf',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                      ]);
    }
    
    // Generated HTML
    match /generated/{userId}/html/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &amp;&amp; validFileSize(5);
    }
    
    // Shared (public read)
    match /shared/{slug}/{fileName} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions
    }
}
}

Protezione Dati:
Encryption:

HTTPS obbligatorio (TLS 1.3)
Encryption at-rest (Firebase default: AES-256)
Encryption in-transit (TLS)
API keys mai esposti in client
Environment variables per secrets

Input Validation:
Client-Side:

File type validation (MIME type)
File size validation
Filename sanitization (rimuovi caratteri speciali)
XSS protection (sanitize HTML input)
CSRF tokens su form

Server-Side (Cloud Functions):

Re-validate tutti gli input client
SQL injection prevention (N/A, NoSQL)
NoSQL injection prevention (validate query params)
Path traversal prevention
Command injection prevention

Secrets Management:
Firebase Functions Config:
# Set secrets
firebase functions:config:set \
anthropic.key="sk-ant-..." \
openai.key="sk-..." \
netlify.token="..." \
github.token="ghp_..."

# Get config (local dev)
firebase functions:config:get > .runtimeconfig.json

Access in Functions:
const anthropicKey = functions.config().anthropic.key;
const openaiKey = functions.config().openai.key;

Rate Limiting:
Cloud Functions:
// Max 10 requests per minute per user
const rateLimiter = new Map();

function checkRateLimit(userId) {
const now = Date.now();
const userRequests = rateLimiter.get(userId) || [];

// Remove requests older than 1 minute
const recentRequests = userRequests.filter(
timestamp => now - timestamp < 60000
);

if (recentRequests.length >= 10) {
throw new functions.https.HttpsError(
'resource-exhausted',
'Too many requests. Please try again later.'
);
}

recentRequests.push(now);
rateLimiter.set(userId, recentRequests);
}

Firestore:

Max 50 reads/second per user
Max 10 writes/second per user

Audit Logging:
// Log security events
await db.collection('audit_logs').add({
userId,
action: 'login_success',
ip: request.ip,
userAgent: request.headers['user-agent'],
timestamp: admin.firestore.FieldValue.serverTimestamp()
});

Eventi Loggati:

Login success/failure
Password change
File upload
Content generation
Publish/unpublish
Delete operations


RNF-003: Usabilità
Priorità: Alta
Design System:
Tema:

Light mode (default)
Dark mode
Auto (segue sistema operativo)
Persistenza preferenza (localStorage)
Transizione smooth tra temi

Colori (Light Mode):
:root {
--primary: #667eea;
--secondary: #764ba2;
--accent: #f093fb;
--text: #2d3748;
--text-secondary: #4a5568;
--bg: #ffffff;
--bg-secondary: #f7fafc;
--border: #e2e8f0;
--success: #48bb78;
--warning: #ed8936;
--error: #f56565;
}

Colori (Dark Mode):
[data-theme="dark"] {
--primary: #818cf8;
--secondary: #a78bfa;
--accent: #f0abfc;
--text: #f7fafc;
--text-secondary: #cbd5e0;
--bg: #1a202c;
--bg-secondary: #2d3748;
--border: #4a5568;
--success: #68d391;
--warning: #f6ad55;
--error: #fc8181;
}

Tipografia:
:root {
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
}

Spacing:
:root {
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
}

Responsive:
Breakpoints:
/* Mobile first */
@media (min-width: 640px) { /* Tablet */ }
@media (min-width: 768px) { /* Tablet landscape */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }

Touch Targets:

Minimo 44x44 px (Apple HIG)
Spacing minimo 8px tra elementi interattivi
Hover states visibili
Focus indicators chiari (outline 2px)

Accessibilità (WCAG 2.1 Level AA):
Contrasto Colori:

Testo normale: minimo 4.5:1
Testo grande (>18px): minimo 3:1
UI components: minimo 3:1

Keyboard Navigation:

Tab order logico
Focus trap in modals
Skip links per navigazione rapida
Shortcut keyboard documentati

Screen Reader:

Semantic HTML5
ARIA labels dove necessario
ARIA live regions per updates dinamici
Alt text per tutte le immagini
Form labels espliciti

Feedback Utente:
Loading States:
┌─────────────────────────────────┐
│ Processing document...          │
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░ 35%        │
│ Extracting text from page 3/5   │
└─────────────────────────────────┘

Toast Notifications:
┌─────────────────────────────────┐
│ ✓ Document uploaded successfully│
│ [×]                             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️ Processing failed. Retry?    │
│ [Retry] [Cancel]                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ℹ️ Generating presentation...   │
│ This may take 30-60 seconds     │
└─────────────────────────────────┘

Error Messages:

Descrittivi (non "Error 500")
Azione suggerita
Link a help/docs se applicabile

Skeleton Screens:
Durante caricamento dati:
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ │
│ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                 │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░ │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘

Onboarding:
Primo Accesso:

Welcome modal con tour guidato
Tooltips contestuali
Empty states con CTA chiare
Video tutorial (opzionale)

Empty States:
┌─────────────────────────────────┐
│         📄                      │
│                                 │
│   No projects yet               │
│                                 │
│   Upload your first document    │
│   to get started                │
│                                 │
│   [+ Upload Document]           │
│                                 │
│   [📺 Watch Tutorial]           │
└─────────────────────────────────┘


RNF-004: Scalabilità
Priorità: Media
Limiti Tier Gratuiti:
Firebase (Spark Plan):



Servizio
Limite Gratuito
Note



Authentication
Illimitato
Phone auth: 10K/mese


Firestore
1 GB storage50K reads/day20K writes/day20K deletes/day
Soft limits


Storage
5 GB storage1 GB download/day



Functions
125K invocazioni/mese40K GB-seconds/mese40K CPU-seconds/mese



Hosting
10 GB storage360 MB/day bandwidth



GitHub Pages:

1 GB storage
100 GB bandwidth/mese
Illimitato siti

Netlify (Free Tier):

100 GB bandwidth/mese
300 build minutes/mese
Illimitati siti

Strategie Scaling:
Caching:
Client-Side:

Service Worker cache assets (7 giorni)
IndexedDB cache Firestore data (5 minuti)
LocalStorage cache user preferences
React Query per cache API calls

Server-Side:

Cloud Functions cache connections
Firestore query cache (server-side)
Storage CDN cache (Firebase default)

Ottimizzazione Storage:
Auto-Cleanup:
// Cloud Function scheduled daily
export const cleanupOldFiles = functions
.pubsub
.schedule('0 2 * * *') // 2 AM daily
.onRun(async (context) => {
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old generated content
    const oldContent = await db
      .collection('generated_content')
      .where('generatedAt', '<', thirtyDaysAgo)
      .where('published.isPublic', '==', false) // Keep published
      .get();
    
    for (const doc of oldContent.docs) {
      // Delete from Storage
      await bucket.file(doc.data().storagePath).delete();
      // Delete from Firestore
      await doc.ref.delete();
    }
});

Compressione:

Gzip per file HTML/CSS/JS
WebP per immagini (fallback JPEG)
Minification automatica

Deduplicazione:

Hash MD5 dei documenti caricati
Evita duplicati identici
Condivisione storage tra progetti simili

Rate Limiting:
Per Utente:

10 upload/ora
5 generazioni HTML/ora
3 export PDF/ora
10 export PNG/ora
5 pubblicazioni/giorno

Implementazione:
const userLimits = {
upload: { max: 10, window: 3600000 }, // 1 hour
generate: { max: 5, window: 3600000 },
exportPDF: { max: 3, window: 3600000 },
exportPNG: { max: 10, window: 3600000 },
publish: { max: 5, window: 86400000 } // 1 day
};

async function checkRateLimit(userId, action) {
const limit = userLimits[action];
const key = `ratelimit:${userId}:${action}`;

const count = await redis.incr(key);
if (count === 1) {
await redis.expire(key, limit.window / 1000);
}

if (count > limit.max) {
throw new Error(`Rate limit exceeded for ${action}`);
}
}

Monitoring:
Metriche da Tracciare:

Firestore reads/writes/deletes per day
Storage usage (GB)
Functions invocations per month
Bandwidth usage per day
Error rate
Response time (p50, p95, p99)

Alerts:

Storage > 80% del limite
Bandwidth > 80% del limite
Error rate > 5%
Response time p95 > 5s

Upgrade Path:
Quando Necessario:

Firestore reads > 40K/day → Blaze Plan
Storage > 4 GB → Blaze Plan
Functions > 100K invocazioni/mese → Blaze Plan
Netlify bandwidth > 80 GB/mese → Pro Plan ($19/mese)

Costi Stimati (Blaze Plan):
Firestore:
- Storage: $0.18/GB/mese
- Reads: $0.06 per 100K
- Writes: $0.18 per 100K

Storage:
- Storage: $0.026/GB/mese
- Download: $0.12/GB

Functions:
- Invocations: $0.40 per 1M
- Compute: $0.0000025/GB-second

Stima 1000 utenti attivi/mese:
- Firestore: ~$5/mese
- Storage: ~$2/mese
- Functions: ~$3/mese
  TOTALE: ~$10/mese + AI costs


🏗️ ARCHITETTURA SISTEMA
Diagramma Architettura Completa
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite Build)                │   │
│  │                                                    │   │
│  │  Components:                                       │   │
│  │  ├── Auth (Login, GitHub OAuth, Code)             │   │
│  │  ├── Dashboard (Projects, Stats, Analytics)       │   │
│  │  ├── Upload (Drag&amp;Drop, Validation, Progress)     │   │
│  │  ├── Generator (Config, Preview, AI Call)         │   │
│  │  ├── Editor (GrapesJS, Visual Editing)            │   │
│  │  ├── Viewer (HTML Preview, Fullscreen)            │   │
│  │  └── Export (PDF, PNG, Publish)                   │   │
│  │                                                    │   │
│  │  State: Zustand                                    │   │
│  │  Router: React Router                              │   │
│  │  UI: Tailwind CSS + Shadcn UI                     │   │
│  │  Icons: Lucide React                               │   │
│  │                                                    │   │
│  │  Client Libraries:                                 │   │
│  │  • html2pdf.js (PDF export)                       │   │
│  │  • html2canvas (PNG export)                       │   │
│  │  • JSZip (ZIP creation)                           │   │
│  │  • GrapesJS (visual editor)                       │   │
│  │  • TipTap (rich text)                             │   │
│  │  • CodeMirror (code editor)                       │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  Hosted on: GitHub Pages                                   │
│  URL: https://username.github.io/gamma-clone               │
└─────────────────────────────────────────────────────────────┘
↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Authentication│  │  Firestore   │  │   Storage    │     │
│  │   (GitHub)   │  │  (Database)  │  │   (Files)    │     │
│  │              │  │              │  │              │     │
│  │ • OAuth 2.0  │  │ Collections: │  │ Buckets:     │     │
│  │ • JWT tokens │  │ • users      │  │ • documents/ │     │
│  │ • Sessions   │  │ • projects   │  │ • generated/ │     │
│  └──────────────┘  │ • generated_ │  │ • shared/    │     │
│                    │   content    │  └──────────────┘     │
│                    │ • shared_    │                        │
│                    │   links      │                        │
│                    │ • audit_logs │                        │
│                    └──────────────┘                        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │          Cloud Functions (Node.js 18)              │   │
│  │                                                    │   │
│  │  Functions:                                        │   │
│  │  ├── processDocument (Storage trigger)            │   │
│  │  │   • Parse PDF/DOCX/TXT                         │   │
│  │  │   • Extract text &amp; metadata                    │   │
│  │  │   • Update Firestore                           │   │
│  │  │                                                │   │
│  │  ├── generateHTML (HTTPS callable)                │   │
│  │  │   • Call Claude API                            │   │
│  │  │   • Generate HTML with libraries               │   │
│  │  │   • Save to Storage                            │   │
│  │  │                                                │   │
│  │  ├── publishToNetlify (HTTPS callable)            │   │
│  │  │   • Create Netlify site                        │   │
│  │  │   • Deploy HTML                                │   │
│  │  │   • Return public URL                          │   │
│  │  │                                                │   │
│  │  ├── trackView (HTTPS)                            │   │
│  │  │   • Log view analytics                         │   │
│  │  │   • Update stats                               │   │
│  │  │                                                │   │
│  │  └── cleanupExpired (Scheduled daily)             │   │
│  │      • Delete old files                           │   │
│  │      • Clean Firestore                            │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              Firebase Hosting                      │   │
│  │         (Shared Links Deployment)                  │   │
│  │                                                    │   │
│  │  Sites:                                            │   │
│  │  • https://{slug}.firebaseapp.com                 │   │
│  │  • Custom domains supported                        │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Anthropic API   │  │   OpenAI API     │               │
│  │ (Claude 3.5)     │  │   (DALL-E 3)     │               │
│  │                  │  │   (Optional)     │               │
│  │ • Text generation│  │ • Image gen      │               │
│  │ • HTML creation  │  │ • AI images      │               │
│  │                  │  │                  │               │
│  │ Cost: $0.09/gen  │  │ Cost: $0.04/img  │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Netlify API    │  │   GitHub API     │               │
│  │                  │  │   (Optional)     │               │
│  │ • Site creation  │  │ • Repo creation  │               │
│  │ • Deploy files   │  │ • Pages deploy   │               │
│  │ • Public URLs    │  │                  │               │
│  │                  │  │                  │               │
│  │ Free: 100GB/mo   │  │ Free: Unlimited  │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘


💻 STACK TECNOLOGICO
Frontend
{
"name": "gamma-clone",
"version": "1.0.0",
"dependencies": {
"react": "^18.2.0",
"react-dom": "^18.2.0",
"react-router-dom": "^6.20.0",

    "firebase": "^10.7.0",
    
    "zustand": "^4.4.7",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tabs": "^1.0.4",
    
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    
    "lucide-react": "^0.303.0",
    
    "react-dropzone": "^14.2.3",
    "react-syntax-highlighter": "^15.5.0",
    
    "html2pdf.js": "^0.10.1",
    "html2canvas": "^1.4.1",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5",
    
    "grapesjs": "^0.21.7",
    "grapesjs-blocks-basic": "^1.0.2",
    "grapesjs-preset-webpage": "^1.0.3",
    
    "@tiptap/core": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-link": "^2.1.13",
    "@tiptap/extension-color": "^2.1.13",
    
    "@codemirror/basic-setup": "^0.20.0",
    "@codemirror/lang-html": "^6.4.7",
    
    "date-fns": "^3.0.0",
    "qrcode": "^1.5.3"
},

"devDependencies": {
"vite": "^5.0.0",
"@vitejs/plugin-react": "^4.2.0",
"typescript": "^5.3.0",
"autoprefixer": "^10.4.0",
"postcss": "^8.4.0",
"eslint": "^8.55.0",
"prettier": "^3.1.0"
}
}

Backend (Firebase Functions)
{
"name": "functions",
"engines": {
"node": "18"
},
"dependencies": {
"firebase-admin": "^12.0.0",
"firebase-functions": "^4.5.0",

    "@anthropic-ai/sdk": "^0.17.0",
    "openai": "^4.24.0",
    
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    
    "html-minifier": "^4.0.0",
    "jszip": "^3.10.1",
    
    "axios": "^1.6.2",
    "form-data": "^4.0.0"
}
}


🗄️ DATABASE SCHEMA
Collection: users
interface User {
uid: string;                    // Firebase Auth UID (document ID)
githubUsername: string;         // Username GitHub (indexed)
email: string;                  // Email GitHub
avatarUrl: string;              // GitHub avatar
accessCodeHash: string;         // SHA-256 hash del codice
accessCodeSalt: string;         // Salt univoco

createdAt: Timestamp;
lastLogin: Timestamp;

settings: {
theme: 'light' | 'dark' | 'auto';
defaultStyle: 'modern' | 'minimal' | 'professional' | 'creative';
defaultPalette: string;
autoSave: boolean;
notifications: {
email: boolean;
processingComplete: boolean;
weeklySummary: boolean;
};
};

usage: {
projectsCreated: number;
htmlGenerated: number;
pdfExported: number;
pngExported: number;
published: number;
storageUsed: number;          // bytes
aiCostsThisMonth: number;     // USD
};

limits: {
maxProjects: number;          // -1 = unlimited
maxStorageGB: number;
maxExportsPerDay: number;
maxPublishedSites: number;
};
}

Indexes:

githubUsername (unique, ascending)
email (unique, ascending)


Collection: projects
interface Project {
id: string;                     // Auto-generated (document ID)
userId: string;                 // Reference to user (indexed)

name: string;                   // Nome documento
description?: string;           // Descrizione opzionale
tags: string[];                 // Tags per organizzazione

originalFile: {
name: string;
size: number;
type: string;                 // MIME type
storagePath: string;          // Firebase Storage path
uploadedAt: Timestamp;
md5Hash: string;              // Per deduplicazione
};

extractedText: string;          // Testo completo estratto (max 1MB)

metadata: {
wordCount: number;
pageCount: number;
paragraphCount: number;
characterCount: number;
language: 'it' | 'en' | 'auto';
languageConfidence: number;   // 0-1
detectedSections: string[];
hasImages: boolean;
hasTables: boolean;
hasCharts: boolean;
processedAt: Timestamp;
processingTime: number;       // milliseconds
};

status: 'uploading' | 'processing' | 'ready' | 'error';
error?: {
message: string;
code: string;
timestamp: Timestamp;
retryCount: number;
};

createdAt: Timestamp;
updatedAt: Timestamp;
}

Indexes:

userId + createdAt (composite, descending)
userId + status (composite)
status (single, ascending)
originalFile.md5Hash (single, ascending)


Collection: generated_content
interface GeneratedContent {
id: string;                     // Auto-generated (document ID)
projectId: string;              // Reference to project (indexed)
userId: string;                 // Reference to user (indexed)

type: 'html' | 'pdf' | 'png';

storagePath: string;            // Firebase Storage path
downloadUrl: string;            // Signed URL (expires 24h)
publicUrl?: string;             // Public URL (if published)

metadata: {
// Common
fileSize: number;             // bytes
generatedAt: Timestamp;

    // HTML specific
    style?: 'modern' | 'minimal' | 'professional' | 'creative';
    palette?: string;
    slideCount?: number;
    libraries?: string[];         // ['reveal', 'aos', 'chart', ...]
    
    // PDF specific
    format?: 'A4' | 'Letter' | 'A3';
    orientation?: 'portrait' | 'landscape';
    pageCount?: number;
    
    // PNG specific
    dimensions?: { width: number; height: number };
    quality?: number;
    format?: 'png' | 'jpg' | 'webp';
    totalImages?: number;
};

// Publication info
published?: {
isPublic: boolean;
publicUrl: string;            // Netlify URL
provider: 'netlify' | 'github' | 'firebase';
siteId?: string;              // Provider site ID
deployId?: string;            // Provider deploy ID
slug: string;                 // Short identifier
deployedAt: Timestamp;

    protection?: {
      password?: string;          // Hashed
      requireAuth: boolean;
      allowDownload: boolean;
    };
    
    stats: {
      views: number;
      uniqueVisitors: number;
      lastViewedAt?: Timestamp;
      avgTimeOnPage?: number;     // seconds
    };
};

// Editor state (for HTML)
editorState?: {
grapesData: object;           // GrapesJS JSON
version: number;
lastSaved: Timestamp;
lastModifiedBy: string;       // userId
};

expiresAt?: Timestamp;          // Auto-delete date

createdAt: Timestamp;
updatedAt: Timestamp;
}

Indexes:

projectId + type (composite)
userId + generatedAt (composite, descending)
userId + type (composite)
expiresAt (single, ascending)
published.isPublic + published.stats.views (composite, descending)


Collection: shared_links
interface SharedLink {
id: string;                     // Short slug (6 chars, document ID)
projectId: string;              // Reference to project
contentId: string;              // Reference to generated_content
userId: string;                 // Owner

url: string;                    // Full public URL
slug: string;                   // Short identifier (same as id)
qrCode?: string;                // Base64 QR code image

protection: {
password?: string;            // Hashed password (SHA-256)
requireAuth: boolean;
allowedEmails?: string[];     // Whitelist
allowDownload: boolean;
};

expiresAt?: Timestamp;          // Optional expiration

stats: {
views: number;
uniqueVisitors: number;
lastViewedAt?: Timestamp;

    viewHistory: Array<{
      timestamp: Timestamp;
      ipHash: string;             // Hashed IP for privacy
      userAgent: string;
      referrer?: string;
      country?: string;           // From IP geolocation
      device: 'desktop' | 'mobile' | 'tablet';
    }>;
    
    // Aggregated stats
    viewsByDay: { [date: string]: number };
    viewsByCountry: { [country: string]: number };
    viewsByDevice: { desktop: number; mobile: number; tablet: number };
};

createdAt: Timestamp;
updatedAt: Timestamp;
}

Indexes:

slug (unique, ascending)
userId + createdAt (composite, descending)
expiresAt (single, ascending)
stats.views (single, descending)


Collection: audit_logs
interface AuditLog {
id: string;                     // Auto-generated
userId: string;                 // Who performed action

action:
| 'login_success'
| 'login_failure'
| 'logout'
| 'password_change'
| 'file_upload'
| 'content_generation'
| 'content_publish'
| 'content_unpublish'
| 'content_delete'
| 'settings_update';

details: {
[key: string]: any;           // Action-specific details
};

metadata: {
ip: string;                   // IP address
userAgent: string;
location?: {
country: string;
city: string;
};
};

timestamp: Timestamp;
}

Indexes:

userId + timestamp (composite, descending)
action + timestamp (composite, descending)
timestamp (single, descending)

Retention: 90 giorni (auto-delete)

🔌 API E INTEGRAZIONI
Anthropic Claude API
Endpoint: https://api.anthropic.com/v1/messages
Authentication:
Headers:
x-api-key: {ANTHROPIC_API_KEY}
anthropic-version: 2023-06-01
content-type: application/json

Request Format:
{
"model": "claude-3-5-sonnet-20241022",
"max_tokens": 8000,
"temperature": 0.7,
"system": "System prompt...",
"messages": [
{
"role": "user",
"content": "User prompt..."
}
]
}

Response Format:
{
"id": "msg_01ABC123",
"type": "message",
"role": "assistant",
"content": [
{
"type": "text",
"text": "Generated HTML..."
}
],
"model": "claude-3-5-sonnet-20241022",
"stop_reason": "end_turn",
"usage": {
"input_tokens": 10234,
"output_tokens": 4567
}
}

Pricing:

Input: $3 per 1M tokens
Output: $15 per 1M tokens

Rate Limits (Tier 1):

50 requests/minute
40,000 tokens/minute
500,000 tokens/day

Error Handling:
try {
const response = await anthropic.messages.create({...});
} catch (error) {
if (error.status === 429) {
// Rate limit → Retry with exponential backoff
} else if (error.status === 500) {
// Server error → Retry max 3 times
} else {
// Other error → Log and fail
}
}


OpenAI API (Opzionale)
Endpoint: https://api.openai.com/v1/images/generations
Authentication:
Headers:
Authorization: Bearer {OPENAI_API_KEY}
Content-Type: application/json

Request Format:
{
"model": "dall-e-3",
"prompt": "Modern office workspace with laptop and coffee, natural lighting, professional, photorealistic",
"size": "1024x1024",
"quality": "standard",
"n": 1
}

Response Format:
{
"created": 1710345600,
"data": [
{
"url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
"revised_prompt": "..."
}
]
}

Pricing:

Standard 1024x1024: $0.040/image
HD 1024x1024: $0.080/image
Standard 1792x1024: $0.080/image
HD 1792x1024: $0.120/image

Rate Limits:

50 images/minute (Tier 1)


Netlify API
Base URL: https://api.netlify.com/api/v1
Authentication:
Headers:
Authorization: Bearer {NETLIFY_TOKEN}
Content-Type: application/json

Create Site:
POST /sites
Body:
{
"name": "presentation-abc123",
"custom_domain": "abc123.yourdomain.com"
}

Response:
{
"id": "site_id_123",
"name": "presentation-abc123",
"url": "https://presentation-abc123.netlify.app",
"admin_url": "https://app.netlify.com/sites/presentation-abc123",
"state": "ready"
}

Deploy Files:
POST /sites/{site_id}/deploys
Headers:
Content-Type: application/zip
Body: {zip_file_binary}

Response:
{
"id": "deploy_id_456",
"state": "building",
"deploy_url": "https://deploy-preview-123--presentation-abc123.netlify.app"
}

Check Deploy Status:
GET /sites/{site_id}/deploys/{deploy_id}

Response:
{
"id": "deploy_id_456",
"state": "ready",
"deploy_url": "https://presentation-abc123.netlify.app",
"published_at": "2024-03-13T10:30:00Z"
}

Limits (Free Tier):

100 GB bandwidth/month
300 build minutes/month
Unlimited sites


GitHub API (Opzionale)
Base URL: https://api.github.com
Authentication:
Headers:
Authorization: Bearer {GITHUB_TOKEN}
Accept: application/vnd.github+json

Create Repository:
POST /user/repos
Body:
{
"name": "presentation-abc123",
"description": "Presentation generated with GammaClone",
"private": false,
"auto_init": true
}

Response:
{
"id": 123456789,
"name": "presentation-abc123",
"full_name": "username/presentation-abc123",
"html_url": "https://github.com/username/presentation-abc123"
}

Create/Update File:
PUT /repos/{owner}/{repo}/contents/index.html
Body:
{
"message": "Add presentation",
"content": "{base64_encoded_html}",
"branch": "main"
}

Enable GitHub Pages:
POST /repos/{owner}/{repo}/pages
Body:
{
"source": {
"branch": "main",
"path": "/"
}
}

Response:
{
"url": "https://username.github.io/presentation-abc123/",
"status": "built"
}


💰 COSTI FINALI
Breakdown Dettagliato
═══════════════════════════════════════════════════════
INFRASTRUTTURA (Tier Gratuiti)
═══════════════════════════════════════════════════════

GitHub Pages:
✅ Storage: 1 GB                               $0
✅ Bandwidth: 100 GB/mese                      $0
✅ Deploy: Illimitati                          $0

Firebase Spark Plan:
✅ Authentication: Illimitato                  $0
✅ Firestore: 1 GB, 50K reads/day              $0
✅ Storage: 5 GB, 1 GB download/day            $0
✅ Functions: 125K invocazioni/mese            $0
✅ Hosting: 10 GB, 360 MB/day                  $0

Netlify Free Tier:
✅ Bandwidth: 100 GB/mese                      $0
✅ Sites: Illimitati                           $0
✅ Deploy: Illimitati                          $0

SUBTOTALE INFRASTRUTTURA:                      $0/mese

═══════════════════════════════════════════════════════
AI SERVICES
═══════════════════════════════════════════════════════

Claude API (100 generazioni/mese):
- Input: 10K tokens × 100 = 1M tokens          $3.00
- Output: 4K tokens × 100 = 400K tokens        $6.00
  SUBTOTALE CLAUDE:                              $9.00/mese

OpenAI DALL-E 3 (opzionale, 10 immagini/mese):
- Standard 1024x1024: 10 × $0.04               $0.40
  SUBTOTALE OPENAI:                              $0.40/mese

SUBTOTALE AI:                                  $9.40/mese

═══════════════════════════════════════════════════════
LIBRERIE E TOOLS
═══════════════════════════════════════════════════════

Frontend Libraries:
✅ React, Vite, Tailwind                       $0
✅ GrapesJS, TipTap, CodeMirror                $0
✅ html2pdf, html2canvas, JSZip                $0
✅ Tutte via CDN/NPM                           $0

SUBTOTALE LIBRERIE:                            $0/mese

═══════════════════════════════════════════════════════
TOTALE MENSILE
═══════════════════════════════════════════════════════

Scenario Minimo (no AI images):                $9.00/mese
Scenario Standard (10 AI images):              $9.40/mese
Scenario Alto (50 AI images):                  $11.00/mese

═══════════════════════════════════════════════════════
COSTI ANNUALI
═══════════════════════════════════════════════════════

Minimo:    $9.00 × 12 =                        $108/anno
Standard:  $9.40 × 12 =                        $113/anno
Alto:      $11.00 × 12 =                       $132/anno

═══════════════════════════════════════════════════════
CONFRONTO CON ALTERNATIVE
═══════════════════════════════════════════════════════

Gamma.app Pro:                                 $96/anno
Beautiful.ai Pro:                              $144/anno
Canva Pro:                                     $120/anno
Pitch Pro:                                     $96/anno

NOSTRA SOLUZIONE:                              $108-132/anno
RISPARMIO vs GAMMA:                            Comparabile
VANTAGGIO: Controllo totale + Personalizzazione

═══════════════════════════════════════════════════════

Stima Costi per Utente Attivo
Utente Leggero (5 presentazioni/mese):
- Claude: 5 × $0.09 = $0.45
- DALL-E: 0 immagini = $0
  TOTALE: $0.45/mese

Utente Medio (20 presentazioni/mese):
- Claude: 20 × $0.09 = $1.80
- DALL-E: 10 immagini = $0.40
  TOTALE: $2.20/mese

Utente Pesante (100 presentazioni/mese):
- Claude: 100 × $0.09 = $9.00
- DALL-E: 50 immagini = $2.00
  TOTALE: $11.00/mese

Quando Serve Upgrade?
Firebase Blaze Plan (Pay-as-you-go):
Necessario se:

Firestore reads > 50K/giorno
Storage > 5 GB
Functions invocazioni > 125K/mese
Hosting bandwidth > 360 MB/giorno

Costi Stimati Blaze (1000 utenti attivi):
Firestore:
- Storage: 10 GB × $0.18 = $1.80
- Reads: 1M × $0.06/100K = $6.00
- Writes: 200K × $0.18/100K = $0.36

Storage:
- Storage: 50 GB × $0.026 = $1.30
- Download: 100 GB × $0.12 = $12.00

Functions:
- Invocazioni: 500K × $0.40/1M = $0.20
- Compute: varia, ~$3.00

TOTALE FIREBASE: ~$25/mese

+ AI costs: ~$50-100/mese (1000 generazioni)

TOTALE CON 1000 UTENTI: ~$75-125/mese


📅 PIANO DI SVILUPPO
EPIC 1: Fondamenta e Autenticazione
Durata: 1 settimana (Sprint 1)Priorità: Critica
Sprint 1 - Setup &amp; Auth (5 giorni)
Task 1.1: Setup Progetto

Crea repository GitHub
Setup Vite + React + TypeScript
Configura Tailwind CSS
Setup ESLint + Prettier
Configura GitHub Actions (CI/CD)
Deploy iniziale su GitHub Pages

Stima: 4 ore
Task 1.2: Setup Firebase

Crea progetto Firebase Console
Abilita Authentication (GitHub provider)
Abilita Firestore
Abilita Storage
Abilita Functions
Abilita Hosting
Configura Firebase CLI locale
Setup emulators per sviluppo

Stima: 3 ore
Task 1.3: Autenticazione GitHub OAuth

Crea GitHub OAuth App
Implementa login flow
Gestione callback
Salvataggio token
UI componente login
Error handling

Stima: 6 ore
Task 1.4: Sistema Codice Accesso

Implementa hashing SHA-256 + salt
UI input codice
Verifica codice
Rate limiting (max 5 tentativi)
Lockout temporaneo
Primo accesso: imposta codice

Stima: 5 ore
Task 1.5: Gestione Sessione

Genera JWT token
Salva in localStorage
Auto-refresh token
Logout
Protected routes
Redirect se non autenticato

Stima: 4 ore
Task 1.6: Firestore Security Rules

Scrivi rules per users
Scrivi rules per projects
Scrivi rules per generated_content
Test rules con emulator
Deploy rules

Stima: 3 ore
Task 1.7: UI Base

Layout principale
Sidebar navigation
Header con user info
Dark/Light mode toggle
Responsive mobile
Loading states

Stima: 6 ore
Task 1.8: Testing &amp; Bug Fixing

Test login flow completo
Test edge cases
Fix bugs
Code review
Documentation

Stima: 4 ore
TOTALE SPRINT 1: 35 ore (5 giorni × 7 ore)

EPIC 2: Upload e Processing
Durata: 1 settimana (Sprint 2)Priorità: Alta
Sprint 2 - Upload &amp; Processing (5 giorni)
Task 2.1: UI Upload

Componente drag-and-drop (react-dropzone)
Validazione file client-side
Preview file selezionato
Progress bar upload
Error handling UI
Mobile-friendly

Stima: 5 ore
Task 2.2: Upload Firebase Storage

Implementa upload con Firebase SDK
Gestione progress
Gestione errori
Retry automatico
Cancellazione upload
Storage path structure

Stima: 4 ore
Task 2.3: Firestore Project Creation

Crea record progetto
Status: "uploading"
Metadata iniziali
Real-time listener
Update UI on status change

Stima: 3 ore
Task 2.4: Cloud Function - processDocument

Setup function structure
Storage trigger onFinalize
Download file da Storage
Implementa parser PDF (pdf-parse)
Implementa parser DOCX (mammoth)
Implementa parser TXT
Error handling
Timeout management

Stima: 8 ore
Task 2.5: Analisi Contenuto

Word count
Paragraph count
Language detection
Section extraction (regex)
Metadata generation
Preview generation (500 chars)

Stima: 4 ore
Task 2.6: Update Firestore

Salva extractedText
Salva metadata
Update status: "ready"
Gestione errori
Retry logic

Stima: 3 ore
Task 2.7: Dashboard Projects List

Componente lista progetti
Card progetto con info
Filtri (status, data)
Ordinamento
Ricerca
Paginazione

Stima: 5 ore
Task 2.8: Testing &amp; Optimization

Test con file reali
Test edge cases (file corrotti, grandi)
Ottimizzazione performance
Fix bugs
Documentation

Stima: 3 ore
TOTALE SPRINT 2: 35 ore

EPIC 3: Generazione HTML con AI
Durata: 1 settimana (Sprint 3)Priorità: Alta
Sprint 3 - AI Generation (5 giorni)
Task 3.1: Integrazione Claude API

Setup Anthropic SDK
Configurazione API key (Firebase config)
Test chiamata base
Error handling
Retry logic
Rate limiting

Stima: 4 ore
Task 3.2: Prompt Engineering

Scrivi system prompt
Scrivi user prompt template
Test con documenti reali
Ottimizzazione prompt
Gestione token limits
Documentazione prompt

Stima: 6 ore
Task 3.3: Cloud Function - generateHTML

Setup function HTTPS callable
Input validation
Recupera progetto da Firestore
Prepara prompt
Chiamata Claude API
Parsing risposta
Error handling

Stima: 5 ore
Task 3.4: Post-Processing HTML

Estrazione HTML da response
Validazione HTML5
Minification (html-minifier)
Injection meta tags
Ottimizzazione performance
Salvataggio Storage

Stima: 4 ore
Task 3.5: UI Configurazione Generazione

Modal configurazione
Selezione stile
Selezione palette
Opzioni librerie
Preview opzioni
Validazione input

Stima: 5 ore
Task 3.6: Salvataggio Firestore

Crea record generated_content
Metadata completi
Signed URL generation
Link a progetto
Update UI

Stima: 3 ore
Task 3.7: Preview HTML

Componente viewer
Iframe sandbox
Fullscreen mode
Navigation controls
Download button
Share button

Stima: 5 ore
Task 3.8: Testing &amp; Refinement

Test con vari documenti
Test vari stili
Ottimizzazione qualità output
Fix bugs
Performance tuning

Stima: 3 ore
TOTALE SPRINT 3: 35 ore

EPIC 4: Export e Pubblicazione
Durata: 1 settimana (Sprint 4)Priorità: Alta
Sprint 4 - Export &amp; Publish (5 giorni)
Task 4.1: Export PDF (html2pdf.js)

Integrazione html2pdf.js
UI configurazione PDF
Implementazione export
Gestione page-breaks
Ottimizzazione qualità
Download automatico

Stima: 5 ore
Task 4.2: Export Immagini (html2canvas)

Integrazione html2canvas
UI configurazione immagini
Screenshot ogni slide
Conversione formati (PNG/JPG/WebP)
Ottimizzazione qualità
Watermark (opzionale)

Stima: 6 ore
Task 4.3: Creazione ZIP (JSZip)

Integrazione JSZip
Aggiunta immagini a ZIP
Compressione
Download ZIP
Progress indicator

Stima: 3 ore
Task 4.4: Integrazione Netlify API

Setup Netlify token
Cloud Function publishToNetlify
Create site
Deploy files
Poll deploy status
Return public URL

Stima: 6 ore
Task 4.5: UI Pubblicazione

Modal configurazione publish
Input site name
Opzioni protezione
Progress indicator
Success screen con URL
QR code generation
Share buttons

Stima: 5 ore
Task 4.6: Gestione Link Pubblicati

Lista presentazioni pubblicate
Stats visualizzazioni
Unpublish
Modifica settings
Analytics base

Stima: 4 ore
Task 4.7: View Tracking

Cloud Function trackView
Injection tracking script
Salvataggio stats Firestore
Privacy-compliant (hash IP)
Dashboard analytics

Stima: 4 ore
Task 4.8: Testing &amp; Deployment

Test export PDF
Test export immagini
Test pubblicazione
Test tracking
Fix bugs
Deploy production

Stima: 2 ore
TOTALE SPRINT 4: 35 ore

EPIC 5: Editor Visuale
Durata: 2 settimane (Sprint 5-6)Priorità: Alta
Sprint 5 - Editor Base (5 giorni)
Task 5.1: Integrazione GrapesJS

Setup GrapesJS
Configurazione base
Caricamento HTML generato
Salvataggio modifiche
Auto-save (5 secondi)

Stima: 6 ore
Task 5.2: Componenti Base

Slide component
Text component (con TipTap)
Image component
Button component
Icon component
Divider component

Stima: 8 ore
Task 5.3: Blocks Panel

Organizzazione categorie
Drag &amp; drop
Search blocks
Custom blocks

Stima: 4 ore
Task 5.4: Layers Panel

Gerarchia elementi
Drag to reorder
Visibility toggle
Lock element
Context menu

Stima: 5 ore
Task 5.5: Style Manager

Typography controls
Colors controls
Spacing controls
Border controls
Effects controls

Stima: 6 ore
Task 5.6: Asset Manager

Upload immagini
URL esterni
Libreria assets
Search &amp; filter
Delete assets

Stima: 4 ore
Task 5.7: Testing Base

Test componenti
Test salvataggio
Test caricamento
Fix bugs

Stima: 2 ore
TOTALE SPRINT 5: 35 ore

Sprint 6 - Editor Avanzato (5 giorni)
Task 6.1: Componenti Avanzati

Chart component (Chart.js)
Video component
Form component
Countdown component
Code component

Stima: 10 ore
Task 6.2: AI Image Generation

Integrazione DALL-E 3
UI generazione immagine
Modal configurazione
Preview risultato
Salvataggio in Asset Manager

Stima: 5 ore
Task 6.3: Slide Templates

Creazione template library
UI selezione template
Inserimento template
Personalizzazione

Stima: 4 ore
Task 6.4: Global Styles

UI global styles
Color palette manager
Typography settings
Spacing settings
Apply to all slides

Stima: 4 ore
Task 6.5: Responsive Editing

Device toolbar
Breakpoint manager
Device-specific overrides
Preview per device

Stima: 5 ore
Task 6.6: Version History

Auto-snapshot ogni ora
Manual snapshot
Lista versioni
Restore versione
Compare diff

Stima: 5 ore
Task 6.7: Testing Completo

Test tutti componenti
Test responsive
Test versioning
Performance testing
Fix bugs

Stima: 2 ore
TOTALE SPRINT 6: 35 ore

EPIC 6: Polish e Launch
Durata: 1 settimana (Sprint 7)Priorità: Media
Sprint 7 - Polish &amp; Launch (5 giorni)
Task 7.1: Mobile Optimization

Responsive dashboard
Responsive editor
Touch gestures
Mobile navigation
Performance mobile

Stima: 6 ore
Task 7.2: Onboarding

Welcome modal
Tour guidato
Tooltips contestuali
Video tutorial
Help documentation

Stima: 5 ore
Task 7.3: Settings Page

Account settings
Security settings
Preferences
Usage stats
Change password/code

Stima: 4 ore
Task 7.4: Analytics Dashboard

Overview stats
Charts visualizzazioni
Top presentations
Traffic sources
Device breakdown

Stima: 5 ore
Task 7.5: Error Handling Globale

Error boundary React
Toast notifications
Error logging
User-friendly messages
Retry mechanisms

Stima: 4 ore
Task 7.6: Performance Optimization

Code splitting
Lazy loading
Image optimization
Caching strategy
Lighthouse audit

Stima: 5 ore
Task 7.7: Security Audit

Review Security Rules
Penetration testing
XSS prevention
CSRF protection
Rate limiting test

Stima: 4 ore
Task 7.8: Final Testing &amp; Deploy

End-to-end testing
Cross-browser testing
Load testing
Fix critical bugs
Production deployment

Stima: 2 ore
TOTALE SPRINT 7: 35 ore

RIEPILOGO TIMELINE
┌─────────────────────────────────────────────────────────┐
│                    TIMELINE PROGETTO                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Sprint 1 (Settimana 1): Setup &amp; Auth                   │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 2 (Settimana 2): Upload &amp; Processing            │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 3 (Settimana 3): AI Generation                  │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 4 (Settimana 4): Export &amp; Publish               │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 5 (Settimana 5): Editor Base                    │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 6 (Settimana 6): Editor Avanzato                │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
│ Sprint 7 (Settimana 7): Polish &amp; Launch                │
│ ▓▓▓▓▓▓▓ 35 ore                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ TOTALE: 7 settimane (245 ore)                          │
│                                                         │
│ Ritmo: 35 ore/settimana (7 ore/giorno × 5 giorni)     │
│                                                         │
│ Milestone:                                              │
│ • Fine Sprint 4: MVP funzionante (4 settimane)         │
│ • Fine Sprint 6: Feature complete (6 settimane)        │
│ • Fine Sprint 7: Production ready (7 settimane)        │
└─────────────────────────────────────────────────────────┘


PRIORITIZZAZIONE
Must Have (MVP - 4 settimane):

✅ Autenticazione
✅ Upload documenti
✅ Processing (parsing)
✅ Generazione HTML con AI
✅ Export PDF/PNG
✅ Pubblicazione Netlify

Should Have (6 settimane):

✅ Editor visuale completo
✅ Componenti avanzati
✅ AI image generation
✅ Version history
✅ Templates

Nice to Have (7 settimane):

✅ Analytics avanzati
✅ Onboarding
✅ Mobile optimization
✅ Collaboration (future)


RISCHI E MITIGAZIONI



Rischio
Probabilità
Impatto
Mitigazione



Claude API rate limit
Media
Alto
Implementare queue + retry


Netlify deploy lento
Bassa
Medio
Fallback a GitHub Pages


GrapesJS learning curve
Alta
Medio
Documentazione + esempi


Performance editor
Media
Alto
Code splitting + lazy load


Costi AI imprevisti
Bassa
Medio
Monitoring + alerts



🎯 CONCLUSIONI
Punti di Forza
✅ Costi Minimi: Solo $9-11/mese (AI APIs)✅ Scalabilità: Tier gratuiti generosi✅ Performance: Export client-side, zero latenza server✅ Flessibilità: Editor visuale completo✅ Tecnologie Moderne: React, Firebase, GrapesJS, Claude AI✅ Privacy: Dati utente protetti, nessun vendor lock-in✅ Open Source: Librerie gratuite, codice personalizzabile  
Differenziatori vs Gamma.app



Feature
Gamma.app
Nostra Soluzione



Costo
$8-16/mese
$9-11/mese


Controllo codice
❌
✅


Self-hosted
❌
✅


Editor visuale
✅
✅


AI generation
✅
✅


Export PDF/PNG
✅
✅


Custom domain
✅
✅


Pubblicazione
✅
✅


API access
❌
✅


White label
❌
✅


Prossimi Passi

✅ Approvazione documentazione
🚀 Inizio Sprint 1 (Setup &amp; Auth)
📝 Setup repository GitHub
🔧 Configurazione Firebase
💻 Sviluppo secondo timeline


Documento Completo e Pronto per Implementazione! 🎉
