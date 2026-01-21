import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AIRecommendation } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AIRecommendationsScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const { user } = useAuth();
  const navigation = useNavigation();

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { key: 'lunch', label: 'Lunch', emoji: '☀️' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
    { key: 'snack', label: 'Snack', emoji: '🍿' },
  ] as const;

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user, selectedMealType]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await apiService.getAIRecommendations({
        mealType: selectedMealType,
        maxRecommendations: 10,
        includeRestaurants: true,
        includeMenuItems: true,
      });
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      Alert.alert('Error', 'Failed to load AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecommendation = (recommendation: AIRecommendation) => {
    if (recommendation.type === 'restaurant' && recommendation.restaurant) {
      navigation.navigate('RestaurantDetails' as never, { 
        restaurant: recommendation.restaurant 
      } as never);
    } else if (recommendation.type === 'menu_item' && recommendation.restaurant) {
      navigation.navigate('RestaurantDetails' as never, { 
        restaurant: recommendation.restaurant 
      } as never);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#FF5722';
  };

  const renderRecommendation = (recommendation: AIRecommendation, index: number) => (
    <View key={index} style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {recommendation.type === 'restaurant' ? '🏪 Restaurant' : '🍽️ Menu Item'}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(recommendation.score) }]}>
          <Text style={styles.scoreText}>{recommendation.score.toFixed(1)}</Text>
        </View>
      </View>

      {recommendation.restaurant && (
        <View style={styles.restaurantInfo}>
          <Image
            source={{ uri: recommendation.restaurant.image || 'https://via.placeholder.com/60x60' }}
            style={styles.restaurantImage}
          />
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{recommendation.restaurant.name}</Text>
            <Text style={styles.restaurantCuisine}>{recommendation.restaurant.cuisine}</Text>
            <Text style={styles.restaurantLocation}>{recommendation.restaurant.location}</Text>
          </View>
        </View>
      )}

      {recommendation.menuItem && (
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{recommendation.menuItem.name}</Text>
          <Text style={styles.menuItemDescription}>{recommendation.menuItem.description}</Text>
          <Text style={styles.menuItemPrice}>€{recommendation.menuItem.price.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.recommendationContent}>
        <Text style={styles.sectionTitle}>Why we recommend this:</Text>
        {recommendation.reasoning.map((reason, reasonIndex) => (
          <Text key={reasonIndex} style={styles.reasonText}>
            • {reason}
          </Text>
        ))}

        {recommendation.nutritionalHighlights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Nutritional highlights:</Text>
            {recommendation.nutritionalHighlights.map((highlight, highlightIndex) => (
              <Text key={highlightIndex} style={styles.highlightText}>
                ✓ {highlight}
              </Text>
            ))}
          </>
        )}

        {recommendation.cautionaryNotes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Things to consider:</Text>
            {recommendation.cautionaryNotes.map((note, noteIndex) => (
              <Text key={noteIndex} style={styles.cautionText}>
                ⚠️ {note}
              </Text>
            ))}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewRecommendation(recommendation)}
      >
        <Text style={styles.viewButtonText}>
          {recommendation.type === 'restaurant' ? 'View Restaurant' : 'View Restaurant Menu'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please sign in to get AI recommendations</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Recommendations</Text>
        <Text style={styles.subtitle}>Personalized dining suggestions for you</Text>
      </View>

      <View style={styles.mealTypeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mealTypes.map((mealType) => (
            <TouchableOpacity
              key={mealType.key}
              style={[
                styles.mealTypeButton,
                selectedMealType === mealType.key && styles.selectedMealTypeButton
              ]}
              onPress={() => setSelectedMealType(mealType.key)}
            >
              <Text style={styles.mealTypeEmoji}>{mealType.emoji}</Text>
              <Text style={[
                styles.mealTypeText,
                selectedMealType === mealType.key && styles.selectedMealTypeText
              ]}>
                {mealType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Generating personalized recommendations...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {recommendations.length > 0 ? (
            recommendations.map(renderRecommendation)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recommendations available</Text>
              <Text style={styles.emptySubtext}>
                Complete your dietary profile to get personalized AI recommendations!
              </Text>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile' as never)}
              >
                <Text style={styles.profileButtonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
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
  mealTypeSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedMealTypeButton: {
    backgroundColor: '#ff6b35',
  },
  mealTypeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  mealTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedMealTypeText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
    textAlign: 'center',
  },
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIndicator: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  restaurantLocation: {
    fontSize: 12,
    color: '#888',
  },
  menuItemInfo: {
    marginBottom: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationContent: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    lineHeight: 18,
  },
  highlightText: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 2,
    lineHeight: 18,
  },
  cautionText: {
    fontSize: 13,
    color: '#FF5722',
    marginBottom: 2,
    lineHeight: 18,
  },
  viewButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  profileButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIRecommendationsScreen;