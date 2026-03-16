"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
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
  const [leads, setLeads] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [nuevoAgente, setNuevoAgente] = useState({ full_name: '', phone_number: '' });

  useEffect(() => {
    async function cargarDatos() {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('id', agenciaId).single();
      if (orgData) {
        const scheduleData = orgData.business_hours || defaultSchedule;
        setAgencia({ ...orgData, schedule: scheduleData });
      }

      const { data: agData } = await supabase.from('agents').select('*').eq('org_id', agenciaId).order('id', { ascending: true });
      if (agData) setAgentes(agData);

      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          id, 
          created_at, 
          status, 
          portal_source,
          ai_whisper, 
          parsed_data,
          agents(full_name)
        `)
        .eq('org_id', agenciaId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (leadsData) setLeads(leadsData);
    }
    cargarDatos();
  }, [agenciaId]);

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    
    await supabase.from('organizations').update({
      name: agencia.name,
      contact_email: agencia.contact_email,
      inbound_email: agencia.inbound_email,
      assigned_phone: agencia.assigned_phone,
      crm_forwarding_email: agencia.crm_forwarding_email || null,
      ai_prompt_template: agencia.ai_prompt_template,
      business_hours: agencia.schedule 
    }).eq('id', agenciaId);
    
    setGuardando(false);
    alert("Configuración de la agencia consolidada.");
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
    if (!confirm("¿Desconectar y eliminar terminal?")) return;
    await supabase.from('agents').delete().eq('id', id);
    setAgentes(agentes.filter(a => a.id !== id));
  }

  async function toggleLlamadas(id: string, estado: boolean) {
    await supabase.from('agents').update({ is_receiving_calls: !estado }).eq('id', id);
    setAgentes(agentes.map(a => a.id === id ? { ...a, is_receiving_calls: !estado } : a));
  }

  function getEstadoVisual(status: string) {
    switch(status) {
      case 'connected':
        return { texto: 'Conectado', clases: 'bg-green-500/10 text-green-400 border border-green-500/20' };
      case 'manual_review_needed':
        return { texto: 'Revisión Manual', clases: 'bg-red-500/10 text-red-400 border border-red-500/20' };
      case 'unanswered':
        return { texto: 'No Respondido', clases: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
      case 'pending_notification':
        return { texto: 'Fuera de Horario', clases: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
      case 'processing':
        return { texto: 'Analizando', clases: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
      case 'notified':
        return { texto: 'Aviso Enviado', clases: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' };
      default:
        return { texto: status, clases: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }
  }

  if (!agencia) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-xs">Conectando al registro central...</div>;

  return (
    <main className="p-4 md:p-10 bg-black min-h-screen font-sans text-gray-200 relative selection:bg-[#00A8E8] selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-[#00A8E8]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#00A8E8]/20 pb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">{agencia.name}</h1>
            <p className="text-[10px] md:text-xs text-[#00A8E8] font-mono mt-2 uppercase tracking-widest bg-[#00A8E8]/10 inline-block px-3 py-1 rounded-full border border-[#00A8E8]/20">ID de Agencia: {agencia.id}</p>
          </div>
          <button onClick={() => router.push('/')} className="bg-[#121212]/80 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors text-white uppercase tracking-wider w-full md:w-auto text-center shadow-sm">
            Volver al Panel
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <form onSubmit={guardarCambios} className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00A8E8]/50 to-transparent" />
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#00A8E8] mb-6">Configuración Lógica</h2>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest">Correo de Contacto (Gerencia)</label>
                  <input 
                    type="email" 
                    value={agencia.contact_email || ''} 
                    onChange={(e) => setAgencia({...agencia, contact_email: e.target.value})} 
                    className="w-full border border-white/10 rounded-xl p-3 bg-black/50 text-white outline-none focus:border-[#00A8E8] transition-colors" 
                    placeholder="gerencia@agencia.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest">Buzón de Entrada</label>
                    <input type="text" value={agencia.inbound_email || ''} onChange={(e) => setAgencia({...agencia, inbound_email: e.target.value})} className="w-full border border-white/10 rounded-xl p-3 bg-black/50 text-white font-mono outline-none focus:border-[#00A8E8] transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest">Número Twilio</label>
                    <input type="text" value={agencia.assigned_phone || ''} onChange={(e) => setAgencia({...agencia, assigned_phone: e.target.value})} className="w-full border border-white/10 rounded-xl p-3 bg-black/50 text-white font-mono outline-none focus:border-[#00A8E8] transition-colors" />
                  </div>
                </div>

                <div className="space-y-1 pt-4">
                  <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1">Ruta de Integración CRM</label>
                  <input 
                    type="email" 
                    value={agencia.crm_forwarding_email || ''} 
                    onChange={(e) => setAgencia({...agencia, crm_forwarding_email: e.target.value})} 
                    className="w-full border border-white/10 rounded-xl p-3 bg-black/50 text-white outline-none focus:border-[#00A8E8] transition-colors" 
                    placeholder="buzon-captura@tu-crm.com (Opcional)"
                  />
                  <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Si queda en blanco, NeoVox actuará como archivo local y enviará los avisos al correo de gerencia.</p>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#00A8E8] uppercase tracking-widest block mb-4">Matriz de Enrutamiento</label>
                  <div className="space-y-2">
                    {Object.keys(DAYS_ES).map((day) => {
                      const dayData = agencia.schedule?.[day] || defaultSchedule[day];
                      return (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-black/40 rounded-2xl border border-white/5 gap-3">
                          <div className="flex items-center gap-3 w-full sm:w-1/3">
                            <input 
                              type="checkbox" 
                              checked={dayData.isOpen}
                              onChange={(e) => updateDaySchedule(day, "isOpen", e.target.checked)}
                              className="w-4 h-4 rounded border-white/20 bg-black/50 checked:bg-[#00A8E8] focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-xs font-bold ${dayData.isOpen ? 'text-white' : 'text-gray-500'}`}>
                              {DAYS_ES[day as keyof typeof DAYS_ES]}
                            </span>
                          </div>

                          <div className={`flex gap-3 transition-opacity ${dayData.isOpen ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <input 
                              type="time" 
                              value={dayData.open}
                              onChange={(e) => updateDaySchedule(day, "open", e.target.value)}
                              className="bg-black/50 border border-[#00A8E8]/20 text-white text-xs p-2 rounded-lg outline-none focus:border-[#00A8E8] transition-colors"
                            />
                            <span className="text-gray-500 text-xs mt-2">-</span>
                            <input 
                              type="time" 
                              value={dayData.close}
                              onChange={(e) => updateDaySchedule(day, "close", e.target.value)}
                              className="bg-black/50 border border-[#00A8E8]/20 text-white text-xs p-2 rounded-lg outline-none focus:border-[#00A8E8] transition-colors"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1 pt-6 border-t border-white/5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#00A8E8] uppercase tracking-widest mb-2 block">Cerebro IA (Prompt)</label>
                  <textarea rows={6} value={agencia.ai_prompt_template || ''} onChange={(e) => setAgencia({...agencia, ai_prompt_template: e.target.value})} className="w-full border border-white/10 rounded-xl p-4 text-sm bg-black/50 text-white focus:border-[#00A8E8] outline-none transition-colors font-mono leading-relaxed" />
                </div>

                <button type="submit" disabled={guardando} className="w-full bg-[#00A8E8] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,168,232,0.3)] hover:bg-[#0090C8] transition-all uppercase text-xs tracking-widest disabled:opacity-50 active:scale-[0.98] mt-4">
                  {guardando ? 'Sincronizando con búnker...' : 'Actualizar'}
                </button>
              </div>
            </form>

            <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 md:p-6 border-b border-white/5">
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400">Auditoría de Tráfico General</h2>
              </div>
              <div className="divide-y divide-white/5">
                {leads.map(lead => {
                  const estado = getEstadoVisual(lead.status);
                  const nombreLead = lead.parsed_data?.nombre || 'Lead Entrante';
                  const nombreAgente = lead.agents?.full_name || 'Sistema de Alerta';
                  const telefonoCliente = lead.parsed_data?.telefono || 'Sin número';

                  return (
                    <div key={lead.id} className="p-5 hover:bg-white/5 transition-colors group">
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] md:text-xs font-mono text-[#00A8E8] bg-[#00A8E8]/10 px-2 py-0.5 rounded border border-[#00A8E8]/20">
                            {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="font-bold text-sm text-white">{nombreLead}</span>
                          <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{telefonoCliente}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[11px] md:text-xs text-gray-400 font-medium flex items-center gap-2">
                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Gestión: <strong className={nombreAgente === 'Sistema de Alerta' ? 'text-[#00A8E8]' : 'text-gray-200'}>{nombreAgente}</strong>
                          </span>
                          <span className={`text-[9px] md:text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-inner ${estado.clases}`}>
                            {estado.texto}
                          </span>
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xl mt-3 relative overflow-hidden group-hover:border-[#00A8E8]/20 transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00A8E8]/30" />
                        <p className="text-[13px] md:text-sm text-gray-400 italic font-medium leading-relaxed pl-2">
                          " {lead.ai_whisper || 'Procesando información del contacto...'} "
                        </p>
                      </div>
                    </div>
                  );
                })}
                {leads.length === 0 && <div className="p-16 text-center text-sm text-gray-500 font-mono">Sin actividad de red reciente.</div>}
              </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-[#00A8E8]">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 relative z-10">Terminales en Línea</h2>
              
              <div className="space-y-3 mb-8 relative z-10">
                {agentes.map(agente => (
                  <div key={agente.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 gap-3">
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-white truncate mb-0.5">{agente.full_name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{agente.phone_number}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 mt-1 sm:mt-0">
                      <button onClick={() => toggleLlamadas(agente.id, agente.is_receiving_calls)} className={`w-14 h-7 rounded-full relative transition-colors shadow-inner ${agente.is_receiving_calls ? 'bg-[#00A8E8]' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${agente.is_receiving_calls ? 'left-8' : 'left-1'}`} />
                      </button>
                      <button onClick={() => eliminarAgente(agente.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={crearAgente} className="space-y-3 relative z-10 pt-6 border-t border-white/5">
                <label className="text-[10px] font-semibold text-[#00A8E8] uppercase tracking-widest block mb-2">Añadir Terminal</label>
                <input type="text" placeholder="Nombre completo" value={nuevoAgente.full_name} onChange={e => setNuevoAgente({...nuevoAgente, full_name: e.target.value})} className="w-full border border-white/10 rounded-xl p-3 text-sm bg-black/50 text-white focus:border-[#00A8E8] outline-none transition-colors" />
                <input type="text" placeholder="+34..." value={nuevoAgente.phone_number} onChange={e => setNuevoAgente({...nuevoAgente, phone_number: e.target.value})} className="w-full border border-white/10 rounded-xl p-3 text-sm font-mono bg-black/50 text-white focus:border-[#00A8E8] outline-none transition-colors" />
                <button type="submit" className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold py-3.5 rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest mt-2">Dar de alta</button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}