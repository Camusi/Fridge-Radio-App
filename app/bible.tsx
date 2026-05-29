import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bibleStyles } from '../styles/bible';
import { TRACK_ID_BIBLE } from '../util/audioManager';
import TrackPlayer, { State, useActiveTrack, usePlaybackState } from '../util/trackPlayer';

const STREAM_URI = Platform.OS === 'android'
  ? 'http://s2.stationplaylist.com:7078/thebible.mp3'
  : 'https://s2.stationplaylist.com:7078/thebible.mp3';

export default function BibleApp() {
  const { state: pbState } = usePlaybackState();
  const activeTrack = useActiveTrack() as any;
  const barValuesRef = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.4)));
  const insets = useSafeAreaInsets();

  // Derived state from RNTP
  const isActiveStation = activeTrack?.id === TRACK_ID_BIBLE;
  const isPlaying = isActiveStation && pbState === State.Playing;
  const isBuffering =
    isActiveStation &&
    (pbState === State.Buffering || pbState === State.Loading);

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
          id: TRACK_ID_BIBLE,
          url: STREAM_URI,
          title: 'The Bible Channel',
          artist: 'Cool Fresh Good',
          artwork: require('../assets/images/Bible-Penguin-Trans.png'),
          isLiveStream: true,
        } as any);
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Toggle playback failed:', error);
    }
  };

  return (
    <LinearGradient colors={['#f38200', '#fafd46']} style={[bibleStyles.container, { paddingTop: insets.top }]}>
      <View style={bibleStyles.card}>
        <Image source={require('../assets/images/Cool-Fresh-Good-Trans.png')} style={bibleStyles.logoImage} contentFit="contain" />
        <Image source={require('../assets/images/The-Bible-Title-Trans.png')} style={bibleStyles.titleImage} contentFit="contain" />
        <View style={bibleStyles.buttonContainer}>
          <TouchableOpacity style={bibleStyles.button} onPress={togglePlayPause}>
            {isBuffering
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
