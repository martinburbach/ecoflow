import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Leaf,
  TreePine,
  Droplets,
  Wind,
  Award,
  Target,
  TrendingUp,
  Share2,
  Users,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { formatNumber } from '@/utils/energyCalculations';
import { useTranslation } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  completed: boolean;
}



export default function SustainabilityScreen() {
  const { energyStats, language, theme, sustainabilityGoals } = useApp();
  const t = useTranslation(language);
  const { colors } = useTheme();
  const currentStats = energyStats?.monthly;
  
  // Calculate real achievements based on actual data
  const achievements: Achievement[] = useMemo(() => {
    const monthlyCO2Saved = currentStats?.co2Saved || 0;
    const monthlyProduction = currentStats?.production || 0;
    const monthlySavings = currentStats?.savings || 0;

    console.log("SustainabilityChampion check:", {
      monthlySavings,
      goal: sustainabilityGoals.sustainabilityChampionGoal,
      completed: monthlySavings >= sustainabilityGoals.sustainabilityChampionGoal,
    });
    
    return [
      {
        id: 'monthly-goal',
        title: language === 'de' ? 'Monatsziel' : language === 'en' ? 'Monthly Goal' : 'Месячная цель',
        description: `${sustainabilityGoals.monthlyCo2Goal} kg CO₂ einsparen`,
        icon: <Target color="#8B5CF6" size={24} />,
        progress: Math.min(100, ((currentStats?.co2Saved || 0) / sustainabilityGoals.monthlyCo2Goal) * 100),
        completed: (currentStats?.co2Saved || 0) >= sustainabilityGoals.monthlyCo2Goal,
      },
      {
        id: '1',
        title: t.energySaver,
        description: `${t.energySaverGoal}: ${sustainabilityGoals.energySaverGoal} kg CO₂`,
        icon: <Leaf color="#10B981" size={24} />,
        progress: Math.min(100, (monthlyCO2Saved / sustainabilityGoals.energySaverGoal) * 100),
        completed: monthlyCO2Saved >= sustainabilityGoals.energySaverGoal,
      },
      {
        id: '2',
        title: t.solarPioneer,
        description: `${t.solarPioneerGoal}: ${sustainabilityGoals.solarPioneerGoal} kWh`,
        icon: <Award color="#F59E0B" size={24} />,
        progress: Math.min(100, (monthlyProduction / sustainabilityGoals.solarPioneerGoal) * 100),
        completed: monthlyProduction >= sustainabilityGoals.solarPioneerGoal,
      },
      {
        id: '5',
        title: t.sustainabilityChampion,
        description: `${t.sustainabilityChampionGoal}: ${sustainabilityGoals.sustainabilityChampionGoal} €`,
        icon: <TreePine color="#059669" size={24} />,
        progress: Math.min(100, (monthlySavings / sustainabilityGoals.sustainabilityChampionGoal) * 100),
        completed: monthlySavings >= sustainabilityGoals.sustainabilityChampionGoal,
      },
    ];
  }, [currentStats, language, t, sustainabilityGoals]);
  
  const shareImpact = async () => {
    try {
      const totalCO2 = currentStats?.co2Saved || 0;
      
      const message = language === 'de' 
        ? `🌱 Ich habe diesen Monat ${formatNumber(totalCO2, 1)} kg CO₂ mit meiner Solaranlage eingespart! #Nachhaltigkeit #SolarEnergie #Klimaschutz`
        : language === 'en'
        ? `🌱 This month, I saved ${formatNumber(totalCO2, 1)} kg of CO₂ with my solar system! #Sustainability #SolarEnergy #ClimateAction`
        : `🌱 В этом месяце я сэкономил ${formatNumber(totalCO2, 1)} кг CO₂ с моей солнечной системой! #Устойчивость #СолнечнаяЭнергия #КлиматическиеДействия`;
      
      await Share.share({
        message,
        title: t.shareImpact,
      });
    } catch (error) {
      Alert.alert(
        t.error,
        language === 'de' ? 'Teilen fehlgeschlagen' : language === 'en' ? 'Sharing failed' : 'Не удалось поделиться'
      );
    }
  };
  
  const compareWithOthers = () => {
    Alert.alert(
      t.compareWithOthers,
      language === 'de' 
        ? `Coming Soon`
        : language === 'en'
        ? `Coming Soon`
        : `Скоро будет`,
      [
        { text: t.close, style: 'default' }
      ]
    );
  };
  const renderImpactCard = (
    title: string,
    value: string,
    unit: string,
    description: string,
    icon: React.ReactNode,
    color: string
  ) => (
    <View style={[styles.impactCard, { borderLeftColor: color, backgroundColor: colors.card }]}>
      <View style={styles.impactHeader}>
        <View style={[styles.impactIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={[styles.impactTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.impactContent}>
        <Text style={[styles.impactValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.impactUnit, { color: colors.textSecondary }]}>{unit}</Text>
      </View>
      <Text style={[styles.impactDescription, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );

  const renderAchievement = (achievement: Achievement) => (
    <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: colors.card }]}>
      <View style={styles.achievementHeader}>
        {achievement.icon}
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
          <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>{achievement.description}</Text>
        </View>
        {achievement.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${achievement.progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{achievement.progress.toFixed(0)}%</Text>
      </View>
    </View>
  );



  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={theme === 'dark' ? ['#065F46', '#064E3B'] : ['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Leaf color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{t.sustainability}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.impactSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'de' ? 'Ihr Umwelt-Impact' : language === 'en' ? 'Your Environmental Impact' : 'Ваше воздействие на окружающую среду'}</Text>
          <View style={styles.impactGrid}>
            {renderImpactCard(
              language === 'de' ? 'CO₂ Einsparung' : language === 'en' ? 'CO₂ Savings' : 'Экономия CO₂',
              formatNumber(currentStats?.co2Saved || 0, 1),
              'kg',
              language === 'de' ? `Entspricht ${formatNumber(currentStats?.kmEquivalent || 0, 0)} km Autofahrt` : 
              language === 'en' ? `Equals ${formatNumber(currentStats?.kmEquivalent || 0, 0)} km driving` :
              `Эквивалентно ${formatNumber(currentStats?.kmEquivalent || 0, 0)} км езды`,
              <Leaf color="#10B981" size={20} />,
              '#10B981'
            )}
            {renderImpactCard(
              language === 'de' ? 'Bäume gepflanzt' : language === 'en' ? 'Trees planted' : 'Деревьев посажено',
              formatNumber(currentStats?.treesEquivalent || 0, 1),
              language === 'de' ? 'Äquivalent' : language === 'en' ? 'Equivalent' : 'Эквивалент',
              language === 'de' ? 'Basierend auf CO₂-Absorption' : language === 'en' ? 'Based on CO₂ absorption' : 'На основе поглощения CO₂',
              <TreePine color="#059669" size={20} />,
              '#059669'
            )}
          </View>
          <View style={styles.impactGrid}>
            {renderImpactCard(
              language === 'de' ? 'Wasser gespart' : language === 'en' ? 'Water saved' : 'Сэкономлено воды',
              formatNumber((currentStats?.production || 0) * 2.5, 0),
              language === 'de' ? 'Liter' : language === 'en' ? 'Liters' : 'Литров',
              language === 'de' ? 'Durch saubere Energieproduktion' : language === 'en' ? 'Through clean energy production' : 'Через чистое производство энергии',
              <Droplets color="#3B82F6" size={20} />,
              '#3B82F6'
            )}
            {renderImpactCard(
              language === 'de' ? 'Luftqualität' : language === 'en' ? 'Air quality' : 'Качество воздуха',
              formatNumber(currentStats?.avoidedEmissions || 0, 1),
              'kg',
              language === 'de' ? 'Vermiedene Emissionen' : language === 'en' ? 'Avoided emissions' : 'Предотвращенные выбросы',
              <Wind color="#6B7280" size={20} />,
              '#6B7280'
            )}
          </View>
        </View>

        <View style={styles.goalsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.goals}</Text>
          {achievements.filter(a => a.id === 'monthly-goal' || a.id === '1').map(renderAchievement)}
        </View>

        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.achievements}</Text>
          {achievements.filter(a => a.id !== 'monthly-goal' && a.id !== '1').map(renderAchievement)}
        </View>

        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'de' ? 'Nachhaltigkeits-Tipps' : language === 'en' ? 'Sustainability Tips' : 'Советы по устойчивости'}</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🌱 Tipp der Woche</Text>
            <Text style={styles.tipText}>
              Installieren Sie LED-Beleuchtung und sparen Sie bis zu 80% Energie bei der Beleuchtung.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>⚡ Energieoptimierung</Text>
            <Text style={styles.tipText}>
              Nutzen Sie programmierbare Thermostate für 10-15% Heizkosteneinsparung.
            </Text>
          </View>
        </View>

        <View style={styles.comparisonSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'de' ? 'Vergleich mit anderen' : language === 'en' ? 'Compare with others' : 'Сравнение с другими'}</Text>
          <View style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
            <View style={styles.watermarkContainer}>
              <Text style={styles.watermark}>Coming soon</Text>
            </View>
            <Text style={[styles.comparisonTitle, { color: colors.text }]}>🏆 Ihr Ranking</Text>
            <Text style={styles.comparisonRank}>
              {currentStats && currentStats.co2Saved > 50 ? 'Top 15%' : 
               currentStats && currentStats.co2Saved > 20 ? 'Top 40%' : 
               currentStats && currentStats.co2Saved > 0 ? 'Top 70%' : 'Starten Sie!'}
            </Text>
            <Text style={[styles.comparisonDescription, { color: colors.textSecondary }]}>
              {currentStats && currentStats.co2Saved > 50 ? 'Sie sind nachhaltiger als 85% der Nutzer in Ihrer Region' :
               currentStats && currentStats.co2Saved > 20 ? 'Sie sind auf einem guten Weg zu mehr Nachhaltigkeit' :
               currentStats && currentStats.co2Saved > 0 ? 'Erfassen Sie mehr Daten für bessere Vergleiche' :
               'Beginnen Sie mit der Erfassung Ihrer Energiedaten'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={shareImpact}>
            <Share2 color="#FFFFFF" size={20} />
            <Text style={styles.shareButtonText}>{t.shareImpact}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.compareButton} onPress={compareWithOthers}>
            <Users color="#FFFFFF" size={20} />
            <Text style={styles.compareButtonText}>{t.compareWithOthers}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    padding: 20,
    marginTop: -5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  impactSection: {
    marginBottom: 24,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  impactContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  impactUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  impactDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.1)',
    transform: [{ rotate: '-20deg' }],
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  comparisonRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 8,
  },
  comparisonDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compareButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});