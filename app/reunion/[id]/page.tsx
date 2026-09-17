'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { getSupabase } from '@/lib/supabase';
import type { Meeting } from '@/lib/types';
import { formatDate } from '@/lib/types';

type Connection = { token: string; serverUrl: string };

export default function MeetingRoom() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function connect() {
      try {
        const sb = getSupabase();
        const { data: sessionData } = await sb.auth.getSession();
        if (!sessionData.session) {
          router.replace('/');
          return;
        }
        const { data: details, error: detailsError } = await sb
          .from('meetings').select('*').eq('id', params.id).maybeSingle();
        if (detailsError || !details) throw new Error('No tienes acceso a esta reunión o no existe.');
        const response = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ meetingId: params.id }),
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo conectar.');
        if (active) {
          setMeeting(details as Meeting);
          setConnection(result as Connection);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error de conexión.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void connect();
    return () => { active = false; };
  }, [params.id, router]);

  return (
    <main className="room-page">
      <header className="room-header">
        <div><span className="brand-mark">✚</span><strong> DOMUS SALUD</strong><span className="room-subtitle"> / Sala privada</span></div>
        <Link href="/" className="button button-light">← Volver al calendario</Link>
      </header>
      <section className="room-info">
        <div><span className="eyebrow">VIDEOLLAMADA</span><h1>{meeting?.title || 'Preparando sala…'}</h1>
          {meeting && <p>{formatDate(meeting.starts_at)} · Solo participantes autorizados</p>}</div>
      </section>
      {loading && <div className="center-panel">Conectando de forma segura con LiveKit…</div>}
      {error && <div className="center-panel"><p className="error">{error}</p><Link href="/" className="button button-primary">Volver al inicio</Link></div>}
      {connection && !error && (
        <div className="video-frame" data-lk-theme="default">
          <LiveKitRoom
            token={connection.token}
            serverUrl={connection.serverUrl}
            connect={true}
            audio={false}
            video={false}
            onDisconnected={(reason) => setError(`LiveKit desconectó la reunión. Motivo: ${String(reason ?? 'desconocido')}`)}
            onError={(err) => setError(err.message || 'Error de LiveKit')}
            style={{ height: '100%' }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      )}
      <p className="room-footnote">Esta versión no graba ni transcribe automáticamente. Solo ingresa a reuniones donde tengas autorización de los demás participantes.</p>
    </main>
  );
}
