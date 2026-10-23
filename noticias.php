<?php
/**
 * API REST para la Barra de Noticias (News Bar) - Indus3
 * Soporta métodos: GET, POST, PUT, DELETE, OPTIONS
 */

// 1. Cabeceras CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejo de preflight request de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Clave de autenticación (debe coincidir con PUBLIC_BACKEND_AUTH_KEY)
define('AUTH_KEY', 'XW5V7VNGYUMILM1SJOAEKI8W48F1PVKW');

// 3. Configuración de la Base de Datos (Ajusta con tus credenciales de GoDaddy)
$db_host = 'localhost';
$db_name = 'indus3_db';      // Cambia por el nombre de tu base de datos en GoDaddy
$db_user = 'indus3_user';    // Cambia por tu usuario de MySQL en GoDaddy
$db_pass = 'tu_contraseña';  // Cambia por tu contraseña de MySQL en GoDaddy
$db_charset = 'utf8mb4';

try {
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit();
}

// 4. Función para verificar el token Bearer en métodos de escritura
function verificarAutenticacion() {
    $headers = null;
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }

    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        if ($matches[1] === AUTH_KEY) {
            return true;
        }
    }

    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'No autorizado. Token inválido o ausente.'
    ]);
    exit();
}

// 5. Enrutador según el método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Registro público de clics (No requiere autenticación)
if (isset($_GET['action']) && $_GET['action'] === 'click') {
    $clickId = $_GET['id'] ?? $input['id'] ?? null;
    if ($clickId && is_numeric($clickId)) {
        try {
            $stmt = $pdo->prepare("UPDATE noticias SET clics = clics + 1 WHERE id = ?");
            $stmt->execute([(int)$clickId]);
            echo json_encode(['success' => true, 'message' => 'Clic registrado con éxito']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al registrar clic: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de noticia inválido']);
    }
    exit();
}

switch ($method) {
    // ==========================================
    // GET: Obtener noticias y ajustes
    // ==========================================
    case 'GET':
        try {
            $soloActivas = isset($_GET['solo_activas']) && $_GET['solo_activas'] == '1';
            
            $sql = "SELECT id, texto, url, target_blank, activo, orden, clics, created_at, updated_at 
                    FROM noticias";
            if ($soloActivas) {
                $sql .= " WHERE activo = 1";
            }
            $sql .= " ORDER BY orden ASC, id ASC";

            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll();

            $formattedItems = [];
            foreach ($rows as $row) {
                $formattedItems[] = [
                    'id'           => (string)$row['id'],
                    'text'         => $row['texto'],
                    'url'          => $row['url'] ?? '',
                    'openInNewTab' => (bool)$row['target_blank'],
                    'enabled'      => (bool)$row['activo'],
                    'order'        => (int)$row['orden'],
                    'clicks'       => (int)($row['clics'] ?? 0)
                ];
            }

            // Obtener configuración si existe tabla noticias_config
            $config = [
                'enabled'   => true,
                'badgeText' => 'NOTICIAS',
                'speed'     => 'normal',
                'separator' => '✦',
                'spacing'   => 'double'
            ];

            try {
                $stmtConfig = $pdo->query("SELECT barra_activa, badge_text, velocidad, separador, espaciado FROM noticias_config WHERE id = 1 LIMIT 1");
                $rowConfig = $stmtConfig->fetch();
                if ($rowConfig) {
                    $config = [
                        'enabled'   => (bool)$rowConfig['barra_activa'],
                        'badgeText' => $rowConfig['badge_text'] ?? 'NOTICIAS',
                        'speed'     => $rowConfig['velocidad'] ?? 'normal',
                        'separator' => $rowConfig['separador'] ?? '✦',
                        'spacing'   => $rowConfig['espaciado'] ?? 'double'
                    ];
                }
            } catch (Exception $e) {
                // Si no existe la tabla de configuración, usamos los defaults
            }

            echo json_encode([
                'success' => true,
                'config'  => $config,
                'data'    => $formattedItems
            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al consultar noticias: ' . $e->getMessage()]);
        }
        break;

    // ==========================================
    // POST: Crear una noticia o Guardar Todo (Bulk)
    // ==========================================
    case 'POST':
        verificarAutenticacion();

        // Modo Bulk: Si se envía el objeto completo de configuración y noticias
        if (isset($input['action']) && $input['action'] === 'save_all' && isset($input['items'])) {
            try {
                $pdo->beginTransaction();

                // 1. Guardar configuración si se envió
                if (isset($input['config'])) {
                    $c = $input['config'];
                    $stmtConf = $pdo->prepare("INSERT INTO noticias_config (id, barra_activa, badge_text, velocidad, separador, espaciado)
                        VALUES (1, :activa, :badge, :vel, :sep, :esp)
                        ON DUPLICATE KEY UPDATE 
                            barra_activa = :activa2,
                            badge_text   = :badge2,
                            velocidad    = :vel2,
                            separador    = :sep2,
                            espaciado    = :esp2");
                    
                    $activa = !empty($c['enabled']) ? 1 : 0;
                    $badge  = $c['badgeText'] ?? 'NOTICIAS';
                    $vel    = $c['speed'] ?? 'normal';
                    $sep    = $c['separator'] ?? '✦';
                    $esp    = $c['spacing'] ?? 'double';

                    $stmtConf->execute([
                        ':activa'  => $activa, ':badge'  => $badge, ':vel'  => $vel, ':sep'  => $sep, ':esp'  => $esp,
                        ':activa2' => $activa, ':badge2' => $badge, ':vel2' => $vel, ':sep2' => $sep, ':esp2' => $esp
                    ]);
                }

                // 2. Sincronizar noticias: eliminar las que ya no están y actualizar/insertar las presentes
                $incomingItems = $input['items'];
                $incomingIds = [];

                foreach ($incomingItems as $idx => $item) {
                    $texto = trim($item['text'] ?? '');
                    if (empty($texto)) continue;

                    $url          = trim($item['url'] ?? '');
                    $targetBlank  = !empty($item['openInNewTab']) ? 1 : 0;
                    $activo       = (!isset($item['enabled']) || $item['enabled']) ? 1 : 0;
                    $orden        = (int)($item['order'] ?? $idx);

                    // Si el id es numérico existente, actualizar
                    if (!empty($item['id']) && is_numeric($item['id'])) {
                        $id = (int)$item['id'];
                        $stmtUpd = $pdo->prepare("UPDATE noticias 
                            SET texto = ?, url = ?, target_blank = ?, activo = ?, orden = ? 
                            WHERE id = ?");
                        $stmtUpd->execute([$texto, $url, $targetBlank, $activo, $orden, $id]);
                        $incomingIds[] = $id;
                    } else {
                        // Insertar nueva
                        $stmtIns = $pdo->prepare("INSERT INTO noticias (texto, url, target_blank, activo, orden) 
                            VALUES (?, ?, ?, ?, ?)");
                        $stmtIns->execute([$texto, $url, $targetBlank, $activo, $orden]);
                        $incomingIds[] = (int)$pdo->lastInsertId();
                    }
                }

                // Eliminar noticias que se borraron en el admin
                if (!empty($incomingIds)) {
                    $inPlaceholders = implode(',', array_fill(0, count($incomingIds), '?'));
                    $stmtDel = $pdo->prepare("DELETE FROM noticias WHERE id NOT IN ($inPlaceholders)");
                    $stmtDel->execute($incomingIds);
                } else {
                    $pdo->exec("DELETE FROM noticias");
                }

                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Todas las noticias se guardaron correctamente']);

            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al guardar noticias: ' . $e->getMessage()]);
            }
            break;
        }

        // Modo Individual: Insertar una sola noticia
        $texto = trim($input['text'] ?? $input['texto'] ?? '');
        if (empty($texto)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El texto de la noticia es obligatorio.']);
            exit();
        }

        $url         = trim($input['url'] ?? '');
        $targetBlank = !empty($input['openInNewTab']) || !empty($input['target_blank']) ? 1 : 0;
        $activo      = (!isset($input['enabled']) || $input['enabled']) ? 1 : 0;
        $orden       = (int)($input['order'] ?? $input['orden'] ?? 0);

        try {
            $stmt = $pdo->prepare("INSERT INTO noticias (texto, url, target_blank, activo, orden) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$texto, $url, $targetBlank, $activo, $orden]);
            $newId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'id'      => (string)$newId,
                'message' => 'Noticia agregada con éxito.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al insertar noticia: ' . $e->getMessage()]);
        }
        break;

    // ==========================================
    // PUT: Actualizar una noticia existente o ajustes
    // ==========================================
    case 'PUT':
        verificarAutenticacion();

        // Actualizar ajustes generales de la barra
        if (isset($input['action']) && $input['action'] === 'update_config') {
            try {
                $activa = !empty($input['enabled']) ? 1 : 0;
                $badge  = $input['badgeText'] ?? 'NOTICIAS';
                $vel    = $input['speed'] ?? 'normal';
                $sep    = $input['separator'] ?? '✦';
                $esp    = $input['spacing'] ?? 'double';

                $stmt = $pdo->prepare("INSERT INTO noticias_config (id, barra_activa, badge_text, velocidad, separador, espaciado)
                    VALUES (1, :activa, :badge, :vel, :sep, :esp)
                    ON DUPLICATE KEY UPDATE 
                        barra_activa = :activa2,
                        badge_text   = :badge2,
                        velocidad    = :vel2,
                        separador    = :sep2,
                        espaciado    = :esp2");
                $stmt->execute([
                    ':activa'  => $activa, ':badge'  => $badge, ':vel'  => $vel, ':sep'  => $sep, ':esp'  => $esp,
                    ':activa2' => $activa, ':badge2' => $badge, ':vel2' => $vel, ':sep2' => $sep, ':esp2' => $esp
                ]);
                echo json_encode(['success' => true, 'message' => 'Configuración actualizada']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar configuración: ' . $e->getMessage()]);
            }
            break;
        }

        // Actualizar una noticia por ID
        $id = $input['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de noticia requerido para actualizar.']);
            exit();
        }

        $texto       = trim($input['text'] ?? $input['texto'] ?? '');
        $url         = trim($input['url'] ?? '');
        $targetBlank = !empty($input['openInNewTab']) || !empty($input['target_blank']) ? 1 : 0;
        $activo      = (!isset($input['enabled']) || $input['enabled']) ? 1 : 0;
        $orden       = (int)($input['order'] ?? $input['orden'] ?? 0);

        try {
            $stmt = $pdo->prepare("UPDATE noticias SET texto = ?, url = ?, target_blank = ?, activo = ?, orden = ? WHERE id = ?");
            $stmt->execute([$texto, $url, $targetBlank, $activo, $orden, $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Noticia actualizada con éxito.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar noticia: ' . $e->getMessage()]);
        }
        break;

    // ==========================================
    // DELETE: Eliminar una noticia
    // ==========================================
    case 'DELETE':
        verificarAutenticacion();

        $id = $input['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de noticia requerido para eliminar.']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM noticias WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Noticia eliminada correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar noticia: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
        break;
}
?>
