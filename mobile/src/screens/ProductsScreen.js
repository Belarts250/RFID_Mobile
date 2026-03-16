import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import client from '../api/client';
import { Package, Plus, Save, Trash2 } from 'lucide-react-native';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState('General');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await client.get('/api/products');
      setProducts(res.data);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  const handleAdd = async () => {
    if (!newName || !newPrice) return Alert.alert('Error', 'Name and price required');
    setLoading(true);
    try {
      await client.post('/api/products', {
        name: newName,
        price: parseInt(newPrice),
        category: newCat,
      });
      setNewName('');
      setNewPrice('');
      fetchProducts();
    } catch (e) {
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await client.put(`/api/products/${id}`, data);
      fetchProducts();
    } catch (e) {
      Alert.alert('Error', 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirm', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/products/${id}`);
            fetchProducts();
          } catch (e) {
            Alert.alert('Error', 'Delete failed');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRODUCTS</Text>
        <Text style={styles.headerSubtitle}>Manage system inventory</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.addPanel}>
          <Text style={styles.sectionLabel}>ADD NEW PRODUCT</Text>
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="NAME"
              placeholderTextColor={theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                placeholder="PRICE ($)"
                placeholderTextColor={theme.colors.textMuted}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, {flex: 2}]}
                placeholder="CATEGORY"
                placeholderTextColor={theme.colors.textMuted}
                value={newCat}
                onChangeText={setNewCat}
              />
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
              <Plus size={20} color={theme.colors.text} />
              <Text style={styles.addButtonText}>ADD PRODUCT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ALL PRODUCTS</Text>
        <View style={styles.listPanel}>
          {products.map((p, index) => (
            <View key={p.id} style={[styles.productItem, index !== products.length - 1 && styles.border]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{p.name}</Text>
                <Text style={styles.itemMeta}>${p.price} • {p.category}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleDelete(p.id)} style={styles.actionBtn}>
                  <Trash2 size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  addPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  addForm: {
    gap: 12,
  },
  input: {
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  listPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
});
