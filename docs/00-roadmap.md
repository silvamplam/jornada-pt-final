# Jornada.pt - Roadmap de produto

O Jornada.pt deve crescer como uma plataforma de contexto futebolistico, nao como uma lista de noticias.

## Principios

- Tudo deve estar ligado a competicao, epoca, jornada e jogo.
- Uma manchete deve explicar impacto competitivo, nao apenas anunciar um facto.
- A classificacao deve poder ser consultada no momento exato de cada jornada.
- O backoffice deve ajudar uma pessoa a publicar com rigor, sem depender sempre de programador.
- Dados automaticos devem ser revistos quando influenciam manchetes, contexto ou arquivo historico.

## Fase 1 - Fundacao

Objetivo: preparar o projeto para deixar de depender de JSON manual.

- Definir modelo de dados final.
- Separar dados objetivos de conteudo editorial.
- Criar plano do backoffice.
- Escolher fornecedor de base de dados.
- Escolher primeira API de futebol para testes.

## Fase 2 - Backoffice editorial

Objetivo: permitir editar o site sem mexer em codigo.

- Login de administrador.
- Gestao de competicoes, epocas e jornadas.
- Gestao de jogos, resultados, transmissao TV e estado.
- Editor de manchetes e noticias.
- Associacao de cada noticia a competicao, jornada, jogo, clube e jogador.
- Botao para publicar/despublicar.

## Fase 3 - Dados automaticos

Objetivo: reduzir trabalho manual mantendo controlo editorial.

- Importar calendario de jogos.
- Atualizar resultados e estados dos jogos.
- Atualizar classificacoes.
- Guardar snapshot da classificacao por jornada.
- Gerar alertas para acontecimentos relevantes.
- Rever dados antes de aparecerem como manchete.

## Fase 4 - Maquina do tempo

Objetivo: permitir navegar historicamente pelo futebol.

- Consulta por epoca.
- Consulta por jornada antiga.
- Classificacao daquela altura.
- Resultados e proximos jogos daquele momento.
- Manchetes e contexto historico.

## Fase 5 - Operacao profissional

Objetivo: tornar o Jornada.pt sustentavel e seguro.

- Backups.
- Permissoes por utilizador.
- Logs de alteracoes.
- Monitorizacao de importacoes.
- Otimizacao de imagens e performance.
- Politica clara de fontes e direitos.
