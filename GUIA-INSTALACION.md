# GUÍA SIMPLE · DOMUS SALUD VIDEOLLAMADAS V3

**No hay que crear otras cuentas ni volver a ejecutar SQL.** Ya comprobaste que Supabase muestra las cinco cuentas (1 administrador + 4 usuarios). El archivo `supabase/BASE_ACTUAL_5_USUARIOS_SOLO_REFERENCIA.sql` se incluye solamente de referencia. No lo ejecutes otra vez.

## PASO 1 — Subir el código a GitHub

1. Descomprime `DOMUS_SALUD_V3.zip` en Windows.
2. Abre tu repositorio `domusalud-videollamadas` en GitHub. Si está vacío, pulsa **uploading an existing file**. Si ya tiene contenido, pulsa **Add file → Upload files**.
3. Arrastra **los archivos y carpetas que están dentro** de la carpeta descomprimida; `package.json` debe quedar en la raíz, junto a `app`, `lib` y `supabase`. Si GitHub pregunta por reemplazos, actualiza los archivos anteriores. El archivo `app/api/login/route.ts` se reemplaza por una versión que desactiva el acceso antiguo. No subas el ZIP como único archivo.
4. Pulsa **Commit changes**. Los dos scripts SQL antiguos también se reemplazan por archivos desactivados que NO modifican tu base de datos.

## PASO 2 — Conectar GitHub con Vercel

- Si el proyecto de Vercel ya existe: ábrelo → **Settings → Git** y conecta tu repositorio, si todavía no aparece conectado. Después ve a **Deployments** y publica un despliegue desde la rama `main` (o importa el repositorio como nuevo proyecto si tu panel no permite enlazar el existente).
- Si creas un nuevo proyecto al importar GitHub, configura en el proyecto nuevo las cinco variables que ya guardaste en el anterior, antes de desplegar. Mantén Framework **Next.js**, Root Directory `./` y Build Command por defecto.
- Confirma que en **Environment Variables** del proyecto que vas a publicar existen estas cinco claves: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. Las dos claves API de LiveKit deben ser **Secret**; sus valores no llevan el prefijo `NEXT_PUBLIC_`. No envíes las claves por chat.
- **Ya no se necesitan** `DOMUS_ADMIN_EMAIL` ni `DOMUS_USER_EMAIL`: si permanecen guardadas en Vercel, la V3 no las utiliza y puedes eliminarlas más adelante.
- Despliega o **Redeploy** para aplicar las variables. Si Vercel muestra un error, copia el texto del Build Log (sin claves).

## PASO 3 — Probar ambos accesos

1. Entra a la URL de Vercel e inicia sesión con `contacto@domusalud.cl` y la contraseña que configuraste en Supabase. Debe aparecer **Administrador** y el apartado **Administración**.
2. Cierra sesión. Ingresa con `dgonzalez@domusalud.cl`, `cmeza@domusalud.cl`, `rmunoz@domusalud.cl` o `ccontreras@domusalud.cl` y su contraseña personal. Debe aparecer **Usuario** y no el apartado Administración.
3. Prueba crear una reunión con participantes y entrar a su sala; la reunión solo es accesible al creador, invitados o administrador. Aún no se envían emails; comparte el enlace manualmente con las personas invitadas.

**Importante:** Nunca subas contraseñas ni archivos `.env.local` a GitHub. Las claves expuestas previamente deberían renovarse antes del uso real. El plan Vercel Hobby está destinado a uso personal no comercial; verifica el plan apto para la operación de tu empresa. La aplicación NO es una ficha clínica y no debe usarse para datos clínicos.
