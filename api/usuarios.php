<?php
/**
 * Usuarios — Integrante 3 (Justin). Listar y registrar usuarios del sistema.
 *   GET  usuarios.php   -> lista de usuarios (id, nombre, correo, rol)
 *   POST usuarios.php   -> crear { nombre, correo, password, rol }
 * Concepto CRM: registro de usuario responsable + seguridad (roles).
 */
require_once __DIR__ . '/../config/cors.php';

$m = $_SERVER['REQUEST_METHOD'];

try {
    if ($m === 'GET') {
        $r = db()->query("SELECT id, nombre, correo, rol, fecha_registro FROM usuarios ORDER BY id");
        json_out($r->fetchAll());
    }

    if ($m === 'POST') {
        $d = body();
        if (empty(trim($d['nombre'] ?? '')) || empty(trim($d['correo'] ?? '')) || empty($d['password'] ?? '')) {
            json_out(['error' => 'Nombre, correo y contraseña son obligatorios'], 400);
        }
        if (!filter_var($d['correo'], FILTER_VALIDATE_EMAIL)) {
            json_out(['error' => 'El correo no es válido'], 400);
        }
        $rol = in_array($d['rol'] ?? '', ['admin', 'usuario'], true) ? $d['rol'] : 'usuario';

        $ex = db()->prepare("SELECT id FROM usuarios WHERE correo = ?");
        $ex->execute([$d['correo']]);
        if ($ex->fetch()) json_out(['error' => 'Ya existe un usuario con ese correo'], 409);

        $hash = password_hash($d['password'], PASSWORD_DEFAULT);
        db()->prepare("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?,?,?,?)")
            ->execute([trim($d['nombre']), trim($d['correo']), $hash, $rol]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }

    json_out(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    json_out(['error' => 'Error del servidor'], 500);
}
