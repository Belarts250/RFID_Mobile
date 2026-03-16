import React, { useState, useEffect } from 'react'
import { Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import client from '../api/client';
import { 
  Wifi, 
  WifiOff, 
  Search, 
  User as UserIcon, 
  CreditCard,
  Plus
} from 'lucide-react-native';

export default function TopUpScreen({ user }) {
  const [manualUid, setManualUid] = useState('');
  const [scannedCard, setScannedCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regHolder, setRegHolder] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');

  useEffect(() => {
    // Setup WebSocket for real-time card scans
    const protocol = client.defaults.baseURL.startsWith('https') ? 'wss' : 'ws';
    const host = client.defaults.baseURL.split('://')[1];
    const ws = new WebSocket(`${protocol}://${host}`);

    ws.onopen = () => setWsStatus('online');
    ws.onclose = () => setWsStatus('offline');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'card_scan') {
          setScannedCard(data);
        } else if (data.type === 'card_registered') {
          setScannedCard({ uid: data.card.uid, registered: true, card: data.card });
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    return () => ws.close();
  }, []);

  const handleLookup = async () => {
    if (!manualUid.trim()) return;
    setLoading(true);
    try {
      const res = await client.get(`/api/cards/${manualUid.trim()}`);
      setScannedCard({ uid: manualUid.trim(), registered: true, card: res.data });
    } catch (error) {
      if (error.response?.status === 404) {
        setScannedCard({ uid: manualUid.trim(), registered: false, card: null });
      } else {
        Alert.alert('Error', 'Lookup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regHolder.trim()) return Alert.alert('Error', 'Holder name required');
    setRegistering(true);
    try {
      const res = await client.post('/api/cards/register', {
        uid: scannedCard.uid,
        cardHolder: regHolder.trim(),
      });
      setScannedCard({ uid: res.data.card.uid, registered: true, card: res.data.card });
      setRegHolder('');
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleTopup = async () => {
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Error', 'Enter a valid amount');
    
    setLoading(true);
    try {
      const res = await client.post('/topup', {
        uid: scannedCard.uid,
        amount: amt,
      });
      
      Alert.alert('Success', `Added $${amt.toLocaleString()}\nNew Balance: $${res.data.balanceAfter.toLocaleString()}`);
      
      // Update local state
      setScannedCard(prev => ({
        ...prev,
        card: { ...prev.card, balance: res.data.balanceAfter }
      }));
      setAmount('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>TOP-UP CARD</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: wsStatus === 'online' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
          ]}>
            {wsStatus === 'online' ? (
              <Wifi size={12} color={theme.colors.success} />
            ) : (
              <WifiOff size={12} color={theme.colors.error} />
            )}
            <Text style={[
              styles.statusText,
              { color: wsStatus === 'online' ? theme.colors.success : theme.colors.error }
            ]}>
              {wsStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Add funds to an RFID card</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!scannedCard ? (
          <View style={styles.scanArea}>
            <View style={styles.scanIconWrapper}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
            <Text style={styles.scanPrompt}>Waiting for RFID card scan...</Text>
            <Text style={styles.scanSub}>Or enter UID manually below</Text>
            
            <View style={styles.manualEntry}>
              <TextInput
                style={styles.uidInput}
                placeholder="ENTER UID"
                placeholderTextColor={theme.colors.textMuted}
                value={manualUid}
                onChangeText={setManualUid}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.lookupButton} onPress={handleLookup}>
                <Search size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.scannedContainer}>
            <View style={[
              styles.cardInfo,
              { borderColor: scannedCard.registered ? theme.colors.success : theme.colors.warning }
            ]}>
              <View style={styles.cardHeader}>
                <CreditCard size={24} color={scannedCard.registered ? theme.colors.success : theme.colors.warning} />
                <Text style={styles.cardUid}>{scannedCard.uid}</Text>
              </View>
              
              {scannedCard.registered ? (
                <>
                  <View style={styles.cardDetail}>
                    <UserIcon size={14} color={theme.colors.textMuted} />
                    <Text style={styles.cardHolder}>{scannedCard.card.card_holder}</Text>
                  </View>
                  <Text style={styles.cardBalance}>
                    BALANCE: <Text style={styles.balanceValue}>${scannedCard.card.balance.toLocaleString()}</Text>
                  </Text>
                </>
              ) : (
                <View style={styles.registerForm}>
                  <Text style={styles.warningText}>⚠️ CARD NOT REGISTERED</Text>
                  <TextInput
                    style={styles.regInput}
                    placeholder="ENTER HOLDER NAME"
                    placeholderTextColor={theme.colors.textMuted}
                    value={regHolder}
                    onChangeText={setRegHolder}
                  />
                  <TouchableOpacity 
                    style={styles.regButton} 
                    onPress={handleRegister}
                    disabled={registering}
                  >
                    <Text style={styles.regButtonText}>
                      {registering ? 'REGISTERING...' : 'REGISTER CARD'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => setScannedCard(null)}
              >
                <Text style={styles.resetText}>RESET SCAN</Text>
              </TouchableOpacity>
            </View>

            {scannedCard.registered && (
              <View style={styles.topupPanel}>
                <Text style={styles.label}>AMOUNT TO ADD ($)</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.topupButton} 
                  onPress={handleTopup}
                  disabled={loading}
                >
                  <Plus size={20} color={theme.colors.text} style={{marginRight: 8}} />
                  <Text style={styles.topupButtonText}>
                    {loading ? 'PROCESSING...' : 'PROCESS TOP-UP'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  scanArea: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  scanIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scanPrompt: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  manualEntry: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  uidInput: {
    flex: 1,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  lookupButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedContainer: {
    gap: 16,
  },
  cardInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  cardUid: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cardBalance: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginTop: 8,
  },
  balanceValue: {
    fontSize: 24,
    color: theme.colors.success,
  },
  registerForm: {
    marginTop: theme.spacing.md,
    gap: 12,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  regInput: {
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: theme.spacing.md,
  },
  regButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  regButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  resetButton: {
    marginTop: theme.spacing.lg,
    alignSelf: 'center',
  },
  resetText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  topupPanel: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  topupButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  topupButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
