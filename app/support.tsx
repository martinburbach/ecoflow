import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Book,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';

export default function SupportScreen() {
  const { language } = useApp();
  const { colors } = useTheme();
  const t = useTranslation(language);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@ecoflow-pro.com?subject=EcoFlow Pro Support');
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+4930123456789');
  };

  const handleChatSupport = () => {
    // In a real app, this would open a chat widget
    console.log('Open chat support');
  };

  const faqItems = [
    {
      question: language === 'de' ? 'Wie füge ich einen neuen Zähler hinzu?' : 
                language === 'en' ? 'How do I add a new meter?' : 
                'Как добавить новый счетчик?',
      answer: language === 'de' ? 'Gehen Sie zu "Geräte verwalten" und tippen Sie auf das Plus-Symbol. Wählen Sie den Zählertyp aus und folgen Sie den Anweisungen.' :
              language === 'en' ? 'Go to "Manage Devices" and tap the plus icon. Select the meter type and follow the instructions.' :
              'Перейдите в "Управление устройствами" и нажмите на значок плюс. Выберите тип счетчика и следуйте инструкциям.'
    },
    {
      question: language === 'de' ? 'Wie kann ich meine PV-Anlage verbinden?' : 
                language === 'en' ? 'How can I connect my PV system?' : 
                'Как подключить мою PV-систему?',
      answer: language === 'de' ? 'Gehen Sie zu "Verbindungen" und wählen Sie Ihren Wechselrichter-Hersteller aus. Geben Sie die IP-Adresse und weitere Verbindungsdetails ein.' :
              language === 'en' ? 'Go to "Connections" and select your inverter manufacturer. Enter the IP address and other connection details.' :
              'Перейдите в "Подключения" и выберите производителя вашего инвертора. Введите IP-адрес и другие детали подключения.'
    },
    {
      question: language === 'de' ? 'Warum werden meine Daten nicht synchronisiert?' : 
                language === 'en' ? 'Why are my data not syncing?' : 
                'Почему мои данные не синхронизируются?',
      answer: language === 'de' ? 'Überprüfen Sie Ihre Internetverbindung und stellen Sie sicher, dass alle Geräte korrekt konfiguriert sind. Kontaktieren Sie den Support, wenn das Problem weiterhin besteht.' :
              language === 'en' ? 'Check your internet connection and make sure all devices are correctly configured. Contact support if the problem persists.' :
              'Проверьте интернет-соединение и убедитесь, что все устройства правильно настроены. Обратитесь в поддержку, если проблема не исчезает.'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <HelpCircle color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{t.helpSupport}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'de' ? 'Kontakt' : language === 'en' ? 'Contact' : 'Контакт'}
          </Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
            <Mail color={colors.primary} size={24} />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>support@ecoflow-pro.com</Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handlePhoneSupport}>
            <Phone color={colors.primary} size={24} />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                {language === 'de' ? 'Telefon Support' : language === 'en' ? 'Phone Support' : 'Телефонная поддержка'}
              </Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>+49 30 123 456 789</Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleChatSupport}>
            <MessageCircle color={colors.primary} size={24} />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                {language === 'de' ? 'Live Chat' : language === 'en' ? 'Live Chat' : 'Живой чат'}
              </Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Mo-Fr 9:00-18:00' : language === 'en' ? 'Mon-Fri 9:00-18:00' : 'Пн-Пт 9:00-18:00'}
              </Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'de' ? 'Häufig gestellte Fragen' : language === 'en' ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'}
          </Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={[styles.faqItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'de' ? 'Tutorials' : language === 'en' ? 'Tutorials' : 'Обучение'}
          </Text>
          
          <TouchableOpacity style={styles.tutorialItem}>
            <Book color={colors.primary} size={24} />
            <View style={styles.tutorialInfo}>
              <Text style={[styles.tutorialTitle, { color: colors.text }]}>
                {language === 'de' ? 'Erste Schritte' : language === 'en' ? 'Getting Started' : 'Первые шаги'}
              </Text>
              <Text style={[styles.tutorialSubtitle, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Grundlegende Einrichtung der App' : 
                 language === 'en' ? 'Basic app setup' : 
                 'Базовая настройка приложения'}
              </Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tutorialItem}>
            <Book color={colors.primary} size={24} />
            <View style={styles.tutorialInfo}>
              <Text style={[styles.tutorialTitle, { color: colors.text }]}>
                {language === 'de' ? 'Geräte hinzufügen' : language === 'en' ? 'Adding Devices' : 'Добавление устройств'}
              </Text>
              <Text style={[styles.tutorialSubtitle, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Zähler und Wechselrichter konfigurieren' : 
                 language === 'en' ? 'Configure meters and inverters' : 
                 'Настройка счетчиков и инверторов'}
              </Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tutorialItem}>
            <Book color={colors.primary} size={24} />
            <View style={styles.tutorialInfo}>
              <Text style={[styles.tutorialTitle, { color: colors.text }]}>
                {language === 'de' ? 'Datenanalyse' : language === 'en' ? 'Data Analysis' : 'Анализ данных'}
              </Text>
              <Text style={[styles.tutorialSubtitle, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Statistiken und Berichte verstehen' : 
                 language === 'en' ? 'Understanding statistics and reports' : 
                 'Понимание статистики и отчетов'}
              </Text>
            </View>
            <ExternalLink color={colors.secondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  tutorialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tutorialInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tutorialSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});