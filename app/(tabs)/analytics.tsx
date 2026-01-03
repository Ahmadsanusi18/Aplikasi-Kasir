import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('WEEK'); // WEEK, MONTH, YEAR
  const [chartData, setChartData] = useState<any>(null);
  const [totalSales, setTotalSales] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) fetchAnalyticsData(filter);
  }, [isFocused, filter]);

  const fetchAnalyticsData = async (range: string) => {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();

    if (range === 'WEEK') startDate.setDate(now.getDate() - 6);
    else if (range === 'MONTH') startDate.setMonth(now.getMonth() - 1);
    else if (range === 'YEAR') startDate.setFullYear(now.getFullYear() - 1);

    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (!error && data) {
      processData(data, range);
    }
    setLoading(false);
  };

  const processData = (data: any[], range: string) => {
    const labels: string[] = [];
    const values: number[] = [];
    let total = 0;

    // Kumpulan data berdasarkan tarikh
    const grouped = data.reduce((acc: any, curr: any) => {
      const date = new Date(curr.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: range === 'YEAR' ? 'short' : '2-digit',
      });
      acc[date] = (acc[date] || 0) + curr.total_amount;
      total += curr.total_amount;
      return acc;
    }, {});

    // Ambil 6-7 titik data terakhir agar grafik tidak terlalu padat
    const keys = Object.keys(grouped).slice(-7);
    keys.forEach(key => {
      labels.push(key);
      values.push(grouped[key] / 1000); // Dalam ribuan (k) agar muat di skrin
    });

    setTotalSales(total);
    setChartData({
      labels,
      datasets: [{ data: values.length ? values : [0] }]
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>STATISTICS</Text>
        <Text style={styles.headerTitle}>ANALYTICS</Text>
      </View>

      {/* FILTER TAB */}
      <View style={styles.filterRow}>
        {['WEEK', 'MONTH', 'YEAR'].map((item) => (
          <TouchableOpacity 
            key={item} 
            onPress={() => setFilter(item)}
            style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, filter === item && styles.filterBtnTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <View>
          {/* TOTAL CARD */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL PENDAPATAN ({filter})</Text>
            <Text style={styles.summaryValue}>RP {totalSales.toLocaleString()}</Text>
          </View>

          {/* CHART */}
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Trend Jualan (dalam ribuan)</Text>
            {chartData && (
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier // Membuat garis melengkung lembut
                style={styles.chartStyle}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: '#FFF',
  backgroundGradientFrom: '#FFF',
  backgroundGradientTo: '#FFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#000' }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 25 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
  
  filterRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', padding: 5, borderRadius: 15, marginBottom: 25 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  filterBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  filterBtnText: { fontSize: 11, fontWeight: '800', color: '#AAA' },
  filterBtnTextActive: { color: '#000' },

  summaryCard: { backgroundColor: '#F8F8F8', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: '#999', marginBottom: 5 },
  summaryValue: { fontSize: 24, fontWeight: '900', color: '#000' },

  chartBox: { backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center' },
  chartTitle: { fontSize: 12, fontWeight: '700', color: '#CCC', marginBottom: 15, alignSelf: 'flex-start' },
  chartStyle: { borderRadius: 16, paddingRight: 40, marginTop: 10 }
});