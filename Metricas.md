# Justin Martinez Gonzalez — Métricas y seguridad

**Módulo del CRM · Conceptos:** evaluar si el CRM sirve (no solo que exista) + seguridad básica.

## Objetivo
Medir la relación con los clientes mediante indicadores, y controlar el acceso con login
y roles (admin / usuario).

## Dominio del proyecto
Alojado en **https://qboard.mx/negocios2/** · API base: **https://qboard.mx/negocios2/api/**
Las rutas de abajo son relativas a esa base (ej. `https://qboard.mx/negocios2/api/metricas.php`).

## Modelo de datos — tabla `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| id | INT | PK |
| nombre | VARCHAR(100) | |
| correo | VARCHAR(120) | único |
| password_hash | VARCHAR(255) | contraseña cifrada (password_hash / password_verify) |
| rol | ENUM('admin','usuario') | |
| fecha_registro | DATETIME | |

> Las **métricas** se calculan por consulta sobre `clientes` e `interacciones`; no necesitan tabla propia.

## Endpoints (API REST)
| Método | Ruta | Función |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión → devuelve token + rol |
| GET | `/metricas` | Indicadores del CRM |

**El endpoint `/metricas` devuelve:**
- Total de clientes.
- Clientes activos vs inactivos.
- Número de interacciones por cliente.
- Clientes sin interacción reciente (en riesgo).

## Front-end
- **Dashboard** con contadores, una **gráfica** (barra o pastel) y lista de **clientes en riesgo**.
- **Login**.
- Restricción de vistas por **rol** (admin / usuario).
- Pantalla **"Mi actividad"** (interacciones que registró el usuario logueado).

## Pistas
- Login: `password_verify($password, $fila['password_hash'])`. El "token" puede ser simple (base64 de id+rol), no necesita ser JWT real para la clase.
- Clientes en riesgo: clientes cuya última interacción es de hace más de 30 días (o que no tienen ninguna).

## Checklist (para mi commit)
- [ ] Tabla `usuarios` + login funcionando
- [ ] Endpoint `/metricas` con los 4 indicadores
- [ ] Dashboard con contadores + gráfica + lista en riesgo
- [ ] Vistas restringidas por rol y pantalla "Mi actividad"
