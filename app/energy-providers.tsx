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
  Edit3,
  Trash2,
  X,
  Zap,
  Flame,
  Droplets,
  Home,
  Phone,
  Mail,
  Globe,
  FileText,
} from 'lucide-react-native';
import CustomCalendarPicker, { DateRangePicker } from '@/components/CustomCalendarPicker';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { EnergyProvider } from '@/types/energy';
import { SafeAreaView } from 'react-native-safe-area-context';

// Predefined energy providers with contact information
const PREDEFINED_PROVIDERS: Record<string, Partial<EnergyProvider>> = {
  'stadtwerke-berlin': {
    name: 'Stadtwerke Berlin',
    type: 'electricity',
    contact: {
      phone: '+49 30 267 686 868',
      email: 'service@swb-gruppe.de',
      website: 'https://www.swb-gruppe.de',
    },
  },
  'gasag': {
    name: 'GASAG',
    type: 'gas',
    contact: {
      phone: '+49 30 7872 0',
      email: 'kundenservice@gasag.de',
      website: 'https://www.gasag.de',
    },
  },
  'vattenfall': {
    name: 'Vattenfall',
    type: 'electricity',
    contact: {
      phone: '+49 30 657 988 000',
      email: 'kundenservice@vattenfall.de',
      website: 'https://www.vattenfall.de',
    },
  },
  'eon': {
    name: 'E.ON',
    type: 'electricity',
    contact: {
      phone: '+49 211 4579 1111',
      email: 'info@eon.de',
      website: 'https://www.eon.de',
    },
  },
  'rwe': {
    name: 'RWE',
    type: 'electricity',
    contact: {
      phone: '+49 201 12 00',
      email: 'kundenservice@rwe.com',
      website: 'https://www.rwe.de',
    },
  },
  'engie': {
    name: 'ENGIE Deutschland',
    type: 'gas',
    contact: {
      phone: '+49 221 4664 6464',
      email: 'kundenservice@engie.de',
      website: 'https://www.engie.de',
    },
  },
  'berliner-wasserbetriebe': {
    name: 'Berliner Wasserbetriebe',
    type: 'water',
    contact: {
      phone: '+49 30 8644 4444',
      email: 'info@bwb.de',
      website: 'https://www.bwb.de',
    },
  },
  'fernwaerme-berlin': {
    name: 'Vattenfall Wärme Berlin',
    type: 'heating',
    contact: {
      phone: '+49 30 267 11 11',
      email: 'waerme@vattenfall.de',
      website: 'https://waerme.vattenfall.de',
    },
  },
};

