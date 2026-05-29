// Safe lazy-loaded wrapper around react-native-track-player.
// Falls back to no-ops in Expo Go where the native module is absent.

import type TrackPlayerType from 'react-native-track-player';
import type {
  AppKilledPlaybackBehavior as AppKilledPlaybackBehaviorType,
  Capability as CapabilityType,
  Event as EventType,
  State as StateType,
} from 'react-native-track-player';

let _TrackPlayer: typeof TrackPlayerType | null = null;

// Stub hooks — always called so React's rules-of-hooks are never violated.
let _usePlaybackState: () => { state: StateType | undefined } = () => ({ state: undefined });
let _useActiveTrack: () => unknown = () => undefined;

let _State: typeof StateType = {
  None: 'none',
  Ready: 'ready',
  Playing: 'playing',
  Paused: 'paused',
  Stopped: 'stopped',
  Buffering: 'buffering',
  Loading: 'loading',
  Error: 'error',
  Ended: 'ended',
  Connecting: 'connecting',
} as unknown as typeof StateType;

let _Capability: typeof CapabilityType = {} as typeof CapabilityType;
let _AppKilledPlaybackBehavior: typeof AppKilledPlaybackBehaviorType = {} as typeof AppKilledPlaybackBehaviorType;
let _Event: typeof EventType = {} as typeof EventType;

try {
  const RNTP = require('react-native-track-player');
  _TrackPlayer = RNTP.default ?? RNTP;
  _usePlaybackState = RNTP.usePlaybackState;
  _useActiveTrack = RNTP.useActiveTrack;
  _State = RNTP.State;
  _Capability = RNTP.Capability;
  _AppKilledPlaybackBehavior = RNTP.AppKilledPlaybackBehavior;
  _Event = RNTP.Event;
} catch {
  console.warn('[trackPlayer] react-native-track-player native module unavailable (Expo Go / web).');
}

export default _TrackPlayer;
export const usePlaybackState = _usePlaybackState;
export const useActiveTrack = _useActiveTrack;
export const State = _State;
export const Capability = _Capability;
export const AppKilledPlaybackBehavior = _AppKilledPlaybackBehavior;
export const Event = _Event;
