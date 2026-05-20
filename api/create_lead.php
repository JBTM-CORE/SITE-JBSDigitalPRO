<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
    exit;
}

if (!empty($data['hp']) || (isset($data['elapsed_ms']) && (int)$data['elapsed_ms'] < 2500)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Validação anti-spam falhou']);
    exit;
}

$required = ['name', 'email', 'phone', 'service', 'message'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => "Campo obrigatório: {$field}"]);
        exit;
    }
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'E-mail inválido']);
    exit;
}

$odooUrl = rtrim(getenv('ODOO_URL') ?: '', '/');
$odooDb = getenv('ODOO_DB') ?: '';
$odooUser = getenv('ODOO_USERNAME') ?: '';
$odooPass = getenv('ODOO_PASSWORD') ?: '';

if (!$odooUrl || !$odooDb || !$odooUser || !$odooPass) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Configuração Odoo ausente']);
    exit;
}

function odoo_rpc($url, $service, $method, $args) {
    $payload = [
        'jsonrpc' => '2.0',
        'method' => 'call',
        'params' => [
            'service' => $service,
            'method' => $method,
            'args' => $args,
        ],
        'id' => random_int(1, 999999),
    ];

    $ch = curl_init($url . '/jsonrpc');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false || $httpCode >= 400) {
        $err = curl_error($ch) ?: ('HTTP ' . $httpCode);
        curl_close($ch);
        throw new Exception('Erro na comunicação com Odoo: ' . $err);
    }

    curl_close($ch);
    $decoded = json_decode($response, true);

    if (isset($decoded['error'])) {
        $msg = $decoded['error']['message'] ?? 'Erro desconhecido';
        throw new Exception('Erro Odoo: ' . $msg);
    }

    return $decoded['result'] ?? null;
}

try {
    $uid = odoo_rpc($odooUrl, 'common', 'authenticate', [$odooDb, $odooUser, $odooPass, []]);

    if (!$uid) {
        throw new Exception('Falha de autenticação no Odoo');
    }

    $leadVals = [
        'name' => trim($data['name']) . ' - ' . trim($data['service']),
        'contact_name' => trim($data['name']),
        'email_from' => trim($data['email']),
        'phone' => trim($data['phone']),
        'partner_name' => trim($data['company'] ?? ''),
        'description' => "Serviço: " . trim($data['service']) . "\n\nMensagem:\n" . trim($data['message']),
        'source_id' => false,
        'campaign_name' => trim($data['source'] ?? 'Site JBS DigitalPRO'),
    ];

    $leadId = odoo_rpc($odooUrl, 'object', 'execute_kw', [
        $odooDb,
        $uid,
        $odooPass,
        'crm.lead',
        'create',
        [$leadVals],
    ]);

    echo json_encode(['ok' => true, 'lead_id' => $leadId]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
