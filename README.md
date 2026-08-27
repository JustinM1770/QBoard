# CRM — Negocios II

Sistema CRM para gestionar clientes, registrar interacciones y evaluar la relación con cada uno.

**Stack:** PHP + MySQL + HTML/JS
**Dominio:** https://qboard.mx/negocios2/ · API base: https://qboard.mx/negocios2/api/

Este repo documenta la **estructura y el reparto**. Cada integrante detalla su parte en su
propio archivo `.md` y hace **su propio commit**.

---

## Reparto del equipo

| Integrante | Módulo | Archivo | Endpoints |
|---|---|---|---|
| **Jose Luis Palos Limon** | Gestión de clientes (CRUD) | `integrante-1-clientes.md` | `POST/GET/GET{id}/PUT/DELETE /clientes` |
| **Kevin Emmanuel Ruvalcava Ruvalcava** | Interacciones y etapas | `integrante-2-interacciones.md` | `POST /interacciones`, `GET /clientes/{id}/interacciones`, `PUT /clientes/{id}/etapa` |
| **Justin Martinez Gonzalez** | Métricas y seguridad | `integrante-3-metricas.md` | `POST /auth/login`, `GET /metricas` |

**Orden:** Jose Luis (clientes) define el modelo base; Kevin y Justin construyen encima.
El login (Justin) protege todos los endpoints.

---

## Base de datos (3 tablas)

- **clientes** — Jose Luis
- **interacciones** — Kevin
- **usuarios** — Justin

Un cliente tiene muchas interacciones; cada interacción la registra un usuario.
Las métricas se calculan por consulta sobre `clientes` e `interacciones`.

---

