import { updates as updateStyles } from './styles/updates';
import { Text, TouchableOpacity, View } from 'react-native';
import { PasswordModal } from '../app/components/PasswordModal';
import { WidgetSection } from '../app/components/WidgetSection';
import { checkPassword, hashPassword } from './util/passwordCheck';
import { useGlobalContext } from '../app/context/context';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';


export default function InfoScreen() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editing, setediting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const { adminPassword, setAdminPassword } = useGlobalContext();

  const handlePasswordSubmit = async () => {
      let hash = '';
  
      if (!adminPassword) {
        hash = await hashPassword(passwordInput);
      } else {
        hash = adminPassword;
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

          <Text style={updateStyles.title}>Info</Text>

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