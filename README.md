# GenesisSign Frontend

Frontend de Next.js para GenesisSign.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Configuración de entorno

Copiar `.env.local.example` a `.env.local` y ajustar si es necesario:

```
NEXT_PUBLIC_API_BASE=http://localhost:3200/api/v1
```

## Desarrollo

```bash
npm run dev
```

La app estará disponible en [http://localhost:9002](http://localhost:9002).

## Scripts

- `npm run build` – compila el proyecto.
- `npm run start` – ejecuta la versión compilada en el puerto 9002.
- `npm run lint` – ejecuta ESLint.
- `npm run typecheck` – verifica tipos con TypeScript.

## Flujo de autenticación

El backend entrega un **access token** en el cuerpo de la respuesta y un **refresh token** en una cookie `HttpOnly`.

Las peticiones se realizan con `Authorization: Bearer <access_token>` y `withCredentials: true`.

Si una petición responde `401`, el cliente usa `/auth/refresh` para obtener un nuevo `access_token` y reintenta automáticamente la petición original.
