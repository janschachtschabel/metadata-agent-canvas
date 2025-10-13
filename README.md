# Metadata Agent - Canvas Edition

Angular-basierte Webkomponente für die KI-gestützte Metadaten-Extraktion mit paralleler Verarbeitung und Canvas-basierter UI für Inline-Editing.

## 🎯 Features

- ⚡ **Schnell**: Parallele Feld-Extraktion (6-10s)
- 🎨 **Canvas-UI**: Alle Felder gleichzeitig sichtbar und bearbeitbar
- 📊 **Live-Updates**: Echtzeit-Streaming während der Extraktion
- ✏️ **Inline-Editing**: Direkte Feldbearbeitung mit Autocomplete
- 🔄 **Automatische Normalisierung**: Datumsformate, URLs, Vokabulare
- 🎓 **Content-Type-Erkennung**: Automatische Schema-Auswahl (Event, Kurs, etc.)
- ✅ **Validierung**: Pflichtfelder, Vokabulare, Datentypen

---

## 📦 Installation

### Voraussetzungen

- Node.js (>= 18.x)
- npm (>= 9.x)
- OpenAI API-Key (oder OpenAI-kompatibler Endpoint)

### Setup

```bash
# Repository klonen
git clone <repository-url>
cd webkomponente-canvas

# Dependencies installieren
npm install

# Development-Server starten
npm start
```

Die Anwendung läuft unter: **http://localhost:4200/**

---

## 🚀 Start & Nutzung

### 1. API-Key konfigurieren

Beim ersten Start werden Sie nach dem OpenAI API-Key gefragt. Alternativ in `src/environments/environment.ts` konfigurieren:

```typescript
export const environment = {
  production: false,
  openai: {
    apiKey: '',                    // Leer lassen → Key wird im UI abgefragt
    model: 'gpt-4.1-mini',         // Empfohlen für beste Preis/Leistung
    baseUrl: '',                   // Optional: eigener Endpoint
  }
};
```

### 2. Workflow

```
┌─────────────────────────────────────────┐
│ 1. Text eingeben                        │
│    Beschreibung der Ressource           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 2. "Extraktion starten" klicken         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 3. Canvas füllt sich automatisch        │
│    ⚪ → ⏳ → ✅ (parallel, ~6-10s)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 4. Felder bearbeiten (optional)         │
│    • Inline-Editing                     │
│    • Autocomplete bei Vokabularen       │
│    • Automatische Normalisierung        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 5. Content-Type ggf. anpassen           │
│    → Neue Felder werden geladen         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 6. "Bestätigen" → JSON-Download         │
└─────────────────────────────────────────┘
```

### 3. UI-Elemente

**Status-Icons:**
- ⚪ Leer (grau = optional, rot Rand = Pflichtfeld)
- ⏳ Wird extrahiert (orange, animiert)
- ✅ Gefüllt (grün)
- ❌ Fehler (rot)

**Feld-Features:**
- **Autocomplete**: Bei Vokabular-Feldern (z.B. Bildungsstufe)
- **Chips**: Array-Felder zeigen Werte als entfernbare Chips
- **Confidence-Badge**: KI-Sicherheit (0-100%) bei extrahierten Werten
- **Auto-Resize**: Textareas passen sich automatisch an

**Progress-Anzeige:**
- Fortschrittsbalken mit Prozent
- Felder-Zähler: `Gefüllt/Gesamt`
- Pflichtfelder-Status separat angezeigt

## 📋 Schema-Datenstruktur

Die Schemata befinden sich in `src/schemata/` und definieren Metadatenfelder.

### Feld-Definition

```json
{
  "id": "schema:startDate",
  "group": "schedule",
  "group_label": "Zeit & Status",
  "prompt": {
    "label": "Start (Datum/Zeit)",
    "description": "Start im ISO 8601-Format"
  },
  "system": {
    "path": "schema:startDate",
    "uri": "https://schema.org/startDate",
    "datatype": "date",
    "multiple": false,
    "required": false,
    "ask_user": true,
    "ai_fillable": true,
    "vocabulary": { ... },
    "validation": { ... },
    "normalization": { ... }
  }
}
```

### Wichtige Feld-Optionen

#### `system.datatype` - Datentyp

Steuert **Normalisierung** und **Validierung**:

