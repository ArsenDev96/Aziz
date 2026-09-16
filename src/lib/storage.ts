import AsyncStorage from '@react-native-async-storage/async-storage';

/** Reads JSON from device storage, falling back to `fallback` on anything unexpected. */
export const loadJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const saveJson = async (key: string, value: unknown): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a convenience here — a failure must never break a game in progress.
  }
};

export const STORAGE_KEYS = {
  settings: 'aziz.settings.v1',
  players: 'aziz.players.v1',
} as const;
