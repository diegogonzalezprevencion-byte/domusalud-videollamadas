import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AccessToken } from 'livekit-server-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const responseHeaders = { 'Cache-Control': 'no-store' };
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401, headers: responseHeaders });
    }
    const body: unknown = await request.json();
    const meetingId = body && typeof body === 'object' && 'meetingId' in body
      ? (body as { meetingId: unknown }).meetingId
      : null;
    if (typeof meetingId !== 'string' || !uuidFormat.test(meetingId)) {
      return NextResponse.json({ error: 'Identificador de reunión inválido.' }, { status: 400, headers: responseHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!supabaseUrl || !publishableKey || !livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Faltan credenciales de configuración en el servidor.' }, { status: 503, headers: responseHeaders });
    }

    // La identidad se valida contra Supabase: NO se confía en correos ni IDs enviados por el navegador.
    const supabase = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) {
      return NextResponse.json({ error: 'Tu sesión ha vencido. Vuelve a ingresar.' }, { status: 401, headers: responseHeaders });
    }

    // Esta consulta está protegida por RLS; sin ser creador/invitado, no devuelve la reunión.
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings').select('id').eq('id', meetingId).maybeSingle();
    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Reunión no encontrada o acceso denegado.' }, { status: 403, headers: responseHeaders });
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: auth.user.id,
      name: String(auth.user.user_metadata?.full_name || auth.user.email || 'Participante').slice(0, 80),
      ttl: '2h',
    });
    accessToken.addGrant({ roomJoin: true, room: `domus-${meeting.id}`, canPublish: true, canSubscribe: true });
    const jwt = await accessToken.toJwt();
    return NextResponse.json({ token: jwt, serverUrl: livekitUrl }, { headers: responseHeaders });
  } catch (error) {
    console.error('Error al preparar la videollamada', error);
    return NextResponse.json({ error: 'No fue posible conectar con LiveKit.' }, { status: 500, headers: responseHeaders });
  }
}
