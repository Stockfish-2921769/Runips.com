export const ACCOUNT_AVATAR_COLOURS = [
  'violet',
  'cyan',
  'blue',
  'emerald',
  'amber',
  'rose',
  'slate',
  'indigo',
] as const;

export type AccountAvatarColour = (typeof ACCOUNT_AVATAR_COLOURS)[number];

export interface AccountProfile {
  username: string;
  displayName: string;
  avatarColour: AccountAvatarColour;
  badges: string[];
  wasedaVerified: boolean;
  profileCompleted: boolean;
  isPermanent: boolean;
  hasGoogleIdentity: boolean;
  createdAt: string;
}

export interface PublicAccountProfile {
  username: string;
  displayName: string;
  avatarColour: AccountAvatarColour;
  badges: string[];
  joinedAt: string;
  topicCount: number;
  replyCount: number;
}

// The username is issued by the database and never submitted by the person,
// so it is not part of what a save sends.
export interface AccountProfileDraft {
  displayName: string;
  avatarColour: AccountAvatarColour;
}

export interface AccountProfileSnapshot {
  profile: AccountProfile | null;
  available: boolean;
}

export const ACCOUNT_PROFILE_LIMITS = {
  usernameMin: 3,
  usernameMax: 30,
  displayNameMin: 1,
  displayNameMax: 40,
} as const;

export function isAccountAvatarColour(value: string): value is AccountAvatarColour {
  return (ACCOUNT_AVATAR_COLOURS as readonly string[]).includes(value);
}

export function normaliseAccountUsername(value: string): string {
  return value.normalize('NFKC').trim().replace(/^@/u, '').toLocaleLowerCase('en');
}

export function isValidAccountUsername(value: string): boolean {
  return /^[a-z0-9][a-z0-9_]{2,29}$/u.test(value);
}

export function getSafeAccountNextPath(value: string | null, fallback = '/'): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
