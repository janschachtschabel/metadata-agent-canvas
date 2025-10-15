# Environment Variables Guide

Das `replace-env.js` Script unterstützt jetzt **beide LLM-Provider** und kann deren Konfiguration aus Environment Variables injizieren.

---

## 📋 Unterstützte Environment Variables

### **LLM Provider Selection**

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `LLM_PROVIDER` | Welcher Provider verwendet werden soll | `openai` oder `provider-b` |

---

### **OpenAI Configuration**

| Variable | Beschreibung | Standard | Beispiel |
|----------|-------------|----------|----------|
| `OPENAI_API_KEY` | OpenAI API Key | - | `sk-proj-abc123...` |
| `OPENAI_MODEL` | Modell-Name | `gpt-4.1-mini` | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Custom Base URL | _(leer)_ | `https://api.openai.com/v1` |
| `GPT5_REASONING_EFFORT` | GPT-5 Reasoning Level | `medium` | `low`, `medium`, `high` |
| `GPT5_VERBOSITY` | GPT-5 Verbosity | `low` | `low`, `medium`, `high` |

---

### **Provider B Configuration**

| Variable | Beschreibung | Standard | Beispiel |
|----------|-------------|----------|----------|
| `B_API_KEY` | Provider B API Key | - | `bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc` |
| `B_MODEL` | Modell-Name | `gpt-4.1-mini` | `gpt-4.1-mini` |
| `B_BASE_URL` | Base URL | `https://b-api.staging.openeduhub.net/api/v1/llm/openai` | _(siehe Standard)_ |

---

## 🪟 Windows - Environment Variables setzen

### **PowerShell:**

```powershell
# LLM Provider auswählen
$env:LLM_PROVIDER="provider-b"

# OpenAI
$env:OPENAI_API_KEY="sk-proj-..."
$env:OPENAI_MODEL="gpt-4.1-mini"

# Provider B
$env:B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
$env:B_MODEL="gpt-4.1-mini"

# App starten
npm start
```

### **CMD:**

```cmd
set LLM_PROVIDER=provider-b
set OPENAI_API_KEY=sk-proj-...
set B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
npm start
```

---

## 🐧 Linux/Mac - Environment Variables setzen

### **Bash/Zsh:**

```bash
# LLM Provider auswählen
export LLM_PROVIDER="provider-b"

# OpenAI
export OPENAI_API_KEY="sk-proj-..."
export OPENAI_MODEL="gpt-4.1-mini"

# Provider B
export B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
export B_MODEL="gpt-4.1-mini"

# App starten
npm start
```

---

## ☁️ Netlify - Environment Variables konfigurieren

**Netlify Dashboard → Site Settings → Environment Variables:**

### **Beide Provider parallel:**

```
LLM_PROVIDER=provider-b
OPENAI_API_KEY=sk-proj-...
B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
```

**Wichtig:** Bei Netlify wird `LLM_PROVIDER` nur verwendet, wenn es in `environment.prod.ts` als leer konfiguriert ist.

---

## 🔄 Verhalten des replace-env.js Scripts

### **1. Start-Output**

Beim Ausführen von `npm start` oder `npm run build` sehen Sie:

```
🔧 Processing environment files...
📋 Environment variables:

🔹 LLM Provider:
  - LLM_PROVIDER: provider-b

🔹 OpenAI Configuration:
  - OPENAI_API_KEY: ✅ Found
  - OPENAI_MODEL: gpt-4.1-mini
  - OPENAI_BASE_URL: (empty)
  - GPT5_REASONING_EFFORT: medium
  - GPT5_VERBOSITY: low

🔹 Provider B Configuration:
  - B_API_KEY: ✅ Found
  - B_MODEL: gpt-4.1-mini
  - B_BASE_URL: https://b-api.staging.openeduhub.net/api/v1/llm/openai

📝 Processing environment.ts...
  ℹ️  File already contains an API key, skipping injection
  
📝 Processing environment.prod.ts...
  ✅ Injected LLM_PROVIDER: provider-b
  ✅ Injected B_API_KEY
  ✅ environment.prod.ts updated

✅ Environment processing complete
```

