import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Fallback MapView component for web
const MapViewComponent = ({ style, children, onPress }: any) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapFallback}>
        <Text style={styles.text}>Map view not available on web</Text>
        <Text style={styles.subtitle}>Use the location text field instead</Text>
      </View>
      {children}
    </View>
  );
};

export const Marker = ({ coordinate }: any) => {
  return (
    <View style={styles.marker}>
      <Text>📍</Text>
    </View>
  );
};

export default MapViewComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  marker: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
