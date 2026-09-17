'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { dateKey, formatDate, type Meeting, type Participant, type Profile } from '@/lib/types';

type Tab = 'inicio' | 'calendario' | 'reuniones' | 'socios' | 'minutas' | 'administracion';
const menu: { id: Tab; icon: string; label: string }[] = [
  { id: 'inicio', icon: '⌂', label: 'Inicio' },
  { id: 'calendario', icon: '▦', label: 'Calendario' },
  { id: 'reuniones', icon: '◉', label: 'Reuniones' },
  { id: 'socios', icon: '♧', label: 'Socios' },
  { id: 'minutas', icon: '▤', label: 'Minutas' },
  { id: 'administracion', icon: '⚙', label: 'Administración' },
];

function nameOf(profile: Profile | undefined, id: string) {
  return profile?.full_name || profile?.email || id.slice(0, 8);
}

function AuthPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setWorking(true);
    try {
      const { error: loginError } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) throw new Error('No se pudo ingresar. Revisa tu correo, contraseña y que tu cuenta esté confirmada.');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-logo"><span className="brand-mark">✚</span> DOMUS SALUD <span className="brand-tag">REUNIONES</span></div>
        <div className="auth-art-main"><span className="eyebrow light">TU ESPACIO DE TRABAJO</span>
          <h1>Conecta a tu equipo.<br /><em>Organiza cada decisión.</em></h1>
          <p>Un solo acceso: tu perfil de administrador o socio se reconoce automáticamente.</p>
          <div className="art-chips"><span>▦ Calendario</span><span>◉ Videollamadas</span><span>▤ Minutas</span></div>
        </div>
        <div className="auth-art-footer">Domus Salud · Plataforma privada de reuniones</div>
      </div>
      <div className="auth-right">
        <form className="auth-form" onSubmit={submit}>
          <span className="eyebrow">BIENVENIDO A DOMUS</span>
          <h2>Inicia sesión</h2>
          <p className="muted">Usa el correo que se registró para ti en Supabase. Los permisos se asignan automáticamente.</p>
          <label>Correo corporativo<input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="tuusuario@domusalud.cl" autoComplete="username" /></label>
          <label>Contraseña<input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password" /></label>
          {error && <div className="alert danger" role="alert">{error}</div>}
          <button disabled={working} type="submit" className="button button-primary full">{working ? 'Comprobando…' : 'Ingresar a mi espacio'} →</button>
          <p className="auth-disclaimer">Acceso exclusivo para las cinco cuentas autorizadas. Tu contraseña no se guarda en el código.</p>
        </form>
      </div>
    </main>
  );
}

function CalendarView({ meetings, onCreate, onSelect }: {
  meetings: Meeting[]; onCreate: (date: string) => void; onSelect: (meeting: Meeting) => void;
}) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [day, setDay] = useState(() => dateKey(new Date().toISOString()));
  const firstOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstOffset + daysInMonth) / 7) * 7 }, (_, idx) => {
    const dayNumber = idx - firstOffset + 1;
    return dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
  });
  const dated = meetings.filter(m => dateKey(m.starts_at) === day).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const monthLabel = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(month);
  const dateFor = (num: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(num).padStart(2, '0')}`;
  const dayLabel = new Date(`${day}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="calendar-grid">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar"><h3 className="capitalize">{monthLabel}</h3><div className="row gap-small">
          <button className="icon-button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
          <button className="button button-quiet small" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setDay(dateKey(d.toISOString())); }}>Hoy</button>
          <button className="icon-button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
        </div></div>
        <div className="calendar-days">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div className="weekday" key={d}>{d}</div>)}
          {cells.map((num, index) => num ? (
            <button className={`calendar-day ${dateFor(num) === day ? 'chosen' : ''} ${dateFor(num) === dateKey(new Date().toISOString()) ? 'today' : ''}`} key={index}
              onClick={() => setDay(dateFor(num))}>
              <span>{num}</span>
              {meetings.some(m => dateKey(m.starts_at) === dateFor(num)) && <i className="event-dot" />}
            </button>
          ) : <div className="calendar-empty" key={index} />)}
        </div>
      </section>
      <section className="panel calendar-aside"><div className="section-head"><div><span className="eyebrow">AGENDA DEL DÍA</span><h3 className="capitalize">{dayLabel}</h3></div></div>
        {dated.length ? dated.map(m => <button key={m.id} className="agenda-event" onClick={() => onSelect(m)}>
          <span className="agenda-time">{new Date(m.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span><span><strong>{m.title}</strong><small>Ver detalle →</small></span></button>) :
          <div className="empty-day"><div className="empty-illustration">☼</div><strong>Día disponible</strong><p>No hay reuniones programadas para esta fecha.</p></div>}
        <button className="button button-primary full" onClick={() => onCreate(day)}>+ Reunión para este día</button>
      </section>
    </div>
  );
}

