import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { clearExclusive, pauseExclusive, playExclusive, subscribeActiveSoundChange } from './audioManager';
import { index } from './styles';


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string>('-');
  const [trackArtist, setTrackArtist] = useState<string>('-');
  const barValuesRef = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.4))
  );
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
          { uri: 'http://s2.stationplaylist.com:7078/listen.mp3' },
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
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('https://thebible.net.nz/api/now-playing');
        const json = await response.json();
        const nowPlaying = json?.now_playing ?? json;
        const title = nowPlaying?.title || nowPlaying?.song || nowPlaying?.track || '-'; // ADJUST FOR NEW API FIELD NAMES
        const artist = nowPlaying?.artist || nowPlaying?.performer || nowPlaying?.artist_name || '-'; // AND THIS
        setTrackTitle(title || '-');
        setTrackArtist(artist || '-');
      } catch (error) {
        setTrackTitle('-');
        setTrackArtist('-');
        console.warn('Unable to load now playing:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000); // CHANGE THIS TO A WEBSOCKET
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeActiveSoundChange(activeSound => {
      if (soundRef.current) {
        setIsPlaying(activeSound === soundRef.current);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
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

    return () => animations.forEach(animation => animation.stop());
  }, [isPlaying]);

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
    <LinearGradient colors={['#00a8f3', '#8cfffb']} style={index.container}>
      <View style={index.card}>
        <Image
          source={require('../assets/images/Cool-Fresh-Good-Trans.png')}
          style={index.logoImage}
          contentFit="contain"
        />
        <Image
          source={require('../assets/images/Title-Trans.png')}
          style={index.titleImage}
          contentFit="contain"
        />
        <View style={index.buttonContainer}>
          <TouchableOpacity style={index.button} onPress={togglePlayPause}>
            <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={56} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={index.trackRow}>
          <View style={index.trackInfoContainer}>
            <Text style={index.trackLabel}>Now playing</Text>
            <Text style={index.trackTitle} numberOfLines={1} ellipsizeMode="tail">
              {trackTitle || '-'}
            </Text>
            <Text style={index.trackArtist} numberOfLines={1} ellipsizeMode="tail">
              {trackArtist || '-'}
            </Text>
          </View>

            <View style={index.barContainer}>
            {barValuesRef.current.map((value, indexBar) => (
              <Animated.View
                key={indexBar}
                style={[
                  index.bar,
                  {
                    height: value.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [12, 36],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Image
          source={require('../assets/images/Fridge-Icon-Blue.png')}
          style={index.fridgeImage}
          contentFit="contain"
        />
      </View>
    </LinearGradient>
  );
}