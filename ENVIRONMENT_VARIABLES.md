# Environment Variables Guide

Das `replace-env.js` Script unterstützt jetzt **drei LLM-Provider** und kann deren Konfiguration aus Environment Variables injizieren.

---

## 📋 Unterstützte Environment Variables

### **LLM Provider Selection**

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `LLM_PROVIDER` | Welcher Provider verwendet werden soll | `openai`, `b-api-openai`, oder `b-api-academiccloud` |

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

### **B-API Configuration**

**Beide B-API Provider (`b-api-openai` und `b-api-academiccloud`) verwenden den gleichen API Key:**

| Variable | Beschreibung | Standard | Beispiel |
|----------|-------------|----------|----------|
| `B_API_KEY` | B-API Key (für beide B-API Provider) | - | `bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc` |
| `B_MODEL` | Modell-Name (optional) | Provider-abhängig | `gpt-4.1-mini` |

**Provider-spezifische Defaults:**
- **b-api-openai:** `gpt-4.1-mini` (OpenAI-kompatibel)
- **b-api-academiccloud:** `deepseek-r1` (AcademicCloud)

---

## 🪟 Windows - Environment Variables setzen

### **PowerShell:**

```powershell
# LLM Provider auswählen
$env:LLM_PROVIDER="b-api-openai"  # oder "b-api-academiccloud" oder "openai"

# OpenAI
$env:OPENAI_API_KEY="sk-proj-..."
$env:OPENAI_MODEL="gpt-4.1-mini"

# B-API (für beide B-API Provider)
$env:B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
$env:B_MODEL="gpt-4.1-mini"  # Optional

# App starten
npm start
```

### **CMD:**

```cmd
set LLM_PROVIDER=b-api-openai
set OPENAI_API_KEY=sk-proj-...
set B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
npm start
```

---

## 🐧 Linux/Mac - Environment Variables setzen

### **Bash/Zsh:**

```bash
# LLM Provider auswählen
export LLM_PROVIDER="b-api-openai"  # oder "b-api-academiccloud" oder "openai"

# OpenAI
export OPENAI_API_KEY="sk-proj-..."
export OPENAI_MODEL="gpt-4.1-mini"

# B-API (für beide B-API Provider)
export B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
export B_MODEL="gpt-4.1-mini"  # Optional

# App starten
npm start
```

---

## ☁️ Netlify - Environment Variables konfigurieren

**Netlify Dashboard → Site Settings → Environment Variables:**

### **Alle Provider parallel:**

```
LLM_PROVIDER=b-api-openai
OPENAI_API_KEY=sk-proj-...
B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
```

**Provider wechseln:** Ändern Sie einfach `LLM_PROVIDER` zu:
- `openai` → OpenAI direkt
- `b-api-openai` → B-API mit OpenAI-kompatiblen Modellen
- `b-api-academiccloud` → B-API mit AcademicCloud (deepseek-r1)

**Wichtig:** Bei Netlify wird `LLM_PROVIDER` nur verwendet, wenn es in `environment.prod.ts` als leer konfiguriert ist.

---

## 🔄 Verhalten des replace-env.js Scripts

### **1. Start-Output**

Beim Ausführen von `npm start` oder `npm run build` sehen Sie:

```
🔧 Processing environment files...
📋 Environment variables:

🔹 LLM Provider:
  - LLM_PROVIDER: b-api-openai

🔹 OpenAI Configuration:
  - OPENAI_API_KEY: ✅ Found
  - OPENAI_MODEL: gpt-4.1-mini
  - OPENAI_BASE_URL: (empty)
  - GPT5_REASONING_EFFORT: medium
  - GPT5_VERBOSITY: low

🔹 B-API Configuration:
  - B_API_KEY: ✅ Found
  - B_MODEL: (using provider default)
  - BASE_URLs:
    • b-api-openai: https://b-api.staging.openeduhub.net/api/v1/llm/openai
    • b-api-academiccloud: https://b-api.staging.openeduhub.net/api/v1/llm/academiccloud

📝 Processing environment.ts...
  ℹ️  File already contains an API key, skipping injection
  
📝 Processing environment.prod.ts...
  ✅ Injected LLM_PROVIDER: b-api-openai
  ✅ Injected B_API_KEY for bApiOpenai
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
bApiOpenai: {
  apiKey: 'bb6cdf84-...',  // ← Vorhandener Key
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
bApiOpenai: {
  apiKey: '',  // ← Leerer Key = Injection aktiviert
}
```

---

## 🎯 Use Cases

### **Use Case 1: Nur B-API OpenAI lokal**

```powershell
# Nur B-API Key setzen
$env:B_API_KEY="bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc"
$env:LLM_PROVIDER="b-api-openai"

# environment.ts:
llmProvider: 'b-api-openai',
bApiOpenai: {
  apiKey: '',  # ← Leer für Injection
}

npm start
```

**Ergebnis:**
```
✅ Injected LLM_PROVIDER: b-api-openai
✅ Injected B_API_KEY for bApiOpenai
```

---

### **Use Case 2: Alle Provider parallel**

```powershell
$env:OPENAI_API_KEY="sk-proj-..."
$env:B_API_KEY="bb6cdf84-..."
$env:LLM_PROVIDER="b-api-openai"  # Aktiver Provider

npm start
```

**Wechsel zur Laufzeit:**
```typescript
// In environment.ts ändern:
llmProvider: 'openai',              // ← OpenAI
llmProvider: 'b-api-openai',        // ← B-API OpenAI-kompatibel
llmProvider: 'b-api-academiccloud', // ← B-API AcademicCloud
```

---

### **Use Case 3: Netlify Production**

**Netlify Dashboard:**
```
LLM_PROVIDER=b-api-openai
B_API_KEY=bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc
```

**environment.prod.ts:**
```typescript
llmProvider: '',  // ← Leer für Injection
bApiOpenai: {
  apiKey: '',     // ← Leer für Injection
}
bApiAcademicCloud: {
  apiKey: '',     // ← Leer für Injection (gleicher B_API_KEY)
}
```

**Build-Befehl:** `npm run build`

**Script injiziert automatisch:**
```typescript
llmProvider: 'b-api-openai',
bApiOpenai: {
  apiKey: 'bb6cdf84-0a9d-47f3-b673-c1b4f25b9bdc',
}
bApiAcademicCloud: {
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
🔧 Development mode: Using local proxy for b-api-openai
🌐 Proxy URL: http://localhost:3001
```

**Oder für AcademicCloud:**
```
🔧 Development mode: Using local proxy for b-api-academiccloud
🌐 Proxy URL: http://localhost:3001
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
