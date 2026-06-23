# FlowVault

[![Deployed on Railway](https://img.shields.io/badge/deployed%20on-Railway-6B2DB7?logo=railway&logoColor=white)](https://automation-hub-production-7a87.up.railway.app)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Plataforma SaaS para documentar, monitorear y gestionar automatizaciones empresariales.**

FlowVault centraliza el ciclo de vida de los workflows de automatización: registra cada proceso, captura sus ejecuciones en tiempo real via webhooks, genera documentación técnica con IA y expone métricas de rendimiento en un dashboard unificado.

**[Ver demo en producción →](https://automation-hub-production-7a87.up.railway.app)**

---

## Funcionalidades

| Área | Descripción |
|---|---|
| **Registro de workflows** | Crea y gestiona automatizaciones con nombre, descripción, herramientas y estado (activo / pausado / archivado) |
| **Monitoreo via webhooks** | Endpoint público que recibe ejecuciones en tiempo real con estado, duración y mensaje de error |
| **Documentación con IA** | Genera README técnicos y análisis de riesgos para cada workflow usando GPT-4o-mini |
| **Dashboard con métricas** | Tasa de éxito global, ejecuciones por día (últimos 30 días), ranking de workflows |
| **Autenticación segura** | JWT con expiración de 24h, rate limiting en login (5 intentos / 15 min por IP), headers de seguridad con Helmet |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22, Express 5 |
| Base de datos | PostgreSQL 17 (producción) · SQLite / better-sqlite3 (desarrollo) |
| Autenticación | JSON Web Tokens (`jsonwebtoken`) |
| IA | OpenAI API — modelo `gpt-4o-mini` |
| Seguridad | Helmet, express-rate-limit |
| Infraestructura | Railway (app + PostgreSQL managed) |
| Frontend | HTML/CSS/JS vanilla con tipografía Inter |

---

## Arquitectura del sistema

```mermaid
graph TB
    subgraph Cliente
        UI[Dashboard Web]
        EXT[Sistema externo / Make / n8n]
    end

    subgraph FlowVault API
        AUTH[POST /api/auth/login]
        WF[/api/workflows<br/>CRUD + IA]
        WH[POST /api/webhooks/execution]
        ST[GET /api/stats<br/>analytics]
    end

    subgraph Base de datos
        PG[(PostgreSQL<br/>Railway)]
        SQ[(SQLite<br/>dev local)]
    end

    subgraph IA
        OAI[OpenAI API<br/>gpt-4o-mini]
    end

    UI -->|JWT Bearer| WF
    UI -->|JWT Bearer| ST
    UI --> AUTH
    EXT -->|sin auth| WH

    AUTH --> PG
    WF --> PG
    WH --> PG
    ST --> PG

    WF -->|generar-readme / analizar| OAI

    PG -.->|DATABASE_URL ausente| SQ
```

### Modelo de datos

```mermaid
erDiagram
    workflows {
        TEXT id PK
        TEXT nombre
        TEXT descripcion
        TEXT estado
        TEXT herramientas
        TEXT fecha_creacion
        TEXT fecha_modificacion
    }
    ejecuciones {
        TEXT id PK
        TEXT workflow_id FK
        TEXT timestamp
        TEXT estado
        INTEGER duracion_ms
        TEXT mensaje_error
        TEXT payload_raw
    }
    documentacion {
        TEXT id PK
        TEXT workflow_id FK
        TEXT tipo
        TEXT contenido
        TEXT timestamp
    }

    workflows ||--o{ ejecuciones : "registra"
    workflows ||--o{ documentacion : "genera"
```

---

## Instalación local

### Requisitos previos

- Node.js 18+
- npm 9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/automation-hub.git
cd automation-hub

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores (ver sección siguiente)

# 4. Iniciar el servidor
npm start
```

El servidor queda disponible en `http://localhost:3000`.

> En desarrollo, si no existe la variable `DATABASE_URL`, FlowVault usa SQLite automáticamente. No se requiere ninguna configuración de base de datos adicional.

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (nunca lo subas a Git):

```env
# Clave secreta para firmar los JWT (genera una cadena aleatoria larga)
JWT_SECRET=cambia_esto_por_un_secreto_seguro

# Credenciales del usuario administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro

# Solo en producción: Railway lo inyecta automáticamente al conectar el servicio PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Para las funciones de IA (generación de README y análisis de riesgos)
OPENAI_API_KEY=sk-proj-...
```

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `JWT_SECRET` | Sí | — | Secreto para firmar tokens JWT |
| `ADMIN_USERNAME` | Sí | — | Nombre de usuario del administrador |
| `ADMIN_PASSWORD` | Sí | — | Contraseña del administrador |
| `DATABASE_URL` | No | SQLite local | Cadena de conexión PostgreSQL |
| `OPENAI_API_KEY` | No | — | Necesaria para endpoints de IA |
| `PORT` | No | `3000` | Puerto del servidor HTTP |

---

## API Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Obtiene un JWT. Rate limit: 5 req/15 min por IP |

**Body:**
```json
{ "username": "admin", "password": "tu_password" }
```

**Respuesta:**
```json
{ "token": "eyJ...", "username": "admin" }
```

---

### Workflows

Todas las rutas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/workflows` | Lista todos los workflows |
| `GET` | `/api/workflows/:id` | Obtiene un workflow por ID |
| `POST` | `/api/workflows` | Crea un nuevo workflow |
| `PATCH` | `/api/workflows/:id` | Actualiza campos de un workflow |
| `DELETE` | `/api/workflows/:id` | Archiva un workflow (soft delete) |
| `GET` | `/api/workflows/:id/ejecuciones` | Últimas 50 ejecuciones del workflow |
| `POST` | `/api/workflows/:id/generar-readme` | Genera README técnico con IA |
| `POST` | `/api/workflows/:id/analizar` | Análisis de riesgos con IA |

**Crear workflow — body:**
```json
{
  "nombre": "Mi Workflow",
  "descripcion": "Descripción opcional",
  "herramientas": ["Make", "OpenAI", "Google Sheets"]
}
```

**Validaciones:** `nombre` obligatorio (máx. 100 chars) · `descripcion` máx. 500 chars · `herramientas` array de máx. 50 elementos · `estado` debe ser `activo`, `pausado` o `archivado`.

---

### Webhooks

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/webhooks/execution` | No | Registra una ejecución de workflow |
| `GET` | `/api/webhooks/health` | No | Health check del servidor |

**Registrar ejecución — body:**
```json
{
  "workflow_id": "uuid-del-workflow",
  "estado": "exitoso",
  "duracion_ms": 4500,
  "mensaje_error": null,
  "timestamp": "2026-06-23T10:30:00.000Z"
}
```

> `timestamp` es opcional. Si se omite, se usa la hora del servidor. Esto permite insertar ejecuciones históricas.

---

### Stats

Todas las rutas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/stats` | Resumen global: total workflows, activos, ejecuciones, tasa de éxito |
| `GET` | `/api/stats/ejecuciones` | Últimas 200 ejecuciones con nombre de workflow |
| `GET` | `/api/stats/analytics` | Ejecuciones por día (30 días) + ranking de workflows |
| `GET` | `/api/stats/documentacion` | Documentación generada por IA |

---

## Roadmap

- [ ] Multi-tenancy: soporte para múltiples usuarios y organizaciones
- [ ] Alertas configurables por webhook (Slack, Telegram, email) cuando un workflow supera un umbral de fallos
- [ ] Retry automático de ejecuciones fallidas con backoff exponencial
- [ ] SDK cliente (npm package) para integrar FlowVault en cualquier automatización en 3 líneas
- [ ] Exportación de reportes en PDF con métricas mensuales
- [ ] Integración nativa con Make y n8n para captura automática de ejecuciones sin configuración de webhooks
- [ ] API key management: tokens por workflow para autenticación granular en webhooks

---

## Despliegue en Railway

1. Crea un nuevo proyecto en [Railway](https://railway.app)
2. Agrega el servicio **PostgreSQL** — Railway inyecta `DATABASE_URL` automáticamente
3. Conecta tu repositorio de GitHub al servicio de la app
4. Configura las variables de entorno: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`
5. Railway despliega automáticamente en cada push a `main`

> `app.set('trust proxy', 1)` está configurado para que el rate limiting por IP funcione correctamente detrás del proxy de Railway.
