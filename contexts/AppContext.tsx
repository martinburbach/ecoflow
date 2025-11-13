import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { LogBox, AppState, Platform } from 'react-native';
import {
  UserProfile,
  EnergyProvider,
  Device,
  RentalUnit,
  Alert,
  EnergyData,
  EnergyStats,
  CostBenefitAnalysis,
  ComplianceReport,
  MeterReading,
  SustainabilityGoals,
} from '@/types/energy';
import { calculateEnergyStats, calculateCurrentEnergyData, calculateTotalForPeriod } from '@/utils/energyCalculations';
import dropboxService from '@/utils/dropboxService';
import notificationService, { NotificationSettings, MeterReadingReminder } from '@/utils/notificationService';

// Alle "Text strings must be rendered within a <Text>"-Warnungen unterdrücken
LogBox.ignoreLogs([
    'Text strings must be rendered within a <Text>'
  ]);

const generateId = () => Math.random().toString(36).substr(2, 9);

const mockUserProfile: UserProfile = {
  id: '1',
  name: 'Max Mustermann',
  email: 'max.mustermann@email.com',
  address: {
    street: 'Musterstraße 123',
    city: 'Berlin',
    zipCode: '10115',
    country: 'Deutschland',
  },
  userType: 'homeowner',
  language: 'de',
  notifications: {
    push: true,
    email: true,
    sms: false,
  },
  pvSystem: {
    installedPower: 9.8,
    installationDate: new Date('2022-03-15'),
    inverterBrand: 'SMA',
    batteryCapacity: 10.0,
  },
};

const mockEnergyProviders: EnergyProvider[] = [
  {
    id: '1',
    name: 'Stadtwerke Berlin',
    type: 'electricity',
    contractNumber: 'SW-2023-001234',
    tariff: 'Ökostrom Plus',
    pricePerUnit: 0.32,
    basicFee: 12.50,
    validFrom: new Date('2023-01-01'),
    validTo: new Date('2025-12-31'),
    contractStart: new Date('2023-01-01'),
    contractEnd: new Date('2025-12-31'),
    contact: {
      phone: '+49 30 12345678',
      email: 'service@stadtwerke-berlin.de',
      website: 'https://www.stadtwerke-berlin.de',
    },
  },
  {
    id: '2',
    name: 'Gasag',
    type: 'gas',
    contractNumber: 'GAS-2023-005678',
    tariff: 'Erdgas Komfort',
    pricePerUnit: 0.08,
    basicFee: 8.90,
    validFrom: new Date('2023-01-01'),
    validTo: new Date('2025-06-30'),
    contractStart: new Date('2023-01-01'),
    contractEnd: new Date('2025-06-30'),
    contact: {
      phone: '+49 30 87654321',
      email: 'kundenservice@gasag.de',
      website: 'https://www.gasag.de',
    },
  },
];

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'SMA Sunny Tripower',
    type: 'inverter',
    status: 'online',
    lastUpdate: new Date(),
    data: {
      power: 8400,
      efficiency: 97.2,
      temperature: 45,
    },
  },
  {
    id: '2',
    name: 'Tesla Powerwall 2',
    type: 'battery',
    status: 'online',
    lastUpdate: new Date(),
    data: {
      capacity: 13.5,
      currentCharge: 85,
      power: -2200,
    },
  },
  {
    id: '3',
    name: 'Stromzähler Hauptanschluss',
    type: 'meter',
    status: 'online',
    lastUpdate: new Date(),
    data: {
      totalConsumption: 4567.8,
      currentPower: 3200,
    },
  },
];

const initialMeterReadings: MeterReading[] = [];