| Datatype | Normalisierung | Beispiel |
|----------|----------------|----------|
| `string` | Trim, Deduplicate | Freitext |
| `date` | `15.9.2026` → `2026-09-15` | ISO 8601 Datum |
| `uri` / `url` | `example.com` → `https://example.com` | URLs |
| `number` / `integer` | `"zehn"` → `10` | Zahlen |
| `boolean` | `"ja"` → `true`, `"nein"` → `false` | Wahrheitswerte |
| `array` | siehe `multiple` | Arrays |
| `object` | Strukturierte Daten | JSON-Objekte |

**Auswirkung:**
- Bei `datatype: "date"` werden Eingaben wie `10.01.2027` automatisch zu `2027-01-10` konvertiert
- Bei `datatype: "url"` wird `example.com` zu `https://example.com`
- Bei `datatype: "string"` mit `vocabulary` wird Fuzzy-Matching angewendet

#### `system.multiple` - Mehrfachwerte

```json
{
  "datatype": "string",
  "multiple": true  // Feld akzeptiert mehrere Werte
}
```

**Auswirkung:**
- UI zeigt **Chips** statt einfachem Input
- Werte können einzeln hinzugefügt/entfernt werden
- Autocomplete schlägt bei jedem Chip-Hinzufügen vor

#### `system.required` - Pflichtfeld

```json
{
  "required": true  // Feld MUSS gefüllt werden
}
```

**Auswirkung:**
- Status-Icon wird **rot umrandet** wenn leer
- Validierung schlägt fehl wenn leer
- JSON-Export warnt bei fehlenden Pflichtfeldern

#### `system.ask_user` - User-Interaktion

```json
{
  "ask_user": true  // Feld wird im UI angezeigt
}
```

**Auswirkung:**
- `true`: Feld wird im Canvas angezeigt und kann editiert werden
- `false`: Feld wird nur intern verwendet (z.B. `@context`)

#### `system.ai_fillable` - KI-Extraktion

```json
{
  "ai_fillable": true  // KI versucht Feld zu füllen
}
```

**Auswirkung:**
- `true`: Feld wird während Extraktion automatisch gefüllt
- `false`: Feld muss manuell gefüllt werden

### Vocabulary - Kontrollierte Vokabulare

```json
{
  "vocabulary": {
    "type": "closed",  // oder "open", "skos"
    "concepts": [
      {
        "label": "Grundschule",
        "uri": "http://w3id.org/openeduhub/vocabs/educationalContext/grundschule",
        "altLabels": ["Primary School", "GS"]
      }
    ]
  }
}
```

**Vocabulary-Typen:**

| Type | Verhalten | Beispiel |
|------|-----------|----------|
| `closed` | Nur Werte aus Liste erlaubt | Bildungsstufe |
| `open` | Freie Eingabe + Vorschläge | Schlagwörter |
| `skos` | SKOS-Thesaurus | Fachgebiete |

**Auswirkung:**
- **Autocomplete**: Vorschläge während Eingabe
- **Fuzzy-Matching**: "Grundscule" → "Grundschule" (Levenshtein Distance < 3)
- **Label→URI Mapping**: "Grundschule" → `http://...grundschule`
- **Validierung**: Bei `closed` werden ungültige Werte abgelehnt

### Validation - Validierungsregeln

```json
{
  "validation": {
    "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
    "minLength": 3,
    "maxLength": 100
  }
}
```

**Auswirkung:**
- **pattern**: Regex-Validierung (z.B. Datum-Format)
- **minLength/maxLength**: String-Länge
- Ungültige Werte werden mit **❌** markiert

### Normalization - Normalisierungsregeln

```json
{
  "normalization": {
    "trim": true,
    "deduplicate": true,
    "map_labels_to_uris": true
  }
}
```

**Optionen:**

| Option | Funktion | Beispiel |
|--------|----------|----------|
| `trim` | Whitespace entfernen | `" Text "` → `"Text"` |
| `deduplicate` | Duplikate entfernen (Arrays) | `["A", "A"]` → `["A"]` |
| `map_labels_to_uris` | Label zu URI konvertieren | `"Grundschule"` → URI |

---

## ✅ Validierungs- und Normalisierungsverfahren

### 1. Lokale Normalisierung (< 1ms)

Wird **sofort** auf User-Eingaben angewendet:

**Datumsformate:**
```
Input: "15.9.2026"   → Output: "2026-09-15"
Input: "15/09/2026"  → Output: "2026-09-15"
Input: "2026-09-15"  → Output: "2026-09-15" (unverändert)
```