---

### **2. Injection-Regeln**

| Bedingung | Verhalten |
|-----------|-----------|
| **API Key in Datei vorhanden** | ❌ Keine Injection (Datei-Wert wird bevorzugt) |
| **API Key in Datei leer** | ✅ Injection aus Environment Variable |
| **Keine Environment Variable** | ℹ️ Datei-Wert wird beibehalten |

**Beispiel:**

```typescript
// environment.ts
openai: {
  apiKey: 'sk-proj-...',  // ← Vorhandener Key
}
```

**Script-Verhalten:**
```
ℹ️  File already contains an API key, skipping injection
💡 To inject from environment variables, remove the existing key first
```

**Lösung:**
```typescript
// environment.ts
openai: {
  apiKey: '',  // ← Leerer Key = Injection aktiviert
}
```

---

## 🎯 Use Cases

### **Use Case 1: Nur Provider B lokal**

```powershell
# Nur Provider B Key setzen
$env:B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
$env:LLM_PROVIDER="provider-b"

# environment.ts:
llmProvider: 'provider-b',
providerB: {
  apiKey: '',  # ← Leer für Injection
}

npm start
```

**Ergebnis:**
```
✅ Injected LLM_PROVIDER: provider-b
✅ Injected B_API_KEY
```

---

### **Use Case 2: Beide Provider parallel**

```powershell
$env:OPENAI_API_KEY="sk-proj-..."
$env:B_API_KEY="bb6cdf84-..."
$env:LLM_PROVIDER="provider-b"  # Aktiver Provider

npm start
```

**Wechsel zur Laufzeit:**
```typescript
// In environment.ts ändern:
llmProvider: 'openai',  // ← Wechsel zu OpenAI
```

---

### **Use Case 3: Netlify Production**

**Netlify Dashboard:**
```
LLM_PROVIDER=provider-b
B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
```

**environment.prod.ts:**
```typescript
llmProvider: '',  // ← Leer für Injection
providerB: {
  apiKey: '',     // ← Leer für Injection
}
```

**Build-Befehl:** `npm run build`

**Script injiziert automatisch:**
```typescript
llmProvider: 'provider-b',
providerB: {
  apiKey: 'bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc',
}
```

---

## ⚠️ Wichtige Hinweise

### **Sicherheit**

- ❌ **NIEMALS** API Keys in Git committen
- ✅ Verwenden Sie Environment Variables für Production
- ✅ Für lokale Entwicklung: Keys in `.env` (nicht in Git!)

### **Priorität**

1. **Datei-Wert** (wenn vorhanden)
2. **Environment Variable** (wenn Datei leer)
3. **Standard-Wert** (wenn beides fehlt)

### **Netlify Deploy**

Das Script läuft automatisch bei:
- `npm start` (lokal)
- `npm run build` (Netlify)

Netlify nutzt die Environment Variables aus dem Dashboard.

---

## 🧪 Testing

### **Prüfen welcher Provider aktiv ist:**

```bash
npm start
```

**Console prüfen:**
```
🔧 Development mode: Using direct PROVIDER-B API access
🌐 Base URL: https://b-api.staging.openeduhub.net/api/v1/llm/openai
```

### **Environment Variable prüfen:**

**PowerShell:**
```powershell
echo $env:B_API_KEY
echo $env:LLM_PROVIDER
```

**Linux/Mac:**
```bash
echo $B_API_KEY
echo $LLM_PROVIDER
```

---

## 📚 Weitere Dokumentation

- **Multi-Provider Setup:** Siehe `LLM_PROVIDER_CONFIGURATION.md`
- **Netlify Deployment:** Siehe `README.md`
- **API Unterschiede:** Siehe `LLM_PROVIDER_CONFIGURATION.md`

---

**Stand:** 15. Oktober 2025
