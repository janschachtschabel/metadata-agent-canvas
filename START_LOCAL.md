# 🚀 Lokale Entwicklung starten

## ⚡ Schnellstart (3 Schritte)

### Schritt 1: API-Key als Environment Variable setzen

**Wichtig:** Der Proxy benötigt den API-Key als Environment Variable!

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-proj-..."
```

**Windows (CMD):**
```cmd
set OPENAI_API_KEY=sk-proj-...
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY=sk-proj-...
```

### Schritt 2: Proxy-Server starten (Terminal 1)
```bash
npm run proxy
```

Sollte ausgeben:
```
🚀 Starting local OpenAI proxy server...
📡 Proxy listening on: http://localhost:3001
🔑 Using API Key: sk-proj-fGvdFrf8ZApf...
✅ Proxy server ready!
```

**Falls Fehler:**
```
❌ ERROR: OPENAI_API_KEY environment variable is not set!
```
→ Zurück zu Schritt 1!

**Wichtig:** Dieses Terminal **laufen lassen**!

### Schritt 3: Angular App starten (Terminal 2)
```bash
npm start
```

Sollte ausgeben:
```
✅ Environment processing complete
** Angular Live Development Server is listening on localhost:4200 **
```

Dann Browser öffnen:
```
http://localhost:4200
```

**Das war's!** Die App verwendet automatisch den lokalen Proxy. Kein CORS-Problem mehr! ✅

---

## 🔍 Wie funktioniert es?

```
Browser (Port 4200) → Local Proxy (Port 3001) → OpenAI API
                       ✅ CORS headers added
```

**Der lokale Proxy:**
- Läuft auf Port 3001
- Leitet Requests an OpenAI API weiter
- Fügt CORS-Headers hinzu (erlaubt Browser-Zugriff)
- Verwendet Ihren API-Key aus `environment.ts`

---

## 🐛 Troubleshooting

### Fehler: "Port 3001 already in use"
**Problem:** Proxy läuft bereits

**Lösung:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Dann neu starten
npm run proxy
```

### Fehler: "Failed to fetch" / CORS error
**Problem:** Proxy läuft nicht

**Lösung:**
Prüfen Sie, ob Terminal 1 mit dem Proxy noch läuft:
```
📡 Proxy listening on: http://localhost:3001
```

Falls nicht, starten Sie neu: `npm run proxy`

### Fehler: "API key not configured"
**Problem:** API-Key fehlt in `environment.ts`

**Lösung:**
```typescript
// src/environments/environment.ts
apiKey: 'sk-proj-...' // Ihren Key hier eintragen
```

### Console zeigt: "🚀 Production mode"
**Problem:** `production: true` in environment.ts

**Lösung:**
```typescript
// src/environments/environment.ts
production: false, // Muss false sein!
```

---

## 📊 Console-Meldungen (normal)

**Proxy-Terminal:**
```
📤 Proxying request to OpenAI API...
   Model: gpt-4o-mini
   Messages: 1
✅ Response received from OpenAI (200)
```

**Browser-Console:**
```
🔧 Development mode: Using direct OpenAI API access (no proxy)
🔍 Extracting field: Titel (ccm:title)
✅ Extracted Titel: "Mathematik Grundkurs"
```

---

## ⚙️ Konfiguration

### API-Key ändern
**In:** `src/environments/environment.ts`
```typescript
apiKey: 'sk-proj-...'
```

### Modell ändern
```typescript
model: 'gpt-4o-mini' // Oder: gpt-4o, gpt-3.5-turbo, etc.
```

### Proxy-Port ändern
**In:** `local-proxy.js` (Zeile 11)
```javascript
const PORT = 3001; // Ändern Sie auf einen anderen Port
```

**Dann auch in:** `src/app/services/openai-proxy.service.ts` (Zeile 79)
```typescript
const apiUrl = 'http://localhost:3001/v1/chat/completions'; // Port anpassen
```

---

## 🎯 Workflow

### Neue Session starten
1. Terminal 1: `npm run proxy`
2. Terminal 2: `npm start`
3. Browser: `http://localhost:4200`

### Session beenden
1. Terminal 1: Strg + C (Proxy stoppen)
2. Terminal 2: Strg + C (App stoppen)

### Code ändern
- Terminal 1: Läuft weiter (Proxy muss nicht neu gestartet werden)
- Terminal 2: Angular kompiliert automatisch neu
- Browser: Automatisches Reload

---

## 🚀 Production Build

Wenn Sie auf Netlify deployen:
```bash
npm run build
git push
```

**Production verwendet:**
- ❌ **Nicht** den lokalen Proxy
- ✅ Netlify Function Proxy (automatisch)
- ✅ API-Key aus Netlify Environment Variables

---

## 💡 Vorteile dieser Lösung

| Feature | Status |
|---------|--------|
| **Keine CORS-Fehler** | ✅ |
| **Einfach zu starten** | ✅ Nur `npm run proxy` + `npm start` |
| **Kein Netlify CLI nötig** | ✅ |
| **Schnelle Entwicklung** | ✅ |
| **Production-ready** | ✅ Netlify Function verwendet |
| **API-Key sicher** | ✅ Nur lokal, nicht im Build |

---

## 📚 Weitere Dokumentation

- **CORS_FIX.md** - Warum CORS ein Problem ist
- **LOCAL_DEVELOPMENT.md** - Detaillierte Erklärungen
- **ENVIRONMENT_CONFIG.md** - Alle Konfigurationsoptionen

---

**Jetzt loslegen! 🎉**

Terminals öffnen und:
1. `npm run proxy`
2. `npm start`
