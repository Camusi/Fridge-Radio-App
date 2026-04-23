import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PasswordModal } from './components/PasswordModal';
import { WidgetSection } from './components/WidgetSection';
import { useGlobalContext } from './context/context';
import { info as infoStyles } from './styles/info'
import { checkPassword, hashPassword } from './util/passwordCheck';


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
    <View style={infoStyles.container}>
      <View style={infoStyles.card}>

        <View style={infoStyles.infoHeader}>
          {/* Admin Button */}
          <TouchableOpacity
            style={[
              infoStyles.adminButton,
              adminPassword ? infoStyles.adminButtonActive : infoStyles.adminButtonInactive,
            ]}
            onPress={() => {
              if (!adminPassword) {
                setShowPasswordModal(true);
              }
            }}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#61616188" />
          </TouchableOpacity>

          <Text style={infoStyles.title}>Info</Text>

          {/* Edit Button */}
          { adminPassword &&
            <TouchableOpacity
              style={[
                infoStyles.editButton,
                editing ? infoStyles.editButtonActive : infoStyles.editButtonInactive,
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
        <WidgetSection editing={editing} adminPassword={adminPassword} feedName={'info'}></WidgetSection>
      </View>

      <PasswordModal visible={showPasswordModal} password={passwordInput} setPassword={setPasswordInput}
        onCancel={() => { setShowPasswordModal(false); setPasswordInput(''); }}
        onSubmit={handlePasswordSubmit}
      />
    </View>
  );
}