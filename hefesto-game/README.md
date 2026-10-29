# Hefesto (Codename) – Explorando a Placa-Mãe

Jogo educativo 2D top-down em HTML5 Canvas + JS puro. Abra `index.html` no navegador (não precisa de servidor).

## Estrutura

```
hefesto-game/
├── index.html
├── README.md
├── css/style.css
├── js/
│   ├── config.js      # constantes
│   ├── components.js  # dados dos componentes e trilhas
│   ├── input.js       # teclado
│   ├── player.js      # movimento + colisão
│   ├── world.js       # câmera e renderização
│   ├── ui.js          # prompt e diálogo
│   └── main.js        # game loop
├── images/{sprites,tiles,ui}/
└── audios/{sfx,music}/
```

## Roadmap

1. **Protótipo Funcional** (atual): movimento, colisão, interação, diálogos.
2. **Arte & Polimento Visual**: sprites em pixel art (jogador, componentes, tiles de trilhas), animação de caminhada, partículas de "dados" nas trilhas, pré-carregador de assets.
3. **Áudio & Ambientação**: SFX (passos, abrir diálogo), música ambiente eletrônica, zumbido de ventoinha, controle de volume/mudo.
4. **Minigames & Quizzes**: quiz após cada componente, minigame de rotear dados pelas trilhas, sistema de pontuação/progresso (`localStorage`), conclusão com "computador ligado".
