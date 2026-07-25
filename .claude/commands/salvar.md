---
description: Salva a sessão na vault do Obsidian (log + versionamento + walkthrough) e gera o commit semântico
argument-hint: [descrição curta da sessão]
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Read, Edit, Write, Glob
---

# /salvar — Persistir a sessão na vault do Obsidian + commit semântico

Metodologia Zettelkasten do projeto Antenor & Filhos. Vault oficial:

`D:\NOVA ORGANIZAÇÃO\PROJETOS\Obsidian\Antenor e Filhos\Sistema de Pedidos (antenorefilhos.com.br)\`

Ao acionar este comando, execute os passos abaixo. **Tudo em PT-BR.**

## 1. Investigar o trabalho da sessão
- Rode `git status --short` e `git log --oneline -10` para levantar os arquivos alterados e os commits desta sessão.
- Antes de escrever, **leia o topo** de `versionamento.md` e `walkthrough.md` para descobrir a última versão e o próximo número de seção — nunca sobrescreva o que já está lá (o Gemini/Antigravity também escreve nessa vault).
- Determine o incremento semântico: **patch** (x.y.**Z**) para correções, **minor** (x.**Y**.0) para features, **major** para breaking changes.

## 2. Registrar na vault (3 arquivos)
- **`versionamento.md`**: adicione um novo bloco `## [vX.Y.Z] — YYYY-MM-DD` **no topo** (ordem cronológica reversa, logo após a introdução), com subseções `### Adicionado` / `### Corrigido` / `### Modificado` conforme o caso e uma subseção `### Commits` listando os hashes curtos e as mensagens.
- **`walkthrough.md`**: adicione uma nova **seção numerada no topo** (`## N. Título (vX.Y.Z)`), explicando tecnicamente o que mudou, por quê, e **como foi validado**.
- **`logs/YYYY-MM-DD-descricao.md`**: crie um log de sessão (nome em kebab-case) com frontmatter YAML completo (`title`, `tags`, `created`, `updated`, `status`, `type: log`) e wikilinks `[[versionamento]]` / `[[walkthrough]]` e para logs relacionados.

## 3. Regras Zettelkasten
- Datas sempre **absolutas** (converta "hoje" para YYYY-MM-DD).
- Correlacione cada versão semântica com os commits Git correspondentes.
- **Não invente trabalho**: descreva apenas o que foi de fato alterado e testado nesta sessão.
- Nomes de arquivo em kebab-case; frontmatter YAML obrigatório em toda nota nova.

## 4. Commit semântico
- Apresente (ou aplique, se o usuário pedir) a mensagem de commit em PT-BR no padrão: `feat:` / `fix:` / `docs:` / `style:` / `refactor:` / `perf:` / `test:` / `chore:`.

Contexto extra opcional passado pelo usuário: $ARGUMENTS