function MeetingForm({ profiles, selfId, initialDate, onClose, onCreated }: {
  profiles: Profile[]; selfId: string; initialDate: string; onClose: () => void; onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const others = profiles.filter(p => p.id !== selfId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const starts = new Date(`${date}T${time}:00`);
      if (Number.isNaN(starts.getTime())) throw new Error('Revisa la fecha y la hora.');
      const ends = new Date(starts.getTime() + duration * 60_000);
      const sb = getSupabase();
      const { data: created, error: createError } = await sb.from('meetings').insert({
        title: title.trim(), description: description.trim() || null,
        starts_at: starts.toISOString(), ends_at: ends.toISOString(), created_by: selfId,
      }).select('id').single();
      if (createError || !created) throw new Error(createError?.message || 'No se pudo crear la reunión.');
      const ids = [...new Set([selfId, ...invitees])];
      const { error: invitationError } = await sb.from('meeting_participants').insert(ids.map(user_id => ({ meeting_id: created.id, user_id })));
      await onCreated();
      if (invitationError) {
        throw new Error('La reunión se creó, pero faltó agregar participantes. Abre la reunión y revisa el listado.');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la reunión.');
    } finally { setSaving(false); }
  }

  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-meeting-title">
      <div className="modal-head"><div><span className="eyebrow">PROGRAMACIÓN</span><h2 id="new-meeting-title">Nueva reunión</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar">×</button></div>
      <form className="meeting-form" onSubmit={submit}>
        <label>Título de la reunión<input required minLength={3} maxLength={140} autoFocus placeholder="Ej. Reunión semanal de socios" value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Descripción (opcional)<textarea maxLength={2000} rows={3} placeholder="Objetivos o temas a tratar…" value={description} onChange={e => setDescription(e.target.value)} /></label>
        <div className="form-split"><label>Fecha<input required type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Hora<input required type="time" value={time} onChange={e => setTime(e.target.value)} /></label></div>
        <label>Duración<select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[15, 30, 45, 60, 90, 120].map(minutes => <option key={minutes} value={minutes}>{minutes} minutos</option>)}</select></label>
        <div><span className="input-label">Participantes registrados</span><p className="helper">Tu cuenta queda incluida automáticamente. Selecciona a quienes asistirán.</p>
          <div className="invite-list">{others.length ? others.map(p => <label className="invite-item" key={p.id}>
            <input type="checkbox" checked={invitees.includes(p.id)} onChange={e => setInvitees(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))} />
            <span className="avatar small-avatar">{(p.full_name || p.email).charAt(0).toUpperCase()}</span><span><strong>{p.full_name || p.email}</strong><small>{p.email}</small></span>
          </label>) : <p className="helper">Aún no hay otros socios registrados. Puedes crear una reunión para ti y probarla.</p>}</div>
        </div>
        {error && <div className="alert danger">{error}</div>}
        <div className="modal-actions"><button className="button button-light" type="button" onClick={onClose}>Cancelar</button><button disabled={saving} type="submit" className="button button-primary">{saving ? 'Guardando…' : 'Crear reunión'}</button></div>
      </form>
    </section>
  </div>;
}

