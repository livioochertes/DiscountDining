import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import MyVouchersScreen from '../screens/MyVouchersScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RestaurantStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="RestaurantList" 
      component={RestaurantListScreen}
      options={{ title: 'Restaurants' }}
    />
    <Stack.Screen 
      name="RestaurantDetails" 
      component={RestaurantDetailsScreen}
      options={{ title: 'Restaurant Details' }}
    />
  </Stack.Navigator>
);

const AuthenticatedTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#ff6b35',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Restaurants"
      component={RestaurantStackNavigator}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🍽️</Text>,
        headerShown: false,
      }}
    />
    <Tab.Screen
      name="MyVouchers"
      component={MyVouchersScreen}
      options={{
        tabBarLabel: 'My Vouchers',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎫</Text>,
        title: 'My Vouchers',
      }}
    />
    <Tab.Screen
      name="Cart"
      component={CartScreen}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛒</Text>,
        title: 'Cart',
      }}
    />
    <Tab.Screen
      name="AI"
      component={AIRecommendationsScreen}
      options={{
        tabBarLabel: 'AI Recommendations',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🤖</Text>,
        title: 'AI Recommendations',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        title: 'Profile',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AuthenticatedTabNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;