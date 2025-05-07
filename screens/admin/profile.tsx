import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/card';
import Button from '../../components/button';
import { useAuth } from '../../context/authContext';
import { logoutUser, updateUserProfile, getUserById } from '../../services/auth';
import { User } from '../../types/user';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const user = await getUserById(currentUser.id);
      setUserData(user);
      setFormData({
        displayName: user?.displayName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateUserProfile(currentUser.id, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
      });
      
      await loadUserData();
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logoutUser();
              // Navigation will be handled by the AuthContext
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.displayName?.charAt(0) || 'A'}
            </Text>
          </View>
          <Text style={styles.adminBadge}>Administrator</Text>
        </View>
        
        <Text style={styles.displayName}>{userData?.displayName}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
      </View>

      <Card style={styles.profileCard}>
        {editMode ? (
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(value) => setFormData({ ...formData, displayName: value })}
                placeholder="Your name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
                placeholder="Your email"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                placeholder="Your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => setFormData({ ...formData, address: value })}
                placeholder="Your address"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                type="secondary"
                onPress={() => {
                  setEditMode(false);
                  // Reset form data
                  setFormData({
                    displayName: userData?.displayName || '',
                    email: userData?.email || '',
                    phone: userData?.phone || '',
                    address: userData?.address || '',
                  });
                }}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                loading={loading}
              />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.profileInfo}>
              <Ionicons name="call-outline" size={20} color="#3498db" style={styles.infoIcon} />
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>
                  {userData?.phone || 'Not provided'}
                </Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Ionicons name="location-outline" size={20} color="#3498db" style={styles.infoIcon} />
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {userData?.address || 'Not provided'}
                </Text>
              </View>
            </View>

            <Button
              title="Edit Profile"
              type="secondary"
              onPress={() => setEditMode(true)}
              fullWidth
            />
          </View>
        )}
      </Card>

      <Card style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="notifications-outline" size={24} color="#34495e" style={styles.settingsIcon} />
          <Text style={styles.settingsText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="lock-closed-outline" size={24} color="#34495e" style={styles.settingsIcon} />
          <Text style={styles.settingsText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="help-circle-outline" size={24} color="#34495e" style={styles.settingsIcon} />
          <Text style={styles.settingsText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.settingsItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" style={styles.settingsIcon} />
          <Text style={[styles.settingsText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Cutlery Shop v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34495e',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#e74c3c',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  profileCard: {
    margin: 16,
  },
  formContainer: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#7f8c8d',
  },
  helperText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#34495e',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e74c3c',
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});

export default Profile;