# Vercel Deployment - Metadata Agent Canvas

## 🚀 Schnell-Deployment

### Variante 1: Vercel CLI (empfohlen)

```bash
# 1. Vercel CLI installieren (falls noch nicht installiert)
npm install -g vercel

# 2. In das Projekt-Verzeichnis wechseln
cd webkomponente-canvas

# 3. Einmalig: Projekt mit Vercel verbinden
vercel login
vercel link

# 4. Deploy
vercel --prod
```

### Variante 2: GitHub Integration

1. **Repository auf GitHub pushen:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Auf Vercel.com:**
   - Gehen Sie zu https://vercel.com
   - Klicken Sie "Import Project"
   - Wählen Sie Ihr GitHub Repository
   - Vercel erkennt automatisch die Konfiguration
   - Klicken Sie "Deploy"

---

## 📦 Was wird deployed?

### Struktur nach Build:

```
dist/
├── test-sidebar.html      ← Hauptseite (/)
└── app/                   ← Angular App (/app/)
    ├── index.html
    ├── main.*.js
    ├── styles.*.css
    ├── assets/
    └── schemata/
```

### URLs:

- **Hauptseite:** `https://your-project.vercel.app/` → test-sidebar.html
- **App direkt:** `https://your-project.vercel.app/app/` → Angular App

---

## ⚙️ Konfiguration

### vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "angular"
}
```

**Wichtige Settings:**
- `outputDirectory: "dist"` - Build-Ausgabe
- Root-Route `/` zeigt test-sidebar.html
- Route `/app/` zeigt Angular App

### angular.json

**Geändert:**
```json
{
  "outputPath": "dist/app",  // War: "dist"
  "assets": [
    // test-sidebar.html wird nach dist/ kopiert
    {
      "glob": "test-sidebar.html",
      "input": "./",
      "output": "../"
    }
  ]
}
```

---

## 🔐 Environment Variables

### OpenAI API Key konfigurieren

**Option 1: Vercel Dashboard**
1. Gehen Sie zu Ihrem Projekt auf vercel.com
2. Settings → Environment Variables
3. Fügen Sie hinzu:
   - Name: `OPENAI_API_KEY`
   - Value: Ihr API-Key
   - Environment: Production, Preview, Development

**Option 2: Vercel CLI**
```bash
vercel env add OPENAI_API_KEY
```

**Option 3: Im Code (nicht empfohlen für Production)**
- API-Key wird beim ersten Start im UI abgefragt
- Wird im Browser LocalStorage gespeichert

---

## 🧪 Lokaler Test vor Deployment

```bash
# 1. Production Build erstellen
npm run build

# 2. Build lokal testen mit http-server
npx http-server dist -p 8080

# 3. Browser öffnen
# http://localhost:8080/test-sidebar.html
```

---

## 📝 Deployment Checklist

Vor dem Deployment:

- [ ] `npm run build` läuft ohne Fehler
- [ ] Environment Variables konfiguriert (falls nötig)
- [ ] test-sidebar.html nutzt `/app/` statt `localhost:4200`
- [ ] Alle Schemata in `src/schemata/` vorhanden
- [ ] `.gitignore` enthält `node_modules`, `dist`, `.env`

---

## 🐛 Troubleshooting

### Problem: "404 Not Found" nach Deployment

**Lösung:** Prüfen Sie die `vercel.json` Routes:
```json
{
  "routes": [
    { "src": "/test-sidebar.html", "dest": "/test-sidebar.html" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Problem: "CORS Error" im iframe

**Lösung:** Headers in `vercel.json` prüfen:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
      ]
    }
  ]
}
```

### Problem: Schemata nicht gefunden

**Lösung:** Prüfen Sie `angular.json` assets:
```json
{
  "assets": [
    "src/assets",
    "src/schemata"  // ← Muss vorhanden sein
  ]
}
```

### Problem: API-Key funktioniert nicht

**Lösung:** 
1. Prüfen Sie Environment Variables in Vercel Dashboard
2. Oder geben Sie den Key manuell im UI ein (wird in LocalStorage gespeichert)

---

## 🔄 Updates deployen

```bash
# Änderungen committen
git add .
git commit -m "Update: ..."
git push

# Vercel deployed automatisch bei GitHub Integration
# Oder manuell:
vercel --prod
```

---

## 📊 Build-Zeiten

Typische Build-Dauer auf Vercel:
- **Initialer Build:** ~3-5 Minuten
- **Folge-Builds:** ~1-2 Minuten (durch Caching)

---

## 💰 Vercel Plan

**Hobby Plan (kostenlos):**
- ✅ Unbegrenzte Deployments
- ✅ Automatische HTTPS
- ✅ Git Integration
- ✅ 100 GB Bandwidth/Monat
- ⚠️ Kein Team-Support

**Pro Plan ($20/Monat):**
- ✅ Alles vom Hobby Plan
- ✅ Mehr Bandwidth
- ✅ Analytics
- ✅ Password Protection

Für Testzwecke reicht der **Hobby Plan**!

---

## 🎯 Production-Ready Checklist

Für Production-Deployment zusätzlich:

- [ ] Analytics aktiviert (Vercel Dashboard)
- [ ] Custom Domain konfiguriert
- [ ] Password Protection (falls sensible Daten)
- [ ] Performance Monitoring
- [ ] Error Tracking (z.B. Sentry)
- [ ] API Rate Limiting beachten
- [ ] Backup-Strategie für API-Keys

---

## 📚 Weitere Ressourcen

- [Vercel Dokumentation](https://vercel.com/docs)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Viel Erfolg beim Deployment! 🚀**
