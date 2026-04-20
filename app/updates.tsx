import { MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ADMIN_PASSWORD_HASH, API_BASE_URL } from '../config.local';
import { global as globalStyles } from './styles/global';
import { info as infoStyles } from './styles/info';
import { updates as updateStyles } from './styles/updates';

interface Widget {
  id: string;
  type: 'text' | 'image';
  content: string;
}

const generateWidgetId = () => `widget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;


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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);

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
    const id = item.id ?? generateWidgetId();

    if (item.type === 'image') {
      return {
        id,
        type: 'image',
        content: getPublicImageUrl(item.value),
      };
    }

    return {
      id,
      type: 'text',
      content: item.value,
    };
  };

  const loadWidgets = async () => {
    try {
      setLoadError(null);
      const response = await fetch('https://thebible.net.nz/load-feed');
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
      setWidgets([...widgets, { id: generateWidgetId(), type: 'text', content: textInput }]);
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
      setWidgets([...widgets, { id: generateWidgetId(), type: 'image', content: result.assets[0].uri }]);
      setIsDirty(true);
      setShowAddModal(false);
    }
  };

  const removeWidget = (index: number) => {
    const updatedWidgets = widgets.filter((_, i) => i !== index);
    setWidgets(updatedWidgets);
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

  const saveWidgets = async () => {
    if (!isAdminMode) {
      console.log('Authentication error');
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const formData = new FormData();

      const itemsToSend = [];
      const filesToUpload = [];

      for (const widget of widgets) {
        if (widget.type === 'image') {
          const uri = widget.content;

          // already uploaded image → keep as-is
          if (uri.startsWith('http')) {
            itemsToSend.push({
              id: widget.id,
              type: 'image',
              value: uri,
            });
          } else {
            // NEW local image
            const filename = uri.split('/').pop() ?? `image.jpg`;

            itemsToSend.push({
              id: widget.id,
              type: 'image',
              value: filename, // placeholder name
            });

            filesToUpload.push({
              uri,
              name: filename,
              type: 'image/jpeg',
            });
          }
        } else {
          itemsToSend.push({
            id: widget.id,
            type: 'text',
            value: widget.content,
          });
        }
      }

      // JSON payload
      formData.append(
        'items',
        JSON.stringify({ items: itemsToSend })
      );

      // attach files
      filesToUpload.forEach(file => {
        formData.append('files', file as any);
      });

      const response = await fetch(`${API_BASE_URL}/update-feed`, {
        method: 'POST',
        body: formData,
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

  const startEditing = (index: number) => {
    const widget = widgets[index];
    setEditingIndex(index);
    setEditingText(widget.type === 'text' ? widget.content : '');
    setEditingImage(widget.type === 'image' ? widget.content : null);
  };

  const replaceEditingImage = async () => {
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

    if (!result.canceled && result.assets[0]?.uri) {
      setEditingImage(result.assets[0].uri);
    }
  };

  const saveEdit = () => {
    if (editingIndex === null) {
      return;
    }

    const updatedWidgets = [...widgets];
    const widget = updatedWidgets[editingIndex];

    if (widget.type === 'text') {
      updatedWidgets[editingIndex] = {
        ...widget,
        content: editingText.trim() ? editingText : widget.content,
      };
    } else if (widget.type === 'image' && editingImage) {
      updatedWidgets[editingIndex] = {
        ...widget,
        content: editingImage,
      };
    }

    setWidgets(updatedWidgets);
    setIsDirty(true);
    setEditingIndex(null);
    setEditingText('');
    setEditingImage(null);
  };

  const renderWidgetCard = (widget: Widget) => (
    <View style={globalStyles.widgetCard}>
      {widget.type === 'text' ? (
        <Text style={globalStyles.widgetText}>{widget.content}</Text>
      ) : (
        <Image
          source={{ uri: widget.content }}
          style={globalStyles.widgetImage}
          contentFit="contain"
        />
      )}
    </View>
  );

  return (
    <View style={infoStyles.container}>
      <ScrollView style={infoStyles.scrollView}>
        <Text style={infoStyles.title}>
          Updates
        </Text>
        {loadError ? (
          <View style={updateStyles.errorContainer}>
            <Text style={updateStyles.errorText}>
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
          <View key={widget.id} style={infoStyles.widgetContainer}>
            {renderWidgetCard(widget)}

            {isAdminMode && (
              <View style={infoStyles.widgetControls}>
                <View style={infoStyles.arrowButtonsGroup}>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    style={[
                      updateStyles.arrowButton,
                      index === 0 && updateStyles.arrowButtonDisabled,
                    ]}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'down')}
                    disabled={index === widgets.length - 1}
                    style={[
                      updateStyles.arrowButton,
                      index === widgets.length - 1 && updateStyles.arrowButtonDisabled,
                    ]}
                  >
                    <MaterialIcons name="arrow-downward" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
                <View style={updateStyles.actionButtons}>
                  <TouchableOpacity style={updateStyles.iconButton} onPress={() => startEditing(index)}>
                    <MaterialIcons name="edit" size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity style={updateStyles.iconButton} onPress={() => removeWidget(index)}>
                    <MaterialIcons name="delete" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
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
              style={[
                globalStyles.primaryButton,
                updateStyles.saveButton,
                (!isDirty || isSaving) && updateStyles.disabledButton,
              ]}
              onPress={saveWidgets}
              disabled={!isDirty || isSaving}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {saveError ? (
              <Text style={updateStyles.errorText}>
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
              style={[globalStyles.secondaryButton, globalStyles.fullWidthButton]}
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

      {/* Edit Widget Modal */}
      <Modal
        visible={editingIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingIndex(null)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>Edit Widget</Text>

            {editingIndex !== null && widgets[editingIndex]?.type === 'text' ? (
              <View style={infoStyles.addWidgetModalContent}>
                <Text style={infoStyles.widgetTypeLabel}>Text Content</Text>
                <TextInput
                  style={infoStyles.widgetTextInput}
                  placeholder="Edit text content"
                  multiline={true}
                  value={editingText}
                  onChangeText={setEditingText}
                />
                <TouchableOpacity style={globalStyles.primaryButton} onPress={saveEdit}>
                  <Text style={globalStyles.primaryButtonText}>Save Text</Text>
                </TouchableOpacity>
              </View>
            ) : editingIndex !== null && widgets[editingIndex]?.type === 'image' ? (
              <View style={infoStyles.addWidgetModalContent}>
                <Text style={infoStyles.widgetTypeLabel}>Image Widget</Text>
                <TouchableOpacity style={globalStyles.primaryButton} onPress={replaceEditingImage}>
                  <MaterialIcons name="image" size={24} color="#ffffff" />
                  <Text style={globalStyles.primaryButtonText}>Replace Image</Text>
                </TouchableOpacity>
                <Text style={updateStyles.errorText}>Current image shown in preview.</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[globalStyles.secondaryButton, globalStyles.fullWidthButton]} onPress={() => setEditingIndex(null)}>
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
