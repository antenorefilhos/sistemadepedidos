const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente manualmente
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^([^#=]+)=([^#\r]+)/);
    if (m) {
      process.env[m[1].trim()] = m[2].trim();
    }
  });
}

const { getSupabase } = require('../src/lib/pgDb.js');

async function importBiolinks() {
  const supabase = getSupabase();
  const sqlPath = path.join(__dirname, '..', 'bio-links', 'u607641063_links.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Erro: Arquivo u607641063_links.sql não encontrado.');
    return;
  }

  console.log('Lendo dump sql do biolink...');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // 1. Extrair registros de links (tabela `links`)
  // Formato: INSERT INTO `links` (`link_id`, ..., `url`, ..., `settings`, ...) VALUES (2, ..., 'boutique', ..., '{...}', ...)
  // Mapeamento local: link_id 2 = boutique, link_id 4 = mercado, link_id 5 = vinhos
  const biolinksToInsert = [
    {
      id: 2,
      slug: 'boutique',
      title: 'Antenor e Filhos Boutique de Carnes Nobres',
      description: 'Cortes premium e carnes exóticas em Itaipava, Petrópolis.',
      background_color_one: '#0F0D09',
      background_color_two: '#7F6346',
      text_color: '#ffffff',
      favicon_url: '/uploads/avatars/d16937e571451a66fe20d405535fdbc7.png'
    },
    {
      id: 4,
      slug: 'mercado',
      title: 'Antenor e Filhos Mercado',
      description: 'Qualidade selecionada e delicatessen em Pedro do Rio, Petrópolis.',
      background_color_one: '#0F0D09',
      background_color_two: '#4E001B',
      text_color: '#ffffff',
      favicon_url: '/uploads/avatars/6d020751d96205b57c41e9a4774fafa6.png'
    }
  ];

  console.log('Inserindo perfis principais de biolinks...');
  for (const link of biolinksToInsert) {
    const { error } = await supabase.from('biolinks').upsert(link, { onConflict: 'slug' });
    if (error) {
      console.error(`Erro ao inserir biolink ${link.slug}:`, error.message);
    } else {
      console.log(`Biolink "${link.slug}" importado com sucesso!`);
    }
  }

  // 2. Extrair blocos (tabela `biolinks_blocks`)
  // Formato: INSERT INTO `biolinks_blocks` (`biolink_block_id`, `user_id`, `link_id`, `type`, `location_url`, `clicks`, `settings`, `order`, ...)
  // Vamos buscar as linhas de inserção
  console.log('Parseando e extraindo blocos do dump...');
  const blockInsertsPattern = /INSERT INTO `biolinks_blocks` \([^)]+\) VALUES\s*([\s\S]+?);/g;
  let match;
  const blocksToInsert = [];

  // Mapeamento simples de parse de valores sql
  // Exemplo: (4, 1, 2, 'link', 'url', 370, '{"name":"..."}', 10, ...)
  while ((match = blockInsertsPattern.exec(sqlContent)) !== null) {
    const valuesPart = match[1];
    
    // Split por registros ( ), ( )
    const rows = valuesPart.split(/\),\s*\(/);
    for (let row of rows) {
      // Limpar parênteses das pontas
      row = row.replace(/^\s*\(/, '').replace(/\)\s*$/, '');
      
      // Parsear colunas considerando aspas
      const columns = [];
      let currentVal = '';
      let insideQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if ((char === "'" || char === '"') && row[i - 1] !== '\\') {
          if (!insideQuotes) {
            insideQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            insideQuotes = false;
          } else {
            currentVal += char;
          }
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      columns.push(currentVal.trim());

      // Mapeamento dos campos do dump
      // (`biolink_block_id`, `user_id`, `link_id`, `type`, `location_url`, `clicks`, `settings`, `order`, `start_date`, `end_date`, `is_enabled`, `datetime`, `last_datetime`)
      const blockId = parseInt(columns[0]);
      const linkId = parseInt(columns[2]);
      const type = columns[3].replace(/['"]/g, '');
      let locationUrl = columns[4].replace(/['"]/g, '');
      if (locationUrl === 'NULL' || locationUrl === 'null') locationUrl = null;
      const clicks = parseInt(columns[5]) || 0;
      
      // Parsear settings JSON string
      let settingsStr = columns[6];
      // Desescapar aspas
      if (settingsStr.startsWith("'") && settingsStr.endsWith("'")) {
        settingsStr = settingsStr.slice(1, -1);
      }
      settingsStr = settingsStr.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      
      let settings = {};
      try {
        settings = JSON.parse(settingsStr);
      } catch (e) {
        // Fallback se falhar
        settings = { raw: settingsStr };
      }

      const order = parseInt(columns[7]) || 0;
      const isEnabled = columns[10] === '1';

      // Filtrar apenas para nossos biolinks válidos (link_id 2 = boutique, link_id 4 = mercado)
      if (linkId === 2 || linkId === 4) {
        // Se a imagem no settings contiver o caminho antigo, atualizamos para o novo caminho no Next.js
        if (settings.image && !settings.image.startsWith('/uploads/')) {
          settings.image = `/uploads/avatars/${settings.image}`;
        }
        
        blocksToInsert.push({
          id: blockId,
          biolink_id: linkId,
          type: type,
          location_url: locationUrl,
          clicks: clicks,
          settings: settings,
          sort_order: order,
          is_enabled: isEnabled
        });
      }
    }
  }

  console.log(`Total de ${blocksToInsert.length} blocos identificados para boutique/mercado. Inserindo no Supabase...`);
  
  const { error: deleteErr } = await supabase.from('biolink_blocks').delete().gt('id', 0);
  if (deleteErr) console.warn('Aviso ao limpar blocos antigos:', deleteErr.message);

  for (const block of blocksToInsert) {
    const { error } = await supabase.from('biolink_blocks').upsert(block);
    if (error) {
      console.error(`Erro ao inserir bloco #${block.id}:`, error.message);
    }
  }

  console.log('Importação de Biolinks e Blocos concluída com sucesso!');
}

importBiolinks();
