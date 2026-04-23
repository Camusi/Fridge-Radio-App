import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { global as globalStyles } from '../styles/global';
import { info as infoStyles } from '../styles/info';

type Props = {
  visible: boolean;
  password: string;
  setPassword: (val: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function PasswordModal({ visible, password, setPassword, onCancel, onSubmit,}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={globalStyles.modalOverlay}>
        <View style={globalStyles.modalContainer}>
          <Text style={globalStyles.modalTitle}>Admin Access</Text>

          <TextInput
            style={infoStyles.passwordInput}
            placeholder="Enter admin password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
          />

          <View style={infoStyles.buttonRow}>
            <TouchableOpacity
              style={[
                globalStyles.secondaryButton,
                infoStyles.buttonRowItem,
                infoStyles.buttonRowFirst,
              ]}
              onPress={onCancel}
            >
              <Text style={globalStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                globalStyles.primaryButton,
                infoStyles.buttonRowItem,
                infoStyles.buttonRowLast,
              ]}
              onPress={onSubmit}
            >
              <Text style={globalStyles.primaryButtonText}>Enter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}