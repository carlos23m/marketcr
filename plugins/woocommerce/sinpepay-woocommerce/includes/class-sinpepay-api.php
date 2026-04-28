<?php
if (!defined('ABSPATH')) exit;

class WC_SINPEpay_API {
    private string $base_url = 'https://sinpepay.cr/api/v1';
    private string $api_key;

    public function __construct(string $api_key) {
        $this->api_key = $api_key;
    }

    public function create_link(array $data): ?array {
        return $this->request('POST', '/links', $data);
    }

    public function get_link(string $id): ?array {
        return $this->request('GET', '/links/' . $id);
    }

    public function test_connection(): bool {
        $result = $this->request('GET', '/me');
        return $result !== null && isset($result['data']);
    }

    private function request(string $method, string $path, array $body = []): ?array {
        $args = [
            'method'  => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type'  => 'application/json',
                'User-Agent'    => 'SINPEpay-WooCommerce/' . SINPEPAY_VERSION,
            ],
            'timeout' => 15,
        ];
        if (!empty($body)) {
            $args['body'] = wp_json_encode($body);
        }
        $response = wp_remote_request($this->base_url . $path, $args);
        if (is_wp_error($response)) {
            wc_get_logger()->error('SINPEpay API error: ' . $response->get_error_message(), ['source' => 'sinpepay']);
            return null;
        }
        return json_decode(wp_remote_retrieve_body($response), true);
    }
}
