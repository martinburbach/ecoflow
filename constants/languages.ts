export type Language = 'de' | 'en' | 'ru';

export interface Translations {
  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  next: string;
  done: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  close: string;
  
  // Navigation
  dashboard: string;
  analytics: string;
  sustainability: string;
  settings: string;
  
  // Dashboard
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  energyOverview: string;
  solarProduction: string;
  consumption: string;
  batteryStorage: string;
  gridFeedIn: string;
  savings: string;
  environmentalImpact: string;
  co2Saved: string;
  quickAccess: string;
  meterReadings: string;
  devices: string;
  connections: string;
  statistics: string;
  alarms: string;
  energyTip: string;
  firstSteps: string;
  addRemoveWidgets: string;
  noAlarmsActive: string;
  electricityCost: string;
  gasCost: string;
  waterCost: string;
  totalCost: string;
  lastMonthConsumption: string;
  costs: string;
  lastMonthCosts: string;
  totalCosts: string;
  
  // Analytics
  productionVsConsumption: string;
  forecast: string;
  totalProduction: string;
  totalConsumption: string;
  selfConsumption: string;
  autarky: string;
  
  // Settings
  accountSettings: string;
  editProfile: string;
  notifications: string;
  language: string;
  systemSettings: string;
  manageDevices: string;
  energyProviders: string;
  connectivity: string;
  automaticBackup: string;
  dataBackup: string;
  createBackup: string;
  restoreData: string;
  helpSupport: string;
  privacy: string;
  systemInfo: string;
  appVersion: string;
  lastSync: string;
  storageUsed: string;
  logout: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  pvSystemActive: string;
  
  // Languages
  german: string;
  english: string;
  russian: string;
  
      // Devices
      meter: string;
      online: string;
      offline: string;  
  // Meter types
  electricity: string;
  gas: string;
  water: string;
  heat: string;
  solar_pv_feed_in: string;
  
  // Units
  kwh: string;
  m3: string;
  euro: string;
  kg: string;
  percent: string;
  
  // Time periods
  today: string;
  week: string;
  month: string;
  year: string;
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  
  // Achievements
  achievements: string;
  compareWithOthers: string;
  shareImpact: string;
  energySaver: string;
  solarPioneer: string;
  ecoWarrior: string;
  greenLeader: string;
  sustainabilityChampion: string;
  monthlyCo2Goal: string;
  energySaverGoal: string;
  solarPioneerGoal: string;
  sustainabilityChampionGoal: string;
  
  // Alerts
  connectionSuccessful: string;
  connectionFailed: string;
  backupCreated: string;
  backupFailed: string;
  dataRestored: string;
  restoreFailed: string;
}

