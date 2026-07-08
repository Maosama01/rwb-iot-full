import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, FlatList, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface Offer {
  id: string;
  nurseryName: string;
  plantOffered: string;
  compostRequired: string;
  distance: string;
  timeEst: string;
  availableSlots: string[];
  imageColor: string;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  
  // New Fields
  actionType: 'drop_off' | 'pick_up';
  vendorType: 'nursery' | 'cart_puller';
  rewardType: 'plant' | 'seeds' | 'discount';
  currentLocationText?: string;
}

const mockOffers: Offer[] = [
  {
    id: '1',
    nurseryName: 'Lalbagh Botanicals',
    plantOffered: 'Rose Plant 🌹',
    compostRequired: '3kg',
    distance: '1.2 km away',
    timeEst: '5 mins drive',
    availableSlots: ['Today 4PM-6PM', 'Tomorrow 10AM-12PM'],
    imageColor: '#D2691E',
    coordinate: { latitude: 12.9150, longitude: 77.6400 },
    actionType: 'drop_off',
    vendorType: 'nursery',
    rewardType: 'plant',
  },
  {
    id: '2',
    nurseryName: 'Koramangala Greenery',
    plantOffered: 'Marigold Seeds 🌼',
    compostRequired: '500g',
    distance: '2.5 km away',
    timeEst: '10 mins drive',
    availableSlots: ['Today 2PM-4PM', 'Tomorrow 4PM-6PM'],
    imageColor: '#2E8B57',
    coordinate: { latitude: 12.9250, longitude: 77.6300 },
    actionType: 'drop_off',
    vendorType: 'nursery',
    rewardType: 'seeds',
  },
  {
    id: '3',
    nurseryName: 'Ramu (Cart Puller)',
    plantOffered: '₹50 Store Credit 💸',
    compostRequired: '2kg',
    distance: '0.8 km away',
    timeEst: 'Moving',
    availableSlots: ['Today 5PM-7PM', 'Tomorrow 9AM-11AM'],
    imageColor: '#4682B4',
    actionType: 'pick_up',
    vendorType: 'cart_puller',
    rewardType: 'discount',
    currentLocationText: 'Currently near HSR Layout Sector 2',
  },
  {
    id: '4',
    nurseryName: 'Suresh (Mobile Nursery)',
    plantOffered: 'Potted Basil 🌿',
    compostRequired: '1.5kg',
    distance: '1.5 km away',
    timeEst: 'Moving',
    availableSlots: ['Today 6PM-8PM', 'Tomorrow 11AM-1PM'],
    imageColor: '#8B4513',
    actionType: 'pick_up',
    vendorType: 'cart_puller',
    rewardType: 'plant',
    currentLocationText: 'Currently near Indiranagar 100ft Rd',
  }
];

