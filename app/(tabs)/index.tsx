import { useIsFocused } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList, Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2;

export default function CashierScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(false);
  const isFocused = useIsFocused();

  const DANA_LINK = "https://link.dana.id/minta/POS-SYSTEM";

  useEffect(() => { 
    if (isFocused) fetchProducts(); 
  }, [isFocused]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const handleSearch = (t: string) => {
    setSearch(t);
    const filteredData = products.filter(p => 
      p.name.toLowerCase().includes(t.toLowerCase())
    );
    setFiltered(filteredData);
  };

  const updateCart = (item: any, qty: number) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === item.id);
      if (exist) {
        const newCart = prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qty } : i);
        return newCart.filter(i => i.qty > 0);
      }
      return qty > 0 ? [...prev, { ...item, qty: 1 }] : prev;
    });
  };

  const printReceipt = async (method: string) => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    // 1. SIMPAN KE DATABASE
    try {
      const { error } = await supabase.from('transactions').insert([{
        customer_name: customerName || 'UMUM',
        total_amount: total,
        payment_method: method,
        items: cart 
      }]);

      if (error) throw error;
    } catch (e) {
      Alert.alert("DATABASE ERROR", "Gagal menyimpan riwayat transaksi");
      return; 
    }

    // 2. LOGIKA PENGHITUNG TINGGI PDF (DINAMIS)
    // Menghitung tinggi agar PDF pas dengan jumlah barang
    const dynamicHeight = 330 + (cart.length * 45); 

    const html = `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              margin: 0; 
              padding: 8px; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              width: 58mm;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dotted #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; }
            .item-name { font-weight: bold; flex: 1; }
            .item-price { text-align: right; margin-left: 10px; }
            .total { font-size: 14px; font-weight: bold; margin-top: 8px; }
            .footer { margin-top: 12px; font-size: 10px; text-align: center; padding-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong style="font-size: 14px;">BENGKEL SHOFA</strong><br>
            <span style="font-size: 10px;">Jl. Cijaku Lebak Banten</span>
          </div>
          <div class="divider"></div>
          <div style="font-size: 10px;">
            <div class="row"><span>PELANGGAN</span> <span>: ${customerName.toUpperCase() || 'UMUM'}</span></div>
            <div class="row"><span>TANGGAL</span> <span>: ${new Date().toLocaleDateString('id-ID')}</span></div>
            <div class="row"><span>WAKTU</span> <span>: ${new Date().toLocaleTimeString('id-ID')}</span></div>
          </div>
          <div class="divider"></div>
          ${cart.map(i => `
            <div class="row"><span class="item-name">${i.name.toUpperCase()}</span></div>
            <div class="row" style="margin-bottom: 4px;">
              <span>${i.qty} x ${i.price.toLocaleString()}</span>
              <span class="item-price">${(i.price * i.qty).toLocaleString()}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="row total">
            <span>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <div class="row" style="font-size: 10px; margin-top: 2px;">
            <span>METODE</span> <span>: ${method}</span>
          </div>
          <div class="divider"></div>
          <div class="footer">TERIMA KASIH<br>ATAS KUNJUNGAN ANDA</div>
        </body>
      </html>
    `;

    // 3. PROSES CETAK & SHARE
    try {
      const { uri } = await Print.printToFileAsync({ 
        html,
        width: 164,           
        height: dynamicHeight 
      });

      await Sharing.shareAsync(uri);
      
      // Reset form setelah sukses
      setCart([]);
      setCustomerName('');
    } catch (e) {
      Alert.alert("GAGAL", "Gagal memproses struk");
    }
  };
  const totalAmount = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>STORE POS</Text>
          <Text style={styles.title}>CASHIER</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems} ITEMS</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          placeholder="SEARCH PRODUCT..." 
          placeholderTextColor="#999"
          style={styles.search} 
          value={search} 
          onChangeText={handleSearch} 
        />
      </View>

      <View style={styles.customerContainer}>
        <TextInput 
          placeholder="ATAS NAMA PELANGGAN..." 
          placeholderTextColor="#999"
          style={styles.customerInput} 
          value={customerName}
          onChangeText={setCustomerName} 
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filtered} 
          numColumns={2} 
          key={2} 
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 220 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const currentQty = cart.find(i => i.id === item.id)?.qty || 0;
            return (
              <View style={[styles.card, currentQty > 0 && styles.activeCard]}>
                <Image source={{ uri: item.image_url }} style={styles.img} />
                <View style={styles.cardInfo}>
                  <Text style={styles.pName} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                  <Text style={styles.pPrice}>RP {item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.qtyRowMain}>
                  <TouchableOpacity onPress={() => updateCart(item, -1)} style={[styles.qBtn, { backgroundColor: '#f0f0f0' }]}>
                    <Text style={[styles.qText, { color: '#000' }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{currentQty}</Text>
                  <TouchableOpacity onPress={() => updateCart(item, 1)} style={styles.qBtn}>
                    <Text style={styles.qText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <View>
                <Text style={styles.totalLabel}>TOTAL PAYMENT</Text>
                <Text style={styles.customerPreview}>{customerName ? `AN: ${customerName.toUpperCase()}` : 'PELANGGAN UMUM'}</Text>
            </View>
            <Text style={styles.totalValue}>RP {totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#000' }]} onPress={() => printReceipt('CASH')}>
              <Text style={styles.payBtnText}>CASH</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#007AFF' }]} onPress={() => setQrModal(true)}>
              <Text style={styles.payBtnText}>QRIS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={qrModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>QRIS PAYMENT</Text>
            <View style={styles.qrContainer}><QRCode value={DANA_LINK} size={220} /></View>
            <Text style={styles.qrAmount}>RP {totalAmount.toLocaleString()}</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => { setQrModal(false); printReceipt('QRIS'); }}>
              <Text style={styles.confirmBtnText}>CONFIRM LUNAS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQrModal(false)}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
  badge: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  searchContainer: { marginBottom: 10 },
  search: { backgroundColor: '#F8F8F8', padding: 16, borderRadius: 12, fontSize: 14, fontWeight: '600', color: '#000' },
  customerContainer: { marginBottom: 20 },
  customerInput: { borderBottomWidth: 2, borderColor: '#EEE', paddingVertical: 10, fontSize: 14, fontWeight: '700', color: '#000' },
  card: { 
    width: cardWidth, backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } })
  },
  activeCard: { borderColor: '#000', borderWidth: 1.5 },
  img: { width: '100%', height: 120, borderRadius: 15, backgroundColor: '#F8F8F8', marginBottom: 12 },
  cardInfo: { marginBottom: 12, alignItems: 'center' },
  pName: { fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 4 },
  pPrice: { fontSize: 12, fontWeight: '600', color: '#666' },
  qtyRowMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qBtn: { backgroundColor: '#000', width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  qText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  qtyVal: { fontWeight: '900', fontSize: 14 },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 40 : 25
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#999' },
  customerPreview: { fontSize: 10, fontWeight: '800', color: '#007AFF', marginTop: 2 },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#000' },
  actionRow: { flexDirection: 'row', gap: 12 },
  payBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  qrBox: { backgroundColor: '#fff', padding: 30, borderRadius: 30, alignItems: 'center', width: '85%' },
  qrTitle: { fontWeight: '900', fontSize: 18, marginBottom: 25, letterSpacing: 1 },
  qrContainer: { padding: 10, backgroundColor: '#fff', borderRadius: 20, marginBottom: 20 },
  qrAmount: { fontSize: 32, fontWeight: '900', marginBottom: 25 },
  confirmBtn: { backgroundColor: '#000', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cancelText: { marginTop: 20, color: '#999', fontWeight: '700', fontSize: 13 },
});