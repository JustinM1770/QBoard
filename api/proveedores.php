 <?php
require_once __DIR__ . '/../config/cors.php';
$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
try {
    if ($m === 'POST') {
        $d = body();
        if (empty(trim($d['nombre'] ?? ''))) json_out(['error' => 'El nombre es obligatorio'], 400);
        if (!empty($d['correo']) && !filter_var($d['correo'], FILTER_VALIDATE_EMAIL)) json_out(['error' => 'Correo invalido'], 400);
        db()->prepare("INSERT INTO proveedores (nombre, contacto, correo, telefono) VALUES (?,?,?,?)")
            ->execute([trim($d['nombre']), trim($d['contacto'] ?? ''), trim($d['correo'] ?? ''), trim($d['telefono'] ?? '')]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }
    if ($m === 'PUT' && $id !== null) {
        $d = body();
        db()->prepare("UPDATE proveedores SET nombre=?, contacto=?, correo=?, telefono=? WHERE id=?")
            ->execute([trim($d['nombre'] ?? ''), trim($d['contacto'] ?? ''), trim($d['correo'] ?? ''), trim($d['telefono'] ?? ''), $id]);
        json_out(['ok' => true]);
    }
    if ($m === 'DELETE' && $id !== null) {
        db()->prepare("DELETE FROM proveedores WHERE id = ?")->execute([$id]);
        json_out(['ok' => true]);
    }
    if ($m === 'GET' && $id !== null) {
        $st = db()->prepare("SELECT * FROM proveedores WHERE id = ?"); $st->execute([$id]);
        $p = $st->fetch(); if (!$p) json_out(['error' => 'No encontrado'], 404); json_out($p);
    }
    if ($m === 'GET') { json_out(db()->query("SELECT * FROM proveedores ORDER BY id")->fetchAll()); }
    json_out(['error' => 'Metodo no permitido'], 405);
} catch (Throwable $e) { json_out(['error' => 'Error del servidor'], 500); }