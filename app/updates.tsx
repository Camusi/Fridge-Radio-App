import { MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { global as globalStyles } from '../styles/global';
import { info as infoStyles } from '../styles/info';
import { API_BASE_URL, ADMIN_PASSWORD_HASH } from '../config.local';

interface Widget {
  id?: string;
  type: 'text' | 'image';
  content: string;
}

export default function UpdatesScreen() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getPublicImageUrl = (value: string) => {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    if (value.startsWith('/api-images/')) {
      return `${API_BASE_URL}${value}`;
    }
    return `${API_BASE_URL}/api-images/${value}`;
  };

  const normalizeWidgetFromServer = (item: any): Widget => {
    if (item.type === 'image') {
      return {
        id: item.id,
        type: 'image',
        content: getPublicImageUrl(item.value),
      };
    }

    return {
      id: item.id,
      type: 'text',
      content: item.value,
    };
  };

  const isRemoteUri = (uri: string) => uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:');

  const uploadImage = async (uri: string): Promise<Widget> => {
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const fileTypeMatches = filename.match(/\.([a-zA-Z0-9]+)$/);
    const fileType = fileTypeMatches ? `image/${fileTypeMatches[1]}` : 'image/jpeg';
    const formData = new FormData();

    formData.append('type', 'image');
    formData.append('file', {
      uri,
      name: filename,
      type: fileType,
    } as any);

    const response = await fetch(`${API_BASE_URL}/feed`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }

    const body = await response.json();
    return {
      id: body.item.id,
      type: 'image',
      content: getPublicImageUrl(body.item.value),
    };
  };

  const loadWidgets = async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_BASE_URL}/feed`);
      if (!response.ok) {
        throw new Error(`Unable to load feed: ${response.status}`);
      }

      const data = await response.json();
      const loadedWidgets = (data.items || []).map(normalizeWidgetFromServer);
      setWidgets(loadedWidgets);
      setIsDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown load error';
      setLoadError(message);
      console.error('Error loading updates:', error);
    }
  };

  useEffect(() => {
    loadWidgets();
  }, []);

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
      setIsDirty(true);
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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setWidgets([...widgets, { type: 'image', content: result.assets[0].uri }]);
      setIsDirty(true);
      setShowAddModal(false);
    }
  };

  const removeWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newWidgets = [...widgets];
      [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      setWidgets(newWidgets);
      setIsDirty(true);
    } else if (direction === 'down' && index < widgets.length - 1) {
      const newWidgets = [...widgets];
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      setWidgets(newWidgets);
      setIsDirty(true);
    }
  };

  const prepareWidgetsForSave = async () => {
    const savedWidgets = await Promise.all(
      widgets.map(async (widget) => {
        if (widget.type === 'image' && !isRemoteUri(widget.content)) {
          return uploadImage(widget.content);
        }
        return widget;
      })
    );

    return savedWidgets.map((widget) => ({
      id: widget.id,
      type: widget.type,
      value: widget.content,
    }));
  };

  const saveWidgets = async () => {
    if (!isAdminMode) {
      console.log('Authentication error');
      return
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const items = await prepareWidgetsForSave();
      const response = await fetch(`${API_BASE_URL}/feed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Save failed: ${response.status}`);
      }

      const data = await response.json();
      const loadedWidgets = (data.items || []).map(normalizeWidgetFromServer);
      setWidgets(loadedWidgets);
      setIsDirty(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
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
          Updates
        </Text>
        {loadError ? (
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#c00', textAlign: 'center', marginBottom: 8 }}>
              {loadError}
            </Text>
            <TouchableOpacity
              style={globalStyles.secondaryButton}
              onPress={loadWidgets}
            >
              <Text style={globalStyles.secondaryButtonText}>Retry Load</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
          <>
            <TouchableOpacity
              style={infoStyles.addWidgetButton}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialIcons name="add" size={40} style={infoStyles.addWidgetIcon} />
              <Text style={infoStyles.addWidgetText}>Add Widget</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { opacity: isDirty && !isSaving ? 1 : 0.55, marginBottom: 16 }]}
              onPress={saveWidgets}
              disabled={!isDirty || isSaving}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {saveError ? (
              <Text style={{ color: '#c00', textAlign: 'center', marginBottom: 12 }}>
                {saveError}
              </Text>
            ) : null}
          </>
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
