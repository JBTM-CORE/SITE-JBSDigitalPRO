<?php
/**
 * Encaminha dados de formulário para webhook n8n via endpoint REST local.
 * Defina N8N_WEBHOOK_URL (e opcionalmente N8N_WEBHOOK_TOKEN) no wp-config.php.
 */

add_action('rest_api_init', function () {
    register_rest_route('jbs/v1', '/lead', [
        'methods'  => 'POST',
        'callback' => 'jbs_forward_lead_to_n8n',
        'permission_callback' => '__return_true',
    ]);
});

function jbs_forward_lead_to_n8n(WP_REST_Request $request) {
    $payload = [
        'name' => sanitize_text_field((string) $request->get_param('name')),
        'email' => sanitize_email((string) $request->get_param('email')),
        'phone' => sanitize_text_field((string) $request->get_param('phone')),
        'message' => sanitize_textarea_field((string) $request->get_param('message')),
        'source' => 'wordpress-bricks',
        'created_at' => gmdate('c'),
    ];

    if (empty($payload['email']) || empty($payload['name'])) {
        return new WP_REST_Response(['ok' => false, 'error' => 'missing_required_fields'], 400);
    }

    if (!defined('N8N_WEBHOOK_URL') || !N8N_WEBHOOK_URL) {
        return new WP_REST_Response(['ok' => false, 'error' => 'missing_n8n_webhook_url'], 500);
    }

    $headers = ['Content-Type' => 'application/json'];
    if (defined('N8N_WEBHOOK_TOKEN') && N8N_WEBHOOK_TOKEN) {
        $headers['Authorization'] = 'Bearer ' . N8N_WEBHOOK_TOKEN;
    }

    $response = wp_remote_post(N8N_WEBHOOK_URL, [
        'headers' => $headers,
        'timeout' => 15,
        'body' => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        return new WP_REST_Response([
            'ok' => false,
            'error' => 'n8n_request_failed',
            'details' => $response->get_error_message(),
        ], 502);
    }

    return new WP_REST_Response(['ok' => true], 200);
}
