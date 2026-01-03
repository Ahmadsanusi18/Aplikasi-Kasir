import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Modal, ScrollView, TextInput 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [filterType, setFilterType] = useState('TODAY');

  const [stats, setStats] = useState({
    totalOmzet: 0,
    totalOrders: 0,
    cashAmount: 0,
    qrisAmount: 0
  });

  const isFocused = useIsFocused();

  useEffect(() => { 
    if (isFocused) fetchHistory(filterType); 
  }, [isFocused]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item => 
        item.customer_name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  };

  const fetchHistory = async (type: string) => {
    setLoading(true);
    setSearchQuery(''); 
    let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

    const now = new Date();
    let startDate = new Date();

    if (type === 'WEEK') {
      startDate.setDate(now.getDate() - 7);
      query = query.gte('created_at', startDate.toISOString());
    } else if (type === 'MONTH') {
      startDate.setMonth(now.getMonth() - 1);
      query = query.gte('created_at', startDate.toISOString());
    } else if (type === 'YEAR') {
      startDate.setFullYear(now.getFullYear() - 1);
      query = query.gte('created_at', startDate.toISOString());
    } else {
      startDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;
    
    if (!error) {
      const logs = data || [];
      setHistory(logs);
      setFilteredHistory(logs);
      
      const summary = logs.reduce((acc, curr) => {
        acc.totalOmzet += curr.total_amount;
        acc.totalOrders += 1;
        curr.payment_method === 'QRIS' ? acc.qrisAmount += curr.total_amount : acc.cashAmount += curr.total_amount;
        return acc;
      }, { totalOmzet: 0, totalOrders: 0, cashAmount: 0, qrisAmount: 0 });

      setStats(summary);
    }
    setLoading(false);
  };

  // Komponen Dashboard (Filter Waktu & Kartu Statistik)
  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={styles.filterRow}>
        {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map((item) => (
          <TouchableOpacity 
            key={item} 
            onPress={() => {setFilterType(item); fetchHistory(item);}}
            style={[styles.filterBtn, filterType === item && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, filterType === item && styles.filterBtnTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>RINGKASAN PERFORMA</Text>
      
      <View style={styles.mainStatCard}>
        <Text style={styles.statLabel}>TOTAL OMZET ({filterType})</Text>
        <Text style={styles.statValue}>RP {stats.totalOmzet.toLocaleString()}</Text>
        <View style={styles.statFooter}>
          <Ionicons name="receipt-outline" size={14} color="#666" />
          <Text style={styles.statSubText}> {stats.totalOrders} Transaksi</Text>
        </View>
      </View>

      <View style={styles.splitRow}>
        <View style={[styles.miniCard, { borderLeftColor: '#000', borderLeftWidth: 4 }]}>
          <Text style={styles.miniLabel}>CASH</Text>
          <Text style={styles.miniValue}>RP {stats.cashAmount.toLocaleString()}</Text>
        </View>
        <View style={[styles.miniCard, { borderLeftColor: '#007AFF', borderLeftWidth: 4 }]}>
          <Text style={styles.miniLabel}>QRIS</Text>
          <Text style={styles.miniValue}>RP {stats.qrisAmount.toLocaleString()}</Text>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { marginTop: 25 }]}>DAFTAR TRANSAKSI</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER TETAP */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>BUSINESS REPORT</Text>
          <Text style={styles.headerTitle}>HISTORY</Text>
        </View>
        <TouchableOpacity onPress={() => fetchHistory(filterType)} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR (DI LUAR FLATLIST AGAR KEYBOARD TIDAK CLOSE) */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={{ marginLeft: 15 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama pelanggan..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
          returnKeyType="done"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#CCC" style={{ marginRight: 15 }} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderDashboard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedTx(item)}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.customerName}>{item.customer_name?.toUpperCase() || 'UMUM'}</Text>
                  <Text style={styles.dateTime}>
                    {new Date(item.created_at).toLocaleDateString('id-ID')} • {new Date(item.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <View style={[styles.methodBadge, { backgroundColor: item.payment_method === 'QRIS' ? '#E1F5FE' : '#F5F5F5' }]}>
                  <Text style={[styles.methodText, { color: item.payment_method === 'QRIS' ? '#007AFF' : '#666' }]}>{item.payment_method}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.totalAmount}>RP {item.total_amount.toLocaleString()}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>DATA TIDAK DITEMUKAN</Text>
            </View>
          }
        />
      )}

      {/* MODAL DETAIL */}
      <Modal visible={!!selectedTx} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>RECEIPT DETAIL</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <Ionicons name="close-circle" size={32} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.receiptPaper}>
                <Text style={styles.receiptStore}>BENGKEL SHOFA</Text>
                <View style={styles.receiptDivider} />
                {selectedTx?.items?.map((prod: any, idx: number) => (
                  <View key={idx} style={styles.receiptRow}>
                    <View style={{flex:1}}>
                      <Text style={styles.prodName}>{prod.name.toUpperCase()}</Text>
                      <Text style={styles.prodSub}>{prod.qty} x {prod.price.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.prodSubtotal}>{(prod.qty * prod.price).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.totalFinalLabel}>TOTAL</Text>
                  <Text style={styles.totalFinalValue}>RP {selectedTx?.total_amount.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
  refreshBtn: { width: 44, height: 44, backgroundColor: '#F8F8F8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    marginBottom: 10,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', color: '#000' },

  filterRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', padding: 5, borderRadius: 15, marginBottom: 20, gap: 5 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  filterBtnText: { fontSize: 10, fontWeight: '800', color: '#AAA' },
  filterBtnTextActive: { color: '#000' },

  dashboardContainer: { marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#000', marginBottom: 15, letterSpacing: 0.5 },
  mainStatCard: { backgroundColor: '#000', padding: 25, borderRadius: 25, marginBottom: 12 },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginVertical: 6 },
  statFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  statSubText: { color: '#666', fontSize: 12, fontWeight: '700' },
  
  splitRow: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, backgroundColor: '#F9F9F9', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  miniLabel: { fontSize: 9, fontWeight: '800', color: '#999', marginBottom: 5 },
  miniValue: { fontSize: 15, fontWeight: '900', color: '#000' },

  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#F5F5F5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 15, fontWeight: '900', color: '#000' },
  dateTime: { fontSize: 11, color: '#BBB', fontWeight: '700', marginTop: 2 },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  methodText: { fontSize: 9, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  totalAmount: { fontSize: 17, fontWeight: '900', color: '#000' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailBox: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  detailTitle: { fontWeight: '900', fontSize: 20 },
  receiptPaper: { backgroundColor: '#FDFDFD', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#EEE', borderStyle: 'dashed' },
  receiptStore: { textAlign: 'center', fontWeight: '900', fontSize: 18, marginBottom: 5 },
  receiptDivider: { borderTopWidth: 1, borderColor: '#EEE', borderStyle: 'dashed', marginVertical: 20 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  prodName: { fontWeight: '800', fontSize: 14 },
  prodSub: { fontSize: 12, color: '#999' },
  prodSubtotal: { fontWeight: '800' },
  totalFinalLabel: { fontWeight: '900', fontSize: 18 },
  totalFinalValue: { fontWeight: '900', fontSize: 18, color: '#007AFF' },
  empty: { padding: 50, alignItems: 'center' },
  emptyText: { color: '#CCC', fontWeight: '800', fontSize: 12 }
});