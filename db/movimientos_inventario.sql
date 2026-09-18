-- ============================================================
--  Etapa 2 (SCM) · Integrante 2 (Kevin) — Tabla MOVIMIENTOS_INVENTARIO
--  Importar DESPUES de productos.sql (usa su FK producto_id).
-- ============================================================
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo        ENUM('entrada','salida') NOT NULL,
  cantidad    INT NOT NULL,
  motivo      ENUM('venta','ajuste','reposicion','compra') NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id  INT,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, fecha, usuario_id) VALUES
  (1, 'entrada', 50, 'compra',     '2026-04-10 10:00:00', 1),
  (2, 'salida',   5, 'venta',      '2026-04-09 12:00:00', 1),
  (3, 'entrada', 20, 'ajuste',     '2026-04-08 09:00:00', 1),
  (4, 'salida',  10, 'venta',      '2026-04-07 14:00:00', 2),
  (5, 'entrada', 30, 'compra',     '2026-04-05 11:00:00', 1);
