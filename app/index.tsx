import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { index } from './styles';


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={index.container}>
      <Text style={index.title}>The Fridge 88.3 FM</Text>
      <View style={index.buttonContainer}>
        <TouchableOpacity style={index.button} onPress={togglePlayPause}>
          <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}