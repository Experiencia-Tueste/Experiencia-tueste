import { NextResponse } from 'next/server';
import { communityConsentInputSchema } from '@/features/community';
import {
  getCommunityConsent,
  saveCommunityConsent,
  withdrawCommunityConsent,
} from '@/features/community/consent-service';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function authenticatedUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  const state = await getCommunityConsent(user.id);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  const parsed = communityConsentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Revisa tus preferencias y el consentimiento.' },
      { status: 400 },
    );
  }
  try {
    const state = await saveCommunityConsent(user, parsed.data);
    return NextResponse.json({ state });
  } catch {
    return NextResponse.json(
      { message: 'No pudimos actualizar tu consentimiento.' },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json({ message: 'Inicia sesión para continuar.' }, { status: 401 });
  try {
    const state = await withdrawCommunityConsent(user.id);
    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ message: 'No pudimos retirar tu consentimiento.' }, { status: 503 });
  }
}
