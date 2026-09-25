<?php
require_once __DIR__ . '/../config/cors.php';
$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
try {
    if ($m === 'POST') {
        $d = body();
        if (empty(trim($d['nombre'] ?? ''))) json_out(['error' => 'El nombre es obligatorio'], 400);
        db()->prepare("INSERT INTO productos (nombre, descripcion, categoria, stock_actual, stock_minimo, proveedor_id, costo_unitario, estrategia_logistica)
                       VALUES (?,?,?,?,?,?,?,?)")
            ->execute([
                trim($d['nombre']), trim($d['descripcion'] ?? ''), trim($d['categoria'] ?? ''),
                (int)($d['stock_actual'] ?? 0), (int)($d['stock_minimo'] ?? 0),
                !empty($d['proveedor_id']) ? (int)$d['proveedor_id'] : null,
                round((float)($d['costo_unitario'] ?? 0), 2),
                in_array($d['estrategia_logistica'] ?? '', ['PUSH','PULL'], true) ? $d['estrategia_logistica'] : 'PUSH',
            ]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }
    if ($m === 'GET' && $id !== null) {
        $st = db()->prepare("SELECT p.*, pr.nombre AS proveedor FROM productos p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id WHERE p.id = ?");
        $st->execute([$id]);
        $p = $st->fetch();
        if (!$p) json_out(['error' => 'No encontrado'], 404);
        json_out($p);
    }
    if ($m === 'PUT' && $id !== null) {
        $d = body();
        db()->prepare("UPDATE productos SET nombre=?, descripcion=?, categoria=?, stock_actual=?, stock_minimo=?, proveedor_id=?, costo_unitario=? WHERE id=?")
            ->execute([
                trim($d['nombre'] ?? ''), trim($d['descripcion'] ?? ''), trim($d['categoria'] ?? ''),
                (int)($d['stock_actual'] ?? 0), (int)($d['stock_minimo'] ?? 0),
                !empty($d['proveedor_id']) ? (int)$d['proveedor_id'] : null,
                round((float)($d['costo_unitario'] ?? 0), 2), $id,
            ]);
        json_out(['ok' => true]);
    }
    if ($m === 'DELETE' && $id !== null) {
        db()->prepare("DELETE FROM productos WHERE id = ?")->execute([$id]);
        json_out(['ok' => true]);
    }
    if ($m === 'GET') {
        $where = []; $args = [];
        if (($b = trim($_GET['buscar'] ?? '')) !== '') { $where[] = "p.nombre LIKE ?"; $args[] = "%$b%"; }
        if (($c = trim($_GET['categoria'] ?? '')) !== '') { $where[] = "p.categoria = ?"; $args[] = $c; }
        if (in_array($_GET['estrategia'] ?? '', ['PUSH','PULL'], true)) { $where[] = "p.estrategia_logistica = ?"; $args[] = $_GET['estrategia']; }
        $sql = "SELECT p.*, pr.nombre AS proveedor FROM productos p LEFT JOIN proveedores pr ON pr.id = p.proveedor_id";
        if ($where) $sql .= " WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY p.id DESC";
        $st = db()->prepare($sql); $st->execute($args);
        json_out($st->fetchAll());
    }
    json_out(['error' => 'Metodo no permitido'], 405);
} catch (Throwable $e) { json_out(['error' => 'Error del servidor'], 500); }