**URLs:**
```
Input: "example.com"      → Output: "https://example.com"
Input: "http://test.de"   → Output: "http://test.de" (unverändert)
```

**Boolean:**
```
Input: "ja" / "yes" / "1" → Output: true
Input: "nein" / "no" / "0" → Output: false
```

**Zahlen:**
```
Input: "zehn"      → Output: 10
Input: "25"        → Output: 25
Input: "fünfzehn"  → Output: 15
```

### 2. Vocabulary-Matching

**Fuzzy-Matching** (Levenshtein Distance):
```
Input: "Grundscule"    → Match: "Grundschule" (Distance: 1)
Input: "Uniersität"    → Match: "Universität" (Distance: 1)
Input: "CC PY"         → Match: "CC BY" (Distance: 2)
```

**Alternative Labels:**
```
Input: "Primary School" → Match: "Grundschule" (altLabel)
Input: "GS"             → Match: "Grundschule" (altLabel)
```

### 3. LLM-Fallback (~500ms)

Wird aufgerufen wenn lokale Normalisierung fehlschlägt:

**Komplexe Datumsformate:**
```
Input: "15. September 2026" → LLM → "2026-09-15"
Input: "morgen"             → LLM → Berechnet aktuelles Datum + 1
Input: "in 3 Tagen"         → LLM → Berechnet Datum
```

**Natürliche Zahlen:**
```
Input: "einhundert"         → LLM → 100
Input: "zwei Dutzend"       → LLM → 24
```

### 4. Validierung

**Pflichtfelder:**
- Status-Icon wird rot umrandet (⚠️) wenn leer
- JSON-Export zeigt Warnung

**Vokabular-Felder:**
- `closed`: Ungültige Werte werden abgelehnt → Feld wird geleert
- `open`: Alle Werte erlaubt, Vorschläge werden angezeigt

**Datentyp-Validierung:**
- `date`: Prüft ob Datum existiert (31.02. → ungültig)
- `uri`: Prüft URL-Format
- `number`: Prüft ob Zahl

**Regex-Patterns:**
```json
{
  "validation": {
    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
  }
}
```
- Validiert gegen Regex
- Ungültige Werte → Status: ERROR (❌)

---

## 🏗️ Architektur

### Service-Layer

**CanvasService** (`canvas.service.ts`)
- State Management (RxJS BehaviorSubject)
- Orchestrierung: Core + Special Schema
- Content-Type-Erkennung
- **Zentrale Normalisierung** (einzige Stelle!)

**FieldExtractionWorkerPoolService** (`field-extraction-worker-pool.service.ts`)
- Parallele LLM-Aufrufe (max. 10 Worker)
- Queue-Management
- Retry-Logic

**FieldNormalizerService** (`field-normalizer.service.ts`)
- Lokale Normalisierung (Date, URL, Number, Boolean)
- Vocabulary Fuzzy-Matching
- LLM-Fallback

**SchemaLoaderService** (`schema-loader.service.ts`)
- Lädt JSON-Schemata aus `src/schemata/`
- Parst Feld-Definitionen

### Component-Layer

**CanvasViewComponent** (`canvas-view/`)
- Haupt-Container
- Gruppiert Felder
- Progress-Anzeige

**CanvasFieldComponent** (`canvas-field/`)
- Einzelfeld-Rendering
- Autocomplete
- Chips (Arrays)
- Status-Icons

### Data-Flow

```
User Input
  ↓
canvas-field.component.ts
  ↓ (emitChange)
canvas-view.component.ts
  ↓ (onFieldChange)
canvas.service.ts (updateFieldValue)
  ↓ (normalizeFieldValue)
field-normalizer.service.ts
  ↓ (tryLocalNormalization OR LLM)
Normalisierter Wert
  ↓ (updateFieldStatus)
canvas-field.component.ts (ngOnChanges)
  ↓ (updateInputValue)
UI zeigt normalisierten Wert ✅
```

---

## ⚡ Performance

### Parallelisierung

**Vorher (Chat-Version):** Sequenziell, ~40-50s
```
Feld 1 → Feld 2 → Feld 3 → ... → Feld 30
```

