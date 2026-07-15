const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// 1. Carregar variáveis de ambiente manualmente do .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Erro: Arquivo .env.local não encontrado na raiz!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2].trim();
    // Remover aspas se houver
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local!');
  process.exit(1);
}

console.log('Inicializando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log('Buscando produtos com fotos antigas...');
    // Buscar todos os produtos onde a imagem contenha a URL antiga da Hostinger (/novo/wp-content/uploads/)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, image_url')
      .like('image_url', '%/novo/wp-content/uploads/%');

    if (error) throw error;

    console.log(`Encontrados ${products.length} produtos para migrar.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const oldUrl = prod.image_url;
      console.log(`\n[${i + 1}/${products.length}] Processando: "${prod.title}" (ID: ${prod.id})`);
      console.log(`URL Antiga: ${oldUrl}`);

      try {
        // 1. Extrair nome do arquivo original
        const urlObj = new URL(oldUrl);
        const originalFilename = path.basename(urlObj.pathname);
        const nameWithoutExt = path.parse(originalFilename).name;
        // Limpar nome do arquivo para evitar caracteres especiais problemáticos
        const cleanName = nameWithoutExt
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const newFilename = `${cleanName}.webp`;

        // 2. Download da imagem
        const res = await fetch(oldUrl);
        if (!res.ok) {
          throw new Error(`Falha no download da imagem (HTTP ${res.status} ${res.statusText})`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // 3. Processamento com Sharp (Otimização Premium WebP)
        console.log('Otimizando imagem com Sharp...');
        const optimizedBuffer = await sharp(originalBuffer)
          .resize({
            width: 1400,
            height: 1400,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 82 })
          .toBuffer();

        // 4. Upload para o Supabase Storage
        console.log(`Fazendo upload no Supabase Storage: "${newFilename}"...`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('imagens')
          .upload(newFilename, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // 5. Obter a URL pública final
        const { data: { publicUrl } } = supabase.storage
          .from('imagens')
          .getPublicUrl(newFilename);

        console.log(`Upload OK! Nova URL: ${publicUrl}`);

        // 6. Atualizar o produto no banco de dados
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', prod.id);

        if (updateError) throw updateError;

        console.log(`[OK] Produto ${prod.id} atualizado com sucesso!`);
        successCount++;
      } catch (err) {
        console.error(`[ERRO] Falha ao migrar produto ${prod.id}:`, err.message);
        failCount++;
      }
    }

    console.log('\n======================================');
    console.log('MIGRAÇÃO CONCLUÍDA!');
    console.log(`Sucessos: ${successCount}`);
    console.log(`Falhas: ${failCount}`);
    console.log('======================================');

  } catch (err) {
    console.error('Erro geral durante a execução:', err);
  }
}

run();