export const translations: Record<Language, Translations> = {
  de: {
    // Common
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    back: 'Zurück',
    next: 'Weiter',
    done: 'Fertig',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolgreich',
    warning: 'Warnung',
    info: 'Information',
    close: 'Schließen',
    
    // Navigation
    dashboard: 'Dashboard',
    analytics: 'Statistiken',
    sustainability: 'Nachhaltigkeit',
    settings: 'Einstellungen',
    
    // Dashboard
    goodMorning: 'Guten Morgen!',
    goodAfternoon: 'Guten Tag!',
    goodEvening: 'Guten Abend!',
    energyOverview: 'Ihre Energieübersicht',
    solarProduction: 'Solar-Produktion',
    consumption: 'Verbrauch',
    batteryStorage: 'Batteriespeicher',
    gridFeedIn: 'Netzeinspeisung',
    savings: 'Ersparnis',
    environmentalImpact: 'Umweltbilanz',
    co2Saved: 'CO₂ eingespart',
    quickAccess: 'Schnellzugriff',
    meterReadings: 'Zählerstände',
    devices: 'Geräte verwalten',
    connections: 'Verbindungen',
    statistics: 'Statistiken',
    alarms: 'Alarme',
    energyTip: 'Energiespar-Tipp',
    firstSteps: 'Erste Schritte',
    addRemoveWidgets: 'Widgets hinzufügen/entfernen',
    noAlarmsActive: 'Keine aktiven Alarme',
    electricityCost: 'Stromkosten',
    gasCost: 'Gaskosten',
    waterCost: 'Wasserkosten',
    totalCost: 'Gesamtkosten',
    lastMonthConsumption: 'Verbrauch letzter Monat',
    costs: 'Kosten',
    lastMonthCosts: 'Kosten letzter Monat',
    totalCosts: 'Gesamtkosten',
    
    // Analytics
    productionVsConsumption: 'Produktion vs. Verbrauch',
    forecast: 'Prognose',
    totalProduction: 'Gesamtproduktion',
    totalConsumption: 'Gesamtverbrauch',
    selfConsumption: 'Eigenverbrauch',
    autarky: 'Autarkie',
    
    // Settings
    accountSettings: 'Konto',
    editProfile: 'Profil bearbeiten',
    notifications: 'Benachrichtigungen',
    language: 'Sprache',
    systemSettings: 'System',
    manageDevices: 'Geräte verwalten',
    energyProviders: 'Energieversorger',
    connectivity: 'Verbindungen',
    automaticBackup: 'Automatisches Backup',
    dataBackup: 'Daten & Backup',
    createBackup: 'Backup erstellen',
    restoreData: 'Daten wiederherstellen',
    helpSupport: 'Hilfe & Support',
    privacy: 'Datenschutz',
    systemInfo: 'System-Information',
    appVersion: 'App-Version',
    lastSync: 'Letzte Synchronisation',
    storageUsed: 'Speicher verwendet',
    logout: 'Abmelden',
    theme: 'Design',
    lightTheme: 'Hell',
    darkTheme: 'Dunkel',
    pvSystemActive: 'PV-Anlage aktiv',
    
    // Languages
    german: 'Deutsch',
    english: 'English',
    russian: 'Русский',
    
    // Devices
    meter: 'Zähler',
    online: 'Aktiv',
    offline: 'Inaktiv',
    
    // Meter types
    electricity: 'Strom',
    gas: 'Gas',
    water: 'Wasser',
    heat: 'Wärme',
    solar_pv_feed_in: 'Solar PV - Einspeisung',
    
    // Units
    kwh: 'kWh',
    m3: 'm³',
    euro: '€',
    kg: 'kg',
    percent: '%',
    
    // Time periods
    today: 'Heute',
    week: 'Woche',
    month: 'Monat',
    year: 'Jahr',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    
    // Achievements
    achievements: 'Erfolge',
    compareWithOthers: 'Mit anderen vergleichen',
    shareImpact: 'Impact teilen',
    energySaver: 'Energiesparer',
    solarPioneer: 'Solar-Pionier',
    ecoWarrior: 'Öko-Krieger',
    greenLeader: 'Grüner Anführer',
    sustainabilityChampion: 'Nachhaltigkeits-Champion',
    monthlyCo2Goal: 'Monatliches CO2-Ziel',
    energySaverGoal: 'Energiesparer-Ziel',
    solarPioneerGoal: 'Solar-Pionier-Ziel',
    sustainabilityChampionGoal: 'Nachhaltigkeits-Champion-Ziel',
    
    // Alerts
    connectionSuccessful: 'Verbindung erfolgreich',
    connectionFailed: 'Verbindung fehlgeschlagen',
    backupCreated: 'Backup erstellt',
    backupFailed: 'Backup fehlgeschlagen',
    dataRestored: 'Daten wiederhergestellt',
    restoreFailed: 'Wiederherstellung fehlgeschlagen',
  },
  
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    close: 'Close',
    
    // Navigation
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    sustainability: 'Sustainability',
    settings: 'Settings',
    
    // Dashboard
    goodMorning: 'Good Morning!',
    goodAfternoon: 'Good Afternoon!',
    goodEvening: 'Good Evening!',
    energyOverview: 'Your Energy Overview',
    solarProduction: 'Solar Production',
    consumption: 'Consumption',
    batteryStorage: 'Battery Storage',
    gridFeedIn: 'Grid Feed-in',
    savings: 'Savings',
    environmentalImpact: 'Environmental Impact',
    co2Saved: 'CO₂ Saved',
    quickAccess: 'Quick Access',
    meterReadings: 'Meter Readings',
    devices: 'Manage Devices',
    connections: 'Connections',
    statistics: 'Statistics',
    alarms: 'Alarms',
    energyTip: 'Energy Tip',
    firstSteps: 'First Steps',
    addRemoveWidgets: 'Add/Remove Widgets',
    noAlarmsActive: 'No active alarms',
    electricityCost: 'Electricity Cost',
    gasCost: 'Gas Cost',
    waterCost: 'Water Cost',
    totalCost: 'Total Cost',
    lastMonthConsumption: 'Last Month Consumption',
    costs: 'Costs',
    lastMonthCosts: 'Last Month Costs',
    totalCosts: 'Total Costs',
    
    // Analytics
    productionVsConsumption: 'Production vs. Consumption',
    forecast: 'Forecast',
    totalProduction: 'Total Production',
    totalConsumption: 'Total Consumption',
    selfConsumption: 'Self Consumption',
    autarky: 'Autarky',
    
    // Settings
    accountSettings: 'Account',
    editProfile: 'Edit Profile',
    notifications: 'Notifications',
    language: 'Language',
    systemSettings: 'System',
    manageDevices: 'Manage Devices',
    energyProviders: 'Energy Providers',
    connectivity: 'Connectivity',
    automaticBackup: 'Automatic Backup',
    dataBackup: 'Data & Backup',
    createBackup: 'Create Backup',
    restoreData: 'Restore Data',
    helpSupport: 'Help & Support',
    privacy: 'Privacy',
    systemInfo: 'System Information',
    appVersion: 'App Version',
    lastSync: 'Last Sync',
    storageUsed: 'Storage Used',
    logout: 'Logout',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    pvSystemActive: 'PV System Active',
    
    // Languages
    german: 'Deutsch',
    english: 'English',
    russian: 'Русский',
    
    // Devices
    inverter: 'Inverter',
    battery: 'Battery Storage',
    meter: 'Meter',
    sensor: 'Sensor',
    online: 'Online',
    offline: 'Offline',
    
    // Meter types
    electricity: 'Electricity',
    gas: 'Gas',
    water: 'Water',
    heat: 'Heat',
    solar_pv_feed_in: 'Solar PV - Grid Feed-in',
    
    // Units
    kwh: 'kWh',
    m3: 'm³',
    euro: '€',
    kg: 'kg',
    percent: '%',
    
    // Time periods
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    
    // Achievements
    achievements: 'Achievements',
    compareWithOthers: 'Compare with Others',
    shareImpact: 'Share Impact',
    energySaver: 'Energy Saver',
    solarPioneer: 'Solar Pioneer',
    ecoWarrior: 'Eco Warrior',
    greenLeader: 'Green Leader',
    sustainabilityChampion: 'Sustainability Champion',
    monthlyCo2Goal: 'Monthly CO2 Goal',
    energySaverGoal: 'Energy Saver Goal',
    solarPioneerGoal: 'Solar Pioneer Goal',
    sustainabilityChampionGoal: 'Sustainability Champion Goal',
    
    // Alerts
    connectionSuccessful: 'Connection Successful',
    connectionFailed: 'Connection Failed',
    backupCreated: 'Backup Created',
    backupFailed: 'Backup Failed',
    dataRestored: 'Data Restored',
    restoreFailed: 'Restore Failed',
  },
  
  ru: {
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    back: 'Назад',
    next: 'Далее',
    done: 'Готово',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    warning: 'Предупреждение',
    info: 'Информация',
    close: 'Закрыть',
    
    // Navigation
    dashboard: 'Панель',
    analytics: 'Аналитика',
    sustainability: 'Устойчивость',
    settings: 'Настройки',
    
    // Dashboard
    goodMorning: 'Доброе утро!',
    goodAfternoon: 'Добрый день!',
    goodEvening: 'Добрый вечер!',
    energyOverview: 'Обзор энергии',
    solarProduction: 'Солнечная выработка',
    consumption: 'Потребление',
    batteryStorage: 'Аккумулятор',
    gridFeedIn: 'Подача в сеть',
    savings: 'Экономия',
    environmentalImpact: 'Экологический эффект',
    co2Saved: 'CO₂ сэкономлено',
    quickAccess: 'Быстрый доступ',
    meterReadings: 'Показания счетчиков',
    devices: 'Управление устройствами',
    connections: 'Подключения',
    statistics: 'Статистика',
    alarms: 'Сигналы',
    energyTip: 'Совет по энергии',
    firstSteps: 'Первые шаги',
    addRemoveWidgets: 'Добавить/Удалить виджеты',
    noAlarmsActive: 'Нет активных сигналов',
    electricityCost: 'Стоимость электричества',
    gasCost: 'Стоимость газа',
    waterCost: 'Стоимость воды',
    totalCost: 'Общая стоимость',
    lastMonthConsumption: 'Потребление за прошлый месяц',
    costs: 'Расходы',
    lastMonthCosts: 'Расходы за прошлый месяц',
    totalCosts: 'Общие расходы',
    
    // Analytics
    productionVsConsumption: 'Производство vs. Потребление',
    forecast: 'Прогноз',
    totalProduction: 'Общее производство',
    totalConsumption: 'Общее потребление',
    selfConsumption: 'Собственное потребление',
    autarky: 'Автаркия',
    
    // Settings
    accountSettings: 'Аккаунт',
    editProfile: 'Редактировать профиль',
    notifications: 'Уведомления',
    language: 'Язык',
    systemSettings: 'Система',
    manageDevices: 'Управление устройствами',
    energyProviders: 'Поставщики энергии',
    connectivity: 'Подключения',
    automaticBackup: 'Автоматическое резервирование',
    dataBackup: 'Данные и резервирование',
    createBackup: 'Создать резервную копию',
    restoreData: 'Восстановить данные',
    helpSupport: 'Помощь и поддержка',
    privacy: 'Конфиденциальность',
    systemInfo: 'Системная информация',
    appVersion: 'Версия приложения',
    lastSync: 'Последняя синхронизация',
    storageUsed: 'Использовано памяти',
    logout: 'Выйти',
    theme: 'Тема',
    lightTheme: 'Светлая',
    darkTheme: 'Темная',
    pvSystemActive: 'PV система активна',
    
    // Languages
    german: 'Deutsch',
    english: 'English',
    russian: 'Русский',
    
    // Devices
    inverter: 'Инвертор',
    battery: 'Аккумулятор',
    meter: 'Счетчик',
    sensor: 'Датчик',
    online: 'Онлайн',
    offline: 'Офлайн',
    
    // Meter types
    electricity: 'Электричество',
    gas: 'Газ',
    water: 'Вода',
    heat: 'Тепло',
    solar_pv_feed_in: 'Солнечная панель - Подача в сеть',
    
    // Units
    kwh: 'кВт·ч',
    m3: 'м³',
    euro: '€',
    kg: 'кг',
    percent: '%',
    
    // Time periods
    today: 'Сегодня',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    yearly: 'Ежегодно',
    
    // Achievements
    achievements: 'Достижения',
    compareWithOthers: 'Сравнить с другими',
    shareImpact: 'Поделиться результатом',
    energySaver: 'Энергосберегатель',
    solarPioneer: 'Солнечный пионер',
    ecoWarrior: 'Эко-воин',
    greenLeader: 'Зеленый лидер',
    sustainabilityChampion: 'Чемпион устойчивости',
    monthlyCo2Goal: 'Ежемесячная цель по CO2',
    energySaverGoal: 'Цель по экономии энергии',
    solarPioneerGoal: 'Цель солнечного пионера',
    sustainabilityChampionGoal: 'Цель чемпиона по устойчивости',
    
    // Alerts
    connectionSuccessful: 'Подключение успешно',
    connectionFailed: 'Ошибка подключения',
    backupCreated: 'Резервная копия создана',
    backupFailed: 'Ошибка резервирования',
    dataRestored: 'Данные восстановлены',
    restoreFailed: 'Ошибка восстановления',
  },
};

