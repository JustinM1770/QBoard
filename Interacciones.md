# Kevin Emmanuel Ruvalcava Ruvalcava — Interacciones y etapas del cliente

**Módulo del CRM · Conceptos:** seguimiento, historial centralizado, mejor atención.

## Objetivo
Registrar las interacciones con cada cliente (llamadas, correos, reuniones), mostrarlas en
una línea de tiempo, y clasificar al cliente por su etapa dentro del CRM.

## Dominio del proyecto
Alojado en **https://qboard.mx/negocios2/** · API base: **https://qboard.mx/negocios2/api/**
Las rutas de abajo son relativas a esa base (ej. `https://qboard.mx/negocios2/api/interacciones.php`).

## Modelo de datos — tabla `interacciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | INT | PK |
| cliente_id | INT | FK → clientes |
| usuario_id | INT | FK → usuarios (quién la registró) |
| tipo | ENUM('llamada','correo','reunion') | |
| descripcion | TEXT | |
| fecha | DATETIME | por defecto CURRENT_TIMESTAMP |

**Campo nuevo en `clientes`:** `etapa_crm` → `ENUM('Prospecto','Activo','Frecuente','Inactivo')`

## Endpoints (API REST)
| Método | Ruta | Función |
|---|---|---|
| POST | `/interacciones` | Registrar interacción |
| GET | `/clientes/{id}/interacciones` | Historial del cliente |
| PUT | `/clientes/{id}/etapa` | Cambiar la etapa CRM |

## Front-end
- Vista **"Historial del cliente"** con **línea de tiempo** de interacciones.
- Formulario para **registrar interacción** (tipo + descripción).
- **Selector de etapa CRM** con colores/etiquetas y **filtro por etapa**.

## Validaciones
- `tipo` válido (llamada / correo / reunión).
- `etapa_crm` válida (Prospecto / Activo / Frecuente / Inactivo).
- El cliente debe existir antes de registrar la interacción.

## Checklist (para mi commit)
- [ ] Tabla `interacciones` + campo `etapa_crm` en clientes
- [ ] Endpoints de interacciones y de etapa
- [ ] Historial con línea de tiempo
- [ ] Selector y filtro por etapa (colores)
