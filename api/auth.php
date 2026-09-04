<?php
/**
 * Login — Integrante 3 (Justin).
 *   POST auth.php   body JSON: { "correo": "...", "password": "..." }
 *   ->  { "token": "...", "usuario": { "id", "nombre", "rol" } }
 *   Prueba:  admin@crm.mx / admin123
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Usa POST']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true) ?: [];
$correo   = trim($body['correo'] ?? '');
$password = $body['password'] ?? '';

if ($correo === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan correo o contraseña']);
    exit;
}

try {
    $stmt = db()->prepare("SELECT id, nombre, correo, password_hash, rol FROM usuarios WHERE correo = ? LIMIT 1");
    $stmt->execute([$correo]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit;
    }

    // Token simple para la clase (no es JWT real): id, rol y expiración a 8 h.
    $payload = ['id' => (int)$usuario['id'], 'rol' => $usuario['rol'], 'exp' => time() + 8 * 3600];
    $token   = base64_encode(json_encode($payload));

    echo json_encode([
        'token'   => $token,
        'usuario' => ['id' => (int)$usuario['id'], 'nombre' => $usuario['nombre'], 'rol' => $usuario['rol']],
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor']);
}
