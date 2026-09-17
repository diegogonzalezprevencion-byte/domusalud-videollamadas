export type Profile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: 'admin' | 'usuario';
  created_at: string;
};

export type Meeting = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  created_by: string;
  notes: string | null;
  created_at: string;
};

export type Participant = {
  meeting_id: string;
  user_id: string;
};

export function formatDate(iso: string, withTime = true) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(iso));
}

export function dateKey(iso: string) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
