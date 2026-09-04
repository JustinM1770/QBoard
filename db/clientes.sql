-- ============================================================
--  Integrante 1 (Jose Luis) — Base de datos + tabla CLIENTES
--  Importar en phpMyAdmin.
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
  estado         ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  etapa_crm      ENUM('Prospecto','Activo','Frecuente','Inactivo') NOT NULL DEFAULT 'Prospecto'
) ENGINE=InnoDB;

INSERT INTO clientes (nombre, correo, telefono, empresa, estado, etapa_crm) VALUES
  ('María López','maria@talavera.com','555-123-4567','Talavera Artesanal','activo','Frecuente'),
  ('Juan Pérez','juan@textiles.mx','555-987-6543','Textiles del Sur','activo','Prospecto'),
  ('Ana García','ana@alebrijes.mx','555-456-7890','Alebrijes MX','activo','Frecuente'),
  ('Carlos Ruiz','carlos@barroyfuego.com','555-321-6547','Barro y Fuego','inactivo','Inactivo'),
  ('Luisa Morales','luisa@papelarte.mx','555-654-3210','Arte en Papel','activo','Activo');