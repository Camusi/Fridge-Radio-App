import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config.local';
import * as Crypto from 'expo-crypto';
import { WidgetSection } from '../app/components/WidgetSection';
import { PasswordModal } from '../app/components/PasswordModal';
import { updates as updateStyles } from './styles/updates';


export default function UpdatesScreen() {
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [editing, setediting] = useState(false);


  // Checks password by calling /check-password API
  const checkPassword = async (passwordHash: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ passwordHash }),
    });

    return await response.json() === true;
  } catch {
    return false;
  }
};

  const handlePasswordSubmit = async () => {
    var hash = ""
    if (!adminPassword) {
      hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, passwordInput)
    } else {
      hash = adminPassword
    }
    const isValid = await checkPassword(hash);
    if (isValid) {
      setAdminPassword(hash);
      setShowPasswordModal(false);
    } 

    setPasswordInput('');
  };

  return (
    <View style={updateStyles.container}>
      <View style={updateStyles.card}>

        <View style={updateStyles.updatesHeader}>
          {/* Admin Button */}
          <TouchableOpacity
            style={[
              updateStyles.adminButton,
              adminPassword ? updateStyles.adminButtonActive : updateStyles.adminButtonInactive,
            ]}
            onPress={() => {
              if (!adminPassword) {
                setShowPasswordModal(true);
              }
            }}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#61616188" />
          </TouchableOpacity>

          <Text style={updateStyles.title}>Updates</Text>

          {/* Edit Button */}
          { adminPassword &&
            <TouchableOpacity
              style={[
                updateStyles.editButton,
                editing ? updateStyles.editButtonActive : updateStyles.editButtonInactive,
              ]}
              onPress={() => {
                if (!editing) {
                  setediting(true)
                } else {
                  setediting(false)
                }
              }}
            >
              <MaterialIcons name="edit" size={20} color="#61616188" />
            </TouchableOpacity>
          }
        </View>
        <WidgetSection editing={editing} adminPassword={adminPassword}></WidgetSection>
      </View>

      <PasswordModal visible={showPasswordModal} password={passwordInput} setPassword={setPasswordInput}
        onCancel={() => { setShowPasswordModal(false); setPasswordInput(''); }}
        onSubmit={handlePasswordSubmit}
      />
    </View>
  );
}
