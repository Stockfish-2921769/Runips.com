import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getSafeAccountNextPath } from '@/features/account/model';

export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

export async function startGoogleAuthentication(
  user: User | null,
  requestedNextPath: string | null,
): Promise<void> {
  const nextPath = getSafeAccountNextPath(requestedNextPath);
  const callback = new URL('/account/', window.location.origin);
  callback.searchParams.set('next', nextPath);
  const options = { redirectTo: callback.toString() };

  const result = user?.is_anonymous
    ? await supabase.auth.linkIdentity({ provider: 'google', options })
    : await supabase.auth.signInWithOAuth({ provider: 'google', options });

  if (result.error) throw result.error;
}

