import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// El navegador nunca recibe las direcciones privadas usadas para resolver el usuario.
// Las contraseñas jamás se guardan en el repositorio ni se comparan con texto fijo.
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const deny = () => NextResponse.json({ error: 'Usuario, perfil o contraseña incorrectos.' }, { status: 401, headers });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return deny();
    const { username, role, password } = body as Record<string, unknown>;
    if (typeof username !== 'string' || typeof password !== 'string' ||
        (role !== 'admin' && role !== 'usuario') ||
        username.trim().toLowerCase() !== 'dgonzalez' ||
        password.length < 1 || password.length > 1024) return deny();

    const email = role === 'admin' ? process.env.DOMUS_ADMIN_EMAIL : process.env.DOMUS_USER_EMAIL;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!email || !url || !key) return NextResponse.json({ error: 'Falta configurar el acceso en Vercel. Consulta la guía de instalación.' }, { status: 503, headers });
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user || !data.session) return deny();
    const { data: profile, error: profileError } = await sb.from('profiles').select('role,username').eq('id', data.user.id).maybeSingle();
    if (profileError || !profile || profile.role !== role || profile.username !== 'dgonzalez') return deny();
    return NextResponse.json({ accessToken: data.session.access_token, refreshToken: data.session.refresh_token }, { headers });
  } catch {
    return deny();
  }
}
