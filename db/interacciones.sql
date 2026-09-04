-- ============================================================
--  Integrante 2 (Kevin) — Tabla INTERACCIONES
--  Importar DESPUES de clientes.sql y usuarios.sql (usa sus FK).
-- ============================================================
USE crm_negocios2;

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

INSERT INTO interacciones (cliente_id, usuario_id, tipo, descripcion, fecha) VALUES
  (1,1,'llamada','Se discutieron nuevos diseños para la próxima temporada.','2026-08-28 10:30:00'),
  (1,1,'correo','Envío de catálogo de nuevos productos.','2026-08-20 14:20:00'),
  (2,2,'reunion','Reunión en tienda para ver muestras.','2026-08-15 11:00:00'),
  (3,1,'llamada','Seguimiento a pedido anterior.','2026-07-10 09:00:00');
