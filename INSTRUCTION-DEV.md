# INSTRUCTION-DEV - Cose da fare manualmente

## 1. Setup Firebase (OBBLIGATORIO)

### Crea Progetto Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Aggiungi progetto" → nome: `presentationai`
3. Disabilita Google Analytics (non serve)
4. Crea il progetto

### Configura Authentication
1. Nel progetto Firebase → **Authentication** → "Inizia"
2. Vai su **Sign-in method** → Aggiungi provider → **GitHub**
3. Ti servira' Client ID e Client Secret da GitHub (vedi punto 2)
4. Copia il **callback URL** che Firebase ti mostra (tipo `https://presentationai.firebaseapp.com/__/auth/handler`)

### Configura Firestore Database
1. **Firestore Database** → "Crea database"
2. Seleziona **modalita' produzione**
3. Scegli la region piu' vicina (eur3 per Europa)
4. Una volta creato, vai su **Regole** e incolla:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### Prendi le credenziali Firebase
1. **Impostazioni progetto** (ingranaggio) → **Generale**
2. Scorri in basso → "Le tue app" → clicca icona **Web** (`</>`)
3. Registra l'app con nome `presentationai-web`
4. Copia i valori della configurazione Firebase

## 2. Setup GitHub OAuth App

1. Vai su [GitHub Developer Settings](https://github.com/settings/developers)
2. **OAuth Apps** → "New OAuth App"
3. Compila:
   - **Application name**: `PresentationAI`
   - **Homepage URL**: `http://localhost:5173` (per ora)
   - **Authorization callback URL**: il callback URL copiato da Firebase Auth (punto 1)
4. Clicca "Register application"
5. Copia il **Client ID**
6. Genera un **Client Secret** e copialo
7. Torna in Firebase → Authentication → GitHub provider → incolla Client ID e Client Secret

## 3. Setup Google Gemini API Key

1. Vai su [Google AI Studio](https://aistudio.google.com/apikey)
2. Clicca "Create API Key"
3. Seleziona il progetto Google Cloud (o creane uno nuovo)
4. Copia la API Key

> **Piano gratuito Gemini**: 15 RPM, 1 milione di token/minuto, 1500 richieste/giorno.
> Piu' che sufficiente per uso personale!

## 4. Configura il file .env

Copia `.env.example` in `.env` e riempi tutti i valori:

```bash
cp .env.example .env
```

Poi modifica `.env`:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=presentationai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=presentationai
VITE_FIREBASE_STORAGE_BUCKET=presentationai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_ALLOWED_GITHUB_USERS=tuousername

VITE_GEMINI_API_KEY=AIzaSy...
```

**IMPORTANTE**: `VITE_ALLOWED_GITHUB_USERS` deve contenere il tuo username GitHub in minuscolo. Solo gli utenti in questa lista potranno accedere.

## 5. Avvia il progetto

```bash
npm install
npm run dev
```

Apri http://localhost:5173

## 6. Test del flusso di login

1. Clicca "Accedi con GitHub"
2. Autorizza l'app OAuth su GitHub
3. Al primo accesso ti viene chiesto di impostare un codice a 6 cifre
4. Scegli il codice e salvalo (ti servira' per ogni accesso futuro)
5. Dovresti vedere la Dashboard

## Struttura del Progetto

```
src/
├── components/
│   ├── auth/          # Login, codice accesso
│   ├── layout/        # Sidebar, Header, AppLayout
│   └── ui/            # Button, Card, Input, Spinner
├── config/
│   ├── firebase.ts    # Configurazione Firebase
│   └── gemini.ts      # Configurazione Google Gemini
├── hooks/             # Custom hooks (prossimi sprint)
├── lib/
│   └── utils.ts       # Utility: cn(), hashCode(), etc.
├── pages/             # Dashboard, Upload, Projects, Settings
├── stores/
│   ├── authStore.ts   # Stato autenticazione (Zustand)
│   └── themeStore.ts  # Stato tema dark/light
├── types/
│   └── index.ts       # Tipi TypeScript
├── App.tsx            # Routing + AuthGuard
└── main.tsx           # Entry point
```

## Prossimi Sprint

- **Sprint 2**: Upload documenti + processing (drag&drop, Firebase Storage, parsing PDF/DOCX)
- **Sprint 3**: Generazione HTML con Gemini AI
- **Sprint 4**: Editor visuale (GrapesJS)
- **Sprint 5**: Export PDF/PNG + Pubblicazione
