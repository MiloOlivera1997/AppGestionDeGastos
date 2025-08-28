import React, { useState, useEffect } from "react";

export default function App() {
  const [mensaje, setMensaje] = useState("");
  const [gastos, setGastos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [presupuestos, setPresupuestos] = useState({
    supermercado: 200,
    gimnasio: 50,
    casa: 500,
    placer: 100,
    otros: 50
  });

  useEffect(() => {
    const guardados = localStorage.getItem("gastos");
    if (guardados) setGastos(JSON.parse(guardados));
  }, []);

  useEffect(() => {
    localStorage.setItem("gastos", JSON.stringify(gastos));
  }, [gastos]);

  const categorias = {
    supermercado: ["carrefour", "mercadona", "aldi", "lid"],
    gimnasio: ["gimnasio", "gym", "fitness"],
    casa: ["alquiler", "agua", "luz", "gas"],
    placer: ["cine", "netflix", "restaurante", "ocio"]
  };

  const detectarCategoria = (texto) => {
    const lower = texto.toLowerCase();
    for (const [cat, palabras] of Object.entries(categorias)) {
      if (palabras.some((p) => lower.includes(p))) return cat;
    }
    return "otros";
  };

  const agregarGasto = () => {
    if (!mensaje.trim()) return;
    const regex = /(.*?)(\d+[.,]?\d*)/;
    const match = mensaje.match(regex);
    if (match) {
      const descripcion = match[1].trim();
      const importe = parseFloat(match[2].replace(",", "."));
      const categoria = detectarCategoria(descripcion);
      const fecha = new Date();
      const nuevo = {
        id: Date.now(),
        descripcion,
        importe,
        categoria,
        fecha: fecha.toISOString(),
        mes: `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`
      };
      setGastos([...gastos, nuevo]);
      setMensaje("");
    }
  };

  const editarGasto = (id) => {
    const gasto = gastos.find(g => g.id === id);
    const nuevoDesc = prompt("Editar descripción:", gasto.descripcion);
    const nuevoImp = prompt("Editar importe:", gasto.importe);
    if (nuevoDesc !== null && nuevoImp !== null) {
      setGastos(gastos.map(g => g.id === id ? {...g, descripcion: nuevoDesc, importe: parseFloat(nuevoImp)} : g));
    }
  };

  const eliminarGasto = (id) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const gastosFiltrados = gastos
    .filter(g => !mesSeleccionado || g.mes === mesSeleccionado)
    .filter(g => !categoriaSeleccionada || g.categoria === categoriaSeleccionada);

  const totales = gastosFiltrados.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.importe;
    return acc;
  }, {});

  const totalGeneral = Object.values(totales).reduce((a,b)=>a+b,0);
  const mesesDisponibles = [...new Set(gastos.map(g=>g.mes))];
  const categoriasDisponibles = [...new Set(gastos.map(g=>g.categoria))];

  const formatearMes = (mes) => {
    const [anio, mesNum] = mes.split('-');
    const fecha = new Date(parseInt(anio), parseInt(mesNum)-1);
    return fecha.toLocaleDateString('es-ES', {month:'long', year:'numeric'});
  };

  const formatearFecha = (fechaIso) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});
  };

  return (
    <div style={{padding:'20px', fontFamily:'Arial', background:'#f0f0f0', minHeight:'100vh'}}>

      {/* Agregar gasto */}
      <div style={{background:'#fff', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
        <h1 style={{fontSize:'24px', marginBottom:'10px'}}>💸 Registro de Gastos</h1>
        <div style={{display:'flex', gap:'10px'}}>
          <input style={{flex:1, padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}}
            placeholder="Ej: Carrefour 30€"
            value={mensaje}
            onChange={(e)=>setMensaje(e.target.value)}
            onKeyDown={(e)=> e.key==='Enter' && agregarGasto()}
          />
          <button style={{padding:'8px 12px', borderRadius:'4px', background:'#007bff', color:'#fff', border:'none'}} onClick={agregarGasto}>Añadir</button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{background:'#fff', padding:'20px', borderRadius:'8px', marginBottom:'20px', display:'flex', gap:'20px'}}>
        <div>
          <h2 style={{fontSize:'16px'}}>📅 Mes</h2>
          <select style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}} value={mesSeleccionado} onChange={e=>setMesSeleccionado(e.target.value)}>
            <option value="">Todos</option>
            {mesesDisponibles.map(mes=><option key={mes} value={mes}>{formatearMes(mes)}</option>)}
          </select>
        </div>
        <div>
          <h2 style={{fontSize:'16px'}}>📂 Categoría</h2>
          <select style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}} value={categoriaSeleccionada} onChange={e=>setCategoriaSeleccionada(e.target.value)}>
            <option value="">Todas</option>
            {categoriasDisponibles.map(cat=><option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Historial */}
      <div style={{background:'#fff', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
        <h2 style={{fontSize:'20px', marginBottom:'10px'}}>📋 Historial</h2>
        <div style={{maxHeight:'200px', overflowY:'auto'}}>
          {gastosFiltrados.map(g=>(
            <div key={g.id} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
              <span>{formatearFecha(g.fecha)} - {g.descripcion} ({g.categoria})</span>
              <div style={{display:'flex', gap:'5px'}}>
                <button onClick={()=>editarGasto(g.id)} style={{padding:'2px 5px'}}>Editar</button>
                <button onClick={()=>eliminarGasto(g.id)} style={{padding:'2px 5px'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div style={{background:'#fff', padding:'20px', borderRadius:'8px'}}>
        <h2 style={{fontSize:'20px', marginBottom:'10px'}}>📊 Resumen mensual / Presupuestos</h2>
        {Object.entries(totales).map(([cat, suma])=>(
          <div key={cat} style={{display:'flex', justifyContent:'space-between'}}>
            <span style={{textTransform:'capitalize'}}>{cat}</span>
            <span>{suma.toFixed(2)} € / {presupuestos[cat]} €</span>
          </div>
        ))}
        <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', borderTop:'1px solid #ccc', marginTop:'5px', paddingTop:'5px'}}>
          <span>Total</span>
          <span>{totalGeneral.toFixed(2)} €</span>
        </div>
      </div>

    </div>
  );
}
