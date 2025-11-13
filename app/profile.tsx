import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  MapPin,
  Building,
  Globe,
  Smartphone,
  Save,
  Zap,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserProfile } from '@/types/energy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const { userProfile, updateUserProfile, language, setLanguage, dashboardWidgets, addDashboardWidget, removeDashboardWidget } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    street: userProfile?.address.street || '',
    city: userProfile?.address.city || '',
    zipCode: userProfile?.address.zipCode || '',
    country: userProfile?.address.country || '',
    userType: userProfile?.userType || 'homeowner' as UserProfile['userType'],
    pushNotifications: userProfile?.notifications.push || false,
    notificationFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    installedPower: userProfile?.pvSystem?.installedPower?.toString() || '',
    inverterBrand: userProfile?.pvSystem?.inverterBrand || '',
    batteryCapacity: userProfile?.pvSystem?.batteryCapacity?.toString() || '',
    showPvOnDashboard: dashboardWidgets.includes('solar-production'),
  });

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Fehler', 'Name und E-Mail sind Pflichtfelder.');
      return;
    }

    const updatedProfile: Partial<UserProfile> = {
      name: formData.name,
      email: formData.email,
      address: {
        street: formData.street,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      userType: formData.userType,
      language,
      notifications: {
        push: formData.pushNotifications,
        sms: false,
        frequency: formData.notificationFrequency,
      },
    };

    // Add PV system data if provided
    if (formData.installedPower || formData.inverterBrand || formData.batteryCapacity) {
      updatedProfile.pvSystem = {
        installedPower: parseFloat(formData.installedPower) || 0,
        installationDate: userProfile?.pvSystem?.installationDate || new Date(),
        inverterBrand: formData.inverterBrand,
        batteryCapacity: parseFloat(formData.batteryCapacity) || undefined,
      };
    }

    updateUserProfile(updatedProfile);
    Alert.alert('Erfolg', 'Profil wurde erfolgreich aktualisiert.');
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: React.ReactNode,
    placeholder?: string,
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.inputIcon}>
          {icon}
        </View>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
      </View>
    </View>
  );

  const renderSwitchField = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: React.ReactNode,
    description?: string
  ) => (
    <View style={[styles.switchGroup, { backgroundColor: colors.surface }]}>
      <View style={styles.switchInfo}>
        <View style={styles.switchIcon}>
          {icon}
        </View>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
          {description && (
            <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#10B981' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <User color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>Profil bearbeiten</Text>
        </View>
      </LinearGradient>

      <ScrollView style={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Persönliche Informationen</Text>
          
          {renderInputField(
            'Name *',
            formData.name,
            (text) => setFormData({ ...formData, name: text }),
            <User color="#6B7280" size={20} />,
            'Ihr vollständiger Name'
          )}

          {renderInputField(
            'E-Mail *',
            formData.email,
            (text) => setFormData({ ...formData, email: text }),
            <Mail color="#6B7280" size={20} />,
            'ihre.email@beispiel.de',
            'email-address'
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Adresse</Text>
          
          {renderInputField(
            'Straße und Hausnummer',
            formData.street,
            (text) => setFormData({ ...formData, street: text }),
            <MapPin color="#6B7280" size={20} />,
            'Musterstraße 123'
          )}

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>PLZ</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { paddingLeft: 12, color: colors.text }]}
                  value={formData.zipCode}
                  onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                  placeholder="12345"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Stadt</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { paddingLeft: 12, color: colors.text }]}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Berlin"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {renderInputField(
            'Land',
            formData.country,
            (text) => setFormData({ ...formData, country: text }),
            <Globe color="#6B7280" size={20} />,
            'Deutschland'
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benutzertyp</Text>
          <View style={styles.userTypeSelector}>
            {([
              { key: 'homeowner', label: 'Hausbesitzer', icon: <Building color="#6B7280" size={20} /> },
              { key: 'landlord', label: 'Vermieter', icon: <Building color="#6B7280" size={20} /> },
              { key: 'business', label: 'Unternehmen', icon: <Building color="#6B7280" size={20} /> },
            ] as const).map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.userTypeButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  formData.userType === type.key && styles.userTypeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, userType: type.key })}
              >
                <View style={styles.typeIcon}>{type.icon}</View>
                <Text
                  style={[
                    styles.userTypeButtonText,
                    { color: colors.textSecondary },
                    formData.userType === type.key && styles.userTypeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sprache</Text>
          <View style={styles.languageSelector}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                language === 'de' && styles.languageButtonActive,
              ]}
              onPress={() => setLanguage('de')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: colors.textSecondary },
                  language === 'de' && styles.languageButtonTextActive,
                ]}
              >
                🇩🇪 Deutsch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: colors.textSecondary },
                  language === 'en' && styles.languageButtonTextActive,
                ]}
              >
                🇺🇸 English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                language === 'ru' && styles.languageButtonActive,
              ]}
              onPress={() => setLanguage('ru')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: colors.textSecondary },
                  language === 'ru' && styles.languageButtonTextActive,
                ]}
              >
                🇷🇺 Русский
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Benachrichtigungen</Text>
          
          {renderSwitchField(
            'Push-Benachrichtigungen',
            formData.pushNotifications,
            (value) => setFormData({ ...formData, pushNotifications: value }),
            <Smartphone color="#6B7280" size={20} />,
            'Erhalten Sie Benachrichtigungen auf Ihrem Gerät'
          )}


          
          {formData.pushNotifications && (
            <View style={styles.frequencySection}>
              <Text style={[styles.frequencyTitle, { color: colors.text }]}>Erinnerungsfrequenz für Zählerablesung</Text>
              <View style={styles.frequencySelector}>
                {([
                  { key: 'daily', label: 'Täglich' },
                  { key: 'weekly', label: 'Wöchentlich' },
                  { key: 'monthly', label: 'Monatlich' },
                ] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq.key}
                    style={[
                      styles.frequencyButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      formData.notificationFrequency === freq.key && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, notificationFrequency: freq.key })}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        { color: colors.textSecondary },
                        formData.notificationFrequency === freq.key && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PV-Anlage (optional)</Text>
          
          {renderInputField(
            'Installierte Leistung (kWp)',
            formData.installedPower,
            (text) => setFormData({ ...formData, installedPower: text }),
            <Zap color="#6B7280" size={20} />,
            '9.8',
            'decimal-pad'
          )}

          {renderInputField(
            'Wechselrichter-Marke',
            formData.inverterBrand,
            (text) => setFormData({ ...formData, inverterBrand: text }),
            <Building color="#6B7280" size={20} />,
            'z.B. SMA, Fronius, Huawei'
          )}

          {renderInputField(
            'Batteriekapazität (kWh)',
            formData.batteryCapacity,
            (text) => setFormData({ ...formData, batteryCapacity: text }),
            <Zap color="#6B7280" size={20} />,
            '10.0',
            'decimal-pad'
          )}
          
          {(formData.installedPower || formData.inverterBrand || formData.batteryCapacity) && (
            <View style={styles.pvWidgetSection}>
              <Text style={[styles.pvWidgetTitle, { color: colors.text }]}>Dashboard-Anzeige</Text>
              {renderSwitchField(
                'PV-Anlage auf Dashboard anzeigen',
                formData.showPvOnDashboard,
                (value) => {
                  setFormData({ ...formData, showPvOnDashboard: value });
                  if (value) {
                    // Add PV widgets to dashboard
                    if (!dashboardWidgets.includes('solar-production')) {
                      addDashboardWidget('solar-production');
                    }
                    if (!dashboardWidgets.includes('battery')) {
                      addDashboardWidget('battery');
                    }
                    if (!dashboardWidgets.includes('grid-feed-in')) {
                      addDashboardWidget('grid-feed-in');
                    }
                  } else {
                    // Remove PV widgets from dashboard
                    removeDashboardWidget('solar-production');
                    removeDashboardWidget('battery');
                    removeDashboardWidget('grid-feed-in');
                  }
                },
                <Zap color={isDark ? colors.textSecondary : "#6B7280"} size={20} />,
                formData.showPvOnDashboard && formData.installedPower && formData.batteryCapacity ? 
                  `Zeigt Solar-Produktion, Batterie und Netzeinspeisung als Widgets an\n\nInstallierte PV-Leistung: ${formData.installedPower} kWp\nBatteriekapazität: ${formData.batteryCapacity} kWh` :
                  'Zeigt Solar-Produktion, Batterie und Netzeinspeisung als Widgets an'
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save color="#FFFFFF" size={20} />
          <Text style={styles.saveButtonText}>Profil speichern</Text>
        </TouchableOpacity>
      </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 10,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#111827',
  },
  userTypeSelector: {
    gap: 12,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  userTypeButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  userTypeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userTypeButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    marginRight: 12,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typeIcon: {
    marginRight: 4,
  },
  pvWidgetSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pvWidgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  frequencySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  frequencyButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  frequencyButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
});