export const useTranslation = (language: Language) => {
  return translations[language];
};

// Meter types with all common types
export const METER_TYPES = [
  // Hauptzählertypen
  { id: 'electricity', name: 'Strom', unit: 'kWh', icon: 'Zap', category: 'main' },
  { id: 'gas', name: 'Gas', unit: 'm³', icon: 'Flame', category: 'main' },
  { id: 'water', name: 'Wasser', unit: 'm³', icon: 'Droplets', category: 'main' },
  { id: 'heat', name: 'Wärme', unit: 'kWh', icon: 'Thermometer', category: 'main' },
  
  // Heizungstypen
  { id: 'oil', name: 'Öl', unit: 'L', icon: 'Fuel', category: 'heating', hasLevelMeasurement: true },
  { id: 'oil_cm', name: 'Öl (Füllstand)', unit: 'cm', icon: 'Fuel', category: 'heating', isLevelMeter: true },
  { id: 'district_heating', name: 'Fernwärme', unit: 'MWh', icon: 'Building', category: 'heating' },

  // Erneuerbare Energien
  { id: 'solar', name: 'Solar PV', unit: 'kWh', icon: 'Sun', category: 'renewable' },
  { id: 'solar_pv_feed_in', name: 'Solar PV - Einspeisung', unit: 'kWh', icon: 'Sun', category: 'renewable' },
  { id: 'solar_thermal', name: 'Solarthermie', unit: 'kWh', icon: 'Sun', category: 'renewable' },
  
  // Unterzähler
  { id: 'submeter_electricity', name: 'Unterzähler Strom', unit: 'kWh', icon: 'Zap', category: 'submeter' },
  { id: 'submeter_water', name: 'Unterzähler Wasser', unit: 'm³', icon: 'Droplets', category: 'submeter' },
  { id: 'submeter_heat', name: 'Unterzähler Wärme', unit: 'kWh', icon: 'Thermometer', category: 'submeter' },
  { id: 'submeter_gas', name: 'Unterzähler Gas', unit: 'm³', icon: 'Flame', category: 'submeter' },
  
  // Wasserzähler-Varianten
  { id: 'hot_water', name: 'Warmwasser', unit: 'm³', icon: 'Droplets', category: 'water' },
  { id: 'cold_water', name: 'Kaltwasser', unit: 'm³', icon: 'Droplets', category: 'water' },
  { id: 'irrigation', name: 'Bewässerung', unit: 'm³', icon: 'Droplets', category: 'water' },
  { id: 'pool', name: 'Pool', unit: 'm³', icon: 'Droplets', category: 'water' },
  { id: 'rainwater', name: 'Regenwasser', unit: 'm³', icon: 'Droplets', category: 'water' },
  { id: 'wastewater', name: 'Abwasser', unit: 'm³', icon: 'Droplets', category: 'water' },
  
  // E-Mobilität
  { id: 'ev_charger', name: 'E-Auto Ladestation', unit: 'kWh', icon: 'Zap', category: 'emobility' },
  { id: 'ev_charger_dc', name: 'DC Schnelllader', unit: 'kWh', icon: 'Zap', category: 'emobility' },
  { id: 'ebike_charger', name: 'E-Bike Ladestation', unit: 'kWh', icon: 'Zap', category: 'emobility' },
] as const;

