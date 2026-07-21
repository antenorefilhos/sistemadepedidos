'use client';

import dynamic from 'next/dynamic';

const DefaultEditor = dynamic(() => import('react-simple-wysiwyg').then((mod) => mod.DefaultEditor), {
  ssr: false,
});

// Wrapper único do react-simple-wysiwyg. Resolve a divergência de import (default vs named
// export DefaultEditor para o mesmo pacote) e centraliza o CSS de tema em globals.css
// (seletor .admin-body .rsw-editor) em vez de <style> inline duplicado/ausente por arquivo.
export default function WysiwygField({ value, onChange, height = '200px' }) {
  return (
    <div className="rsw-field-wrapper" style={{ '--rsw-height': height }}>
      <DefaultEditor value={value || ''} onChange={onChange} />
    </div>
  );
}