function MeetingDetail({ meeting, profiles, participants, selfId, isAdmin, onClose, onChanged }: {
  meeting: Meeting; profiles: Profile[]; participants: Participant[]; selfId: string; isAdmin: boolean;
  onClose: () => void; onChanged: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(meeting.notes || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isOwner = meeting.created_by === selfId || isAdmin;
  const attendees = participants.filter(p => p.meeting_id === meeting.id);
  const invitation = typeof window !== 'undefined' ? `${window.location.origin}/reunion/${meeting.id}` : '';

  async function saveNotes() {
    setSaving(true); setMessage('');
    const { error } = await getSupabase().from('meetings').update({ notes }).eq('id', meeting.id);
    if (error) setMessage(error.message);
    else { await onChanged(); setMessage('Minuta guardada correctamente.'); }
    setSaving(false);
  }
  async function cancelMeeting() {
    if (!window.confirm('¿Eliminar esta reunión definitivamente?')) return;
    const { error } = await getSupabase().from('meetings').delete().eq('id', meeting.id);
    if (error) setMessage(error.message);
    else { await onChanged(); onClose(); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(invitation); setMessage('Enlace copiado. Solo podrán entrar el creador y los socios seleccionados.'); }
    catch { setMessage(`Copia el enlace desde aquí: ${invitation}`); }
  }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="meeting-detail-title">
      <div className="modal-head"><div><span className="eyebrow">DETALLE DE REUNIÓN</span><h2 id="meeting-detail-title">{meeting.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar">×</button></div>
      <div className="detail-body">
        <div className="detail-datetime"><span>▦</span><div><strong>{formatDate(meeting.starts_at)}</strong><p>Finaliza: {formatDate(meeting.ends_at)}</p></div></div>
        {meeting.description && <p className="meeting-description">{meeting.description}</p>}
        <h3>Participantes ({attendees.length})</h3><div className="attendee-list">{attendees.map(attendee => {
          const p = profiles.find(item => item.id === attendee.user_id);
          return <div key={attendee.user_id} className="attendee"><span className="avatar small-avatar">{nameOf(p, attendee.user_id).charAt(0).toUpperCase()}</span><span>{nameOf(p, attendee.user_id)}{attendee.user_id === meeting.created_by && <small> · Organiza</small>}</span></div>;
        })}</div>
        <div className="meeting-actions"><Link href={`/reunion/${meeting.id}`} className="button button-primary" onClick={onClose}>◉ Entrar a videollamada</Link><button onClick={copyLink} className="button button-light">↗ Copiar enlace</button></div>
        <div className="notes-section"><h3>Minuta de la reunión</h3><p className="helper">En esta versión, el organizador escribe los acuerdos manualmente. La IA y la grabación se agregarán después.</p>
          <textarea rows={7} maxLength={20000} disabled={!isOwner} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Escribe aquí los temas tratados, acuerdos, responsables y pendientes…" />
          {isOwner && <div className="notes-controls"><button disabled={saving} onClick={saveNotes} className="button button-primary">{saving ? 'Guardando…' : 'Guardar minuta'}</button><button onClick={cancelMeeting} className="button button-danger">Eliminar reunión</button></div>}
          {!isOwner && <p className="helper">Solo el organizador o un administrador pueden editar la minuta.</p>}
          {message && <div className="alert success">{message}</div>}
        </div>
      </div>
    </section>
  </div>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tab, setTab] = useState<Tab>('inicio');
  const [formDate, setFormDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    void sb.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setChecking(false); });
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null); setChecking(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    setLoadingData(true); setLoadError('');
    const sb = getSupabase();
    const [p, m, a] = await Promise.all([
      sb.from('profiles').select('id,email,full_name,username,role,created_at').order('full_name'),
      sb.from('meetings').select('*').order('starts_at'),
      sb.from('meeting_participants').select('meeting_id,user_id'),
    ]);
    if (p.error || m.error || a.error) {
      setLoadError(p.error?.message || m.error?.message || a.error?.message || 'No fue posible cargar la información.');
    } else {
      setProfiles((p.data || []) as Profile[]);
      setMeetings((m.data || []) as Meeting[]);
      setParticipants((a.data || []) as Participant[]);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (user) void refresh();
    else { setProfiles([]); setMeetings([]); setParticipants([]); }
  }, [user?.id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = Date.now();
  const upcoming = useMemo(() => meetings.filter(m => new Date(m.ends_at).getTime() >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at)), [meetings, now]);
  const completed = meetings.filter(m => new Date(m.ends_at).getTime() < now).length;
  const noted = meetings.filter(m => Boolean(m.notes?.trim()));
  const ownProfile = profiles.find(p => p.id === user?.id);
  const isAdmin = ownProfile?.role === 'admin';
  const displayName = ownProfile?.full_name || String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario');
  const selectMeeting = selected && meetings.find(m => m.id === selected.id);
  const newMeeting = (date?: string) => setFormDate(date || dateKey(new Date().toISOString()));

  if (checking) return <div className="loading-screen">✚ &nbsp; Cargando Domus Salud…</div>;
  if (!user) return <AuthPanel />;
  if (loadingData && !ownProfile) return <div className="loading-screen">✚ &nbsp; Cargando tu perfil…</div>;
  if (!ownProfile) return <div className="center-auth-error"><div className="alert danger">{loadError || 'Tu cuenta aún no tiene un perfil habilitado. Comprueba los archivos SQL de Supabase.'}</div><button className="button button-primary" onClick={() => void getSupabase().auth.signOut()}>Salir</button></div>;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><span className="brand-mark">✚</span><div><strong>DOMUS SALUD</strong><small>ESPACIO DE REUNIONES</small></div></div>
        <div className="sidebar-group-label">MENÚ PRINCIPAL</div>
        <nav aria-label="Menú principal" className="sidebar-menu">{menu.filter(item => isAdmin || item.id !== 'administracion').map(item => <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`}
          onClick={() => { setTab(item.id); setMobileNav(false); }}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="sidebar-bottom"><span className="connection-dot" /> {isAdmin ? 'Perfil administrador' : 'Perfil usuario'} <small>Domus Salud · V3</small></div>
      </aside>
      <div className="main-column">
        <header className="topbar"><div className="row"><button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMobileNav(!mobileNav)}>☰</button><span className="topbar-location">Domus Salud <span>/</span> {menu.find(item => item.id === tab)?.label}</span></div>
          <div className="topbar-actions"><span className="profile-badge">{isAdmin ? 'Administrador' : 'Usuario'}</span><span className="topbar-email">{ownProfile.username} · {user.email}</span><span className="avatar">{displayName.charAt(0).toUpperCase()}</span><button className="logout-button" onClick={() => void getSupabase().auth.signOut()}>Salir</button></div></header>
        <main className="content">
          {loadError && <div className="alert danger">{loadError} <button className="button button-light small" onClick={() => void refresh()}>Reintentar</button> Revisa que hayas ejecutado el archivo SQL en Supabase.</div>}
          {loadingData && <div className="loading-inline">Actualizando información…</div>}

          {tab === 'inicio' && <>
            <div className="hero"><div><span className="eyebrow light">{isAdmin ? 'PANEL ADMINISTRADOR' : 'PANEL USUARIO'}</span><h1>Hola, {displayName.split(' ')[0]} <span>✳</span></h1><p>{isAdmin ? 'Supervisa todas las reuniones, usuarios y minutas de Domus Salud.' : 'Consulta tus reuniones, organiza tu agenda y revisa tus acuerdos.'}</p><button onClick={() => newMeeting()} className="button button-white">+ Crear nueva reunión</button></div><div className="hero-deco"><div className="deco-orbit">✚</div></div></div>
            <div className="stat-grid"><div className="stat-card"><span className="stat-icon mint">▦</span><span className="stat-label">{isAdmin ? 'Próximas reuniones globales' : 'Mis próximas reuniones'}</span><strong>{upcoming.length}</strong><small>{isAdmin ? "Todas las reuniones" : "En tu agenda"}</small></div>
              <div className="stat-card"><span className="stat-icon lilac">◉</span><span className="stat-label">Reuniones pasadas</span><strong>{completed}</strong><small>Registradas</small></div>
              <div className="stat-card"><span className="stat-icon sky">♧</span><span className="stat-label">{isAdmin ? 'Cuentas registradas' : 'Socios registrados'}</span><strong>{profiles.length}</strong><small>Directorio privado</small></div>
              <div className="stat-card"><span className="stat-icon peach">▤</span><span className="stat-label">Minutas guardadas</span><strong>{noted.length}</strong><small>Documentadas manualmente</small></div></div>
            <section className="panel dashboard-meetings"><div className="section-head"><div><span className="eyebrow">{isAdmin ? "AGENDA GENERAL" : "TU AGENDA"}</span><h2>Próximas reuniones</h2></div><button className="text-button" onClick={() => setTab('reuniones')}>Ver todas →</button></div>
              {upcoming.length ? upcoming.slice(0, 4).map(m => <MeetingRow key={m.id} meeting={m} people={participants.filter(p => p.meeting_id === m.id).length} onClick={() => setSelected(m)} />) : <Empty text="Aún no tienes reuniones programadas." onCreate={() => newMeeting()} />}</section>
          </>}

          {tab === 'calendario' && <><PageHeading overline="ORGANIZACIÓN" title="Calendario" desc="Selecciona un día para consultar o programar reuniones." onCreate={() => newMeeting()} />
            <CalendarView meetings={meetings} onCreate={newMeeting} onSelect={setSelected} /></>}

          {tab === 'reuniones' && <><PageHeading overline="ENCUENTROS" title={isAdmin ? "Todas las reuniones" : "Mis reuniones"} desc={isAdmin ? "Consulta todas las reuniones y administra sus minutas." : "Consulta tus reuniones, participantes y enlaces privados."} onCreate={() => newMeeting()} />
            <section className="panel list-panel">{meetings.length ? [...meetings].sort((a, b) => b.starts_at.localeCompare(a.starts_at)).map(m => <MeetingRow key={m.id} meeting={m} people={participants.filter(p => p.meeting_id === m.id).length} onClick={() => setSelected(m)} />) : <Empty text="Todavía no hay reuniones." onCreate={() => newMeeting()} />}</section></>}

          {tab === 'socios' && <><PageHeading overline="PERSONAS" title="Socios y participantes" desc="Directorio de las cinco cuentas autorizadas para participar." />
            <section className="panel directory"><div className="directory-top"><strong>Directorio del equipo</strong><span className="badge">{profiles.length} personas</span></div>
              {profiles.map(p => <div className="directory-person" key={p.id}><span className="avatar person-avatar">{(p.full_name || p.email).charAt(0).toUpperCase()}</span><div><strong>{p.full_name || p.email}</strong><small>{p.username} · {p.email} · {p.role === 'admin' ? 'Administrador' : 'Usuario'}</small></div>{p.id === user.id && <span className="badge">Tú</span>}</div>)}
              <p className="directory-help">Los cinco perfiles se administran en Supabase. Los enlaces de reunión solo funcionan para el organizador, los invitados y el administrador. El envío automático de correos está pendiente.</p>
            </section></>}

          {tab === 'administracion' && isAdmin && <><PageHeading overline="GESTIÓN GLOBAL" title="Administración" desc="Vista exclusiva para cuentas autorizadas con rol administrador." />
            <div className="admin-summary"><section className="panel admin-summary-card"><span className="eyebrow">EQUIPO</span><h2>{profiles.length} cuentas</h2><p>{profiles.filter(p => p.role === 'admin').length} administradores · {profiles.filter(p => p.role === 'usuario').length} usuarios</p></section><section className="panel admin-summary-card"><span className="eyebrow">ACTIVIDAD GLOBAL</span><h2>{meetings.length} reuniones</h2><p>{noted.length} minutas guardadas</p></section></div>
            <section className="panel directory"><div className="directory-top"><strong>Cuentas y permisos</strong><span className="badge">Acceso solo administrador</span></div>{profiles.map(p => <div key={p.id} className="directory-person"><span className="avatar person-avatar">{p.full_name.charAt(0).toUpperCase()}</span><div><strong>{p.full_name || p.username}</strong><small>{p.username} · {p.email}</small></div><span className="badge">{p.role === 'admin' ? 'Administrador' : 'Usuario'}</span></div>)}<p className="directory-help">Para cambiar contraseñas, usa Supabase → Authentication → Users. Los roles se protegen en Supabase; este panel permite consultar, pero no cambiar permisos desde el navegador.</p></section></>}

          {tab === 'minutas' && <><PageHeading overline="DOCUMENTACIÓN" title="Minutas" desc={isAdmin ? "Minutas de todas las reuniones." : "Minutas de las reuniones en las que participas."} />
            <section className="panel list-panel">{noted.length ? noted.map(m => <button className="minutes-item" key={m.id} onClick={() => setSelected(m)}><span className="stat-icon sky">▤</span><span><strong>{m.title}</strong><small>{formatDate(m.starts_at)}</small><p>{m.notes?.slice(0, 180)}{(m.notes?.length || 0) > 180 ? '…' : ''}</p></span><b>↗</b></button>) : <div className="empty-list"><span>▤</span><strong>Sin minutas todavía</strong><p>El organizador o el administrador pueden redactar una minuta desde el detalle de cada reunión.</p></div>}</section></>}
        </main>
      </div>
      {formDate && <MeetingForm profiles={profiles} selfId={user.id} initialDate={formDate} onClose={() => setFormDate(null)} onCreated={refresh} />}
      {selectMeeting && <MeetingDetail key={`${selectMeeting.id}:${selectMeeting.notes || ''}`} meeting={selectMeeting} profiles={profiles} participants={participants} selfId={user.id} isAdmin={isAdmin} onClose={() => setSelected(null)} onChanged={refresh} />}
    </div>
  );
}

function PageHeading({ overline, title, desc, onCreate }: { overline: string; title: string; desc: string; onCreate?: () => void }) {
  return <div className="page-heading"><div><span className="eyebrow">{overline}</span><h1>{title}</h1><p>{desc}</p></div>{onCreate && <button className="button button-primary" onClick={onCreate}>+ Nueva reunión</button>}</div>;
}

function MeetingRow({ meeting, people, onClick }: { meeting: Meeting; people: number; onClick: () => void }) {
  const date = new Date(meeting.starts_at);
  return <button className="meeting-row" onClick={onClick}><div className="date-tile"><strong>{date.getDate()}</strong><small>{date.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')}</small></div>
    <div className="meeting-row-main"><strong>{meeting.title}</strong><span>{date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · {people} participante{people === 1 ? '' : 's'}</span></div>
    <span className={`status-pill ${new Date(meeting.ends_at).getTime() < Date.now() ? 'past' : 'future'}`}>{new Date(meeting.ends_at).getTime() < Date.now() ? 'Realizada / pasada' : 'Programada'}</span><span className="arrow">›</span>
  </button>;
}

function Empty({ text, onCreate }: { text: string; onCreate: () => void }) {
  return <div className="empty-list"><span>▦</span><strong>{text}</strong><p>Crea la primera y comienza a organizar tu equipo.</p><button className="button button-primary" onClick={onCreate}>+ Crear reunión</button></div>;
}
