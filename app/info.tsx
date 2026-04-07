import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Widget {
  type: 'text' | 'image';
  content: string;
}

export default function InfoScreen() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  const addTextWidget = () => {
    if (textInput.trim()) {
      setWidgets([...widgets, { type: 'text', content: textInput }]);
      setTextInput('');
      setShowAddModal(false);
    }
  };

  const addImageWidget = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setWidgets([...widgets, { type: 'image', content: result.assets[0].uri }]);
      setShowAddModal(false);
    }
  };

  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newWidgets = [...widgets];
      [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      setWidgets(newWidgets);
    } else if (direction === 'down' && index < widgets.length - 1) {
      const newWidgets = [...widgets];
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      setWidgets(newWidgets);
    }
  };

  return (
    <View  style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={{ flex: 1, paddingTop: '25%', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: 'black' }}>
          Information
        </Text>
        {widgets.map((widget, index) => (
          <View key={index} style={{ marginBottom: 15 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              {widget.type === 'text' ? (
                <Text style={{ fontSize: 16 }}>{widget.content}</Text>
              ) : (
                <Image
                  source={{ uri: widget.content }}
                  style={{ width: '100%', height: 200, borderRadius: 10 }}
                  contentFit="cover"
                />
              )}
            </View>
            
            {isAdminMode && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 5 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'down')}
                    disabled={index === widgets.length - 1}
                    style={{ opacity: index === widgets.length - 1 ? 0.3 : 1 }}
                  >
                    <MaterialIcons name="arrow-downward" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeWidget(index)}>
                  <MaterialIcons name="delete" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {isAdminMode && (
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: '#ccc',
              borderRadius: 15,
              padding: 30,
              marginBottom: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={40} color="#999" />
            <Text style={{ color: '#999', marginTop: 10, fontSize: 14 }}>Add Widget</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Widget Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            width: '80%',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add Widget</Text>

            {/* Text Input Section */}
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Text Widget</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter text content"
                multiline={true}
                value={textInput}
                onChangeText={setTextInput}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#00a8f3',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginBottom: 15,
                }}
                onPress={addTextWidget}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Text</Text>
              </TouchableOpacity>
            </View>

            {/* Image Button */}
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Image Widget</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#00a8f3',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginBottom: 15,
                }}
                onPress={addImageWidget}
              >
                <MaterialIcons name="image" size={24} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Choose Image</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#f0f0f0',
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                width: '100%',
              }}
              onPress={() => {
                setShowAddModal(false);
                setTextInput('');
              }}
            >
              <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Admin Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: isAdminMode ? '#00a8f3' : '#ccc',
          borderRadius: 20,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setIsAdminMode(!isAdminMode)}
      >
        <MaterialIcons name="admin-panel-settings" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}