import { supabase } from '@/lib/supabase';
import {
  AccountAvatarColour,
  AccountProfile,
  AccountProfileDraft,
  AccountProfileSnapshot,
  PublicAccountProfile,
  isAccountAvatarColour,
  normaliseAccountUsername,
} from './model';

const ACCOUNT_DELETION_CONFIRMATION = 'DELETE MY ACCOUNT';
const MISSING_PROFILE_RESOURCE_CODES = new Set(['42P01', '42883', 'PGRST200', 'PGRST202', 'PGRST205']);

type UnknownRow = Record<string, unknown>;
type RepositoryError = { code?: string; message?: string } | null;

function asRow(value: unknown): UnknownRow {
  if (Array.isArray(value)) return asRow(value[0]);
  return value !== null && typeof value === 'object' ? value as UnknownRow : {};
}

function textValue(row: UnknownRow, key: string, fallback = ''): string {
  return typeof row[key] === 'string' ? row[key] : fallback;
}

function booleanValue(row: UnknownRow, key: string): boolean {
  return row[key] === true;
}

function numberValue(row: UnknownRow, key: string): number {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : 0;
}

function stringArrayValue(row: UnknownRow, key: string): string[] {
  return Array.isArray(row[key])
    ? row[key].filter((value): value is string => typeof value === 'string')
    : [];
}

function avatarColourValue(row: UnknownRow): AccountAvatarColour {
  const value = textValue(row, 'avatar_colour');
  return isAccountAvatarColour(value) ? value : 'violet';
}

function mapAccountProfile(value: unknown): AccountProfile | null {
  const row = asRow(value);
  const username = textValue(row, 'username');
  if (!username) return null;
  const wasedaVerified = booleanValue(row, 'waseda_verified');

  return {
    username,
    displayName: textValue(row, 'display_name', 'Community member'),
    avatarColour: avatarColourValue(row),
    badges: wasedaVerified ? ['waseda-verified'] : [],
    wasedaVerified,
    profileCompleted: booleanValue(row, 'profile_completed'),
    isPermanent: booleanValue(row, 'is_permanent'),
    hasGoogleIdentity: booleanValue(row, 'has_google_identity'),
    createdAt: textValue(row, 'created_at'),
  };
}

function isMissingProfileResource(error: RepositoryError): boolean {
  return !!error?.code && MISSING_PROFILE_RESOURCE_CODES.has(error.code);
}

export async function getMyAccountProfile(): Promise<AccountProfileSnapshot> {
  const { data, error } = await supabase.rpc('get_my_account_profile');
  if (error) {
    if (isMissingProfileResource(error)) return { profile: null, available: false };
    throw error;
  }
  return { profile: mapAccountProfile(data), available: true };
}

export async function updateMyAccountProfile(
  draft: AccountProfileDraft,
): Promise<AccountProfile> {
  const { data, error } = await supabase.rpc('update_my_account_profile', {
    p_display_name: draft.displayName.normalize('NFKC').trim(),
    p_avatar_colour: draft.avatarColour,
  });
  if (error) throw error;
  const profile = mapAccountProfile(data);
  if (!profile) throw new Error('The updated account profile was not returned');
  return profile;
}

export async function getPublicAccountProfile(
  username: string,
): Promise<{ profile: PublicAccountProfile | null; available: boolean }> {
  const { data, error } = await supabase
    .from('account_profiles_public')
    .select('*')
    .eq('username', normaliseAccountUsername(username))
    .maybeSingle();

  if (error) {
    if (isMissingProfileResource(error)) return { profile: null, available: false };
    throw error;
  }
  if (!data) return { profile: null, available: true };

  const row = asRow(data);
  return {
    available: true,
    profile: {
      username: textValue(row, 'username'),
      displayName: textValue(row, 'display_name', 'Community member'),
      avatarColour: avatarColourValue(row),
      badges: stringArrayValue(row, 'badges'),
      joinedAt: textValue(row, 'joined_at'),
      topicCount: numberValue(row, 'topic_count'),
      replyCount: numberValue(row, 'reply_count'),
    },
  };
}

export function isUsernameConflict(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  return candidate?.code === '23505' || candidate?.message === 'This username is already in use';
}

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
