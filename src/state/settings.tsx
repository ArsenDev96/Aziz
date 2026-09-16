import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getStrings, type Language, type Strings } from '@/locales';
import { loadJson, saveJson, STORAGE_KEYS } from '@/lib/storage';
import type { TimerSeconds } from '@/modes/wrong-answer/rules';
import { DEFAULT_SETTINGS, hydrateSettings, type Settings } from '@/state/settings-model';

export type { Settings };

interface SettingsValue {
  settings: Settings;
  /** False until stored settings have been read, so the first paint isn't the wrong language. */
  ready: boolean;
  strings: Strings;
  setLanguage: (language: Language) => void;
  setHaptics: (enabled: boolean) => void;
  setTimerSeconds: (timerSeconds: TimerSeconds) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadJson<Partial<Settings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS).then((stored) => {
      if (!active) return;
      setSettings(hydrateSettings(stored));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      void saveJson(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({
      settings,
      ready,
      strings: getStrings(settings.language),
      setLanguage: (language: Language) => update({ language }),
      setHaptics: (haptics: boolean) => update({ haptics }),
      setTimerSeconds: (timerSeconds: TimerSeconds) => update({ timerSeconds }),
    }),
    [settings, ready, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsValue => {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
};

export const useStrings = (): Strings => useSettings().strings;
