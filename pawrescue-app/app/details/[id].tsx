import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  ActionSheetIOS,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker } from '@/components/MapView';
import { LinearGradient } from 'expo-linear-gradient';
import { getRescue, updateRescue, deleteRescue, IMAGE_BASE_URL } from '@/services/api';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { Toast } from '@/components/ui/Toast';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [rescue, setRescue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<any>({ visible: false, type: 'success', title: '', message: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  const showAlert = (type, title, message, onConfirm = null, onCancel = null) => {
    setAlertConfig({ visible: true, type, title, message, onConfirm: onConfirm || hideAlert, onCancel });
  };

  const hideAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const fetchRescueDetail = async () => {
    try {
      const response = await getRescue(id);
      setRescue(response.data.data);
    } catch (error) {
      console.error('Error fetching rescue detail:', error);
      showAlert('warning', 'Error', 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRescueDetail();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reported': return Colors.light.danger;
      case 'Rescued': return Colors.light.primary;
      case 'Recovering': return Colors.light.accent;
      case 'Adopted': return Colors.light.success;
      case 'Resolved': return '#718096';
      default: return Colors.light.icon;
    }
  };

  const handleUpdateStatus = () => {
    const statuses = ['Reported', 'Rescued', 'Recovering', 'Adopted', 'Resolved'];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...statuses],
          cancelButtonIndex: 0,
          title: 'Update Case Status',
        },
        async (buttonIndex) => {
          if (buttonIndex > 0) {
            updateStatus(statuses[buttonIndex - 1]);
          }
        }
      );
    } else {
      Alert.alert(
        'Update Status',
        'Select new status:',
        statuses.map(s => ({
          text: s,
          onPress: () => updateStatus(s)
        }))
      );
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      await updateRescue(id, { status: newStatus });
      fetchRescueDetail();
      setToastMessage(`Status updated to ${newStatus} ✅`);
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Error updating status:', error);
      setToastMessage('Failed to update status. Please try again.');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    try {
      setLoading(true);
      await deleteRescue(id);
      setToastMessage('Case deleted successfully ✅');
      setToastType('success');
      setToastVisible(true);
      
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (error) {
      console.error('Error deleting case:', error);
      setToastMessage('Failed to delete case. Please try again.');
      setToastType('error');
      setToastVisible(true);
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert('confirm', 'Delete Permanently', 'Are you sure you want to delete this rescue case? This action cannot be undone.', 
      () => { hideAlert(); executeDelete(); },
      hideAlert
    );
  };

  if (loading && !rescue) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!rescue) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ 
        headerShown: false
      }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: `${IMAGE_BASE_URL}${rescue.imageUrl}` }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleButton}>
              <IconSymbol name="chevron.left" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/edit/${id}`)} style={styles.circleButton}>
              <IconSymbol name="pencil" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.imageContent}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rescue.status) }]}>
              <Text style={styles.statusText}>{rescue.status}</Text>
            </View>
            <Text style={styles.title}>{rescue.title}</Text>
            <View style={styles.animalTypeBadge}>
              <Text style={styles.animalTypeText}>🐾 {rescue.animalType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.indicator} />
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Reported</Text>
              <Text style={styles.statValue}>
                {new Date(rescue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Location</Text>
              <Text style={styles.statValue} numberOfLines={1}>{rescue.location}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>The Situation</Text>
          <Text style={styles.description}>{rescue.description}</Text>

          <Text style={styles.sectionTitle}>Map View</Text>
          {rescue.coordinates ? (
            <View style={styles.mapFrame}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: rescue.coordinates.latitude,
                  longitude: rescue.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={rescue.coordinates} />
              </MapView>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.1)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            <View style={styles.noMap}>
              <IconSymbol name="map.fill" size={32} color="#CBD5E0" />
              <Text style={styles.noMapText}>No precise location coordinates provided.</Text>
            </View>
          )}

          <View style={styles.actions}>
            {rescue.status !== 'Resolved' && (
              <TouchableOpacity style={styles.resolveButton} onPress={() => updateStatus('Resolved')}>
                <LinearGradient
                  colors={[Colors.light.success, '#15803d']}
                  style={styles.buttonGradientResolve}
                >
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                  <Text style={styles.resolveButtonText}>Case Resolved</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStatus}>
              <LinearGradient
                colors={[Colors.light.primary, '#1d4ed8']}
                style={styles.buttonGradient}
              >
                <Text style={styles.updateButtonText}>Status</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <IconSymbol name="trash.fill" size={20} color={Colors.light.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <CustomAlert 
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={2500}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: height * 0.55,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F0F9FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topActions: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  imageContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  statusText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 14,
    lineHeight: 42,
    letterSpacing: -1,
  },
  animalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  animalTypeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.3,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: height * 0.5,
  },
  indicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 18,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 26,
    marginBottom: 32,
    fontWeight: '500',
  },
  mapFrame: {
    height: 200,
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
    ...Shadows.medium,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMap: {
    height: 100,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderStyle: 'dashed',
  },
  noMapText: {
    color: '#A0AEC0',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 14,
    marginTop: 28,
  },
  updateButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  resolveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGradientResolve: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
