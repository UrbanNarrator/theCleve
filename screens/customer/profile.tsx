import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/card';
import Button from '../../components/button';
import { useAuth } from '../../context/authContext';
import { useNetInfo } from '../../context/netinfoContext';
import { logoutUser, updateUserProfile, getUserById } from '../../services/auth';
import { User } from '../../types/user';

const Profile: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser, isOffline, retryConnection } = useAuth();
  const { isConnected } = useNetInfo();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  // Reload data when connection is restored
  useEffect(() => {
    if (isConnected && loadError) {
      console.log('Connection restored, reloading profile data...');
      loadUserData();
    }
  }, [isConnected]);

  const loadUserData = async () => {
    if (!currentUser) return;

    setLoading(true);
    setLoadError(null);
    
    try {
      // Try to fetch full user data from Firestore
      const user = await getUserById(currentUser.id);
      setUserData(user);
      setFormData({
        displayName: user?.displayName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
      });
    } catch (error: any) {
      console.error('Error loading user data:', error);
      
      // Check if it's an offline error
      if (error.message && (
          error.message.includes('offline') || 
          error.message.includes('network') ||
          error.message.includes('failed to get document')
      )) {
        setLoadError('Unable to load complete profile while offline');
        
        // Use basic user data from auth context as fallback
        setUserData({
          id: currentUser.id,
          email: currentUser.email,
          displayName: currentUser.displayName,
          role: currentUser.role || 'customer',
          createdAt: currentUser.createdAt || new Date(),
        });
        
        setFormData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: '',
          address: '',
        });
      } else {
        setLoadError(`Failed to load profile: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    // Don't allow updates while offline
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'You cannot update your profile while offline. Please connect to the internet and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

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
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Specific error for offline scenarios
      if (error.message && (
          error.message.includes('offline') || 
          error.message.includes('network')
      )) {
        Alert.alert('Connection Error', 'Cannot update profile while offline. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to update profile: ' + error.message);
      }
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
          <Text style={styles.offlineText}>You're offline. Some profile data may be limited.</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={retryConnection}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {loadError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity 
            style={styles.errorRetryButton} 
            onPress={loadUserData}
          >
            <Text style={styles.errorRetryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.displayName?.charAt(0) || 'C'}
          </Text>
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
                disabled={isOffline}
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
              disabled={isOffline}
            />
            {isOffline && (
              <Text style={styles.editDisabledText}>
                Editing is disabled while offline
              </Text>
            )}
          </View>
        )}
      </Card>

      <Card style={styles.ordersCard}>
        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => navigation.navigate('Orders' as never)}
        >
          <Ionicons name="receipt-outline" size={24} color="#34495e" style={styles.ordersIcon} />
          <Text style={styles.ordersText}>My Orders</Text>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
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
  ordersCard: {
    margin: 16,
    marginTop: 0,
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  ordersIcon: {
    marginRight: 12,
  },
  ordersText: {
    flex: 1,
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
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    padding: 10,
    paddingHorizontal: 15,
  },
  offlineText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7f7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#facaca',
  },
  errorText: {
    color: '#e74c3c',
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  errorRetryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  errorRetryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editDisabledText: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
  },
});

export default Profile;