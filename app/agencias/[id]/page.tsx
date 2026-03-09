"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DAYS_ES = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo"
};

type DaySchedule = { isOpen: boolean; open: string; close: string };
type ScheduleConfig = Record<string, DaySchedule>;

const defaultSchedule: ScheduleConfig = {
  monday: { isOpen: true, open: "09:00", close: "18:00" },
  tuesday: { isOpen: true, open: "09:00", close: "18:00" },
  wednesday: { isOpen: true, open: "09:00", close: "18:00" },
  thursday: { isOpen: true, open: "09:00", close: "18:00" },
  friday: { isOpen: true, open: "09:00", close: "15:00" },
  saturday: { isOpen: false, open: "00:00", close: "00:00" },
  sunday: { isOpen: false, open: "00:00", close: "00:00" }
};

export default function EditarAgencia({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const agenciaId = resolvedParams.id;

  const [agencia, setAgencia] = useState<any>(null);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [llamadas, setLlamadas] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [nuevoAgente, setNuevoAgente] = useState({ full_name: '', phone_number: '' });

  useEffect(() => {
    async function cargarDatos() {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('id', agenciaId).single();
      if (orgData) {
        if (!orgData.schedule) orgData.schedule = defaultSchedule;
        setAgencia(orgData);
      }

      const { data: agData } = await supabase.from('agents').select('*').eq('org_id', agenciaId).order('id', { ascending: true });
      if (agData) setAgentes(agData);

      const { data: callData } = await supabase
        .from('calls')
        .select(`
          id, 
          created_at, 
          status, 
          duration, 
          agents(full_name), 
          leads(ai_whisper, parsed_data)
        `)
        .eq('org_id', agenciaId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (callData) setLlamadas(callData);
    }
    cargarDatos();
  }, [agenciaId]);

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await supabase.from('organizations').update({
      name: agencia.name,
      contact_email: agencia.contact_email, // Campo añadido a la escritura
      inbound_email: agencia.inbound_email,
      assigned_phone: agencia.assigned_phone,
      ai_prompt_template: agencia.ai_prompt_template,
      schedule: agencia.schedule 
    }).eq('id', agenciaId);
    setGuardando(false);
    alert("Configuración guardada.");
  }

  const updateDaySchedule = (day: string, field: keyof DaySchedule, value: boolean | string) => {
    setAgencia({
      ...agencia,
      schedule: {
        ...agencia.schedule,
        [day]: { ...agencia.schedule[day], [field]: value }
      }
    });
  };

  async function crearAgente(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoAgente.full_name || !nuevoAgente.phone_number) return;
    const { data } = await supabase.from('agents').insert([{ org_id: agenciaId, full_name: nuevoAgente.full_name, phone_number: nuevoAgente.phone_number, is_receiving_calls: true }]).select();
    if (data) {
      setAgentes([...agentes, data[0]]);
      setNuevoAgente({ full_name: '', phone_number: '' });
    }
  }

  async function eliminarAgente(id: string) {
    if (!confirm("¿Eliminar comercial?")) return;
    await supabase.from('agents').delete().eq('id', id);
    setAgentes(agentes.filter(a => a.id !== id));
  }

  async function toggleLlamadas(id: string, estado: boolean) {
    await supabase.from('agents').update({ is_receiving_calls: !estado }).eq('id', id);
    setAgentes(agentes.map(a => a.id === id ? { ...a, is_receiving_calls: !estado } : a));
  }

  if (!agencia) return <div className="p-10 text-center text-gray-500">Conectando al búnker...</div>;

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{agencia.name}</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">ID de Agencia: {agencia.id}</p>
          </div>
          <button onClick={() => router.push('/')} className="bg-white border border-gray-300 px-4 py-3 md:py-2 rounded-lg shadow-sm text-xs md:text-sm font-semibold hover:bg-gray-50 w-full md:w-auto text-center transition-colors">
            Volver al Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <form onSubmit={guardarCambios} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-6">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400">Configuración Lógica</h2>
              
              {/* CAMPO AÑADIDO: Correo de Contacto */}
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-semibold text-gray-600">Correo de Contacto (Gerencia)</label>
                <input 
                  type="email" 
                  value={agencia.contact_email || ''} 
                  onChange={(e) => setAgencia({...agencia, contact_email: e.target.value})} 
                  className="w-full border rounded p-3 md:p-2 text-sm bg-gray-50 outline-none focus:border-blue-500" 
                  placeholder="gerencia@agencia.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-semibold text-gray-600">Buzón de Entrada</label>
                  <input type="text" value={agencia.inbound_email || ''} onChange={(e) => setAgencia({...agencia, inbound_email: e.target.value})} className="w-full border rounded p-3 md:p-2 text-sm bg-gray-50 font-mono outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-semibold text-gray-600">Cabecera Twilio</label>
                  <input type="text" value={agencia.assigned_phone || ''} onChange={(e) => setAgencia({...agencia, assigned_phone: e.target.value})} className="w-full border rounded p-3 md:p-2 text-sm bg-gray-50 font-mono outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-widest block mb-2">Matriz de Enrutamiento</label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {Object.keys(DAYS_ES).map((day) => {
                    const dayData = agencia.schedule?.[day] || defaultSchedule[day];
                    return (
                      <div key={day} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 w-1/3">
                          <input 
                            type="checkbox" 
                            checked={dayData.isOpen}
                            onChange={(e) => updateDaySchedule(day, "isOpen", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${dayData.isOpen ? 'text-gray-800' : 'text-gray-400'}`}>
                            {DAYS_ES[day as keyof typeof DAYS_ES]}
                          </span>
                        </div>

                        <div className={`flex gap-3 transition-opacity ${dayData.isOpen ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                          <input 
                            type="time" 
                            value={dayData.open}
                            onChange={(e) => updateDaySchedule(day, "open", e.target.value)}
                            className="border border-gray-200 text-gray-800 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                          />
                          <span className="text-gray-400 text-xs mt-1.5">-</span>
                          <input 
                            type="time" 
                            value={dayData.close}
                            onChange={(e) => updateDaySchedule(day, "close", e.target.value)}
                            className="border border-gray-200 text-gray-800 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-gray-100">
                <label className="text-[10px] md:text-xs font-semibold text-gray-600">Cerebro IA (Prompt)</label>
                <textarea rows={6} value={agencia.ai_prompt_template || ''} onChange={(e) => setAgencia({...agencia, ai_prompt_template: e.target.value})} className="w-full border rounded p-3 md:p-2 text-sm focus:border-blue-500 outline-none transition-all" />
              </div>

              <button type="submit" disabled={guardando} className="w-full bg-blue-600 text-white font-bold py-4 md:py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]">
                {guardando ? 'Sincronizando...' : 'Guardar Cambios'}
              </button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400">Auditoría de Conversaciones</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {llamadas.map(call => (
                  <div key={call.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-xs font-mono text-gray-400">{new Date(call.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="font-bold text-sm text-gray-800">{call.leads?.parsed_data?.nombre || 'Desconocido'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] md:text-xs font-medium text-blue-600">↳ Atendido por {call.agents?.full_name}</span>
                        <span className={`text-[9px] md:text-[10px] px-2 py-1 rounded-full font-bold uppercase ${call.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {call.status} ({call.duration}s)
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] md:text-sm text-gray-600 italic bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 leading-relaxed">
                      " {call.leads?.ai_whisper || 'Sin resumen generado' } "
                    </p>
                  </div>
                ))}
                {llamadas.length === 0 && <div className="p-10 text-center text-sm text-gray-400">Sin actividad reciente.</div>}
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Comerciales en Línea</h2>
              <div className="space-y-3 mb-6">
                {agentes.map(agente => (
                  <div key={agente.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3">
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate">{agente.full_name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{agente.phone_number}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-gray-200 pt-3 sm:pt-0 mt-1 sm:mt-0">
                      <button onClick={() => toggleLlamadas(agente.id, agente.is_receiving_calls)} className={`w-10 md:w-8 h-5 md:h-4 rounded-full relative transition-colors ${agente.is_receiving_calls ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-4 md:w-3 h-4 md:h-3 bg-white rounded-full transition-all ${agente.is_receiving_calls ? 'left-5 md:left-4.5' : 'left-1 md:left-0.5'}`} />
                      </button>
                      <button onClick={() => eliminarAgente(agente.id)} className="p-2 md:p-1 text-gray-400 hover:text-red-500 transition-all">
                        <svg className="w-5 md:w-4 h-5 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={crearAgente} className="space-y-2">
                <input type="text" placeholder="Nombre completo" value={nuevoAgente.full_name} onChange={e => setNuevoAgente({...nuevoAgente, full_name: e.target.value})} className="w-full border rounded-lg p-3 md:p-2 text-sm focus:border-blue-500 outline-none" />
                <input type="text" placeholder="+34..." value={nuevoAgente.phone_number} onChange={e => setNuevoAgente({...nuevoAgente, phone_number: e.target.value})} className="w-full border rounded-lg p-3 md:p-2 text-sm font-mono focus:border-blue-500 outline-none" />
                <button type="submit" className="w-full bg-gray-900 text-white text-xs font-bold py-4 md:py-2 rounded-lg hover:bg-black transition-colors">Añadir Comercial</button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}