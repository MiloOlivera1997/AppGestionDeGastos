import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { db, auth } from "./firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDoc, setDoc 
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

export default function App() {
  // Estados auth y gastos
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [fechaGasto, setFechaGasto] = useState(new Date().toISOString().slice(0,10));
  const [gastos, setGastos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [presupuestos, setPresupuestos] = useState({
    supermercado: 200, gimnasio: 50, casa: 500, placer: 100, otros: 50,
  });

  const categorias = {
    supermercado: ["carrefour","mercadona","aldi","lidl"],
    gimnasio: ["gimnasio","gym","fitness"],
    casa: ["alquiler","agua","luz","gas"],
    placer: ["cine","netflix","restaurante","ocio"]
  };

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user)=>setUsuario(user));
    return () => unsubscribe();
  }, []);

  // Escucha gastos
  useEffect(()=>{
    if(!usuario) return;
    const unsubscribe = onSnapshot(
      collection(db, "usuarios", usuario.uid, "gastos"),
      (snapshot)=>setGastos(snapshot.docs.map(doc=>({id:doc.id,...doc.data()})))
    );
    return ()=>unsubscribe();
  }, [usuario]);

  // Cargar presupuestos
  useEffect(()=>{
    if(!usuario) return;
    const cargar = async ()=>{
      const docRef = doc(db,"usuarios",usuario.uid,"config","presupuestos");
      const docSnap = await getDoc(docRef);
      if(docSnap.exists()) setPresupuestos(docSnap.data());
      const local = await AsyncStorage.getItem(`presupuestos-${usuario.uid}`);
      if(local) setPresupuestos(JSON.parse(local));
    }
    cargar();
  }, [usuario]);

  // Funciones auth
  const registrarUsuario = async()=>{ try{ await createUserWithEmailAndPassword(auth,email,password); Alert.alert("Registrado ✅"); }catch(e){Alert.alert(e.message)} }
  const loginUsuario = async()=>{ try{ await signInWithEmailAndPassword(auth,email,password); }catch(e){Alert.alert(e.message)} }
  const logoutUsuario = async()=>{ await signOut(auth); }
  const recuperarContrasena = async()=>{ try{ await sendPasswordResetEmail(auth,email); Alert.alert("Email enviado ✅"); }catch(e){Alert.alert(e.message)} }

  // Gastos
  const detectarCategoria = (texto)=>{
    const lower = texto.toLowerCase();
    for(const [cat, palabras] of Object.entries(categorias)){
      if(palabras.some(p=>lower.includes(p))) return cat;
    }
    return "otros";
  }

  const agregarGasto = async()=>{
    if(!usuario) return Alert.alert("Debes iniciar sesión");
    if(!mensaje.trim()) return;
    const regex = /(.*?)(\d+[.,]?\d*)/;
    const match = mensaje.match(regex);
    if(!match) return;
    const descripcion = match[1].trim();
    const importe = parseFloat(match[2].replace(",","."));
    const categoria = detectarCategoria(descripcion);
    const fecha = new Date(fechaGasto);
    const nuevo = {
      descripcion, importe, categoria,
      fecha: fecha.toISOString(),
      mes: `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,"0")}`
    };
    if(editando){
      await updateDoc(doc(db,"usuarios",usuario.uid,"gastos",editando.id),nuevo);
      setEditando(null);
    }else{
      await addDoc(collection(db,"usuarios",usuario.uid,"gastos"),nuevo);
    }
    setMensaje(""); setFechaGasto(new Date().toISOString().slice(0,10));
  }

  const eliminarGasto = async(id)=>{
    Alert.alert("Eliminar","¿Seguro?",[
      {text:"Cancelar"}, {text:"Eliminar",onPress: async()=>{ await deleteDoc(doc(db,"usuarios",usuario.uid,"gastos",id))}}
    ])
  }

  const actualizarPresupuesto = async(cat,valor)=>{
    const nuevo = {...presupuestos,[cat]:valor};
    setPresupuestos(nuevo);
    if(!usuario) return;
    await setDoc(doc(db,"usuarios",usuario.uid,"config","presupuestos"),nuevo);
    await AsyncStorage.setItem(`presupuestos-${usuario.uid}`,JSON.stringify(nuevo));
  }

  if(!usuario){
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login / Registro</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input}/>
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input}/>
        <TouchableOpacity style={styles.button} onPress={loginUsuario}><Text style={styles.btnText}>Login</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={registrarUsuario}><Text style={styles.btnText}>Registrar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={recuperarContrasena}><Text style={styles.btnText}>Recuperar contraseña</Text></TouchableOpacity>
      </View>
    )
  }

  const totales = gastos.reduce((acc,g)=>{ acc[g.categoria]=(acc[g.categoria]||0)+g.importe; return acc; },{})
  const totalGeneral = Object.values(totales).reduce((a,b)=>a+b,0)

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.logout} onPress={logoutUsuario}><Text style={{color:'white'}}>Cerrar sesión</Text></TouchableOpacity>
      <Text style={styles.title}>💸 Gastos</Text>

      <TextInput placeholder="Ej: Carrefour 30" value={mensaje} onChangeText={setMensaje} style={styles.input}/>
      <TextInput placeholder="Fecha (YYYY-MM-DD)" value={fechaGasto} onChangeText={setFechaGasto} style={styles.input}/>
      <TouchableOpacity style={styles.button} onPress={agregarGasto}><Text style={styles.btnText}>{editando?"Guardar":"Añadir"}</Text></TouchableOpacity>

      <Text style={styles.subtitle}>📊 Presupuestos</Text>
      {Object.entries(presupuestos).map(([cat,val])=>(
        <View key={cat} style={styles.presupuestoRow}>
          <Text>{cat}: {totales[cat]? totales[cat].toFixed(2):0} / {val} €</Text>
          <TextInput style={styles.presInput} keyboardType="numeric" value={val.toString()} onChangeText={v=>actualizarPresupuesto(cat,Number(v))}/>
          {totales[cat] && val && totales[cat]>val && <Text style={{color:'red'}}>⚠️</Text>}
        </View>
      ))}

      <Text style={styles.subtitle}>📜 Historial</Text>
      <FlatList data={gastos} keyExtractor={item=>item.id} renderItem={({item})=>(
        <View style={styles.card}>
          <Text style={styles.cardText}>{item.descripcion} - {item.importe} € ({item.categoria})</Text>
          <View style={styles.cardButtons}>
            <TouchableOpacity style={styles.btnSmall} onPress={()=>setEditando(item)}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnSmallRed} onPress={()=>eliminarGasto(item.id)}><Text>🗑️</Text></TouchableOpacity>
          </View>
        </View>
      )}/>
      <Text style={styles.total}>Total: {totalGeneral.toFixed(2)} €</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:{padding:20,flex:1,backgroundColor:'#f9f9f9'},
  title:{fontSize:24,fontWeight:'bold',marginBottom:10},
  subtitle:{fontSize:18,fontWeight:'bold',marginTop:10,marginBottom:5},
  input:{borderWidth:1,borderColor:'#ccc',padding:8,marginBottom:5,borderRadius:5,backgroundColor:'white'},
  button:{backgroundColor:'#4CAF50',padding:10,borderRadius:5,marginVertical:5,alignItems:'center'},
  buttonSecondary:{backgroundColor:'#2196F3',padding:10,borderRadius:5,marginVertical:5,alignItems:'center'},
  btnText:{color:'white',fontWeight:'bold'},
  logout:{backgroundColor:'red',padding:8,borderRadius:5,alignItems:'center',marginBottom:10},
  presupuestoRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:3},
  presInput:{borderWidth:1,borderColor:'#ccc',padding:3,width:60,borderRadius:3,backgroundColor:'white'},
  card:{backgroundColor:'white',padding:10,borderRadius:5,marginVertical:3,flexDirection:'row',justifyContent:'space-between',alignItems:'center',elevation:2},
  cardText:{flex:1},
  cardButtons:{flexDirection:'row'},
  btnSmall:{marginHorizontal:3,padding:5,backgroundColor:'#ddd',borderRadius:3},
  btnSmallRed:{marginHorizontal:3,padding:5,backgroundColor:'#f66',borderRadius:3},
  total:{fontWeight:'bold',marginTop:10,fontSize:16}
})
