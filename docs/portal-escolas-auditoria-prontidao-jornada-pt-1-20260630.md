# PORTAL-ESCOLAS-AUDITORIA-PRONTIDAO-JORNADA-PT-1

## Veredicto

O Portal das Escolas está no caminho certo enquanto arquitetura multidesporto isolada, mas ainda não está pronto para ser ligado ao Jornada.pt como produto operacional para organizações reais.

O que está sólido é a espinha dorsal conceptual e técnica: autenticação, permissões de leitura por âmbito, entidade/contexto/modalidade/competição, estrutura/eventos/resultados/ranking e primeira escrita real de resultados.

O que ainda falta é a camada operacional de criação e governação: criação real por utilizador autenticado, auditoria automática de todas as escritas, fluxos de gatekeeper, criação de conteúdos editoriais, publicação controlada e integração segura no ecossistema Jornada.pt.

## Núcleo já sólido

- O Portal das Escolas está isolado em `/portal-escolas` e usa tabelas com prefixo `portal_`.
- A autenticação por Supabase Auth/magic link já existe em `/portal-escolas/login` e `/portal-escolas/auth/callback`.
- O acesso protegido usa `portal_users` e `portal_permissions`.
- A leitura já respeita âmbito de entidade/contexto/competição.
- O modelo multidesporto formal já existe: modalidade, competição, formato, estrutura/eventos, participantes, resultados e ranking.
- A rota `/portal-escolas/jogos` foi reinterpretada como Eventos, mantendo compatibilidade.
- A rota `/portal-escolas/jornadas` foi reinterpretada como Estrutura competitiva, mantendo compatibilidade.
- A inserção/edição de resultados por evento já funciona no modelo novo.
- O ranking demo já é recalculado automaticamente a partir de `portal_result_entries`.
- A navegação Painel → Competições → Detalhe → Eventos/Resultados/Ranking já está coerente para o demo.

## Falta estrutural antes de ligação real ao Jornada.pt

### 1. Auditoria automática de escritas

Existe `portal_audit_events`, mas as escritas reais ainda não são registadas automaticamente. Isto é uma falha estrutural para um portal com gatekeeper.

A primeira escrita real validada é `public.portal_upsert_result_entry(...)`; esta deve passar a registar evento de auditoria para cada criação/edição de resultado.

### 2. Criação de modalidades por utilizador autenticado

Existe catálogo e modalidade formal demo, mas ainda não existe fluxo real para um membro autorizado criar/ativar uma modalidade dentro da sua entidade/contexto.

### 3. Criação de competições

Existe leitura e detalhe da competição demo. Falta função/UI controlada para criar competição associada a entidade, contexto e modalidade formal.

### 4. Criação de estrutura competitiva e eventos

Já existem estruturas/eventos demo. Falta geração/criação real a partir de formato + estrutura + participantes.

### 5. Gestão de participantes

A leitura existe. Falta criação/associação real de participantes a modalidade/competição/evento, com permissões e auditoria.

### 6. Conteúdos editoriais do Portal das Escolas

`portal_content_submissions` existe e há leitura. Falta submissão real por utilizador autenticado, com estados, revisão e aprovação.

### 7. Gatekeeper

Já há colunas e permissões conceptuais para revisão/aprovação de conteúdos, mas ainda não existe fluxo operacional de gatekeeper:

- fila de submissões;
- aprovar/rejeitar/pedir alterações;
- impedir auto-aprovação;
- registo de auditoria;
- publicação/ligação ao Jornada.pt.

### 8. Ligação ao Jornada.pt

Ainda não deve ser feita. Primeiro é necessário estabilizar:

- auditoria de escritas;
- criação real no Portal;
- gatekeeper;
- estados publicáveis;
- mapeamento de dados aprovados para zonas Jornada.pt.

## Sequência recomendada de fases estruturais

1. Auditoria automática da escrita de resultados existente.
2. Criação/ativação de modalidade por utilizador autorizado.
3. Criação de competição associada à modalidade e contexto.
4. Gestão/criação de participantes.
5. Criação de estrutura competitiva.
6. Criação/geração de eventos.
7. Escrita de resultados generalizada por formato/evento, não apenas demo head-to-head.
8. Submissão de conteúdos editoriais pelo Portal.
9. Gatekeeper: revisão/aprovação/rejeição de conteúdos e alterações relevantes.
10. Publicação/ponte para Jornada.pt com origem aprovada.
11. Acertos visuais finais.

## Próxima fase mínima recomendada

`PORTAL-ESCOLAS-AUDITORIA-ESCRITAS-RESULTADOS-1`

Objetivo: tornar a escrita já existente de resultados auditável, registando cada criação/edição em `portal_audit_events`.

Motivo: antes de abrir mais escritas — modalidades, competições, eventos, conteúdos — a base deve garantir rastreabilidade. Isto cria o padrão de governação para as fases seguintes.
