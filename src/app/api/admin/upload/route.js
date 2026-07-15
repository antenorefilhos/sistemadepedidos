import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { getSupabase } from '@/lib/pgDb';

export async function POST(request) {
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

    // Se o arquivo for uma imagem, fazemos a otimização com a biblioteca sharp
    if (file.type.startsWith('image/')) {
      try {
        const maxSize = type === 'product' ? 800 : 1400;
        optimizedBuffer = await sharp(buffer)
          .resize({
            width: maxSize,
            height: maxSize,
            fit: 'inside',
            withoutEnlargement: true // Não amplia se a imagem for menor
          })
          .webp({ quality: 82 }) // Qualidade premium otimizada sem perda perceptível
          .toBuffer();
          
        console.log(`Image optimized successfully (max: ${maxSize}px). Original: ${buffer.length} bytes, Optimized: ${optimizedBuffer.length} bytes`);
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
    
    // Upload do arquivo para o Supabase Storage (bucket 'imagens')
    const { data, error } = await supabase.storage
      .from('imagens')
      .upload(filename, optimizedBuffer, {
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
