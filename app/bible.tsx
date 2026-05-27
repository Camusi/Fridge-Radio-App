import { MaterialIcons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, TouchableOpacity, View } from 'react-native';
import { bibleStyles } from '../styles/bible';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from '../util/audioManager';

const STREAM_URI = Platform.OS === 'android'
  ? 'http://s2.stationplaylist.com:7078/thebible.mp3'
  : 'https://s2.stationplaylist.com:7078/thebible.mp3';

export default function BibleApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const barValuesRef = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.4)));
  const insets = useSafeAreaInsets();
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  // Queues a play intent when the user taps before loadAsync has finished
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    let s: Audio.Sound | null = null;
    let mounted = true;

    const setup = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        s = new Audio.Sound();

        s.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!mounted) return;

          if (!status.isLoaded) {
            // Only react to errors — don't clear buffering during normal loading
            if (status.error) {
              setIsBuffering(false);
              pendingPlayRef.current = false;
              console.error('Stream error:', status.error);
              if (isPlayingRef.current) {
                setTimeout(async () => {
                  if (!mounted || !s) return;
                  try {
                    await s.loadAsync(
                      { uri: STREAM_URI },
                      { shouldPlay: true }
                    );
                  } catch (e) {
                    console.warn('Reconnect failed:', e);
                  }
                }, 3000);
              }
            }
            return;
          }

          // Auto-play if the user tapped play while loadAsync was still in progress
          if (pendingPlayRef.current && !status.isPlaying) {
            pendingPlayRef.current = false;
            playExclusive(s!).catch(e => console.warn('Auto-play failed:', e));
            return;
          }

          // Only show buffering when not yet producing audio — live streams
          // keep isBuffering true in the background even during active playback.
          setIsBuffering(status.isBuffering && !status.isPlaying);

          if (status.didJustFinish && isPlayingRef.current) {
            setTimeout(async () => {
              if (!mounted || !s) return;
              try {
                await s.unloadAsync();
                await s.loadAsync(
                  { uri: STREAM_URI },
                  { shouldPlay: true }
                );
              } catch (e) {
                console.warn('Reconnect after finish failed:', e);
              }
            }, 1000);
          }
        });

        // Expose the Sound object immediately so the first tap isn't a no-op
        if (mounted) setSound(s);

        await s.loadAsync(
          { uri: STREAM_URI },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 }
        );
      } catch (error) {
        console.error('Audio setup error:', error);
        if (mounted) {
          pendingPlayRef.current = false;
          setIsBuffering(false);
          setIsPlaying(false);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      if (s) {
        clearExclusive(s);
        s.setOnPlaybackStatusUpdate(null);
        s.unloadAsync().catch(console.warn);
      }
    };
  }, []);

  useEffect(() => {
    if (!sound) return;
    const unsubscribe = subscribeActiveSoundChange(activeSound => {
      setIsPlaying(activeSound === sound);
    });
    return unsubscribe;
  }, [sound]);

  useEffect(() => {
    const barValues = barValuesRef.current;
    const animations = barValues.map((bar, i) => {
      const duration = 520 + i * 80;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration, useNativeDriver: false }),
          Animated.timing(bar, { toValue: 0.35, duration, useNativeDriver: false }),
        ]),
      );
    });

    if (isPlaying) {
      animations.forEach((animation, i) => {
        barValues[i].setValue(0.45);
        animation.start();
      });
    } else {
      barValues.forEach(bar => bar.setValue(0.25));
      animations.forEach(animation => animation.stop());
    }

    return () => animations.forEach(animation => animation.stop());
  }, [isPlaying]);

  const togglePlayPause = async () => {
    if (!sound) return;
    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        // loadAsync not yet complete — queue or cancel the play intent
        if (!isPlaying) {
          pendingPlayRef.current = true;
          setIsPlaying(true);
          setIsBuffering(true);
        } else {
          pendingPlayRef.current = false;
          setIsPlaying(false);
          setIsBuffering(false);
        }
        return;
      }

      if (isPlaying) {
        await pauseExclusive(sound);
        setIsPlaying(false);
      } else {
        await playExclusive(sound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Toggle playback failed:', error);
      setIsPlaying(false);
    }
  };

  return (
    <LinearGradient colors={['#f38200', '#fafd46']} style={[bibleStyles.container, { paddingTop: insets.top }]}>
      <View style={bibleStyles.card}>
        <Image source={require('../assets/images/Cool-Fresh-Good-Trans.png')} style={bibleStyles.logoImage} contentFit="contain" />
        <Image source={require('../assets/images/The-Bible-Title-Trans.png')} style={bibleStyles.titleImage} contentFit="contain" />
        <View style={bibleStyles.buttonContainer}>
          <TouchableOpacity style={bibleStyles.button} onPress={togglePlayPause}>
            {isPlaying && isBuffering
              ? <ActivityIndicator size="large" color="#ffffff" />
              : <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={56} color="#ffffff" />
            }
          </TouchableOpacity>
        </View>
        <View style={bibleStyles.barContainer}>
          {barValuesRef.current.map((value, i) => (
            <Animated.View key={i} style={[bibleStyles.bar, { transform: [{ scaleY: value }] }]} />
          ))}
        </View>
        <Image source={require('../assets/images/Bible-Penguin-Trans.png')} style={bibleStyles.penguinImage} contentFit="contain" />
      </View>
    </LinearGradient>
  );
}
