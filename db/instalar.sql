-- ============================================================
--  CRM QBoard — Instalador completo (importar UNA vez en phpMyAdmin)
--  Crea la base, las 3 tablas y datos de ejemplo.
-- ============================================================
CREATE DATABASE IF NOT EXISTS crm_negocios2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120),
  telefono VARCHAR(30),
  empresa VARCHAR(120),
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  etapa_crm ENUM('Prospecto','Activo','Frecuente','Inactivo') NOT NULL DEFAULT 'Prospecto'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interacciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('llamada','correo','reunion') NOT NULL,
  descripcion TEXT,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
  ('Admin', 'admin@crm.mx', '$2y$10$HTs0brfYnAU7q.rKHC5Ekeuv6Pc6/.sqYL/mtwXgP11abZYQNN6me', 'admin'),
  ('Vendedor', 'user@crm.mx', '$2y$10$HTs0brfYnAU7q.rKHC5Ekeuv6Pc6/.sqYL/mtwXgP11abZYQNN6me', 'usuario');

INSERT INTO clientes (nombre, correo, telefono, empresa, estado, etapa_crm) VALUES
  ('María López','maria@talavera.com','555-123-4567','Talavera Artesanal','activo','Frecuente'),
  ('Juan Pérez','juan@textiles.mx','555-987-6543','Textiles del Sur','activo','Prospecto'),
  ('Ana García','ana@alebrijes.mx','555-456-7890','Alebrijes MX','activo','Frecuente'),
  ('Carlos Ruiz','carlos@barroyfuego.com','555-321-6547','Barro y Fuego','inactivo','Inactivo'),
  ('Luisa Morales','luisa@papelarte.mx','555-654-3210','Arte en Papel','activo','Activo');

INSERT INTO interacciones (cliente_id, usuario_id, tipo, descripcion, fecha) VALUES
  (1,1,'llamada','Se discutieron nuevos diseños para la próxima temporada.','2026-08-28 10:30:00'),
  (1,1,'correo','Envío de catálogo de nuevos productos.','2026-08-20 14:20:00'),
  (2,2,'reunion','Reunión en tienda para ver muestras.','2026-08-15 11:00:00'),
  (3,1,'llamada','Seguimiento a pedido anterior.','2026-07-10 09:00:00');
