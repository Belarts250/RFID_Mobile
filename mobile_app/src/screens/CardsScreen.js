import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import client from '../api/client';
import { CreditCard } from 'lucide-react-native';

export default function CardsScreen() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await client.get('/api/cards');
      setCards(res.data);
    } catch (e) {
      console.error('Failed to fetch cards', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REGISTERED CARDS</Text>
        <Text style={styles.headerSubtitle}>View all active RFID tags</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.panel}>
          {cards.map((c, index) => (
            <View key={c.uid} style={[styles.cardItem, index !== cards.length - 1 && styles.border]}>
              <View style={styles.cardHeader}>
                <CreditCard size={20} color={theme.colors.accent} />
                <Text style={styles.uidText}>{c.uid}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>HOLDER:</Text>
                  <Text style={styles.value}>{c.card_holder}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>BALANCE:</Text>
                  <Text style={styles.balanceValue}>${c.balance.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>REGISTERED:</Text>
                  <Text style={styles.dateValue}>{new Date(c.registered_at).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          ))}
          {cards.length === 0 && (
            <Text style={styles.emptyText}>No cards registered</Text>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardItem: {
    padding: theme.spacing.lg,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  uidText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardBody: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
  },
  balanceValue: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  dateValue: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textMuted,
  },
});
