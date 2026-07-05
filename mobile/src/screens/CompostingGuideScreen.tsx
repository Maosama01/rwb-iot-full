import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const GuideSection = ({ title, icon, color, children }: any) => (
  <View style={styles.sectionContainer}>
    <View style={[styles.sectionHeader, { backgroundColor: color + '15' }]}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const ApprovedItem = ({ title, desc }: any) => (
  <View style={styles.itemRow}>
    <Ionicons name="checkmark-circle" size={20} color="#34C759" style={{ marginTop: 2 }} />
    <View style={styles.itemTextContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDesc}>{desc}</Text>
    </View>
  </View>
);

const AvoidItem = ({ title, desc }: any) => (
  <View style={styles.itemRow}>
    <Ionicons name="close-circle" size={20} color="#FF3B30" style={{ marginTop: 2 }} />
    <View style={styles.itemTextContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDesc}>{desc}</Text>
    </View>
  </View>
);

const WarningItem = ({ title, desc }: any) => (
  <View style={styles.itemRow}>
    <Ionicons name="warning" size={20} color="#FF9500" style={{ marginTop: 2 }} />
    <View style={styles.itemTextContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDesc}>{desc}</Text>
    </View>
  </View>
);

export function CompostingGuideScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F2' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FAF8F2' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A312B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>What goes in Rawbin?</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#5ED600', '#45C400']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="leaf" size={32} color="#FFFFFF" style={{ marginBottom: 8 }} />
            <Text style={styles.heroTitle}>Indian Household Guide</Text>
            <Text style={styles.heroSubtitle}>Learn exactly what can and cannot go into your composter based on typical Indian dietary and cultural nuances.</Text>
          </LinearGradient>
        </View>

        <GuideSection title="Daily Kitchen Waste" icon="nutrition" color="#45C400">
          <Text style={styles.subheading}>Approved with Preparation</Text>
          <ApprovedItem title="Spent tea leaves / chai patti" desc="Squeeze out liquid; remove any teabag staples or strings." />
          <ApprovedItem title="Vegetable trimmings & peels" desc="Bottle gourd (lauki), ridge gourd (turai), potatoes, carrots, and onions (pyaz)." />
          <ApprovedItem title="Fruit scraps" desc="Chopped banana peels, papaya skins, and melon rinds." />
          <WarningItem title="Leftover cooked staples" desc="Small amounts of plain rice, dal, and roti fragments only." />
          
          <View style={styles.divider} />
          
          <Text style={[styles.subheading, { color: '#FF3B30' }]}>Strictly Avoid</Text>
          <AvoidItem title="Hard fruit stones" desc="Mango stones (aam ki gutli), peach pits, and avocado seeds." />
          <AvoidItem title="Heavy coconut shells" desc="The hard, woody outer shell (nariyal ka khopra)." />
          <AvoidItem title="Large animal bones" desc="Mutton legs, bulky chicken bones, and fish spines." />
          <AvoidItem title="Betel nuts & paan" desc="Whole nuts (supari) and leaves with heavy slaked lime (chuna)." />
        </GuideSection>

        <GuideSection title="Festival & Puja Waste" icon="flower" color="#FF9500">
          <Text style={styles.subheading}>Approved with Preparation</Text>
          <ApprovedItem title="Marigold garlands (genda phool)" desc="Remove plastic/wire; cut into 2-inch segments." />
          <ApprovedItem title="Mango leaves (aam ke patte)" desc="Chop roughly; snip off thick fibrous stems." />
          <ApprovedItem title="Cotton diya wicks (rui batti)" desc="Must be 100% cotton, fully cooled, and free of heavy pools of unburned ghee or mustard oil." />
          
          <View style={styles.divider} />
          
          <Text style={[styles.subheading, { color: '#FF3B30' }]}>Strictly Avoid</Text>
          <AvoidItem title="Coconut husks (nariyal ka juta)" desc="Large clumps of thick coir will jam the blades." />
        </GuideSection>

        <GuideSection title="Indian Dietary Nuances" icon="restaurant" color="#AF52DE">
          <Text style={styles.subheading}>Dairy & Liquids</Text>
          <WarningItem title="Paneer whey (chhena paani)" desc="Do not pour directly; sprinkle only over extremely dry batches." />
          <WarningItem title="Leftover curd (dahi)" desc="Limit to a single spoonful mixed with dry waste." />
          
          <View style={styles.divider} />
          
          <Text style={styles.subheading}>Greasy & Oily Foods</Text>
          <WarningItem title="Leftover parathas & puris" desc="Limit to a few small scraps to avoid a sticky paste." />
          <AvoidItem title="Gravy residues (rassa / tari)" desc="Avoid completely; wipe heavy oil and gravy into the regular bin." />

          <View style={styles.divider} />

          <Text style={styles.subheading}>Citrus & Spicy Scraps</Text>
          <WarningItem title="Lemon peels (nimbu ke chilke)" desc="Limit to 2–3 chopped hulls per batch to prevent pungent odors." />
          <ApprovedItem title="Green & red chilies" desc="Fully approved; capsaicin does not affect the mechanical breakdown." />
        </GuideSection>

        <GuideSection title="Best Practices for Indian Climates" icon="thermometer" color="#FF2D55">
          <ApprovedItem title="Balance wet-to-dry ratio" desc="Add dry cardboard, unprinted egg cartons, or dry leaves at a 1:1 ratio with high-moisture vegetables (tomatoes/gourds)." />
          <ApprovedItem title="Pre-drain all liquids" desc="Squeeze excess water from washed vegetable trimmings and tea leaves before adding." />
          <ApprovedItem title="Maintain charcoal filters" desc="Change the activated carbon pellets immediately if sour or cooked-food smells occur during cycles." />
          <ApprovedItem title="Prevent fruit flies" desc="Keep the lid tightly locked between additions, or store perishable scraps in a sealed container in the fridge." />
        </GuideSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FAF8F2',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#2A312B',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
  },
  heroTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#1C1C1E',
  },
  sectionContent: {
    padding: 20,
    paddingTop: 12,
  },
  subheading: {
    fontFamily: 'Nunito_800Black',
    fontSize: 13,
    textTransform: 'uppercase',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#2A312B',
    marginBottom: 2,
  },
  itemDesc: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  }
});
