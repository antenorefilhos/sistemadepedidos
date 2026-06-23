import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');

  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';

  if (password === adminPass) {
    return NextResponse.json({ role: 'admin' });
  }
  if (password === managerPass) {
    return NextResponse.json({ role: 'manager' });
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
