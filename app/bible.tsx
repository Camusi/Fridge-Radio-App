import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { bibleStyles } from '../styles/bible';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from '../util/audioManager';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const barValuesRef = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.4)));
  const insets = useSafeAreaInsets();

  const player = useAudioPlayer({ uri: 'https://s2.stationplaylist.com:7078/thebible.mp3' });

  useEffect(() => {
    const setup = async () => {
      try {
        await setAudioModeAsync({playsInSilentMode: true});
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };
    setup();

    return () => {
      clearExclusive(player);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeActiveSoundChange(activePlayer => {
      setIsPlaying(activePlayer === player);
    });
    return unsubscribe;
  }, [player]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await pauseExclusive(player);
      setIsPlaying(false);
    } else {
      await playExclusive(player);
      setIsPlaying(true);
    }
  };

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

  return (
    <LinearGradient colors={['#f38200', '#fafd46']} style={[bibleStyles.container, { paddingTop: insets.top }]}>
      <View style={bibleStyles.card}>
        <Image source={require('../assets/images/Cool-Fresh-Good-Trans.png')} style={bibleStyles.logoImage} contentFit="contain" />
        <Image source={require('../assets/images/The-Bible-Title-Trans.png')} style={bibleStyles.titleImage} contentFit="contain" />
        <View style={bibleStyles.buttonContainer}>
          <TouchableOpacity style={bibleStyles.button} onPress={togglePlayPause}>
            <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={56} color="#ffffff" />
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