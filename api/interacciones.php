<?php
/**
 * Interacciones.
 *   POST interacciones.php                    -> registrar { cliente_id, usuario_id, tipo, descripcion, fecha? }
 *   GET  interacciones.php?cliente_id=1       -> historial de un cliente (timeline)
 *   GET  interacciones.php?usuario_id=1       -> "Mi actividad" (lo que registró un usuario)
 */
require_once __DIR__ . '/../config/cors.php';

$m = $_SERVER['REQUEST_METHOD'];

try {
    // ---- Registrar ----
    if ($m === 'POST') {
        $d = body();
        $tipos = ['llamada', 'correo', 'reunion'];
        if (empty($d['cliente_id']) || empty($d['usuario_id']) || !in_array($d['tipo'] ?? '', $tipos, true)) {
            json_out(['error' => 'Faltan datos o tipo inválido'], 400);
        }
        $fecha = !empty($d['fecha']) ? $d['fecha'] : date('Y-m-d H:i:s');
        $st = db()->prepare("INSERT INTO interacciones (cliente_id, usuario_id, tipo, descripcion, fecha)
                             VALUES (?,?,?,?,?)");
        $st->execute([(int)$d['cliente_id'], (int)$d['usuario_id'], $d['tipo'], trim($d['descripcion'] ?? ''), $fecha]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }

    // ---- Historial de un cliente ----
    if ($m === 'GET' && isset($_GET['cliente_id'])) {
        $st = db()->prepare("SELECT i.*, u.nombre AS usuario
                             FROM interacciones i
                             JOIN usuarios u ON u.id = i.usuario_id
                             WHERE i.cliente_id = ?
                             ORDER BY i.fecha DESC");
        $st->execute([(int) $_GET['cliente_id']]);
        json_out($st->fetchAll());
    }

    // ---- Mi actividad (por usuario) ----
    if ($m === 'GET' && isset($_GET['usuario_id'])) {
        $st = db()->prepare("SELECT i.*, c.nombre AS cliente
                             FROM interacciones i
                             JOIN clientes c ON c.id = i.cliente_id
                             WHERE i.usuario_id = ?
                             ORDER BY i.fecha DESC");
        $st->execute([(int) $_GET['usuario_id']]);
        json_out($st->fetchAll());
    }

    json_out(['error' => 'Petición inválida'], 400);

} catch (Throwable $e) {
    json_out(['error' => 'Error del servidor'], 500);
}
