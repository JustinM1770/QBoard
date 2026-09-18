-- ============================================================
--  Etapa 2 (SCM) · Integrante 1 (Jose Luis) — Tabla PRODUCTOS
--  Importar DESPUES de proveedores.sql (usa su FK proveedor_id).
-- ============================================================
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS productos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  nombre               VARCHAR(100) NOT NULL,
  descripcion          TEXT,
  categoria            VARCHAR(80),
  stock_actual         INT NOT NULL DEFAULT 0,
  stock_minimo         INT NOT NULL DEFAULT 0,
  proveedor_id         INT,
  costo_unitario       DECIMAL(10,2) NOT NULL DEFAULT 0,
  estrategia_logistica ENUM('PUSH','PULL') NOT NULL DEFAULT 'PUSH',
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
) ENGINE=InnoDB;

INSERT INTO productos (nombre, descripcion, categoria, stock_actual, stock_minimo, proveedor_id, costo_unitario, estrategia_logistica) VALUES
  ('Vasija de barro',   'Vasija artesanal de barro',   'Cerámica',   25, 10, 3, 120.00, 'PUSH'),
  ('Textil bordado',    'Textil bordado a mano',        'Textil',     12, 10, 2, 250.00, 'PULL'),
  ('Alebrije',          'Figura alebrije de madera',    'Decoración',  8,  5, 4, 560.00, 'PUSH'),
  ('Collar artesanal',  'Collar de chaquira',           'Joyería',    30, 15, 4,  90.00, 'PULL'),
  ('Figura de barro',   'Figura decorativa de barro',   'Cerámica',    6, 10, 3, 140.00, 'PUSH');