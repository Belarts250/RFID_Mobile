import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutDashboard, Coins, ShoppingCart, CreditCard, Package } from 'lucide-react-native';

import { theme } from './src/styles/theme';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TopUpScreen from './src/screens/TopUpScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CardsScreen from './src/screens/CardsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard size={size} color={color} />;
          if (route.name === 'TopUp') return <Coins size={size} color={color} />;
          if (route.name === 'Payment') return <ShoppingCart size={size} color={color} />;
          if (route.name === 'Cards') return <CreditCard size={size} color={color} />;
          if (route.name === 'Products') return <Package size={size} color={color} />;
          return null;
        },
      })}
    >
      {user.role === 'admin' && (
        <Tab.Screen name="Dashboard">
          {props => <DashboardScreen {...props} user={user} onLogout={onLogout} />}
        </Tab.Screen>
      )}
      
      {(user.role === 'admin' || user.role === 'agent') && (
        <Tab.Screen name="TopUp">
          {props => <TopUpScreen {...props} user={user} />}
        </Tab.Screen>
      )}

      {(user.role === 'admin' || user.role === 'cashier') && (
        <Tab.Screen name="Payment">
          {props => <PaymentScreen {...props} user={user} />}
        </Tab.Screen>
      )}

      {user.role === 'admin' && (
        <>
          <Tab.Screen name="Products">
            {props => <ProductsScreen {...props} />}
          </Tab.Screen>
          <Tab.Screen name="Cards">
            {props => <CardsScreen {...props} />}
          </Tab.Screen>
        </>
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error('Failed to save user', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main">
            {props => <MainTabs {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
