import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Restaurant } from '../types';
import { apiService } from '../services/api';

const RestaurantListScreen: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const navigation = useNavigation();

  const cuisines = ['All', 'Italian', 'Chinese', 'Mexican', 'Indian', 'American', 'Japanese', 'Thai', 'French', 'Greek'];
  const priceRanges = ['All', '$', '$$', '$$$', '$$$$'];

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCuisine, selectedPriceRange]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedCuisine && selectedCuisine !== 'All') {
        filters.cuisine = selectedCuisine;
      }
      
      if (selectedPriceRange && selectedPriceRange !== 'All') {
        filters.priceRange = selectedPriceRange;
      }

      const data = await apiService.getRestaurants(filters);
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchText.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchText.toLowerCase()) ||
    restaurant.location.toLowerCase().includes(searchText.toLowerCase())
  );

  const navigateToRestaurant = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetails' as never, { restaurant } as never);
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigateToRestaurant(item)}
    >
      <Image 
        source={{ uri: item.image || 'https://via.placeholder.com/300x200' }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
        <Text style={styles.restaurantLocation}>{item.location}</Text>
        <View style={styles.restaurantMeta}>
          <Text style={styles.restaurantRating}>⭐ {item.rating}</Text>
          <Text style={styles.restaurantPrice}>{item.priceRange}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCuisineFilter = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedCuisine === item && styles.selectedFilterChip
      ]}
      onPress={() => setSelectedCuisine(item)}
    >
      <Text style={[
        styles.filterChipText,
        selectedCuisine === item && styles.selectedFilterChipText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderPriceFilter = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedPriceRange === item && styles.selectedFilterChip
      ]}
      onPress={() => setSelectedPriceRange(item)}
    >
      <Text style={[
        styles.filterChipText,
        selectedPriceRange === item && styles.selectedFilterChipText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurants</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Cuisine</Text>
        <FlatList
          data={cuisines}
          renderItem={renderCuisineFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
        />

        <Text style={styles.filterTitle}>Price Range</Text>
        <FlatList
          data={priceRanges}
          renderItem={renderPriceFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading restaurants...' : 'No restaurants found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 16,
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  filterList: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#ff6b35',
  },
  filterChipText: {
    color: '#333',
    fontSize: 14,
  },
  selectedFilterChipText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  restaurantCuisine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  restaurantLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantRating: {
    fontSize: 14,
    color: '#333',
  },
  restaurantPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b35',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default RestaurantListScreen;