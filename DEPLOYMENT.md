# Guía de Deployment para Producción

## Problemas Resueltos

Se han corregido los siguientes problemas que impedían el funcionamiento en producción y Vercel:

1. **Configuración de `baseURL` en Better Auth**: Se cambió para usar variables de entorno consistentes
2. **SSR Issues**: Se eliminó el uso de `window.location.origin` que causaba errores en Server-Side Rendering
3. **Variables de entorno**: Se simplificó la configuración para usar `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL`
4. **Cross-domain cookies**: Se deshabilitó para evitar problemas en producción

## Variables de Entorno Requeridas en Vercel

Para que la aplicación funcione correctamente en Vercel, configura las siguientes variables de entorno:

### 1. Database
```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

### 2. URLs de la Aplicación
```
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
BETTER_AUTH_URL=https://tu-dominio.vercel.app
```

**IMPORTANTE**: 
- Reemplaza `tu-dominio.vercel.app` con tu URL real de Vercel
- Ambas variables deben tener el **mismo valor** incluyendo el `https://`
- No uses la variable `VERCEL_URL` directamente - usa tu dominio completo

### 3. Node Environment
```
NODE_ENV=production
```

## Pasos para Deployment en Vercel

### Opción 1: Desde la Terminal

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Login en Vercel:
```bash
vercel login
```

3. Configura las variables de entorno:
```bash
# Primero, despliega en preview para obtener tu URL
vercel

# Una vez que tengas tu URL, configura las variables:
vercel env add NEXT_PUBLIC_APP_URL
# Ingresa: https://tu-dominio.vercel.app

vercel env add BETTER_AUTH_URL
# Ingresa: https://tu-dominio.vercel.app

vercel env add DATABASE_URL
# Ingresa tu connection string de PostgreSQL

vercel env add NODE_ENV
# Ingresa: production
```

4. Redespliega con las variables configuradas:
```bash
vercel --prod
```

### Opción 2: Desde el Dashboard de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Añade las siguientes variables:
   - `NEXT_PUBLIC_APP_URL` = `https://tu-dominio.vercel.app`
   - `BETTER_AUTH_URL` = `https://tu-dominio.vercel.app`
   - `DATABASE_URL` = tu connection string de PostgreSQL
   - `NODE_ENV` = `production`
4. Redespliega desde el dashboard o haz push al repositorio

## Configuración de Base de Datos

### Proveedores Recomendados (con tier gratuito):

1. **Neon** (Recomendado)
   - URL: https://neon.tech
   - Tier gratuito generoso
   - Integración directa con Vercel
   - Connection pooling incluido

2. **Supabase**
   - URL: https://supabase.com
   - Tier gratuito disponible
   - Buena documentación

3. **Railway**
   - URL: https://railway.app
   - Fácil de usar
   - $5 de crédito gratis mensual

### Ejemplo de Connection String:
```
postgresql://user:password@ep-cool-credit-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Verificar que Todo Funciona

1. Accede a tu URL de producción: `https://tu-dominio.vercel.app`
2. Ve a `/login`
3. Intenta iniciar sesión con una cuenta existente o crea una nueva en `/signup`
4. Verifica que puedas acceder al dashboard

## Problemas Comunes y Soluciones

### Error: "Unable to reach auth server"
- **Causa**: Variables de entorno no configuradas correctamente
- **Solución**: Verifica que `NEXT_PUBLIC_APP_URL` y `BETTER_AUTH_URL` tengan tu URL completa con `https://`

### Error: "Database connection failed"
- **Causa**: `DATABASE_URL` incorrecta o base de datos no accesible
- **Solución**: 
  - Verifica que tu connection string sea correcto
  - Asegúrate de que tu base de datos permita conexiones desde las IPs de Vercel
  - Si usas Neon/Supabase, verifica que SSL esté habilitado (`?sslmode=require`)

### Las cookies no se guardan
- **Causa**: Configuración de cookies seguras
- **Solución**: Ya está configurado en el código - las cookies seguras se habilitan automáticamente en producción

### La página de login no carga
- **Causa**: Error en el build o en variables de entorno
- **Solución**: 
  - Revisa los logs de build en Vercel
  - Verifica que todas las variables de entorno estén configuradas
  - Asegúrate de que las migraciones de Prisma se hayan ejecutado

## Logs y Debugging

Para ver los logs en Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Navega a la pestaña **Deployments**
3. Haz clic en tu deployment más reciente
4. Revisa los logs en las pestañas:
   - **Build Logs**: Errores durante el build
   - **Functions**: Errores en runtime de las API routes

## Build Local (para testing)

Para probar el build de producción localmente:

```bash
# 1. Instala dependencias
npm install

# 2. Genera el cliente de Prisma
npm run postinstall

# 3. Build de producción
npm run build

# 4. Inicia el servidor de producción
npm run start
```

Si funciona localmente pero no en Vercel, el problema es con las variables de entorno.

## Contacto

Si sigues teniendo problemas después de seguir esta guía:
1. Revisa los logs de Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que tu base de datos sea accesible desde internet

