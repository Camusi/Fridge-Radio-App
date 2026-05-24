import { AudioPlayer } from 'expo-audio';

let activePlayer: AudioPlayer | null = null;

const listeners = new Set<(active: AudioPlayer | null) => void>();

const notifyListeners = (active: AudioPlayer | null) => {
  listeners.forEach(listener => listener(active));
};

export async function playExclusive(player: AudioPlayer) {
  try {
    if (activePlayer && activePlayer !== player) {
      await activePlayer.pause();
    }
  } catch (error) {
    console.warn('Error pausing active player:', error);
  }

  activePlayer = player;
  notifyListeners(activePlayer);

  try {
    await player.play();
    setTimeout(() => {
      try {
        console.log('Current player state:', {
          playing: activePlayer === player,
        });
      } catch (e) {
        console.warn('Unable to inspect player state:', e);
      }
    }, 1000);
  } catch (error) {
    console.error('PLAYBACK ERROR:', error);

    activePlayer = null;
    notifyListeners(activePlayer);

    throw error;
  }
}

export async function pauseExclusive(player: AudioPlayer) {
  try {
    await player.pause();
  } catch (error) {
    console.warn('Error pausing player:', error);
  }

  if (activePlayer === player) {
    activePlayer = null;
    notifyListeners(activePlayer);
  }
}

export function clearExclusive(player: AudioPlayer | null) {
  try {
    if (activePlayer === player) {
      console.log('Clearing active player');

      activePlayer = null;
      notifyListeners(activePlayer);
    }
  } catch (error) {
    console.warn('Error clearing player:', error);
  }
}

export function subscribeActiveSoundChange(
  listener: (active: AudioPlayer | null) => void
) {
  listeners.add(listener);

  listener(activePlayer);

  return () => {
    listeners.delete(listener);
  };
}

export function unsubscribeActiveSoundChange(
  listener: (active: AudioPlayer | null) => void
) {
  listeners.delete(listener);
}