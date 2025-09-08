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

## Cómo probar Auth end-to-end

1. Crea `.env.local` con `NEXT_PUBLIC_API_BASE` apuntando al backend.
2. Realiza login en la app.
3. El cliente llama `getMe()` para obtener roles y permitir acceso.
4. Deja expirar el access token: la próxima solicitud devolverá `401`.
5. El interceptor usa `/auth/refresh` y reintenta la petición original.
6. Ejecuta logout para invalidar la sesión.

Nota: el refresh token viaja en una cookie `HttpOnly` y no es accesible desde JavaScript.
