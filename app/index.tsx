import { MaterialIcons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { index } from '../styles';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from '../util/audioManager';

// Android's MediaPlayer/ExoPlayer fails on TLS over non-standard ports.
// HTTP works and usesCleartextTraffic is already enabled in app.json.
// iOS ATS requires HTTPS, and HTTPS works fine there.
const STREAM_URI = Platform.OS === 'android'
  ? 'http://s2.stationplaylist.com:7078/listen.mp3'
  : 'https://s2.stationplaylist.com:7078/listen.mp3';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string>('-');
  const [trackArtist, setTrackArtist] = useState<string>('-');
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
              // Reconnect after error if we should be playing
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

          // Live streams shouldn't finish — reconnect if they do
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
    let lastSeen: string | null = null;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('https://thebible.net.nz/api/now-playing');
        const json = await response.json();
        const nowPlaying = json?.now_playing ?? json;
        const title = nowPlaying?.Song_Title || '-';
        const artist = nowPlaying?.Song_Artist || '-';

        const key = `${artist}|${title}`;
        if (key === lastSeen) return;
        lastSeen = key;

        setTrackTitle(title);
        setTrackArtist(artist);
      } catch (error) {
        console.warn('Unable to load now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <LinearGradient colors={['#00a8f3', '#8cfffb']} style={[index.container, { paddingTop: insets.top }]}>
      <View style={index.card}>
        <Image source={require('../assets/images/Cool-Fresh-Good-Trans.png')} style={index.logoImage} contentFit="contain" />
        <Image source={require('../assets/images/Title-Trans.png')} style={index.titleImage} contentFit="contain" />
        <View style={index.buttonContainer}>
          <TouchableOpacity style={index.button} onPress={togglePlayPause}>
            {isPlaying && isBuffering
              ? <ActivityIndicator size="large" color="#ffffff" />
              : <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={56} color="#ffffff" />
            }
          </TouchableOpacity>
        </View>
        <View style={index.trackRow}>
          <View style={index.trackInfoContainer}>
            <Text style={index.trackLabel}>Now playing</Text>
            <Text style={index.trackTitle} numberOfLines={1} ellipsizeMode="tail">{trackTitle || '-'}</Text>
            <Text style={index.trackArtist} numberOfLines={1} ellipsizeMode="tail">{trackArtist || '-'}</Text>
          </View>
          <View style={index.barContainer}>
            {barValuesRef.current.map((bar, i) => (
              <Animated.View
                key={i}
                style={[index.bar, {
                  transform: [
                    { translateY: bar.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                    { scaleY: bar.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }
                  ],
                }]}
              />
            ))}
          </View>
        </View>
        <Image source={require('../assets/images/Fridge-Icon-Blue.png')} style={index.fridgeImage} contentFit="contain" />
      </View>
    </LinearGradient>
  );
}
