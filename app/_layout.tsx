import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { PanResponder, View } from 'react-native';
import { Provider } from '../context/context';
import { layoutStyles } from '../styles/layout';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] ?? 'index';
  const routes = ['updates', 'index', 'bible', 'info'] as const;
  const routePaths = ['/updates', '/', '/bible', '/info'] as const;

  useEffect(() => {
    // All RNTP imports are lazy so the app doesn't crash in Expo Go
    // where the native module is absent.
    try {
      const RNTP = require('react-native-track-player');
      const TrackPlayer = RNTP.default;
      const { Capability, AppKilledPlaybackBehavior } = RNTP;
      const { PlaybackService } = require('../service');

      TrackPlayer.registerPlaybackService(() => PlaybackService);
      TrackPlayer.setupPlayer({ autoHandleInterruptions: true })
        .then(() =>
          TrackPlayer.updateOptions({
            capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
            compactCapabilities: [Capability.Play, Capability.Pause],
            android: {
              appKilledPlaybackBehavior:
                AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
          }),
        )
        .catch(console.warn);
    } catch {
      // Expo Go / web — native module unavailable, audio features are disabled.
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20,
        onPanResponderRelease: (_, gestureState) => {
          const currentIndex = routes.indexOf(currentRoute as typeof routes[number]);
          if (gestureState.dx < -50 && currentIndex < routes.length - 1) {
            router.replace(routePaths[currentIndex + 1]);
          } else if (gestureState.dx > 50 && currentIndex > 0) {
            router.replace(routePaths[currentIndex - 1]);
          }
        },
      }),
    [currentRoute, router],
  );

  return (
    <Provider>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: 'black',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: layoutStyles.tabBar,
          }}
          initialRouteName="index"
        >
        <Tabs.Screen
          name="updates"
          options={{
            title: 'Updates',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="newspaper" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Fridge',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bible"
          options={{
            title: 'Bible',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="info" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      </View>
    </Provider>
  );
}
