# 🚀 Guía Rápida de Deployment en Vercel

## ✅ Lo Más Importante

El código **ya está configurado** para funcionar automáticamente con Vercel. Solo necesitas configurar **UNA variable de entorno obligatoria**.

### 🔒 Protección de Rutas Implementada

- ✅ Las rutas del dashboard ahora verifican la sesión en el servidor
- ✅ El proxy (middleware) protege las rutas antes de que se rendericen
- ✅ Funciona correctamente tanto en desarrollo como en producción/Vercel

---

## 📋 Variables de Entorno Requeridas

### Obligatoria ✅

Solo necesitas configurar esto en Vercel:

```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**¿Dónde obtener esto?**
- [Neon.tech](https://neon.tech) (Recomendado - Gratis)
- [Supabase](https://supabase.com) (Gratis)
- [Railway](https://railway.app) ($5 gratis/mes)

### Opcionales (solo si tienes dominio custom)

Si tienes un dominio personalizado (ej: `miapp.com`), también configura:

```
NEXT_PUBLIC_APP_URL=https://miapp.com
BETTER_AUTH_URL=https://miapp.com
```

**⚠️ IMPORTANTE**: Si NO configuras estas variables, la app usará automáticamente el dominio de Vercel (ej: `mi-app.vercel.app`). Esto es **perfecto** y **NO necesitas hacer nada**.

---

## 🎯 Pasos para Deployar

### Método 1: Conectar GitHub a Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com) y haz login
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. En "Configure Project":
   - Framework Preset: **Next.js** (detectado automáticamente)
   - Build Command: `npm run build` (ya configurado)
   - Output Directory: `.next` (ya configurado)
5. Click en "Environment Variables"
6. Añade solo la variable **DATABASE_URL**:
   ```
   Name: DATABASE_URL
   Value: postgresql://tu-connection-string
   ```
7. Click en "Deploy" 🚀

### Método 2: CLI de Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (te preguntará por las variables)
vercel

# 4. Cuando te pregunte por environment variables, añade:
# DATABASE_URL = tu connection string
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué NO necesito configurar NEXT_PUBLIC_APP_URL?

Porque el código ya está configurado para usar automáticamente:
1. `VERCEL_URL` (proporcionada automáticamente por Vercel)
2. `window.location.origin` en el cliente

Esto significa que **funciona en cualquier URL** sin configuración adicional.

### ¿El dominio de Vercel no cambia en cada deployment?

Sí y no:
- **Preview deployments** (commits en ramas): URL cambia (ej: `my-app-git-feature.vercel.app`)
- **Production deployment** (main branch): URL fija (ej: `my-app.vercel.app`)

El código **detecta automáticamente** la URL correcta en cada caso. ✅

### ¿Necesito redesplegar si cambio una variable de entorno?

**NO**. Solo necesitas:
1. Ir a Settings → Environment Variables en Vercel
2. Editar la variable
3. Vercel redesplegará automáticamente

### ¿Qué pasa con los preview deployments?

Funcionan perfectamente sin configuración adicional. Cada preview usa su propia URL automáticamente.

---

## 🔍 Verificar que Todo Funciona

Después del deployment:

1. Ve a tu URL de Vercel (ej: `https://tu-app.vercel.app`)
2. Navega a `/signup` y crea una cuenta
3. Ve a `/login` e inicia sesión
4. Deberías poder acceder a `/dashboard`

Si funciona el signup/login, **¡todo está perfecto!** ✅

---

## 🐛 ¿Problemas?

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que incluye `?sslmode=require` al final
- Verifica que tu base de datos permita conexiones desde cualquier IP

### Error: "Unable to reach auth server" 
- Espera 1-2 minutos después del deployment
- Limpia la caché del navegador (Ctrl+Shift+R)
- Verifica que el deployment haya terminado completamente

### Los cambios no se reflejan
- Vercel redespliega automáticamente en cada push a main
- Para forzar un redespliegue: Settings → Deployments → Redeploy

---

## 📚 Más Información

Para detalles técnicos y configuración avanzada, consulta `DEPLOYMENT.md`.

---

## 🎉 ¡Eso es Todo!

Con solo configurar `DATABASE_URL` ya deberías tener tu app funcionando en Vercel. No necesitas preocuparte por URLs que cambian - el código lo maneja automáticamente. 🚀

