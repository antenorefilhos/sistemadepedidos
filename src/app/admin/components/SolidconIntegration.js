'use client';

import { useState, useRef, useEffect } from 'react';

export default function SolidconIntegration({ password }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  
  const terminalEndRef = useRef(null);

  // Auto-scroll the terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const startSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLogs([]);
    addLog('Iniciando sincronização com ERP Solidcon...', 'info');
    
    try {
      // Step 1: Request sync to backend
      addLog('Autenticando na API Solidcon (Simulado)...', 'info');
      
      const res = await fetch(`/api/admin/solidcon?auth=${encodeURIComponent(password)}`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Mock visual progress for the user based on backend response
        setTimeout(() => addLog(`Baixando tabela de preços e estoque. SKUs encontrados: ${data.totalProducts}...`, 'info'), 1000);
        
        setTimeout(() => addLog('Cruzando dados de EAN/SKU com o Supabase...', 'warning'), 2500);
        
        setTimeout(() => {
          addLog(`Atualizando banco de dados em lote (${data.updated} produtos alterados)...`, 'success');
        }, 4000);
        
        setTimeout(() => {
          const syncDate = new Date().toLocaleString('pt-BR');
          addLog(`SINCRONIZAÇÃO CONCLUÍDA! Sucesso: ${data.updated} | Erros: ${data.errors}`, 'success');
          setLastSync(syncDate);
          localStorage.setItem('solidcon_last_sync', syncDate);
          setIsSyncing(false);
        }, 5000);

      } else {
        addLog(`Erro na sincronização: ${data.error}`, 'error');
        setIsSyncing(false);
      }
      
    } catch (err) {
      addLog(`Falha na conexão: ${err.message}`, 'error');
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease]">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-base-content mb-1">Integração ERP Solidcon</h2>
          <p className="text-base-content/60 text-sm m-0">Sincronização de Preços e Estoque em tempo real</p>
        </div>
        <button 
          onClick={startSync}
          disabled={isSyncing}
          className="btn btn-primary shadow-lg gap-3 px-6 h-12"
        >
          {isSyncing ? (
            <><span className="loading loading-spinner loading-sm"></span> Sincronizando...</>
          ) : (
            <><i className="fa-solid fa-cloud-arrow-down"></i> Sincronizar Agora</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Status Panel (Largura Total) */}
        <div className="card bg-base-200/50 border border-base-300 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4 border-b border-base-300 pb-4 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-lg text-success border border-success/20">
                <i className="fa-solid fa-server"></i>
              </div>
              <div>
                <h3 className="m-0 text-base-content font-bold text-base">Status da Sincronização</h3>
                <span className="text-sm text-base-content/60">Histórico de comunicação direta com o ERP</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
                <span className="text-base-content/70 text-sm">Última Sincronização:</span>
                <b className="text-base-content">{lastSync || localStorage.getItem('solidcon_last_sync') || 'Nunca realizada'}</b>
              </div>
              <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
                <span className="text-base-content/70 text-sm">Campos Atualizados:</span>
                <b className="text-base-content">Preço e Estoque (Integração sem Autenticação)</b>
              </div>
              <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
                <span className="text-base-content/70 text-sm">Gatilho:</span>
                <b className="text-base-content">Manual via Admin</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Visualizador de Logs */}
      <div className="rounded-xl border border-base-300 bg-base-200 overflow-hidden shadow-inner">
        <div className="p-3 bg-base-300/50 border-b border-base-300 flex items-center gap-3">
          <i className="fa-solid fa-terminal text-base-content/50 text-sm"></i>
          <span className="text-base-content/70 text-xs font-mono tracking-widest uppercase">Logs de Sincronização</span>
        </div>
        
        <div className="p-6 min-h-[250px] max-h-[350px] overflow-y-auto font-mono text-sm leading-relaxed text-base-content">
          {logs.length === 0 ? (
            <span className="text-base-content/40 opacity-70">&gt; Aguardando comando de sincronização...</span>
          ) : (
            logs.map((log, idx) => {
              let colorClass = 'text-base-content/80';
              if (log.type === 'success') colorClass = 'text-success';
              if (log.type === 'warning') colorClass = 'text-warning';
              if (log.type === 'error') colorClass = 'text-error';
              
              return (
                <div key={idx} className="flex gap-4 mb-2 animate-[fadeIn_0.3s_ease]">
                  <span className="text-base-content/40 select-none">[{log.time}]</span>
                  <span className={colorClass}>{log.msg}</span>
                </div>
              );
            })
          )}
          {isSyncing && (
            <div className="flex gap-4 mt-2">
              <span className="text-base-content/40">[{new Date().toLocaleTimeString('pt-BR')}]</span>
              <span className="text-primary pulsing-text">_</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pulsing-text {
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
