import { useSessionStore } from './sessionStore';

/**
 * The signed-in officer's institution, assigned by IAM at account creation
 * (SRS-F000-01) and delivered in the Student Support `/me` profile that `SessionProvider`
 * already polls into `useSessionStore` — no separate call needed here.
 *
 * Officers never select an institution; every officer-scoped view reads it
 * from here. `institutionId` is null until the profile is resolved.
 */
export interface AssignedInstitution {
  institutionId: string | null;
  institutionCode: string;
  /** true once the signed-in profile is available. */
  isResolved: boolean;
}

/**
 * @param active whether the caller needs it — typically: the user is an officer.
 */
export function useAssignedInstitution(active: boolean): AssignedInstitution {
  const user = useSessionStore((s) => s.user);

  if (!active) {
    return { institutionId: null, institutionCode: '', isResolved: true };
  }
  return {
    institutionId: user?.institutionId ?? null,
    institutionCode: user?.institutionCode ?? '',
    isResolved: !!user,
  };
}
