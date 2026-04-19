import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DatePicker from 'react-native-date-picker';
import { createRescue } from '@/services/api';
import MapView, { Marker } from '@/components/MapView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Toast } from '@/components/ui/Toast';
import { Colors, Shadows, Spacing } from '@/constants/theme';

export default function ReportScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    animalType: '',
    location: '',
    incidentDate: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerCoords, setMarkerCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    let newErrors: any = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.incidentDate) newErrors.incidentDate = 'Date & Time is required';
    if (!formData.animalType) newErrors.animalType = 'Animal type is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.location) newErrors.location = 'Location description is required';
    if (!image) newErrors.image = 'An evidence photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your gallery to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      if (errors.image) setErrors({ ...errors, image: null });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleMapPress = (e: any) => {
    setMarkerCoords(e.nativeEvent.coordinate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const options: any = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    setFormData({ ...formData, incidentDate: formattedDate });
    if (errors.incidentDate) setErrors({ ...errors, incidentDate: null });
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please fix the errors before submitting.');
      return;
    }

    setLoading(true);
    const postData = new FormData();
    postData.append('title', formData.title);
    postData.append('description', formData.description);
    postData.append('animalType', formData.animalType);
    postData.append('location', formData.location);
    postData.append('incidentDate', formData.incidentDate);
    
    if (markerCoords) {
      postData.append('coordinates', JSON.stringify(markerCoords));
    }

    if (image) {
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(image.uri);
          const blob = await response.blob();
          postData.append('image', blob, 'upload.jpg');
        } catch (err) {
          console.error('Failed to fetch blob for image:', err);
        }
      } else {
        const filename = image.uri.split('/').pop();
        const match = /\.(\.w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        postData.append('image', {
          uri: image.uri,
          name: filename || 'upload.jpg',
          type: type,
        } as any);
      }
    }

    try {
      const response = await createRescue(postData);
      console.log('Rescue case created successfully:', response.data);
      
      // Show success modal with confirmation
      setShowSuccessModal(true);
      
      // Navigate after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace('/');
      }, 3000);
    } catch (error: any) {
      console.error('❌ Error reporting case:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setToastMessage(errorMessage);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, field: keyof typeof formData, placeholder: string, iconName: any, multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, errors[field] && styles.errorLabel]}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.errorInputWrapper]}>
        <IconSymbol name={iconName} size={20} color="#A0AEC0" style={[styles.inputIcon, multiline && styles.inputIconMultiline]} />
        <TextInput 
          style={[styles.inputField, multiline && styles.textArea]} 
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          value={formData[field]}
          onChangeText={(val) => handleInputChange(field, val)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Case</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.decorativeCircles}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Animal Information</Text>
            {renderInput('Case Title', 'title', 'e.g., Injured Cat near Central Park', 'pencil')}
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, errors.incidentDate && styles.errorLabel]}>Date & Time</Text>
              <TouchableOpacity 
                style={[styles.datePickerButton, errors.incidentDate && styles.errorInputWrapper]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <IconSymbol name="calendar" size={20} color={Colors.light.primary} />
                <View style={styles.datePickerContent}>
                  <Text style={styles.datePickerLabel}>
                    {formData.incidentDate || 'Select date and time'}
                  </Text>
                  <Text style={styles.datePickerTime}>
                    System time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#A0AEC0" />
              </TouchableOpacity>
              {errors.incidentDate && <Text style={styles.errorText}>{errors.incidentDate}</Text>}
            </View>

            {renderInput('Animal Type', 'animalType', 'e.g., Dog, Cat, Bird...', 'paw')}
            {renderInput('Situation Details', 'description', 'Describe the situation and animal condition...', 'list.bullet', true)}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            {renderInput('Address / Landmark', 'location', 'Enter nearby landmarks or approximate address', 'map.fill')}
            
            <Text style={styles.label}>Select on Map (Optional)</Text>
            <View style={styles.mapFrame}>
              <MapView
                style={styles.map}
                initialRegion={region}
                onPress={handleMapPress}
              >
                {markerCoords && <Marker coordinate={markerCoords} />}
              </MapView>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Visual Evidence</Text>
            <TouchableOpacity 
              style={[
                styles.imagePicker, 
                errors.image && styles.errorImagePicker
              ]} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {image && image.uri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.imageOverlay}>
                    <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.plusIconCircle}>
                    <IconSymbol name="plus.circle.fill" size={32} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.imagePlaceholderTitle}>Upload Photo</Text>
                  <Text style={styles.imagePlaceholderSubtitle}>Click to capture or select from gallery</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorTextCenter}>{errors.image}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[Colors.light.primary, '#1d4ed8']}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Rescue Report</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date & Time</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <IconSymbol name="xmark.circle.fill" size={28} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerBody}>
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  mode="datetime"
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.datePickerFooter}>
                <TouchableOpacity 
                  style={styles.cancelButtonModal}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButtonModal}
                  onPress={() => handleDateSelect(selectedDate)}
                >
                  <LinearGradient
                    colors={[Colors.light.primary, '#1d4ed8']}
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={2500}
        onHide={() => setToastVisible(false)}
      />

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <BlurView intensity={90} style={styles.blurContainer}>
          <View style={styles.successModalContainer}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Case Reported Successfully!</Text>
              <Text style={styles.successMessage}>
                Your rescue case has been added to the dashboard. Our volunteers will help shortly.
              </Text>
              <View style={styles.loadingBar}>
                <LinearGradient
                  colors={[Colors.light.primary, '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loadingBarFill}
                />
              </View>
              <Text style={styles.redirectingText}>Redirecting to dashboard...</Text>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -50,
    backgroundColor: '#fff',
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  formSection: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.light.cardBackground,
    padding: Spacing.md,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 24,
    borderLeftWidth: 7,
    borderLeftColor: Colors.light.primary,
    paddingLeft: 18,
    letterSpacing: -0.7,
    lineHeight: 28,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  errorLabel: {
    color: Colors.light.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7FF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  errorInputWrapper: {
    borderColor: Colors.light.danger,
    backgroundColor: '#FFFBFB',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconMultiline: {
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  inputField: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  errorTextCenter: {
    color: Colors.light.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  mapFrame: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePicker: {
    marginTop: 12,
    height: 260,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    borderStyle: 'dashed',
    borderWidth: 2.5,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  errorImagePicker: {
    borderColor: Colors.light.danger,
    backgroundColor: '#FFF5F5',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 22,
  },
  plusIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  imagePlaceholderTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  imagePlaceholderSubtitle: {
    fontSize: 14,
    color: Colors.light.primary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 14,
    marginTop: 32,
    marginBottom: 40,
  },
  submitGradient: {
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 66,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  datePickerTime: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  datePickerBody: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  datePickerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  cancelButtonModal: {
    flex: 1,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  confirmButtonModal: {
    flex: 1,
    borderRadius: 99,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  successModalContainer: {
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 44,
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.32,
    shadowRadius: 40,
    elevation: 16,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    fontSize: 56,
    fontWeight: '900',
    color: '#059669',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  successMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 26,
    fontWeight: '500',
  },
  loadingBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loadingBarFill: {
    height: '100%',
    width: '100%',
  },
  redirectingText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

