<?php
/**
 * Métricas del CRM (dashboard + reportes) — Integrante 3 (Justin).
 *   GET metricas.php  ->  { total, activos, inactivos, interacciones_mes,
 *                          por_tipo, por_etapa, en_riesgo[] }
 */
require_once __DIR__ . '/../config/cors.php';

try {
    $db = db();

    $total     = (int) $db->query("SELECT COUNT(*) FROM clientes")->fetchColumn();
    $activos   = (int) $db->query("SELECT COUNT(*) FROM clientes WHERE estado='activo'")->fetchColumn();
    $inactivos = (int) $db->query("SELECT COUNT(*) FROM clientes WHERE estado='inactivo'")->fetchColumn();
    $intMes    = (int) $db->query("SELECT COUNT(*) FROM interacciones
                                   WHERE MONTH(fecha)=MONTH(CURDATE()) AND YEAR(fecha)=YEAR(CURDATE())")->fetchColumn();

    // Interacciones por tipo
    $porTipo = ['llamada' => 0, 'correo' => 0, 'reunion' => 0];
    foreach ($db->query("SELECT tipo, COUNT(*) c FROM interacciones GROUP BY tipo") as $r) {
        $porTipo[$r['tipo']] = (int) $r['c'];
    }

    // Clientes por etapa
    $porEtapa = ['Prospecto' => 0, 'Activo' => 0, 'Frecuente' => 0, 'Inactivo' => 0];
    foreach ($db->query("SELECT etapa_crm, COUNT(*) c FROM clientes GROUP BY etapa_crm") as $r) {
        $porEtapa[$r['etapa_crm']] = (int) $r['c'];
    }

    // Clientes en riesgo: última interacción hace 30+ días, o sin interacciones
    $riesgo = $db->query("
        SELECT c.id, c.nombre, DATEDIFF(CURDATE(), MAX(i.fecha)) AS dias
        FROM clientes c
        LEFT JOIN interacciones i ON i.cliente_id = c.id
        GROUP BY c.id, c.nombre
        HAVING dias IS NULL OR dias >= 30
        ORDER BY dias DESC
        LIMIT 10
    ")->fetchAll();

    json_out([
        'total' => $total, 'activos' => $activos, 'inactivos' => $inactivos,
        'interacciones_mes' => $intMes, 'por_tipo' => $porTipo, 'por_etapa' => $porEtapa,
        'en_riesgo' => $riesgo,
    ]);

} catch (Throwable $e) {
    json_out(['error' => 'Error del servidor'], 500);
}