const defaultSustainabilityGoals: SustainabilityGoals = {
  monthlyCo2Goal: 150,
  energySaverGoal: 100,
  solarPioneerGoal: 1000,
  sustainabilityChampionGoal: 1000,
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(mockUserProfile);
  const [energyProviders, setEnergyProviders] = useState<EnergyProvider[]>(mockEnergyProviders);
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [rentalUnits, setRentalUnits] = useState<RentalUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>(initialMeterReadings);
  
  const [currentEnergyData, setCurrentEnergyData] = useState<EnergyData | null>(null);
  const [energyStats, setEnergyStats] = useState<EnergyStats | null>(null);
  const [lastMonthConsumption, setLastMonthConsumption] = useState<number>(0);
  const [costBenefitAnalyses, setCostBenefitAnalyses] = useState<CostBenefitAnalysis[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [language, setLanguageState] = useState<'de' | 'en' | 'ru'>('de');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [pvSystemEnabled, setPvSystemEnabled] = useState<boolean>(true);
  const [sustainabilityGoals, setSustainabilityGoals] = useState<SustainabilityGoals>(defaultSustainabilityGoals);
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([]);
  const [analyticsWidgets, setAnalyticsWidgets] = useState<string[]>([]);

  useEffect(() => {
    const newDashboardWidgets: string[] = [
      'solar-production',
      'battery',
      'grid-feed-in',
      'savings',
      'co2-saved',
    ];
    const newAnalyticsWidgets: string[] = [
      'total-production',
      'autarky',
      'self-consumption',
    ];

    const meterDevices = devices.filter(d => d.type === 'meter');
    const meterTypes = new Set<string>();

    meterDevices.forEach(device => {
      const reading = meterReadings.find(r => r.meterId === device.id);
      const meterType = reading?.type;

      if (meterType && meterType !== 'solar' && meterType !== 'solar_pv_feed_in') {
        newDashboardWidgets.push(`meter-total-consumption-${device.id}`);
        newDashboardWidgets.push(`meter-last-month-consumption-${device.id}`);
        newAnalyticsWidgets.push(`meter-total-costs-${device.id}`);
        newAnalyticsWidgets.push(`meter-last-month-costs-${device.id}`);
        
        meterTypes.add(meterType);
      }
    });

    meterTypes.forEach(type => {
      newAnalyticsWidgets.push(`metertype-total-consumption-${type}`);
      newAnalyticsWidgets.push(`metertype-total-costs-${type}`);
    });

    setDashboardWidgets(newDashboardWidgets);
    setAnalyticsWidgets(newAnalyticsWidgets);
  }, [devices, meterReadings]);
  const [quickAccessWidgets, setQuickAccessWidgets] = useState<string[]>([
    'meter-readings',
    'statistics',
    'alarms'
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dropboxBackupEnabled, setDropboxBackupEnabled] = useState<boolean>(false);
  const [isDropboxAuthenticated, setIsDropboxAuthenticated] = useState<boolean>(false);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    push: true,
    email: true,
    sms: false,
    reminderDays: 3,
    reminderTime: '09:00',
  });
  const firstSyncAfterLoad = useRef(true);
  const [syncChoice, setSyncChoice] = useState<{ needed: boolean; localData?: any }>({ needed: false });
  const SYNC_FILENAME = 'ecoflow_synced_backup.json';

  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      if (data === undefined) {
        console.warn(`Skipping save for ${key}: data is undefined`);
        return;
      }
      const dataToSave = typeof data === 'string' ? data : JSON.stringify(data);
      await AsyncStorage.setItem(key, dataToSave);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const newAlert = { ...alert, id: generateId() };
    setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
  }, []);

  const restoreBackup = useCallback(async (backupData: string) => {
    try {
      const data = JSON.parse(backupData);
      
      if (data.userProfile) {
        const profile = data.userProfile;
        if (profile.pvSystem?.installationDate) {
          profile.pvSystem.installationDate = new Date(profile.pvSystem.installationDate);
        }
        setUserProfile(profile);
      }
      if (Array.isArray(data.energyProviders)) {
        const providersWithDates = data.energyProviders.map((provider: any) => ({
          ...provider,
          validFrom: provider.validFrom ? new Date(provider.validFrom) : undefined,
          validTo: provider.validTo ? new Date(provider.validTo) : undefined,
          contractStart: provider.contractStart ? new Date(provider.contractStart) : undefined,
          contractEnd: provider.contractEnd ? new Date(provider.contractEnd) : undefined
        }));
        setEnergyProviders(providersWithDates);
      } else if (data.energyProviders) {
        console.warn('Restored energyProviders was not an array, falling back to default. Value:', data.energyProviders);
        setEnergyProviders(mockEnergyProviders);
      }
      if (Array.isArray(data.devices)) {
        const devicesWithDates = data.devices.map((device: any) => ({
          ...device,
          lastUpdate: device.lastUpdate ? new Date(device.lastUpdate) : new Date()
        }));
        setDevices(devicesWithDates);
      }
      if (Array.isArray(data.rentalUnits)) setRentalUnits(data.rentalUnits);
      if (Array.isArray(data.meterReadings)) {
        const readingsWithDates = data.meterReadings.map((reading: any) => ({
          ...reading,
          timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date()
        }));
        setMeterReadings(readingsWithDates);
      }

      if (Array.isArray(data.costBenefitAnalyses)) setCostBenefitAnalyses(data.costBenefitAnalyses);
      if (Array.isArray(data.complianceReports)) {
        const reportsWithDates = data.complianceReports.map((report: any) => ({
            ...report,
            generatedAt: report.generatedAt ? new Date(report.generatedAt) : new Date(),
            period: {
                from: report.period.from ? new Date(report.period.from) : new Date(),
                to: report.period.to ? new Date(report.period.to) : new Date(),
            }
        }));
        setComplianceReports(reportsWithDates);
      }
      if (data.language) setLanguageState(data.language);
      if (data.pvSystemEnabled !== undefined) setPvSystemEnabled(data.pvSystemEnabled);
      if (data.sustainabilityGoals) setSustainabilityGoals(data.sustainabilityGoals);
      if (Array.isArray(data.dashboardWidgets)) setDashboardWidgets(data.dashboardWidgets);
      if (Array.isArray(data.analyticsWidgets)) setAnalyticsWidgets(data.analyticsWidgets);
      if (Array.isArray(data.quickAccessWidgets)) setQuickAccessWidgets(data.quickAccessWidgets);
      
      const newSyncTime = new Date();
      setLastSyncTime(newSyncTime);
      await saveToStorage('lastSyncTime', newSyncTime.toISOString());
      
      addAlert({
        type: 'info',
        title: 'Backup wiederhergestellt',
        message: 'Ihre Daten wurden erfolgreich wiederhergestellt.',
        timestamp: new Date(),
        acknowledged: false,
      });

      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      addAlert({
        type: 'error',
        title: 'Wiederherstellung fehlgeschlagen',
        message: 'Beim Wiederherstellen des Backups ist ein Fehler aufgetreten.',
        timestamp: new Date(),
        acknowledged: false,
      });
      return false;
    }
  }, [addAlert, saveToStorage]);

  const authenticateDropbox = useCallback(async (): Promise<boolean> => {
    try {
      const success = await dropboxService.authenticate();
      setIsDropboxAuthenticated(success);
      return success;
    } catch (error) {
      console.error('Dropbox authentication error:', error);
      return false;
    }
  }, []);

  const logoutDropbox = useCallback(async () => {
    try {
      await dropboxService.logout();
      setIsDropboxAuthenticated(false);
      setDropboxBackupEnabled(false);
      await saveToStorage('dropboxBackupEnabled', false);
    } catch (error) {
      console.error('Dropbox logout error:', error);
    }
  }, [saveToStorage]);

  const uploadToDropbox = useCallback(async (backupData: string, filename: string = SYNC_FILENAME): Promise<boolean> => {
    try {
      if (!isDropboxAuthenticated) {
        const authenticated = await authenticateDropbox();
        if (!authenticated) {
          return false;
        }
      }

      const success = await dropboxService.uploadBackup(backupData, filename);
      
      if (success) {
        addAlert({ type: 'info', title: 'Dropbox Backup erfolgreich', message: 'Ihre Daten wurden erfolgreich in Dropbox gesichert.', timestamp: new Date(), acknowledged: false });
      } else {
        addAlert({ type: 'error', title: 'Dropbox Backup fehlgeschriert', message: 'Beim Hochladen in Dropbox ist ein Fehler aufgetreten.', timestamp: new Date(), acknowledged: false });
      }
      
      return success;
    } catch (error) {
      console.error('Dropbox upload error:', error);
      return false;
    }
  }, [isDropboxAuthenticated, authenticateDropbox, addAlert, language]);

  const downloadFromDropbox = useCallback(async (filename: string = SYNC_FILENAME): Promise<string | null> => {
    try {
      if (!isDropboxAuthenticated) {
        const authenticated = await authenticateDropbox();
        if (!authenticated) {
          return null;
        }
      }

      const backupData = await dropboxService.downloadBackup(filename);
      return backupData;
    } catch (error) {
      console.error('Dropbox download error:', error);
      return null;
    }
  }, [isDropboxAuthenticated, authenticateDropbox]);

  const downloadAndRestoreFromDropbox = useCallback(async (): Promise<boolean> => {
    if (!isDropboxAuthenticated) {
      addAlert({ type: 'error', title: 'Dropbox nicht verbunden', message: 'Bitte verbinden Sie zuerst Ihr Dropbox-Konto.', timestamp: new Date(), acknowledged: false });
      return false;
    }

    try {
      addAlert({ type: 'info', title: 'Daten werden geladen', message: 'Versuche, die neuesten Daten von Dropbox zu laden.', timestamp: new Date(), acknowledged: false });
      const remoteDataString = await dropboxService.downloadBackup(SYNC_FILENAME, (progress) => {
        setDownloadProgress(progress);
      });

      if (remoteDataString) {
        const restored = await restoreBackup(remoteDataString);
        if (restored) {
          const newSyncTime = new Date();
          setLastSyncTime(newSyncTime);
          await saveToStorage('lastSyncTime', newSyncTime.toISOString());
          addAlert({ type: 'info', title: 'Daten geladen', message: 'Ihre Daten wurden erfolgreich aus Dropbox geladen.', timestamp: new Date(), acknowledged: false });
          return true;
        }
      } else {
        addAlert({ type: 'warning', title: 'Keine Dropbox-Daten gefunden', message: 'Es wurde keine Backup-Datei in Dropbox gefunden.', timestamp: new Date(), acknowledged: false });
      }
      return false;
    } catch (error: any) {
      console.error('Download and restore from Dropbox error:', error);
      addAlert({ type: 'error', title: 'Laden fehlgeschlagen', message: error.message, timestamp: new Date(), acknowledged: false });
      return false;
    }
  }, [isDropboxAuthenticated, restoreBackup, addAlert, saveToStorage]);

  const listDropboxBackups = useCallback(async (): Promise<{ name: string; modified: string; size: number }[]> => {
    try {
      if (!isDropboxAuthenticated) {
        const authenticated = await authenticateDropbox();
        if (!authenticated) {
          return [];
        }
      }

      const backups = await dropboxService.listBackups();
      return backups;
    } catch (error) {
      console.error('Dropbox list backups error:', error);
      return [];
    }
  }, [isDropboxAuthenticated, authenticateDropbox]);

  const createBackup = useCallback(async () => {
    try {
      const backupData = {
        userProfile,
        energyProviders,
        devices,
        rentalUnits,
        meterReadings,
        costBenefitAnalyses,
        complianceReports,
        language,
        pvSystemEnabled,
        sustainabilityGoals,
        dashboardWidgets,
        analyticsWidgets,
        quickAccessWidgets,
        timestamp: new Date().toISOString(),
      };
      
      const backupString = JSON.stringify(backupData, null, 2);
      await AsyncStorage.setItem('backup', backupString);
      
      console.log(`[${Platform.OS.toUpperCase()}] createBackup: dropboxBackupEnabled:`, dropboxBackupEnabled);
      console.log(`[${Platform.OS.toUpperCase()}] createBackup: isDropboxAuthenticated:`, isDropboxAuthenticated);

      if (dropboxBackupEnabled && isDropboxAuthenticated) {
        console.log(`[${Platform.OS.toUpperCase()}]createBackup: Attempting to upload backup to Dropbox.`);
        await uploadToDropbox(backupString, `ecoflow_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`);
      } else if (dropboxBackupEnabled && !isDropboxAuthenticated) {
        console.warn(`[${Platform.OS.toUpperCase()}]createBackup: Dropbox backup enabled but not authenticated. Skipping upload.`);
      } else {
        console.log(`[${Platform.OS.toUpperCase()}]createBackup: Dropbox backup not enabled. Skipping upload.`);
      }
      
      addAlert({ type: 'info', title: 'Backup erstellt', message: 'Ihre Daten wurden erfolgreich gesichert.', timestamp: new Date(), acknowledged: false });
    } catch (error) {
      console.error('Error creating backup:', error);
      addAlert({ type: 'error', title: 'Backup fehlgeschlagen', message: 'Beim Erstellen des Backups ist ein Fehler aufgetreten.', timestamp: new Date(), acknowledged: false });
    }
  }, [userProfile, energyProviders, devices, rentalUnits, meterReadings, costBenefitAnalyses, complianceReports, language, pvSystemEnabled, sustainabilityGoals, dashboardWidgets, analyticsWidgets, quickAccessWidgets, addAlert, dropboxBackupEnabled, isDropboxAuthenticated, uploadToDropbox]);

  const forceDropboxSync = useCallback(async () => {
    if (!isDropboxAuthenticated) {
      addAlert({ type: 'error', title: 'Dropbox nicht verbunden', message: 'Bitte verbinden Sie zuerst Ihr Dropbox-Konto.', timestamp: new Date(), acknowledged: false });
      return false;
    }

    try {
      addAlert({ type: 'info', title: 'Synchronisierung gestartet', message: 'Deine Daten werden jetzt mit Dropbox synchronisiert.', timestamp: new Date(), acknowledged: false });
      const localData = {
        userProfile,
        energyProviders,
        devices,
        rentalUnits,
        meterReadings,
        costBenefitAnalyses,
        complianceReports,
        language,
        pvSystemEnabled,
        sustainabilityGoals,
        dashboardWidgets,
        analyticsWidgets,
        quickAccessWidgets,
        timestamp: new Date().toISOString(),
      };
      
      const success = await dropboxService.forceUpload(localData);

      if (success) {
        const newSyncTime = new Date();
        setLastSyncTime(newSyncTime);
        await saveToStorage('lastSyncTime', newSyncTime.toISOString());
        addAlert({ type: 'info', title: 'Dropbox Sync erfolgreich', message: 'Ihre Daten wurden erfolgreich mit Dropbox synchronisiert.', timestamp: new Date(), acknowledged: false });
        return true;
      } else {
        addAlert({ type: 'error', title: 'Dropbox Sync fehlgeschlagen', message: 'Beim Synchronisieren mit Dropbox ist ein Fehler aufgetreten.', timestamp: new Date(), acknowledged: false });
        return false;
      }
    } catch (error: any) {
      console.error('Force Dropbox sync error:', error);
      addAlert({ type: 'error', title: 'Dropbox Sync fehlgeschlagen', message: error.message, timestamp: new Date(), acknowledged: false });
      return false;
    }
  }, [
    isDropboxAuthenticated,
    userProfile,
    energyProviders,
    devices,
    rentalUnits,
    meterReadings,
    costBenefitAnalyses,
    complianceReports,
    language,
    pvSystemEnabled,
    sustainabilityGoals,
    dashboardWidgets,
    analyticsWidgets,
    quickAccessWidgets,
    addAlert,
    saveToStorage
  ]);

  const syncWithDropbox = useCallback(async () => {
    if (!isDropboxAuthenticated || !dropboxBackupEnabled) {
      return { success: false, merged: false, message: 'Dropbox sync not enabled or authenticated' };
    }
    
    try {
      const localData = {
        userProfile,
        energyProviders,
        devices,
        rentalUnits,
        meterReadings,
        costBenefitAnalyses,
        complianceReports,
        language,
        pvSystemEnabled,
        sustainabilityGoals,
        dashboardWidgets,
        analyticsWidgets,
        quickAccessWidgets,
        timestamp: new Date().toISOString(),
      };
      
      const result = await dropboxService.syncWithDropbox(localData);
      
      if (result.success && result.merged && result.data) {
        await restoreBackup(JSON.stringify(result.data));
        const newSyncTime = new Date();
        setLastSyncTime(newSyncTime);
        await saveToStorage('lastSyncTime', newSyncTime.toISOString());
      } else if (result.success && !result.merged) {
        const newSyncTime = new Date();
        setLastSyncTime(newSyncTime);
        await saveToStorage('lastSyncTime', newSyncTime.toISOString());
      }

      return result;
    } catch (error: any) {
      console.error('Sync with Dropbox error:', error);
      return { success: false, merged: false, message: error.message };
    }
  }, [
    isDropboxAuthenticated,
    dropboxBackupEnabled,
    userProfile,
    energyProviders,
    devices,
    rentalUnits,
    meterReadings,
    costBenefitAnalyses,
    complianceReports,
    language,
    pvSystemEnabled,
    sustainabilityGoals,
    dashboardWidgets,
    analyticsWidgets,
    quickAccessWidgets,
    restoreBackup,
    saveToStorage
  ]);

  const syncWithDropboxRef = useRef(syncWithDropbox);
  syncWithDropboxRef.current = syncWithDropbox;

    useEffect(() => {
    const loadStoredData = async () => {
      setIsLoading(true); // Start loading indicator
      setIsAppReady(false); // Keep splash screen visible initially
      try {
        const authenticated = await dropboxService.isAuthenticated();
        setIsDropboxAuthenticated(authenticated);

        let dataLoadedFromDropbox = false;
        if (authenticated) {
          console.log(`[${Platform.OS.toUpperCase()}] Authenticated with Dropbox. Attempting to download latest backup...`);
          const backups = await listDropboxBackups(); // Use the listDropboxBackups function
          console.log(`[${Platform.OS.toUpperCase()}] Found Dropbox backups:`, backups);
          if (backups.length > 0) {
            const latestBackup = backups.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())[0];
            console.log(`[${Platform.OS.toUpperCase()}] Latest backup identified:`, latestBackup.name);
            const remoteDataString = await dropboxService.downloadBackup(latestBackup.name, (progress) => {
              setDownloadProgress(progress);
            });
            console.log(`[${Platform.OS.toUpperCase()}] Downloaded remote data string length:`, remoteDataString?.length || 0);
            
            if (remoteDataString) {
              try {
                await restoreBackup(remoteDataString);
                dataLoadedFromDropbox = true;
                const newSyncTime = new Date();
                setLastSyncTime(newSyncTime);
                await saveToStorage('lastSyncTime', newSyncTime.toISOString());
                console.log('Successfully loaded data from Dropbox.');
                addAlert({
                  type: 'info',
                  title: 'Daten aus Dropbox geladen',
                  message: 'Ihre Daten wurden erfolgreich aus Dropbox synchronisiert.',
                  timestamp: new Date(),
                  acknowledged: false,
                });
              } catch (e) {
                console.error('Failed to restore backup from Dropbox data.', e);
                addAlert({
                  type: 'error',
                  title: 'Fehler bei Dropbox-Daten',
                  message: 'Die von Dropbox geladenen Daten konnten nicht verarbeitet werden.',
                  timestamp: new Date(),
                  acknowledged: false,
                });
              }
            }
          } else {
            console.log(`[${Platform.OS.toUpperCase()}]No remote backup found on Dropbox. Will load local data.`);
          }
        } else {
          console.log(`[${Platform.OS.toUpperCase()}]Not authenticated with Dropbox. Will load local data.`);
          addAlert({
            type: 'info',
            title: 'Mit Dropbox verbinden',
            message: 'Verbinden Sie sich mit Dropbox, um Ihre Daten auf mehreren Geräten zu sichern und zu synchronisieren.',
            timestamp: new Date(),
            acknowledged: false,
          });
        }

        if (!dataLoadedFromDropbox) {
            console.log(`[${Platform.OS.toUpperCase()}]Loading data from local storage...`);
            const storedProfile = await AsyncStorage.getItem('userProfile');
            if (storedProfile) {
              try {
                const parsedProfile = typeof storedProfile === 'string' ? JSON.parse(storedProfile) : storedProfile;
                if (parsedProfile.pvSystem?.installationDate) {
                  parsedProfile.pvSystem.installationDate = new Date(parsedProfile.pvSystem.installationDate);
                }
                setUserProfile(parsedProfile);
              } catch (error) {
                console.error('Error parsing user profile:', error);
              }
            }
            const storedProviders = await AsyncStorage.getItem('energyProviders');
            if (storedProviders) {
              try {
                const parsedProviders = typeof storedProviders === 'string' ? JSON.parse(storedProviders) : storedProviders;
                if (Array.isArray(parsedProviders)) {
                    const providersWithDates = parsedProviders.map((provider: any) => ({
                      ...provider,
                      validFrom: provider.validFrom ? new Date(provider.validFrom) : undefined,
                      validTo: provider.validTo ? new Date(provider.validTo) : undefined,
                      contractStart: provider.contractStart ? new Date(provider.contractStart) : undefined,
                      contractEnd: provider.contractEnd ? new Date(provider.contractEnd) : undefined
                    }));
                    setEnergyProviders(providersWithDates);
                } else if (parsedProviders) {
                    console.warn('Stored energyProviders was not an array, falling back to default. Value:', parsedProviders);
                    setEnergyProviders(mockEnergyProviders);
                }
              } catch (error) {
                console.error('Error parsing energy providers:', error);
              }
            }
            const storedDevices = await AsyncStorage.getItem('devices');
            if (storedDevices) {
              try {
                const parsedDevices = typeof storedDevices === 'string' ? JSON.parse(storedDevices) : storedDevices;
                if (Array.isArray(parsedDevices)) {
                    const devicesWithDates = parsedDevices.map((device: any) => ({
                      ...device,
                      lastUpdate: device.lastUpdate ? new Date(device.lastUpdate) : new Date()
                    }));
                    setDevices(devicesWithDates);
                }
              } catch (error) {
                console.error('Error parsing devices:', error);
              }
            }
            const storedMeterReadings = await AsyncStorage.getItem('meterReadings');
            if (storedMeterReadings) {
              try {
                const parsedReadings = typeof storedMeterReadings === 'string' ? JSON.parse(storedMeterReadings) : storedMeterReadings;
                if (Array.isArray(parsedReadings)) {
                    const readingsWithDates = parsedReadings.map((reading: any) => ({
                      ...reading,
                      timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date()
                    }));
                    setMeterReadings(readingsWithDates);
                }
              } catch (error) {
                console.error('Error parsing meter readings:', error);
              }
            }
        }

        const storedLanguage = await AsyncStorage.getItem('language');
        if (storedLanguage) setLanguageState(storedLanguage as any);
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) setThemeState(storedTheme as any);
        const storedPvSystem = await AsyncStorage.getItem('pvSystemEnabled');
        if (storedPvSystem) setPvSystemEnabled(JSON.parse(storedPvSystem));
        const storedSustainabilityGoals = await AsyncStorage.getItem('sustainabilityGoals');
        if (storedSustainabilityGoals) setSustainabilityGoals(JSON.parse(storedSustainabilityGoals));
        const storedDashboardWidgets = await AsyncStorage.getItem('dashboardWidgets');
        if (storedDashboardWidgets) {
            try {
                const parsed = JSON.parse(storedDashboardWidgets);
                if(Array.isArray(parsed)) setDashboardWidgets(parsed);
            } catch (e) { console.error("Error parsing dashboard widgets", e)}
        }
        const storedAnalyticsWidgets = await AsyncStorage.getItem('analyticsWidgets');
        if (storedAnalyticsWidgets) {
            try {
                const parsed = JSON.parse(storedAnalyticsWidgets);
                if(Array.isArray(parsed)) setAnalyticsWidgets(parsed);
            } catch (e) { console.error("Error parsing analytics widgets", e)}
        }
        const storedQuickAccessWidgets = await AsyncStorage.getItem('quickAccessWidgets');
        if (storedQuickAccessWidgets) {
            try {
                const parsed = JSON.parse(storedQuickAccessWidgets);
                if(Array.isArray(parsed)) setQuickAccessWidgets(parsed);
            } catch (e) { console.error("Error parsing quick access widgets", e)}
        }
        const storedHiddenAlertIds = await AsyncStorage.getItem('hiddenAlertIds');
        if (storedHiddenAlertIds) {
            try {
                const parsed = JSON.parse(storedHiddenAlertIds);
                if(Array.isArray(parsed)) setHiddenAlertIds(parsed);
            } catch (e) { console.error("Error parsing hidden alert ids", e)}
        }
        const storedNotificationSettings = await AsyncStorage.getItem('notificationSettings');
        if (storedNotificationSettings) setNotificationSettings(JSON.parse(storedNotificationSettings));
        
        await notificationService.initialize();
      } catch (error) {
        console.error('Error loading stored data:', error);
      } finally {
        setIsLoading(false);
        setIsAppReady(true); // App is now ready to render main content
      }
    };
    
    loadStoredData();
  }, []);;

  const autoSyncRef = useRef(forceDropboxSync); // Use forceDropboxSync for auto-sync
  autoSyncRef.current = forceDropboxSync;

  useEffect(() => {
    const isPostLoad = !isLoading;
    const shouldSkipFirstSync = firstSyncAfterLoad.current && isPostLoad;

    if (isLoading || shouldSkipFirstSync) {
      if (shouldSkipFirstSync) {
        firstSyncAfterLoad.current = false;
      }
      return;
    }

    const handler = setTimeout(() => {
      console.log(`[${Platform.OS.toUpperCase()}] Change detected, triggering auto-sync with Dropbox...`);
      if (isDropboxAuthenticated && dropboxBackupEnabled) {
        if (typeof autoSyncRef.current === 'function') {
          autoSyncRef.current();
        } else {
          console.error("autoSyncRef.current is not a function. It is:", autoSyncRef.current);
        }
      } else {
        console.log(`[${Platform.OS.toUpperCase()}] Auto-sync skipped: Dropbox not authenticated or backup not enabled.`);
      }
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [
    userProfile,
    energyProviders,
    devices,
    rentalUnits,
    meterReadings,
    costBenefitAnalyses,
    complianceReports,
    language,
    pvSystemEnabled,
    sustainabilityGoals,
    dashboardWidgets,
    analyticsWidgets,
    quickAccessWidgets,
    isLoading,
    isDropboxAuthenticated,
    dropboxBackupEnabled,
  ]);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...profile };
    setUserProfile(updated);
    saveToStorage('userProfile', updated);
  }, [userProfile, saveToStorage]);

  const addEnergyProvider = useCallback((provider: Omit<EnergyProvider, 'id'>) => {
    const newProvider = { ...provider, id: generateId() };
    const updated = [...energyProviders, newProvider];
    setEnergyProviders(updated);
    saveToStorage('energyProviders', updated);
  }, [energyProviders, saveToStorage]);

  const updateEnergyProvider = useCallback((id: string, provider: Partial<EnergyProvider>) => {
    const updated = energyProviders.map(p => p.id === id ? { ...p, ...provider } : p);
    setEnergyProviders(updated);
    saveToStorage('energyProviders', updated);
  }, [energyProviders, saveToStorage]);

  const removeEnergyProvider = useCallback((id: string) => {
    const updated = energyProviders.filter(p => p.id !== id);
    setEnergyProviders(updated);
    saveToStorage('energyProviders', updated);
  }, [energyProviders, saveToStorage]);

  const addDevice = useCallback((device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: generateId() };
    const updated = [...devices, newDevice];
    setDevices(updated);
    saveToStorage('devices', updated);
  }, [devices, saveToStorage]);

  const updateDevice = useCallback((id: string, device: Partial<Device>) => {
    const updated = devices.map(d => d.id === id ? { ...d, ...device } : d);
    setDevices(updated);
    saveToStorage('devices', updated);
  }, [devices, saveToStorage]);

  const removeDevice = useCallback((id: string) => {
    const updated = devices.filter(d => d.id !== id);
    setDevices(updated);
    saveToStorage('devices', updated);
  }, [devices, saveToStorage]);

  const addRentalUnit = useCallback((unit: Omit<RentalUnit, 'id'>) => {
    const newUnit = { ...unit, id: generateId() };
    const updated = [...rentalUnits, newUnit];
    setRentalUnits(updated);
    saveToStorage('rentalUnits', updated);
  }, [rentalUnits, saveToStorage]);

  const updateRentalUnit = useCallback((id: string, unit: Partial<RentalUnit>) => {
    const updated = rentalUnits.map(u => u.id === id ? { ...u, ...unit } : u);
    setRentalUnits(updated);
    saveToStorage('rentalUnits', updated);
  }, [rentalUnits, saveToStorage]);

  const removeRentalUnit = useCallback((id: string) => {
    const updated = rentalUnits.filter(u => u.id !== id);
    setRentalUnits(updated);
    saveToStorage('rentalUnits', updated);
  }, [rentalUnits, saveToStorage]);

  const acknowledgeAlert = useCallback((id: string) => {
    if (id.startsWith('contract-expiry-') || id === 'unusual-consumption') {
      const dynamicAlert: Alert = {
        id,
        type: 'info',
        title: 'Dynamic Alert',
        message: 'This alert has been acknowledged',
        timestamp: new Date(),
        acknowledged: true
      };
      const updated = [...alerts, dynamicAlert];
      setAlerts(updated);
      saveToStorage('alerts', updated);
    } else {
      const updated = alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
      setAlerts(updated);
      saveToStorage('alerts', updated);
    }
  }, [alerts, saveToStorage]);

  const clearAlert = useCallback((id: string) => {
    if (id.startsWith('contract-expiry-') || id === 'unusual-consumption') {
      setHiddenAlertIds(prev => {
        const clearedAlerts = [...(prev || []), id];
        saveToStorage('hiddenAlertIds', clearedAlerts);
        return clearedAlerts;
      });
    } else {
      setAlerts(prev => {
        const updated = prev.filter(a => a.id !== id);
        saveToStorage('alerts', updated);
        return updated;
      });
    }
  }, [saveToStorage]);

  const addMeterReading = useCallback(async (reading: Omit<MeterReading, 'id'>) => {
    const newReading = { ...reading, id: generateId(), timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date() };
    const updated = [...meterReadings, newReading];
    setMeterReadings(updated);
    saveToStorage('meterReadings', updated);
    
    const currentData = calculateCurrentEnergyData(updated);
    setCurrentEnergyData(currentData);
    
    const electricityProvider = energyProviders.find(p => p.type === 'electricity');
    const electricityPrice = electricityProvider?.pricePerUnit || 0.32;
    const feedInTariff = 0.08;
    
    const dailyStats = calculateEnergyStats(updated, 'daily', devices, energyProviders, sustainabilityGoals);
    const weeklyStats = calculateEnergyStats(updated, 'weekly', devices, energyProviders, sustainabilityGoals);
    const monthlyStats = calculateEnergyStats(updated, 'monthly', devices, energyProviders, sustainabilityGoals);
    
    const recalculateWithRealPricing = (stats: typeof dailyStats) => {
      const selfConsumption = Math.min(stats.production, stats.consumption);
      const gridFeedIn = Math.max(0, stats.production - stats.consumption);
      const gridConsumption = Math.max(0, stats.consumption - stats.production);
      
      const realSavings = (selfConsumption * electricityPrice) + 
                         (gridFeedIn * feedInTariff) - 
                         (gridConsumption * electricityPrice);
      
      return { ...stats, savings: Math.max(0, realSavings) };
    };
    
    setEnergyStats({
      daily: recalculateWithRealPricing(dailyStats),
      weekly: recalculateWithRealPricing(weeklyStats),
      monthly: recalculateWithRealPricing(monthlyStats),
    });
    
    if (notificationSettings.push || notificationSettings.email) {
      try {
        const pushToken = await notificationService.getPushToken();
        const reminder: MeterReadingReminder = {
          id: newReading.meterId,
          meterName: newReading.meterName,
          meterType: newReading.type,
          lastReadingDate: newReading.timestamp || new Date(),
          nextReminderDate: new Date(),
          frequency: 'monthly',
          userEmail: userProfile?.email,
          pushToken: pushToken || undefined,
        };
        
        const results = await notificationService.scheduleMeterReadingReminder(
          reminder,
          notificationSettings,
          language
        );
        
        addAlert({
          type: 'info',
          title: language === 'de' ? 'Erinnerung geplant' : 'Reminder Scheduled',
          message: language === 'de' ? 
            `Erinnerung für ${newReading.meterName} wurde ${results.pushScheduled ? 'als Push-Benachrichtigung ' : ''}${results.emailSent ? 'per E-Mail ' : ''}geplant.` :
            `Reminder for ${newReading.meterName} has been scheduled ${results.pushScheduled ? 'as push notification ' : ''}${results.emailSent ? 'via email ' : ''}.`,
          timestamp: new Date(),
          acknowledged: false,
        });
      } catch (error) {
        console.error('Error scheduling notification reminder:', error);
      }
    }
  }, [meterReadings, energyProviders, devices, sustainabilityGoals, saveToStorage, notificationSettings, userProfile, language, addAlert]);
  
  const updateMeterReading = useCallback((id: string, reading: Partial<MeterReading>) => {
    const updated = meterReadings.map(r => r.id === id ? { ...r, ...reading } : r);
    setMeterReadings(updated);
    saveToStorage('meterReadings', updated);
  }, [meterReadings, saveToStorage]);
  
  const removeMeterReading = useCallback((id: string) => {
    const updated = meterReadings.filter(r => r.id !== id);
    setMeterReadings(updated);
    saveToStorage('meterReadings', updated);
  }, [meterReadings, saveToStorage]);
  

  

  
  const updateEnergyData = useCallback((data: EnergyData) => {
    setCurrentEnergyData(data);
  }, []);
  
  useEffect(() => {
    if (meterReadings.length > 0) {
      const currentData = calculateCurrentEnergyData(meterReadings);
      setCurrentEnergyData(currentData);
      
      const electricityProvider = energyProviders.find(p => p.type === 'electricity');
      const electricityPrice = electricityProvider?.pricePerUnit || 0.32;
      const feedInTariff = 0.08;
      
      const dailyStats = calculateEnergyStats(meterReadings, 'daily', devices, energyProviders, sustainabilityGoals);
      const weeklyStats = calculateEnergyStats(meterReadings, 'weekly', devices, energyProviders, sustainabilityGoals);
      const monthlyStats = calculateEnergyStats(meterReadings, 'monthly', devices, energyProviders, sustainabilityGoals);
      const yearlyStats = calculateEnergyStats(meterReadings, 'yearly', devices, energyProviders, sustainabilityGoals);

      const now = new Date();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const lastMonthConsumptionData = calculateTotalForPeriod(meterReadings, startOfLastMonth, endOfLastMonth, ['electricity', 'gas', 'water']);
      setLastMonthConsumption(lastMonthConsumptionData.total);
      
      const recalculateWithRealPricing = (stats: typeof dailyStats) => {
        const selfConsumption = Math.min(stats.production, stats.consumption);
        const gridFeedIn = Math.max(0, stats.production - stats.consumption);
        const gridConsumption = Math.max(0, stats.consumption - stats.production);
        
        const realSavings = (selfConsumption * electricityPrice) + 
                           (gridFeedIn * feedInTariff) - 
                           (gridConsumption * electricityPrice);
        
        return { ...stats, savings: Math.max(0, realSavings) };
      };
      
      const calculatedStats = {
        daily: recalculateWithRealPricing(dailyStats),
        weekly: recalculateWithRealPricing(weeklyStats),
        monthly: recalculateWithRealPricing(monthlyStats),
        yearly: recalculateWithRealPricing(yearlyStats),
      };
      
      setEnergyStats(calculatedStats);
    } else {
      const emptyStats = {
        production: 0,
        consumption: 0,
        savings: 0,
        co2Saved: 0,
        autarky: 0,
        selfConsumption: 0,
      };
      
      setEnergyStats({
        daily: emptyStats,
        weekly: emptyStats,
        monthly: emptyStats,
        yearly: emptyStats,
      });
      
      setCurrentEnergyData({
        timestamp: new Date(),
        solarProduction: 0,
        consumption: 0,
        batteryLevel: 0,
        batteryCharging: false,
        gridFeedIn: 0,
        gridConsumption: 0,
      });
      setLastMonthConsumption(0);
    }
  }, [meterReadings, energyProviders, devices, sustainabilityGoals]);

  useEffect(() => {
    const checkExpiringContracts = () => {
      const now = new Date();
      const thirtyFiveDaysFromNow = new Date(now.getTime() + (35 * 24 * 60 * 60 * 1000));
      
      energyProviders.forEach(provider => {
        if (provider.contractEnd && provider.contractEnd <= thirtyFiveDaysFromNow && provider.contractEnd > now) {
          const daysUntilExpiry = Math.ceil((provider.contractEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          const existingAlert = alerts.find(alert => 
            alert.type === 'warning' && 
            alert.title.includes('Vertrag läuft ab') && 
            alert.message.includes(provider.name)
          );
          
          if (!existingAlert) {
            addAlert({
              type: 'warning',
              title: language === 'de' ? 'Vertrag läuft ab' : 'Contract Expiring',
              message: language === 'de' ? 
                `Der Vertrag mit ${provider.name} läuft in ${daysUntilExpiry} Tagen ab (${(new Date(provider.contractEnd)).toLocaleDateString()}).` :
                `Contract with ${provider.name} expires in ${daysUntilExpiry} days (${(new Date(provider.contractEnd)).toLocaleDateString()}).`,
              timestamp: new Date(),
              acknowledged: false,
            });
          }
        }
      });
    };
    
    checkExpiringContracts();
    const interval = setInterval(checkExpiringContracts, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [energyProviders, alerts, addAlert, language]);

  const addCostBenefitAnalysis = useCallback((analysis: Omit<CostBenefitAnalysis, 'id'>) => {
    const newAnalysis = { ...analysis, id: generateId() };
    const updated = [...costBenefitAnalyses, newAnalysis];
    setCostBenefitAnalyses(updated);
    saveToStorage('costBenefitAnalyses', updated);
  }, [costBenefitAnalyses, saveToStorage]);

  const generateComplianceReport = useCallback((type: ComplianceReport['type'], period: { from: Date; to: Date }) => {
    const newReport: ComplianceReport = {
      id: generateId(),
      type,
      title: `${type.toUpperCase()} Report - ${period.from.toLocaleDateString()} bis ${period.to.toLocaleDateString()}`,
      period,
      data: {
        totalConsumption: 12500,
        totalProduction: 15200,
        co2Emissions: 2.3,
        co2Savings: 8.7,
        efficiency: 94.2,
      },
      generatedAt: new Date(),
      status: 'draft',
    };
    const updated = [...complianceReports, newReport];
    setComplianceReports(updated);
    saveToStorage('complianceReports', updated);
  }, [complianceReports, saveToStorage]);

  const setLanguage = useCallback((lang: 'de' | 'en' | 'ru') => {
    setLanguageState(lang);
    saveToStorage('language', lang);
    if (userProfile) {
      updateUserProfile({ language: lang });
    }
  }, [saveToStorage, userProfile, updateUserProfile]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    saveToStorage('theme', newTheme);
  }, [saveToStorage]);

  const setPvSystem = useCallback((enabled: boolean) => {
    setPvSystemEnabled(enabled);
    saveToStorage('pvSystemEnabled', enabled);
  }, [saveToStorage]);
  
  const updateSustainabilityGoals = useCallback((goals: Partial<SustainabilityGoals>) => {
    const updated = { ...sustainabilityGoals, ...goals };
    setSustainabilityGoals(updated);
    saveToStorage('sustainabilityGoals', updated);
  }, [sustainabilityGoals, saveToStorage]);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    saveToStorage('notificationSettings', updated);
  }, [notificationSettings, saveToStorage]);

  const addDashboardWidget = useCallback((widgetId: string) => {
    if (!dashboardWidgets.includes(widgetId)) {
      const updated = [...dashboardWidgets, widgetId];
      setDashboardWidgets(updated);
      saveToStorage('dashboardWidgets', updated);
    }
  }, [dashboardWidgets, saveToStorage]);

  const removeDashboardWidget = useCallback((widgetId: string) => {
    const updated = dashboardWidgets.filter(id => id !== widgetId);
    setDashboardWidgets(updated);
    saveToStorage('dashboardWidgets', updated);
  }, [dashboardWidgets, saveToStorage]);

  const addAnalyticsWidget = useCallback((widgetId: string) => {
    if (!analyticsWidgets.includes(widgetId)) {
      const updated = [...analyticsWidgets, widgetId];
      setAnalyticsWidgets(updated);
      saveToStorage('analyticsWidgets', updated);
    }
  }, [analyticsWidgets, saveToStorage]);

  const removeAnalyticsWidget = useCallback((widgetId: string) => {
    const updated = analyticsWidgets.filter(id => id !== widgetId); // Semikolon fehlte hier
    setAnalyticsWidgets(updated);
    saveToStorage('analyticsWidgets', updated);
  }, [analyticsWidgets, saveToStorage]);

  const addQuickAccessWidget = useCallback((widgetId: string) => {
    if (!quickAccessWidgets.includes(widgetId)) {
      const updated = [...quickAccessWidgets, widgetId];
      setQuickAccessWidgets(updated);
      saveToStorage('quickAccessWidgets', updated);
    }
  }, [quickAccessWidgets, saveToStorage]);

  const removeQuickAccessWidget = useCallback((widgetId: string) => {
    const updated = quickAccessWidgets.filter(id => id !== widgetId);
    setQuickAccessWidgets(updated);
    saveToStorage('quickAccessWidgets', updated);
  }, [quickAccessWidgets, saveToStorage]);

  const restoreDefaultDashboardWidgets = useCallback(() => {
    const newDashboardWidgets: string[] = [
      'solar-production',
      'battery',
      'grid-feed-in',
      'savings',
      'co2-saved',
    ];
    const meterDevices = devices.filter(d => d.type === 'meter');
    meterDevices.forEach(device => {
      const reading = meterReadings.find(r => r.meterId === device.id);
      const meterType = reading?.type;
      if (meterType && meterType !== 'solar' && meterType !== 'solar_pv_feed_in') {
        newDashboardWidgets.push(`meter-total-consumption-${device.id}`);
        newDashboardWidgets.push(`meter-last-month-consumption-${device.id}`);
      }
    });
    setDashboardWidgets(newDashboardWidgets);
    saveToStorage('dashboardWidgets', newDashboardWidgets);
  }, [devices, meterReadings, saveToStorage]);

  const restoreDefaultAnalyticsWidgets = useCallback(() => {
    const newAnalyticsWidgets: string[] = [
      'total-production',
      'autarky',
      'self-consumption',
    ];
    const meterDevices = devices.filter(d => d.type === 'meter');
    const meterTypes = new Set<string>();
    meterDevices.forEach(device => {
      const reading = meterReadings.find(r => r.meterId === device.id);
      const meterType = reading?.type;
      if (meterType && meterType !== 'solar' && meterType !== 'solar_pv_feed_in') {
        newAnalyticsWidgets.push(`meter-total-costs-${device.id}`);
        newAnalyticsWidgets.push(`meter-last-month-costs-${device.id}`);
        meterTypes.add(meterType);
      }
    });
    meterTypes.forEach(type => {
      newAnalyticsWidgets.push(`metertype-total-consumption-${type}`);
      newAnalyticsWidgets.push(`metertype-total-costs-${type}`);
    });
    setAnalyticsWidgets(newAnalyticsWidgets);
    saveToStorage('analyticsWidgets', newAnalyticsWidgets);
  }, [devices, meterReadings, saveToStorage]);

  const restoreDefaultQuickAccessWidgets = useCallback(() => {
    const defaultWidgets = ['meter-readings', 'statistics', 'alarms'];
    setQuickAccessWidgets(defaultWidgets);
    saveToStorage('quickAccessWidgets', defaultWidgets);
  }, [saveToStorage]);

  const resolveSyncChoice = useCallback(async (choice: 'local' | 'remote' | 'cancel') => {
    const localData = syncChoice.localData;
    setSyncChoice({ needed: false });

    if (choice === 'local' && localData) {
        await forceDropboxSync(); // Use forceDropboxSync to upload local data
    } else if (choice === 'remote') {
        await downloadAndRestoreFromDropbox(); // Use the new download-only function
    } else {
        setDropboxBackupEnabled(false);
        await saveToStorage('dropboxBackupEnabled', false);
    }
  }, [syncChoice, forceDropboxSync, downloadAndRestoreFromDropbox, saveToStorage]);

  const setDropboxBackup = useCallback(async (enabled: boolean) => {
    setDropboxBackupEnabled(enabled);
    await saveToStorage('dropboxBackupEnabled', enabled);

    if (enabled) {
        const remoteFile = await dropboxService.downloadBackup(SYNC_FILENAME);
        if (remoteFile) {
            const localData = { userProfile, energyProviders, devices, rentalUnits, meterReadings, costBenefitAnalyses, complianceReports, language, pvSystemEnabled, sustainabilityGoals, dashboardWidgets, analyticsWidgets, quickAccessWidgets, timestamp: new Date().toISOString() };
            setSyncChoice({ needed: true, localData: localData });
        } else {
            await forceDropboxSync(); // If no remote, upload local as initial sync
        }
    }
  }, [saveToStorage, forceDropboxSync, userProfile, energyProviders, devices, rentalUnits, meterReadings, costBenefitAnalyses, complianceReports, language, pvSystemEnabled, sustainabilityGoals, dashboardWidgets, analyticsWidgets, quickAccessWidgets]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const startPeriodicCheck = () => {
      intervalId = setInterval(async () => {
        if (isDropboxAuthenticated && dropboxBackupEnabled) {
          try {
            const latestRemoteBackup = await dropboxService.getLatestBackupMetadata();

            if (latestRemoteBackup && lastSyncTime && new Date(latestRemoteBackup.timestamp) > lastSyncTime) {
              console.log(`[${Platform.OS.toUpperCase()}] Remote backup is newer. Downloading and restoring...`);
              const backupData = await dropboxService.downloadBackup(latestRemoteBackup.name);
              if (backupData) {
                const restored = await restoreBackup(backupData);
                if (restored) {
                  addAlert({ type: 'info', title: 'Daten aktualisiert', message: 'Ihre Daten wurden automatisch aus Dropbox aktualisiert.', timestamp: new Date(), acknowledged: false });
                }
              }
            }
          } catch (error) {
            console.error('Error during periodic Dropbox check:', error);
          }
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    };

    if (isDropboxAuthenticated && dropboxBackupEnabled) {
      startPeriodicCheck();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDropboxAuthenticated, dropboxBackupEnabled, lastSyncTime, restoreBackup, addAlert, language]);

  const forceDropboxSyncRef = useRef(forceDropboxSync);
      forceDropboxSyncRef.current = forceDropboxSync;
  
    useEffect(() => {
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'background') {
          console.log(`[${Platform.OS.toUpperCase()}] App has gone to the background. Triggering Dropbox sync.`);
          if (isDropboxAuthenticated && dropboxBackupEnabled) {
              forceDropboxSyncRef.current();
          }
        }
      });
  
      return () => {
        subscription.remove();
      };
    }, [isDropboxAuthenticated, dropboxBackupEnabled]);
  
    const resetAllData = useCallback(async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
  
        setUserProfile(mockUserProfile);
        setEnergyProviders(mockEnergyProviders);
        setDevices(mockDevices);
        setRentalUnits([]);
        setAlerts([]);
        setMeterReadings(initialMeterReadings);
        setCurrentEnergyData(null);
        setEnergyStats(null);
        setLastMonthConsumption(0);
        setCostBenefitAnalyses([]);
        setComplianceReports([]);
        setLanguageState('de');
        setThemeState('light');
        setPvSystemEnabled(true);
        setSustainabilityGoals(defaultSustainabilityGoals);
        setDashboardWidgets([]);
        setAnalyticsWidgets([]);
        setQuickAccessWidgets([
          'meter-readings',
          'statistics',
          'alarms'
        ]);
        setLastSyncTime(null);
        setDropboxBackupEnabled(false);
        setIsDropboxAuthenticated(false);
        setHiddenAlertIds([]);
        setNotificationSettings({
          push: true,
          email: true,
          sms: false,
          reminderDays: 3,
          reminderTime: '09:00',
        });
  
        addAlert({
          type: 'info',
          title: 'App zurückgesetzt',
          message: 'Alle Anwendungsdaten wurden erfolgreich gelöscht.',
          timestamp: new Date(),
          acknowledged: false,
        });
  
      } catch (error) {
        console.error('Error resetting app data:', error);
        addAlert({
          type: 'error',
          title: 'Fehler beim Zurücksetzen',
          message: 'Beim Löschen der Anwendungsdaten ist ein Fehler aufgetreten.',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }, [addAlert]);
  
    return {
      userProfile,
      updateUserProfile,
      energyProviders,
    addEnergyProvider,
    updateEnergyProvider,
    removeEnergyProvider,
    devices,
    addDevice,
    updateDevice,
    removeDevice,
    rentalUnits,
    addRentalUnit,
    updateRentalUnit,
    removeRentalUnit,
    meterReadings,
    addMeterReading,
    updateMeterReading,
    removeMeterReading,
    alerts,
    addAlert,
    acknowledgeAlert,
    clearAlert,
    currentEnergyData,
    energyStats,
    lastMonthConsumption,
    updateEnergyData,
    costBenefitAnalyses,
    addCostBenefitAnalysis,
    complianceReports,
    generateComplianceReport,
    language,
    setLanguage,
    theme,
    setTheme,
    pvSystemEnabled,
    setPvSystem,
    sustainabilityGoals,
    updateSustainabilityGoals,
    dashboardWidgets,
    addDashboardWidget,
    removeDashboardWidget,
    analyticsWidgets,
    addAnalyticsWidget,
    removeAnalyticsWidget,
    isLoading,
    isAppReady,
    downloadProgress,
    createBackup,
    restoreBackup,
    lastSyncTime,
    dropboxBackupEnabled,
    setDropboxBackup,
    isDropboxAuthenticated,
    authenticateDropbox,
    logoutDropbox,
    uploadToDropbox,
    downloadFromDropbox,
    listDropboxBackups,
    quickAccessWidgets,
    addQuickAccessWidget,
    removeQuickAccessWidget,
    notificationSettings,
    updateNotificationSettings,
    restoreDefaultDashboardWidgets,
    restoreDefaultAnalyticsWidgets,
    restoreDefaultQuickAccessWidgets,
    syncWithDropbox,
    syncChoice,
    resolveSyncChoice,
    forceDropboxSync,
    downloadAndRestoreFromDropbox,
    resetAllData,
  };
});