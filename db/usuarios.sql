-- ============================================================
--  Integrante 3 · Justin — Tabla USUARIOS (Día 1)
--  Ejecutar DESPUES de clientes.sql (usa la misma base).
-- ============================================================
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  correo         VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Usuario de prueba (correo: admin@crm.mx  ·  contraseña: admin123)
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
  ('Admin', 'admin@crm.mx', '$2y$10$w81f/t1apNj.GLT7cZVtmekpNX0LfCQcXoEy3KgvfLJuumQnFgacG', 'admin');
