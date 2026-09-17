# Domusalud Videollamadas · V2

Next.js + Supabase Auth y PostgreSQL RLS + LiveKit. Dos identidades separadas con el mismo nombre de usuario visible `dgonzalez` y selector de perfil (administrador/usuario). Las cuentas reales se crean manualmente en Supabase; ninguna contraseña está incorporada en el código.

**Instalación:** lee [`GUIA-INSTALACION.md`](GUIA-INSTALACION.md) e instala los SQL en orden: `01_iniciar_base_de_datos.sql`, `02_perfiles_admin_usuario.sql`.

**Incluye:** inicio de sesión por perfil, agenda, calendario, reuniones, vista de administración, minutas y sala LiveKit. **Pendiente:** grabación, transcripción, resumen por IA y correo automático. Requiere siete variables de entorno en Vercel.

Para desarrollo local opcional: `npm install`, crear `.env.local` desde `.env.example` con valores propios sin subirlo y ejecutar `npm run dev`.
