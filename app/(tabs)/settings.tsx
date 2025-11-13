import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  HelpCircle,
  Download,
  Upload,
  Smartphone,
  Wifi,
  ChevronRight,
  Building2,
  Moon,
  Sun,
  Check,
  Cloud,
  LogOut,
  Leaf,
  Trash2,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation, Language } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { 
    userProfile, 
    language, 
    restoreBackup, 
    updateUserProfile, 
    setLanguage, 
    theme, 
    setTheme, 
    pvSystemEnabled, 
    setPvSystem, 
    lastSyncTime, 
    energyProviders, 
    devices, 
    meterReadings, 
    dropboxBackupEnabled,
    setDropboxBackup,
    isDropboxAuthenticated,
    authenticateDropbox,
    logoutDropbox,
    listDropboxBackups,
    downloadFromDropbox,
    syncChoice,
    resolveSyncChoice,
    forceDropboxSync,
    syncWithDropbox,
    downloadAndRestoreFromDropbox,
    resetAllData,
  } = useApp();

  useEffect(() => {
    if (syncChoice.needed) {
        Alert.alert(
            "Cloud-Daten gefunden",
            "Es sind bereits Daten in Ihrer Dropbox vorhanden. Wie möchten Sie fortfahren?",
            [
                {
                    text: "Dropbox-Daten verwenden (lokale Daten überschreiben)",
                    onPress: () => resolveSyncChoice('remote'),
                    style: "destructive"
                },
                {
                    text: "Lokale Daten verwenden (Dropbox-Daten überschreiben)",
                    onPress: () => resolveSyncChoice('local'),
                },
                {
                    text: "Abbrechen",
                    onPress: () => resolveSyncChoice('cancel'),
                    style: "cancel"
                }
            ]
        );
    }
  }, [syncChoice, resolveSyncChoice]);

  const { colors } = useTheme();
  const t = useTranslation(language);
  const [notifications, setNotifications] = useState<boolean>(userProfile?.notifications?.push || true);
  const [autoBackup, setAutoBackup] = useState<boolean>(true);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showDropboxModal, setShowDropboxModal] = useState<boolean>(false);
  const [dropboxBackups, setDropboxBackups] = useState<{ name: string; modified: string; size: number }[]>([]);
  const [loadingDropboxBackups, setLoadingDropboxBackups] = useState<boolean>(false);

  const handlePvSystemToggle = useCallback((value: boolean) => {
    setPvSystem(value);
  }, [setPvSystem]);

  const handleNotificationToggle = useCallback((value: boolean) => {
    setNotifications(value);
    if (userProfile) {
      updateUserProfile({
        notifications: {
          ...userProfile.notifications,
          push: value,
        },
      });
    }
  }, [userProfile, updateUserProfile]);


  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleThemeChange = () => {
    setShowThemeModal(true);
  };

  const selectTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setShowThemeModal(false);
  };

  const handleBackup = async () => {
    try {
      const backupData = {
        userProfile,
        energyProviders,
        devices,
        meterReadings,
        language,
        theme,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      
      const backupString = JSON.stringify(backupData, null, 2);
      const fileName = `ecoflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // Web: Create download link
        const blob = new Blob([backupString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert(
          language === 'de' ? 'Backup erstellt' : language === 'en' ? 'Backup Created' : 'Резервная копия создана',
          language === 'de' ? 'Die Backup-Datei wurde heruntergeladen.' : 
          language === 'en' ? 'The backup file has been downloaded.' :
          'Файл резервной копии был загружен.'
        );
      } else {
        // Mobile: Save to file system and share
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, backupString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: language === 'de' ? 'Backup teilen' : language === 'en' ? 'Share Backup' : 'Поделиться резервной копией',
          });
        }
        
        Alert.alert(
          language === 'de' ? 'Backup erstellt' : language === 'en' ? 'Backup Created' : 'Резервная копия создана',
          language === 'de' ? 'Die Backup-Datei wurde erstellt und kann geteilt werden.' : 
          language === 'en' ? 'The backup file has been created and can be shared.' :
          'Файл резервной копии был создан и может быть передан.'
        );
      }
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert(
        language === 'de' ? 'Backup fehlgeschlagen' : language === 'en' ? 'Backup Failed' : 'Ошибка резервного копирования',
        language === 'de' ? 'Beim Erstellen des Backups ist ein Fehler aufgetreten.' : 
        language === 'en' ? 'An error occurred while creating the backup.' :
        'Произошла ошибка при создании резервной копии.'
      );
    }
  };

  const handleForceSync = async () => {
    if (!forceDropboxSync) return;
    setShowDropboxModal(false);
    await forceDropboxSync();
  };

  const handleManualSync = async () => {
    setShowDropboxModal(false);
    Alert.alert(
      language === 'de' ? 'Lade Daten...' : 'Loading data...',
      language === 'de' ? `[${Platform.OS.toUpperCase()}] Es wird versucht, die neuesten Daten von Dropbox zu laden. Du erhältst eine Benachrichtigung, wenn es abgeschlossen ist.` : 'Attempting to load the latest data from Dropbox. You will be notified upon completion.'
    );
    try {
      const backups = await listDropboxBackups();
      if (backups.length > 0) {
        // Sort backups by modified date to get the latest one
        const latestBackup = backups.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())[0];
        const backupData = await downloadFromDropbox(latestBackup.name);
        if (backupData) {
          await restoreBackup(backupData);
          Alert.alert(
            language === 'de' ? 'Daten geladen' : 'Data Loaded',
            language === 'de' ? 'Die neuesten Daten wurden erfolgreich von Dropbox geladen.' : 'The latest data has been successfully loaded from Dropbox.'
          );
        } else {
          Alert.alert(
            language === 'de' ? 'Fehler beim Laden' : 'Loading Error',
            language === 'de' ? 'Die neueste Backup-Datei konnte nicht von Dropbox heruntergeladen werden.' : 'Could not download the latest backup file from Dropbox.'
          );
        }
      } else {
        Alert.alert(
          language === 'de' ? 'Keine Backups gefunden' : 'No Backups Found',
          language === 'de' ? 'Es wurden keine Backups in Dropbox gefunden.' : 'No backups found in Dropbox.'
        );
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      Alert.alert(
        language === 'de' ? 'Fehler beim Laden' : 'Loading Error',
        language === 'de' ? 'Beim Laden der Daten von Dropbox ist ein Fehler aufgetreten.' : 'An error occurred while loading data from Dropbox.'
      );
    }
  };

  const handleDropboxSetup = async () => {
    if (isDropboxAuthenticated) {
      setShowDropboxModal(true);
      await loadDropboxBackups();
    } else {
      const success = await authenticateDropbox();
      if (success) {
        setDropboxBackup(true);
        Alert.alert(
          language === 'de' ? 'Dropbox verbunden' : language === 'en' ? 'Dropbox Connected' : 'Dropbox подключен',
          language === 'de' ? 'Ihr Dropbox-Konto wurde erfolgreich verbunden. Automatische Backups sind jetzt aktiviert.' : 
          language === 'en' ? 'Your Dropbox account has been successfully connected. Automatic backups are now enabled.' :
          'Ваш аккаунт Dropbox был успешно подключен. Автоматические резервные копии теперь включены.'
        );
      } else {
        Alert.alert(
          language === 'de' ? 'Verbindung fehlgeschlagen' : language === 'en' ? 'Connection Failed' : 'Ошибка подключения',
          language === 'de' ? 'Die Verbindung zu Dropbox konnte nicht hergestellt werden.' : 
          language === 'en' ? 'Could not connect to Dropbox.' :
          'Не удалось подключиться к Dropbox.'
        );
      }
    }
  };

  const loadDropboxBackups = async () => {
    setLoadingDropboxBackups(true);
    try {
      const backups = await listDropboxBackups();
      setDropboxBackups(backups);
    } catch (error) {
      console.error('Error loading Dropbox backups:', error);
    } finally {
      setLoadingDropboxBackups(false);
    }
  };

  const handleDropboxRestore = async (filename: string) => {
    try {
      const backupData = await downloadFromDropbox(filename);
      if (backupData) {
        await restoreBackup(backupData);
        setShowDropboxModal(false);
        Alert.alert(
          language === 'de' ? 'Wiederherstellung erfolgreich' : language === 'en' ? 'Restore Successful' : 'Восстановление успешно',
          language === 'de' ? 'Ihre Daten wurden erfolgreich aus Dropbox wiederhergestellt.' : 
          language === 'en' ? 'Your data has been successfully restored from Dropbox.' :
          'Ваши данные были успешно восстановлены из Dropbox.'
        );
      } else {
        Alert.alert(
          language === 'de' ? 'Wiederherstellung fehlgeschlagen' : language === 'en' ? 'Restore Failed' : 'Ошибка восстановления',
          language === 'de' ? 'Die Backup-Datei konnte nicht von Dropbox heruntergeladen werden.' : 
          language === 'en' ? 'Could not download backup file from Dropbox.' :
          'Не удалось загрузить файл резервной копии из Dropbox.'
        );
      }
    } catch (error) {
      console.error('Dropbox restore error:', error);
      Alert.alert(
        language === 'de' ? 'Wiederherstellung fehlgeschlagen' : language === 'en' ? 'Restore Failed' : 'Ошибка восстановления',
        language === 'de' ? 'Beim Wiederherstellen aus Dropbox ist ein Fehler aufgetreten.' : 
        language === 'en' ? 'An error occurred while restoring from Dropbox.' :
        'Произошла ошибка при восстановлении из Dropbox.'
      );
    }
  };

  const handleDropboxLogout = async () => {
    Alert.alert(
      language === 'de' ? 'Dropbox trennen' : language === 'en' ? 'Disconnect Dropbox' : 'Отключить Dropbox',
      language === 'de' ? 'Möchten Sie Ihr Dropbox-Konto wirklich trennen? Automatische Backups werden deaktiviert.' : 
      language === 'en' ? 'Are you sure you want to disconnect your Dropbox account? Automatic backups will be disabled.' :
      'Вы уверены, что хотите отключить свой аккаунт Dropbox? Автоматические резервные копии будут отключены.',
      [
        {
          text: language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена',
          style: 'cancel',
        },
        {
          text: language === 'de' ? 'Trennen' : language === 'en' ? 'Disconnect' : 'Отключить',
          style: 'destructive',
          onPress: async () => {
            await logoutDropbox();
            setShowDropboxModal(false);
            Alert.alert(
              language === 'de' ? 'Dropbox getrennt' : language === 'en' ? 'Dropbox Disconnected' : 'Dropbox отключен',
              language === 'de' ? 'Ihr Dropbox-Konto wurde erfolgreich getrennt.' : 
              language === 'en' ? 'Your Dropbox account has been successfully disconnected.' :
              'Ваш аккаунт Dropbox был успешно отключен.'
            );
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: File input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event: any) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (e: any) => {
              try {
                const backupData = JSON.parse(e.target.result);
                await restoreBackup(JSON.stringify(backupData));
              } catch (error) {
                Alert.alert(
                  language === 'de' ? 'Ungültige Datei' : language === 'en' ? 'Invalid File' : 'Неверный файл',
                  language === 'de' ? 'Die ausgewählte Datei ist kein gültiges Backup.' : 
                  language === 'en' ? 'The selected file is not a valid backup.' :
                  'Выбранный файл не является действительной резервной копией.'
                );
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        // Mobile: Document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileUri = result.assets[0].uri;
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          
          try {
            const backupData = JSON.parse(fileContent);
            await restoreBackup(JSON.stringify(backupData));
          } catch (error) {
            Alert.alert(
              language === 'de' ? 'Ungültige Datei' : language === 'en' ? 'Invalid File' : 'Неверный файл',
              language === 'de' ? 'Die ausgewählte Datei ist kein gültiges Backup.' : 
              language === 'en' ? 'The selected file is not a valid backup.' :
              'Выбранный файл не является действительной резервной копией.'
            );
          }
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        language === 'de' ? 'Wiederherstellung fehlgeschlagen' : language === 'en' ? 'Restore Failed' : 'Ошибка восстановления',
        language === 'de' ? 'Beim Wiederherstellen des Backups ist ein Fehler aufgetreten.' : 
        language === 'en' ? 'An error occurred while restoring the backup.' :
        'Произошла ошибка при восстановлении резервной копии.'
      );
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      language === 'de' ? 'App zurücksetzen' : 'Reset App',
      language === 'de' ? 'Möchten Sie wirklich alle Daten unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.' : 'Are you sure you want to permanently delete all data? This action cannot be undone.',
      [
        {
          text: language === 'de' ? 'Abbrechen' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'de' ? 'Zurücksetzen' : 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (resetAllData) {
              await resetAllData();
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  };

  const getStorageInfo = () => {
    // Calculate real storage usage based on stored data
    const dataSize = JSON.stringify({
      userProfile,
      energyProviders,
      devices,
      meterReadings,
      language,
      theme,
      lastSyncTime
    }).length;
    return `${(dataSize / 1024).toFixed(1)} KB`;
  };

  const getAppVersion = () => {
    try {
      // This attempts to read the version directly from package.json
      const packageJson = require('../../package.json');
      return packageJson.version || '1.0.0';
    } catch (error) {
      // Fallback to the existing method if direct import fails
      console.log('Could not read package.json, falling back to expo config');
      return Constants.expoConfig?.version || '1.0.0';
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return language === 'de' ? 'Nie' : language === 'en' ? 'Never' : 'Никогда';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) {
      return language === 'de' ? 'Gerade eben' : language === 'en' ? 'Just now' : 'Только что';
    } else if (minutes < 60) {
      return language === 'de' ? `Vor ${minutes} Min` : 
             language === 'en' ? `${minutes} min ago` : 
             `${minutes} мин назад`;
    } else {
      const hours = Math.floor(minutes / 60);
      return language === 'de' ? `Vor ${hours} Std` : 
             language === 'en' ? `${hours} hours ago` : 
             `${hours} ч назад`;
    }
  };

  const getLanguageDisplayName = (lang: Language) => {
    switch (lang) {
      case 'de': return 'Deutsch';
      case 'en': return 'English';
      case 'ru': return 'Русский';
      default: return 'Deutsch';
    }
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: t.editProfile,
      subtitle: language === 'de' ? 'Name, E-Mail, Adresse' : 
                language === 'en' ? 'Name, Email, Address' : 
                'Имя, Email, Адрес',
      icon: <User color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/profile'),
    },
    {
      id: 'notifications',
      title: t.notifications,
      subtitle: language === 'de' ? 'Erinnerungen und Benachrichtigungen' : 
                language === 'en' ? 'Reminders and notifications' : 
                'Напоминания и уведомления',
      icon: <Bell color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/notification-settings'),
    },
    {
      id: 'language',
      title: t.language,
      subtitle: getLanguageDisplayName(language),
      icon: <Globe color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: handleLanguageChange,
    },
    {
      id: 'theme',
      title: language === 'de' ? 'Design' : language === 'en' ? 'Theme' : 'Тема',
      subtitle: theme === 'light' ? 
                (language === 'de' ? 'Hell' : language === 'en' ? 'Light' : 'Светлая') : 
                (language === 'de' ? 'Dunkel' : language === 'en' ? 'Dark' : 'Темная'),
      icon: theme === 'light' ? <Sun color={colors.secondary} size={20} /> : <Moon color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: handleThemeChange,
    },
  ];

  const systemSettings: SettingItem[] = [
    {
      id: 'devices',
      title: t.manageDevices,
      subtitle: language === 'de' ? 'Zähler, Wechselrichter, Batterien' : 
                language === 'en' ? 'Meters, Inverters, Batteries' : 
                'Счетчики, Инверторы, Батареи',
      icon: <Smartphone color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/devices'),
    },
    {
      id: 'providers',
      title: t.energyProviders,
      subtitle: language === 'de' ? 'Strom, Gas, Wasser, Heizung' : 
                language === 'en' ? 'Electricity, Gas, Water, Heating' : 
                'Электричество, Газ, Вода, Отопление',
      icon: <Building2 color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/energy-providers'),
    },
    {
      id: 'sustainability',
      title: t.sustainability,
      subtitle: language === 'de' ? 'Ziele und Erfolge' : 
                language === 'en' ? 'Goals and achievements' : 
                'Цели и достижения',
      icon: <Leaf color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/sustainability-settings'),
    },
    {
      id: 'pv-system',
      title: language === 'de' ? 'PV-Anlage' : language === 'en' ? 'PV System' : 'Солнечная система',
      subtitle: language === 'de' ? 'Solar-Widgets anzeigen' : 
                language === 'en' ? 'Show solar widgets' : 
                'Показать солнечные виджеты',
      icon: <Sun color={colors.secondary} size={20} />,
      type: 'toggle',
      value: pvSystemEnabled,
      onToggle: handlePvSystemToggle,
    },
    {
      id: 'auto-backup',
      title: t.automaticBackup,
      subtitle: language === 'de' ? 'Täglich in die Cloud' : 
                language === 'en' ? 'Daily to cloud' : 
                'Ежедневно в облако',
      icon: <Upload color={colors.secondary} size={20} />,
      type: 'toggle',
      value: autoBackup,
      onToggle: (value: boolean) => setAutoBackup(value),
    },
    {
      id: 'dropbox-backup',
      title: language === 'de' ? 'Dropbox Backup' : language === 'en' ? 'Dropbox Backup' : 'Резервное копирование Dropbox',
      subtitle: isDropboxAuthenticated ? 
                (language === 'de' ? 'Verbunden - Backups verwalten' : 
                 language === 'en' ? 'Connected - Manage backups' : 
                 'Подключено - Управление резервными копиями') :
                (language === 'de' ? 'Mit Dropbox verbinden' : 
                 language === 'en' ? 'Connect to Dropbox' : 
                 'Подключиться к Dropbox'),
      icon: <Cloud color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: handleDropboxSetup,
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: 'backup',
      title: t.createBackup,
      subtitle: language === 'de' ? 'Alle Daten sichern' : 
                language === 'en' ? 'Backup all data' : 
                'Резервировать все данные',
      icon: <Download color={colors.secondary} size={20} />,
      type: 'action',
      onPress: handleBackup,
    },
    {
      id: 'restore',
      title: t.restoreData,
      subtitle: language === 'de' ? 'Aus Backup wiederherstellen' : 
                language === 'en' ? 'Restore from backup' : 
                'Восстановить из резервной копии',
      icon: <Upload color={colors.secondary} size={20} />,
      type: 'action',
      onPress: handleRestore,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: t.helpSupport,
      subtitle: language === 'de' ? 'FAQ, Kontakt, Tutorials' : 
                language === 'en' ? 'FAQ, Contact, Tutorials' : 
                'FAQ, Контакты, Обучение',
      icon: <HelpCircle color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/support'),
    },
    {
      id: 'privacy',
      title: t.privacy,
      subtitle: language === 'de' ? 'Datenschutzerklärung, Einstellungen' : 
                language === 'en' ? 'Privacy policy, Settings' : 
                'Политика конфиденциальности, Настройки',
      icon: <Shield color={colors.secondary} size={20} />,
      type: 'navigation',
      onPress: () => router.push('/privacy'),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingIcon}>
        {item.icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
        {item.subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        )}
      </View>
      <View style={styles.settingAction}>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {item.type === 'navigation' && (
          <ChevronRight color={colors.secondary} size={20} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowLanguageModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t.language}</Text>
          
          {(['de', 'en', 'ru'] as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.modalOption, { borderBottomColor: colors.border }]}
              onPress={() => selectLanguage(lang)}
            >
              <Text style={[styles.modalOptionText, { color: colors.text }]}>
                {getLanguageDisplayName(lang)}
              </Text>
              {language === lang && (
                <Check color={colors.primary} size={20} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  const renderDropboxModal = () => (
    <Modal
      visible={showDropboxModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDropboxModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.dropboxModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.dropboxModalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'de' ? 'Dropbox Backup' : language === 'en' ? 'Dropbox Backup' : 'Резервное копирование Dropbox'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowDropboxModal(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dropboxStatus}>
            <View style={styles.dropboxStatusItem}>
              <Text style={[styles.dropboxStatusLabel, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Status:' : language === 'en' ? 'Status:' : 'Статус:'}
              </Text>
              <Text style={[styles.dropboxStatusValue, { color: isDropboxAuthenticated ? colors.success : colors.error }]}>
                {isDropboxAuthenticated ? 
                  (language === 'de' ? 'Verbunden' : language === 'en' ? 'Connected' : 'Подключено') :
                  (language === 'de' ? 'Nicht verbunden' : language === 'en' ? 'Not connected' : 'Не подключено')
                }
              </Text>
            </View>
            
            <View style={styles.dropboxStatusItem}>
              <Text style={[styles.dropboxStatusLabel, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Auto-Backup:' : language === 'en' ? 'Auto-Backup:' : 'Авто-резервирование:'}
              </Text>
              <Switch
                value={dropboxBackupEnabled}
                onValueChange={setDropboxBackup}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={dropboxBackupEnabled ? '#FFFFFF' : '#FFFFFF'}
                disabled={!isDropboxAuthenticated}
              />
            </View>
          </View>
          
          <View style={styles.dropboxBackups}>
            <Text style={[styles.dropboxBackupsTitle, { color: colors.text }]}>
              {language === 'de' ? 'Verfügbare Backups' : language === 'en' ? 'Available Backups' : 'Доступные резервные копии'}
            </Text>
            
            {loadingDropboxBackups ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {language === 'de' ? 'Lade Backups...' : language === 'en' ? 'Loading backups...' : 'Загрузка резервных копий...'}
                </Text>
              </View>
            ) : dropboxBackups.length > 0 ? (
              <ScrollView style={styles.backupsList} showsVerticalScrollIndicator={false}>
                {dropboxBackups.map((backup, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.backupItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleDropboxRestore(backup.name)}
                  >
                    <View style={styles.backupInfo}>
                      <Text style={[styles.backupName, { color: colors.text }]}>{backup.name}</Text>
                      <Text style={[styles.backupDate, { color: colors.textSecondary }]}>
                        {new Date(backup.modified).toLocaleDateString()}
                      </Text>
                    </View>
                    <Download color={colors.primary} size={20} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noBackupsContainer}>
                <Text style={[styles.noBackupsText, { color: colors.textSecondary }]}>
                  {language === 'de' ? 'Keine Backups gefunden' : language === 'en' ? 'No backups found' : 'Резервные копии не найдены'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.dropboxActions}>
            <TouchableOpacity
              style={[styles.dropboxActionButton, { backgroundColor: colors.primary }]}
              onPress={handleForceSync}
            >
              <Upload color="#FFFFFF" size={16} />
              <Text style={styles.dropboxActionButtonText}>
                {language === 'de' ? 'Jetzt sichern' : language === 'en' ? 'Backup Now' : 'Создать резервную копию'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropboxActionButton, { backgroundColor: colors.secondary }]}
              onPress={handleManualSync}
            >
              <Download color="#FFFFFF" size={16} />
              <Text style={styles.dropboxActionButtonText}>
                {language === 'de' ? 'Daten laden' : 'Load Data'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dropboxActionButton, { backgroundColor: colors.error }]}
              onPress={handleDropboxLogout}
            >
              <LogOut color="#FFFFFF" size={16} />
              <Text style={styles.dropboxActionButtonText}>
                {language === 'de' ? 'Trennen' : language === 'en' ? 'Disconnect' : 'Отключить'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowThemeModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {language === 'de' ? 'Design' : language === 'en' ? 'Theme' : 'Тема'}
          </Text>
          
          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: colors.border }]}
            onPress={() => selectTheme('light')}
          >
            <View style={styles.modalOptionContent}>
              <Sun color={colors.secondary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text, marginLeft: 12 }]}>
                {language === 'de' ? 'Hell' : language === 'en' ? 'Light' : 'Светлая'}
              </Text>
            </View>
            {theme === 'light' && (
              <Check color={colors.primary} size={20} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: 'transparent' }]}
            onPress={() => selectTheme('dark')}
          >
            <View style={styles.modalOptionContent}>
              <Moon color={colors.secondary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text, marginLeft: 12 }]}>
                {language === 'de' ? 'Dunkel' : language === 'en' ? 'Dark' : 'Темная'}
              </Text>
            </View>
            {theme === 'dark' && (
              <Check color={colors.primary} size={20} />
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={theme === 'dark' ? ['#374151', '#1F2937'] : ['#6B7280', '#4B5563']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <SettingsIcon color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{t.settings}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <User color="#FFFFFF" size={32} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userProfile?.name || (language === 'de' ? 'Benutzer' : language === 'en' ? 'User' : 'Пользователь')}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userProfile?.email || 'email@beispiel.de'}
            </Text>
          </View>
        </View>

        {renderSection(t.accountSettings, accountSettings)}
        {renderSection(t.systemSettings, systemSettings)}
        {renderSection(t.dataBackup, dataSettings)}
        {renderSection(t.helpSupport, supportSettings)}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.error, borderWidth: 1 }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleResetApp}
            >
              <View style={styles.settingIcon}>
                <Trash2 color={colors.error} size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.error }]}>App zurücksetzen</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Alle Daten unwiderruflich löschen</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.systemInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.systemInfoTitle, { color: colors.text }]}>{t.systemInfo}</Text>
          <View style={styles.systemInfoItem}>
            <Text style={[styles.systemInfoLabel, { color: colors.textSecondary }]}>{t.appVersion}:</Text>
            <Text style={[styles.systemInfoValue, { color: colors.text }]}>{getAppVersion()}</Text>
          </View>
          <View style={styles.systemInfoItem}>
            <Text style={[styles.systemInfoLabel, { color: colors.textSecondary }]}>{t.lastSync}:</Text>
            <Text style={[styles.systemInfoValue, { color: colors.text }]}>{getLastSyncText()}</Text>
          </View>
          <View style={styles.systemInfoItem}>
            <Text style={[styles.systemInfoLabel, { color: colors.textSecondary }]}>{t.storageUsed}:</Text>
            <Text style={[styles.systemInfoValue, { color: colors.text }]}>{getStorageInfo()}</Text>
          </View>
        </View>

      </View>
      
      {renderLanguageModal()}
      {renderThemeModal()}
      {renderDropboxModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
    marginTop: -5,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingAction: {
    marginLeft: 12,
  },
  systemInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  systemInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  systemInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  systemInfoLabel: {
    fontSize: 14,
  },
  systemInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
  },
  dropboxModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 0,
  },
  dropboxModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropboxStatus: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropboxStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropboxStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropboxStatusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropboxBackups: {
    flex: 1,
    padding: 20,
  },
  dropboxBackupsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  backupsList: {
    maxHeight: 200,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 14,
    fontWeight: '500',
  },
  backupDate: {
    fontSize: 12,
    marginTop: 2,
  },
  noBackupsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noBackupsText: {
    fontSize: 14,
  },
  dropboxActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  dropboxActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dropboxActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});