-- ============================================================
--  Integrante 2 · Kevin — Tabla INTERACCIONES + etapa_crm (Día 1)
--  Ejecutar DESPUES de clientes.sql y usuarios.sql (usa sus FK).
-- ============================================================
USE crm_negocios2;

-- Etapa CRM del cliente
ALTER TABLE clientes
  ADD COLUMN etapa_crm ENUM('Prospecto','Activo','Frecuente','Inactivo') NOT NULL DEFAULT 'Prospecto';

CREATE TABLE IF NOT EXISTS interacciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id  INT NOT NULL,
  usuario_id  INT NOT NULL,
  tipo        ENUM('llamada','correo','reunion') NOT NULL,
  descripcion TEXT,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
