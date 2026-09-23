```PT-BR```

# Relatório Técnico – Simulação e Análise de Arquitetura Interna de um Computador

## Introdução e Contextualização
- Contextualização do problema de aprendizagem em arquitetura de computadores.
- Objetivos da prova de conceito para a NeoCore Tech.

## Fundamentação Teórica da Arquitetura Escolhida
- **Modelo:** Arquitetura Von Neumann vs. Harvard / RISC vs. CISC.
- **Justificativa da escolha** para fins didáticos.

## Componentes da CPU e Subsistemas
- **Unidade Lógica e Aritmética (ULA):** Operações aritméticas e lógicas básicas, flags de status.
- **Unidade de Controle (UC):** Geração de sinais de controle, temporização e decodificação de instruções.
- **Registradores Internos:**
  - `PC` (Program Counter)
  - `IR` (Instruction Register)
  - `MAR` (Memory Address Register)
  - `MBR` / `MDR` (Memory Buffer/Data Register)
  - `AC` (Accumulator / Registradores de uso geral)
- **Hierarquia de Memória e Barramentos:**
  - Barramento de Endereços (Address Bus)
  - Barramento de Dados (Data Bus)
  - Barramento de Controle (Control Bus)

## O Ciclo de Instrução (Fetch - Decode - Execute)
- Detalhamento passo a passo com fluxo de sinais e registradores envolvidos em cada micro-operação:
  1. **Busca (Fetch)**
  2. **Decodificação (Decode)**
  3. **Execução (Execute)**

## Modelagem e Implementação Prática
- Descrição da ferramenta utilizada (ex.: Logisim, Tinkercad Circuits ou código).
- Diagrama esquemático dos circuitos e fluxo de dados.
- Caso de teste com instrução simulada.

## Conclusões e Considerações Finais
- Avaliação dos resultados obtidos e benefícios didáticos.

## Referências Bibliográficas
- STALLINGS, William. *Arquitetura e Organização de Computadores*.
- TANENBAUM, Andrew S. *Organização Estruturada de Computadores*.
