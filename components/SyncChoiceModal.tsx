import React from 'react';
import { Modal, View, Text, Button, StyleSheet, Pressable } from 'react-native';
import { useApp } from '@/contexts/AppContext';

const SyncChoiceModal = () => {
  const { syncChoice, resolveSyncChoice } = useApp();

  if (!syncChoice.needed) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={syncChoice.needed}
      onRequestClose={() => resolveSyncChoice('cancel')}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Dropbox Sync</Text>
          <Text style={styles.modalText}>
            Ein Backup in Ihrer Dropbox wurde gefunden. Möchten Sie die lokalen Daten mit den Daten aus der Dropbox überschreiben oder umgekehrt?
          </Text>
          <View style={styles.buttonContainer}>
            <Pressable style={[styles.button, styles.buttonLocal]} onPress={() => resolveSyncChoice('local')}>
              <Text style={styles.buttonText}>Lokale Daten hochladen</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonRemote]} onPress={() => resolveSyncChoice('remote')}>
              <Text style={styles.buttonText}>Aus Dropbox laden</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonCancel]} onPress={() => resolveSyncChoice('cancel')}>
              <Text style={styles.buttonText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    marginBottom: 10,
  },
  buttonLocal: {
    backgroundColor: '#2196F3',
  },
  buttonRemote: {
    backgroundColor: '#4CAF50',
  },
  buttonCancel: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default SyncChoiceModal;
