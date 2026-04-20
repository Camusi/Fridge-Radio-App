import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from './audioManager';
import { bibleStyles } from './styles/bible';


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const barValuesRef = useRef(
      Array.from({ length: 5 }, () => new Animated.Value(0.4))
    );

  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Configure audio session for background playback
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        // Load the stream
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://s2.stationplaylist.com:7078/thebible.mp3' },
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        if (isPlaying) {
          pauseExclusive(soundRef.current).catch(() => {});
        }
        clearExclusive(soundRef.current);
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeActiveSoundChange(activeSound => {
      if (soundRef.current) {
        setIsPlaying(activeSound === soundRef.current);
      }
    });
    return unsubscribe;
  }, []);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await pauseExclusive(soundRef.current);
      setIsPlaying(false);
    } else {
      await playExclusive(soundRef.current);
      setIsPlaying(true);
    }
  };

  const barValues = barValuesRef.current;
  const animations = barValues.map((bar, index) => {
    const duration = 520 + index * 80;
    return Animated.loop(
      Animated.sequence([
        Animated.timing(bar, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(bar, {
          toValue: 0.35,
          duration,
          useNativeDriver: false,
        }),
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
    <LinearGradient colors={['#f38200', '#fafd46']} style={bibleStyles.container}>
      <View style={bibleStyles.card}>
        <Image
          source={require('../assets/images/Cool-Fresh-Good-Trans.png')}
          style={bibleStyles.logoImage}
          contentFit="contain"
        />
        <Image
          source={require('../assets/images/The-Bible-Title-Trans.png')}
          style={bibleStyles.titleImage}
          contentFit="contain"
        />
        <View style={bibleStyles.buttonContainer}>
          <TouchableOpacity style={bibleStyles.button} onPress={togglePlayPause}>
            <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={56} color="#ffffff" />
          </TouchableOpacity>
      </View>
        <View style={bibleStyles.barContainer}>
          {barValuesRef.current.map((value, indexBar) => (
            <Animated.View
              key={indexBar}
              style={[
                bibleStyles.bar, {  transform: [{  scaleY: value,  },],  },
              ]}
            />
          ))}
        </View>
        <Image
          source={require('../assets/images/Bible-Penguin-Trans.png')}
          style={bibleStyles.penguinImage}
          contentFit="contain"
        />
      </View>
    </LinearGradient>
  );
}