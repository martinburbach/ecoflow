import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Shield,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Share,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyScreen() {
  const { language } = useApp();
  const { colors } = useTheme();
  const t = useTranslation(language);

  const privacySections = [
    {
      icon: <Database color={colors.primary} size={24} />,
      title: language === 'de' ? 'Datensammlung' : language === 'en' ? 'Data Collection' : 'Сбор данных',
      content: language === 'de' ? 
        'Wir sammeln nur die Daten, die für die Funktionalität der App erforderlich sind. Dazu gehören Energieverbrauchsdaten, Geräteinformationen und Nutzungsstatistiken.' :
        language === 'en' ? 
        'We only collect data that is necessary for the app\'s functionality. This includes energy consumption data, device information, and usage statistics.' :
        'Мы собираем только данные, необходимые для функциональности приложения. Это включает данные о потреблении энергии, информацию об устройствах и статистику использования.'
    },
    {
      icon: <Lock color={colors.primary} size={24} />,
      title: language === 'de' ? 'Datensicherheit' : language === 'en' ? 'Data Security' : 'Безопасность данных',
      content: language === 'de' ? 
        'Alle Ihre Daten werden verschlüsselt gespeichert und übertragen. Wir verwenden branchenübliche Sicherheitsmaßnahmen zum Schutz Ihrer Informationen.' :
        language === 'en' ? 
        'All your data is stored and transmitted encrypted. We use industry-standard security measures to protect your information.' :
        'Все ваши данные хранятся и передаются в зашифрованном виде. Мы используем стандартные отраслевые меры безопасности для защиты вашей информации.'
    },
    {
      icon: <Share color={colors.primary} size={24} />,
      title: language === 'de' ? 'Datenweitergabe' : language === 'en' ? 'Data Sharing' : 'Передача данных',
      content: language === 'de' ? 
        'Wir geben Ihre persönlichen Daten nicht an Dritte weiter, außer wenn dies gesetzlich vorgeschrieben ist oder Sie ausdrücklich zugestimmt haben.' :
        language === 'en' ? 
        'We do not share your personal data with third parties, except when required by law or with your explicit consent.' :
        'Мы не передаем ваши личные данные третьим лицам, за исключением случаев, когда это требуется по закону или с вашего явного согласия.'
    },
    {
      icon: <Eye color={colors.primary} size={24} />,
      title: language === 'de' ? 'Ihre Rechte' : language === 'en' ? 'Your Rights' : 'Ваши права',
      content: language === 'de' ? 
        'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Übertragbarkeit Ihrer Daten. Kontaktieren Sie uns, um diese Rechte auszuüben.' :
        language === 'en' ? 
        'You have the right to access, correct, delete, and transfer your data. Contact us to exercise these rights.' :
        'У вас есть право на доступ, исправление, удаление и передачу ваших данных. Свяжитесь с нами, чтобы воспользоваться этими правами.'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Shield color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{t.privacy}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.introSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            {language === 'de' ? 'Datenschutzerklärung' : language === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            {language === 'de' ? 
              'Ihre Privatsphäre ist uns wichtig. Diese Datenschutzerklärung erklärt, wie wir Ihre Daten sammeln, verwenden und schützen.' :
              language === 'en' ? 
              'Your privacy is important to us. This privacy policy explains how we collect, use, and protect your data.' :
              'Ваша конфиденциальность важна для нас. Эта политика конфиденциальности объясняет, как мы собираем, используем и защищаем ваши данные.'
            }
          </Text>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            {language === 'de' ? 'Letzte Aktualisierung: 1. Januar 2024' : 
             language === 'en' ? 'Last updated: January 1, 2024' : 
             'Последнее обновление: 1 января 2024'}
          </Text>
        </View>

        {privacySections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              {section.icon}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{section.content}</Text>
          </View>
        ))}

        <View style={[styles.contactSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            {language === 'de' ? 'Fragen zum Datenschutz?' : language === 'en' ? 'Privacy Questions?' : 'Вопросы о конфиденциальности?'}
          </Text>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            {language === 'de' ? 
              'Wenn Sie Fragen zu unserer Datenschutzerklärung haben, kontaktieren Sie uns unter:' :
              language === 'en' ? 
              'If you have questions about our privacy policy, contact us at:' :
              'Если у вас есть вопросы о нашей политике конфиденциальности, свяжитесь с нами по адресу:'
            }
          </Text>
          <Text style={[styles.contactEmail, { color: colors.primary }]}>privacy@ecoflow-pro.com</Text>
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
  introSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactSection: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
});