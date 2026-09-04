-- ============================================================
--  Integrante 3 (Justin) — Tabla USUARIOS (login + roles)
--  Contraseña de ambos usuarios de prueba: admin123
-- ============================================================
CREATE DATABASE IF NOT EXISTS crm_negocios2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  correo         VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
  ('Admin', 'admin@crm.mx', '$2y$10$HTs0brfYnAU7q.rKHC5Ekeuv6Pc6/.sqYL/mtwXgP11abZYQNN6me', 'admin'),
  ('Vendedor', 'user@crm.mx', '$2y$10$HTs0brfYnAU7q.rKHC5Ekeuv6Pc6/.sqYL/mtwXgP11abZYQNN6me', 'usuario');
