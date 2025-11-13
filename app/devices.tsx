import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Smartphone,
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Battery,
  Zap,
  Activity,
  Settings,
  Trash2,
  Edit3,
  X,
  QrCode,
  Flame,
  Droplets,
  Thermometer,
  Fuel,
  Wind,
  Sun,
  Building,
  Package,
  TreePine,
  Cloud,
  Camera,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { Device } from '@/types/energy';
import { METER_TYPES, METER_CATEGORIES } from '@/constants/languages';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeviceManagementScreen() {
  const { devices, addDevice, updateDevice, removeDevice, language, energyProviders } = useApp();
  const { colors, isDark } = useTheme();
  const t = useTranslation(language);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [editingDevice, setEditingDevice] = React.useState<Device | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [newDevice, setNewDevice] = React.useState({
    name: '',
    type: 'meter' as Device['type'],
    meterType: 'electricity' as string,
    calculationType: 'difference' as 'sum' | 'difference',
    serialNumber: '',
    location: '',
    status: 'inactive' as Device['status'],
    providerId: '',
  });
  const [showMeterTypes, setShowMeterTypes] = React.useState(true);

  React.useEffect(() => {
    if (newDevice.meterType === 'solar-pv') {
      setNewDevice(prev => ({ ...prev, calculationType: 'sum' }));
    }
  }, [newDevice.meterType]);

  const getMeterTypeIcon = (meterType: string, size: number = 20) => {
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

  const getDeviceIcon = (type: Device['type'], meterType?: string) => {
    switch (type) {
      case 'meter':
        return meterType ? getMeterTypeIcon(meterType, 24) : <Activity color="#3B82F6" size={24} />;
      default:
        return <Smartphone color="#6B7280" size={24} />;
    }
  };

  const getMeterTypeName = (meterType: string) => {
    const meterTypeData = METER_TYPES.find(m => m.id === meterType);
    return meterTypeData ? meterTypeData.name : meterType;
  };

  const getMeterTypeUnit = (meterType: string) => {
    const meterTypeData = METER_TYPES.find(m => m.id === meterType);
    return meterTypeData ? meterTypeData.unit : '';
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'active':
        return <Wifi color="#10B981" size={16} />;
      case 'inactive':
        return <WifiOff color="#6B7280" size={16} />;
      default:
        return <WifiOff color="#6B7280" size={16} />;
    }
  };

  const handleAddDevice = () => {
    if (!newDevice.name.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : language === 'en' ? 'Error' : 'Ошибка',
        language === 'de' ? 'Bitte geben Sie einen Gerätenamen ein.' :
        language === 'en' ? 'Please enter a device name.' :
        'Пожалуйста, введите название устройства.'
      );
      return;
    }

    const deviceData: any = {
      name: newDevice.name,
      type: newDevice.type,
      status: newDevice.status,
      lastUpdate: new Date(),
      data: {},
      calculationType: newDevice.calculationType,
    };

    if (newDevice.type === 'meter') {
      deviceData.meterType = newDevice.meterType;
      deviceData.unit = getMeterTypeUnit(newDevice.meterType);
    }

    if (newDevice.serialNumber) {
      deviceData.serialNumber = newDevice.serialNumber;
    }

    if (newDevice.location) {
      deviceData.location = newDevice.location;
    }

    if (newDevice.providerId) {
      deviceData.providerId = newDevice.providerId;
    }

    addDevice(deviceData);

    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setNewDevice({
      name: '',
      type: 'meter',
      meterType: 'electricity',
      calculationType: 'difference',
      serialNumber: '',
      location: '',
      status: 'inactive',
      providerId: '',
    });
    setShowMeterTypes(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setNewDevice({
      name: device.name,
      type: device.type,
      meterType: (device as any).meterType || 'electricity',
      calculationType: device.calculationType || 'difference',
      serialNumber: (device as any).serialNumber || '',
      location: (device as any).location || '',
      status: device.status,
      providerId: (device as any).providerId || '',
    });
    setShowMeterTypes(device.type === 'meter');
    setShowAddModal(true);
  };

  const handleUpdateDevice = () => {
    if (!editingDevice || !newDevice.name.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : language === 'en' ? 'Error' : 'Ошибка',
        language === 'de' ? 'Bitte geben Sie einen Gerätenamen ein.' :
        language === 'en' ? 'Please enter a device name.' :
        'Пожалуйста, введите название устройства.'
      );
      return;
    }

    const updateData: any = {
      name: newDevice.name,
      type: newDevice.type,
      status: newDevice.status,
      lastUpdate: new Date(),
      calculationType: newDevice.calculationType,
    };


    if (newDevice.type === 'meter') {
      updateData.meterType = newDevice.meterType;
      updateData.unit = getMeterTypeUnit(newDevice.meterType);
    }

    if (newDevice.serialNumber) {
      updateData.serialNumber = newDevice.serialNumber;
    }

    if (newDevice.location) {
      updateData.location = newDevice.location;
    }

    if (newDevice.providerId) {
      updateData.providerId = newDevice.providerId;
    }

    updateDevice(editingDevice.id, updateData);

    setEditingDevice(null);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteDevice = (device: Device) => {
    Alert.alert(
      language === 'de' ? 'Gerät löschen' : language === 'en' ? 'Delete Device' : 'Удалить устройство',
      language === 'de' ? `Möchten Sie das Gerät "${device.name}" wirklich löschen?` :
      language === 'en' ? `Do you really want to delete the device "${device.name}"?` :
      `Вы действительно хотите удалить устройство "${device.name}"?`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => removeDevice(device.id),
        },
      ]
    );
  };

  const handleScanBarcode = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        language === 'de' ? 'Nicht verfügbar' : language === 'en' ? 'Not Available' : 'Недоступно',
        language === 'de' ? 'Barcode-Scanner ist im Web nicht verfügbar.' :
        language === 'en' ? 'Barcode scanner is not available on web.' :
        'Сканер штрих-кода недоступен в веб-версии.'
      );
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          language === 'de' ? 'Berechtigung erforderlich' : language === 'en' ? 'Permission Required' : 'Требуется разрешение',
          language === 'de' ? 'Kamera-Berechtigung ist erforderlich für den Barcode-Scanner.' :
          language === 'en' ? 'Camera permission is required for barcode scanning.' :
          'Для сканирования штрих-кода требуется разрешение камеры.'
        );
        return;
      }
    }

    setShowScanner(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    
    // Parse barcode data - could contain meter type, serial number, etc.
    // Format: TYPE:SERIAL:NAME or just SERIAL
    const parts = data.split(':');
    
    if (parts.length >= 2) {
      // Structured barcode
      const [type, serial, name] = parts;
      const meterType = METER_TYPES.find(m => m.id === type.toLowerCase());
      
      setNewDevice({
        ...newDevice,
        serialNumber: serial,
        name: name || newDevice.name,
        meterType: meterType ? type.toLowerCase() : newDevice.meterType,
      });
    } else {
      // Simple serial number
      setNewDevice({ ...newDevice, serialNumber: data });
    }
    
    Alert.alert(
      language === 'de' ? 'Barcode gescannt' : language === 'en' ? 'Barcode Scanned' : 'Штрих-код отсканирован',
      language === 'de' ? `Daten erfasst: ${data}` :
      language === 'en' ? `Data captured: ${data}` :
      `Данные получены: ${data}`
    );
  };

  const renderDeviceCard = (device: Device) => (
    <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.surface }]}>
      <View style={styles.deviceHeader}>
        <View style={[styles.deviceIcon, { backgroundColor: colors.background }]}>
          {getDeviceIcon(device.type, (device as any).meterType)}
        </View>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
          <Text style={[styles.deviceType, { color: colors.textSecondary }]}>
            {device.type === 'meter' && (
              (device as any).meterType ? 
                getMeterTypeName((device as any).meterType) : 
                (language === 'de' ? 'Zähler' : language === 'en' ? 'Meter' : 'Счетчик')
            )}
          </Text>
          {(device as any).location && (
            <Text style={[styles.deviceLocation, { color: colors.textSecondary }]}>
              📍 {(device as any).location}
            </Text>
          )}
          {(device as any).providerId && (
            <Text style={[styles.deviceProvider, { color: colors.textSecondary }]}>
              🏢 {energyProviders.find(p => p.id === (device as any).providerId)?.name || 'Unbekannter Anbieter'}
            </Text>
          )}
        </View>
        <View style={styles.deviceActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={() => handleEditDevice(device)}
          >
            <Edit3 color={colors.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={() => handleDeleteDevice(device)}
          >
            <Trash2 color="#EF4444" size={16} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.deviceStatus}>
        <View style={styles.statusIndicator}>
          {getStatusIcon(device.status)}
          <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
            {device.status === 'active' && t.online}
            {device.status === 'inactive' && t.offline}
          </Text>
        </View>
        <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
          {language === 'de' ? 'Zuletzt aktualisiert:' : 
           language === 'en' ? 'Last updated:' : 
           'Последнее обновление:'} {device.lastUpdate.toLocaleTimeString()}
        </Text>
      </View>

      {device.data && Object.keys(device.data).length > 0 && (
        <View style={[styles.deviceData, { borderTopColor: colors.border }]}>
          <Text style={[styles.dataTitle, { color: colors.text }]}>
            {language === 'de' ? 'Aktuelle Werte:' : 
             language === 'en' ? 'Current Values:' : 
             'Текущие значения:'}
          </Text>
          {Object.entries(device.data).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={[styles.dataKey, { color: colors.textSecondary }]}>{key}:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{String(value)}</Text>
            </View>
          ))}
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
            {editingDevice ? 'Gerät bearbeiten' : 'Neues Gerät hinzufügen'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAddModal(false);
              setEditingDevice(null);
              resetForm();
            }}
          >
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Gerätename' : language === 'en' ? 'Device Name' : 'Название устройства'}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newDevice.name}
              onChangeText={(text) => setNewDevice({ ...newDevice, name: text })}
              placeholder={
                language === 'de' ? 'z.B. Hauptzähler Keller' : 
                language === 'en' ? 'e.g. Main Meter Basement' : 
                'например, Главный счетчик'
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Seriennummer' : language === 'en' ? 'Serial Number' : 'Серийный номер'}
            </Text>
            <View style={styles.serialInputContainer}>
              <TextInput
                style={[styles.textInput, styles.serialInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newDevice.serialNumber}
                onChangeText={(text) => setNewDevice({ ...newDevice, serialNumber: text })}
                placeholder={
                  language === 'de' ? 'Seriennummer oder Zählernummer' : 
                  language === 'en' ? 'Serial or meter number' : 
                  'Серийный номер'
                }
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanBarcode}
              >
                <QrCode color="#FFFFFF" size={20} />
                <Text style={styles.scanButtonText}>
                  {language === 'de' ? 'Scannen' : language === 'en' ? 'Scan' : 'Сканировать'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Standort' : language === 'en' ? 'Location' : 'Местоположение'}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newDevice.location}
              onChangeText={(text) => setNewDevice({ ...newDevice, location: text })}
              placeholder={
                language === 'de' ? 'z.B. Keller, Garage, Dachboden' : 
                language === 'en' ? 'e.g. Basement, Garage, Attic' : 
                'например, Подвал, Гараж'
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Gerätetyp' : language === 'en' ? 'Device Type' : 'Тип устройства'}
            </Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  newDevice.type === 'meter' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setNewDevice({ ...newDevice, type: 'meter' });
                  setShowMeterTypes(true);
                }}
              >
                {getDeviceIcon('meter')}
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    newDevice.type === 'meter' && styles.typeButtonTextActive,
                  ]}
                >
                  {language === 'de' ? 'Zähler' : language === 'en' ? 'Meter' : 'Счетчик'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showMeterTypes && newDevice.type === 'meter' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === 'de' ? 'Zählertyp' : language === 'en' ? 'Meter Type' : 'Тип счетчика'}
              </Text>
              <ScrollView style={styles.meterTypeContainer}>
                {Object.entries(METER_CATEGORIES).map(([categoryKey, categoryName]) => (
                  <View key={categoryKey} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>{categoryName}</Text>
                    <View style={styles.meterTypeGrid}>
                      {METER_TYPES
                        .filter(meter => meter.category === categoryKey)
                        .map((meter) => (
                          <TouchableOpacity
                            key={meter.id}
                            style={[
                              styles.meterTypeButton,
                              { backgroundColor: colors.surface, borderColor: colors.border },
                              newDevice.meterType === meter.id && styles.meterTypeButtonActive,
                            ]}
                            onPress={() => setNewDevice({ ...newDevice, meterType: meter.id })}
                          >
                            {getMeterTypeIcon(meter.id, 16)}
                            <Text
                              style={[
                                styles.meterTypeText,
                                { color: colors.text },
                                newDevice.meterType === meter.id && styles.meterTypeTextActive,
                              ]}
                              numberOfLines={2}
                            >
                              {meter.name}
                            </Text>
                            <Text style={[styles.meterTypeUnit, { color: colors.textSecondary }]}>{meter.unit}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {(newDevice.meterType === 'solar-pv' || newDevice.meterType === 'solar-pv-export') && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Berechnungsmethode</Text>
              {newDevice.meterType === 'solar-pv' ? (
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Für diesen Zählertyp wird immer die Summe der einzelnen Ablesungen als Gesamtproduktion berechnet.
                </Text>
              ) : (
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      newDevice.calculationType === 'difference' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewDevice({ ...newDevice, calculationType: 'difference' })}
                  >
                    <Text style={[styles.typeButtonText, { color: colors.textSecondary }, newDevice.calculationType === 'difference' && styles.typeButtonTextActive]}>
                      Differenz
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      newDevice.calculationType === 'sum' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewDevice({ ...newDevice, calculationType: 'sum' })}
                  >
                    <Text style={[styles.typeButtonText, { color: colors.textSecondary }, newDevice.calculationType === 'sum' && styles.typeButtonTextActive]}>
                      Summe
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {language === 'de' ? 'Energieversorger' : language === 'en' ? 'Energy Provider' : 'Поставщик энергии'}
            </Text>
            <View style={styles.providerSelector}>
              <TouchableOpacity
                style={[
                  styles.providerButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  !newDevice.providerId && styles.providerButtonActive,
                ]}
                onPress={() => setNewDevice({ ...newDevice, providerId: '' })}
              >
                <Text
                  style={[
                    styles.providerButtonText,
                    { color: colors.textSecondary },
                    !newDevice.providerId && styles.providerButtonTextActive,
                  ]}
                >
                  {language === 'de' ? 'Kein Anbieter' : language === 'en' ? 'No Provider' : 'Нет поставщика'}
                </Text>
              </TouchableOpacity>
              {energyProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.providerButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    newDevice.providerId === provider.id && styles.providerButtonActive,
                  ]}
                  onPress={() => setNewDevice({ ...newDevice, providerId: provider.id })}
                >
                  <Text
                    style={[
                      styles.providerButtonText,
                      { color: colors.textSecondary },
                      newDevice.providerId === provider.id && styles.providerButtonTextActive,
                    ]}
                  >
                    {provider.name}
                  </Text>
                  <Text style={styles.providerType}>
                    {provider.type === 'electricity' ? '⚡' : provider.type === 'gas' ? '🔥' : provider.type === 'water' ? '💧' : '🏠'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Status</Text>
            <View style={styles.statusSelector}>
              {( ['active', 'inactive'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    newDevice.status === status && styles.statusButtonActive,
                  ]}
                  onPress={() => setNewDevice({ ...newDevice, status })}
                >
                  {getStatusIcon(status)}
                  <Text
                    style={[
                      styles.statusButtonText,
                      { color: colors.textSecondary },
                      newDevice.status === status && styles.statusButtonTextActive,
                    ]}
                  >
                    {status === 'active' && t.online}
                    {status === 'inactive' && t.offline}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalActions, { borderTopColor: colors.border, backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => {
              setShowAddModal(false);
              setEditingDevice(null);
              resetForm();
            }}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={editingDevice ? handleUpdateDevice : handleAddDevice}
          >
            <Text style={styles.saveButtonText}>
              {editingDevice ? 'Aktualisieren' : 'Hinzufügen'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Smartphone color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>Geräte verwalten</Text>
        </View>
      </LinearGradient>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{devices.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Geräte gesamt</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {devices.filter(d => d.status === 'active').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Online</Text>
          </View>

        </View>

        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Meine Geräte</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.addButtonText}>Hinzufügen</Text>
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Smartphone color={colors.textSecondary} size={64} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Keine Geräte vorhanden</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Fügen Sie Ihr erstes Gerät hinzu, um mit der Überwachung zu beginnen.
              </Text>
            </View>
          ) : (
            <View style={styles.devicesList}>
              {devices.map(renderDeviceCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {renderAddModal()}
      
      {/* Barcode Scanner Modal */}
      {showScanner && Platform.OS !== 'web' && (
        <Modal
          visible={showScanner}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={[styles.scannerContainer, {flex: 1}]}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.scannerCloseButton}
                onPress={() => setShowScanner(false)}
              >
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>
                {language === 'de' ? 'Barcode/QR-Code scannen' : 
                 language === 'en' ? 'Scan Barcode/QR Code' : 
                 'Сканировать штрих-код/QR-код'}
              </Text>
            </View>
            
            <CameraView
              style={styles.scanner}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'code128',
                  'code39',
                  'code93',
                  'codabar',
                  'datamatrix',
                  'upc_a',
                  'upc_e',
                ],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerHint}>
                  {language === 'de' ? 'Richten Sie die Kamera auf den Code' : 
                   language === 'en' ? 'Point camera at the code' : 
                   'Наведите камеру на код'}
                </Text>
              </View>
            </CameraView>
          </SafeAreaView>
        </Modal>
      )}
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
  devicesSection: {
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
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  deviceType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  deviceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deviceData: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataKey: {
    fontSize: 14,
    color: '#6B7280',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
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
  statusSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  statusButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#3B82F6',
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
  deviceLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceProvider: {
    fontSize: 12,
    marginTop: 2,
  },
  providerSelector: {
    gap: 8,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  providerButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  providerButtonText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  providerButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  providerType: {
    fontSize: 16,
  },
  serialInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  serialInput: {
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  meterTypeContainer: {
    maxHeight: 200,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  meterTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meterTypeButton: {
    width: 100,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  meterTypeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  meterTypeText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
  },
  meterTypeTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  meterTypeUnit: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerCloseButton: {
    padding: 8,
  },
  scannerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 32,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
