# Publicar o Jornada.pt

O projeto esta preparado para ser publicado na Vercel como uma aplicacao Next.js.

## Opcao recomendada: Vercel

1. Criar uma conta em https://vercel.com
2. Colocar esta pasta num repositorio GitHub.
3. Na Vercel, escolher `Add New...` e depois `Project`.
4. Importar o repositorio do Jornada.pt.
5. Manter as definicoes automaticas:
   - Framework: Next.js
   - Install command: `npm install`
   - Build command: `npm run build`
6. Carregar em `Deploy`.

Quando terminar, a Vercel gera um link publico do site.

## Dominio proprio

Depois do primeiro deploy, e possivel ligar um dominio como `jornada.pt` nas definicoes do projeto na Vercel.

## Nota sobre localhost

`http://localhost:3000` serve apenas para ver o site no computador enquanto o servidor local esta ativo. Para o site estar sempre acessivel, tem de estar publicado num servico online como a Vercel.
