import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../../config.local';
import { updates as updateStyles } from '../styles/updates';
import { global as globalStyles } from '../styles/global';
import { info as infoStyles } from '../styles/info';


export type TextSpan = {
  text: string;
  bold?: boolean;
  fontSize?: number;
};

export interface Widget {
  id: string;
  type: 'text' | 'image';
  content: string | TextSpan[];
  link?: string;
}

const splitSpansIntoWords = (spans: TextSpan[]): TextSpan[] => {
  const words: TextSpan[] = [];
  spans.forEach(span => {
    const parts = span.text.split(/(\s+)/);
    parts.forEach(part => {
      if (part === '') return;
      if (/^\s+$/.test(part)) {
        if (words.length > 0) {
          words[words.length - 1] = {
            ...words[words.length - 1],
            text: words[words.length - 1].text + part,
          };
        }
      } else {
        words.push({ text: part, bold: span.bold ?? false, fontSize: span.fontSize ?? 14 });
      }
    });
  });
  return words.length > 0 ? words : spans;
};

export function useWidgetSection(adminPassword: string | null, feedName: string) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingSpans, setEditingSpans] = useState<TextSpan[]>([]);
  const [selectedSpanIndex, setSelectedSpanIndex] = useState<number | null>(null);
  const [showFormatView, setShowFormatView] = useState(false);
  const [showLinkView, setShowLinkView] = useState(false);
  const [editingLink, setEditingLink] = useState('');

  useEffect(() => {
    loadWidgets(feedName);
  }, []);

  const loadWidgets = async (feedName: string) => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_BASE_URL}/load-feed/${feedName}`);
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      const loadedWidgets = (data.items ?? []).map(normalizeWidgetFromServer);
      setWidgets(loadedWidgets);
      setIsDirty(false);
    } catch (e) {
      setLoadError("Load failed");
    }
  };

  const addImageWidget = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setWidgets([
        { id: generateWidgetId(), type: 'image', content: result.assets[0].uri },
        ...widgets,
      ]);
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

  const saveWidgets = async (feedName: string) => {
    if (!adminPassword) {
      console.error('Authentication error');
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
          if (typeof uri === 'string' && uri.startsWith('http')) {
            itemsToSend.push({ id: widget.id, type: 'image', value: uri, link: widget.link });
          } else {
            const filename = typeof uri === 'string' ? uri.split('/').pop() : `image.jpg`;
            itemsToSend.push({ id: widget.id, type: 'image', value: filename, link: widget.link });
            filesToUpload.push({ uri, name: filename, type: 'image/jpeg' });
          }
        } else {
          itemsToSend.push({ id: widget.id, type: 'text', value: widget.content, link: widget.link });
        }
      }

      formData.append('password', adminPassword);
      formData.append('items', JSON.stringify({ items: itemsToSend }));
      filesToUpload.forEach(file => formData.append('files', file as any));

      const response = await fetch(`${API_BASE_URL}/update-feed/${feedName}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Save failed: ${response.status}`);
      }

      const data = await response.json();
      setWidgets((data.items || []).map(normalizeWidgetFromServer));
      setIsDirty(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (index: number) => {
    const widget = widgets[index];
    setEditingIndex(index);
    setShowFormatView(false);
    setShowLinkView(false);
    setEditingLink(widget.link ?? '');
    if (widget.type === 'text') {
      setEditingSpans(splitSpansIntoWords(widget.content as TextSpan[]));
      setSelectedSpanIndex(0);
    }
    setEditingImage(widget.type === 'image' && typeof widget.content === 'string' ? widget.content : null);
  };

  const updateEditingText = (text: string) => {
    setEditingSpans([{ text, bold: false, fontSize: editingSpans[0]?.fontSize ?? 14 }]);
  };

  const openFormatView = () => {
    setEditingSpans(splitSpansIntoWords(editingSpans));
    setSelectedSpanIndex(0);
    setShowFormatView(true);
  };

  const replaceEditingImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setEditingImage(result.assets[0].uri);
    }
  };

  const toggleBoldForSelectedSpan = () => {
    if (selectedSpanIndex !== null && selectedSpanIndex >= 0 && selectedSpanIndex < editingSpans.length) {
      const updatedSpans = [...editingSpans];
      updatedSpans[selectedSpanIndex] = {
        ...updatedSpans[selectedSpanIndex],
        bold: !updatedSpans[selectedSpanIndex].bold,
      };
      setEditingSpans(updatedSpans);
    }
  };

  const updateFontSizeForSelectedSpan = (fontSize: number) => {
    if (selectedSpanIndex !== null && selectedSpanIndex >= 0 && selectedSpanIndex < editingSpans.length) {
      const updatedSpans = [...editingSpans];
      updatedSpans[selectedSpanIndex] = { ...updatedSpans[selectedSpanIndex], fontSize };
      setEditingSpans(updatedSpans);
    }
  };

  const mergeSpans = (spans: TextSpan[]): TextSpan[] => {
    if (spans.length === 0) return spans;
    const merged: TextSpan[] = [];
    for (const span of spans) {
      const prev = merged[merged.length - 1];
      if (prev && prev.bold === span.bold && prev.fontSize === span.fontSize) {
        merged[merged.length - 1] = { ...prev, text: prev.text + span.text };
      } else {
        merged.push({ ...span });
      }
    }
    return merged;
  };

  const saveEdit = () => {
    if (editingIndex === null) return;

    const updatedWidgets = [...widgets];
    const widget = updatedWidgets[editingIndex];
    const link = editingLink.trim() || undefined;

    if (widget.type === 'text') {
      updatedWidgets[editingIndex] = {
        ...widget,
        content: mergeSpans(editingSpans.length > 0 ? editingSpans : widget.content as TextSpan[]),
        link,
      };
    } else if (widget.type === 'image') {
      updatedWidgets[editingIndex] = {
        ...widget,
        content: editingImage ?? widget.content,
        link,
      };
    }

    setWidgets(updatedWidgets);
    setIsDirty(true);
    setEditingIndex(null);
    setEditingText('');
    setEditingImage(null);
    setEditingSpans([]);
    setSelectedSpanIndex(null);
    setShowFormatView(false);
    setShowLinkView(false);
    setEditingLink('');
  };

  const addTextWidget = () => {
    if (textInput.trim()) {
      setWidgets([
        { id: generateWidgetId(), type: 'text', content: [{ text: textInput, bold: false, fontSize: 14 }] },
        ...widgets,
      ]);
      setIsDirty(true);
      setTextInput('');
      setShowAddModal(false);
    }
  };

  return {
    widgets, isDirty, isSaving, saveError, loadError,
    showAddModal, textInput, editingIndex, editingText, editingImage,
    editingSpans, selectedSpanIndex, showFormatView, showLinkView, editingLink,
    setShowAddModal, setTextInput, setEditingIndex, setEditingText,
    setSelectedSpanIndex, setShowFormatView, setShowLinkView, setEditingLink,
    loadWidgets, moveWidget, removeWidget, startEditing, updateEditingText, openFormatView,
    saveWidgets, addTextWidget, addImageWidget, replaceEditingImage, saveEdit,
    toggleBoldForSelectedSpan, updateFontSizeForSelectedSpan,
  };
}


export function WidgetSection({editing, adminPassword, feedName}: {
  editing: boolean;
  adminPassword: string | null;
  feedName: string;
}) {
  const {
    widgets, isDirty, isSaving, saveError, loadError, showAddModal, textInput, editingIndex,
    editingSpans, selectedSpanIndex, showFormatView, showLinkView, editingLink,
    setShowAddModal, setTextInput, setEditingIndex, setSelectedSpanIndex,
    setShowFormatView, setShowLinkView, setEditingLink,
    loadWidgets, moveWidget, removeWidget, startEditing, saveWidgets, addTextWidget, addImageWidget,
    replaceEditingImage, saveEdit, toggleBoldForSelectedSpan, updateFontSizeForSelectedSpan,
    updateEditingText, openFormatView,
  } = useWidgetSection(adminPassword, feedName);

  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={updateStyles.scrollView}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loadError ? (
          <View style={updateStyles.errorContainer}>
            <Text style={updateStyles.errorText}>{loadError}</Text>
            <TouchableOpacity style={globalStyles.secondaryButton} onPress={() => loadWidgets(feedName)}>
              <Text style={globalStyles.secondaryButtonText}>Retry Load</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {editing && (
          <>
            <TouchableOpacity
              style={[updateStyles.saveButton, (!isDirty || isSaving) && updateStyles.disabledButton]}
              onPress={() => saveWidgets(feedName)}
              disabled={!isDirty || isSaving}
            >
              <Text style={updateStyles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={updateStyles.addWidgetButton} onPress={() => setShowAddModal(true)}>
              <MaterialIcons name="add" size={32} style={updateStyles.addWidgetIcon} />
              <Text style={updateStyles.addWidgetText}>Add Widget</Text>
            </TouchableOpacity>

            {saveError ? <Text style={updateStyles.errorText}>{saveError}</Text> : null}
          </>
        )}

        {widgets.map((widget, index) => (
          <View key={widget.id} style={updateStyles.widgetContainer}>
            {renderWidgetCard(widget, !editing && widget.link ? () => setWebViewUrl(widget.link!) : undefined)}
            {editing && (
              <View style={updateStyles.widgetControls}>
                <View style={updateStyles.arrowButtonsGroup}>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    style={[updateStyles.arrowButton, index === 0 && updateStyles.arrowButtonDisabled]}
                  >
                    <MaterialIcons name="arrow-upward" size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveWidget(index, 'down')}
                    disabled={index === widgets.length - 1}
                    style={[updateStyles.arrowButton, index === widgets.length - 1 && updateStyles.arrowButtonDisabled]}
                  >
                    <MaterialIcons name="arrow-downward" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={updateStyles.actionButtons}>
                  <TouchableOpacity style={updateStyles.iconButton} onPress={() => startEditing(index)}>
                    <MaterialIcons name="edit" size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={updateStyles.iconButton} onPress={() => removeWidget(index)}>
                    <MaterialIcons name="delete" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Widget Modal */}
      <Modal visible={showAddModal} transparent={true} animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>Add Widget</Text>

            <View style={infoStyles.addWidgetModalContent}>
              <Text style={infoStyles.widgetTypeLabel}>Text Widget</Text>
              <TextInput
                style={infoStyles.widgetTextInput}
                placeholder="Enter text content"
                multiline={true}
                value={textInput}
                onChangeText={setTextInput}
              />
              <TouchableOpacity style={globalStyles.primaryButton} onPress={addTextWidget}>
                <Text style={globalStyles.primaryButtonText}>Add Text</Text>
              </TouchableOpacity>
            </View>

            <View style={infoStyles.addWidgetModalContent}>
              <Text style={infoStyles.widgetTypeLabel}>Image Widget</Text>
              <TouchableOpacity style={globalStyles.primaryButton} onPress={addImageWidget}>
                <MaterialIcons name="image" size={24} color="#ffffff" />
                <Text style={globalStyles.primaryButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[globalStyles.secondaryButton, globalStyles.fullWidthButton]}
              onPress={() => { setShowAddModal(false); setTextInput(''); }}
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
        onRequestClose={() => {
          if (showFormatView) {
            setShowFormatView(false);
          } else if (showLinkView) {
            setShowLinkView(false);
          } else {
            setEditingIndex(null);
          }
        }}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContainer}>

            {/* FORMAT VIEW */}
            {showFormatView ? (
              <>
                <Text style={globalStyles.modalTitle}>Format Text</Text>
                <View style={infoStyles.addWidgetModalContent}>
                  <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', minHeight: 80 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {editingSpans.map((span, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedSpanIndex(i)}
                          style={{
                            paddingHorizontal: 4,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: selectedSpanIndex === i ? '#e3f2fd' : 'transparent',
                            borderWidth: selectedSpanIndex === i ? 1 : 0,
                            borderColor: selectedSpanIndex === i ? '#2196F3' : 'transparent',
                          }}
                        >
                          <Text style={{ fontWeight: span.bold ? 'bold' : 'normal', fontSize: span.fontSize ?? 14 }}>
                            {span.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {selectedSpanIndex !== null && selectedSpanIndex >= 0 && selectedSpanIndex < editingSpans.length ? (
                    <View style={{ marginBottom: 12 }}>
                      <TouchableOpacity
                        onPress={toggleBoldForSelectedSpan}
                        style={{
                          paddingVertical: 12,
                          backgroundColor: editingSpans[selectedSpanIndex]?.bold ? '#2196F3' : '#e0e0e0',
                          borderRadius: 8,
                          alignItems: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ fontWeight: 'bold', color: editingSpans[selectedSpanIndex]?.bold ? '#fff' : '#000' }}>
                          Bold
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        Font Size: {editingSpans[selectedSpanIndex]?.fontSize ?? 14}px
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                        {[12, 14, 16, 18, 20, 24].map(size => (
                          <TouchableOpacity
                            key={size}
                            onPress={() => updateFontSizeForSelectedSpan(size)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              backgroundColor: editingSpans[selectedSpanIndex]?.fontSize === size ? '#2196F3' : '#e0e0e0',
                              borderRadius: 6,
                              minWidth: 40,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 12, color: editingSpans[selectedSpanIndex]?.fontSize === size ? '#fff' : '#000' }}>
                              {size}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Tap a word above to format it.</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[globalStyles.primaryButton, globalStyles.fullWidthButton]}
                  onPress={() => setShowFormatView(false)}
                >
                  <Text style={globalStyles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
              </>

            ) : showLinkView ? (
              /* LINK VIEW */
              <>
                <Text style={globalStyles.modalTitle}>Add Link</Text>
                <View style={infoStyles.addWidgetModalContent}>
                  <Text style={infoStyles.widgetTypeLabel}>URL</Text>
                  <TextInput
                    style={[infoStyles.widgetTextInput, { marginBottom: 12 }]}
                    placeholder="https://..."
                    autoCapitalize="none"
                    autoFocus={true}
                    keyboardType="url"
                    value={editingLink}
                    onChangeText={setEditingLink}
                  />
                  {editingLink.trim() ? (
                    <TouchableOpacity
                      style={[globalStyles.secondaryButton, globalStyles.fullWidthButton, { marginBottom: 8 }]}
                      onPress={() => setEditingLink('')}
                    >
                      <Text style={globalStyles.secondaryButtonText}>Remove Link</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[globalStyles.primaryButton, globalStyles.fullWidthButton]}
                  onPress={() => setShowLinkView(false)}
                >
                  <Text style={globalStyles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
              </>

            ) : (
              /* EDIT VIEW */
              <>
                <Text style={globalStyles.modalTitle}>Edit Widget</Text>

                {editingIndex !== null && widgets[editingIndex]?.type === 'text' ? (
                  <View style={infoStyles.addWidgetModalContent}>
                    <Text style={infoStyles.widgetTypeLabel}>Text Editor</Text>
                    <TextInput
                      style={[infoStyles.widgetTextInput, { marginBottom: 12 }]}
                      placeholder="Edit text"
                      multiline={true}
                      value={editingSpans.map(s => s.text).join('')}
                      onChangeText={updateEditingText}
                    />
                    <TouchableOpacity
                      style={[globalStyles.primaryButton, { marginBottom: 8 }]}
                      onPress={openFormatView}
                    >
                      <Text style={globalStyles.primaryButtonText}>Format</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[editingLink.trim() ? globalStyles.primaryButton : globalStyles.secondaryButton, { marginBottom: 8 }]}
                      onPress={() => setShowLinkView(true)}
                    >
                      <Text style={editingLink.trim() ? globalStyles.primaryButtonText : globalStyles.secondaryButtonText}>
                        {editingLink.trim() ? 'Edit Link' : 'Add Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : editingIndex !== null && widgets[editingIndex]?.type === 'image' ? (
                  <View style={infoStyles.addWidgetModalContent}>
                    <Text style={infoStyles.widgetTypeLabel}>Image Widget</Text>
                    <TouchableOpacity
                      style={[globalStyles.primaryButton, { marginBottom: 8 }]}
                      onPress={replaceEditingImage}
                    >
                      <MaterialIcons name="image" size={24} color="#ffffff" />
                      <Text style={globalStyles.primaryButtonText}>Replace Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[editingLink.trim() ? globalStyles.primaryButton : globalStyles.secondaryButton, { marginBottom: 8 }]}
                      onPress={() => setShowLinkView(true)}
                    >
                      <Text style={editingLink.trim() ? globalStyles.primaryButtonText : globalStyles.secondaryButtonText}>
                        {editingLink.trim() ? 'Edit Link' : 'Add Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[globalStyles.secondaryButton, globalStyles.fullWidthButton, { marginTop: 8 }]}
                  onPress={() => setEditingIndex(null)}
                >
                  <Text style={globalStyles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.primaryButton, globalStyles.fullWidthButton, { marginTop: 8 }]}
                  onPress={saveEdit}
                >
                  <Text style={globalStyles.primaryButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>

      {/* WebView Modal */}
      <Modal
        visible={webViewUrl !== null}
        animationType="slide"
        onRequestClose={() => setWebViewUrl(null)}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ padding: 16, backgroundColor: '#ffffff', alignItems: 'flex-end', marginTop: 30 }}
            onPress={() => setWebViewUrl(null)}
          >
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          {webViewUrl && (
            <WebView source={{ uri: webViewUrl }} style={{ flex: 1 }} />
          )}
        </View>
      </Modal>
    </View>
  );
}


const generateWidgetId = () =>
  `widget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getPublicImageUrl = (value: string) => {
  if (value.startsWith('http')) return value;
  if (value.startsWith('/api-images/')) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/api-images/${value}`;
};

const normalizeWidgetFromServer = (item: any): Widget => {
  const id = item.id ?? generateWidgetId();

  if (item.type === 'image') {
    return { id, type: 'image', content: getPublicImageUrl(item.value), link: item.link };
  }

  if (Array.isArray(item.value)) {
    return { id, type: 'text', content: item.value, link: item.link };
  }

  return {
    id,
    type: 'text',
    content: [{ text: item.value, bold: false, fontSize: 14 }],
    link: item.link,
  };
};

const renderWidgetCard = (widget: Widget, onPress?: () => void) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
    style={updateStyles.widgetCard}
  >
    {widget.type === 'text' && Array.isArray(widget.content) ? (
      <Text style={updateStyles.widgetText}>
        {widget.content.map((span, i) => (
          <Text key={i} style={{ fontWeight: span.bold ? 'bold' : 'normal', fontSize: span.fontSize ?? 14 }}>
            {span.text}
          </Text>
        ))}
      </Text>
    ) : widget.type === 'image' && typeof widget.content === 'string' ? (
      <Image source={{ uri: widget.content }} style={updateStyles.widgetImage} contentFit="contain" />
    ) : null}
  </TouchableOpacity>
);