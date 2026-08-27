# Jose Luis Palos Limon — Gestión de clientes (CRUD)

**Módulo del CRM · Concepto:** centralizar la información del cliente.

## Objetivo
Crear el modelo Cliente y las operaciones para dar de alta, consultar, editar y borrar
clientes, con búsqueda y filtro por estado. Es el núcleo del sistema; los otros dos módulos
se apoyan en él.

## Dominio del proyecto
Alojado en **https://qboard.mx/negocios2/** · API base: **https://qboard.mx/negocios2/api/**
Las rutas de abajo son relativas a esa base (ej. `https://qboard.mx/negocios2/api/clientes.php`).

## Modelo de datos — tabla `clientes`
| Campo | Tipo | Notas |
|---|---|---|
| id | INT | PK, autoincrement |
| nombre | VARCHAR(100) | obligatorio |
| correo | VARCHAR(120) | |
| telefono | VARCHAR(30) | |
| empresa | VARCHAR(120) | |
| fecha_registro | DATETIME | por defecto CURRENT_TIMESTAMP |
| estado | ENUM('activo','inactivo') | por defecto 'activo' |

## Endpoints (API REST)
| Método | Ruta | Función |
|---|---|---|
| POST | `/clientes` | Crear cliente |
| GET | `/clientes` | Listar (con `?buscar=` y `?estado=activo|inactivo`) |
| GET | `/clientes/{id}` | Detalle de un cliente |
| PUT | `/clientes/{id}` | Editar cliente |
| DELETE | `/clientes/{id}` | Borrar cliente |

## Front-end
- Formulario para **alta** y **edición** de cliente.
- **Tabla de listado** con:
  - Búsqueda (por nombre o empresa).
  - Filtro por estado (activo / inactivo).

## Validaciones
- Nombre obligatorio.
- Formato de correo y teléfono.
- Estado válido (activo / inactivo).

## Checklist (para mi commit)
- [ ] Tabla `clientes` creada
- [ ] Los 5 endpoints funcionando
- [ ] Formulario de alta/edición
- [ ] Tabla con búsqueda y filtro
