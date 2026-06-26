export const metadata = {
  title: "Política de Privacidade | Antenor e Filhos",
  description: "Entenda como a Antenor e Filhos coleta, utiliza, armazena e protege seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).",
  alternates: {
    canonical: "https://antenorefilhos.com.br/politica-de-privacidade-antenor-e-filhos"
  }
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '10px'
          }}>
            Transparência & LGPD
          </span>
          <h1 style={{ fontSize: '38px', color: 'white', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
            Política de Privacidade
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--primary)', margin: '0 auto' }}></div>
        </div>

        {/* Content */}
        <div className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '20px' }}>
            A Antenor e Filhos valoriza a transparência e o respeito aos seus clientes, colaboradores e parceiros. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos os dados pessoais em nossas operações, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>

          <p style={{ marginBottom: '30px' }}>
            Ao utilizar nossos serviços, seja em nossa loja física, plataformas digitais ou site <a href="http://www.antenorefilhos.com.br/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>www.antenorefilhos.com.br</a>, você concorda com as práticas descritas nesta Política.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            1. DADOS QUE COLETAMOS
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Coletamos dados necessários para oferecer os nossos serviços com qualidade e segurança.
          </p>

          <h4 style={{ color: 'var(--primary)', fontSize: '15px', marginTop: '20px', marginBottom: '10px' }}>
            1.1. Dados fornecidos diretamente pelo usuário
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px', listStyleType: 'square' }}>
            <li>Nome completo</li>
            <li>CPF ou CNPJ</li>
            <li>Endereço completo</li>
            <li>Telefone e WhatsApp</li>
            <li>E-mail</li>
            <li>Dados de pagamento</li>
            <li>Informações sobre pedidos, compras e interações comerciais</li>
          </ul>

          <h4 style={{ color: 'var(--primary)', fontSize: '15px', marginTop: '20px', marginBottom: '10px' }}>
            1.2. Dados coletados automaticamente (quando você usa nosso site ou canais digitais)
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px', listStyleType: 'square' }}>
            <li>Endereço IP</li>
            <li>Dados de dispositivo e navegador</li>
            <li>Cookies e identificadores únicos</li>
            <li>Páginas acessadas, cliques e tempo de navegação</li>
          </ul>

          <h4 style={{ color: 'var(--primary)', fontSize: '15px', marginTop: '20px', marginBottom: '10px' }}>
            1.3. Dados provenientes de terceiros
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '25px', listStyleType: 'square' }}>
            <li>Plataformas de pagamento</li>
            <li>Aplicativos de delivery (como iFood)</li>
            <li>Redes sociais, quando você interage com conteúdos da marca</li>
          </ul>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            2. PARA QUE UTILIZAMOS SEUS DADOS
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Usamos seus dados pessoais para:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '25px', listStyleType: 'square' }}>
            <li>Processar, confirmar e entregar pedidos</li>
            <li>Emitir notas fiscais e comprovantes</li>
            <li>Realizar contato sobre compras, entregas ou suporte</li>
            <li>Enviar informações sobre promoções, novidades e ofertas</li>
            <li>Melhorar sua experiência em nossos canais</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Prevenir fraudes e garantir segurança</li>
            <li>Gerenciar histórico de compras e personalizar atendimento</li>
          </ul>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            3. COMPARTILHAMENTO DE DADOS
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Compartilhamos seus dados somente quando necessário, com:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '15px', listStyleType: 'square' }}>
            <li>Processadores de pagamento</li>
            <li>Serviços de entrega e logística</li>
            <li>Plataformas de atendimento e marketing</li>
            <li>Aplicativos de delivery</li>
            <li>Órgãos públicos, quando exigido por lei</li>
          </ul>
          <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '25px' }}>
            A Antenor e Filhos não vende dados pessoais.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            4. SEGURANÇA E ARMAZENAMENTO
          </h3>
          <p style={{ marginBottom: '25px' }}>
            Adotamos medidas técnicas e administrativas para proteger seus dados contra perda, acesso não autorizado, alteração ou uso indevido. Os dados são armazenados em servidores seguros, com acesso restrito a profissionais autorizados.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            5. DIREITOS DO TITULAR DE DADOS
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Nos termos da LGPD, você tem direito a:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '15px', listStyleType: 'square' }}>
            <li>Confirmar se tratamos seus dados</li>
            <li>Solicitar acesso às informações</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão quando permitido por lei</li>
            <li>Solicitar portabilidade</li>
            <li>Revogar consentimentos</li>
            <li>Obter informações sobre compartilhamento</li>
            <li>Opor-se ao tratamento de dados, quando cabível</li>
          </ul>
          <p style={{ marginBottom: '25px' }}>
            Para exercer seus direitos, entre em contato através do e-mail: <a href="mailto:marketing@antenorefilhos.com.br" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>marketing@antenorefilhos.com.br</a>
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            6. COOKIES
          </h3>
          <p style={{ marginBottom: '15px' }}>
            Utilizamos cookies para melhorar as funcionalidades do site, analisar navegação e desempenho, e personalizar ofertas e comunicações. Você pode escolher desabilitar cookies no seu navegador, porém algumas funções do site podem ficar limitadas.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            7. BASE LEGAL PARA O TRATAMENTO
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Tratamos seus dados com base nas seguintes hipóteses legais:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '25px', listStyleType: 'square' }}>
            <li>Consentimento do titular</li>
            <li>Execução de contrato ou procedimentos preliminares</li>
            <li>Cumprimento de obrigação legal ou regulatória</li>
            <li>Legítimo interesse da empresa</li>
            <li>Proteção ao crédito</li>
          </ul>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            8. TEMPO DE RETENÇÃO
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Os dados são mantidos enquanto for necessário para finalizar a relação comercial, houver obrigação legal de armazenamento, ou para permitir defesa em processos administrativos, fiscais ou judiciais. Após o prazo, os dados são eliminados com segurança.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            9. ALTERAÇÕES NESTA POLÍTICA
          </h3>
          <p style={{ marginBottom: '25px' }}>
            Esta Política poderá ser atualizada para atender a requisitos legais ou melhorias internas. A versão atualizada estará sempre disponível em nosso site.
          </p>

          <h3 style={{ color: 'white', fontSize: '18px', marginTop: '40px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            10. ENCARREGADO DE DADOS (DPO)
          </h3>
          <p style={{ marginBottom: '10px' }}>
            Qualquer dúvida ou solicitação relacionada à proteção de dados pode ser encaminhada diretamente ao nosso Encarregado de Dados (DPO):
          </p>
          <p style={{ fontWeight: 'bold', color: 'white' }}>
            E-mail: <a href="mailto:marketing@antenorefilhos.com.br" style={{ color: 'var(--primary)' }}>marketing@antenorefilhos.com.br</a>
          </p>
        </div>

      </div>
    </div>
  );
}
