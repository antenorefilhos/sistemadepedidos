const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Rotina de Sincronização Automática em Segundo Plano (A cada 6 horas)
      // Executa apenas em produção para não travar o desenvolvimento local
      if (!dev) {
        const SIX_HOURS = 6 * 60 * 60 * 1000;
        console.log('> Sincronizador Solidcon: Rotina de segundo plano agendada para rodar a cada 6 horas.');
        
        // Executa a primeira vez após 5 minutos do boot do servidor
        setTimeout(runBackgroundSync, 5 * 60 * 1000);
        
        // Agenda as próximas execuções
        setInterval(runBackgroundSync, SIX_HOURS);
      }
    });
});

async function runBackgroundSync() {
  console.log('[Solidcon Sync] Iniciando sincronização automática de preços e estoques...');
  try {
    const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
    // Faz a chamada interna segura para o endpoint da API
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/admin/solidcon?auth=${encodeURIComponent(adminPass)}`, {
      method: 'POST'
    });
    const result = await response.json();
    console.log('[Solidcon Sync] Sincronização automática finalizada:', result);
  } catch (err) {
    console.error('[Solidcon Sync] Erro na sincronização automática:', err);
  }
}
