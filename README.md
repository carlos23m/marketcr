# SINPEpay

Plataforma de cobros por SINPE Móvil para pequeños negocios en Costa Rica. Permite crear enlaces de pago, registrar transacciones, generar facturas y gestionar el negocio desde un panel web.

## Funcionalidades

- **Autenticación** — registro, inicio de sesión y recuperación de contraseña con Supabase Auth
- **Onboarding** — configuración del negocio (nombre, tipo, número SINPE Móvil)
- **Cobros (Payment Links)** — crear y compartir enlaces de pago con monto, cliente y vencimiento
- **Transacciones** — importación de SMS de SINPE Móvil y registro manual de pagos
- **Facturas** — generación y gestión de facturas por cobro
- **Tiempo real** — actualización automática de cobros vía Supabase Realtime
- **Roles** — dueño (`dueno`) y empleado (`empleado`) con permisos diferenciados
- **Invitaciones** — invitar empleados por enlace

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 + Vite + `<script setup>` |
| Estado | Pinia |
| Estilos | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Autenticación | Supabase Auth |
| Tiempo real | Supabase Realtime |
| Despliegue | Vercel |

## Estructura del proyecto

```
src/
├── components/
│   ├── dashboard/      # StatsCard, RevenueChart, RecentPaymentsTable
│   ├── layout/         # AppShell, AppSidebar, AppTopbar
│   └── ui/             # AppButton, AppCard, AppModal
├── composables/        # usePermissions
├── lib/
│   ├── database.js     # Funciones de acceso a Supabase
│   └── supabase.js     # Cliente Supabase
├── stores/
│   ├── useAuthStore.js
│   ├── usePaymentsStore.js
│   ├── useTransactionsStore.js
│   └── useInvoicesStore.js
├── utils/
│   ├── currency.js     # formatCRC
│   └── mockData.js
└── views/
    ├── auth/           # LoginView, RegisterView, OnboardingView
    ├── public/         # PayView (página pública de cobro)
    └── *.vue           # Dashboard, Cobros, Transacciones, Facturas, Configuración
supabase/
└── migrations/         # 001_schema, 002_rls_policies, 003_profile_trigger
```

## Variables de entorno

Cree un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-jwt>
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Migraciones de base de datos

Ejecute las migraciones en orden en el SQL Editor de Supabase:

1. `supabase/migrations/001_schema.sql` — tablas base
2. `supabase/migrations/002_rls_policies.sql` — políticas RLS
3. `supabase/migrations/003_profile_trigger.sql` — trigger de perfil automático

## Despliegue en Vercel

1. Conecte el repositorio en Vercel
2. Agregue las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Cada push a `main` despliega automáticamente
