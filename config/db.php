<?php
// Integrante 1 · Jose Luis — Conexión a la base de datos (Día 1)
// Devuelve un PDO ya conectado. Ajusta usuario/contraseña si hace falta.
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $host = '127.0.0.1';
        $name = 'crm_negocios2';
        $user = 'root';
        $pass = '';
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}
