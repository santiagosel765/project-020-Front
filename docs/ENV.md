# .env setup

Create a `.env.local` file and define the backend base URL:

```
NEXT_PUBLIC_API_BASE=https://api.example.com
```

All HTTP requests go through the Next.js proxy at `/api/*`, which forwards to `NEXT_PUBLIC_API_BASE` using `src/app/api/_proxy.ts`.

