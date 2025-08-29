import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { db } from "./firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

function App() {
  const [mensaje, setMensaje] = useState("");
  const [fechaGasto, setFechaGasto] = useState(new Date().toISOString().slice(0, 10));
  const [gastos, setGastos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [editando, setEditando] = useState(null);

  const [presupuestos, setPresupuestos] = useState({
    supermercado: 200,
    gimnasio: 50,
    casa: 500,
    placer: 100,
    otros: 50,
  });

  const categorias = {
    supermercado: ["carrefour", "mercadona", "aldi", "lidl"],
    gimnasio: ["gimnasio", "gym", "fitness"],
    casa: ["alquiler", "agua", "luz", "gas"],
    placer: ["cine", "netflix", "restaurante", "ocio"],
  };

  // 🔹 Referencia al input
  const inputRef = useRef(null);

  // 🔹 Escucha en tiempo real los cambios en Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "gastos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGastos(lista);
    });
    return () => unsubscribe();
  }, []);

  const detectarCategoria = (texto) => {
    const lower = texto.toLowerCase();
    for (const [cat, palabras] of Object.entries(categorias)) {
      if (palabras.some(p => lower.includes(p))) return cat;
    }
    return "otros";
  };

  const agregarGasto = async () => {
    if (!mensaje.trim()) return;
    const regex = /(.*?)(\d+[.,]?\d*)/;
    const match = mensaje.match(regex);
    if (!match) return;

    const descripcion = match[1].trim();
    const importe = parseFloat(match[2].replace(",", "."));
    const categoria = detectarCategoria(descripcion);

    const fecha = new Date(fechaGasto);
    const nuevo = {
      descripcion,
      importe,
      categoria,
      fecha: fecha.toISOString(),
      mes: `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`,
    };

    await addDoc(collection(db, "gastos"), nuevo);

    setMensaje("");
    setFechaGasto(new Date().toISOString().slice(0, 10));
    inputRef.current.focus(); // 🔹 Coloca el cursor de nuevo en el input
  };

  const editarGasto = (gasto) => {
    setEditando({ ...gasto, fecha: gasto.fecha.slice(0, 10) });
  };

  const guardarEdicion = async () => {
    const fecha = new Date(editando.fecha);
    const gastoRef = doc(db, "gastos", editando.id);
    await updateDoc(gastoRef, {
      descripcion: editando.descripcion,
      importe: parseFloat(editando.importe),
      fecha: fecha.toISOString(),
      categoria: editando.categoria,
      mes: `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`,
    });
    setEditando(null);
  };

  const eliminarGasto = async (id) => {
    await deleteDoc(doc(db, "gastos", id));
  };

  // Filtrado por mes y categoría
  const gastosFiltrados = gastos
    .filter(g => !mesSeleccionado || g.mes === mesSeleccionado)
    .filter(g => !categoriaSeleccionada || g.categoria === categoriaSeleccionada);

  // Totales por categoría
  const totales = gastosFiltrados.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.importe;
    return acc;
  }, {});

  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);
  const mesesDisponibles = [...new Set(gastos.map(g => g.mes))];

  return (
    <div className="app-container">
      <h1 className="titulo">💸 Registro de Gastos</h1>

      {/* Nuevo gasto */}
      <div className="form-gasto">
        <input
          ref={inputRef}
          className="input"
          placeholder="Ej: Carrefour 30"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarGasto()}
        />
        <input
          className="input"
          type="date"
          value={fechaGasto}
          onChange={(e) => setFechaGasto(e.target.value)}
        />
        <button className="btn" onClick={agregarGasto}>➕ Añadir</button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <select className="select" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}>
          <option value="">Todos los meses</option>
          {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="select" value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Object.keys(categorias).concat("otros").map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Historial */}
      <h2 className="subtitulo">📜 Historial</h2>
      {gastosFiltrados.length === 0 ? <p>No hay gastos</p> :
        gastosFiltrados.map(g => (
          <div key={g.id} className="gasto-item">
            <span>{g.descripcion} - {g.importe.toFixed(2)}€ ({g.categoria}) [{g.fecha.slice(0,10)}]</span>
            <span>
              <button className="btn-small" onClick={() => editarGasto(g)}>✏️</button>
              <button className="btn-small rojo" onClick={() => eliminarGasto(g.id)}>🗑️</button>
            </span>
          </div>
        ))}

      {/* Modal edición */}
      {editando &&
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar gasto</h3>
            <input className="input" value={editando.descripcion} onChange={(e)=>setEditando({...editando, descripcion:e.target.value})}/>
            <input className="input" type="number" value={editando.importe} onChange={(e)=>setEditando({...editando, importe:e.target.value})}/>
            <input className="input" type="date" value={editando.fecha} onChange={(e)=>setEditando({...editando, fecha:e.target.value})}/>
            <div className="modal-buttons">
              <button className="btn" onClick={guardarEdicion}>💾 Guardar</button>
              <button className="btn rojo" onClick={()=>setEditando(null)}>❌ Cancelar</button>
            </div>
          </div>
        </div>
      }

      {/* Resumen */}
      <h2 className="subtitulo">📊 Resumen</h2>
      {Object.entries(totales).map(([cat,total])=>(
        <div key={cat} className="resumen-item">
          <span>{cat}:</span>
          <span>
            <input
              type="number"
              value={presupuestos[cat] || ""}
              onChange={(e)=>setPresupuestos({...presupuestos,[cat]:Number(e.target.value)})}
              className="input-presupuesto"
              placeholder="€"
            />
            <strong className={presupuestos[cat] && total > presupuestos[cat] ? "rojo" : "verde"}>
              {presupuestos[cat]? `${total.toFixed(2)} / ${presupuestos[cat]} €` : `${total.toFixed(2)} €`}
            </strong>
            {presupuestos[cat] && total > presupuestos[cat] && <span className="aviso"> ⚠️ Superado</span>}
          </span>
        </div>
      ))}

      {/* Total general */}
      <h3 className={Object.values(presupuestos).some(p=>p>0) && totalGeneral>Object.values(presupuestos).reduce((a,b)=>a+b,0) ? "rojo" : "verde"}>
        Total: {totalGeneral.toFixed(2)}€ / {Object.values(presupuestos).some(p=>p>0) ? Object.values(presupuestos).reduce((a,b)=>a+b,0) : "∞"}€
        {Object.values(presupuestos).some(p=>p>0) && totalGeneral>Object.values(presupuestos).reduce((a,b)=>a+b,0) && <span className="aviso"> ⚠️ Superado</span>}
      </h3>
    </div>
  )
}

export default App;
