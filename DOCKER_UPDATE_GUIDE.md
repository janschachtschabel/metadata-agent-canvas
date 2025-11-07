# 🐳 Docker Update Guide - WLO Credentials

**Grund für Update:** WLO Guest Credentials wurden aus dem Code entfernt und müssen jetzt als Environment Variables gesetzt werden.

---

## 📋 Was wurde geändert?

### **1. Code-Änderungen (bereits erledigt)**
- ✅ `server/index.js` nutzt jetzt `process.env.WLO_GUEST_USERNAME` & `WLO_GUEST_PASSWORD`
- ✅ Server validiert beim Start ob Credentials vorhanden sind
- ✅ Server startet NICHT ohne Credentials

### **2. Docker-Änderungen (gerade gemacht)**
- ✅ `docker-compose.yml` erweitert um WLO Environment Variables:
  ```yaml
  - WLO_GUEST_USERNAME=${WLO_GUEST_USERNAME}
  - WLO_GUEST_PASSWORD=${WLO_GUEST_PASSWORD}
  - WLO_REPOSITORY_BASE_URL=${WLO_REPOSITORY_BASE_URL:-https://repository.staging.openeduhub.net/edu-sharing}
  ```

---

## 🚀 Update Durchführen

### **Option A: Mit .env.docker.example (Empfohlen)**

**1. Erstelle .env Datei für Docker:**
```bash
cd webkomponente-canvas

# Kopiere Template
cp .env.docker.example .env.docker

# Oder manuell erstellen:
cat > .env.docker << 'EOF'
# LLM Configuration
LLM_PROVIDER=b-api-openai
B_API_KEY=your-b-api-key-here

# WLO Repository Guest Credentials
WLO_GUEST_USERNAME=WLO-Upload
WLO_GUEST_PASSWORD=wlo#upload!20
WLO_REPOSITORY_BASE_URL=https://repository.staging.openeduhub.net/edu-sharing

# Optional: Rate Limits
RATE_LIMIT_LLM_MAX=100
RATE_LIMIT_API_MAX=1000
EOF
```

**2. Passe docker-compose.yml an (bereits gemacht!):**
```yaml
environment:
  - WLO_GUEST_USERNAME=${WLO_GUEST_USERNAME}
  - WLO_GUEST_PASSWORD=${WLO_GUEST_PASSWORD}
  - WLO_REPOSITORY_BASE_URL=${WLO_REPOSITORY_BASE_URL:-https://repository.staging.openeduhub.net/edu-sharing}
```

**3. Rebuild & Restart Container:**
```bash
# Stop & Remove old container
docker-compose down

# Rebuild Image (wichtig für Code-Updates!)
docker-compose build --no-cache

# Start mit .env.docker File
docker-compose --env-file .env.docker up -d

# Oder verwende standard .env
docker-compose up -d
```

**4. Verifizieren:**
```bash
# Logs prüfen
docker-compose logs -f

# Sollte zeigen:
# ✅ WLO Guest credentials configured
# 🚀 Server running on port 3000

# Health Check
docker-compose ps
# STATUS sollte "healthy" sein
```

---

### **Option B: Direkt mit Environment Variables**

**1. Rebuild Image:**
```bash
docker build -t metadata-agent-canvas:latest .
```

**2. Run mit -e Flags:**
```bash
docker run -d \
  --name metadata-agent-canvas \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e LLM_PROVIDER=b-api-openai \
  -e B_API_KEY="your-b-api-key" \
  -e WLO_GUEST_USERNAME="WLO-Upload" \
  -e WLO_GUEST_PASSWORD="wlo#upload!20" \
  -e WLO_REPOSITORY_BASE_URL="https://repository.staging.openeduhub.net/edu-sharing" \
  -e RATE_LIMIT_LLM_MAX=100 \
  -e RATE_LIMIT_API_MAX=1000 \
  metadata-agent-canvas:latest
```

**3. Verifizieren:**
```bash
# Logs prüfen
docker logs -f metadata-agent-canvas

# Container Status
docker ps
```

---

### **Option C: Docker Swarm / Kubernetes Secrets**

**Docker Swarm:**
```bash
# Secrets erstellen
echo "WLO-Upload" | docker secret create wlo_username -
echo "wlo#upload!20" | docker secret create wlo_password -

# In docker-compose.yml für Swarm:
secrets:
  - wlo_username
  - wlo_password

environment:
  - WLO_GUEST_USERNAME_FILE=/run/secrets/wlo_username
  - WLO_GUEST_PASSWORD_FILE=/run/secrets/wlo_password
```

**Kubernetes:**
```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: wlo-credentials
type: Opaque
stringData:
  username: WLO-Upload
  password: wlo#upload!20
---
# deployment.yaml
env:
  - name: WLO_GUEST_USERNAME
    valueFrom:
      secretKeyRef:
        name: wlo-credentials
        key: username
  - name: WLO_GUEST_PASSWORD
    valueFrom:
      secretKeyRef:
        name: wlo-credentials
        key: password
```

---

## 🧪 Testing

### **1. Container Status prüfen:**
```bash
# Compose
docker-compose ps

# Sollte zeigen:
# NAME                  STATUS
# metadata-agent-canvas  Up (healthy)

# Standalone
docker ps | grep metadata-agent
```

### **2. Logs prüfen:**
```bash
# Startup sollte zeigen:
docker-compose logs metadata-agent-canvas

# Erwartete Logs:
# 🚀 Starting Metadata Agent Canvas Server...
# ✅ WLO Guest credentials configured
# 🚀 Server running on port 3000
```

