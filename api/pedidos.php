<?php
require_once __DIR__ . '/../config/cors.php';

$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

$ESTADOS = ['pendiente', 'confirmado', 'recibido', 'cancelado'];

try {

    // Crear pedido manual
    if ($m === 'POST') {

        $d = body();

        $pid  = (int)($d['producto_id'] ?? 0);
        $cant = (int)($d['cantidad'] ?? 0);

        if ($pid <= 0 || $cant <= 0) {
            json_out(
                ['error' => 'Producto y cantidad son obligatorios'],
                400
            );
        }

        // Comprobar que el producto exista
        $pr = db()->prepare(
            "SELECT id FROM productos WHERE id = ?"
        );

        $pr->execute([$pid]);

        if (!$pr->fetch()) {
            json_out(['error' => 'El producto no existe'], 404);
        }

        // Crear pedido manual pendiente
        db()->prepare(
            "INSERT INTO pedidos
            (producto_id, cantidad, tipo, estado)
            VALUES (?, ?, 'manual', 'pendiente')"
        )->execute([$pid, $cant]);

        json_out([
            'ok' => true,
            'id' => (int) db()->lastInsertId()
        ], 201);
    }


    // Consultar un pedido específico
    if ($m === 'GET' && $id !== null) {

        $st = db()->prepare(
            "SELECT pe.*, pr.nombre AS producto
            FROM pedidos pe
            JOIN productos pr ON pr.id = pe.producto_id
            WHERE pe.id = ?"
        );

        $st->execute([$id]);

        $p = $st->fetch();

        if (!$p) {
            json_out(['error' => 'No encontrado'], 404);
        }

        json_out($p);
    }


    // Listar pedidos
    if ($m === 'GET') {

        $where = [];
        $args = [];

        // Filtrar por estado
        if (in_array($_GET['estado'] ?? '', $ESTADOS, true)) {
            $where[] = "pe.estado = ?";
            $args[] = $_GET['estado'];
        }

        // Filtrar por tipo
        if (
            in_array(
                $_GET['tipo'] ?? '',
                ['manual', 'reposicion'],
                true
            )
        ) {
            $where[] = "pe.tipo = ?";
            $args[] = $_GET['tipo'];
        }

        $sql =
            "SELECT pe.*, pr.nombre AS producto
            FROM pedidos pe
            JOIN productos pr ON pr.id = pe.producto_id";

        if ($where) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY pe.fecha DESC";

        $st = db()->prepare($sql);
        $st->execute($args);

        json_out($st->fetchAll());
    }


    json_out(['error' => 'Metodo no permitido'], 405);

} catch (Throwable $e) {

    json_out(['error' => 'Error del servidor'], 500);
}