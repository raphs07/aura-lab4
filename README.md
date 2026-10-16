# Aura – Site (JavaScript puro)

Somente a parte visual, sem banco de dados e **sem backend**: HTML + CSS + JavaScript puro
(sem Python, sem frameworks, sem npm).

## Como abrir

Dê dois cliques em `index.html`. Pronto, não precisa instalar nada nem rodar servidor.

(Opcional, se preferir um servidor local: `python -m http.server` ou `npx serve` dentro desta pasta.)

## Estrutura

```
index.html       página inicial (abertura da flor + 3 cartões)
login.html       entrar (abas usuária / empresa)
cadastro.html    cadastro (abas usuária / empresa; aceita ?tipo=empresa)
css/style.css    cores, fontes, layout e animações
js/flower.js     desenha a flor em SVG:   <div data-flower></div>
js/layout.js     cabeçalho "bem-vindo ao AURA" + Entrar/Cadastro (igual em todas as páginas)
js/main.js       aviso (toast)
js/intro.js      animação de abertura
js/cards.js      cartões estilo slide ("Próximo")
js/auth.js       abas, máscaras (CNPJ, celular), mostrar senha e validação
```

## Animação de abertura

Flor desabrochando → desliza para o lado → "Bem-vindo para o seu site seguro" → fade e o site aparece.

- Toca **uma vez por sessão** do navegador.
- `index.html?intro=1` força tocar de novo (use para testar). `?intro=0` pula.
- Quem usa "reduzir movimento" no sistema não vê a animação.

## Onde mexer

- Textos dos cartões e da abertura: `index.html`
- Cores e fontes: variáveis no topo de `css/style.css`
- Tempos da abertura: `js/intro.js` (fade aos 4,6 s) e os `animation-delay` no CSS
- Formato da flor: `js/flower.js`
- Cabeçalho: `js/layout.js` (uma mudança vale para todas as páginas)

## Importante

Os formulários **não enviam nada**: o JavaScript só valida os campos e mostra um aviso.
Login e cadastro reais vêm na próxima etapa. As fontes vêm do Google Fonts (precisa de internet;
sem ela o site usa fontes do sistema).