**Nachher (Canvas-Version):** Parallel, ~6-10s
```
Feld 1  ┐
Feld 2  ├─→ Batch 1 (10 parallel)
...     │
Feld 10 ┘
Feld 11 ┐
...     ├─→ Batch 2 (10 parallel)
Feld 20 ┘
Feld 21 ┐
...     ├─→ Batch 3 (10 parallel)
Feld 30 ┘
```

**Konfiguration:**
```typescript
// In field-extraction-worker-pool.service.ts
BATCH_SIZE = 10;           // Max parallele Requests
BATCH_DELAY_MS = 100;      // Pause zwischen Batches (Rate-Limit)
```

### Performance-Gewinn

- **Extraktion**: 80% schneller (40-50s → 6-10s)
- **Normalisierung**: < 1ms (lokal), ~500ms (LLM-Fallback)
- **UI-Updates**: Echtzeit (RxJS Streams)

### Kosten

- **API-Requests**: +40-50% mehr Requests (durch Parallelisierung)
- **Token-Verbrauch**: +150-200% (jedes Feld mit vollem Kontext)
- **Trade-off**: Bessere UX vs. höhere Kosten

---

## 🔨 Build & Deployment

### Development

```bash
npm start  # Läuft auf http://localhost:4200
```

### Production Build

```bash
npm run build
```

Build-Artefakte in: `dist/`

### Environment-Konfiguration

**Development:** `src/environments/environment.ts`
**Production:** `src/environments/environment.prod.ts`

Angular ersetzt automatisch beim Build:
```bash
ng build --configuration production
```

---

## 📚 Verfügbare Schemata

Die Schemata befinden sich in `src/schemata/`:

- **core.json** - Basis-Metadaten (Titel, Beschreibung, Lizenz, etc.)
- **event.json** - Veranstaltungen
- **education_offer.json** - Bildungsangebote
- **learning_material.json** - Lernmaterialien
- **person.json** - Personen
- **organization.json** - Organisationen
- **tool_service.json** - Tools & Services
- **occupation.json** - Berufe
- **didactic_planning_tools.json** - Didaktische Werkzeuge
- **source.json** - Quellen

---

## 🛠️ Technologie-Stack

- **Angular 19** - Framework
- **RxJS** - Reactive Programming
- **@langchain/openai** - OpenAI-Integration
- **TypeScript** - Typsicherheit

---

---

## 💡 Tipps & Best Practices

### Schema-Design

**Datatype richtig wählen:**
- Datumfelder immer als `"date"` definieren (nicht `"string"`)
- URLs als `"uri"` oder `"url"` 
- Mehrfachwerte: `"multiple": true` setzen

**Vocabulary verwenden:**
- `"type": "closed"` für strenge Kontrolle (z.B. Bildungsstufe)
- `"type": "open"` für Freitext + Vorschläge (z.B. Keywords)
- `altLabels` für Synonyme definieren

**Validierung hinzufügen:**
- `pattern` für Format-Vorgaben (z.B. ISBN, Datum)
- `required: true` für Pflichtfelder
- `minLength`/`maxLength` für Textlänge

### Performance-Tuning

**Batch-Size anpassen:**
```typescript
// In field-extraction-worker-pool.service.ts
BATCH_SIZE = 10;  // Erhöhen für schnellere Extraktion (mehr parallele Requests)
```

**Rate-Limiting:**
```typescript
BATCH_DELAY_MS = 100;  // Reduzieren nur wenn API-Limit erhöht
```

### Debugging

**Console-Logs aktivieren:**
- Alle Services loggen mit Emoji-Präfixen
- 🔵 = canvas-field.component
- 📝 = canvas.service
- 🔧 = field-normalizer.service
- ✅ = Erfolg, ❌ = Fehler, ⚠️ = Warnung

**Browser DevTools:**
- F12 → Console für Logs
- Network-Tab für API-Requests
- Angular DevTools für State-Inspektion

---

## 📦 Weitere Dokumentation

- **INSTALLATION.md** - Detaillierte Setup-Anleitung
- **CANVAS_DOCUMENTATION.md** - Canvas-Architektur
- **PERFORMANCE.md** - Performance-Optimierungen
- **ENVIRONMENT_CONFIG.md** - Environment-Konfiguration
- **CODE_REVIEW_SUMMARY.md** - Code-Review Ergebnisse

---

## 📄 Lizenz

Entsprechend der Hauptanwendung

---

**Entwickelt mit ❤️ für schnelle, zuverlässige Metadaten-Extraktion**
