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


    // Cambiar estado de pedido
    // Al marcar como recibido, se suma la cantidad al stock
    if ($m === 'PUT' && $id !== null) {

        $nuevo = $_GET['estado'] ?? (body()['estado'] ?? '');

        if (!in_array($nuevo, $ESTADOS, true)) {
            json_out(['error' => 'Estado invalido'], 400);
        }

        $st = db()->prepare(
            "SELECT * FROM pedidos WHERE id = ?"
        );

        $st->execute([$id]);

        $ped = $st->fetch();

        if (!$ped) {
            json_out(['error' => 'Pedido no encontrado'], 404);
        }

        $sumado = false;

        // Si el pedido pasa a recibido, actualizar stock
        if (
            $nuevo === 'recibido' &&
            $ped['estado'] !== 'recibido'
        ) {

            db()->prepare(
                "UPDATE productos
                SET stock_actual = stock_actual + ?
                WHERE id = ?"
            )->execute([
                (int)$ped['cantidad'],
                (int)$ped['producto_id']
            ]);

            // Registrar entrada en movimientos
            db()->prepare(
                "INSERT INTO movimientos_inventario
                (producto_id, tipo, cantidad, motivo)
                VALUES (?, 'entrada', ?, 'compra')"
            )->execute([
                (int)$ped['producto_id'],
                (int)$ped['cantidad']
            ]);

            $sumado = true;
        }

        // Actualizar estado del pedido
        db()->prepare(
            "UPDATE pedidos
            SET estado = ?
            WHERE id = ?"
        )->execute([
            $nuevo,
            $id
        ]);

        json_out([
            'ok' => true,
            'stock_actualizado' => $sumado
        ]);
    }


    json_out(['error' => 'Metodo no permitido'], 405);

} catch (Throwable $e) {

    json_out(['error' => 'Error del servidor'], 500);
}