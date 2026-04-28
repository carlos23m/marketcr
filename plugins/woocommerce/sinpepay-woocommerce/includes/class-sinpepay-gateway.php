<?php
if (!defined('ABSPATH')) exit;

class WC_SINPEpay_Gateway extends WC_Payment_Gateway {
    public string $api_key;
    public bool   $test_mode;

    public function __construct() {
        $this->id                 = 'sinpepay';
        $this->icon               = SINPEPAY_PLUGIN_URL . 'assets/sinpepay-logo.png';
        $this->method_title       = 'SINPEpay';
        $this->method_description = 'Acepta pagos SINPE Móvil a través de SINPEpay. El cliente es redirigido a la página de pago de SINPEpay.';
        $this->has_fields         = false;
        $this->supports           = ['products'];

        $this->init_form_fields();
        $this->init_settings();

        $this->title     = $this->get_option('title', 'SINPE Móvil (SINPEpay)');
        $this->api_key   = $this->get_option('api_key', '');
        $this->test_mode = $this->get_option('test_mode', 'no') === 'yes';

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
    }

    public function init_form_fields(): void {
        $this->form_fields = [
            'enabled'   => [
                'title'   => 'Habilitado',
                'type'    => 'checkbox',
                'default' => 'yes',
            ],
            'title'     => [
                'title'   => 'Título en el checkout',
                'type'    => 'text',
                'default' => 'SINPE Móvil (SINPEpay)',
            ],
            'api_key'   => [
                'title'       => 'API Key de SINPEpay',
                'type'        => 'password',
                'description' => 'Obténgala en SINPEpay > API y Webhooks.',
            ],
            'test_mode' => [
                'title'   => 'Modo de prueba',
                'type'    => 'checkbox',
                'default' => 'no',
            ],
        ];
    }

    public function process_payment($order_id): array {
        $order  = wc_get_order($order_id);
        $total  = (int) round($order->get_total());

        if ($total < 1) {
            wc_add_notice('El monto del pedido no es válido.', 'error');
            return ['result' => 'failure'];
        }

        $currency = get_woocommerce_currency();
        if ($currency !== 'CRC') {
            wc_add_notice('SINPEpay solo acepta pagos en colones (CRC). Configure su tienda con CRC.', 'error');
            return ['result' => 'failure'];
        }

        $api    = new WC_SINPEpay_API($this->api_key);
        $result = $api->create_link([
            'descripcion' => sprintf('Orden WooCommerce #%s', $order_id),
            'monto'       => $total,
            'cliente'     => trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
            'vencimiento' => date('c', strtotime('+2 hours')),
            'notas'       => sprintf('wc_order_id:%s', $order_id),
        ]);

        if (empty($result['data']['id'])) {
            wc_add_notice('Error al crear el cobro en SINPEpay. Por favor intente nuevamente.', 'error');
            return ['result' => 'failure'];
        }

        $link_id  = $result['data']['id'];
        $pay_url  = $result['data']['url'] ?? ('https://sinpepay.cr/p/' . $link_id);

        $order->update_meta_data('_sinpepay_link_id', $link_id);
        $order->update_status('pending', 'Esperando pago SINPE Móvil vía SINPEpay.');
        $order->save();

        WC()->cart->empty_cart();

        return ['result' => 'success', 'redirect' => esc_url($pay_url)];
    }
}
