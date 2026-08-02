import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { getSupabase } from '@/lib/pgDb';
import { verifyAdmin, unauthorizedResponse } from '@/lib/auth';

export async function POST(request) {
  const auth = verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // sanitize filename
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    
    let optimizedBuffer = buffer;
    let filename = `${uniqueSuffix}_${nameWithoutExt}.webp`;
    let contentType = 'image/webp';

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Se o arquivo for uma imagem, fazemos a otimização inteligente com sharp
    if (file.type.startsWith('image/')) {
      try {
        if (type === 'cardapio') {
          // Para cardápios: largura travada em 1000px, altura proporcional livre/ilimitada e qualidade 95%
          optimizedBuffer = await sharp(buffer)
            .resize({
              width: 1000,
              withoutEnlargement: true // Não amplia se a imagem original for menor que 1000px
            })
            .webp({ quality: 95, effort: 6 })
            .toBuffer();
        } else {
          let maxSize = 1200;
          let quality = 90;

          if (type === 'product') {
            maxSize = 1200;
            quality = 90;
          } else if (type === 'biolink' || type === 'avatar') {
            maxSize = 800;
            quality = 92;
          }

          optimizedBuffer = await sharp(buffer)
            .resize({
              width: maxSize,
              height: maxSize,
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality })
            .toBuffer();
        }
          
        console.log(`Image optimized successfully (type: ${type}). Original: ${buffer.length} bytes, Optimized: ${optimizedBuffer.length} bytes`);
      } catch (sharpError) {
        console.error('Error optimizing image with sharp, uploading original:', sharpError);
        filename = `${uniqueSuffix}_${originalName}`;
        contentType = file.type;
      }
    } else {
      filename = `${uniqueSuffix}_${originalName}`;
      contentType = file.type;
    }
    
    // Conecta no Supabase
    const supabase = getSupabase();
    
    // Convertemos o Buffer do Node para um Blob nativo para evitar erros de SharedArrayBuffer no Next.js do Vercel
    const uploadBody = new Blob([optimizedBuffer], { type: contentType });

    // Upload do arquivo para o Supabase Storage (bucket 'imagens')
    const { data, error } = await supabase.storage
      .from('imagens')
      .upload(filename, uploadBody, {
        contentType: contentType,
        cacheControl: '31536000, public', // Cache de 1 ano de alta performance
        upsert: true
      });

    if (error) {
      console.error('Error uploading file to Supabase Storage:', error);
      return NextResponse.json({ error: `Erro no upload do storage: ${error.message}` }, { status: 500 });
    }

    // Pega a URL pública
    const { data: urlData } = supabase.storage
      .from('imagens')
      .getPublicUrl(filename);

    const fileUrl = urlData.publicUrl;

    return NextResponse.json({ 
      success: true, 
      message: 'Upload Supabase Storage concluído com sucesso e otimizado',
      url: fileUrl
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Falha no processamento do upload do arquivo.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Nenhuma URL de imagem fornecida.' }, { status: 400 });
    }

    // Extrair o nome do arquivo a partir da URL do Supabase Storage
    const searchString = '/storage/v1/object/public/imagens/';
    const index = url.indexOf(searchString);
    if (index === -1) {
      return NextResponse.json({ success: true, message: 'URL externa ignorada (não apagada do storage)' });
    }

    const filename = url.substring(index + searchString.length);
    
    // Conecta no Supabase
    const supabase = getSupabase();
    
    // Remove do bucket 'imagens'
    const { error } = await supabase.storage
      .from('imagens')
      .remove([filename]);

    if (error) {
      console.error('Error deleting file from Supabase Storage:', error);
      return NextResponse.json({ error: `Erro ao apagar arquivo: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Arquivo apagado do storage com sucesso' });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ error: 'Falha no processamento de exclusão da imagem.' }, { status: 500 });
  }
}
