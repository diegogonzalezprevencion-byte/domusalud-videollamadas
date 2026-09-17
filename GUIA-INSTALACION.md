# DOMUS SALUD — INSTALACIÓN V1 (SIN PROGRAMAR)

Este ZIP tiene **el código de la aplicación**, no es un ZIP para cargar directamente en Vercel ni un archivo que GitHub pueda ejecutar comprimido.

## Antes de comenzar

- Ya tienes un repositorio en GitHub, un proyecto en Supabase, otro en LiveKit y uno en Vercel.
- Ya guardaste **5 variables de entorno** en tu proyecto Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`.
- Si la API Secret apareció en una captura, debes sustituirla por una nueva antes de comenzar a utilizar la aplicación con socios.
- **Atención al plan:** Vercel Hobby es solo para uso personal/no comercial. Para utilizar esta app en las operaciones de Domus Salud necesitas un plan que permita uso comercial (por ejemplo, Vercel Pro) u otro alojamiento con condiciones apropiadas. Puedes seguir preparando el código y la base de datos mientras decides dónde alojarla.
- Esta V1 no debe utilizarse para fichas clínicas ni información de pacientes: está diseñada exclusivamente para coordinación interna del equipo.

## PASO 1. Activar la base de datos (Supabase)

1. Abre tu proyecto Supabase, entra en **SQL Editor** y pulsa **New query**.
2. En este ZIP, abre el archivo `supabase/01_iniciar_base_de_datos.sql` con el Bloc de notas. Copia **todo** su contenido y pégalo en SQL Editor.
3. Pulsa **Run**. Debe aparecer `Success`. Esto crea las tablas y los permisos privados. No vuelvas a ejecutar un SQL distinto ni desactives RLS.

## PASO 2. Subir el código a GitHub

1. En Windows, haz clic derecho en el ZIP y selecciona **Extraer todo**. Abre la carpeta extraída `domusalud-videollamadas`.
2. En GitHub, abre el repositorio que creaste y elige **Add file → Upload files**.
3. Arrastra **el contenido de la carpeta extraída** (archivos `package.json`, `next.config.ts`, `tsconfig.json`, las carpetas `app`, `lib`, `supabase`, etc.) a la zona de carga. **No arrastres el ZIP sin extraer ni la carpeta exterior completa**, porque `package.json` debe quedar en la raíz del repositorio.
4. Abajo, elige **Commit changes** para guardar los archivos. Si GitHub indica conflicto con README.md, puedes conservar el README que GitHub creó y subir el resto: la guía se llama `GUIA-INSTALACION.md`.
5. Comprueba que en la página principal del repositorio aparecen `package.json` y la carpeta `app` al mismo nivel.

## PASO 3. Conectar el repositorio a Vercel

1. En Vercel, abre el proyecto que ya creaste y ve a **Settings → Git**. Conecta tu repositorio `domusalud-videollamadas` en **Connected Git Repository** (si ya está conectado, no lo repitas).
2. Si la conexión no está disponible en ese proyecto, vuelve al Dashboard, pulsa **Add New → Project**, importa el repositorio y vuelve a ingresar las cinco variables en ese nuevo proyecto. **No borres el proyecto anterior hasta comprobar el nuevo**.
3. En Vercel, deja `Framework Preset: Next.js` y `Root Directory: ./` (raíz). Pulsa **Deploy** si estás importando el proyecto; si se conectó al existente, el primer commit puede iniciar el despliegue automáticamente.
4. En **Deployments**, espera a que diga **Ready**. Abre el enlace de la aplicación.

## PASO 4. Primer acceso

1. En la página publicada, pulsa **Crear una cuenta** y registra al primer socio.
2. Si Supabase exige confirmación, abre tu correo y confirma antes de ingresar.
3. Haz que los demás socios creen sus cuentas. Después, desde el calendario, podrás seleccionarlos al programar reuniones.
4. **Antes de usarlo con datos internos**, ve a Supabase → Authentication → Providers → Email y desactiva el registro público (`Allow new users to sign up`/`Signups`) cuando todos tus socios estén creados. Como alternativa, configura invitaciones administradas en una versión posterior.

## Qué FUNCIONA en esta primera versión

- Inicio de sesión y registro con Supabase.
- Directorio privado de cuentas registradas.
- Calendario mensual, creación de reuniones y selección de socios ya registrados.
- Reuniones con video y audio LiveKit, con enlaces protegidos: solo organizador e invitados registrados obtienen token de acceso.
- Minutas escritas por el organizador y lectura por participantes.
- Acceso responsive desde celular y computador.

## Qué NO está incluido aún

- Envío automático de invitaciones por correo, sincronización real con Google/Outlook.
- Grabación automática, transcripción, informes con IA, asistencia real o acuerdos automáticos.
- Administración avanzada de roles, usuarios y recuperación personalizada de contraseña.

La aplicación **no debe mostrar ni prometer esas funciones** hasta implementar una segunda etapa. La V1 tampoco incluye garantía de reuniones ilimitadas: LiveKit tiene cuotas de uso.

## Problemas frecuentes

- `relation public.meetings does not exist`: ejecuta completo el SQL del paso 1 en el proyecto Supabase correcto.
- `Faltan las variables públicas de Supabase`: verifica los nombres exactos de las variables de Vercel y vuelve a desplegar.
- `Reunión no encontrada o acceso denegado`: el usuario debe haber sido seleccionado como invitado o ser quien creó la reunión.
- Error de LiveKit: revisa que LIVEKIT_URL sea `wss://...` y que la API Key y Secret correspondan al **mismo par** de LiveKit, almacenadas como `Secret` en Vercel. Vuelve a desplegar tras cambiarlas.
- Fallo de compilación: en Vercel, confirma Next.js, directorio raíz correcto y Node.js 22; abre los Build Logs para ver el primer error concreto.
- Registro sin correo de confirmación: revisa Supabase → Authentication y la carpeta Spam del correo.

**Seguridad:** No subas `.env`, `.env.local`, contraseñas ni capturas con API Secret al repositorio. Solo deben estar en el administrador de variables de Vercel.
