# American Advisor - Frontend

Sistema de Gestión de Inspecciones - Frontend Next.js

## 🚀 Tecnologías

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🔧 Instalación

```bash
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 🌐 Variables de Entorno

Crear `.env.local`:

```
NEXT_PUBLIC_API_URL=http://167.71.125.132/api/v1
```

## 📁 Estructura

```
app/
├── login/page.tsx      # Login
├── dashboard/page.tsx  # Dashboard
├── page.tsx           # Home (redirect)
├── layout.tsx         # Root layout
├── providers.tsx      # Providers
└── globals.css        # Global styles

lib/
├── api.ts             # API client
├── auth.tsx           # Auth context
└── utils.ts           # Utilities
```

## 🔐 Autenticación

La API usa Bearer Token. El token se almacena en localStorage y se envía en cada request.

## 📊 Dashboard

Muestra estadísticas de:
- Clientes
- Equipos
- Solicitudes de Inspección
- Órdenes de Trabajo

## 📝 API Endpoints

- `POST /auth/login` - Login
- `GET /dashboard/stats` - Estadísticas
- `GET /clients` - Listar clientes
- `GET /equipment` - Listar equipos
- `GET /inspection-requests` - Listar solicitudes

## 🚀 Deploy

Conectado a Vercel para deploy automático.
