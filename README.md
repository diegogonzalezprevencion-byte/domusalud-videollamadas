# Domus Salud Videollamadas · V3

Aplicación Next.js para cinco cuentas ya creadas en Supabase: una administradora y cuatro de usuario.

- Inicio con **correo y contraseña** mediante Supabase Auth, sin contraseñas embebidas.
- El rol se consulta en `public.profiles`: `admin` ve el calendario general, todas las reuniones y Administración; `usuario` solo sus reuniones creadas o asignadas. Los permisos reales están en las políticas RLS, no solo en la interfaz.
- Calendario, creación de reuniones, invitaciones a personas registradas, minutas manuales y videollamadas privadas LiveKit con token generado en el servidor.
- Todavía no hay grabación, transcripción IA ni envío automático de correos. Las cuentas no se crean desde la web.

Lee `GUIA-INSTALACION.md` para publicar sin programar. No vuelvas a ejecutar SQL si ya ves los cinco perfiles en Supabase.
