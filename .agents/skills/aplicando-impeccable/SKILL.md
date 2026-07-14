---
name: aplicando-impeccable
description: Inicia o framework Impeccable de auditoria de qualidade. Use quando o usuário digitar /impeccable, /inpeccable, ou pedir para auditar, adaptar ou otimizar o sistema com máximo rigor e controle de consistência.
---
# Impeccable Audit Framework

O framework "Impeccable" é uma diretriz de qualidade extrema para garantir que nenhuma alteração quebre a consistência do Design System, cause regressões visuais (como zoom, desalinhamento) ou introduza débitos técnicos.

## Quando usar esta skill
- Quando o usuário usar os gatilhos `/impeccable`, `/inpeccable`, `$impeccable`
- Quando o usuário pedir para `impeccable audit`, `impeccable adapt`, ou `impeccable optimize`.

## Fluxo de Trabalho (Workflow e Hooks)
Sempre que ativada, a skill segue estes 4 "hooks" (etapas obrigatórias). O Agente DEVE delegar tarefas complexas para **subagentes** quando a base de código for grande.

### 1. Hook: Clarify (Esclarecimento)
- Pare e mapeie as intenções. Se o usuário apontar um erro ("a tela tá com zoom"), não saia adivinhando. Verifique o CSS, o Layout e as últimas alterações (`git log`).

### 2. Hook: Adapt (Adaptação Consistente)
- NUNCA introduza abstrações que fujam da base do projeto.
- Verifique se a solução respeita variáveis de tema, type scales nativas e os princípios do `AGENTS.md`.

### 3. Hook: Optimize (Otimização)
- A solução funciona, mas é a mais leve e nativa possível?
- Há refatorações pendentes ou código morto na implementação? Limpe-os.

### 4. Hook: Audit (Auditoria Contínua)
- Revise toda a tela/arquivo afetado.
- Delegue para um `browser_subagent` a tarefa de verificar a renderização visual real, se necessário.
- Declare o sistema como "Impecável" apenas quando 100% dos critérios estiverem atendidos.

## Instruções de Delegação
- Para varreduras amplas no sistema, crie um subagente usando a tool apropriada com o prompt de auditoria.
- Exija que o subagente retorne um relatório antes de você modificar arquivos críticos.
