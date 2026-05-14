export type EmailLinkCandidate = {
  email?: string | null;
  emailVerified: boolean;
  trustedProvider: boolean;
};

export type ProfileCompletionFields = {
  fullName: string;
  email: string;
  roles: readonly unknown[];
};

export function canLinkProfileByEmail(user: EmailLinkCandidate) {
  return Boolean(user.email?.trim() && (user.emailVerified || user.trustedProvider));
}

export function isProfileComplete(profile: ProfileCompletionFields) {
  return Boolean(profile.fullName.trim() && profile.email.trim() && profile.roles.length);
}
