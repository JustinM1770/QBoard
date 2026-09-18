-- ============================================================
--  Etapa 2 (SCM) · Integrante 3 (Justin) — Tabla PROVEEDORES
--  Va en la misma base del proyecto (crm_negocios2). Importar PRIMERO
--  (productos depende de esta por su FK proveedor_id).
-- ============================================================
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS proveedores (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  correo   VARCHAR(120),
  telefono VARCHAR(30)
) ENGINE=InnoDB;

INSERT INTO proveedores (nombre, contacto, correo, telefono) VALUES
  ('Artesanías del Sur',  'Juan Pérez',   'juan@sur.com',       '55 1234 5678'),
  ('Textiles Oaxaqueños', 'María López',  'maria@oax.mx',       '55 8765 4321'),
  ('Barro y Tradición',   'Carlos Ruiz',  'carlos@barro.com',   '55 2222 3333'),
  ('Alebrijes García',    'Ana Torres',   'ana@alebrijes.mx',   '55 4444 5555');