### **3. Environment Variables im Container prüfen:**
```bash
# Exec in Container
docker-compose exec metadata-agent-canvas sh

# Prüfe Env-Vars
echo $WLO_GUEST_USERNAME
# Output: WLO-Upload

echo $WLO_GUEST_PASSWORD
# Output: wlo#upload!20

echo $WLO_REPOSITORY_BASE_URL
# Output: https://repository.staging.openeduhub.net/edu-sharing

# Exit
exit
```

### **4. Funktionstest:**
```bash
# Health Check
curl http://localhost:3001/api/health

# Repository Test (Upload)
# Teste in Browser: http://localhost:3001
# Füge Text ein und teste Upload-Funktion
```

---

## ❗ Troubleshooting

### **Problem: Container startet nicht**
```bash
# Logs anzeigen
docker-compose logs

# Fehlermeldung:
# ❌ WLO_GUEST_USERNAME and WLO_GUEST_PASSWORD are required

# Lösung:
# 1. .env.docker prüfen ob Werte vorhanden
# 2. docker-compose.yml prüfen ob Variables gemapped
# 3. Neu starten mit --env-file
docker-compose --env-file .env.docker up -d
```

### **Problem: "healthy" wird nicht erreicht**
```bash
# Health Check Logs
docker-compose logs | grep health

# Manueller Health Check
docker-compose exec metadata-agent-canvas node /app/server/healthcheck.js

# Lösung: Meist dauert Startup länger
# Warte 30-60 Sekunden nach Start
```

### **Problem: Upload funktioniert nicht**
```bash
# 1. Environment Variables prüfen (siehe oben)

# 2. Server Logs während Upload
docker-compose logs -f metadata-agent-canvas

# 3. Prüfe ob Repository erreichbar
docker-compose exec metadata-agent-canvas sh
wget -q --spider https://repository.staging.openeduhub.net
echo $?  # Sollte 0 sein

# 4. Auth testen
curl -u "WLO-Upload:wlo#upload!20" \
  https://repository.staging.openeduhub.net/edu-sharing/rest/authentication/v1/validateSession
```

### **Problem: Alte Credentials werden noch verwendet**
```bash
# Alten Container komplett entfernen
docker-compose down -v

# Image neu bauen (OHNE Cache!)
docker-compose build --no-cache

# Neu starten
docker-compose up -d
```

---

## 🔄 Update-Workflow (Empfohlen)

Für regelmäßige Updates:

```bash
#!/bin/bash
# update-docker.sh

echo "🔄 Updating Metadata Agent Canvas Docker..."

# 1. Pull latest code
git pull origin main

# 2. Stop container
echo "🛑 Stopping container..."
docker-compose down

# 3. Rebuild image (no cache for clean build)
echo "🔨 Building new image..."
docker-compose build --no-cache

# 4. Start with updated config
echo "🚀 Starting updated container..."
docker-compose --env-file .env.docker up -d

# 5. Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# 6. Verify
echo "✅ Verifying..."
docker-compose ps
docker-compose logs --tail=20

echo "✅ Update complete!"
```

**Ausführen:**
```bash
chmod +x update-docker.sh
./update-docker.sh
```

---

## 📋 Checklist für Production Deployment

- [ ] `.env.docker` erstellt mit allen Credentials
- [ ] `.env.docker` in `.gitignore` (sollte bereits sein)
- [ ] `docker-compose.yml` hat WLO Environment Variables
- [ ] Image neu gebaut: `docker-compose build --no-cache`
- [ ] Container gestartet: `docker-compose up -d`
- [ ] Health Check: `docker-compose ps` zeigt "healthy"
- [ ] Logs geprüft: Keine Fehler, "credentials configured"
- [ ] Upload getestet: Funktioniert in Browser
- [ ] Backup der `.env.docker` erstellt (sicher verwahrt!)
- [ ] Team informiert über neue Env-Vars

---

## 🔐 Security Best Practices

### **1. Secrets Management**
```bash
# NIEMALS .env.docker in Git committen!
echo ".env.docker" >> .gitignore

# Für Team: .env.docker.example teilen
cp .env.docker .env.docker.example
# In .example: Echte Werte durch Platzhalter ersetzen
```

### **2. Read-Only Filesystem**
```yaml
# Bereits in docker-compose.yml aktiviert:
read_only: true
tmpfs:
  - /tmp
```

### **3. Non-Root User**
```dockerfile
# Bereits in Dockerfile:
USER nodejs  # UID 1001
```

### **4. Resource Limits**
```yaml
# Bereits in docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1024M
```

---

## 📚 Weitere Ressourcen

- **Vollständiger Guide:** `DEPLOYMENT_SECURITY.md`
- **Quick-Start:** `QUICKSTART_ENV_SETUP.md`
- **Security Audit:** `SECURITY_AUDIT_RESULTS.md`
- **Environment Template:** `.env.docker.example`

---

## ✅ Summary

**Was du tun musst:**

1. **`.env.docker` erstellen** mit WLO Credentials
2. **Image neu bauen:** `docker-compose build --no-cache`
3. **Container starten:** `docker-compose --env-file .env.docker up -d`
4. **Testen:** Logs prüfen + Upload testen

**Fertig!** Der Container nutzt jetzt sichere Environment Variables statt hardcodierten Credentials! 🎉

---

**Letzte Aktualisierung:** 2025-01-07  
**Version:** 2.0 (Security Update)
