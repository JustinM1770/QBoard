<?php
/**
 * Clientes — CRUD + búsqueda + filtro + cambio de etapa.
 *   GET    clientes.php                      -> listar (?buscar= , ?estado= , ?etapa=)
 *   GET    clientes.php?id=1                  -> detalle
 *   POST   clientes.php                       -> crear
 *   PUT    clientes.php?id=1                  -> editar
 *   PUT    clientes.php?id=1&accion=etapa     -> cambiar etapa_crm
 *   DELETE clientes.php?id=1                  -> borrar
 */
require_once __DIR__ . '/../config/cors.php';

$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

try {
    // ---- Crear ----
    if ($m === 'POST') {
        $d = body();
        if (empty(trim($d['nombre'] ?? ''))) json_out(['error' => 'El nombre es obligatorio'], 400);
        $st = db()->prepare("INSERT INTO clientes (nombre, correo, telefono, empresa, estado, etapa_crm)
                             VALUES (?,?,?,?,?,?)");
        $st->execute([
            trim($d['nombre']), trim($d['correo'] ?? ''), trim($d['telefono'] ?? ''),
            trim($d['empresa'] ?? ''), $d['estado'] ?? 'activo', $d['etapa_crm'] ?? 'Prospecto',
        ]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
    }

    // ---- Cambiar etapa ----
    if ($m === 'PUT' && ($_GET['accion'] ?? '') === 'etapa') {
        $d = body();
        $etapas = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];
        if (!in_array($d['etapa_crm'] ?? '', $etapas, true)) json_out(['error' => 'Etapa inválida'], 400);
        db()->prepare("UPDATE clientes SET etapa_crm = ? WHERE id = ?")->execute([$d['etapa_crm'], $id]);
        json_out(['ok' => true]);
    }

    // ---- Editar ----
    if ($m === 'PUT' && $id !== null) {
        $d = body();
        $st = db()->prepare("UPDATE clientes SET nombre=?, correo=?, telefono=?, empresa=?, estado=? WHERE id=?");
        $st->execute([
            trim($d['nombre'] ?? ''), trim($d['correo'] ?? ''), trim($d['telefono'] ?? ''),
            trim($d['empresa'] ?? ''), $d['estado'] ?? 'activo', $id,
        ]);
        json_out(['ok' => true]);
    }

    // ---- Borrar ----
    if ($m === 'DELETE' && $id !== null) {
        db()->prepare("DELETE FROM clientes WHERE id = ?")->execute([$id]);
        json_out(['ok' => true]);
    }

    // ---- Detalle ----
    if ($m === 'GET' && $id !== null) {
        $st = db()->prepare("SELECT * FROM clientes WHERE id = ?");
        $st->execute([$id]);
        $c = $st->fetch();
        if (!$c) json_out(['error' => 'No encontrado'], 404);
        json_out($c);
    }

    // ---- Listar (búsqueda + filtros) ----
    if ($m === 'GET') {
        $where = []; $args = [];
        if (($b = trim($_GET['buscar'] ?? '')) !== '') {
            $where[] = "(nombre LIKE ? OR empresa LIKE ? OR correo LIKE ?)";
            array_push($args, "%$b%", "%$b%", "%$b%");
        }
        if (in_array($_GET['estado'] ?? '', ['activo', 'inactivo'], true)) {
            $where[] = "estado = ?"; $args[] = $_GET['estado'];
        }
        if (in_array($_GET['etapa'] ?? '', ['Prospecto','Activo','Frecuente','Inactivo'], true)) {
            $where[] = "etapa_crm = ?"; $args[] = $_GET['etapa'];
        }
        $sql = "SELECT * FROM clientes";
        if ($where) $sql .= " WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY id DESC";
        $st = db()->prepare($sql);
        $st->execute($args);
        json_out($st->fetchAll());
    }

    json_out(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    json_out(['error' => 'Error del servidor'], 500);
}
