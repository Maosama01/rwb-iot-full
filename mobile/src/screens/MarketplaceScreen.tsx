import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, FlatList, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';

interface ExchangeHistory {
  id: string;
  vendor_name: string;
  status: string;
  compost_amount: string;
  reward_type: string;
  action_type: string;
  created_at: string;
}

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
  vendorPhone: string;
  currentLocationText?: string;
  validUntil?: string;
}

export function MarketplaceScreen() {
  const [actionFilter, setActionFilter] = useState<'all' | 'drop_off' | 'pick_up'>('all');
  const [rewardFilter, setRewardFilter] = useState<'all' | 'plant' | 'seeds' | 'discount'>('all');
  const [offers, setOffers] = useState<Offer[]>([]);
  
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingOffer, setBookingOffer] = useState<Offer | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [completedExchanges, setCompletedExchanges] = useState<number>(0);
  const [myExchanges, setMyExchanges] = useState<ExchangeHistory[]>([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);

  useEffect(() => {
    fetchMyExchanges();
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await apiClient.get('/marketplace/offers');
      setOffers(response.data.offers || []);
    } catch (err) {
      console.warn("Could not fetch offers", err);
    }
  };

  const fetchMyExchanges = async () => {
    try {
      const response = await apiClient.get('/marketplace/exchanges/me');
      const exchanges: ExchangeHistory[] = response.data.exchanges || [];
      setMyExchanges(exchanges);
      
      const acceptedCount = exchanges.filter(e => e.status === 'accepted' || e.status === 'completed').length;
      setCompletedExchanges(acceptedCount);
    } catch (err) {
      console.warn("Could not fetch exchanges", err);
    }
  };

  const filteredOffers = offers.filter(offer => {
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

  const confirmBooking = async () => {
    setBookingModalVisible(false);
    if (!bookingOffer) return;

    try {
      await apiClient.post('/marketplace/exchanges', {
        vendor_phone: bookingOffer.vendorPhone,
        vendor_name: bookingOffer.nurseryName,
        compost_amount: bookingOffer.compostRequired,
        reward_type: bookingOffer.rewardType,
        action_type: bookingOffer.actionType,
        vendor_type: bookingOffer.vendorType
      });
      
      if (bookingOffer.actionType === 'pick_up') {
        Alert.alert(
          "Request Sent! ⏳", 
          `Your pick-up request has been sent to ${bookingOffer.nurseryName}. You will be notified once they accept.`
        );
      } else {
        Alert.alert(
          "Request Sent! ⏳", 
          `Your drop-off request at ${bookingOffer.nurseryName} has been sent. You will be notified once they accept.`
        );
      }
      fetchMyExchanges();
    } catch (err) {
      Alert.alert("Error", "Could not process booking. Please try again later.");
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
          {item.validUntil && (
            <View style={styles.validityRow}>
              <Ionicons name="hourglass-outline" size={14} color="#D97706" />
              <Text style={styles.validityText}>Valid until: {item.validUntil}</Text>
            </View>
          )}
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
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.headerTitle}>Compost Exchange</Text>
            <Text style={styles.headerSubtitle}>Connect with nurseries or cart pullers near you.</Text>
          </View>
          <TouchableOpacity 
            style={styles.exchangesBadge}
            onPress={() => setRequestsModalVisible(true)}
          >
            <Text style={styles.exchangesBadgeText}>🏆 {completedExchanges}</Text>
          </TouchableOpacity>
        </View>
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

      {/* My Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={requestsModalVisible}
        onRequestClose={() => setRequestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Requests</Text>
              <TouchableOpacity onPress={() => setRequestsModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#7A6A5A" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={myExchanges}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 40, color: '#7A6A5A' }}>No requests yet.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyVendor}>{item.vendor_name}</Text>
                    <View style={[
                      styles.historyStatusBadge, 
                      item.status === 'accepted' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEF3C7' }
                    ]}>
                      <Text style={[
                        styles.historyStatusText,
                        item.status === 'accepted' ? { color: '#065F46' } : { color: '#92400E' }
                      ]}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyDetail}>
                    {item.action_type === 'pick_up' ? 'Pick-up' : 'Drop-off'} • {item.compost_amount} for {item.reward_type}
                  </Text>
                </View>
              )}
            />
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exchangesBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  exchangesBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
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
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  validityText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginLeft: 4,
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
  historyCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FBF8',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyVendor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1E16',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyDetail: {
    fontSize: 14,
    color: '#7A6A5A',
  },
});
