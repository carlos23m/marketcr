import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inline PHP file templates with placeholder substitution
function gatewayPhp(apiKey: string, businessName: string, webhookUrl: string): string {
  return `<?php
if (!defined('ABSPATH')) exit;

class WC_SINPEpay_Gateway extends WC_Payment_Gateway {
  public string $api_key;
  public string $webhook_url;

  public function __construct() {
    $this->id                 = 'sinpepay';
    $this->method_title       = 'SINPEpay';
    $this->method_description = 'Acepta pagos SINPE Móvil a través de SINPEpay';
    $this->has_fields         = false;
    $this->supports           = ['products'];
    $this->init_form_fields();
    $this->init_settings();
    $this->title       = $this->get_option('title', 'SINPE Móvil via SINPEpay');
    $this->api_key     = $this->get_option('api_key', '${apiKey}');
    $this->webhook_url = '${webhookUrl}';
    add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
  }

  public function init_form_fields(): void {
    $this->form_fields = [
      'enabled'   => ['title' => 'Habilitado', 'type' => 'checkbox', 'default' => 'yes'],
      'title'     => ['title' => 'Título', 'type' => 'text', 'default' => 'SINPE Móvil via SINPEpay'],
      'api_key'   => ['title' => 'API Key de SINPEpay', 'type' => 'password', 'description' => 'Obténgala en SINPEpay > API y Webhooks'],
      'test_mode' => ['title' => 'Modo de prueba', 'type' => 'checkbox', 'default' => 'no'],
    ];
  }

  public function process_payment($order_id): array {
    $order    = wc_get_order($order_id);
    $api      = new WC_SINPEpay_API($this->api_key);
    $link     = $api->create_link([
      'descripcion' => 'Orden #' . $order_id,
      'monto'       => (int) round($order->get_total()),
      'cliente'     => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
      'vencimiento' => date('c', strtotime('+2 hours')),
    ]);
    if (!$link || empty($link['data']['id'])) {
      wc_add_notice('Error al crear el cobro. Intente de nuevo.', 'error');
      return ['result' => 'failure'];
    }
    $order->update_meta_data('_sinpepay_link_id', $link['data']['id']);
    $order->save();
    return ['result' => 'success', 'redirect' => esc_url($link['data']['url'] ?? home_url('/p/' . $link['data']['id']))];
  }
}
`
}

function apiPhp(apiKey: string): string {
  return `<?php
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

  private function request(string $method, string $path, array $body = []): ?array {
    $args = [
      'method'  => $method,
      'headers' => ['Authorization' => 'Bearer ' . $this->api_key, 'Content-Type' => 'application/json'],
      'timeout' => 15,
    ];
    if ($body) $args['body'] = wp_json_encode($body);
    $resp = wp_remote_request($this->base_url . $path, $args);
    if (is_wp_error($resp)) return null;
    return json_decode(wp_remote_retrieve_body($resp), true);
  }
}
`
}

function webhookPhp(webhookUrl: string): string {
  return `<?php
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
    if (empty($payload['event']) || empty($payload['data'])) return new WP_REST_Response(['ok' => false], 400);

    if ($payload['event'] === 'payment.link.paid') {
      $link_id  = $payload['data']['id'] ?? '';
      $orders   = wc_get_orders(['meta_key' => '_sinpepay_link_id', 'meta_value' => $link_id, 'limit' => 1]);
      if (!empty($orders)) {
        $order = $orders[0];
        $order->payment_complete($payload['data']['transaccionId'] ?? $link_id);
        $order->add_order_note('Pago confirmado por SINPEpay.');
      }
    }
    return new WP_REST_Response(['ok' => true], 200);
  }
}
`
}

function mainPhp(apiKey: string, businessName: string, webhookUrl: string): string {
  return `<?php
/**
 * Plugin Name: SINPEpay para WooCommerce
 * Plugin URI:  https://sinpepay.cr
 * Description: Acepta pagos SINPE Móvil en tu tienda WooCommerce a través de SINPEpay.
 * Version:     1.0.0
 * Author:      SINPEpay
 * Author URI:  https://sinpepay.cr
 * Requires PHP: 8.0
 * WC requires at least: 7.0
 * WC tested up to: 8.5
 */

if (!defined('ABSPATH')) exit;

define('SINPEPAY_VERSION', '1.0.0');
define('SINPEPAY_PLUGIN_DIR', plugin_dir_path(__FILE__));

add_action('plugins_loaded', function () {
  if (!class_exists('WC_Payment_Gateway')) return;
  require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-api.php';
  require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-webhook.php';
  require_once SINPEPAY_PLUGIN_DIR . 'includes/class-sinpepay-gateway.php';
  new WC_SINPEpay_Webhook();
  add_filter('woocommerce_payment_gateways', fn($gws) => [...$gws, 'WC_SINPEpay_Gateway']);
});

register_activation_hook(__FILE__, function () {
  // Register webhook in SINPEpay
  $api_key     = get_option('woocommerce_sinpepay_settings')['api_key'] ?? '${apiKey}';
  $webhook_url = rest_url('sinpepay/v1/webhook');
  wp_remote_post('https://sinpepay.cr/api/v1/webhooks', [
    'headers' => ['Authorization' => 'Bearer ' . $api_key, 'Content-Type' => 'application/json'],
    'body'    => wp_json_encode(['url' => $webhook_url, 'events' => ['payment.link.paid'], 'description' => 'WooCommerce auto-registered']),
    'timeout' => 10,
  ]);
});
`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { api_key, business_name } = await req.json()
  if (!api_key) return new Response(JSON.stringify({ error: 'api_key required' }), { status: 400, headers: corsHeaders })

  const appUrl     = Deno.env.get('APP_URL') ?? 'https://sinpepay.cr'
  const webhookUrl = `${appUrl}/api/tiendanube/webhook`
  const name       = business_name ?? 'Mi Negocio'

  // Build PHP file contents
  const files: Record<string, string> = {
    'sinpepay-woocommerce.php':                       mainPhp(api_key, name, webhookUrl),
    'includes/class-sinpepay-gateway.php':            gatewayPhp(api_key, name, webhookUrl),
    'includes/class-sinpepay-api.php':                apiPhp(api_key),
    'includes/class-sinpepay-webhook.php':            webhookPhp(webhookUrl),
  }

  // Return as JSON map (client assembles the zip using JSZip)
  return new Response(JSON.stringify({ ok: true, files }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
