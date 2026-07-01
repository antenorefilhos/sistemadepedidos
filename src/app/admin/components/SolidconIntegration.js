'use client';

import { useState, useRef, useEffect } from 'react';

export default function SolidconIntegration({ password }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [config, setConfig] = useState({
    apiUrl: 'https://api.solidcon.com.br/v1',
    token: '************************'
  });
  
  const terminalEndRef = useRef(null);

  // Auto-scroll the terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          addLog(`SINCRONIZAÇÃO CONCLUÍDA! Sucesso: ${data.updated} | Erros: ${data.errors}`, 'success');
          setLastSync(new Date().toLocaleString('pt-BR'));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.3s ease' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', margin: '0 0 5px 0', fontFamily: 'var(--font-serif)', fontSize: '24px' }}>Integração ERP Solidcon</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Sincronização de Preços e Estoque em tempo real</p>
        </div>
        <button 
          onClick={startSync}
          disabled={isSyncing}
          className="btn btn-primary"
          style={{ 
            padding: '12px 24px', 
            fontSize: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            opacity: isSyncing ? 0.7 : 1,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(171,144,112,0.3)'
          }}
        >
          {isSyncing ? (
            <><i className="fa-solid fa-arrows-rotate fa-spin"></i> Sincronizando...</>
          ) : (
            <><i className="fa-solid fa-cloud-arrow-down"></i> Sincronizar Agora</>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Configurações API */}
        <div className="glass" style={{ padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--primary)' }}>
              <i className="fa-solid fa-network-wired"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>Credenciais da API</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configuração de acesso ao Solidcon</span>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">URL do Endpoint (Base)</label>
            <input 
              type="text" 
              className="form-control" 
              value={config.apiUrl}
              onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Token de Acesso / API Key</label>
            <input 
              type="password" 
              className="form-control" 
              value={config.token}
              onChange={(e) => setConfig({...config, token: e.target.value})}
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          
          <div style={{ backgroundColor: 'rgba(171, 144, 112, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid var(--primary-light)', fontSize: '12px', color: 'var(--primary)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <i className="fa-solid fa-circle-info" style={{ marginTop: '2px' }}></i>
            <span>Estes campos estão simulados para a interface. No ambiente de produção, as chaves reais deverão ser injetadas no código backend via <code>.env</code> por segurança.</span>
          </div>
        </div>

        {/* Status Panel */}
        <div className="glass" style={{ padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--success)' }}>
              <i className="fa-solid fa-server"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>Status da Sincronização</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Histórico do painel</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Última Sincronização:</span>
              <b style={{ color: 'white' }}>{lastSync || 'Nunca realizada'}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Campos Atualizados:</span>
              <b style={{ color: 'white' }}>Preço e Estoque</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Gatilho:</span>
              <b style={{ color: 'white' }}>Manual via Admin</b>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Visualizador de Logs */}
      <div style={{ 
        backgroundColor: '#0a0a0c', 
        borderRadius: '12px', 
        border: '1px solid #1f2229',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '10px 15px', backgroundColor: '#13151a', borderBottom: '1px solid #1f2229', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-terminal" style={{ color: 'var(--text-muted)', fontSize: '14px' }}></i>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}>Terminal do Backend (Logs)</span>
        </div>
        
        <div style={{ padding: '20px', minHeight: '250px', maxHeight: '350px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}>
          {logs.length === 0 ? (
            <span style={{ color: '#444' }}>&gt; Aguardando comando de sincronização...</span>
          ) : (
            logs.map((log, idx) => {
              let color = '#a3a3a3';
              if (log.type === 'success') color = '#4ade80';
              if (log.type === 'warning') color = '#facc15';
              if (log.type === 'error') color = '#ef4444';
              
              return (
                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '8px', animation: 'fadeIn 0.3s ease' }}>
                  <span style={{ color: '#555', userSelect: 'none' }}>[{log.time}]</span>
                  <span style={{ color }}>{log.msg}</span>
                </div>
              );
            })
          )}
          {isSyncing && (
            <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
              <span style={{ color: '#555' }}>[{new Date().toLocaleTimeString('pt-BR')}]</span>
              <span style={{ color: 'var(--primary)' }} className="pulsing-text">_</span>
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
