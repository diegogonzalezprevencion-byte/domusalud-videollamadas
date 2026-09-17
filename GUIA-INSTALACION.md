# DOMUS SALUD · V2 — DOS PERFILES (GUÍA CORTA)

**Esta aplicación contiene código, pero todavía NO ha creado cuentas dentro de tu Supabase.** Las credenciales no se guardan en GitHub. No subas nunca archivos `.env.local` ni contraseñas.

## Lo que se entrega

- Login con selector **Administrador / Usuario**, ambos muestran `dgonzalez` como nombre de usuario.
- **Administrador:** panel global de reuniones, calendario, minutas y directorio con roles. Puede consultar, editar minutas y eliminar cualquier reunión.
- **Usuario:** su agenda y reuniones creadas o a las que fue invitado. Solo puede modificar o eliminar sus propias reuniones.
- Ambos pueden crear reuniones e ingresar a LiveKit si cuentan con acceso.
- Grabación, transcripción por IA y envío de correo **NO están implementados**.

**Seguridad:** usar la **misma contraseña para ambas cuentas anula en la práctica la separación**: cualquiera que conozca la contraseña de usuario puede elegir Administrador. Se respeta tu esquema solicitado solo para pruebas privadas; **antes del uso real cambia al menos la contraseña del administrador por una distinta y fuerte**. No se ha incluido `dgonzalez123` en el código ni en SQL.

## Paso 1. Crear las dos cuentas reales en Supabase

Abre [Supabase](https://supabase.com/dashboard) → tu proyecto → **Authentication → Users** → **Add user**. Crea dos cuentas con **correos DIFERENTES que controles**. Si tu panel ofrece "Create new user", selecciona esa opción, especifica correo y contraseña y confirma la creación. Si solo te ofrece invitación, usa "Send invitation" y completa el alta mediante el enlace recibido. No habilites registro público solo para crearlas.

| Cuenta | Nombre que tendrá en la app | Correo usado en Supabase | Contraseña de prueba solicitada |
|---|---|---|---|
| Administrador | `dgonzalez` | Un correo propio para administrador | Defínela tú en Supabase |
| Usuario | `dgonzalez` | Otro correo propio distinto | Defínela tú en Supabase |

Supabase exige un correo único por identidad; por eso no basta con el mismo nombre. Puedes crear ambas con la contraseña de prueba solicitada, pero cambia la del administrador antes de uso real. Si usas invitaciones, fija la contraseña desde el enlace. **No introduzcas contraseñas en archivos de código.**

## Paso 2. Activar las tablas y roles

1. Si todavía no lo hiciste, abre `supabase/01_iniciar_base_de_datos.sql`, copia todo y ejecútalo en **Supabase → SQL Editor → New query → Run**. Si ya lo ejecutaste con éxito, **no es necesario repetirlo**.
2. Abre `supabase/02_perfiles_admin_usuario.sql` con Bloc de notas. Busca y reemplaza las apariciones de `CAMBIA_CORREO_ADMIN` y `CAMBIA_CORREO_USUARIO` en las dos asignaciones `admin_email :=` y `user_email :=` con los **dos correos reales** utilizados en el paso 1 (mantén las comillas simples). No cambies los textos que aparecen dentro de los mensajes de comprobación. Por ejemplo: `admin_email text := lower(trim('admin@domusalud.cl'));` (solo ilustrativo).
3. Copia todo el archivo modificado y ejecútalo en **SQL Editor → New query → Run**. Debe mostrar **Success**. Si indica que faltan cuentas, revisa los correos del paso 1.

## Paso 3. Configurar Vercel y actualizar GitHub

En el proyecto de Vercel → **Environment Variables**, conserva las cinco variables que ya tenías y agrega **dos nuevas**, ambas tipo **Secret**, ambiente **Production**:

| Key | Value | Note (Optional) |
|---|---|---|
| `DOMUS_ADMIN_EMAIL` | El correo EXACTO de la cuenta administradora creada en Supabase | Correo interno de inicio de sesión administrador |
| `DOMUS_USER_EMAIL` | El correo EXACTO de la cuenta usuario creada en Supabase | Correo interno de inicio de sesión usuario |

Estas dos variables se usan en el servidor para reconocer el nombre de usuario `dgonzalez` y convertirlo en dos identidades diferentes de Supabase. **No uses el mismo correo en ambas.**

En Windows extrae el ZIP. Abre tu repositorio en GitHub → **Add file → Upload files**; sube los archivos y carpetas del interior de `domusalud-videollamadas-v2`, no el ZIP ni la carpeta exterior. Los archivos `package.json`, `app`, `lib` y `supabase` deben verse en la raíz. Si ya subiste V1, reemplaza sus archivos con los de V2 y haz **Commit changes**. En Vercel conecta ese repositorio si no está conectado y despliega de nuevo tras guardar las variables. Mantén Framework Next.js y Root Directory `./`.

## Paso 4. Probar

En tu web publicada elige **Administrador**, escribe `dgonzalez` y la contraseña que asignaste a esa cuenta. Debes ver el módulo **Administración**. Sal y elige **Usuario**, escribe el mismo nombre `dgonzalez` y la contraseña de la otra cuenta. No debe aparecer Administración y solo verás tus reuniones/invitaciones. El rol real se valida en Supabase y se protege con reglas RLS; cambiar el selector visual no entrega privilegios.

Si la app indica "Falta configurar el acceso" revisa las dos nuevas variables y vuelve a desplegar. Si muestra "Usuario, perfil o contraseña incorrectos", comprueba que el rol, el correo de Vercel, el correo de Supabase, la contraseña y las dos asignaciones SQL coincidan. No me envíes contraseñas ni claves privadas.

**Nota:** No se ha probado contra tus cuentas reales ni publicado automáticamente. Esta versión tampoco debe guardar datos clínicos. Revisa las condiciones de uso comercial del alojamiento que elijas antes de operar Domus Salud.

**Alojamiento comercial:** si usas este sistema para operar Domus Salud, revisa las condiciones de tu plan de Vercel; el plan Hobby no está destinado al uso comercial.
