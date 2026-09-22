CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  tipo ENUM('reposicion','manual') NOT NULL DEFAULT 'manual',
  estado ENUM('pendiente','confirmado','recibido','cancelado') NOT NULL DEFAULT 'pendiente',
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);