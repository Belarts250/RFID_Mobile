import { Platform } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import client from '../api/client';
import { 
  TrendingUp, 
  CreditCard, 
  Users, 
  DollarSign,
  LogOut,
  RefreshCw
} from 'lucide-react-native';

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{title.toUpperCase()}</Text>
      <Icon size={16} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subValue && <Text style={styles.statSub}>{subValue}</Text>}
  </View>
);

export default function DashboardScreen({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, txsRes] = await Promise.all([
        client.get('/api/dashboard'),
        client.get('/api/transactions'),
      ]);
      setStats(statsRes.data);
      setTransactions(txsRes.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>WELCOME BACK,</Text>
          <Text style={styles.username}>{user.username.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <LogOut size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard 
            title="Top-Ups Today" 
            value={`$${stats?.topupsToday.total.toLocaleString() || '0'}`}
            subValue={`${stats?.topupsToday.count || 0} transactions`}
            icon={TrendingUp}
            color={theme.colors.success}
          />
          <StatCard 
            title="Payments Today" 
            value={`$${stats?.paymentsToday.total.toLocaleString() || '0'}`}
            subValue={`${stats?.paymentsToday.count || 0} transactions`}
            icon={DollarSign}
            color={theme.colors.primary}
          />
          <StatCard 
            title="Active Cards" 
            value={stats?.activeCards || '0'}
            subValue="Registered cards"
            icon={CreditCard}
            color={theme.colors.info}
          />
          <StatCard 
            title="Total Balance" 
            value={`$${stats?.totalBalance.toLocaleString() || '0'}`}
            subValue="Across all cards"
            icon={Users}
            color={theme.colors.warning}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
            <TouchableOpacity onPress={onRefresh}>
              <RefreshCw size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.panel}>
            {transactions.map((tx, index) => (
              <View 
                key={tx.id || index} 
                style={[
                  styles.txItem, 
                  index !== transactions.length - 1 && styles.txBorder
                ]}
              >
                <View style={styles.txMain}>
                  <Text style={styles.txUid}>{tx.uid}</Text>
                  <Text style={styles.txTime}>
                    {new Date(tx.created_at).toLocaleTimeString([], { hour12: false })}
                  </Text>
                </View>
                <View style={styles.txDetails}>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.type === 'TOPUP' ? theme.colors.success : theme.colors.error }
                  ]}>
                    {tx.type === 'TOPUP' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </Text>
                  <View style={[
                    styles.badge,
                    { backgroundColor: tx.type === 'TOPUP' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: tx.type === 'TOPUP' ? theme.colors.success : theme.colors.error }
                    ]}>
                      {tx.type}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {transactions.length === 0 && (
              <Text style={styles.emptyText}>No recent transactions</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  welcome: {
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 8,
    color: theme.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 2,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  txBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  txMain: {
    flex: 1,
  },
  txUid: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  txTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  txDetails: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  emptyText: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textMuted,
  },
});
