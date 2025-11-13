import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  LogBox,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Gauge,
  Plus,
  Zap,
  Droplets,
  Flame,
  Thermometer,
  Edit3,
  Trash2,
  Check,
  X,
  Fuel,
  Wind,
  Sun,
  Building,
  Package,
  TreePine,
  Cloud,
  Activity,
  Calendar,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import CustomCalendarPicker from '@/components/CustomCalendarPicker';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MeterReading } from '@/types/energy';
import { formatNumber, parseGermanNumber, validateMeterReading, calculateMeterDifferences } from '@/utils/energyCalculations';
import { Stack } from 'expo-router';
import { METER_TYPES } from '@/constants/languages';
import { SafeAreaView } from 'react-native-safe-area-context';

// Alle "Text strings must be rendered within a <Text>"-Warnungen unterdrücken
LogBox.ignoreLogs([
    'Text strings must be rendered within a <Text>'
  ]);

const getMeterIcon = (meterType: string, size: number = 24) => {
  const meterTypeData = METER_TYPES.find(m => m.id === meterType);
  if (!meterTypeData) return <Activity color="#3B82F6" size={size} />;
  
  switch (meterTypeData.icon) {
    case 'Zap': return <Zap color="#F59E0B" size={size} />;
    case 'Flame': return <Flame color="#EF4444" size={size} />;
    case 'Droplets': return <Droplets color="#3B82F6" size={size} />;
    case 'Thermometer': return <Thermometer color="#F97316" size={size} />;
    case 'Fuel': return <Fuel color="#6B7280" size={size} />;
    case 'Wind': return <Wind color="#10B981" size={size} />;
    case 'Sun': return <Sun color="#F59E0B" size={size} />;
    case 'Building': return <Building color="#8B5CF6" size={size} />;
    case 'Package': return <Package color="#92400E" size={size} />;
    case 'TreePine': return <TreePine color="#059669" size={size} />;
    case 'Cloud': return <Cloud color="#64748B" size={size} />;
    default: return <Activity color="#3B82F6" size={size} />;
  }
};

const getMeterColor = (meterType: string) => {
  const colors: Record<string, string> = {
    electricity: '#F59E0B',
    gas: '#EF4444',
    water: '#3B82F6',
    heat: '#F97316',
    oil: '#6B7280',
    heatpump: '#10B981',
    solar: '#F59E0B',
    district_heating: '#8B5CF6',
  };
  return colors[meterType] || '#3B82F6';
};

