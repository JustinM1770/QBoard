-- ============================================================
--  Integrante 1 · Jose Luis — Tabla CLIENTES (Día 1)
--  Ejecutar:  mysql -u root -p < db/clientes.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS crm_negocios2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS clientes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  correo         VARCHAR(120),
  telefono       VARCHAR(30),
  empresa        VARCHAR(120),
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado         ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB;

-- Datos de ejemplo
INSERT INTO clientes (nombre, correo, telefono, empresa, estado) VALUES
  ('María López', 'maria@moda.mx',    '3311112222', 'Moda MX',   'activo'),
  ('Juan Pérez',  'juan@textilvh.mx', '3312223333', 'Textil VH', 'activo');
