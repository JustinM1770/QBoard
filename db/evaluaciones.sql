-- ============================================================
--  Tabla EVALUACIONES (métricas CRM de la relación con el cliente)
--  Ejecutar sobre la base crm_negocios2 (después de clientes y usuarios).
-- ============================================================
USE crm_negocios2;

CREATE TABLE IF NOT EXISTS evaluaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id  INT NOT NULL,
  usuario_id  INT NOT NULL,
  puntuacion  TINYINT NOT NULL,             -- 1 a 5
  comentario  TEXT,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Datos de ejemplo
INSERT INTO evaluaciones (cliente_id, usuario_id, puntuacion, comentario) VALUES
  (1, 1, 5, 'Excelente relación, compra frecuente y buena comunicación.'),
  (2, 2, 3, 'Interesado pero aún no concreta pedidos grandes.'),
  (4, 1, 2, 'Poca respuesta en los últimos meses.');
