# VitalSync AI - Guia de DAST e Analise Dinamica

**Data:** 2026-03-13
**Versao:** 1.0

---

## Indice

1. [Introducao](#introducao)
2. [Ferramentas Recomendadas](#ferramentas-recomendadas)
3. [Configuracao do Ambiente](#configuracao-do-ambiente)
4. [Testes por Endpoint](#testes-por-endpoint)
5. [Checklist de Testes de Penetracao](#checklist-de-testes-de-penetracao)
6. [Scripts de Teste Automatizado](#scripts-de-teste-automatizado)
7. [Integracao com CI/CD](#integracao-com-cicd)

---

## Introducao

Este guia descreve como realizar testes de seguranca dinamica (DAST - Dynamic Application Security Testing) na plataforma VitalSync AI. O objetivo e identificar vulnerabilidades em tempo de execucao que nao sao detectaveis por analise estatica.

### Pre-requisitos
- Aplicacao rodando localmente (backend + frontend + ai-engine)
- Ferramentas DAST instaladas
- Autorizacao formal para realizar testes

---

## Ferramentas Recomendadas

### 1. OWASP ZAP (Zed Attack Proxy)
- **Tipo:** Proxy/Scanner automatizado
- **Uso:** Scan automatico + testes manuais
- **Instalacao:**
  ```bash
  # Docker
  docker pull zaproxy/zap-stable

  # Ou download direto
  # https://www.zaproxy.org/download/
  ```

### 2. Burp Suite Community
- **Tipo:** Proxy/Scanner manual
- **Uso:** Interceptacao de trafego e testes manuais
- **Instalacao:** Download em https://portswigger.net/burp/communitydownload

### 3. Nuclei
- **Tipo:** Scanner baseado em templates
- **Uso:** Deteccao rapida de vulnerabilidades conhecidas
- **Instalacao:**
  ```bash
  go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
  # Ou
  brew install nuclei
  ```

### 4. curl + Scripts Bash
- **Tipo:** Testes manuais
- **Uso:** Validacao pontual de endpoints

---

## Configuracao do Ambiente

### Iniciar a aplicacao
```bash
# Backend (porta 8080)
cd backend && ./mvnw spring-boot:run

# AI Engine (porta 8000)
cd ai-engine && python main.py

# Frontend (porta 4200)
cd frontend && ng serve
```

### Configurar OWASP ZAP
1. Iniciar ZAP em modo daemon:
   ```bash
   docker run -u zap -p 8090:8080 -p 8091:8090 \
     zaproxy/zap-stable zap.sh -daemon \
     -host 0.0.0.0 -port 8080 \
     -config api.addrs.addr.name=.* \
     -config api.addrs.addr.regex=true
   ```

2. Configurar o contexto:
   - URL alvo: `http://localhost:8080` (backend)
   - URL alvo: `http://localhost:8000` (AI engine)
   - Excluir: URLs de terceiros (Google Fonts, etc.)

---

## Testes por Endpoint

### Backend - POST /api/upload
```bash
# Teste 1: Upload de arquivo valido
curl -X POST http://localhost:8080/api/upload \
  -F "file=@test-video.mp4" \
  -v

# Teste 2: Upload de arquivo nao permitido (deve rejeitar)
curl -X POST http://localhost:8080/api/upload \
  -F "file=@malicious.exe" \
  -v

# Teste 3: Path traversal no nome do arquivo
curl -X POST http://localhost:8080/api/upload \
  -F "file=@test.mp4;filename=../../etc/passwd" \
  -v

# Teste 4: Arquivo grande (deve rejeitar > 50MB)
dd if=/dev/zero of=large-file.mp4 bs=1M count=60
curl -X POST http://localhost:8080/api/upload \
  -F "file=@large-file.mp4" \
  -v

# Teste 5: CSRF - deve falhar sem token
curl -X POST http://localhost:8080/api/upload \
  -F "file=@test.mp4" \
  -H "Origin: http://evil-site.com" \
  -v
```

### Backend - WebSocket /ws/signal
```bash
# Teste 1: Payload JSON valido
wscat -c ws://localhost:8080/ws \
  -x '{"type":"offer","sdp":"test"}'

# Teste 2: Payload invalido (deve rejeitar)
wscat -c ws://localhost:8080/ws \
  -x 'not-json'

# Teste 3: Tipo de sinal invalido
wscat -c ws://localhost:8080/ws \
  -x '{"type":"malicious","data":"test"}'

# Teste 4: Payload muito grande (>16KB)
python -c "print('{\"type\":\"offer\",\"data\":\"' + 'A'*20000 + '\"}')" | \
  wscat -c ws://localhost:8080/ws
```

### AI Engine - POST /process-video/
```bash
# Teste 1: Video valido
curl -X POST http://localhost:8000/process-video/ \
  -F "video=@test-video.mp4" \
  -v

# Teste 2: Arquivo nao-video (deve rejeitar)
curl -X POST http://localhost:8000/process-video/ \
  -F "video=@script.py" \
  -v

# Teste 3: Verificar que erros nao expoe detalhes internos
curl -X POST http://localhost:8000/process-video/ \
  -F "video=@corrupted.mp4" \
  -v
```

### AI Engine - POST /process-folder/
```bash
# Teste 1: Path traversal (deve rejeitar)
curl -X POST http://localhost:8000/process-folder/ \
  -H "Content-Type: application/json" \
  -d '{"folder_path": "/etc/passwd"}' \
  -v

# Teste 2: Caminho valido
curl -X POST http://localhost:8000/process-folder/ \
  -H "Content-Type: application/json" \
  -d '{"folder_path": "/app/videos/test"}' \
  -v
```

---

## Checklist de Testes de Penetracao

### Autenticacao e Autorizacao
- [ ] Verificar que endpoints protegidos exigem autenticacao
- [ ] Testar bypass de autenticacao em todos os endpoints
- [ ] Verificar que tokens CSRF sao validados
- [ ] Testar session fixation

### Injecao
- [ ] SQL Injection (se houver banco de dados)
- [ ] Command Injection via nomes de arquivo
- [ ] XSS refletido e armazenado
- [ ] Server-Side Request Forgery (SSRF) no processamento de video
- [ ] Path Traversal no upload e processamento de pasta

### Upload de Arquivos
- [ ] Testar upload de tipos nao permitidos
- [ ] Testar upload com extensao dupla (ex: `file.mp4.exe`)
- [ ] Testar upload com nome contendo caracteres especiais
- [ ] Verificar que arquivos sao armazenados com nomes aleatorios
- [ ] Testar upload de arquivo com magic bytes adulterados
- [ ] Verificar limite de tamanho de arquivo

### Headers de Seguranca
- [ ] Content-Security-Policy presente e correto
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security (em producao com HTTPS)
- [ ] Referrer-Policy configurado
- [ ] Permissions-Policy configurado

### WebSocket
- [ ] Validacao de origem no handshake
- [ ] Limite de tamanho de mensagem
- [ ] Validacao de formato de mensagem
- [ ] Teste de flooding (muitas mensagens rapidas)

### CORS
- [ ] Verificar que origens nao autorizadas sao bloqueadas
- [ ] Testar com `Origin: null`
- [ ] Testar com `Origin: http://evil-site.com`
- [ ] Verificar que credenciais nao sao enviadas para origens invalidas

### Dados Sensiveis
- [ ] Verificar que PII e anonimizado antes do processamento
- [ ] Verificar que logs nao contem dados sensiveis
- [ ] Verificar que respostas de erro nao expoe detalhes internos
- [ ] Verificar que arquivos temporarios sao removidos

---

## Scripts de Teste Automatizado

### Script 1: Scan Completo com OWASP ZAP
```bash
#!/bin/bash
# zap-scan.sh - Scan automatizado com OWASP ZAP

TARGET_BACKEND="http://localhost:8080"
TARGET_AI="http://localhost:8000"
REPORT_DIR="./security-reports"

mkdir -p $REPORT_DIR

echo "=== Iniciando scan OWASP ZAP ==="

# Scan do Backend
docker run --rm --network host \
  -v $(pwd)/$REPORT_DIR:/zap/reports \
  zaproxy/zap-stable zap-baseline.py \
  -t $TARGET_BACKEND \
  -r reports/backend-report.html \
  -J reports/backend-report.json

# Scan do AI Engine
docker run --rm --network host \
  -v $(pwd)/$REPORT_DIR:/zap/reports \
  zaproxy/zap-stable zap-baseline.py \
  -t $TARGET_AI \
  -r reports/ai-engine-report.html \
  -J reports/ai-engine-report.json

echo "=== Scan concluido. Relatorios em $REPORT_DIR ==="
```

### Script 2: Scan com Nuclei
```bash
#!/bin/bash
# nuclei-scan.sh - Scan com templates Nuclei

TARGET_BACKEND="http://localhost:8080"
TARGET_AI="http://localhost:8000"

echo "=== Scan Nuclei - Backend ==="
nuclei -u $TARGET_BACKEND \
  -t cves/ \
  -t vulnerabilities/ \
  -t misconfiguration/ \
  -severity critical,high,medium \
  -o nuclei-backend-results.txt

echo "=== Scan Nuclei - AI Engine ==="
nuclei -u $TARGET_AI \
  -t cves/ \
  -t vulnerabilities/ \
  -t misconfiguration/ \
  -severity critical,high,medium \
  -o nuclei-ai-results.txt

echo "=== Scan concluido ==="
```

### Script 3: Testes de Seguranca com curl
```bash
#!/bin/bash
# security-tests.sh - Testes basicos de seguranca

BACKEND="http://localhost:8080"
AI_ENGINE="http://localhost:8000"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "[PASS] $desc"
    ((PASS++))
  else
    echo "[FAIL] $desc"
    ((FAIL++))
  fi
}

echo "=== Testes de Security Headers ==="

HEADERS=$(curl -sI $BACKEND)
check "X-Content-Type-Options present" "nosniff" "$HEADERS"
check "X-Frame-Options present" "DENY" "$HEADERS"
check "Content-Security-Policy present" "Content-Security-Policy" "$HEADERS"

echo ""
echo "=== Testes de CORS ==="

CORS_RESP=$(curl -sI -H "Origin: http://evil-site.com" $BACKEND/api/upload)
check "CORS blocks evil origin" "403\|Forbidden\|$^" "$CORS_RESP"

echo ""
echo "=== Testes de Upload ==="

# Criar arquivo de teste
echo "malicious content" > /tmp/test.exe
UPLOAD_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BACKEND/api/upload -F "file=@/tmp/test.exe")
check "Rejects .exe upload" "400\|403\|415" "$UPLOAD_RESP"
rm /tmp/test.exe

echo ""
echo "=== Testes do AI Engine ==="

AI_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $AI_ENGINE/process-video/ -F "video=@/tmp/test.txt")
check "AI rejects non-video file" "400\|415\|422" "$AI_RESP"

echo ""
echo "=== Resultado: $PASS passed, $FAIL failed ==="
```

---

## Integracao com CI/CD

### GitHub Actions
```yaml
name: DAST Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 1'  # Semanal, segunda-feira as 2h

jobs:
  dast-scan:
    runs-on: ubuntu-latest
    services:
      backend:
        image: vitalsync/backend:latest
        ports:
          - 8080:8080
      ai-engine:
        image: vitalsync/ai-engine:latest
        ports:
          - 8000:8000

    steps:
      - uses: actions/checkout@v4

      - name: Wait for services
        run: |
          sleep 30
          curl --retry 10 --retry-delay 5 http://localhost:8080/actuator/health
          curl --retry 10 --retry-delay 5 http://localhost:8000/docs

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: '.zap/rules.tsv'

      - name: Nuclei Scan
        uses: projectdiscovery/nuclei-action@main
        with:
          target: http://localhost:8080
          flags: "-severity critical,high -silent"

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: dast-reports
          path: |
            *-report.html
            *-results.txt
```

### GitLab CI
```yaml
dast:
  stage: security
  image: zaproxy/zap-stable
  script:
    - zap-baseline.py -t $TARGET_URL -r report.html -J report.json
  artifacts:
    reports:
      dast: report.json
    paths:
      - report.html
  only:
    - main
    - develop
```

---

## Frequencia Recomendada

| Tipo de Teste | Frequencia | Ferramenta |
|--------------|-----------|------------|
| Scan automatico (baseline) | A cada push / PR | OWASP ZAP, Nuclei |
| Scan completo (full) | Semanal | OWASP ZAP |
| Pentest manual | Trimestral | Burp Suite |
| Revisao de configuracao | Mensal | Scripts customizados |
