<?php
/**
 * Evaluaciones — mide la relación con cada cliente (puntuación 1-5 + comentario).
 *   POST evaluaciones.php                  -> { cliente_id, usuario_id, puntuacion, comentario }
 *   GET  evaluaciones.php?cliente_id=1     -> evaluaciones de un cliente + promedio
 */
require_once __DIR__ . '/../config/cors.php';

$m = $_SERVER['REQUEST_METHOD'];

try {
    if ($m === 'POST') {
        $d = body();
        $p = (int) ($d['puntuacion'] ?? 0);
        if (empty($d['cliente_id']) || empty($d['usuario_id']) || $p < 1 || $p > 5) {
            json_out(['error' => 'Faltan datos o la puntuación debe ser de 1 a 5'], 400);
        }
        db()->prepare("INSERT INTO evaluaciones (cliente_id, usuario_id, puntuacion, comentario) VALUES (?,?,?,?)")
            ->execute([(int)$d['cliente_id'], (int)$d['usuario_id'], $p, trim($d['comentario'] ?? '')]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }

    if ($m === 'GET' && isset($_GET['cliente_id'])) {
        $cid = (int) $_GET['cliente_id'];
        $st = db()->prepare("SELECT e.*, u.nombre AS usuario
                             FROM evaluaciones e JOIN usuarios u ON u.id = e.usuario_id
                             WHERE e.cliente_id = ? ORDER BY e.fecha DESC");
        $st->execute([$cid]);
        $lista = $st->fetchAll();
        $prom = db()->prepare("SELECT ROUND(AVG(puntuacion),1) FROM evaluaciones WHERE cliente_id = ?");
        $prom->execute([$cid]);
        json_out(['promedio' => $prom->fetchColumn() ?: 0, 'evaluaciones' => $lista]);
    }

    json_out(['error' => 'Petición inválida'], 400);

} catch (Throwable $e) {
    json_out(['error' => 'Error del servidor'], 500);
}
