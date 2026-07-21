# Diretrizes Gerais dos Agentes

- **Idioma**: TUDO SEMPRE EM PT-BR

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

- This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.
- Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:obsidian-rules -->
# Diretrizes e Regras do Projeto Antenor & Filhos (Sistema de Pedidos)

- **Idioma**: TUDO SEMPRE EM PT-BR.
- **Modelo de Memória**: Metodologia `claude-code-memory-setup` (Obsidian Zettelkasten + Persistência de Sessões).

---

## 📁 Caminhos Oficiais do Projeto
- **Raiz de Projetos**: `D:\NOVA ORGANIZAÇÃO\PROJETOS\`
- **Código Fonte deste Projeto**: `D:\NOVA ORGANIZAÇÃO\PROJETOS\ANTENOR E FILHOS\`
- **Vault do Obsidian deste Projeto**: `D:\NOVA ORGANIZAÇÃO\PROJETOS\Obsidian\Antenor e Filhos\Sistema de Pedidos (antenorefilhos.com.br)\`

---

## 🧠 Estrutura da Vault Obsidian (Zettelkasten)

```
D:\NOVA ORGANIZAÇÃO\PROJETOS\Obsidian\Antenor e Filhos\Sistema de Pedidos (antenorefilhos.com.br)\
├── AGENTS.md                          # Instruções mestre do agente AI
├── architecture/                      # Arquitetura, decisões, visão geral, design system
│   ├── visao-geral-do-sistema.md
│   ├── design-system.md
│   └── deploy-e-hospedagem.md
├── pipeline/                          # Fluxos de dados, APIs, ERP
│   └── sincronizacao-erp.md
├── data/                              # Schemas, modelo de dados, banco
│   └── banco-de-dados-e-tabelas.md
├── features/                          # Módulos funcionais
│   ├── links-de-indicacao-e-vendedores.md
│   └── conteudo-institucional.md
├── logs/                              # Session logs (YYYY-MM-DD-descricao.md)
├── versionamento.md                   # Log de versão semântica + commits
└── walkthrough.md                     # Walkthroughs acumulados das releases
```

---

## ⚡ Comandos de Sessão (Antigravity IDE)

- **`/retomar`** ou **`/resume`**: Lê os 2 últimos logs de sessão em `logs/`, `architecture/visao-geral-do-sistema.md` e `versionamento.md` para retomar o contexto com zero amnésia.
- **`/salvar`** ou **`/save`**: Registra o log de sessão em `logs/YYYY-MM-DD-descricao.md`, atualiza `versionamento.md` e `walkthrough.md` com a nova versão semântica e gera a mensagem de commit semântica.

---

## 📐 Regras Zettelkasten de Documentação
- Wikilinks `[[nome-da-nota]]` ou `[[pasta/nome-da-nota]]` para conexões no graph view do Obsidian.
- Frontmatter YAML obrigatório em toda nota (`title`, `tags`, `created`, `updated`, `status`, `type`).
- Nomes de arquivo em `kebab-case`.

---

## 📌 Regras de Commit Git
- Seguir o padrão em PT-BR: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`

<!-- END:obsidian-rules -->

<!-- BEGIN:claude-rules -->
- Regras Operacionais do Agente

## 1. Pense Antes de Agir

- Antes de escrever qualquer código, formule um plano claro e apresente-o.
- Se o pedido for vago ou ambíguo, **pergunte** para esclarecer — nunca assuma.
- Se a abordagem sugerida for complexa, proponha uma alternativa mais simples antes de executar.

## 2. Simplicidade Acima de Tudo

- Implemente **apenas** o que foi explicitamente solicitado.
- Proibido adicionar features, abstrações ou melhorias fora do escopo pedido.
- Prefira a solução mais direta e enxuta que resolve o problema.

## 3. Mudanças Cirúrgicas

- Altere **somente** o trecho de código diretamente relacionado à tarefa.
- Não refatore, renomeie ou reorganize nada que não foi pedido.
- Preserve toda a arquitetura e lógica existente ao redor da mudança.

## 4. Execução Baseada em Metas

- Antes de executar, defina critérios claros de sucesso para a tarefa.
- Após entregar, revise o próprio resultado contra esses critérios.
- Se o resultado não atingir os critérios, reitere automaticamente até atingi-los.
- Não encerre a tarefa enquanto os critérios não forem satisfeitos.
<!-- END:claude-rules -->

<!-- BEGIN:commit-rules -->
- Descreva a descrição/resumo do commit em pt-br
- Descreva as mudanças do commit em pt-br
- Coloque no formato padrão de commit:
  feat: Nova funcionalidade
  fix: Correção de bug
  docs: Documentação
  style: Estilo
  refactor: Refatoração
  perf: Performance
  test: Testes
  chore: Outros

<!-- END:commit-rules -->

<!-- BEGIN:versioning-rules -->
- Documente cada melhoria, release e incremento de versão no arquivo `versionamento.md` na vault do Obsidian.
- Correlacione as versões semânticas (ex: v1.5.0) com a lista de commits Git correspondentes e melhorias explicadas no `walkthrough.md`.
- Mantenha o histórico estruturado em ordem cronológica reversa (a versão mais recente sempre no topo).
<!-- END:versioning-rules -->