export default function MeterReadingsScreen() {
  const { meterReadings, addMeterReading, updateMeterReading, removeMeterReading, devices, language } = useApp();
  const { colors, isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    meterName: '',
    value: '',
    type: 'electricity',
    notes: '',
    date: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())),
  });

  
  // Filter devices to only show meters
  const meterDevices = devices.filter(d => d.type === 'meter');

  const resetForm = () => {
    setFormData({
      meterName: '',
      value: '',
      type: 'electricity',
      notes: '',
      date: new Date(),
    });
    setSelectedDeviceId('');
  };

  const handleAddReading = () => {
    const value = parseGermanNumber(formData.value);
    
    let meterName = formData.meterName;
    let meterType = formData.type;
    let unit = '';
    
    if (selectedDeviceId) {
      const device = devices.find(d => d.id === selectedDeviceId);
      if (device) {
        meterName = device.name;
        meterType = (device as any).meterType || 'electricity';
        unit = (device as any).unit || '';
      }
    }
    
    if (!meterName.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : language === 'en' ? 'Error' : 'Ошибка',
        language === 'de' ? 'Bitte wählen Sie einen Zähler aus oder geben Sie einen Namen ein.' :
        language === 'en' ? 'Please select a meter or enter a name.' :
        'Пожалуйста, выберите счетчик или введите название.'
      );
      return;
    }
    
    const meterTypeData = METER_TYPES.find(m => m.id === meterType);
    if (!unit && meterTypeData) {
      unit = meterTypeData.unit;
    }
    
    const tempReading: MeterReading = {
      id: 'temp-id',
      meterId: selectedDeviceId || `${meterType}-${meterName.toLowerCase().replace(/\s+/g, '-')}`,
      meterName,
      value,
      reading: value,
      timestamp: formData.date,
      type: meterType as any,
      unit,
      notes: formData.notes || undefined,
    };

    const validation = validateMeterReading(tempReading, meterReadings);
    
    const proceedWithSave = () => {
      const { id, ...newReadingData } = tempReading;
      addMeterReading(newReadingData as Omit<MeterReading, 'id'>);
      resetForm();
      setShowAddModal(false);
    };

    if (!validation.valid) {
      Alert.alert(
        language === 'de' ? 'Ungültiger Zählerstand' : 'Invalid Reading', 
        validation.error || (language === 'de' ? 'Die Eingabe ist ungültig. Bitte überprüfen Sie die Werte und das Datum.' : 'The input is invalid. Please check the values and the date.')
      );
      return;
    }

    if (validation.warning) {
      Alert.alert(
        language === 'de' ? 'Hoher Verbrauch' : 'High Consumption',
        validation.warning,
        [
          { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
          { text: language === 'de' ? 'Trotzdem speichern' : 'Save Anyway', onPress: proceedWithSave }
        ]
      );
    } else {
      proceedWithSave();
    }
  };

  const handleEditReading = () => {
    if (!editingReading) return;
    
    const value = parseGermanNumber(formData.value);

    const tempReading: MeterReading = {
      ...editingReading,
      value,
      reading: value,
    };

    // When editing, we should validate against all *other* readings.
    const otherReadings = meterReadings.filter(r => r.id !== editingReading.id);
    const validation = validateMeterReading(tempReading, otherReadings);
    
    if (!validation.valid) {
      Alert.alert('Ungültiger Zählerstand', validation.error);
      return;
    }
    
    const proceedWithUpdate = () => {
        updateMeterReading(editingReading.id, {
          meterName: formData.meterName,
          value,
          notes: formData.notes || undefined,
        });
        
        setEditingReading(null);
        resetForm();
    };

    if (validation.warning) {
        Alert.alert(
            'Hoher Verbrauch',
            validation.warning,
            [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Trotzdem speichern', onPress: proceedWithUpdate }
            ]
          );
    } else {
        proceedWithUpdate();
    }
  };

  const handleDeleteReading = (id: string) => {
    Alert.alert(
      'Zählerstand löschen',
      'Möchten Sie diesen Zählerstand wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => removeMeterReading(id),
        },
      ]
    );
  };

  const startEdit = (reading: MeterReading) => {
    setEditingReading(reading);
    setFormData({
      meterName: reading.meterName,
      value: formatNumber(reading.value, 1),
      type: reading.type,
      notes: reading.notes || '',
      date: reading.timestamp,
    });
  };

  const handleDateChange = (selectedDate: Date | null) => {
    if (selectedDate) {
      const stableDate = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
      setFormData({ ...formData, date: stableDate });
    } else {
      setFormData({ ...formData, date: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) });
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedReadings = meterReadings
    .filter(reading => {
      const readingDate = new Date(reading.timestamp);
      if (searchText && !reading.meterName.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (filterType && reading.type !== filterType) {
        return false;
      }
      if (startDate && readingDate < startDate) {
        return false;
      }
      if (endDate && readingDate > endDate) {
        return false;
      }
      return true;
    })
    .reduce((acc, reading) => {
      const key = `${reading.type}-${reading.meterName}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(reading);
      return acc;
    }, {} as Record<string, MeterReading[]>);

  const renderMeterGroup = (key: string, readings: MeterReading[]) => {
    const readingsWithDifferences = calculateMeterDifferences(readings, devices);
    const latestReading = readingsWithDifferences[0];
    const meterTypeData = METER_TYPES.find(m => m.id === latestReading.type);
    const color = getMeterColor(latestReading.type);
    const isExpanded = expandedGroups[key];

    return (
      <View key={key} style={[styles.meterGroup, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => toggleGroup(key)}>
          <View style={[styles.meterHeader, { borderLeftColor: color }]}>
            <View style={styles.meterInfo}>
              <View style={styles.meterTitleRow}>
                {getMeterIcon(latestReading.type)}
                <Text style={[styles.meterName, { color: colors.text }]}>{latestReading.meterName}</Text>
                <Text style={[styles.meterType, { backgroundColor: isDark ? colors.surface : '#F3F4F6', color: colors.textSecondary }]}>{meterTypeData?.name || latestReading.type}</Text>
              </View>
              <View style={styles.meterValues}>
                <Text style={[styles.currentReading, { color: colors.text }]}>
                  {formatNumber(latestReading.value, 1)} {latestReading.unit}
                </Text>
                {latestReading.difference && latestReading.difference > 0 && (
                  <Text style={styles.difference}>
                    +{formatNumber(latestReading.difference, 1)} {latestReading.unit}
                  </Text>
                )}
              </View>
              {latestReading.totalConsumption && latestReading.totalConsumption > 0 && (
                <Text style={[styles.totalConsumption, { color: colors.primary }]}>
                  Gesamtverbrauch: {formatNumber(latestReading.totalConsumption, 1)} {latestReading.unit}
                </Text>
              )}
              <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                Letzter Stand: {latestReading.timestamp ? latestReading.timestamp.toLocaleDateString('de-DE') : 'N/A'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={[styles.readingsList, { borderTopColor: colors.border }]}>
            {readingsWithDifferences.map((reading) => (
              <View key={reading.id} style={[styles.readingItem, { borderBottomColor: isDark ? colors.border : '#F3F4F6' }]}>
                <View style={styles.readingInfo}>
                  <View style={styles.readingValueRow}>
                    <Text style={[styles.readingValue, { color: colors.text }]}>
                      {formatNumber(reading.value, 1)} {reading.unit}
                    </Text>
                    {reading.difference && reading.difference > 0 && (
                      <Text style={[styles.readingDifference, { color: '#10B981' }]}>
                        (+{formatNumber(reading.difference, 1)})
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.readingDate, { color: colors.textSecondary }]}>
                    {reading.timestamp.toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {reading.notes && (
                    <Text style={[styles.readingNotes, { color: colors.textSecondary }]}>{reading.notes}</Text>
                  )}
                </View>
                <View style={styles.readingActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}
                    onPress={() => startEdit(reading)}
                  >
                    <Edit3 color={colors.textSecondary} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}
                    onPress={() => handleDeleteReading(reading.id)}
                  >
                    <Trash2 color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={showAddModal || !!editingReading}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background, flex: 1 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              setShowAddModal(false);
              setEditingReading(null);
              resetForm();
            }}
          >
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingReading ? 'Zählerstand bearbeiten' : 'Neuer Zählerstand'}
          </Text>
          <TouchableOpacity
            onPress={editingReading ? handleEditReading : handleAddReading}
          >
            <Check color="#10B981" size={24} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {!editingReading && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {language === 'de' ? 'Zähler auswählen' : 
                 language === 'en' ? 'Select Meter' : 
                 'Выберите счетчик'}
              </Text>
              <View style={styles.deviceSelector}>
                {meterDevices.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.deviceOption,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        !selectedDeviceId && styles.deviceOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedDeviceId('');
                        setFormData({ ...formData, meterName: '', type: 'electricity' });
                      }}
                    >
                      <Plus color={!selectedDeviceId ? '#10B981' : colors.textSecondary} size={20} />
                      <Text style={[
                        styles.deviceOptionText,
                        { color: colors.textSecondary },
                        !selectedDeviceId && styles.deviceOptionTextActive,
                      ]}>
                        {language === 'de' ? 'Manuell' : 
                         language === 'en' ? 'Manual' : 
                         'Вручную'}
                      </Text>
                    </TouchableOpacity>
                    {meterDevices.map((device) => (
                      <TouchableOpacity
                        key={device.id}
                        style={[
                          styles.deviceOption,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          selectedDeviceId === device.id && styles.deviceOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedDeviceId(device.id);
                          setFormData({
                            ...formData,
                            meterName: device.name,
                            type: (device as any).meterType || 'electricity',
                          });
                        }}
                      >
                        {getMeterIcon((device as any).meterType || 'electricity', 20)}
                        <Text style={[
                          styles.deviceOptionText,
                          { color: colors.textSecondary },
                          selectedDeviceId === device.id && styles.deviceOptionTextActive,
                        ]}>
                          {device.name}
                        </Text>
                        {(device as any).location && (
                          <Text style={[styles.deviceLocation, { color: colors.textSecondary }]}>
                            {(device as any).location}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.noDevicesText, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'Keine Zähler angelegt. Bitte legen Sie zuerst Geräte an.' :
                     language === 'en' ? 'No meters created. Please add devices first.' :
                     'Счетчики не созданы. Сначала добавьте устройства.'}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {(!selectedDeviceId || editingReading) && (
            <>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {language === 'de' ? 'Zählername' : 
                   language === 'en' ? 'Meter Name' : 
                   'Название счетчика'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.meterName}
                  onChangeText={(text) => setFormData({ ...formData, meterName: text })}
                  placeholder={
                    language === 'de' ? 'z.B. Hauptzähler, Solar Produktion' :
                    language === 'en' ? 'e.g. Main Meter, Solar Production' :
                    'например, Главный счетчик'
                  }
                  placeholderTextColor={colors.textSecondary}
                  editable={!editingReading && !selectedDeviceId}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {language === 'de' ? 'Zählertyp' : 
                   language === 'en' ? 'Meter Type' : 
                   'Тип счетчика'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.typeSelector}>
                    {METER_TYPES.slice(0, 10).map((meterType) => (
                      <TouchableOpacity
                        key={meterType.id}
                        style={[
                          styles.typeButton,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          formData.type === meterType.id && styles.typeButtonActive,
                          formData.type === meterType.id && { borderColor: getMeterColor(meterType.id) },
                        ]}
                        onPress={() => setFormData({ ...formData, type: meterType.id })}
                        disabled={!!editingReading || !!selectedDeviceId}
                      >
                        {getMeterIcon(meterType.id, 20)}
                        <Text
                          style={[
                            styles.typeButtonText,
                            { color: colors.textSecondary },
                            formData.type === meterType.id && { color: getMeterColor(meterType.id) },
                          ]}
                        >
                          {meterType.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {language === 'de' ? `Zählerstand (${METER_TYPES.find(m => m.id === formData.type)?.unit || 'kWh'})` :
               language === 'en' ? `Value (${METER_TYPES.find(m => m.id === formData.type)?.unit || 'kWh'})` :
               `Показание (${METER_TYPES.find(m => m.id === formData.type)?.unit || 'кВт·ч'})`}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.value}
              onChangeText={(text) => setFormData({ ...formData, value: text })}
              placeholder="z.B. 1.234,5"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Verwenden Sie Komma als Dezimaltrennzeichen (z.B. 1.234,5)' :
               language === 'en' ? 'Use comma as decimal separator (e.g. 1,234.5)' :
               'Используйте запятую как десятичный разделитель'}
            </Text>
          </View>
          
          <CustomCalendarPicker
            label={language === 'de' ? 'Datum' : language === 'en' ? 'Date' : 'Дата'}
            value={formData.date}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notizen (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Zusätzliche Informationen..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Zählerstände',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Gauge color="#FFFFFF" size={28} />
            <Text style={styles.headerTitle}>Zählerstände</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {Object.keys(groupedReadings).length} Zähler erfasst
          </Text>
        </LinearGradient>

        <View style={styles.filterContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Zähler suchen..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          <View style={styles.filterRow}>
            <View style={styles.pickerContainer}>
              <Text style={{color: colors.text}}>Typ:</Text>
              <Picker
                selectedValue={filterType}
                style={[styles.picker, { color: colors.text }]}
                onValueChange={(itemValue) => setFilterType(itemValue)}
              >
                <Picker.Item label="Alle" value={null} />
                {METER_TYPES.map(type => (
                  <Picker.Item key={type.id} label={type.name} value={type.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={{color: colors.text}}>Datum</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          {Object.keys(groupedReadings).length === 0 ? (
            <View style={styles.emptyState}>
              <Gauge color={colors.textSecondary} size={64} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Keine Zählerstände erfasst</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Fügen Sie Ihren ersten Zählerstand hinzu, um mit der Energieüberwachung zu beginnen.
              </Text>
            </View>
          ) : (
            Object.entries(groupedReadings).map(([key, readings]) =>
              renderMeterGroup(key, readings)
            )
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>

        {renderModal()}
        <Modal
          visible={showDatePicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background, flex: 1 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Datum auswählen</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Check color="#10B981" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <CustomCalendarPicker
                label="Startdatum"
                value={startDate}
                onChange={setStartDate}
                maximumDate={new Date()}
              />
              <CustomCalendarPicker
                label="Enddatum"
                value={endDate}
                onChange={setEndDate}
                maximumDate={new Date()}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  filterContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  meterGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  meterHeader: {
    padding: 20,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  meterInfo: {
    flex: 1,
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  meterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  meterType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  meterValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentReading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  difference: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 12,
    fontWeight: '600',
  },
  totalConsumption: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  readingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  readingDifference: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#6B7280',
  },
  readingsList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  readingInfo: {
    flex: 1,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  readingDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  readingNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  readingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 80,
  },
  typeButtonActive: {
    backgroundColor: '#F0FDF4',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  deviceSelector: {
    marginBottom: 8,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  deviceOptionActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  deviceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  deviceOptionTextActive: {
    color: '#10B981',
  },
  deviceLocation: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  noDevicesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
});