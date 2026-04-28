<?php
/**
 * Plugin Name: SINPEpay para WooCommerce
 * Plugin URI:  https://sinpepay.cr
 * Description: Acepta pagos SINPE Móvil en tu tienda WooCommerce a través de SINPEpay.
 * Version:     1.0.0
 * Author:      SINPEpay
 * Author URI:  https://sinpepay.cr
 * Text Domain: sinpepay-woocommerce
 * Requires PHP: 8.0
 * WC requires at least: 7.0
 * WC tested up to: 9.0
 */

if (!defined('ABSPATH')) exit;

define('SINPEPAY_VERSION', '1.0.0');
define('SINPEPAY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SINPEPAY_PLUGIN_URL', plugin_dir_url(__FILE__));

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) {
        add_action('admin_notices', function () {
            echo '<div class="error"><p>SINPEpay para WooCommerce requiere WooCommerce activo.</p></div>';
        });
        return;
    }
    require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-api.php';
    require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-webhook.php';
    require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-gateway.php';

    new WC_SINPEpay_Webhook();
    add_filter('woocommerce_payment_gateways', fn($gws) => [...$gws, 'WC_SINPEpay_Gateway']);
});

register_activation_hook(__FILE__, function () {
    $settings = get_option('woocommerce_sinpepay_settings', []);
    $api_key  = $settings['api_key'] ?? '';
    if (!$api_key) return;
    $webhook_url = rest_url('sinpepay/v1/webhook');
    wp_remote_post('https://sinpepay.cr/api/v1/webhooks', [
        'headers' => ['Authorization' => 'Bearer ' . $api_key, 'Content-Type' => 'application/json'],
        'body'    => wp_json_encode([
            'url'         => $webhook_url,
            'events'      => ['payment.link.paid'],
            'description' => 'WooCommerce auto-registrado',
        ]),
        'timeout' => 10,
    ]);
});

register_deactivation_hook(__FILE__, function () {
    // Webhook cleanup handled by SINPEpay via dashboard
});
