## Cómo probar Auth

1. Copia `.env.local.example` a `.env.local` y ajusta si es necesario.
   ```bash
   NEXT_PUBLIC_API_BASE=http://localhost:3200/api/v1
   ```
2. Flujo básico:
   - Login (`POST /auth/login`) guarda el `access_token` en memoria.
   - Llama a `/users/me` para obtener el usuario.
   - Cuando expira el access token, el interceptor hace `POST /auth/refresh`,
     actualiza el token y reintenta la petición.
   - Logout (`POST /auth/logout`) limpia el token en todas las pestañas.

> El refresh token viaja en una cookie **HttpOnly**; el frontend nunca la lee.
