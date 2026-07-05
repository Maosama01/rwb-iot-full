import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Listing {
  id: string;
  user: {
    name: string;
    avatarInitials: string;
    color: string;
  };
  distance: string;
  type: 'offer_compost' | 'offer_scraps' | 'seek_scraps';
  title: string;
  description: string;
  timeAgo: string;
}

const mockListings: Listing[] = [
  {
    id: '1',
    user: { name: 'Sarah J.', avatarInitials: 'SJ', color: '#8B4513' },
    distance: '0.3 km away',
    type: 'offer_compost',
    title: '5kg of rich Black Gold!',
    description: 'My Rawbin just finished a cycle and I have more compost than my indoor plants need. Come grab it!',
    timeAgo: '2h ago'
  },
  {
    id: '2',
    user: { name: 'Mike T.', avatarInitials: 'MT', color: '#2E8B57' },
    distance: '1.2 km away',
    type: 'seek_scraps',
    title: 'Seeking greens for my community garden',
    description: 'We have a massive outdoor bin at the community garden and need more nitrogen-rich greens. Coffee grounds and fruit peels welcome.',
    timeAgo: '5h ago'
  },
  {
    id: '3',
    user: { name: 'Priya P.', avatarInitials: 'PP', color: '#D2691E' },
    distance: '2.4 km away',
    type: 'offer_scraps',
    title: 'Bag of vegetable peels',
    description: 'Made a huge batch of soup, have a big bag of carrot and potato peels. Anyone want them for their bin?',
    timeAgo: '1d ago'
  },
  {
    id: '4',
    user: { name: 'David W.', avatarInitials: 'DW', color: '#4682B4' },
    distance: '0.5 km away',
    type: 'offer_compost',
    title: 'Small batch of fresh compost',
    description: 'Perfect for a couple of potted plants. I can leave it on my porch for pickup.',
    timeAgo: '2d ago'
  }
];

export function MarketplaceScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | 'offer' | 'seek'>('all');

  const filteredListings = mockListings.filter(listing => {
    if (filter === 'all') return true;
    if (filter === 'offer') return listing.type.startsWith('offer');
    if (filter === 'seek') return listing.type.startsWith('seek');
    return true;
  });

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'offer_compost': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Offering Compost', icon: 'leaf' };
      case 'offer_scraps': return { bg: '#FFF3E0', text: '#E65100', label: 'Offering Scraps', icon: 'nutrition' };
      case 'seek_scraps': return { bg: '#E3F2FD', text: '#1565C0', label: 'Seeking Scraps', icon: 'search' };
      default: return { bg: '#F5F5F5', text: '#616161', label: 'Unknown', icon: 'help' };
    }
  };

  const renderListing = ({ item }: { item: Listing }) => {
    const style = getTypeStyle(item.type);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userSection}>
            <View style={[styles.avatar, { backgroundColor: item.user.color }]}>
              <Text style={styles.avatarText}>{item.user.avatarInitials}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{item.user.name}</Text>
              <View style={styles.distanceRow}>
                <Ionicons name="location-outline" size={12} color="#7A6A5A" />
                <Text style={styles.distanceText}>{item.distance}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.timeText}>{item.timeAgo}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Ionicons name={style.icon as any} size={12} color={style.text} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: style.text }]}>{style.label}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => Alert.alert("Message Sent!", `Your message to ${item.user.name.split(' ')[0]} has been sent.`)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>Message {item.user.name.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exchange</Text>
        <Text style={styles.headerSubtitle}>Trade compost and scraps with your community</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'offer' && styles.filterChipActive]}
            onPress={() => setFilter('offer')}
          >
            <Text style={[styles.filterText, filter === 'offer' && styles.filterTextActive]}>Offering</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'seek' && styles.filterChipActive]}
            onPress={() => setFilter('seek')}
          >
            <Text style={[styles.filterText, filter === 'seek' && styles.filterTextActive]}>Seeking</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={renderListing}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 14,
    color: '#7A6A5A',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#2C1E16',
    borderColor: '#2C1E16',
  },
  filterText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 14,
    fontWeight: '600',
    color: '#7A6A5A',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  userName: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 12,
    color: '#7A6A5A',
    marginLeft: 4,
  },
  timeText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 12,
    color: '#A4A4A4',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 8,
  },
  description: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 16,
  },
  messageButton: {
    backgroundColor: '#5C8D42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30, // Usually placed above tab bar, but since it's inside tab, 30 is fine
    right: 24,
    backgroundColor: '#2C1E16',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  }
});
