import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import client from '../api/client';
import { 
  ShoppingCart, 
  CreditCard, 
  Trash2, 
  Plus, 
  Minus,
  CheckCircle2,
  XCircle
} from 'lucide-react-native';

export default function PaymentScreen({ user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [scannedCard, setScannedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetchProducts();
    
    // WS for card scan
    const host = client.defaults.baseURL.split('://')[1];
    const ws = new WebSocket(`ws://${host}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'card_scan') {
          setScannedCard(data);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await client.get('/api/products');
      setProducts(res.data);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  const toggleProduct = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id]) delete newCart[id];
      else newCart[id] = 1;
      return newCart;
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const qty = (prev[id] || 0) + delta;
      if (qty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: qty };
    });
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === parseInt(id));
    return p ? { ...p, quantity: qty, total: p.price * qty } : null;
  }).filter(Boolean);

  const totalCost = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handlePay = async () => {
    if (!scannedCard || !scannedCard.registered) {
      Alert.alert('Error', 'Please scan a valid card first');
      return;
    }
    if (scannedCard.card.balance < totalCost) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setPaying(true);
    try {
      const res = await client.post('/pay', {
        uid: scannedCard.uid,
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity }))
      });
      
      if (res.data.status === 'approved') {
        setReceipt(res.data);
        setCart({});
        setScannedCard(null);
      } else {
        Alert.alert('Declined', res.data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const renderProduct = ({ item }) => {
    const inCart = !!cart[item.id];
    return (
      <TouchableOpacity 
        style={[styles.productCard, inCart && styles.productCardActive]} 
        onPress={() => toggleProduct(item.id)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCat}>{item.category}</Text>
        </View>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          {inCart && <CheckCircle2 size={16} color={theme.colors.primary} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.receiptContainer}>
          <CheckCircle2 size={64} color={theme.colors.success} style={{alignSelf: 'center', marginBottom: 20}} />
          <Text style={styles.receiptTitle}>PAYMENT APPROVED</Text>
          <Text style={styles.receiptTotal}>${receipt.totalCost.toLocaleString()}</Text>
          
          <View style={styles.receiptDetails}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>CARD HOLDER</Text>
              <Text style={styles.receiptValue}>{receipt.card.card_holder}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>NEW BALANCE</Text>
              <Text style={[styles.receiptValue, {color: theme.colors.success}]}>${receipt.balanceAfter.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={() => setReceipt(null)}>
            <Text style={styles.doneButtonText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PAYMENT</Text>
        <Text style={styles.headerSubtitle}>Select products and tap card</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.productListSection}>
          <Text style={styles.sectionLabel}>STEP 1: SELECT PRODUCTS</Text>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          />
        </View>

        <ScrollView style={styles.cartSection}>
          <Text style={styles.sectionLabel}>STEP 2: REVIEW CART</Text>
          <View style={styles.panel}>
            {cartItems.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemTotal}>${item.total.toLocaleString()}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                    <Minus size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                    <Plus size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {cartItems.length === 0 && (
              <Text style={styles.emptyCart}>Cart is empty</Text>
            )}
            
            {cartItems.length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>${totalCost.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {cartItems.length > 0 && (
            <View style={styles.scanSection}>
              <Text style={styles.sectionLabel}>STEP 3: TAP CUSTOMER CARD</Text>
              <View style={[
                styles.scanPanel,
                scannedCard && { borderColor: scannedCard.registered ? theme.colors.success : theme.colors.error }
              ]}>
                {!scannedCard ? (
                  <View style={styles.waitingScan}>
                    <CreditCard size={24} color={theme.colors.textMuted} />
                    <Text style={styles.waitingText}>Waiting for scan...</Text>
                  </View>
                ) : (
                  <View style={styles.scannedCardInfo}>
                    <Text style={styles.scannedUid}>{scannedCard.uid}</Text>
                    {scannedCard.registered ? (
                      <View style={styles.scannedDetails}>
                        <Text style={styles.scannedHolder}>👤 {scannedCard.card.card_holder}</Text>
                        <Text style={[
                          styles.scannedBalance,
                          { color: scannedCard.card.balance < totalCost ? theme.colors.error : theme.colors.success }
                        ]}>
                          BAL: ${scannedCard.card.balance.toLocaleString()}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.unregisteredText}>UNKNOWN CARD (NOT REGISTERED)</Text>
                    )}
                    <TouchableOpacity onPress={() => setScannedCard(null)}>
                      <Text style={styles.clearScan}>CLEAR</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {cartItems.length > 0 && scannedCard?.registered && (
          <TouchableOpacity 
            style={[styles.payButton, (paying || scannedCard.card.balance < totalCost) && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={paying || scannedCard.card.balance < totalCost}
          >
            <Text style={styles.payButtonText}>
              {paying ? 'PROCESSING...' : `PAY $${totalCost.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  content: {
    flex: 1,
  },
  productListSection: {
    paddingVertical: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  productList: {
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  productCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  productName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  productCat: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  productPrice: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  cartSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  itemTotal: {
    color: theme.colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: theme.colors.text,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  emptyCart: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  totalLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  totalValue: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  scanSection: {
    marginBottom: 40,
  },
  scanPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  waitingScan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  waitingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  scannedCardInfo: {
    alignItems: 'center',
  },
  scannedUid: {
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    fontWeight: '700',
  },
  scannedDetails: {
    marginVertical: 8,
    alignItems: 'center',
  },
  scannedHolder: {
    color: theme.colors.text,
    fontSize: 14,
  },
  scannedBalance: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  unregisteredText: {
    color: theme.colors.error,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  clearScan: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
    opacity: 0.5,
  },
  payButtonText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  receiptContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  receiptTitle: {
    color: theme.colors.success,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  receiptTotal: {
    color: theme.colors.text,
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
  },
  receiptDetails: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: 16,
    marginBottom: 40,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  receiptValue: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
