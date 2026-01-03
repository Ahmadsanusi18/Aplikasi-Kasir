import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, 
  StyleSheet, Modal, TextInput, Alert, ScrollView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useIsFocused } from '@react-navigation/native';
// Import Icon
import { Ionicons } from '@expo/vector-icons';

export default function ManageScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', price: '', image_url: '' });
  const isFocused = useIsFocused();

  useEffect(() => { if (isFocused) fetchProducts(); }, [isFocused]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', {ascending: false});
    setProducts(data || []);
  };

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [1, 1],
      quality: 0.5
    });
    if (!res.canceled) setForm({ ...form, image_url: res.assets[0].uri });
  };

  const save = async () => {
    if (!form.name || !form.price) return Alert.alert("Error", "Isi nama dan harga");
    const data = { name: form.name.toUpperCase(), price: parseInt(form.price), image_url: form.image_url };
    
    if (form.id) await supabase.from('products').update(data).eq('id', form.id);
    else await supabase.from('products').insert([data]);
    
    setModal(false); 
    setForm({ id: '', name: '', price: '', image_url: '' }); 
    fetchProducts();
  };

  const del = (id: string) => {
    Alert.alert("HAPUS PRODUK", "Tindakan ini tidak bisa dibatalkan.", [
      { text: "BATAL", style: "cancel" }, 
      { text: "HAPUS", style: 'destructive', onPress: async () => { 
        await supabase.from('products').delete().eq('id', id); 
        fetchProducts(); 
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>INVENTORY</Text>
          <Text style={styles.headerTitle}>MANAGE</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addBtnText}>NEW</Text>
        </TouchableOpacity>
      </View>

      {/* LIST PRODUK */}
      <FlatList 
        data={products} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({item}) => (
        <View style={styles.itemCard}>
          <Image source={{uri: item.image_url}} style={styles.img} />
          
          <View style={styles.itemDetails}>
            <Text style={styles.name} numberOfLines={1}>{item.name.toUpperCase()}</Text>
            <Text style={styles.price}>RP {item.price.toLocaleString()}</Text>
          </View>

          {/* ICON ACTIONS SAMPING-SAMPINGAN */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={()=>{setForm({id:item.id, name:item.name, price:item.price.toString(), image_url:item.image_url}); setModal(true);}} 
              style={styles.iconBtnEdit}>
              <Ionicons name="pencil-sharp" size={22} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={()=>del(item.id)} style={styles.iconBtnDelete}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      )} />

      {/* MODAL EDIT/BARU (Tetap sama) */}
      <Modal visible={modal} animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{form.id ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</Text>
            
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {form.image_url ? (
                <Image source={{uri: form.image_url}} style={styles.previewImg} />
              ) : (
                <View style={{alignItems:'center'}}>
                    <Ionicons name="cloud-upload-outline" size={40} color="#999" />
                    <Text style={styles.pickerText}>UPLOAD PHOTO</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>PRODUCT NAME</Text>
            <TextInput placeholder="e.g. KOPI HITAM" style={styles.input} value={form.name} onChangeText={t=>setForm({...form, name:t})} />

            <Text style={styles.label}>PRICE (RP)</Text>
            <TextInput placeholder="e.g. 15000" style={styles.input} keyboardType="numeric" value={form.price} onChangeText={t=>setForm({...form, price:t})} />

            <TouchableOpacity onPress={save} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>SAVE PRODUCT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={()=> {setModal(false); setForm({id:'', name:'', price:'', image_url:''})}}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
  addBtn: { backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  
  itemCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 20, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  img: { width: 55, height: 55, borderRadius: 12, backgroundColor: '#F8F8F8' },
  itemDetails: { flex: 1, marginLeft: 15 },
  name: { fontWeight: '900', fontSize: 14, color: '#000' },
  price: { color: '#666', fontSize: 13, fontWeight: '700', marginTop: 2 },
  
  // ICON ACTIONS STYLE
  actionRow: { flexDirection: 'row', gap: 8 },
  iconBtnEdit: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#F0F7FF', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iconBtnDelete: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#FFF0F0', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // MODAL
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 25, paddingTop: 60 },
  modalTitle: { fontSize: 28, fontWeight: '900', marginBottom: 25, letterSpacing: -1 },
  imagePicker: { 
    width: '100%', height: 250, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderRadius: 25,
    borderWidth: 2, borderColor: '#F2F2F2', borderStyle: 'dashed'
  },
  previewImg: { width: '100%', height: '100%', borderRadius: 23 },
  pickerText: { fontWeight: '800', color: '#999', fontSize: 11, marginTop: 10 },
  label: { fontSize: 11, fontWeight: '900', color: '#000', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#F8F8F8', padding: 18, borderRadius: 15, marginBottom: 20, fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: '#000', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cancelBtnText: { textAlign: 'center', marginTop: 20, color: '#999', fontWeight: '800', fontSize: 13 }
});