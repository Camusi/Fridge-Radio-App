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
            setIsBuffering(false);
            if (status.error) {
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

          setIsBuffering(status.isBuffering);

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

        await s.loadAsync(
          { uri: STREAM_URI },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 }
        );

        if (mounted) setSound(s);
      } catch (error) {
        console.error('Audio setup error:', error);
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
