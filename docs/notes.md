Fazer uma prova conceito de como funciona uma arquitetura do computador, com todos os componentes e como eles se comunicam.

Modelar uma CPU  com seus componentes, que seja entendivel e didatico que simule "fetch, decode e execute" com os componentes basicos.

Como é execultado o ciclo de instrução e como os componentes se comunicam coordenadamente?

---

Pesquisandos em livros como Tenenbaum e Stallings...


---

Notas sobre a materia da faculdade:

| Dimensão de Análise | **Arquitetura Von Neumann** | **Arquitetura Harvard** | **Filosofia RISC** (*Reduced Instruction Set Computer*) | **Filosofia CISC** (*Complex Instruction Set Computer*) |
| :--- | :--- | :--- | :--- | :--- |
| **Conceito e Foco Principal** | Modelo de **programa armazenado** (1945), no qual instruções e dados compartilham o mesmo espaço de memória. | Separação física entre os caminhos/estruturas de dados e de instruções. | Instruções **simples e de tamanho fixo**, focadas em alta eficiência e pipelines profundos. | Instruções **complexas e de tamanho variável**, visando alta densidade de código. |
| **Acesso e Estrutura de Memória** | **Memória e barramento únicos/compartilhados** para dados e instruções, gerando o *Gargalo de Von Neumann*. | **Barramentos/memórias separados** para instruções e dados, evitando disputas de barramento. | **Arquitetura *Load/Store***: Apenas registradores operam na ULA. A RAM só é acessada por comandos `LOAD` e `STORE`. | Instruções aritméticas e lógicas operam **diretamente sobre posições da memória RAM**. |
| **Ciclos por Instrução (CPI) e Execução** | Execução **sequencial padrão** via *Program Counter* (PC), salvo desvios. | Permite **busca de instrução e leitura de operando simultâneas** no mesmo ciclo. | Média focada próxima a **1 ciclo por instrução (CPI \\(\approx 1\\))**. | CPI **variável**, onde instruções complexas podem exigir dezenas a centenas de ciclos. |
| **Banco de Registradores e Compilação** | Utiliza registradores de uso específico (PC, IR, MAR, MDR, AC) e gerais. | Aplicada no gerenciamento de registradores/caches internos. | **Elevado número** de registradores de propósito geral; forte dependência de compiladores otimizadores. | **Número reduzido** de registradores gerais; depende do uso extensivo de microcódigo. |
| **Exemplos e Aplicação Prática** | Base da arquitetura dos computadores digitais genéricos. | Implementada no subsistema de **Cache L1 (dividida em L1i para instruções e L1d para dados)**. | ARM, MIPS, RISC-V, chips Apple Silicon. | Intel x86, AMD64. |
| **Convergência nas CPUs Modernas** | Serve de modelo macro para o fluxo geral da CPU com memória principal. | Utilizada no **nível interno de cache L1** para otimizar o paralelismo no pipeline. | Serve como a estrutura interna eficiente para qual as instruções são traduzidas. | CPUs CISC modernas (Intel Core/AMD Ryzen) **traduzem instruções CISC externas em micro-operações (\\(\mu\\)-ops) tipo RISC** internamente. |

