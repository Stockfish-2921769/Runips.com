import { supabase } from '@/lib/supabase';

const ACCOUNT_DELETION_CONFIRMATION = 'DELETE MY ACCOUNT';

export async function deleteCurrentAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account', {
    p_confirmation: ACCOUNT_DELETION_CONFIRMATION,
  });

  if (error) throw error;

  // The database transaction has already deleted the server-side session.
  // Local scope clears the cached browser session without depending on that
  // now-deleted server session remaining available.
  await supabase.auth.signOut({ scope: 'local' });
}

export { ACCOUNT_DELETION_CONFIRMATION };
