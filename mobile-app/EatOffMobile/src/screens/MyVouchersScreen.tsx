import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { Voucher } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyVouchersScreen: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVouchers();
    }
  }, [user]);

  const fetchVouchers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await apiService.getCustomerVouchers(user.id);
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      Alert.alert('Error', 'Failed to load vouchers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  };

  const handleShowQRCode = async (voucher: Voucher) => {
    try {
      const response = await apiService.getVoucherQRCode(voucher.id);
      setQrCodeImage(response.qrCodeImage);
      setSelectedVoucher(voucher);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      Alert.alert('Error', 'Failed to load QR code. Please try again.');
    }
  };

  const getVoucherStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'expired':
        return '#FF5722';
      case 'used':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const renderVoucherItem = ({ item }: { item: Voucher }) => (
    <View style={styles.voucherCard}>
      <View style={styles.voucherHeader}>
        <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getVoucherStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.packageName}>{item.package.name}</Text>
      <Text style={styles.voucherDescription}>{item.package.description}</Text>
      
      <View style={styles.voucherDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Meals Remaining:</Text>
          <Text style={styles.detailValue}>{item.mealsRemaining} / {item.totalMeals}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expires:</Text>
          <Text style={styles.detailValue}>{new Date(item.expiryDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Discount:</Text>
          <Text style={styles.detailValue}>{item.package.discount}%</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(item.mealsRemaining / item.totalMeals) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((item.mealsRemaining / item.totalMeals) * 100)}% remaining
        </Text>
      </View>

      {item.status === 'active' && (
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => handleShowQRCode(item)}
        >
          <Text style={styles.qrButtonText}>📱 Show QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const activeVouchers = vouchers.filter(v => v.status === 'active');
  const expiredVouchers = vouchers.filter(v => v.status === 'expired' || v.status === 'used');

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please sign in to view your vouchers</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Vouchers</Text>
        <Text style={styles.subtitle}>
          {activeVouchers.length} active voucher{activeVouchers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={vouchers}
        renderItem={renderVoucherItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading vouchers...' : 'No vouchers found'}
            </Text>
            {!loading && (
              <Text style={styles.emptySubtext}>
                Purchase voucher packages from restaurants to save money on your meals!
              </Text>
            )}
          </View>
        }
      />

      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voucher QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedVoucher && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalRestaurant}>{selectedVoucher.restaurant.name}</Text>
                <Text style={styles.modalPackage}>{selectedVoucher.package.name}</Text>
                <Text style={styles.modalMeals}>
                  {selectedVoucher.mealsRemaining} meals remaining
                </Text>
              </View>
            )}

            {qrCodeImage && (
              <Image
                source={{ uri: qrCodeImage }}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            )}

            <Text style={styles.qrInstructions}>
              Show this QR code to restaurant staff when ordering to redeem a meal from your voucher package.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  voucherDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalRestaurant: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalPackage: {
    fontSize: 16,
    color: '#ff6b35',
    marginBottom: 4,
  },
  modalMeals: {
    fontSize: 14,
    color: '#666',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyVouchersScreen;