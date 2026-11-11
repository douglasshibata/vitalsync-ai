# VitalSync AI - Dependency Update Report

**Date:** 2026-03-13
**Branch:** `update_security`

---

## Backend (Java / Spring Boot)

### Spring Boot Upgrade

| Dependency | Previous Version | Updated Version | Reason |
|-----------|-----------------|-----------------|--------|
| Spring Boot Parent | 3.2.4 | 3.4.3 | Security patches, bug fixes, performance improvements |

**Key changes in Spring Boot 3.4.x:**
- Security fixes for Spring Security and Spring Framework
- Improved WebFlux performance
- Updated embedded Tomcat with security patches
- Better GraalVM native image support

### Managed Dependencies (via Spring Boot BOM)
The following are automatically updated by the Spring Boot parent:
- Spring Security
- Spring WebFlux
- Jackson (JSON processing)
- Netty
- Micrometer

### Recommendations
- **Add OWASP Dependency-Check plugin** to `pom.xml`:
```xml
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.9</version>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

---

## AI Engine (Python)

### Pinned Dependencies

| Package | Previous | Pinned Version | Notes |
|---------|----------|---------------|-------|
| openai-whisper | unpinned | 20231117 | Latest stable release |
| torch | unpinned | 2.2.1 | Compatible with CUDA 12.1 |
| transformers | unpinned | 4.38.2 | HuggingFace transformers |
| fastapi | unpinned | 0.110.0 | Web framework |
| uvicorn | unpinned | 0.27.1 | ASGI server |
| python-multipart | unpinned | 0.0.9 | File upload support |
| moviepy | unpinned | 1.0.3 | Video processing |
| pydantic | unpinned | 2.6.3 | Data validation |
| pydantic-settings | unpinned | 2.2.1 | Settings management |
| pysubs2 | unpinned | 1.7.2 | Subtitle processing |
| librosa | unpinned | 0.10.1 | Audio analysis |
| scipy | unpinned | 1.12.0 | Scientific computing |

### Recommendations
- Use `pip-audit` for vulnerability scanning:
  ```bash
  pip install pip-audit
  pip-audit -r requirements.txt
  ```
- Consider using `pip-compile` (pip-tools) for lock files:
  ```bash
  pip install pip-tools
  pip-compile requirements.in -o requirements.txt
  ```

---

## Frontend (Angular / npm)

### Current State
- Angular project with Material Design components
- No `npm audit` output available in this review

### Recommendations
- Run `npm audit` regularly:
  ```bash
  cd frontend && npm audit
  npm audit fix
  ```
- Add to CI/CD:
  ```bash
  npm audit --audit-level=high
  ```

---

## Recommended Scanning Tools

### 1. GitHub Dependabot
- **Purpose:** Automated dependency update PRs
- **Setup:** Add `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/backend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/ai-engine"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
```

### 2. Snyk
- **Purpose:** Vulnerability scanning + monitoring
- **Setup:** `snyk test` in CI/CD
- **Coverage:** Java, Python, npm

### 3. OWASP Dependency-Check
- **Purpose:** Known vulnerability detection (CVE database)
- **Setup:** Maven plugin (see Backend section above)
- **Coverage:** Java dependencies

### 4. pip-audit
- **Purpose:** Python package vulnerability scanning
- **Setup:** `pip-audit -r requirements.txt`
- **Coverage:** PyPI packages

### 5. Trivy
- **Purpose:** Container image scanning
- **Setup:** `trivy image <image-name>`
- **Coverage:** OS packages, application dependencies

---

## CI/CD Integration

Recommended pipeline step:
```yaml
security-scan:
  stage: test
  script:
    - cd backend && mvn org.owasp:dependency-check-maven:check
    - cd ai-engine && pip-audit -r requirements.txt
    - cd frontend && npm audit --audit-level=high
  allow_failure: false
```
