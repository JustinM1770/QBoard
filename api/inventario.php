<?php
require_once __DIR__ . '/../config/cors.php';

$m = $_SERVER['REQUEST_METHOD'];

try {

    // Registrar un movimiento de inventario
    if ($m === 'POST') {
        $b = body();

        $producto_id = (int)($b['producto_id'] ?? 0);
        $tipo = $b['tipo'] ?? '';
        $cantidad = (int)($b['cantidad'] ?? 0);
        $motivo = $b['motivo'] ?? '';
        $usuario_id = (int)($b['usuario_id'] ?? 0);

        if (
            !$producto_id ||
            !in_array($tipo, ['entrada', 'salida'], true) ||
            $cantidad <= 0
        ) {
            json_out(['error' => 'Datos invalidos'], 400);
        }

        $st = db()->prepare(
            "INSERT INTO movimientos_inventario
            (producto_id, tipo, cantidad, motivo, usuario_id)
            VALUES (?, ?, ?, ?, ?)"
        );

        $st->execute([
            $producto_id,
            $tipo,
            $cantidad,
            $motivo,
            $usuario_id
        ]);

        $operador = $tipo === 'entrada' ? '+' : '-';

        db()->prepare(
            "UPDATE productos
            SET stock_actual = stock_actual $operador ?
            WHERE id = ?"
        )->execute([
            $cantidad,
            $producto_id
        ]);

        json_out(['ok' => true]);
    }


    // Consultar historial de movimientos de un producto
    if ($m === 'GET' && isset($_GET['producto_id'])) {

        $st = db()->prepare(
            "SELECT mi.*, u.nombre AS usuario
            FROM movimientos_inventario mi
            LEFT JOIN usuarios u ON u.id = mi.usuario_id
            WHERE mi.producto_id = ?
            ORDER BY mi.fecha DESC"
        );

        $st->execute([
            (int)$_GET['producto_id']
        ]);

        json_out($st->fetchAll());
    }


    // Consultar inventario general y detectar stock bajo
    if ($m === 'GET') {

        $rows = db()->query(
            "SELECT id, nombre, stock_actual, stock_minimo,
            estrategia_logistica
            FROM productos
            ORDER BY nombre"
        )->fetchAll();

        foreach ($rows as &$r) {

            $r['estado'] =
                ((int)$r['stock_actual'] <= (int)$r['stock_minimo'])
                ? 'Stock bajo'
                : 'Normal';
        }

        json_out($rows);
    }


    json_out(['error' => 'Metodo no permitido'], 405);

} catch (Throwable $e) {

    json_out(['error' => 'Error del servidor'], 500);
}