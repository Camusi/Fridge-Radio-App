import { AudioPlayer } from 'expo-audio';

let activePlayer: AudioPlayer | null = null;
const listeners = new Set<(active: AudioPlayer | null) => void>();

const notifyListeners = (active: AudioPlayer | null) => {
  listeners.forEach(listener => listener(active));
};

export async function playExclusive(player: AudioPlayer) {
  try {
    if (activePlayer && activePlayer !== player) {
      activePlayer.pause();
    }
  } catch (error) {
    console.warn('Error pausing active player', error);
  }

  activePlayer = player;
  notifyListeners(activePlayer);

  try {
    player.play();
  } catch (error) {
    console.warn('Error playing player', error);
    throw error;
  }
}

export async function pauseExclusive(player: AudioPlayer) {
  try {
    player.pause();
  } catch (error) {
    console.warn('Error pausing player', error);
  }

  if (activePlayer === player) {
    activePlayer = null;
    notifyListeners(activePlayer);
  }
}

export function clearExclusive(player: AudioPlayer | null) {
  if (activePlayer === player) {
    activePlayer = null;
    notifyListeners(activePlayer);
  }
}

export function subscribeActiveSoundChange(listener: (active: AudioPlayer | null) => void) {
  listeners.add(listener);
  listener(activePlayer);
  return () => {
    listeners.delete(listener);
  };
}

export function unsubscribeActiveSoundChange(listener: (active: AudioPlayer | null) => void) {
  listeners.delete(listener);
}