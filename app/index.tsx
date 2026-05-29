import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { index } from '../styles';
import { TRACK_ID_FRIDGE } from '../util/audioManager';
import TrackPlayer, { State, useActiveTrack, usePlaybackState } from '../util/trackPlayer';

const STREAM_URI = Platform.OS === 'android'
  ? 'http://s2.stationplaylist.com:7078/listen.mp3'
  : 'https://s2.stationplaylist.com:7078/listen.mp3';

export default function App() {
  const { state: pbState } = usePlaybackState();
  const activeTrack = useActiveTrack() as any;
  const [trackTitle, setTrackTitle] = useState<string>('-');
  const [trackArtist, setTrackArtist] = useState<string>('-');
  const barValuesRef = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.4)));
  const insets = useSafeAreaInsets();

  // Derived state from RNTP
  const isActiveStation = activeTrack?.id === TRACK_ID_FRIDGE;
  const isPlaying = isActiveStation && pbState === State.Playing;
  const isBuffering =
    isActiveStation &&
    (pbState === State.Buffering || pbState === State.Loading);

  // Keep refs so the fetch interval can read current values without stale closures
  const isActiveStationRef = useRef(false);
  const isPlayingRef = useRef(false);
  isActiveStationRef.current = isActiveStation;
  isPlayingRef.current = isPlaying;

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

        // Update lock screen / notification metadata while this station is live
        if (TrackPlayer && isActiveStationRef.current && isPlayingRef.current) {
          TrackPlayer.updateNowPlayingMetadata({ title, artist }).catch(() => {});
        }
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
    if (!TrackPlayer) return;
    try {
      if (isPlaying || isBuffering) {
        await TrackPlayer.reset();
      } else {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: TRACK_ID_FRIDGE,
          url: STREAM_URI,
          title: trackTitle !== '-' ? trackTitle : 'Cool Fresh Good',
          artist: trackArtist !== '-' ? trackArtist : 'thebible.net.nz',
          artwork: require('../assets/images/Cool-Fresh-Good-Trans.png'),
          isLiveStream: true,
        } as any);
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Toggle playback failed:', error);
    }
  };

  return (
    <LinearGradient colors={['#00a8f3', '#8cfffb']} style={[index.container, { paddingTop: insets.top }]}>
      <View style={index.card}>
        <Image source={require('../assets/images/Cool-Fresh-Good-Trans.png')} style={index.logoImage} contentFit="contain" />
        <Image source={require('../assets/images/Title-Trans.png')} style={index.titleImage} contentFit="contain" />
        <View style={index.buttonContainer}>
          <TouchableOpacity style={index.button} onPress={togglePlayPause}>
            {isBuffering
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
