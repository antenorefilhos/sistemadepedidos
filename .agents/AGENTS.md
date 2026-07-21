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
