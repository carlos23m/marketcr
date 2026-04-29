# Manual de Usuario — SINPEpay

SINPEpay es una plataforma de cobro y gestión de pagos para negocios costarricenses. Permite recibir pagos por SINPE Móvil, generar cobros con código QR, gestionar transacciones, emitir facturas y mucho más.

---

## Índice

1. [Registro e inicio de sesión](#1-registro-e-inicio-de-sesión)
2. [Configuración inicial del negocio](#2-configuración-inicial-del-negocio)
3. [Panel principal (Dashboard)](#3-panel-principal-dashboard)
4. [Cobros y enlaces de pago](#4-cobros-y-enlaces-de-pago)
5. [Página pública de pago](#5-página-pública-de-pago)
6. [Transacciones](#6-transacciones)
7. [Analítica](#7-analítica)
8. [Punto de Venta (POS)](#8-punto-de-venta-pos)
9. [Facturas](#9-facturas)
10. [Financiamiento](#10-financiamiento)
11. [Pagos Masivos](#11-pagos-masivos)
12. [Planilla](#12-planilla)
13. [Configuración](#13-configuración)
14. [API y Desarrolladores](#14-api-y-desarrolladores)
15. [Plugins e Integraciones](#15-plugins-e-integraciones)
16. [Planes y precios](#16-planes-y-precios)

---

## 1. Registro e inicio de sesión

### 1.1 Crear una cuenta

1. Ingrese a la aplicación y haga clic en **Crear cuenta**.
2. Ingrese su correo electrónico y una contraseña segura.
3. Si tiene un código de referido, ingréselo en el campo correspondiente.
4. Acepte los términos y condiciones.
5. Haga clic en **Registrarse**.
6. Recibirá un correo de verificación. Haga clic en el enlace para activar su cuenta.

### 1.2 Iniciar sesión

1. Ingrese su correo electrónico y contraseña.
2. Haga clic en **Iniciar sesión**.

### 1.3 Recuperar contraseña

1. En la pantalla de inicio de sesión, haga clic en **¿Olvidó su contraseña?**
2. Ingrese su correo electrónico y haga clic en **Enviar enlace**.
3. Revise su correo y siga el enlace para crear una nueva contraseña.

---

## 2. Configuración inicial del negocio

Al ingresar por primera vez, el sistema lo guiará por un asistente de 3 pasos para configurar su negocio.

### Paso 1 — Información del negocio

- **Nombre del negocio:** Nombre que verán sus clientes en los cobros.
- **Tipo de negocio:** Seleccione la categoría que mejor describe su actividad (Restaurante/Soda, Freelancer, Tienda, Vendedor de mercado, etc.).
- **País:** Costa Rica (actualmente disponible). Panamá, Guatemala y Honduras estarán disponibles próximamente.
- **Cédula jurídica:** Opcional. Número de identificación del negocio.

### Paso 2 — Datos de SINPE Móvil

- **Número SINPE Móvil:** El número de teléfono asociado a su cuenta SINPE. Se formatea automáticamente (ej. 8888-8888).
- **Número de WhatsApp:** Opcional. Para recibir notificaciones de pago por WhatsApp.

### Paso 3 — Confirmación

Revise todos los datos ingresados. Si todo es correcto, haga clic en **Guardar y continuar** para ir al panel principal.

> Puede editar esta información en cualquier momento desde **Configuración**.

---

## 3. Panel principal (Dashboard)

El panel principal le muestra un resumen de la actividad de su negocio.

### Tarjetas de estadísticas

| Tarjeta | Descripción |
|---------|-------------|
| Cobros de hoy | Total en colones recibido en el día |
| Cobros del mes | Total acumulado en el mes actual |
| Enlaces activos | Cantidad de cobros abiertos pendientes de pago |
| Facturas pendientes | Cobros sin factura emitida |

### Gráfico de ingresos

Muestra la tendencia diaria de ingresos en una línea de tiempo. Útil para identificar días de mayor movimiento.

### Transacciones recientes

Lista de los últimos 10 pagos recibidos con: remitente, monto, banco y fecha/hora.

### Acciones rápidas

- **Crear nuevo cobro:** Abre el formulario para generar un enlace de pago.
- **Ver todas las transacciones:** Va a la sección de Transacciones.

---

## 4. Cobros y enlaces de pago

### 4.1 Crear un nuevo cobro

1. Haga clic en **Crear cobro** (desde el panel o desde el menú lateral).
2. Complete el formulario:
   - **Descripción:** Concepto del cobro (ej. "Almuerzo del día", "Diseño de logo").
   - **Monto:** Cantidad en colones (₡).
   - **Nombre del cliente:** Opcional. Útil para identificar el cobro.
   - **Fecha de vencimiento:** Opcional. El cobro expira en esa fecha.
   - **Notas:** Información adicional interna.
3. Haga clic en **Crear**.

El sistema genera automáticamente un enlace único y un código QR.

### 4.2 Compartir el cobro

Una vez creado el cobro, puede:

- **Copiar el enlace:** Para enviarlo por WhatsApp, correo u otra app de mensajería.
- **Mostrar el QR:** El cliente escanea el código con su app bancaria.
- **Descargar el QR:** Guarda la imagen del código para imprimirla o compartirla.

### 4.3 Ver todos los cobros

En la sección **Cobros** del menú lateral encontrará la lista completa de sus enlaces de pago.

**Filtros disponibles:**
- Todos / Activos / Pagados / Vencidos

**Búsqueda:** Filtre por descripción o nombre del cliente.

### 4.4 Acciones sobre un cobro

Al hacer clic en un cobro de la lista, puede:

- **Ver detalles:** Información completa del cobro y transacción asociada.
- **Marcar como pagado manualmente:** Si el cliente pagó por otro medio. Se le pedirá nombre del pagador, fecha y referencia.
- **Copiar enlace / Ver QR.**
- **Eliminar:** Borra el cobro si ya no lo necesita.

### 4.5 Estados de un cobro

| Estado | Color | Significado |
|--------|-------|-------------|
| Activo | Verde | Pendiente de pago |
| Pagado | Azul | Pago recibido y confirmado |
| Vencido | Gris | Expiró sin recibir pago |

---

## 5. Página pública de pago

Cuando usted comparte un enlace de cobro, su cliente ve una página diseñada para facilitar el pago.

### Lo que ve el cliente

- Nombre de su negocio y logo (si configuró marca).
- Monto a pagar (₡).
- Descripción del cobro.
- Instrucciones de pago en 4 pasos.
- Código QR para escanear directamente desde la app del banco.
- Número SINPE Móvil al que transferir.
- Botón **"Pagar con SINPE Móvil"** (abre la app del banco con los datos precargados en dispositivos móviles).

### Pago con tarjeta (plan Pro o superior)

Si su negocio está en el plan Pro o Business, sus clientes también pueden pagar con tarjeta de crédito o débito directamente desde el enlace.

### Estados que ve el cliente

- **Activo:** Muestra el formulario de pago.
- **Pagado:** Confirmación de que el pago ya fue recibido.
- **Vencido:** Mensaje de que el enlace ya no está disponible.

---

## 6. Transacciones

La sección de **Transacciones** muestra todos los pagos recibidos en su negocio.

### Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| Fecha/Hora | Cuándo se recibió el pago |
| Monto | Cantidad recibida en ₡ |
| Remitente | Nombre de quien pagó |
| Banco | Banco de origen del pago |
| Método | SMS automático, manual, o enlace de pago |
| Factura | Si tiene o no factura emitida |

### Filtros disponibles

- **Por banco:** BCR, Banco Nacional, Banco Popular, BAC, Scotiabank, Otro.
- **Por método:** SMS, Manual, Enlace de pago.
- **Por monto mínimo.**
- **Por rango de fechas.**

### Ordenamiento

Haga clic en los encabezados de columna **Fecha** o **Monto** para ordenar ascendente o descendente.

### Resumen

En la parte superior se muestra el total de transacciones filtradas y el monto acumulado.

### Acciones

- **Generar factura:** Crea una factura electrónica a partir de la transacción.
- **Ver factura:** Accede a la factura ya emitida.
- **Exportar CSV:** Descarga todas las transacciones filtradas en formato Excel/CSV.

---

## 7. Analítica

> Disponible en plan **Pro** o superior.

La sección de **Analítica** ofrece métricas avanzadas para entender el rendimiento de su negocio.

### Selector de período

Botones para ver datos de: **7 días / 30 días / 90 días / 12 meses**.

### Tarjetas de métricas

| Métrica | Descripción |
|---------|-------------|
| Ingresos totales | Suma de todos los pagos en el período |
| Número de transacciones | Cantidad de pagos recibidos |
| Promedio por transacción | Monto promedio de cada pago |
| Tasa de conversión | % de cobros creados que fueron pagados |

### Gráficos

- **Ingresos diarios:** Línea de tendencia con área sombreada.
- **Por banco:** Gráfico de torta mostrando qué banco genera más pagos.
- **Proyección:** Estimación de ingresos al final del mes basada en la tendencia actual.
- **Por sucursal** (plan Business): Gráfico de barras comparando ingresos entre sus ubicaciones.

### Exportar datos

Haga clic en **Exportar CSV** para descargar los datos del período seleccionado.

---

## 8. Punto de Venta (POS)

> Disponible en plan **Pro** o superior.

El **Punto de Venta** es una pantalla optimizada para cobrar en persona, ideal para tablets y pantallas táctiles en mostradores.

### Cómo usar el POS

1. Ingrese el monto usando el **teclado numérico** en pantalla.
2. Agregue una descripción opcional.
3. Haga clic en **Cobrar**.
4. El sistema genera un código QR que el cliente escanea para pagar.
5. Una vez confirmado el pago, el sistema lo registra automáticamente.

### Ítems rápidos

Botones preconfigurados con montos frecuentes (ej. ₡1.500, ₡3.000). Configúrelos desde **Configuración**.

### Transacciones recientes

Panel lateral derecho con los últimos cobros del día.

### Modo sin conexión

Si el dispositivo pierde internet:
- Se muestra un banner naranja **"Sin conexión"**.
- Los cobros creados se guardan localmente.
- Al recuperar la conexión, se sincronizan automáticamente con el servidor (aparece un banner de sincronización).

---

## 9. Facturas

La sección de **Facturas** permite emitir comprobantes electrónicos para sus transacciones.

### Lista de facturas

Muestra todas las facturas emitidas con su estado:

| Estado | Descripción |
|--------|-------------|
| Borrador | Creada pero no enviada |
| Pendiente | Lista para enviar a Hacienda |
| Enviada | Enviada al Ministerio de Hacienda |
| Error | Hubo un problema en el envío |

### Crear una factura

Puede generar una factura desde dos lugares:
- Desde la lista de **Transacciones** → botón **Generar factura**.
- Desde la sección **Facturas** → botón **Nueva factura**.

### Detalle de factura

Al abrir una factura verá:
- Número de factura, fecha, estado.
- Datos del negocio y del cliente.
- Líneas de detalle (productos o servicios con montos).
- Subtotal, IVA (13%) y total.
- Transacción asociada (si aplica).

### Acciones disponibles

- **Editar:** Modificar datos antes de enviar.
- **Descargar PDF:** Para imprimir o adjuntar a un correo.
- **Enviar a Hacienda:** Envía la factura electrónica al Ministerio de Hacienda.
- **Anular:** Cancela la factura.

---

## 10. Financiamiento

> Disponible en plan **Pro** o superior.

SINPEpay ofrece un programa de **adelantos de ingresos** para negocios que califiquen.

> **Aviso importante:** Este es un adelanto de ingresos futuros, no un préstamo regulado. Consulte los términos antes de aplicar.

### Requisitos de elegibilidad

Su negocio debe cumplir:

| Criterio | Requisito |
|----------|-----------|
| Días de actividad | 90+ días usando SINPEpay |
| Transacciones | 20+ pagos registrados |
| Ingreso mensual promedio | Mínimo establecido por SINPEpay |
| Mes con ingresos | Al menos un mes completo con movimiento |

La pantalla muestra su progreso en cada criterio con barras de avance.

### Proceso de solicitud

1. Una vez elegible, haga clic en **Solicitar adelanto**.
2. El sistema muestra un calculador con:
   - Monto del adelanto disponible.
   - Período de repago.
   - Comisión del servicio.
   - Costo total.
3. Revise los términos y confirme la solicitud.

### Estado de su solicitud

| Estado | Descripción |
|--------|-------------|
| Pendiente | En revisión por SINPEpay |
| En revisión | Siendo evaluada |
| Aprobada | Adelanto aprobado |
| Desembolsada | Fondos recibidos, repago en curso |
| Pagada | Adelanto completamente repagado |

### Repago automático

Una vez desembolsado el adelanto, un porcentaje de cada pago SINPE recibido se deduce automáticamente hasta cancelar el saldo. La pantalla muestra el saldo restante y el progreso del repago.

---

## 11. Pagos Masivos

> Disponible en plan **Pro** o superior.

Los **Pagos Masivos** permiten organizar y gestionar pagos a múltiples destinatarios desde un solo lugar.

> SINPEpay organiza los pagos; usted los ejecuta manualmente desde su app bancaria.

### Pestaña: Lotes

Lista de todos sus lotes de pago con:
- Nombre del lote y fecha.
- Monto total.
- Estado del lote.

| Estado | Descripción |
|--------|-------------|
| Borrador | En preparación |
| Programado | Listo para ejecutar |
| En proceso | Pagos siendo enviados |
| Completado | Todos los pagos enviados |
| Fallido | Hubo errores en el proceso |

### Crear un nuevo lote

1. Haga clic en la pestaña **Nuevo lote**.
2. Asigne un nombre al lote.
3. Agregue destinatarios (desde la agenda o ingresando nuevos).
4. Indique el monto para cada destinatario.
5. Revise el resumen y haga clic en **Crear lote**.

### Ejecutar pagos

Al abrir un lote, verá la lista de pagos pendientes. Conforme vaya enviando cada transferencia desde su app bancaria, márquela como **Enviada** en el sistema para llevar el control.

### Pestaña: Destinatarios (Agenda)

Gestione su lista de contactos de pago frecuentes:
- Agregar nuevo destinatario (nombre y número SINPE).
- Editar o eliminar destinatarios existentes.

---

## 12. Planilla

> Disponible en plan **Business**.

La sección de **Planilla** facilita el cálculo y registro de salarios de sus empleados.

> Esta herramienta es un apoyo para el registro y pago de planilla. No reemplaza los reportes oficiales ante la CCSS o el MTSS.

### Pestaña: Historial

Lista de todas las corridas de planilla anteriores:
- Período (ej. "Enero 2025").
- Frecuencia (quincenal, mensual).
- Monto neto total.
- Estado.

### Crear nueva planilla

1. Haga clic en **Nueva planilla**.
2. Seleccione el período y la frecuencia.
3. Seleccione los empleados a incluir.
4. Ingrese el salario bruto de cada empleado.
5. El sistema calcula las deducciones y el neto a pagar.
6. Revise y haga clic en **Crear planilla**.
7. Conforme vaya enviando los pagos por SINPE, márquelos como **Enviados** en el sistema.

### Pestaña: Empleados

Gestione su nómina de empleados:
- **Agregar empleado:** Nombre, número SINPE y salario base.
- **Editar** o **desactivar** empleados.

---

## 13. Configuración

### 13.1 Perfil del negocio

Edite los datos de su negocio en cualquier momento:
- Nombre del negocio.
- Tipo de negocio.
- Número SINPE Móvil.
- Cédula jurídica (opcional).
- Número de WhatsApp (opcional).

Haga clic en **Guardar cambios** para aplicar.

### 13.2 Equipo (solo Dueño)

Invite colaboradores a su cuenta:
1. Haga clic en **Invitar miembro**.
2. Ingrese el correo electrónico del colaborador.
3. Seleccione el rol:
   - **Dueño:** Acceso completo.
   - **Cajero:** Solo puede crear cobros y ver transacciones.
4. Haga clic en **Enviar invitación**.

La invitación expira en 7 días. Puede cancelarla antes desde la sección **Invitaciones pendientes**.

### 13.3 Facturación y plan

Vea y gestione su suscripción:
- Plan actual y fecha de renovación.
- Comparación de planes disponibles (Starter, Pro, Business).
- Historial de pagos de su suscripción.
- Botón para actualizar o cambiar de plan.

### 13.4 SMS automático

Configure la importación automática de pagos SINPE a través de los mensajes SMS de su banco:
- Agregue la configuración de su banco.
- Pegue un SMS de prueba para verificar que el sistema lo lee correctamente.
- Una vez configurado, cada pago SINPE que reciba se registrará automáticamente.

### 13.5 Sucursales (plan Business)

Si su negocio tiene varias ubicaciones:
- Agregue cada sucursal con nombre, dirección y teléfono.
- Defina una sucursal como **principal**.
- Vea analítica separada por sucursal.

### 13.6 Marca / White-label (plan Business)

Personalice la apariencia de sus páginas de pago:
- **Logo:** Suba el logotipo de su negocio.
- **Color de marca:** Elija el color principal (código hexadecimal).
- **Dominio personalizado:** Use su propio dominio (ej. pagos.sunegocio.cr).

Todos sus cobros mostrarán la identidad visual de su marca.

### 13.7 Notificaciones

Configure cómo y cuándo recibir alertas:
- Activar/desactivar notificaciones push en el navegador.
- Elegir eventos que generan notificación (pago recibido, factura enviada, actualización de financiamiento, etc.).
- Enviar una notificación de prueba.

### 13.8 Cuenta

- Visualice el correo electrónico de su cuenta.
- Vea su plan actual.
- Haga clic en **Cerrar sesión** para salir.

---

## 14. API y Desarrolladores

> Disponible en plan **Pro** o superior.

Si desea integrar SINPEpay con sus propios sistemas o aplicaciones, la sección de **Desarrolladores** le da acceso a la API REST.

### API Key

- Vea su clave de API.
- Cópiela para usarla en sus integraciones.
- Regenere la clave si cree que fue comprometida.

### Webhooks

Configure una URL en su sistema para recibir notificaciones automáticas cuando:
- Se reciba un pago.
- Cambie el estado de un cobro.
- Se emita una factura.

**Cómo configurar:**
1. Haga clic en **Agregar webhook**.
2. Ingrese la URL de su servidor.
3. Seleccione los eventos que desea recibir.
4. Haga clic en **Guardar**.
5. Use el botón **Probar** para enviar un evento de prueba.

### Documentación

La sección incluye ejemplos de código en cURL, JavaScript y Python para los endpoints principales:
- Crear cobros.
- Listar transacciones.
- Consultar el estado de un cobro.

---

## 15. Plugins e Integraciones

### WooCommerce — Plugin SINPEpay

Si tiene una tienda en WordPress con WooCommerce, puede instalar el plugin nativo de SINPEpay:

1. Haga clic en **Descargar .zip**.
2. En WordPress, vaya a **Plugins → Subir plugin** y suba el archivo descargado.
3. Active el plugin.
4. En **WooCommerce → Ajustes → Pagos → SINPEpay**, pegue su **API Key** (obténgala desde **Desarrolladores → API**).
5. Realice un pedido de prueba de ₡100 para verificar que funciona.

Sus clientes podrán pagar con SINPE Móvil directamente desde su tienda. Los pagos se confirman automáticamente vía SMS.

### Tiendanube

Si tiene una tienda en Tiendanube:

1. Haga clic en **Conectar tienda**.
2. Autorice la conexión con su cuenta de Tiendanube.
3. Sus clientes verán SINPE Móvil como opción de pago al finalizar su compra.

Las tiendas conectadas aparecen en la lista. Puede desconectarlas en cualquier momento.

> Si esta integración no está disponible, su administrador debe configurar las credenciales de Tiendanube en el servidor.

### Magento / Adobe Commerce

Onvopay tiene una extensión oficial para Magento 2. Consulte la documentación oficial en el enlace que aparece en esta sección.

---

## 16. Planes y precios

SINPEpay ofrece tres planes adaptados al tamaño de su negocio:

| Característica | Starter | Pro | Business |
|---------------|---------|-----|---------|
| Cobros y enlaces de pago | ✓ | ✓ | ✓ |
| Transacciones ilimitadas | ✓ | ✓ | ✓ |
| Facturas electrónicas | ✓ | ✓ | ✓ |
| Exportar CSV | ✓ | ✓ | ✓ |
| Analítica avanzada | — | ✓ | ✓ |
| Punto de Venta (POS) | — | ✓ | ✓ |
| Financiamiento | — | ✓ | ✓ |
| Pagos masivos | — | ✓ | ✓ |
| API y Webhooks | — | ✓ | ✓ |
| Pago con tarjeta (clientes) | — | ✓ | ✓ |
| Planilla de empleados | — | — | ✓ |
| Múltiples sucursales | — | — | ✓ |
| Marca personalizada (White-label) | — | — | ✓ |
| Dominio propio | — | — | ✓ |

Para actualizar su plan, vaya a **Configuración → Facturación**.

---

## Preguntas frecuentes

**¿Cómo sé que un pago fue recibido?**
Si configuró el SMS automático, el sistema registra el pago en segundos al recibir el mensaje de su banco. También puede marcar un cobro como pagado manualmente.

**¿Puedo usar SINPEpay sin internet en el POS?**
Sí. En el modo Punto de Venta, los cobros se guardan localmente y se sincronizan automáticamente cuando vuelve la conexión.

**¿Mis clientes necesitan una cuenta en SINPEpay para pagar?**
No. Sus clientes solo acceden al enlace de pago y pagan desde su app bancaria normalmente.

**¿Puedo tener varios usuarios en mi cuenta?**
Sí, si es el dueño de la cuenta puede invitar colaboradores con el rol de Cajero desde **Configuración → Equipo**.

**¿Cómo instalo SINPEpay en mi celular?**
SINPEpay funciona como una app progresiva (PWA). En su navegador, verá una opción para **Instalar** o **Agregar a inicio**. Una vez instalada, funciona como una app normal incluyendo notificaciones push.

**¿Dónde reporto un problema?**
Contacte al soporte desde el correo indicado en la sección **Configuración → Cuenta** o escriba a soporte@sinpepay.cr.

---

*Versión del manual: Abril 2026 — SINPEpay para Costa Rica*