export const METER_CATEGORIES = {
  main: 'Hauptzähler',
  heating: 'Heizung',
  renewable: 'Erneuerbare',
  submeter: 'Unterzähler',
  water: 'Wasserzähler',
  emobility: 'E-Mobilität',
} as const;



// API manufacturers for connections
export const API_MANUFACTURERS = [] as const;

// Energieversorger mit Kontaktdaten
export interface ProviderInfo {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  types: Array<'electricity' | 'gas' | 'water' | 'heating'>;
}

export const ENERGY_PROVIDERS_DATA: ProviderInfo[] = [
  {
    name: 'Stadtwerke München',
    phone: '+49 89 2361-0',
    email: 'service@swm.de',
    website: 'https://www.swm.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'E.ON',
    phone: '+49 871 95 38 62 00',
    email: 'kundenservice@eon.de',
    website: 'https://www.eon.de',
    types: ['electricity', 'gas']
  },
  {
    name: 'Vattenfall',
    phone: '+49 30 267 10 267',
    email: 'kundenservice@vattenfall.de',
    website: 'https://www.vattenfall.de',
    types: ['electricity', 'gas', 'heating']
  },
  {
    name: 'EnBW',
    phone: '+49 721 72586-001',
    email: 'service@enbw.com',
    website: 'https://www.enbw.com',
    types: ['electricity', 'gas']
  },
  {
    name: 'RWE',
    phone: '+49 800 2255793',
    email: 'kundenservice@rwe.com',
    website: 'https://www.rwe.com',
    types: ['electricity', 'gas']
  },
  {
    name: 'Stadtwerke Berlin',
    phone: '+49 30 267 43 267',
    email: 'service@berlinerstadtwerke.de',
    website: 'https://www.berlinerstadtwerke.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Hamburg',
    phone: '+49 40 2396-2396',
    email: 'kundenservice@hamburgenergie.de',
    website: 'https://www.hamburgenergie.de',
    types: ['electricity', 'gas']
  },
  {
    name: 'Stadtwerke Frankfurt',
    phone: '+49 69 213-88888',
    email: 'service@mainova.de',
    website: 'https://www.mainova.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Köln',
    phone: '+49 221 178-0',
    email: 'service@rheinenergie.com',
    website: 'https://www.rheinenergie.com',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Stuttgart',
    phone: '+49 711 7891-0',
    email: 'info@stadtwerke-stuttgart.de',
    website: 'https://www.stadtwerke-stuttgart.de',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Düsseldorf',
    phone: '+49 211 821-821',
    email: 'service@swd-ag.de',
    website: 'https://www.swd-ag.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Leipzig',
    phone: '+49 341 121-3333',
    email: 'kundenservice@L.de',
    website: 'https://www.L.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Dresden',
    phone: '+49 351 860-4444',
    email: 'service@drewag.de',
    website: 'https://www.sachsenenergie.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Hannover',
    phone: '+49 511 430-0',
    email: 'kundenservice@enercity.de',
    website: 'https://www.enercity.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Bremen',
    phone: '+49 421 359-0',
    email: 'service@swb-gruppe.de',
    website: 'https://www.swb.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Nürnberg',
    phone: '+49 911 802-0',
    email: 'kundenservice@n-ergie.de',
    website: 'https://www.n-ergie.de',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Dortmund',
    phone: '+49 231 22 22 21 21',
    email: 'info@dew21.de',
    website: 'https://www.dew21.de',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Essen',
    phone: '+49 201 800-0',
    email: 'info@stadtwerke-essen.de',
    website: 'https://www.stadtwerke-essen.de',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Bochum',
    phone: '+49 234 960-0',
    email: 'service@stadtwerke-bochum.de',
    website: 'https://www.stadtwerke-bochum.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Wuppertal',
    phone: '+49 202 569-0',
    email: 'info@wsw-online.de',
    website: 'https://www.wsw-online.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Bielefeld',
    phone: '+49 521 51-0',
    email: 'info@stadtwerke-bielefeld.de',
    website: 'https://www.stadtwerke-bielefeld.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Bonn',
    phone: '+49 228 711-0',
    email: 'kundenservice@stadtwerke-bonn.de',
    website: 'https://www.stadtwerke-bonn.de',
    types: ['electricity', 'gas', 'water']
  },
  {
    name: 'Stadtwerke Mannheim',
    phone: '+49 621 290-0',
    email: 'info@mvv.de',
    website: 'https://www.mvv.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Karlsruhe',
    phone: '+49 721 599-0',
    email: 'service@stadtwerke-karlsruhe.de',
    website: 'https://www.stadtwerke-karlsruhe.de',
    types: ['electricity', 'gas', 'water', 'heating']
  },
  {
    name: 'Stadtwerke Augsburg',
    phone: '+49 821 6500-0',
    email: 'info@sw-augsburg.de',
    website: 'https://www.sw-augsburg.de',
    types: ['electricity', 'gas', 'water']
  }
];

export const ENERGY_PROVIDERS = ENERGY_PROVIDERS_DATA.map(p => p.name);