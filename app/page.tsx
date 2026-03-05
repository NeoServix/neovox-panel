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
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Panel de Control NeoVox</h1>
            <p className="text-xs md:text-sm text-gray-500">Monitorización de nodos y enrutamiento</p>
          </div>
          <a href="https://neovox.app" className="bg-white border border-gray-300 px-4 py-3 md:py-2 rounded-lg shadow-sm text-xs md:text-sm font-semibold hover:bg-gray-50 w-full md:w-auto text-center transition-colors">
            Ir al Registro Público
          </a>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400">Cartera Activa</h2>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {agenciasFiltradas.length} Nodos
              </span>
            </div>
            
            <div className="w-full md:w-72">
              <input 
                type="text" 
                placeholder="Buscar por nombre o ID..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 md:p-1.5 text-sm bg-gray-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {cargando ? (
            <div className="p-12 text-center text-sm text-gray-400">Leyendo registros del búnker...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              <div className="hidden md:grid grid-cols-5 gap-4 p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase">
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
                  <div key={agencia.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:grid md:grid-cols-5 md:items-center gap-4">
                    
                    <div className="flex justify-between items-center md:block col-span-1">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{agencia.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {agencia.id.split('-')[0]}</p>
                      </div>
                      <div className="md:hidden">
                         <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                          {numeroAgentes} Com.
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1">
                      {estaConfigurada ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Operativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          Pendiente Config.
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 space-y-1">
                      <p className="text-[11px] md:text-xs text-gray-600 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 w-8">IN:</span> 
                        {agencia.inbound_email ? <span className="font-mono truncate">{agencia.inbound_email}</span> : <span className="italic text-red-400">Sin asignar</span>}
                      </p>
                      <p className="text-[11px] md:text-xs text-gray-600 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 w-8">OUT:</span> 
                        {agencia.assigned_phone ? <span className="font-mono">{agencia.assigned_phone}</span> : <span className="italic text-red-400">Sin cabecera</span>}
                      </p>
                    </div>

                    <div className="hidden md:block col-span-1 text-center">
                      <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        {numeroAgentes}
                      </span>
                    </div>

                    <div className="col-span-1 text-left md:text-right mt-2 md:mt-0">
                      <a 
                        href={`/agencias/${agencia.id}`} 
                        className="inline-block w-full md:w-auto text-center bg-gray-900 text-white text-xs font-bold px-4 py-3 md:py-2 rounded-lg shadow hover:bg-black transition-colors"
                      >
                        Entrar al Nodo
                      </a>
                    </div>

                  </div>
                );
              })}

              {(!cargando && agenciasFiltradas.length === 0) && (
                <div className="p-12 text-center">
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