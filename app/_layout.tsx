import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: 'black', tabBarInactiveTintColor: 'gray', tabBarStyle: { backgroundColor: '#fdfdfd' } }} initialRouteName="index">
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
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
  );
}
