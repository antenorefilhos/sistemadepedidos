'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';

export default function SolidconIntegration({ password }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    setLastSync(localStorage.getItem('solidcon_last_sync'));
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => [...prev, { time, msg, type }]);
  };

  const startSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLogs([]);
    addLog('Iniciando sincronização com ERP Solidcon...', 'info');
    addLog('Autenticando na API Solidcon (Simulado)...', 'info');

    try {
      const data = await adminFetch('/api/admin/solidcon', { password, method: 'POST' });
      addLog(`Tabela de preços e estoque recebida. SKUs encontrados: ${data.totalProducts}.`, 'info');
      addLog(`Banco de dados atualizado (${data.updated} produtos alterados).`, 'success');
      const syncDate = new Date().toLocaleString('pt-BR');
      addLog(`SINCRONIZAÇÃO CONCLUÍDA! Sucesso: ${data.updated} | Erros: ${data.errors}`, 'success');
      setLastSync(syncDate);
      localStorage.setItem('solidcon_last_sync', syncDate);
    } catch (err) {
      addLog(`Erro na sincronização: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease]">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-base-content mb-1">Integração ERP</h3>
          <p className="text-base-content/60 text-sm m-0">Sincronização de Preços e Estoque com o Solidcon</p>
        </div>
        <button onClick={startSync} disabled={isSyncing} className="btn btn-primary shadow-lg gap-3 px-6 h-12">
          {isSyncing ? (
            <>
              <span className="loading loading-spinner loading-sm"></span> Sincronizando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i> Sincronizar Agora
            </>
          )}
        </button>
      </div>

      <div className="card bg-base-200/50 border border-base-300 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-4 border-b border-base-300 pb-4 mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-lg text-success border border-success/20">
              <i className="fa-solid fa-server" aria-hidden="true"></i>
            </div>
            <div>
              <h4 className="m-0 text-base-content font-bold text-sm">Status da Sincronização</h4>
              <span className="text-sm text-base-content/60">Histórico de comunicação com o ERP</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
              <span className="text-base-content/70 text-sm">Última Sincronização:</span>
              <b className="text-base-content">{lastSync || 'Nunca realizada'}</b>
            </div>
            <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
              <span className="text-base-content/70 text-sm">Campos Atualizados:</span>
              <b className="text-base-content">Preço e Estoque</b>
            </div>
            <div className="flex justify-between p-4 bg-base-100 rounded-xl border border-base-300 shadow-sm">
              <span className="text-base-content/70 text-sm">Gatilho:</span>
              <b className="text-base-content">Manual via Admin</b>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-base-300 bg-base-200 overflow-hidden shadow-inner">
        <div className="p-3 bg-base-300/50 border-b border-base-300 flex items-center gap-3">
          <i className="fa-solid fa-terminal text-base-content/50 text-sm" aria-hidden="true"></i>
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
    </div>
  );
}
