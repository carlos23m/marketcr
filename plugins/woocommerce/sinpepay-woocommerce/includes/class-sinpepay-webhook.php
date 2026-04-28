<?php
if (!defined('ABSPATH')) exit;

class WC_SINPEpay_Webhook {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        register_rest_route('sinpepay/v1', '/webhook', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function handle(WP_REST_Request $request): WP_REST_Response {
        $payload = $request->get_json_params();
        $event   = $payload['event'] ?? '';
        $data    = $payload['data']  ?? [];

        if ($event === 'payment.link.paid') {
            $link_id = $data['id'] ?? '';
            if (!$link_id) return new WP_REST_Response(['ok' => false], 400);

            $orders = wc_get_orders([
                'meta_key'   => '_sinpepay_link_id',
                'meta_value' => $link_id,
                'limit'      => 1,
            ]);

            if (!empty($orders)) {
                $order    = $orders[0];
                $txn_id   = $data['transaccionId'] ?? $link_id;
                $order->payment_complete($txn_id);
                $order->add_order_note(
                    sprintf('Pago SINPE Móvil confirmado por SINPEpay. Transacción: %s', $txn_id)
                );
                wc_get_logger()->info(
                    sprintf('SINPEpay: order %d marked as paid (link: %s)', $order->get_id(), $link_id),
                    ['source' => 'sinpepay']
                );
            }
        }

        return new WP_REST_Response(['ok' => true], 200);
    }
}
