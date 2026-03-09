"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CarteraAgencias() {
  const [agencias, setAgencias] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarNodos() {
      const { data, error } = await supabase
        .from('organizations')
        .select('*, agents(count)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAgencias(data);
      } else {
        console.error("Fallo de lectura en la tabla central:", error);
      }
      setCargando(false);
    }
    cargarNodos();
  }, []);

  const agenciasFiltradas = agencias.filter(agencia => 
    agencia.name.toLowerCase().includes(busqueda.toLowerCase()) || 
    agencia.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main className="p-4 md:p-10 bg-black min-h-screen font-sans text-gray-200 relative selection:bg-[#00A8E8] selection:text-white">
      {/* Resplandor de fondo general */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-[#00A8E8]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Panel de Control NeoVox</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Monitorización maestra de nodos y enrutamiento</p>
          </div>
          <a 
            href="https://neovox.app" 
            className="bg-[#121212]/80 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors text-white uppercase tracking-wider w-full md:w-auto text-center shadow-sm"
          >
            Ir al Registro Público
          </a>
        </div>
        
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#00A8E8]/50 to-transparent" />
          
          <div className="p-5 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/40">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400">Cartera Activa</h2>
              <span className="text-xs font-bold bg-[#00A8E8]/10 text-[#00A8E8] px-3 py-1 rounded-full border border-[#00A8E8]/20">
                {agenciasFiltradas.length} Nodos
              </span>
            </div>
            
            <div className="w-full md:w-80">
              <input 
                type="text" 
                placeholder="Buscar por nombre o ID..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-white/10 rounded-xl p-3 md:p-2 text-sm bg-black/50 text-white focus:border-[#00A8E8] outline-none transition-colors placeholder:text-gray-600"
              />
            </div>
          </div>

          {cargando ? (
            <div className="p-16 text-center text-sm text-gray-500 font-mono">Leyendo registros del búnker...</div>
          ) : (
            <div className="divide-y divide-white/5">
              <div className="hidden md:grid grid-cols-5 gap-4 p-4 bg-black/60 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-1">Sociedad / Agencia</div>
                <div className="col-span-1">Estado Técnico</div>
                <div className="col-span-1">Enrutamiento</div>
                <div className="col-span-1 text-center">Comerciales</div>
                <div className="col-span-1 text-right">Acción</div>
              </div>

              {agenciasFiltradas.map((agencia: any) => {
                const estaConfigurada = agencia.inbound_email && agencia.assigned_phone;
                const numeroAgentes = agencia.agents?.[0]?.count || 0;

                return (
                  <div key={agencia.id} className="p-4 md:p-5 hover:bg-white/5 transition-colors flex flex-col md:grid md:grid-cols-5 md:items-center gap-4 group">
                    
                    <div className="flex justify-between items-center md:block col-span-1">
                      <div>
                        <p className="font-bold text-sm text-white">{agencia.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {agencia.id.split('-')[0]}</p>
                      </div>
                      <div className="md:hidden">
                         <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                          {numeroAgentes} Com.
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1">
                      {estaConfigurada ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider shadow-inner">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
                          Operativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider shadow-inner">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.8)]"></div>
                          Pendiente Config.
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 space-y-1.5">
                      <p className="text-[11px] md:text-xs text-gray-400 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-600 w-8">IN:</span> 
                        {agencia.inbound_email ? <span className="font-mono text-gray-200 truncate">{agencia.inbound_email}</span> : <span className="italic text-red-400">Sin asignar</span>}
                      </p>
                      <p className="text-[11px] md:text-xs text-gray-400 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-600 w-8">OUT:</span> 
                        {agencia.assigned_phone ? <span className="font-mono text-gray-200">{agencia.assigned_phone}</span> : <span className="italic text-red-400">Sin cabecera</span>}
                      </p>
                    </div>

                    <div className="hidden md:block col-span-1 text-center">
                      <span className="text-sm font-bold text-gray-300 bg-black/50 px-3 py-1 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                        {numeroAgentes}
                      </span>
                    </div>

                    <div className="col-span-1 text-left md:text-right mt-2 md:mt-0">
                      <a 
                        href={`/agencias/${agencia.id}`} 
                        className="inline-block w-full md:w-auto text-center bg-[#00A8E8] text-white text-[10px] md:text-xs font-bold px-5 py-3 md:py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,168,232,0.2)] hover:bg-[#0090C8] transition-all uppercase tracking-widest active:scale-[0.98]"
                      >
                        Entrar al Nodo
                      </a>
                    </div>

                  </div>
                );
              })}

              {(!cargando && agenciasFiltradas.length === 0) && (
                <div className="p-16 text-center">
                  <p className="text-sm text-gray-500 font-medium">No hay nodos que coincidan con esta búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}