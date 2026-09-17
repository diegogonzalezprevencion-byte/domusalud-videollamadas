import { NextResponse } from 'next/server';

// Endpoint de V2 desactivado deliberadamente. V3 inicia sesión mediante Supabase Auth.
export async function POST() {
  return NextResponse.json(
    { error: 'Inicio anterior deshabilitado. Utiliza el formulario de acceso por correo.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
