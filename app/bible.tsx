import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from './audioManager';
import { bibleStyles } from './styles/bible';


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

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

  return (
    <LinearGradient colors={['#f38200', '#fdff8c']} style={bibleStyles.container}>
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
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={42} color="white" />
          </TouchableOpacity>
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