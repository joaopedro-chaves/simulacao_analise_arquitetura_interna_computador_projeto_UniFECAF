# UniFECAF - Simulação e Análise de Arquitetura Interna de um Computador

23/09/2026 - João Pedro Vieira da Costa Chaves

## Visão Geral

Este repositório contém o projeto de prova de conceito para a **NeoCore Tech**, cujo objetivo é desenvolver um simulador didático de arquitetura de computadores focado no entendimento do fluxo interno de execução de instruções (ciclo *fetch-decode-execute*), interação entre barramentos, registradores e a CPU.

## Estrutura do Repositório

```text
simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/
├── .gitignore                      # Regras de exclusão do Git
├── README.md                       # Apresentação do projeto e índice geral
├── COMMITS.md                      # Tabela resumo de commits para auditoria
├── index.html                      # Simulador Web Interativo M3 (Von Neumann 8-bit)
├── test_model.js                   # Suite de testes unitários automatizados do modelo da CPU em Node.js
├── docs/                           # Documentação, Manuais e Auditoria
│   ├── COMMITS.md                  # Registro detalhado e auditoria técnica de commits
│   ├── SIMULADOR.md                # Manual didático completo do simulador web
│   ├── ROTEIRO.md                  # Roteiro estruturado para gravação do Pitch (até 4 min)
│   ├── TAREFAS.md                  # Matriz de controle de tarefas e status
│   └── TRABALHO_Computer_...md     # Diretrizes e critérios acadêmicos do projeto
├── src/                            # Circuito Logisim-Evolution e Schematics da CPU
│   ├── neocore_cpu.circ            # Modelo digital funcional (Logisim-Evolution v5.0.0)
│   ├── script.js                   # Motor lógico puro da CPU, FSM da UC, Cache L1 e controlo da UI
│   ├── styles.css                  # Folha de estilos Material Design 3 e layout responsivo
│   └── main_board.*                # Exportações esquemáticas (SVG, PNG, JPG, LaTeX)
└── dist/                           # Relatórios técnicos finais e entregáveis
    └── Simulador de Arquitetura de Computadores - Parte teórica.md
```

## Entregáveis e Critérios de Avaliação

1. **Parte Teórica (25%):**
   - Relatório técnico fundamentado em referências clássicas (Tanenbaum, Stallings).
   - Documento final: [`dist/Simulador de Arquitetura de Computadores - Parte teórica.md`](file:./dist/Simulador%20de%20Arquitetura%20de%20Computadores%20-%20Parte%20teórica.md).

2. **Parte Prática (50%):**
   - **Simulador Web Interativo (Material 3):** [`index.html`](file:./index.html) (com suporte a microinstruções T0–T6 (Modo Automático) e T0–T7 (Modo Manual), inspeção visual de barramentos e gate mobile com QR Code).
   - **Guia Didático do Simulador:** [`docs/SIMULADOR.md`](file:./docs/SIMULADOR.md).
   - **Circuito Digital Funcional:** [`src/neocore_cpu.circ`](file:./src/neocore_cpu.circ).

3. **Vídeo Pitch (25%):**
   - Apresentação em vídeo de até 4 minutos demonstrando a arquitetura interna e o ciclo de instrução.
   - Roteiro de gravação: [`docs/ROTEIRO.md`](file:./docs/ROTEIRO.md).

4. **Auditoria e Rastreabilidade do Desenvolvimento:**
   - Registro cronológico e fichas técnicas de todos os commits: [`COMMITS.md`](file:./COMMITS.md) e [`docs/COMMITS.md`](file:./docs/COMMITS.md).