import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { diagnosticState, getDiagnosticSnapshot, DiagnosticState, getStartupMetrics } from '../services/diagnosticLogger';

// Componente per mostrare informazioni diagnostiche
const DiagnosticOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<DiagnosticState>(getDiagnosticSnapshot());
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Aggiorna lo stato ogni secondo
  useEffect(() => {
    const intervalId = setInterval(() => {
      setState(getDiagnosticSnapshot());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Se non ci sono errori e non è espanso, mostra solo l'indicatore
  if (!visible && !state.hasError) {
    return (
      <TouchableOpacity
        style={styles.indicator}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.indicatorText}>D</Text>
      </TouchableOpacity>
    );
  }

  // Se non è visibile ma c'è un errore, mostra l'indicatore con alert
  if (!visible && state.hasError) {
    return (
      <TouchableOpacity
        style={[styles.indicator, styles.indicatorError]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.indicatorText}>!</Text>
      </TouchableOpacity>
    );
  }

  const metrics = getStartupMetrics();
  const upTimeSeconds = Math.floor((Date.now() - state.appStartupTime) / 1000);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const refreshData = () => {
    setState(getDiagnosticSnapshot());
    setRefreshKey(refreshKey + 1);
  };

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Diagnostic Mode</Text>
        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Riepilogo stato */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>STATO APP</Text>
          <Text>Uptime: {upTimeSeconds} sec</Text>
          <Text>Errori totali: {state.errorCount}</Text>
          <Text>Firebase: {state.firebaseInitialized ? '✅ OK' : '❌ NON INIZIALIZZATO'}</Text>
          <Text>API: {state.isConnected ? '✅ CONNESSO' : '❌ NON CONNESSO'}</Text>
        </View>

        {/* Sezione errori */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('errors')}
        >
          <Text style={styles.sectionHeaderText}>
            {expandedSection === 'errors' ? '▼' : '▶'} ERRORI ({state.errorLog.length})
          </Text>
        </TouchableOpacity>
        
        {expandedSection === 'errors' && (
          <View style={styles.sectionContent}>
            {state.errorLog.length > 0 ? (
              state.errorLog.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Text style={styles.errorType}>{error.type}</Text>
                  <Text style={styles.errorMessage}>{error.message}</Text>
                  <Text style={styles.errorTimestamp}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </Text>
                  {error.stack && <Text style={styles.errorStack}>{error.stack}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>Nessun errore registrato</Text>
            )}
          </View>
        )}
        
        {/* Sezione device info */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('device')}
        >
          <Text style={styles.sectionHeaderText}>
            {expandedSection === 'device' ? '▼' : '▶'} DEVICE INFO
          </Text>
        </TouchableOpacity>
        
        {expandedSection === 'device' && (
          <View style={styles.sectionContent}>
            <Text>Platform: {state.deviceInfo.platform}</Text>
            <Text>Version: {state.deviceInfo.version}</Text>
            <Text>Device: {state.deviceInfo.deviceName || 'N/A'}</Text>
          </View>
        )}
        
        {/* Ultimo errore */}
        {state.lastError && (
          <View style={styles.lastErrorSection}>
            <Text style={styles.sectionTitle}>ULTIMO ERRORE</Text>
            <Text style={styles.lastErrorMessage}>
              {state.lastError.message}
            </Text>
            <Text style={styles.lastErrorStack}>
              {state.lastError.stack}
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Text style={styles.refreshButtonText}>Aggiorna dati</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#333',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  statusSection: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionHeader: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  sectionHeaderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionContent: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6347',
  },
  errorType: {
    color: '#ff6347',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorMessage: {
    color: 'white',
    marginBottom: 4,
  },
  errorTimestamp: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  errorStack: {
    color: '#ddd',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 6,
  },
  lastErrorSection: {
    backgroundColor: '#400',
    padding: 12,
    borderRadius: 6,
    marginVertical: 10,
  },
  lastErrorMessage: {
    color: '#ff9999',
    marginBottom: 6,
  },
  lastErrorStack: {
    color: '#ddd',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyMessage: {
    color: '#999',
    fontStyle: 'italic',
  },
  indicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 100, 200, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  indicatorError: {
    backgroundColor: 'rgba(200, 30, 30, 0.8)',
  },
  indicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  refreshButton: {
    backgroundColor: '#3a6ea5',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DiagnosticOverlay; 