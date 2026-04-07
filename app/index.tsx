import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { index } from './styles';


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'http://s2.stationplaylist.com:7078/listen.mp3' },
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <LinearGradient colors={['#00a8f3', '#8cfffb']} style={index.container}>
      <Image
        source={require('../assets/images/Cool-Fresh-Good-Trans.png')}
        style={{ width: '100%', height: '13%', marginBottom: 20 }}
        contentFit="cover"
      />
      <Image
        source={require('../assets/images/Title-Trans.png')}
        style={{ width: '70%', height: '22%' }}
        contentFit="cover"
      />
      <View style={index.buttonContainer}>
        <TouchableOpacity style={index.button} onPress={togglePlayPause}>
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="white" />
        </TouchableOpacity>
      </View>
      <Image
        source={require('../assets/images/Fridge-Icon-Blue.png')}
        style={{ width: '45%', height: '29%'}}
        contentFit="cover"
      />
    </LinearGradient>
  );
}