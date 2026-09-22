CREATE TABLE IF NOT EXISTS scm_config (
  id INT PRIMARY KEY,
  nivel_scm ENUM('Inicial','En desarrollo','Optimizado') NOT NULL DEFAULT 'Inicial'
);
INSERT INTO scm_config (id, nivel_scm) VALUES (1, 'En desarrollo')
  ON DUPLICATE KEY UPDATE nivel_scm = nivel_scm;

Archivo NUEVO: api/scm.php
<?php
require_once __DIR__ . '/../config/cors.php';
$NIVELES = ['Inicial', 'En desarrollo', 'Optimizado'];
$DESC = [
    'Inicial'       => 'Sin control formal: el inventario se maneja de forma manual y reactiva.',
    'En desarrollo' => 'Procesos definidos: hay estrategias de logistica y seguimiento de stock.',
    'Optimizado'    => 'Cadena madura: reposicion automatica, sin quiebres de stock y datos confiables.',
];
try {
    $m = $_SERVER['REQUEST_METHOD'];
    if ($m === 'PUT') {
        $nivel = body()['nivel_scm'] ?? '';
        if (!in_array($nivel, $NIVELES, true)) json_out(['error' => 'Nivel invalido'], 400);
        db()->prepare("UPDATE scm_config SET nivel_scm = ? WHERE id = 1")->execute([$nivel]);
        json_out(['ok' => true, 'nivel_scm' => $nivel]);
    }
    $total    = (int) db()->query("SELECT COUNT(*) FROM productos")->fetchColumn();
    $conEstr  = (int) db()->query("SELECT COUNT(*) FROM productos WHERE estrategia_logistica IN ('PUSH','PULL')")->fetchColumn();
    $criticos = (int) db()->query("SELECT COUNT(*) FROM productos WHERE stock_actual <= stock_minimo")->fetchColumn();
    $conProv  = (int) db()->query("SELECT COUNT(*) FROM productos WHERE proveedor_id IS NOT NULL")->fetchColumn();
    $pctEstr = $total ? $conEstr / $total : 0; $pctProv = $total ? $conProv / $total : 0;
    if ($pctEstr >= 0.9 && $pctProv >= 0.9 && $criticos === 0) $sugerido = 'Optimizado';
    elseif ($pctEstr >= 0.5 || $pctProv >= 0.5)                $sugerido = 'En desarrollo';
    else                                                       $sugerido = 'Inicial';
    $row = db()->query("SELECT nivel_scm FROM scm_config WHERE id = 1")->fetch();
    $nivel = $row['nivel_scm'] ?? $sugerido;
    json_out(['nivel_scm' => $nivel, 'descripcion' => $DESC[$nivel] ?? '', 'sugerido' => $sugerido,
        'indicadores' => ['total_productos'=>$total,'con_estrategia'=>$conEstr,'con_proveedor'=>$conProv,'en_stock_critico'=>$criticos]]);
} catch (Throwable $e) { json_out(['error' => 'Error del servidor'], 500); }
