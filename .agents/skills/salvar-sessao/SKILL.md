---
name: salvar-sessao
description: Registra e salva a sessão de desenvolvimento na Vault do Obsidian (logs/, versionamento.md e walkthrough.md) e gera a mensagem de commit semântica Git em PT-BR. Use quando o usuário digitar /salvar, /save ou pedir para salvar a sessão.
---

# Skill: Salvar Sessão de Desenvolvimento (Obsidian Zettelkasten + Git)

Quando este comando/skill for acionado:

1. **Investigar o Trabalho Concluído**:
   - Analisar o histórico da sessão e arquivos modificados no Git (`git status --short`).

2. **Registrar no Obsidian Vault** (`D:\NOVA ORGANIZAÇÃO\PROJETOS\Obsidian\Antenor e Filhos\Sistema de Pedidos (antenorefilhos.com.br)\`):
   - **`versionamento.md`**: Adicionar o novo bloco de versão semântica (ex: `## [vX.Y.Z] — YYYY-MM-DD`) no topo do arquivo.
   - **`walkthrough.md`**: Adicionar a nova seção numerada explicando tecnicamente o que foi alterado e testado.
   - **`logs/YYYY-MM-DD-descricao.md`**: Criar uma nova nota de log de sessão Zettelkasten com frontmatter YAML completo.

3. **Gerar Mensagem de Commit Git**:
   - Apresentar o comando `git commit` semântico em PT-BR com o padrão (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`).
