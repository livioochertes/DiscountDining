import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Restaurant, VoucherPackage, MenuItem } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const RestaurantDetailsScreen: React.FC = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [packages, setPackages] = useState<VoucherPackage[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'menu'>('vouchers');
  
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addItem, canAddItem } = useCart();

  const routeParams = route.params as { restaurant: Restaurant };
  const restaurantParam = routeParams?.restaurant;

  useEffect(() => {
    if (restaurantParam) {
      fetchRestaurantDetails(restaurantParam.id);
    }
  }, [restaurantParam]);

  const fetchRestaurantDetails = async (restaurantId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getRestaurantFull(restaurantId);
      setRestaurant(data.restaurant);
      setPackages(data.packages);
      setMenuItems(data.menuItems);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      Alert.alert('Error', 'Failed to load restaurant details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (restaurant?.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  const handleDirections = () => {
    if (restaurant?.address) {
      const address = encodeURIComponent(restaurant.address);
      Linking.openURL(`https://maps.google.com/?q=${address}`);
    }
  };

  const handlePurchaseVoucher = (voucherPackage: VoucherPackage) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase vouchers.');
      return;
    }
    
    navigation.navigate('VoucherPurchase' as never, { 
      restaurant, 
      voucherPackage 
    } as never);
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to cart.');
      return;
    }

    if (!canAddItem(menuItem.restaurantId)) {
      Alert.alert(
        'Different Restaurant',
        'You can only order from one restaurant at a time. Clear your cart to add items from this restaurant.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Cart', onPress: () => {
            // Clear cart and add item
            addItem(menuItem, 1);
          }},
        ]
      );
      return;
    }

    try {
      addItem(menuItem, 1);
      Alert.alert('Added to Cart', `${menuItem.name} has been added to your cart.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart.');
    }
  };

  const renderVoucherPackage = (voucherPackage: VoucherPackage) => (
    <View key={voucherPackage.id} style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <Text style={styles.packageName}>{voucherPackage.name}</Text>
        <Text style={styles.packageDiscount}>-{voucherPackage.discount}%</Text>
      </View>
      <Text style={styles.packageDescription}>{voucherPackage.description}</Text>
      <View style={styles.packageDetails}>
        <Text style={styles.packageMeals}>{voucherPackage.meals} meals</Text>
        <Text style={styles.packageValidity}>Valid for {voucherPackage.validityMonths} months</Text>
      </View>
      <View style={styles.packagePricing}>
        <Text style={styles.originalPrice}>€{voucherPackage.originalPrice.toFixed(2)}</Text>
        <Text style={styles.discountedPrice}>€{voucherPackage.discountedPrice.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={() => handlePurchaseVoucher(voucherPackage)}
      >
        <Text style={styles.purchaseButtonText}>Purchase Voucher</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuItem = (menuItem: MenuItem) => (
    <View key={menuItem.id} style={styles.menuItemCard}>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{menuItem.name}</Text>
        <Text style={styles.menuItemDescription}>{menuItem.description}</Text>
        <View style={styles.menuItemTags}>
          {menuItem.isVegetarian && <Text style={styles.tag}>🌱 Vegetarian</Text>}
          {menuItem.isVegan && <Text style={styles.tag}>🌿 Vegan</Text>}
          {menuItem.isGlutenFree && <Text style={styles.tag}>🚫 Gluten Free</Text>}
        </View>
        <Text style={styles.menuItemPrice}>€{menuItem.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => handleAddToCart(menuItem)}
      >
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: restaurant.image || 'https://via.placeholder.com/400x250' }}
        style={styles.heroImage}
      />
      
      <View style={styles.content}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.restaurantRating}>⭐ {restaurant.rating}</Text>
            <Text style={styles.restaurantPrice}>{restaurant.priceRange}</Text>
          </View>
          <Text style={styles.restaurantLocation}>{restaurant.location}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
            <Text style={styles.actionButtonText}>🗺️ Directions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vouchers' && styles.activeTab]}
            onPress={() => setActiveTab('vouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'vouchers' && styles.activeTabText]}>
              Voucher Packages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
              Menu
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'vouchers' && (
          <View style={styles.tabContent}>
            {packages.length > 0 ? (
              packages.map(renderVoucherPackage)
            ) : (
              <Text style={styles.emptyText}>No voucher packages available</Text>
            )}
          </View>
        )}

        {activeTab === 'menu' && (
          <View style={styles.tabContent}>
            {menuItems.length > 0 ? (
              menuItems.map(renderMenuItem)
            ) : (
              <Text style={styles.emptyText}>No menu items available</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  restaurantHeader: {
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  restaurantCuisine: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantRating: {
    fontSize: 16,
    color: '#333',
  },
  restaurantPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  restaurantLocation: {
    fontSize: 14,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#ff6b35',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 16,
  },
  packageCard: {
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  packageDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packageMeals: {
    fontSize: 14,
    color: '#333',
  },
  packageValidity: {
    fontSize: 14,
    color: '#666',
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemCard: {
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
  menuItemInfo: {
    marginBottom: 12,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  menuItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  addToCartButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
});

export default RestaurantDetailsScreen;