import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { errorMessage } from '../api/client';
import type { UpdateMeInput } from '../api/user';
import { useSession } from '../context/OnboardingContext';

/**
 * Saves one onboarding step with PUT /users/me, then runs `next` (navigation).
 * `profileSetupStep` never goes backwards when the user revisits an earlier step.
 */
export default function useStepSaver() {
  const { saveProfile, user } = useSession();
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const save = useCallback(
    async (step: number, patch: UpdateMeInput, next: () => void) => {
      if (busy.current) return;
      busy.current = true;
      setSaving(true);
      try {
        await saveProfile({
          ...patch,
          profileSetupStep: Math.max(step, user?.profileSetupStep ?? 0),
        });
        next();
      } catch (e) {
        Alert.alert('Could not save', errorMessage(e));
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [saveProfile, user?.profileSetupStep],
  );

  return { saving, save };
}
