import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Plus,
  Zap,
  Flame,
  Droplets,
  Thermometer,
  Phone,
  Mail,
  Globe,
  Edit3,
  Trash2,
  X,
  Euro,
  Calendar,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { EnergyProvider } from '@/types/energy';
import { ENERGY_PROVIDERS_DATA, ProviderInfo } from '@/constants/languages';

export default function EnergyProvidersScreen() {
  const { energyProviders, addEnergyProvider, updateEnergyProvider, removeEnergyProvider, language } = useApp();
  const { colors } = useTheme();
  const t = useTranslation(language);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EnergyProvider | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'electricity' as EnergyProvider['type'],
    contractNumber: '',
    tariff: '',
    pricePerUnit: '',
    basicFee: '',
    phone: '',
    email: '',
    website: '',
    assignedDevices: [] as string[],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);

  const getProviderIcon = (type: EnergyProvider['type']) => {
    switch (type) {
      case 'electricity':
        return <Zap color="#F59E0B" size={24} />;
      case 'gas':
        return <Flame color="#EF4444" size={24} />;
      case 'water':
        return <Droplets color="#3B82F6" size={24} />;
      case 'heating':
        return <Thermometer color="#F97316" size={24} />;
      default:
        return <Building2 color="#6B7280" size={24} />;
    }
  };

  const getProviderTypeLabel = (type: EnergyProvider['type']) => {
    switch (type) {
      case 'electricity':
        return 'Strom';
      case 'gas':
        return 'Gas';
      case 'water':
        return 'Wasser';
      case 'heating':
        return 'Heizung';
      default:
        return 'Unbekannt';
    }
  };

  const handleAddProvider = () => {
    if (!newProvider.name.trim() || !newProvider.contractNumber.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const pricePerUnit = parseFloat(newProvider.pricePerUnit.replace(',', '.')) || 0;
    const basicFee = parseFloat(newProvider.basicFee.replace(',', '.')) || 0;

    addEnergyProvider({
      name: newProvider.name,
      type: newProvider.type,
      contractNumber: newProvider.contractNumber,
      tariff: newProvider.tariff,
      pricePerUnit,
      basicFee,
      validFrom: new Date(),
      contact: {
        phone: newProvider.phone || undefined,
        email: newProvider.email || undefined,
        website: newProvider.website || undefined,
      },
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditProvider = (provider: EnergyProvider) => {
    setEditingProvider(provider);
    setNewProvider({
      name: provider.name,
      type: provider.type,
      contractNumber: provider.contractNumber,
      tariff: provider.tariff,
      pricePerUnit: provider.pricePerUnit.toString(),
      basicFee: provider.basicFee.toString(),
      phone: provider.contact.phone || '',
      email: provider.contact.email || '',
      website: provider.contact.website || '',
      assignedDevices: [],
    });
    setShowAddModal(true);
  };

  const handleUpdateProvider = () => {
    if (!editingProvider || !newProvider.name.trim() || !newProvider.contractNumber.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const pricePerUnit = parseFloat(newProvider.pricePerUnit.replace(',', '.')) || 0;
    const basicFee = parseFloat(newProvider.basicFee.replace(',', '.')) || 0;

    updateEnergyProvider(editingProvider.id, {
      name: newProvider.name,
      type: newProvider.type,
      contractNumber: newProvider.contractNumber,
      tariff: newProvider.tariff,
      pricePerUnit,
      basicFee,
      contact: {
        phone: newProvider.phone || undefined,
        email: newProvider.email || undefined,
        website: newProvider.website || undefined,
      },
    });

    setEditingProvider(null);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteProvider = (provider: EnergyProvider) => {
    Alert.alert(
      'Anbieter löschen',
      `Möchten Sie den Anbieter "${provider.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => removeEnergyProvider(provider.id),
        },
      ]
    );
  };

  const resetForm = () => {
    setNewProvider({
      name: '',
      type: 'electricity',
      contractNumber: '',
      tariff: '',
      pricePerUnit: '',
      basicFee: '',
      phone: '',
      email: '',
      website: '',
      assignedDevices: [],
    });
    setSearchQuery('');
    setShowProviderSuggestions(false);
  };

  const handleProviderNameChange = (text: string) => {
    setSearchQuery(text);
    setNewProvider({ ...newProvider, name: text });
    setShowProviderSuggestions(text.length > 0);
  };

  const selectProviderSuggestion = (provider: ProviderInfo) => {
    setNewProvider({
      ...newProvider,
      name: provider.name,
      phone: provider.phone || '',
      email: provider.email || '',
      website: provider.website || '',
      type: provider.types[0] || 'electricity',
    });
    setSearchQuery(provider.name);
    setShowProviderSuggestions(false);
  };

  const filteredProviders = ENERGY_PROVIDERS_DATA.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProviderCard = (provider: EnergyProvider) => (
    <View key={provider.id} style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.providerIcon}>
          {getProviderIcon(provider.type)}
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerType}>{getProviderTypeLabel(provider.type)}</Text>
        </View>
        <View style={styles.providerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditProvider(provider)}
          >
            <Edit3 color="#6B7280" size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProvider(provider)}
          >
            <Trash2 color="#EF4444" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contractInfo}>
        <View style={styles.contractRow}>
          <Text style={styles.contractLabel}>Vertragsnummer:</Text>
          <Text style={styles.contractValue}>{provider.contractNumber}</Text>
        </View>
        <View style={styles.contractRow}>
          <Text style={styles.contractLabel}>Tarif:</Text>
          <Text style={styles.contractValue}>{provider.tariff}</Text>
        </View>
        <View style={styles.contractRow}>
          <Text style={styles.contractLabel}>Preis pro Einheit:</Text>
          <Text style={styles.contractValue}>{provider.pricePerUnit.toFixed(2)} €</Text>
        </View>
        <View style={styles.contractRow}>
          <Text style={styles.contractLabel}>Grundgebühr:</Text>
          <Text style={styles.contractValue}>{provider.basicFee.toFixed(2)} €/Monat</Text>
        </View>
      </View>

      {(provider.contact.phone || provider.contact.email || provider.contact.website) && (
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Kontakt:</Text>
          {provider.contact.phone && (
            <View style={styles.contactRow}>
              <Phone color="#6B7280" size={16} />
              <Text style={styles.contactText}>{provider.contact.phone}</Text>
            </View>
          )}
          {provider.contact.email && (
            <View style={styles.contactRow}>
              <Mail color="#6B7280" size={16} />
              <Text style={styles.contactText}>{provider.contact.email}</Text>
            </View>
          )}
          {provider.contact.website && (
            <View style={styles.contactRow}>
              <Globe color="#6B7280" size={16} />
              <Text style={styles.contactText}>{provider.contact.website}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingProvider ? 'Anbieter bearbeiten' : 'Neuen Anbieter hinzufügen'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAddModal(false);
              setEditingProvider(null);
              resetForm();
            }}
          >
            <X color="#6B7280" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Anbietername *</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.name}
              onChangeText={handleProviderNameChange}
              placeholder="z.B. Stadtwerke Berlin"
              placeholderTextColor="#9CA3AF"
            />
            {showProviderSuggestions && filteredProviders.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredProviders.slice(0, 5).map((provider) => (
                  <TouchableOpacity
                    key={provider.name}
                    style={styles.suggestionItem}
                    onPress={() => selectProviderSuggestion(provider)}
                  >
                    <Text style={styles.suggestionText}>{provider.name}</Text>
                    <Text style={styles.suggestionSubtext}>
                      {provider.types.map(t => 
                        t === 'electricity' ? 'Strom' :
                        t === 'gas' ? 'Gas' :
                        t === 'water' ? 'Wasser' :
                        'Heizung'
                      ).join(', ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Typ</Text>
            <View style={styles.typeSelector}>
              {(['electricity', 'gas', 'water', 'heating'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newProvider.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewProvider({ ...newProvider, type })}
                >
                  {getProviderIcon(type)}
                  <Text
                    style={[
                      styles.typeButtonText,
                      newProvider.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {getProviderTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vertragsnummer *</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.contractNumber}
              onChangeText={(text) => setNewProvider({ ...newProvider, contractNumber: text })}
              placeholder="z.B. SW-2023-001234"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tarif</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.tariff}
              onChangeText={(text) => setNewProvider({ ...newProvider, tariff: text })}
              placeholder="z.B. Ökostrom Plus"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Preis pro Einheit (€)</Text>
              <TextInput
                style={styles.textInput}
                value={newProvider.pricePerUnit}
                onChangeText={(text) => setNewProvider({ ...newProvider, pricePerUnit: text })}
                placeholder="0.32"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Grundgebühr (€/Monat)</Text>
              <TextInput
                style={styles.textInput}
                value={newProvider.basicFee}
                onChangeText={(text) => setNewProvider({ ...newProvider, basicFee: text })}
                placeholder="12.50"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Kontaktinformationen (optional)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.phone}
              onChangeText={(text) => setNewProvider({ ...newProvider, phone: text })}
              placeholder="+49 30 12345678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-Mail</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.email}
              onChangeText={(text) => setNewProvider({ ...newProvider, email: text })}
              placeholder="service@anbieter.de"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.textInput}
              value={newProvider.website}
              onChangeText={(text) => setNewProvider({ ...newProvider, website: text })}
              placeholder="https://www.anbieter.de"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowAddModal(false);
              setEditingProvider(null);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={editingProvider ? handleUpdateProvider : handleAddProvider}
          >
            <Text style={styles.saveButtonText}>
              {editingProvider ? 'Aktualisieren' : 'Hinzufügen'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#047857']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Building2 color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>Energieversorger</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{energyProviders.length}</Text>
            <Text style={styles.statLabel}>Anbieter</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {energyProviders.reduce((sum, p) => sum + p.basicFee, 0).toFixed(0)} €
            </Text>
            <Text style={styles.statLabel}>Grundgebühren/Monat</Text>
          </View>
        </View>

        <View style={styles.providersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meine Anbieter</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.addButtonText}>Hinzufügen</Text>
            </TouchableOpacity>
          </View>

          {energyProviders.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 color="#9CA3AF" size={64} />
              <Text style={styles.emptyStateTitle}>Keine Anbieter vorhanden</Text>
              <Text style={styles.emptyStateText}>
                Fügen Sie Ihre Energieversorger hinzu, um Verträge und Kosten zu verwalten.
              </Text>
            </View>
          ) : (
            <View style={styles.providersList}>
              {energyProviders.map(renderProviderCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {renderAddModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  providersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  providersList: {
    gap: 12,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  providerType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  providerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  contractInfo: {
    marginBottom: 16,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  contractLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  contractValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
    minWidth: 100,
  },
  typeButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  suggestionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});