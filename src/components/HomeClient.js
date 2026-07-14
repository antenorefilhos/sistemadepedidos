'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Image from 'next/image';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function HomeClient() {
  const parallaxRef = useRef(null);
  
  // Refs para as camadas do parallax
  const carneRef = useRef(null);
  const azeiteRef = useRef(null);
  const alhoRef = useRef(null);
  const salRef = useRef(null);
  const pimentaRef = useRef(null);
  const sementes1Ref = useRef(null);
  const sementes2Ref = useRef(null);
  const textoRef = useRef(null);

  useGSAP(() => {
    // Timeline que dispara quando o bloco entra na tela (estilo do site antigo)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: parallaxRef.current,
        start: "top 70%", // Dispara quando o topo da seção atinge 70% da tela
      }
    });

    // Animação de entrada copiando exatamente a lógica CSS antiga (.in-view)
    tl.to(carneRef.current, { left: '59%', opacity: 1, duration: 1.5, ease: "power2.inOut" }, 0)
      .to(azeiteRef.current, { left: '91%', opacity: 1, duration: 1, ease: "power2.inOut" }, 1)
      .to(alhoRef.current, { opacity: 1, duration: 1, ease: "power2.inOut" }, 1.3)
      .to(salRef.current, { left: '23%', opacity: 1, duration: 1, ease: "power2.inOut" }, 2)
      .to(pimentaRef.current, { left: '14%', opacity: 1, duration: 1, ease: "power2.inOut" }, 2)
      .to(sementes1Ref.current, { opacity: 1, duration: 1, ease: "power2.inOut" }, 2.5)
      .to(sementes2Ref.current, { opacity: 1, duration: 1, ease: "power2.inOut" }, 2.5)
      .fromTo(textoRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, 1.5);

  }, { scope: parallaxRef });

  return (
    <div className="bg-[var(--color-charcoal)] text-white w-full overflow-hidden">
      
      {/* Seção 1: GSAP Parallax Storytelling */}
      <section ref={parallaxRef} className="relative w-full py-20 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Container que mantém a proporção exata do site antigo */}
        <div className="relative w-[90%] md:w-[700px] lg:w-[900px] xl:w-[1000px] mx-auto pt-20 pb-10">
          
          {/* Tábua: O elemento base (relative) */}
          <img 
            src="/parallax/tabua.png" 
            alt="Tábua" 
            className="relative w-[95%] z-10 mx-auto block"
          />

          {/* Elementos com posicionamento absoluto e translate(-50%, -50%) */}
          
          <img 
            ref={carneRef} 
            src="/parallax/carne.png" 
            alt="Carne" 
            className="absolute top-[55%] z-40 w-[60%] opacity-0"
            style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
          />
          
          <img 
            ref={azeiteRef} 
            src="/parallax/azeite.png" 
            alt="Azeite" 
            className="absolute top-[27%] z-40 w-[37%] opacity-0"
            style={{ left: '100%', transform: 'translate(-50%, -50%)' }}
          />

          <img 
            ref={alhoRef} 
            src="/parallax/alho.png" 
            alt="Alho" 
            className="absolute top-[23%] z-20 w-[18%] opacity-0"
            style={{ left: '71%', transform: 'translate(-50%, -50%)' }}
          />

          <img 
            ref={salRef} 
            src="/parallax/sal.png" 
            alt="Sal Grosso" 
            className="absolute top-[83%] z-30 w-[26%] opacity-0"
            style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
          />

          <img 
            ref={pimentaRef} 
            src="/parallax/pimenta.png" 
            alt="Pimenta" 
            className="absolute top-[66%] z-20 w-[30%] opacity-0"
            style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
          />

          <img 
            ref={sementes1Ref} 
            src="/parallax/sementes1.png" 
            alt="Sementes" 
            className="absolute top-[53%] z-10 w-[22%] opacity-0 mix-blend-multiply"
            style={{ left: '-3.5%', transform: 'translate(-50%, -50%)' }}
          />

          <img 
            ref={sementes2Ref} 
            src="/parallax/sementes2.png" 
            alt="Sementes" 
            className="absolute top-[74%] z-20 w-[18%] opacity-0 mix-blend-multiply"
            style={{ left: '70%', transform: 'translate(-50%, -50%)' }}
          />

        </div>

        {/* Tipografia Dramática */}
        <div ref={textoRef} className="relative z-50 text-center mt-[-6vw] pt-10 pb-12 font-sans tracking-[10px] text-2xl md:text-3xl lg:text-4xl opacity-0">
          CORTES<br/>
          <span className="font-serif text-[15.8vw] md:text-[8rem] lg:text-[10rem] leading-none text-[#e3cfaf] tracking-normal block relative -top-6 md:-top-12">
            selecionados
          </span>
          <span className="relative -top-4 md:-top-10">COM ALTA QUALIDADE</span>
        </div>
      </section>

      {/* Seção 2: Frentes de Excelência (Layout Limpo Top-Tier) */}
      <section className="relative w-full py-[10rem] bg-[#1a1819] z-20 border-t border-white/5">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-[var(--color-gold)] mb-4">Nossas Frentes</h2>
            <p className="text-[var(--color-muted)] max-w-2xl mx-auto text-lg">Três experiências distintas, guiadas por um único princípio: a qualidade inegociável.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-10 rounded-xl flex flex-col items-center text-center group">
              <h3 className="font-serif text-3xl mb-4 group-hover:text-[var(--color-gold)] transition-colors">Boutique de Carnes</h3>
              <p className="text-[var(--color-muted)] mb-8 flex-1">Cortes premium britânicos, marmorização impecável do Wagyu e exóticas exclusivas.</p>
              <Link href="/boutique" className="btn-gold w-full text-sm text-center">Fazer Pedido</Link>
            </div>

            <div className="glass-panel p-10 rounded-xl flex flex-col items-center text-center group">
              <h3 className="font-serif text-3xl mb-4 group-hover:text-[var(--color-wine)] transition-colors">Adega & Deli</h3>
              <p className="text-[var(--color-muted)] mb-8 flex-1">Rótulos garimpados das melhores safras mundiais, harmonizando com nossos queijos finos.</p>
              <Link href="/adega" className="btn-wine w-full text-sm text-center">Explorar Adega</Link>
            </div>

            <div className="glass-panel p-10 rounded-xl flex flex-col items-center text-center group">
              <h3 className="font-serif text-3xl mb-4 group-hover:text-[var(--color-gold)] transition-colors">Restaurante & Brasa</h3>
              <p className="text-[var(--color-muted)] mb-8 flex-1">Permita que nossos mestres churrasqueiros transformem nossos cortes em obras-primas.</p>
              <a href="https://wa.me/552422221482" target="_blank" rel="noopener noreferrer" className="btn-outline w-full text-sm text-center border border-[var(--color-gold)] text-[var(--color-gold)] py-3 px-6 hover:bg-[var(--color-gold)] hover:text-black transition-colors">Reservar Mesa</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
