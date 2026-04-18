import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { getRescues, deleteRescue, IMAGE_BASE_URL } from '@/services/api';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function RescuesScreen() {
  const [rescues, setRescues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ visible: false, type: 'success', title: '', message: '' });
  const router = useRouter();

  const showAlert = (type, title, message, onConfirm = null, onCancel = null) => {
    setAlertConfig({ visible: true, type, title, message, onConfirm: onConfirm || hideAlert, onCancel });
  };

  const hideAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const fetchRescues = async () => {
    try {
      const response = await getRescues();
      const activeRescues = response.data.data.filter(r => r.status !== 'Resolved');
      setRescues(activeRescues);
    } catch (error) {
      console.error('Error fetching rescues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRescues();
  }, []);

  const executeDelete = async (id) => {
    try {
      setLoading(true);
      await deleteRescue(id);
      fetchRescues();
      showAlert('deleted', 'Case Deleted', 'The rescue case has been permanently removed.');
    } catch (error) {
      showAlert('warning', 'Delete Failed', 'Failed to delete case.');
      setLoading(false);
    }
  };

  const handleDelete = (id, title) => {
    showAlert('confirm', 'Delete Permanently', `Are you sure you want to delete "${title}"? This action cannot be undone.`, 
      () => { hideAlert(); executeDelete(id); },
      hideAlert
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRescues();
  }, []);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => router.push(`/details/${item._id}`)}
    >
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: `${IMAGE_BASE_URL}${item.imageUrl}` }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaEmoji}>🐾</Text>
              <Text style={styles.metaText}>{item.animalType}</Text>
            </View>
            <View style={styles.metaBadge}>
              <IconSymbol name="map.fill" size={12} color={Colors.light.primary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.footer}>
            <Text style={styles.dateText}>
              {item.incidentDate 
                ? new Date(item.incidentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.cardDeleteButton} 
                onPress={() => handleDelete(item._id, item.title)}
              >
                <IconSymbol name="trash.fill" size={16} color={Colors.light.danger} />
              </TouchableOpacity>
              <View style={styles.readMore}>
                <Text style={styles.readMoreText}>View Case</Text>
                <IconSymbol name="chevron.right" size={14} color={Colors.light.primary} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[Colors.light.background, '#DBEAFE']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Welcome to</Text>
          <Text style={styles.headerTitle}>PawRescue</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/report')}
        >
          <IconSymbol name="plus.circle.fill" size={32} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rescues}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.light.primary} 
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <IconSymbol name="list.bullet" size={40} color={Colors.light.primary} />
            </View>
            <Text style={styles.emptyTitle}>No cases yet</Text>
            <Text style={styles.emptyText}>Be the hero and report the first rescue case in your area.</Text>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => router.push('/report')}
            >
              <LinearGradient
                colors={[Colors.light.primary, '#1d4ed8']}
                style={styles.reportButtonGradient}
              >
                <Text style={styles.reportButtonText}>Report a Case</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      <CustomAlert 
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.light.text,
    letterSpacing: -1.5,
    marginTop: -4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  profileButton: {
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  cardContainer: {
    marginBottom: Spacing.xl,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBF8FF',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#F0F9FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    ...Shadows.soft,
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardContent: {
    padding: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: Colors.light.text,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#D0E9FF',
  },
  metaEmoji: {
    fontSize: 13,
    marginRight: 5,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.icon,
    fontWeight: '700',
    maxWidth: width * 0.3,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EBF8FF',
    paddingTop: 14,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '800',
    marginRight: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDeleteButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 50,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  reportButton: {
    width: '100%',
    borderRadius: 99,
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  reportButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});
