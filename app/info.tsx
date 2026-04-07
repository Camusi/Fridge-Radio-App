import { MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { global as globalStyles } from './styles/global';
import { info as infoStyles } from './styles/info';

interface Widget {
  type: 'text' | 'image';
  content: string;
}

const ADMIN_PASSWORD_HASH = '0cb0d64655e41ed99bddb2de03f45aa7ccb023406738fbf2470ce817a0b1be47';

export default function InfoScreen() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');



  const checkPassword = async (password: string) => {
    try {
      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return inputHash === ADMIN_PASSWORD_HASH;
    } catch (error) {
      console.error('Error checking password:', error);
      return false;
    }
  };

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

    const handlePasswordSubmit = async () => {
    const isValid = await checkPassword(passwordInput);
    if (isValid) {
      setIsAdminMode(true);
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      // Could add error feedback here
      setPasswordInput('');
    }
  };

  return (
    <View style={infoStyles.container}>
      <ScrollView style={infoStyles.scrollView}>
        <Text style={infoStyles.title}>
          Information
        </Text>
        {widgets.map((widget, index) => (
          <View key={index} style={infoStyles.widgetContainer}>
            <View style={globalStyles.widgetCard}>
              {widget.type === 'text' ? (
                <Text style={globalStyles.widgetText}>{widget.content}</Text>
              ) : (
                <Image
                  source={{ uri: widget.content }}
                  style={globalStyles.widgetImage}
                  contentFit="cover"
                />
              )}
            </View>
            
            {isAdminMode && (
              <View style={infoStyles.widgetControls}>
                <View style={infoStyles.arrowButtonsGroup}>
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
            style={infoStyles.addWidgetButton}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={40} style={infoStyles.addWidgetIcon} />
            <Text style={infoStyles.addWidgetText}>Add Widget</Text>
          </TouchableOpacity>
        )}

        <View style={infoStyles.bottomSpacing} />
      </ScrollView>

      {/* Add Widget Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>Add Widget</Text>

            {/* Text Input Section */}
            <View style={infoStyles.addWidgetModalContent}>
              <Text style={infoStyles.widgetTypeLabel}>Text Widget</Text>
              <TextInput
                style={infoStyles.widgetTextInput}
                placeholder="Enter text content"
                multiline={true}
                value={textInput}
                onChangeText={setTextInput}
              />
              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={addTextWidget}
              >
                <Text style={globalStyles.primaryButtonText}>Add Text</Text>
              </TouchableOpacity>
            </View>

            {/* Image Button */}
            <View style={infoStyles.addWidgetModalContent}>
              <Text style={infoStyles.widgetTypeLabel}>Image Widget</Text>
              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={addImageWidget}
              >
                <MaterialIcons name="image" size={24} color="#ffffff" />
                <Text style={globalStyles.primaryButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[globalStyles.secondaryButton, { width: '100%' }]}
              onPress={() => {
                setShowAddModal(false);
                setTextInput('');
              }}
            >
              <Text style={globalStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>Admin Access</Text>
            
            <TextInput
              style={infoStyles.passwordInput}
              placeholder="Enter admin password"
              secureTextEntry={true}
              value={passwordInput}
              onChangeText={setPasswordInput}
              onSubmitEditing={handlePasswordSubmit}
            />
            
            <View style={infoStyles.buttonRow}>
              <TouchableOpacity
                style={[globalStyles.secondaryButton, infoStyles.buttonRowItem, infoStyles.buttonRowFirst]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
              >
                <Text style={globalStyles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[globalStyles.primaryButton, infoStyles.buttonRowItem, infoStyles.buttonRowLast]}
                onPress={handlePasswordSubmit}
              >
                <Text style={globalStyles.primaryButtonText}>Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Button */}
      <TouchableOpacity
        style={[
          infoStyles.adminButton,
          isAdminMode ? infoStyles.adminButtonActive : infoStyles.adminButtonInactive,
        ]}
        onPress={() => {
          if (isAdminMode) {
            setIsAdminMode(false);
          } else {
            setShowPasswordModal(true);
          }
        }}
      >
        <MaterialIcons name="admin-panel-settings" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}