export default function EnergyProvidersScreen() {
  const { energyProviders, addEnergyProvider, updateEnergyProvider, removeEnergyProvider, language } = useApp();
  const { colors, isDark } = useTheme();
  const t = useTranslation(language);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EnergyProvider | null>(null);
  const [showPredefinedModal, setShowPredefinedModal] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'electricity' as EnergyProvider['type'],
    contractNumber: '',
    tariff: '',
    pricePerUnit: '',
    basicFee: '',
    validFrom: new Date(),
    contractStart: new Date(),
    contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    contact: {
      phone: '',
      email: '',
      website: '',
    },
  });

  const getProviderIcon = (type: EnergyProvider['type']) => {
    switch (type) {
      case 'electricity':
        return <Zap color="#F59E0B" size={24} />;
      case 'gas':
        return <Flame color="#EF4444" size={24} />;
      case 'water':
        return <Droplets color="#3B82F6" size={24} />;
      case 'heating':
        return <Home color="#F97316" size={24} />;
      default:
        return <Building2 color="#6B7280" size={24} />;
    }
  };

  const getProviderTypeText = (type: EnergyProvider['type']) => {
    switch (type) {
      case 'electricity':
        return language === 'de' ? 'Strom' : language === 'en' ? 'Electricity' : 'Электричество';
      case 'gas':
        return language === 'de' ? 'Gas' : language === 'en' ? 'Gas' : 'Газ';
      case 'water':
        return language === 'de' ? 'Wasser' : language === 'en' ? 'Water' : 'Вода';
      case 'heating':
        return language === 'de' ? 'Heizung' : language === 'en' ? 'Heating' : 'Отопление';
      default:
        return type;
    }
  };

  const handleAddProvider = () => {
    if (!newProvider.name.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : language === 'en' ? 'Error' : 'Ошибка',
        language === 'de' ? 'Bitte geben Sie einen Anbieternamen ein.' :
        language === 'en' ? 'Please enter a provider name.' :
        'Пожалуйста, введите название поставщика.'
      );
      return;
    }

    const providerData: Omit<EnergyProvider, 'id'> = {
      name: newProvider.name,
      type: newProvider.type,
      contractNumber: newProvider.contractNumber,
      tariff: newProvider.tariff,
      pricePerUnit: parseFloat(newProvider.pricePerUnit) || 0,
      basicFee: parseFloat(newProvider.basicFee) || 0,
      validFrom: newProvider.validFrom,
      contractStart: newProvider.contractStart,
      contractEnd: newProvider.contractEnd,
      contact: {
        phone: newProvider.contact.phone,
        email: newProvider.contact.email,
        website: newProvider.contact.website,
      },
    };

    addEnergyProvider(providerData);
    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setNewProvider({
      name: '',
      type: 'electricity',
      contractNumber: '',
      tariff: '',
      pricePerUnit: '',
      basicFee: '',
      validFrom: new Date(),
      contractStart: new Date(),
      contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      contact: {
        phone: '',
        email: '',
        website: '',
      },
    });
  };

  const handleEditProvider = (provider: EnergyProvider) => {
    setEditingProvider(provider);
    setNewProvider({
      name: provider.name,
      type: provider.type,
      contractNumber: provider.contractNumber || '',
      tariff: provider.tariff || '',
      pricePerUnit: provider.pricePerUnit?.toString() || '',
      basicFee: provider.basicFee?.toString() || '',
      validFrom: provider.validFrom || new Date(),
      contractStart: provider.contractStart || new Date(),
      contractEnd: provider.contractEnd || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      contact: {
        phone: provider.contact?.phone || '',
        email: provider.contact?.email || '',
        website: provider.contact?.website || '',
      },
    });
    setShowAddModal(true);
  };

  const handleUpdateProvider = () => {
    if (!editingProvider || !newProvider.name.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : language === 'en' ? 'Error' : 'Ошибка',
        language === 'de' ? 'Bitte geben Sie einen Anbieternamen ein.' :
        language === 'en' ? 'Please enter a provider name.' :
        'Пожалуйста, введите название поставщика.'
      );
      return;
    }

    const updateData: Partial<EnergyProvider> = {
      name: newProvider.name,
      type: newProvider.type,
      contractNumber: newProvider.contractNumber,
      tariff: newProvider.tariff,
      pricePerUnit: parseFloat(newProvider.pricePerUnit) || 0,
      basicFee: parseFloat(newProvider.basicFee) || 0,
      validFrom: newProvider.validFrom,
      contractStart: newProvider.contractStart,
      contractEnd: newProvider.contractEnd,
      contact: {
        phone: newProvider.contact.phone,
        email: newProvider.contact.email,
        website: newProvider.contact.website,
      },
    };

    updateEnergyProvider(editingProvider.id, updateData);
    setEditingProvider(null);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteProvider = (provider: EnergyProvider) => {
    Alert.alert(
      language === 'de' ? 'Anbieter löschen' : language === 'en' ? 'Delete Provider' : 'Удалить поставщика',
      language === 'de' ? `Möchten Sie den Anbieter "${provider.name}" wirklich löschen?` :
      language === 'en' ? `Do you really want to delete the provider "${provider.name}"?` :
      `Вы действительно хотите удалить поставщика "${provider.name}"?`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => removeEnergyProvider(provider.id),
        },
      ]
    );
  };

  const handleSelectPredefined = (key: string, provider: Partial<EnergyProvider>) => {
    setNewProvider({
      name: provider.name || '',
      type: provider.type || 'electricity',
      contractNumber: '',
      tariff: '',
      pricePerUnit: provider.pricePerUnit?.toString() || '',
      basicFee: provider.basicFee?.toString() || '',
      validFrom: new Date(),
      contractStart: new Date(),
      contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      contact: {
        phone: provider.contact?.phone || '',
        email: provider.contact?.email || '',
        website: provider.contact?.website || '',
      },
    });
    setShowPredefinedModal(false);
    setShowAddModal(true);
  };

  const renderProviderCard = (provider: EnergyProvider) => (
    <View key={provider.id} style={[styles.providerCard, { backgroundColor: colors.card }]}>
      <View style={styles.providerHeader}>
        <View style={[styles.providerIcon, { backgroundColor: colors.background }]}>
          {getProviderIcon(provider.type)}
        </View>
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
          <Text style={[styles.providerType, { color: colors.textSecondary }]}>
            {getProviderTypeText(provider.type)}
          </Text>
          {provider.contractNumber && (
            <Text style={[styles.contractNumber, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Vertragsnummer:' : language === 'en' ? 'Contract:' : 'Договор:'} {provider.contractNumber}
            </Text>
          )}
          {provider.contractStart && provider.contractEnd && (
            <Text style={[styles.contractPeriod, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Laufzeit:' : language === 'en' ? 'Contract period:' : 'Период договора:'} {provider.contractStart.toLocaleDateString()} - {provider.contractEnd.toLocaleDateString()}
            </Text>
          )}
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

      {provider.tariff && (
        <View style={styles.providerDetails}>
          <Text style={[styles.tariff, { color: colors.text }]}>
            {language === 'de' ? 'Tarif:' : language === 'en' ? 'Tariff:' : 'Тариф:'} {provider.tariff}
          </Text>
          {provider.pricePerUnit && (
            <Text style={[styles.price, { color: colors.textSecondary }]}>
              {provider.pricePerUnit.toFixed(4)} €/{provider.type === 'electricity' ? 'kWh' : provider.type === 'gas' ? 'kWh' : 'm³'}
            </Text>
          )}
        </View>
      )}

      {provider.contact && (
        <View style={styles.contactInfo}>
          {provider.contact.phone && (
            <View style={styles.contactItem}>
              <Phone color={colors.secondary} size={14} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{provider.contact.phone}</Text>
            </View>
          )}
          {provider.contact.email && (
            <View style={styles.contactItem}>
              <Mail color={colors.secondary} size={14} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{provider.contact.email}</Text>
            </View>
          )}
          {provider.contact.website && (
            <View style={styles.contactItem}>
              <Globe color={colors.secondary} size={14} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{provider.contact.website}</Text>
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
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#FFFFFF', flex: 1 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingProvider ? 
              (language === 'de' ? 'Anbieter bearbeiten' : language === 'en' ? 'Edit Provider' : 'Редактировать поставщика') :
              (language === 'de' ? 'Neuen Anbieter hinzufügen' : language === 'en' ? 'Add New Provider' : 'Добавить нового поставщика')
            }
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAddModal(false);
              setEditingProvider(null);
              resetForm();
            }}
          >
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Anbietername' : language === 'en' ? 'Provider Name' : 'Название поставщика'}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newProvider.name}
              onChangeText={(text) => setNewProvider({ ...newProvider, name: text })}
              placeholder={
                language === 'de' ? 'z.B. Stadtwerke Berlin' : 
                language === 'en' ? 'e.g. Berlin Energy' : 
                'например, Берлинская энергия'
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Energietyp' : language === 'en' ? 'Energy Type' : 'Тип энергии'}
            </Text>
            <View style={styles.typeSelector}>
              {(['electricity', 'gas', 'water', 'heating'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    newProvider.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewProvider({ ...newProvider, type })}
                >
                  {getProviderIcon(type)}
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      newProvider.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {getProviderTypeText(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Vertragsnummer' : language === 'en' ? 'Contract Number' : 'Номер договора'}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newProvider.contractNumber}
              onChangeText={(text) => setNewProvider({ ...newProvider, contractNumber: text })}
              placeholder={
                language === 'de' ? 'Ihre Vertragsnummer' : 
                language === 'en' ? 'Your contract number' : 
                'Ваш номер договора'
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Tarif' : language === 'en' ? 'Tariff' : 'Тариф'}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newProvider.tariff}
              onChangeText={(text) => setNewProvider({ ...newProvider, tariff: text })}
              placeholder={
                language === 'de' ? 'z.B. Ökostrom Plus' : 
                language === 'en' ? 'e.g. Green Energy Plus' : 
                'например, Зеленая энергия Плюс'
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'Preis pro Einheit (€)' : language === 'en' ? 'Price per Unit (€)' : 'Цена за единицу (€)'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newProvider.pricePerUnit}
                onChangeText={(text) => setNewProvider({ ...newProvider, pricePerUnit: text.replace(',', '.') })}
                placeholder="0,32"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'Grundgebühr (€)' : language === 'en' ? 'Basic Fee (€)' : 'Базовая плата (€)'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newProvider.basicFee}
                onChangeText={(text) => setNewProvider({ ...newProvider, basicFee: text.replace(',', '.') })}
                placeholder="12,50"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <DateRangePicker
            fromDate={newProvider.contractStart}
            toDate={newProvider.contractEnd}
            onFromDateChange={(date: Date) => setNewProvider({ ...newProvider, contractStart: date })}
            onToDateChange={(date: Date) => setNewProvider({ ...newProvider, contractEnd: date })}
            fromLabel={language === 'de' ? 'Vertragsbeginn' : language === 'en' ? 'Contract Start' : 'Начало договора'}
            toLabel={language === 'de' ? 'Vertragsende' : language === 'en' ? 'Contract End' : 'Конец договора'}
          />

          <View style={styles.contactSection}>
            <Text style={[styles.contactSectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Kontaktinformationen' : language === 'en' ? 'Contact Information' : 'Контактная информация'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'Telefon' : language === 'en' ? 'Phone' : 'Телефон'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newProvider.contact.phone}
                onChangeText={(text) => setNewProvider({ 
                  ...newProvider, 
                  contact: { ...newProvider.contact, phone: text }
                })}
                placeholder="+49 30 12345678"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'E-Mail' : language === 'en' ? 'Email' : 'Электронная почта'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newProvider.contact.email}
                onChangeText={(text) => setNewProvider({ 
                  ...newProvider, 
                  contact: { ...newProvider.contact, email: text }
                })}
                placeholder="service@anbieter.de"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'Website' : language === 'en' ? 'Website' : 'Веб-сайт'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newProvider.contact.website}
                onChangeText={(text) => setNewProvider({ 
                  ...newProvider, 
                  contact: { ...newProvider.contact, website: text }
                })}
                placeholder="https://www.anbieter.de"
                placeholderTextColor={colors.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalActions, { borderTopColor: colors.border, backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => {
              setShowAddModal(false);
              setEditingProvider(null);
              resetForm();
            }}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={editingProvider ? handleUpdateProvider : handleAddProvider}
          >
            <Text style={styles.saveButtonText}>
              {editingProvider ? 
                (language === 'de' ? 'Aktualisieren' : language === 'en' ? 'Update' : 'Обновить') :
                (language === 'de' ? 'Hinzufügen' : language === 'en' ? 'Add' : 'Добавить')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderPredefinedModal = () => (
    <Modal
      visible={showPredefinedModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#FFFFFF', flex: 1 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {language === 'de' ? 'Bekannte Anbieter' : language === 'en' ? 'Known Providers' : 'Известные поставщики'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPredefinedModal(false)}
          >
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {Object.entries(PREDEFINED_PROVIDERS).map(([key, provider]) => (
            <TouchableOpacity
              key={key}
              style={[styles.predefinedItem, { backgroundColor: colors.card }]}
              onPress={() => handleSelectPredefined(key, provider)}
            >
              <View style={styles.predefinedIcon}>
                {getProviderIcon(provider.type || 'electricity')}
              </View>
              <View style={styles.predefinedInfo}>
                <Text style={[styles.predefinedName, { color: colors.text }]}>{provider.name}</Text>
                <Text style={[styles.predefinedType, { color: colors.textSecondary }]}>
                  {getProviderTypeText(provider.type || 'electricity')}
                </Text>
                {provider.contact?.phone && (
                  <Text style={[styles.predefinedContact, { color: colors.textSecondary }]}>
                    📞 {provider.contact.phone}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Building2 color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>
            {language === 'de' ? 'Energieversorger' : language === 'en' ? 'Energy Providers' : 'Поставщики энергии'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{energyProviders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Anbieter' : language === 'en' ? 'Providers' : 'Поставщики'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {energyProviders.filter(p => p.type === 'electricity').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Strom' : language === 'en' ? 'Electricity' : 'Электричество'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {energyProviders.filter(p => p.type === 'gas').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Gas' : language === 'en' ? 'Gas' : 'Газ'}
            </Text>
          </View>
        </View>

        <View style={styles.providersSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Meine Anbieter' : language === 'en' ? 'My Providers' : 'Мои поставщики'}
            </Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.predefinedButton}
                onPress={() => setShowPredefinedModal(true)}
              >
                <FileText color="#FFFFFF" size={16} />
                <Text style={styles.predefinedButtonText}>
                  {language === 'de' ? 'Bekannte' : language === 'en' ? 'Known' : 'Известные'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.addButtonText}>
                  {language === 'de' ? 'Hinzufügen' : language === 'en' ? 'Add' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {energyProviders.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 color={colors.textSecondary} size={64} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {language === 'de' ? 'Keine Anbieter vorhanden' : language === 'en' ? 'No Providers Available' : 'Нет доступных поставщиков'}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Fügen Sie Ihren ersten Energieversorger hinzu.' : 
                 language === 'en' ? 'Add your first energy provider.' : 
                 'Добавьте вашего первого поставщика энергии.'}
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
      {renderPredefinedModal()}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  predefinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  predefinedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 12,
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
  contractNumber: {
    fontSize: 12,
    color: '#9CA3AF',
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
  providerDetails: {
    marginBottom: 12,
  },
  tariff: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  price: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactInfo: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
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
  dateRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  dateField: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 120,
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
  contactSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contactSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
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
  predefinedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  predefinedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predefinedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  predefinedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  predefinedType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  predefinedContact: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contractPeriod: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
});
