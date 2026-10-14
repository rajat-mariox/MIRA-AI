import { createNavigationContainerRef } from '@react-navigation/native';
import type { User } from '../api/user';
import type { RootStackParamList } from './types';

/** Lets non-screen code (session expiry) reset the navigation. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type StackRoute = { name: keyof RootStackParamList };

// Onboarding order; `profileSetupStep` = number of these steps already saved
const ONBOARDING_STEPS = ['Name', 'BirthDate', 'BirthTime', 'BirthPlace', 'Gender', 'Relationship'] as const;

/**
 * Stack to show for a signed-in user: Main when the profile is complete, else the next
 * onboarding step (with the earlier steps underneath so "back" still works).
 */
export function routesForUser(user: Pick<User, 'isProfileComplete' | 'profileSetupStep'>): StackRoute[] {
  if (user.isProfileComplete) return [{ name: 'Main' }];
  const next = Math.min(Math.max(user.profileSetupStep ?? 0, 0), ONBOARDING_STEPS.length - 1);
  return ONBOARDING_STEPS.slice(0, next + 1).map(name => ({ name }));
}

export function resetToWelcome() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }
}
