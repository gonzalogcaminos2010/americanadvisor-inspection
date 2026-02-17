# Sistema Frontend

## Flujo de Desarrollo "Audio → Código → Deploy"

### Cómo funciona:

1. **Grabás un audio** desde Telegram/WhatsApp describiendo el cambio
2. **Yo proceso** → Entiendo → Modifico el código
3. **Commit + Push** → Vercel deploya automáticamente
4. **Te mando el link** del preview

### Ejemplos de audios que podés mandar:

- *"El cliente dice que el botón de guardar está muy chico, agrandarlo y ponerlo verde"*
- *"Agregá una columna de 'Estado' en la tabla de usuarios"*
- *"El login está feo, ponelo más moderno tipo Linear"*
- *"Agregá un gráfico de ventas en el dashboard"*

### Estructura del proyecto:

```
frontend/
├── app/              # Next.js App Router
│   ├── page.tsx      # Dashboard principal
│   ├── layout.tsx    # Layout raíz
│   └── providers.tsx # Providers (React Query, etc)
├── components/       # Componentes React
├── lib/             # Utilidades y API client
└── types/           # Tipos TypeScript
```

### Comandos útiles:

```bash
cd frontend
npm run dev          # Desarrollo local
npm run build        # Build de producción
```

### Variables de entorno:

Crear `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://tu-api.com
```
