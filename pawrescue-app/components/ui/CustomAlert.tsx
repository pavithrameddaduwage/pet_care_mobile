import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { Colors, Shadows } from '@/constants/theme';

export type AlertType = 'success' | 'updated' | 'deleted' | 'warning' | 'confirm';

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ 
  visible, 
  type, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  const getAlertStyle = () => {
    switch (type) {
      case 'success': return { color: Colors.light.success, icon: 'checkmark.circle.fill' as const };
      case 'updated': return { color: Colors.light.primary, icon: 'checkmark.circle.fill' as const };
      case 'deleted': return { color: Colors.light.danger, icon: 'trash.fill' as const };
      case 'warning': return { color: Colors.light.accent, icon: 'info.circle' as const };
      case 'confirm': return { color: Colors.light.danger, icon: 'info.circle' as const };
      default: return { color: Colors.light.primary, icon: 'info.circle' as const };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.iconCircle, { backgroundColor: alertStyle.color + '20' }]}>
            <IconSymbol name={alertStyle.icon} size={36} color={alertStyle.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actionRow}>
            {(type === 'confirm' || onCancel) && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                { backgroundColor: alertStyle.color },
                !onCancel && type !== 'confirm' && { flex: 1 } // Full width if it's just an OK button
              ]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {type === 'confirm' ? 'Delete' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Shadows.medium,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 99,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A5568',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});