export function MarketplaceScreen() {
  const [actionFilter, setActionFilter] = useState<'all' | 'drop_off' | 'pick_up'>('all');
  const [rewardFilter, setRewardFilter] = useState<'all' | 'plant' | 'seeds' | 'discount'>('all');
  
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingOffer, setBookingOffer] = useState<Offer | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const filteredOffers = mockOffers.filter(offer => {
    if (actionFilter !== 'all' && offer.actionType !== actionFilter) return false;
    if (rewardFilter !== 'all' && offer.rewardType !== rewardFilter) return false;
    return true;
  });

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'plant': return 'leaf';
      case 'seeds': return 'flower';
      case 'discount': return 'pricetag';
      default: return 'gift';
    }
  };

  const openBookingModal = (offer: Offer) => {
    setBookingOffer(offer);
    setSelectedSlot(offer.availableSlots[0]);
    setBookingModalVisible(true);
  };

  const confirmBooking = () => {
    setBookingModalVisible(false);
    if (bookingOffer?.actionType === 'pick_up') {
      Alert.alert(
        "Pick-up Requested! 🚚", 
        `Your request has been sent to ${bookingOffer?.nurseryName}. They will arrive at your registered home address for the ${selectedSlot} slot.`
      );
    } else {
      Alert.alert(
        "Booking Confirmed! 🎉", 
        `Your drop-off at ${bookingOffer?.nurseryName} is scheduled for ${selectedSlot}. Navigation is ready when you are!`
      );
    }
  };

  const showLocation = (offer: Offer) => {
    if (offer.coordinate) {
      const url = `https://www.google.com/maps/search/?api=1&query=${offer.coordinate.latitude},${offer.coordinate.longitude}`;
      Linking.openURL(url).catch(err => {
        Alert.alert("Error", "Couldn't open Google Maps");
        console.error("Failed to open URL:", err);
      });
    } else {
      Alert.alert("Live Location", offer.currentLocationText || "Vendor is mobile.");
    }
  };

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const isCartPuller = item.vendorType === 'cart_puller';
    const isPickUp = item.actionType === 'pick_up';

    return (
      <View style={styles.card}>
        {/* Vendor Header */}
        <View style={styles.cardHeader}>
          <View style={styles.nurserySection}>
            <View style={[styles.avatar, { backgroundColor: item.imageColor }]}>
              {isCartPuller ? (
                <MaterialCommunityIcons name="cart-variant" size={24} color="#FFFFFF" />
              ) : (
                <Ionicons name="storefront" size={24} color="#FFFFFF" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nurseryName}>{item.nurseryName}</Text>
              
              {isCartPuller ? (
                <View style={styles.liveLocationRow}>
                  <Ionicons name="radio" size={14} color="#D97706" />
                  <Text style={styles.liveLocationText}>{item.currentLocationText}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.distanceRow} onPress={() => showLocation(item)}>
                  <Ionicons name="location" size={14} color="#5C8D42" />
                  <Text style={styles.distanceText}>{item.distance}</Text>
                  <Text style={styles.viewMapText}>(View Map)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isPickUp ? styles.badgePickUp : styles.badgeDropOff]}>
            <Ionicons name={isPickUp ? "bicycle" : "walk"} size={14} color={isPickUp ? "#1D4ED8" : "#4338CA"} style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: isPickUp ? "#1D4ED8" : "#4338CA" }]}>
              {isPickUp ? "Pick-up Available" : "Drop-off Only"}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name={getRewardIcon(item.rewardType) as any} size={14} color="#4B5563" style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: '#4B5563' }]}>
              {item.rewardType.charAt(0).toUpperCase() + item.rewardType.slice(1)}
            </Text>
          </View>
        </View>

        {/* Offer Details */}
        <View style={styles.offerSection}>
          <Text style={styles.offerTitle}>Get {item.plantOffered}</Text>
          <View style={styles.exchangeRow}>
            <Ionicons name="sync-circle" size={24} color="#5C8D42" style={{ marginRight: 8 }} />
            <Text style={styles.exchangeText}>
              In exchange for <Text style={styles.highlightText}>{item.compostRequired} of Compost</Text>
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={[styles.bookButton, isPickUp && styles.pickUpButton]}
          onPress={() => openBookingModal(item)}
        >
          <Text style={styles.bookButtonText}>{isPickUp ? "Request Pick-up" : "Book Drop-off"}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compost Exchange</Text>
        <Text style={styles.headerSubtitle}>Connect with nurseries or cart pullers near you.</Text>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Service Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          {['all', 'pick_up', 'drop_off'].map((cat) => (
            <TouchableOpacity 
              key={cat}
              style={[styles.filterChip, actionFilter === cat && styles.filterChipActive]}
              onPress={() => setActionFilter(cat as any)}
            >
              <Text style={[styles.filterText, actionFilter === cat && styles.filterTextActive]}>
                {cat === 'all' ? 'All' : cat === 'pick_up' ? 'Pick-up' : 'Drop-off'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Reward Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}>
          {['all', 'plant', 'seeds', 'discount'].map((cat) => (
            <TouchableOpacity 
              key={cat}
              style={[styles.filterChip, rewardFilter === cat && styles.filterChipActive]}
              onPress={() => setRewardFilter(cat as any)}
            >
              <Text style={[styles.filterText, rewardFilter === cat && styles.filterTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderOfferCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bookingModalVisible}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {bookingOffer?.actionType === 'pick_up' ? 'Request Pick-up' : 'Book Drop-off'}
              </Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#7A6A5A" />
              </TouchableOpacity>
            </View>
            
            {bookingOffer && (
              <>
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    {bookingOffer.vendorType === 'cart_puller' ? (
                      <Ionicons name="radio" size={20} color="#D97706" />
                    ) : (
                      <Ionicons name="location-outline" size={20} color="#5C8D42" />
                    )}
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.modalDetailTitle}>{bookingOffer.nurseryName}</Text>
                      {bookingOffer.vendorType === 'cart_puller' ? (
                        <Text style={styles.modalDetailSubtitle}>{bookingOffer.currentLocationText}</Text>
                      ) : (
                        <Text style={styles.modalDetailSubtitle}>{bookingOffer.distance} • {bookingOffer.timeEst}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.modalExchangeBox}>
                    <Text style={styles.modalExchangeTitle}>Exchange Summary</Text>
                    {bookingOffer.actionType === 'pick_up' ? (
                      <Text style={styles.modalExchangeBody}>Give <Text style={{fontWeight: 'bold', color: '#2E7D32'}}>{bookingOffer.compostRequired}</Text> of compost at your door</Text>
                    ) : (
                      <Text style={styles.modalExchangeBody}>Bring <Text style={{fontWeight: 'bold', color: '#2E7D32'}}>{bookingOffer.compostRequired}</Text> of compost to the location</Text>
                    )}
                    <Text style={styles.modalExchangeBody}>Receive <Text style={{fontWeight: 'bold', color: '#2E7D32'}}>1x {bookingOffer.plantOffered}</Text></Text>
                  </View>
                </View>

                <Text style={styles.slotHeader}>Select a Time Slot</Text>
                {bookingOffer.availableSlots.map(slot => (
                  <TouchableOpacity 
                    key={slot}
                    style={[styles.slotButton, selectedSlot === slot && styles.slotButtonActive]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotButtonText, selectedSlot === slot && styles.slotButtonTextActive]}>{slot}</Text>
                    {selectedSlot === slot && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  style={[styles.confirmBookingButton, bookingOffer.actionType === 'pick_up' && { backgroundColor: '#1D4ED8' }]} 
                  onPress={confirmBooking}
                >
                  <Text style={styles.confirmBookingText}>
                    {bookingOffer.actionType === 'pick_up' ? "Confirm Pick-up" : "Confirm Appointment"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  listContent: {
    paddingBottom: 120, // To clear the tab bar
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
    lineHeight: 20,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A8A29E',
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 8,
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#5C8D42',
    borderColor: '#5C8D42',
  },
  filterText: {
    fontSize: 14,
    color: '#7A6A5A',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nurserySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nurseryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: '#5C8D42',
    marginLeft: 6,
    fontWeight: '600',
  },
  viewMapText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  liveLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveLocationText: {
    fontSize: 13,
    color: '#D97706',
    marginLeft: 6,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePickUp: {
    backgroundColor: '#DBEAFE',
  },
  badgeDropOff: {
    backgroundColor: '#E0E7FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  offerSection: {
    backgroundColor: '#F9FBF8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 8,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exchangeText: {
    fontSize: 15,
    color: '#4A4A4A',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C8D42',
    paddingVertical: 16,
    borderRadius: 16,
  },
  pickUpButton: {
    backgroundColor: '#1D4ED8',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1E16',
  },
  modalDetails: {
    marginBottom: 24,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 2,
  },
  modalDetailSubtitle: {
    fontSize: 14,
    color: '#7A6A5A',
  },
  modalExchangeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  modalExchangeTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalExchangeBody: {
    fontSize: 15,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  slotHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E16',
    marginBottom: 12,
  },
  slotButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginBottom: 12,
  },
  slotButtonActive: {
    backgroundColor: '#5C8D42',
    borderColor: '#5C8D42',
  },
  slotButtonText: {
    fontSize: 15,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  slotButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  confirmBookingButton: {
    backgroundColor: '#2C1E16',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmBookingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
