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

## 4. Aggiungi i Secrets su GitHub (NON serve .env, NON si committano)

Il deploy avviene tramite GitHub Actions che legge i valori dai **GitHub Secrets**.

### Come aggiungere i Secrets
1. Vai sul tuo repository GitHub: `github.com/tuousername/presentationai`
2. **Settings** → **Secrets and variables** → **Actions**
3. Clicca **"New repository secret"** per ciascuno dei seguenti:

| Nome Secret | Valore |
|-------------|--------|
| `VITE_FIREBASE_API_KEY` | API key Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | es. `presentationai.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | es. `presentationai` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID Firebase |
| `VITE_FIREBASE_APP_ID` | App ID Firebase |
| `VITE_ALLOWED_GITHUB_USERS` | il tuo username GitHub in minuscolo |
| `VITE_ACCESS_CODE` | il codice che userai per accedere (scelto da te) |
| `VITE_GEMINI_API_KEY` | API key Gemini |

> Una volta salvati, i Secrets non sono piu' visibili (nemmeno a te).
> GitHub Actions li inietta durante la build senza che finiscano nel codice.

### Abilita GitHub Pages
1. **Settings** → **Pages**
2. **Source**: seleziona **"GitHub Actions"**
3. Salva

Il primo deploy parte automaticamente al prossimo push su `master`.
L'app sara' disponibile su: `https://tuousername.github.io/presentationai/`

---

## 5. Sviluppo locale (opzionale, solo se vuoi testare in locale)

Per sviluppare in locale crea `.env` (non viene committato, e' nel .gitignore):

```bash
cp .env.example .env
# poi riempi i valori in .env
```

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

## Regole Firestore e Storage (da applicare manualmente)

I file `firestore.rules` e `storage.rules` nella root del progetto contengono le regole di sicurezza.

### Firestore Rules
1. **Firebase Console → Firestore → Regole**
2. Incolla il contenuto di `firestore.rules` → Pubblica

### Storage Rules
1. **Firebase Console → Storage → Regole**
2. Incolla il contenuto di `storage.rules` → Pubblica

### Indice Firestore (necessario per le query)
1. **Firestore → Indici → Crea indice**
2. Collection: `projects` → Campi: `userId` (asc) + `createdAt` (desc) → Crea
3. Collection: `generated_content` → Campi: `projectId` (asc) + `createdAt` (desc) → Crea

> In alternativa, la prima volta che esegui una query Firestore ti dà un link diretto per creare l'indice nella console.


> **Firebase Storage non è necessario** — file e HTML vengono gestiti
> interamente tramite Firestore e parsing client-side.

## Prossimi Sprint

- **Sprint 4**: Editor visuale (GrapesJS)
- **Sprint 5**: Export PDF/PNG + Pubblicazione
