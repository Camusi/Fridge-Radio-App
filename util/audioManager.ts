import { Audio } from 'expo-av';

let activeSound: Audio.Sound | null = null;

const listeners = new Set<(active: Audio.Sound | null) => void>();

const notifyListeners = (active: Audio.Sound | null) => {
  listeners.forEach(listener => listener(active));
};

export async function playExclusive(sound: Audio.Sound) {
  try {
    if (activeSound && activeSound !== sound) {
      await activeSound.pauseAsync();
    }
  } catch (error) {
    console.warn('Error pausing active sound:', error);
  }

  activeSound = sound;
  notifyListeners(activeSound);

  try {
    await sound.playAsync();
  } catch (error) {
    console.error('PLAYBACK ERROR:', error);
    activeSound = null;
    notifyListeners(activeSound);
    throw error;
  }
}

export async function pauseExclusive(sound: Audio.Sound) {
  try {
    await sound.pauseAsync();
  } catch (error) {
    console.warn('Error pausing sound:', error);
  }

  if (activeSound === sound) {
    activeSound = null;
    notifyListeners(activeSound);
  }
}

export function clearExclusive(sound: Audio.Sound | null) {
  try {
    if (activeSound === sound) {
      activeSound = null;
      notifyListeners(activeSound);
    }
  } catch (error) {
    console.warn('Error clearing sound:', error);
  }
}

export function subscribeActiveSoundChange(
  listener: (active: Audio.Sound | null) => void
) {
  listeners.add(listener);
  listener(activeSound);
  return () => {
    listeners.delete(listener);
  };
}

export function unsubscribeActiveSoundChange(
  listener: (active: Audio.Sound | null) => void
) {
  listeners.delete(listener);
}
