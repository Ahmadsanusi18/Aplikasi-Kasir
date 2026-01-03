import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 1,
          borderColor: '#eee',
          elevation: 5,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 10,
          textTransform: 'uppercase',
        }
      }}>
      
      {/* 1. TAB KASIR */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="cart.fill" color={color} />
          ),
        }}
      />

      {/* 2. TAB HISTORY (Riwayat Transaksi) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="clock.fill" color={color} />
          ),
        }}
      />

      {/* 3. TAB ANALYTICS (Grafik Penjualan) */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Grafik',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* 4. TAB KELOLA (Stok & Produk) */}
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Kelola',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="square.stack.3d.up.fill" color={color} />
          ),
        }}
      />

      {/* SEMBUNYIKAN EXPLORE */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      
    </Tabs>
  );
}