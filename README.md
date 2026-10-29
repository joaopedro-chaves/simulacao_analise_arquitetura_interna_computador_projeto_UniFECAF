# UniFECAF - Simulação e Análise de Arquitetura Interna de um Computador

23/09/2026 - João Pedro Vieira da Costa Chaves

## Visão Geral

Este repositório contém o projeto de prova de conceito para a **NeoCore Tech**, cujo objetivo é desenvolver um simulador didático de arquitetura de computadores focado no entendimento do fluxo interno de execução de instruções (ciclo *fetch-decode-execute*), interação entre barramentos, registradores e a CPU.

## Estrutura do Repositório

```text
simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/
├── .gitignore                      # Regras de exclusão do Git
├── README.md                       # Apresentação do projeto e índice
├── docs/                           # Documentação e Relatórios
│   ├── REQUEST.md                  # Especificações e critérios de avaliação
│   ├── ROADMAP_PROJECT.md          # Cronograma e diretrizes de trabalho
│   ├── technical_report.md         # Relatório técnico acadêmico (25%)
│   ├── assets/                     # Diagramas e esquemáticos arquiteturais
│   └── pitch/                      # Material do Vídeo Pitch (25%)
│       └── pitch_script.md         # Roteiro estruturado para gravação (até 4 min)
├── src/                            # Arquivos do Simulador e Circuitos (50%)
└── dist/                           # Entregáveis finais (PDFs, pacotes de entrega)
```

## Kanban do projeto

https://kan.bn/boards/wxa2g8a6w3ww

## Entregáveis e Critérios de Avaliação

1. **Parte Teórica (25%):**
   - Relatório técnico fundamentado em referências clássicas (Tanenbaum, Stallings).
   - Documento base: [`docs/technical_report.md`](file:./docs/technical_report.md).

2. **Parte Prática (50%):**
   - Modelagem funcional e simulação visual da CPU e barramentos (Logisim / Tinkercad / Código).
   - Diretório: [`src/`](file:./src).

3. **Vídeo Pitch (25%):**
   - Apresentação em vídeo de até 4 minutos demonstrando o ciclo de instrução.
   - Roteiro: [`docs/pitch/pitch_script.md`](file:./docs/pitch/pitch_script.md).