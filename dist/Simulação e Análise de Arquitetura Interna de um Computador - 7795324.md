# Simulação e Análise de Arquitetura Interna de um Computador

**Parte teórica** — *RASCUNHO (cópia de trabalho)*

João Pedro Vieira da Costa Chaves - UniFECAF - 2026

08/09/2026

> ⚠ **Rascunho.** Esta é uma cópia de trabalho da versão enviada, com correções de texto aplicadas. Os trechos marcados com **\[RASCUNHO – DECIDIR\]** dependem do que existe de fato na Parte Prática (`neocore_cpu.circ` e `index.html`) e precisam ser resolvidos antes de gerar o PDF final. Apague todas as marcações ao finalizar.

## Sumário

1. Introdução e Contextualização
2. Fundamentação Teórica e Contextualização Industrial (2.1 Von Neumann e Harvard Modificada; 2.2 Convergência CISC e RISC; 2.3 Limites Físicos e Eficiência Energética; 2.4 Objetivo e Recorte Didático da PoC)
3. Componentes da CPU e Subsistemas (3.1 ULA; 3.2 UC; 3.3 Registradores; 3.4 Barramentos; 3.5 Hierarquia de Memória e o Papel da Cache)
4. O Ciclo de Instrução (4.1 Busca; 4.2 Decodificação; 4.3 Execução)
5. Modelagem e Implementação Prática (5.1 Ferramentas; 5.2 Estrutura do Circuito e Fluxo de Dados; 5.3 Caso de Teste)
6. Conclusões e Considerações Finais
7. Referências

## 1. Introdução e Contextualização

No ecossistema atual de desenvolvimento de software e ensino de engenharia, observa-se uma lacuna entre a escrita de código de alto nível e a compreensão aprofundada da execução física no hardware. Embora estudantes e desenvolvedores projetem sistemas complexos com grande agilidade, frequentemente impulsionados por ferramentas de inteligência artificial, a dinâmica interna do processador permanece velada por camadas de abstração. Essa desconexão é frequentemente motivada por demandas de produtividade, portabilidade e segurança no desenvolvimento moderno.

Conceitos fundamentais, como a orquestração da Unidade Central de Processamento (CPU), a cooperação entre a Unidade Lógica e Aritmética (ULA) e a Unidade de Controle (UC), a manipulação em registradores de alta velocidade, a hierarquia de memória e a sinalização em barramentos acabam abordados de maneira puramente teórica ou compartimentada, dificultando a assimilação sistêmica do funcionamento da máquina.

Visando solucionar esse desafio pedagógico, este trabalho apresenta uma proposta desenvolvida em colaboração com a NeoCore Tech, empresa especializada em educação em tecnologia: a implementação de uma Prova de Conceito (PoC) para um simulador interativo de arquitetura de computadores. O objetivo do projeto é demonstrar, de forma visual, estruturada e funcional, a integração entre o projeto lógico (arquitetura) e sua concretização em engenharia física (organização).

Nesse contexto, os dois domínios complementam-se conceitualmente:

- **Arquitetura de Computadores:** define o conjunto de instruções, modos de endereçamento e atributos visíveis ao programador de sistema.
- **Organização de Computadores:** detalha a interconexão das unidades funcionais, temporizações, circuitos lógicos, sinais de controle e barramentos responsáveis por materializar a execução da arquitetura.

## 2. Fundamentação Teórica e Contextualização Industrial

Como referência de contexto industrial para o estudo de Arquitetura e Organização de Computadores, observa-se a evolução dos processadores comerciais modernos da família x86-64 (exemplificados pelas linhas Intel Core e AMD Ryzen). Embora o modelo prático desenvolvido neste trabalho adote uma estrutura simplificada de 8 bits voltada ao ensino dos fundamentos clássicos, analisar como os processadores contemporâneos superam gargalos físicos permite situar a importância das transferências entre registradores e do controle de barramentos.

### 2.1. Arquiteturas Von Neumann e Harvard Modificada

Na arquitetura clássica de Von Neumann, instruções de programa e dados compartilham o mesmo espaço de endereçamento da memória principal (RAM) e utilizam um único caminho físico de comunicação com a CPU. Esse conceito de programa armazenado constitui o alicerce dos computadores modernos.

Contudo, essa organização apresenta uma limitação de vazão conhecida como Gargalo de Von Neumann (*Von Neumann Bottleneck*). Como a busca de uma instrução e a leitura ou escrita de um operando não podem ocorrer simultaneamente pelo barramento compartilhado, a CPU frequentemente entra em estado de espera (*wait state*) aguardando o tráfego de informações. Esse efeito é agravado pela discrepância entre a alta velocidade de operação do processador e a menor taxa de transferência da memória principal (*Memory Wall*).

Para atenuar esse gargalo, processadores contemporâneos utilizam uma organização Harvard Modificada no subsistema de memória cache:

- **Externamente (Memória Principal e Caches L2/L3):** preserva-se a unificação de Von Neumann, mantendo código e dados no mesmo espaço de endereçamento na memória RAM para facilitar o carregamento e o gerenciamento de programas pelo sistema operacional.
- **Internamente (Cache L1):** adota-se a divisão física da Arquitetura Harvard, segmentando a cache de primeiro nível em L1i (instruções) e L1d (dados). Isso permite que a CPU realize a busca (*fetch*) de uma instrução e a leitura ou escrita de um dado simultaneamente no mesmo ciclo de clock, eliminando conflitos estruturais de acesso no nível L1.

### 2.2. Convergência CISC e RISC (Micro-operações Internas)

Processadores x86-64 modernos combinam um conjunto de instruções complexo (CISC) na camada visível ao software com um núcleo de execução interna baseado em princípios RISC (*RISC-like*).

Nessa abordagem híbrida, decodificadores de hardware e memórias ROM de microcódigo traduzem instruções CISC complexas em sequências de operações internas simples e de tamanho fixo (denominadas µops). Isso permite manter a compatibilidade de software da arquitetura x86 enquanto se aproveita o paralelismo em nível de instrução (ILP) e a eficiência de pipelines superescalares.

Para fins de rigor conceitual neste trabalho, distingue-se o conceito de µops internas (típicas de decodificadores x86) das micro-operações de transferência entre registradores (RTL), que representam os passos elementares de cada fase do ciclo de instrução e constituem o foco direto da simulação prática apresentada na Seção 5.

### 2.3. Limites Físicos e Eficiência Energética

O gerenciamento térmico e a eficiência energética representam restrições centrais no projeto de processadores contemporâneos. A potência dinâmica consumida por um circuito digital CMOS é expressa aproximadamente por:

P ≈ α · C · V² · f

Em que:

- α representa o fator de atividade de chaveamento;
- C é a capacitância comutada do circuito;
- V corresponde à tensão de alimentação;
- f denota a frequência de clock.

No livro *Sistemas Operacionais Modernos*, Andrew S. Tanenbaum e Herbert Bos discutem as consequências da Lei de Moore e os limites físicos dos transistores. Os autores destacam que as restrições térmicas impediram o ganho contínuo de frequência pura, levando a indústria a adotar processadores com múltiplos núcleos (*multicore*) e técnicas avançadas de economia de energia.

> ⚠ **\[RASCUNHO – DECIDIR\]** Conferir essa atribuição no livro e citar a página. Considerar condensar a 2.3 em um parágrafo que desemboque na justificativa da PoC (ela ocupa mais espaço do que o ciclo de instrução e não se conecta ao que foi construído).

A adoção desses mecanismos em arquiteturas x86-64 está diretamente alinhada às diretrizes da TI Verde. A busca por maior eficiência energética visa otimizar o uso da energia elétrica e eliminar desperdícios, reduzindo os custos operacionais do resfriamento contínuo em data centers e mitigando os impactos ambientais associados ao crescimento da infraestrutura computacional global.

### 2.4. Objetivo e Recorte Didático da Prova de Conceito

Enquanto processadores comerciais x86-64 integram múltiplos núcleos, hierarquia de caches, pipelines superescalares e tradução de µops, tais estruturas aumentam a complexidade visual e ocultam do estudante iniciante o fluxo elementar dos sinais de hardware.

Para tornar diretamente observáveis o ciclo de instrução e as transferências entre registradores, a Prova de Conceito (PoC) implementada neste trabalho adota um recorte didático de 8 bits baseado no modelo clássico de Von Neumann e em uma organização de acumulador (semelhante a arquiteturas pedagógicas como o SAP-1). Foram deliberadamente omitidos múltiplos núcleos, *pipeline* e decodificação automática de instruções. Essas simplificações delimitam o escopo do protótipo ao caminho de dados (*datapath*) e ao acionamento manual dos sinais de habilitação, sendo retomadas na Seção 6 como limitações e oportunidades de evolução futura.

> ⚠ **\[RASCUNHO – DECIDIR\]** A versão enviada dizia que as memórias cache foram "deliberadamente omitidas", mas o parágrafo da Figura 1 (Seção 5.2) fala em "buffer de Cache". Retirei a cache da lista de omissões acima. Se a simulação **não** tiver cache, devolva-a à lista de omissões e remova a menção na Seção 5.2. Se tiver, descreva-a na 5.2 (tamanho, mapeamento, *hit* e *miss*) e use-a no trace da 5.3.

## 3. Componentes da CPU e Subsistemas

Apresenta-se a definição técnica das unidades funcionais integrantes da CPU e dos barramentos responsáveis pela comunicação entre subsistemas:

### 3.1. Unidade Lógica e Aritmética (ULA)

É o circuito combinacional encarregado de executar operações aritméticas elementares (adição, subtração, multiplicação, divisão), testes relacionais booleanos (A > B, A = B, A ≠ B) e operações lógicas bit a bit (AND, OR, XOR, NOT e deslocamentos) sobre os operandos fornecidos pelos registradores. **Em termos práticos, ele é nosso executor.**

*(Nota: no recorte prático da Seção 5, a ULA foi implementada de forma simplificada como um somador binário fixo de 8 bits.)*

### 3.2. Unidade de Controle (UC)

**O coordenador.** Subsistema responsável por coordenar o funcionamento do processador. A UC interpreta o código de operação (*opcode*) contido no Registrador de Instrução (IR) e emite, na sequência temporal adequada, os sinais de controle que comandam o caminho de dados (*datapath*). A UC não armazena nem transporta dados; sua função é habilitar a leitura e a escrita nos registradores, selecionar a operação da ULA e comandar os acessos à memória principal.

*(Nota: no recorte prático da Seção 5, a função da UC é exercida manualmente pelo estudante, por meio de cinco pinos de controle.)*

### 3.3. Registradores Internos

**PC (Program Counter):** registrador que armazena o endereço de memória da próxima palavra (instrução ou operando) a ser buscada pela CPU. **É o marcador que indica qual item da lista de tarefas (o programa) vem a seguir.**

**IR (Instruction Register):** armazena a palavra de instrução recém-buscada da memória (incluindo o código de operação e eventuais campos de operando ou endereço) enquanto ela é inspecionada e executada. **É a prancheta onde fica anotada a ordem de serviço atual que está sendo realizada.**

**MAR (Memory Address Register):** armazena o endereço específico da posição de memória que será lida ou escrita, alimentando diretamente o barramento de endereços. **É o número da prateleira ou o endereço exato para onde devemos olhar.**

**MBR / MDR (Memory Buffer Register / Memory Data Register):** atua como registrador de interface entre o barramento de dados da memória e o caminho de dados interno da CPU, armazenando temporariamente a palavra lida da RAM ou o dado a ser gravado nela. **É a caixa ou o carrinho que transporta o conteúdo que estava na prateleira.**

**AC (Accumulator / Acumulador):** registrador central em arquiteturas baseadas em acumulador, responsável por fornecer um dos operandos de entrada para a ULA e armazenar o resultado produzido pela operação. Difere dos registradores de uso geral de arquiteturas mais complexas, que são vários e endereçáveis. **É a bancada de trabalho, onde o operário manipula e guarda temporariamente o resultado da tarefa.**

### 3.4. Barramentos de Comunicação

**Barramento de Endereços (*Address Bus*):** conjunto de linhas condutoras unidirecionais utilizado para transmitir o endereço contido no MAR até a porta de seleção da memória principal. **É o sistema de roteamento e etiquetas.**

**Barramento de Dados (*Data Bus*):** via física que transporta o conteúdo binário (instruções e operandos) entre a memória principal (RAM), os periféricos de Entrada e Saída (E/S) e o registrador MBR da CPU. **É a frota de caminhões e esteiras de carga.**

**Barramento de Controle (*Control Bus*):** conjunto de sinais dedicados a coordenar o acesso e o armazenamento nos componentes do caminho de dados por meio de sinais de habilitação — como habilitação de escrita (*Write Enable* – WE), habilitação de saída (*Output Enable* – OE) e incremento de contador — sob o sincronismo da rede de clock. **É o rádio de comunicação dos fiscais de operação.**

### 3.5. Hierarquia de Memória e o Papel da Cache

A organização de memória do computador funciona em níveis de velocidade e capacidade para evitar que o processador fique parado esperando dados (o chamado *Memory Wall*, visto na Seção 2.1). Essa estrutura equilibra custo, espaço e tempo de resposta do topo até a base da pirâmide:

- **Registradores Internos:** ficam dentro da CPU e oferecem o acesso mais rápido, na frequência do clock, mas guardam poucos bits por vez. **São as ferramentas que já estão na mão do operário.**
- **Memória Cache (L1, L2 e L3):** memória ultrarrápida entre a CPU e a RAM que guarda cópias das instruções e dos dados mais usados, evitando esperas na leitura. **É o gaveteiro de acesso rápido ao lado da bancada.**
- **Memória Principal (RAM):** guarda temporariamente os programas e dados em execução, oferecendo espaço médio e velocidade menor que a cache. **É o estoque central da fábrica.**
- **Armazenamento Secundário (SSD/HD):** mantém arquivos e sistemas salvos de forma permanente, com grande capacidade, mas com o acesso mais lento da estrutura. **É o galpão externo de longa distância.**

O papel da memória cache apoia-se no princípio da localidade: a localidade temporal (um dado usado agora tende a ser usado de novo em breve) e a localidade espacial (endereços vizinhos ao acessado tendem a ser acessados em seguida). Por isso, a cache mantém cópias de blocos recentes da RAM. Quando a CPU precisa de uma instrução ou dado no endereço apontado pelo MAR, o sistema consulta primeiro a cache. Se a informação está lá, ocorre um acerto (*cache hit*) e o acesso é rápido. Se não está, ocorre uma falha (*cache miss*): o bloco é buscado na RAM, mais lenta, e copiado para a cache, o que aumenta o tempo do ciclo de máquina.

> ⚠ **\[RASCUNHO – DECIDIR\]** Acrescentar um parágrafo ligando esta seção à PoC: onde a RAM 256 x 8 se encaixa na pirâmide e o que, na simulação, representa (ou não) a cache.

## 4. O Ciclo de Instrução (Fetch – Decode – Execute)

O ciclo de instrução compreende o processo sequencial realizado pela CPU para buscar, interpretar e executar cada operação de um programa. Utilizando a Notação de Transferência entre Registradores (RTL), as etapas fundamentais são descritas a seguir:

### 4.1. Busca (Fetch)

Durante a fase de busca, o processador localiza e lê a próxima palavra na memória RAM utilizando o endereço apontado pelo registrador PC. O processo desenvolve-se em três micro-operações sequenciais:

- **T0:** `MAR ← PC` O endereço contido no PC é transferido para o registrador MAR através do barramento interno.
- **T1:** `MBR ← RAM[MAR]` A memória principal é lida no endereço selecionado pelo MAR e o byte resultante é carregado no MBR pelo barramento de dados.
- **T2:** `IR ← MBR; PC ← PC + 1` O conteúdo do MBR é transferido para o registrador IR, enquanto o contador PC é incrementado em uma unidade para apontar para o endereço seguinte. *(Nota: a realização do incremento do PC no instante T2 constitui uma escolha de projeto adotada na simulação prática para visualização conjunta com a carga do IR.)*

### 4.2. Decodificação (Decode)

Em uma CPU completa, a etapa de decodificação consiste na interpretação combinacional dos bits contidos no IR pela Unidade de Controle, identificando a operação solicitada e preparando os sinais de habilitação necessários para a fase de execução, sem ocorrer transferência de dados entre registradores.

### 4.3. Execução (Execute)

Na fase de execução, os sinais de controle acionam as unidades funcionais pertinentes para concretizar a operação. No caso da operação de soma implementada na PoC, a ULA soma o valor contido no AC com o operando presente no MBR e armazena o resultado de volta no acumulador:

- **T3:** `AC ← AC + MBR` O resultado da soma realizada pela ULA é gravado no registrador AC na borda de subida do clock.

## 5. Modelagem e Implementação Prática

Para demonstrar de forma visual e interativa os conceitos de caminho de dados e transferências entre registradores, foi projetado o circuito digital de um núcleo de execução de 8 bits (modelo Von Neumann) acompanhado de uma aplicação web simuladora.

### 5.1. Ferramentas Utilizadas

- **Logisim-Evolution (v5.0.0):** utilizado para modelar e validar o esquemático lógico digital (`neocore_cpu.circ`), operando com caminhos de dados de 8 bits e frequência de clock ajustada em 1,0 Hz.
- **Simulador Web Interativo (`index.html`):** desenvolvido em HTML5, CSS3 e JavaScript puro, reproduzindo o esquemático do circuito em formato vetorial (SVG). A interface permite filtrar visualmente cada caminho de interconexão, inspecionar os registradores em tempo real (nas bases hexadecimal, binária e decimal), editar diretamente os endereços da memória RAM e conduzir o ciclo passo a passo ou com geração automática de pulsos de clock (*Auto-Clock* a 1 Hz).

### 5.2. Estrutura do Circuito e Fluxo de Dados

O circuito prático integra os registradores da CPU, a memória principal e pinos de entrada/saída por meio de quatro estruturas fundamentais:

- **Rede de Clock (1 bit):** origina-se no gerador de pulsos (`CLOCK`) e distribui o sinal de sincronismo para as entradas de relógio (`clk`) dos registradores MAR, PC, IR, MBR e AC. Todas as transferências entre registradores ocorrem de forma síncrona na borda de subida do clock.
- **Linhas de Controle do Datapath (5 linhas de 1 bit):** para fins didáticos, a emissão dos sinais de controle foi externalizada em cinco pinos de acionamento manual, permitindo ao operador atuar como Unidade de Controle:
  - `MAR_Load`: habilita a escrita (WE) no registrador MAR.
  - `RAM_Read_MBR`: habilita simultaneamente a saída de dados (OE) da memória RAM e a escrita (WE) no registrador MBR.
  - `IR_Load`: habilita a escrita (WE) no registrador de instrução (IR).
  - `PC_Inc`: aciona a entrada de contagem (`ct`) do Contador de Programa (PC), incrementando o endereço atual em +1.
  - `AC_Exec`: habilita a escrita (WE) no Acumulador (AC) para armazenar a soma calculada pela ULA.
- **Caminho e Barramento de Endereços (8 bits, unidirecional):** conecta a saída do contador PC à entrada de dados do MAR e, a partir da saída do MAR, alimenta a porta de endereçamento `A` da memória principal (RAM 256 x 8).
- **Barramento de Dados (8 bits) e Pinos de E/S:** transporta o byte lido da saída da RAM até a entrada do MBR. A partir da saída do MBR, o caminho de dados bifurca-se para alimentar a entrada do IR e a primeira entrada da ULA (implementada com um somador binário *Adder* de 8 bits). A saída da ULA alimenta o registrador AC, cuja saída é exibida em binário no pino de saída `Monitor` (8 bits) e realimenta a segunda entrada da ULA (`AC + MBR`). O circuito dispõe ainda de um pino de entrada de 8 bits (`Teclado`) conectado à entrada de dados da RAM.

> ⚠ **\[RASCUNHO – INSERIR FIGURA 1\]** Capturas de tela do circuito no Logisim-Evolution e do Simulador Web, com legenda ("Figura 1 – Diagrama geral da arquitetura implementada"). Rotular cada bloco como implementado ou conceitual.

A Figura 1 apresenta o diagrama geral da arquitetura implementada para a NeoCore Tech, destacando a integração visual entre a CPU (ULA, registradores PC, MAR, MBR, IR, AC e linhas da Unidade de Controle), a memória principal (RAM) e os dispositivos de entrada (Teclado) e saída (Monitor) interligados pelos barramentos de dados, endereços e controle.

> ⚠ **\[RASCUNHO – DECIDIR\]** Incluir "e a representação da cache" na frase acima somente se ela existir no diagrama (ver aviso na Seção 2.4). Verificar também se o `Teclado` tem algum sinal de escrita na RAM: entre os 5 pinos de controle não há nenhum.

### 5.3. Caso de Teste: Simulação Passo a Passo

Para validar o funcionamento coordenado das transferências entre registradores, configurou-se um caso de teste de soma acumulada no qual cada byte armazenado na memória é processado diretamente como operando da soma (uma vez que o protótipo atual não particiona o byte em campos de *opcode* e operando).

Os primeiros endereços da memória principal foram inicializados com `RAM[00h] = 05h` (5 decimal) e `RAM[01h] = 03h` (3 decimal), iniciando todos os registradores com o valor `00h`.

**Passo 1 — Busca / Fetch Parte 1 (`T0: MAR ← PC`):** Ativa-se o sinal `MAR_Load = 1` e aplica-se um pulso de `CLOCK`. O endereço `00h` contido no PC é copiado para o MAR, selecionando a linha `00h` da memória RAM pelo barramento de endereços.

**Passo 2 — Busca / Fetch Parte 2 (`T1: MBR ← RAM[MAR]`):** Desativa-se `MAR_Load = 0` e ativa-se `RAM_Read_MBR = 1`. No pulso de `CLOCK`, a RAM disponibiliza o byte `05h` no barramento de dados e o registrador MBR armazena esse valor (`MBR = 05h`).

**Passo 3 — Busca Parte 3 e Decodificação (`T2: IR ← MBR; PC ← PC + 1`):** Desativa-se `RAM_Read_MBR = 0` e ativam-se juntos os sinais `IR_Load = 1` e `PC_Inc = 1`. Com o pulso de `CLOCK`, a palavra `05h` (`00000101`) vai para o IR e o contador PC avança para `01h`. Na etapa de decodificação (*Decode*), que nesta PoC é exercida manualmente, o estudante lê o conteúdo do IR e identifica que a operação a executar é a soma, acionando o sinal `AC_Exec` na etapa seguinte. Como o protótipo não possui opcode codificado nem decodificador por hardware, não há interpretação automática de bits: esse papel é o da Unidade de Controle que o estudante desempenha.

> ⚠ **\[RASCUNHO – DECIDIR\]** Esta é a versão "honesta" do Decode, coerente com a introdução da 5.3 e com a Seção 6. A alternativa melhor é implementar um decodificador mínimo no Logisim: o nibble alto do IR (opcode) comanda o `AC_Exec` automaticamente e a ULA soma o nibble baixo do IR (e não o MBR inteiro). Nesse caso, reescrever este passo, o 4.3 e a Seção 6 de acordo. A versão enviada afirmava que os 4 bits altos eram o opcode, o que o circuito atual não faz: com `RAM[00h] = 15h` ele somaria 21, não 5.

**Passo 4 — Execução / Execute (`T3: AC ← AC + MBR`):** Desativam-se os sinais anteriores e ativa-se `AC_Exec = 1`. O somador da ULA realiza a adição entre o valor atual do AC (`00h`) e o valor do MBR (`05h`). Na subida do `CLOCK`, o resultado `05h` é gravado no AC e exibido imediatamente no pino `Monitor` como `00000101`.

**Passo 5 — Segundo Ciclo Completo (`T4` a `T7`):** Repete-se a sequência de quatro micro-operações para o endereço `01h` apontado pelo PC (`T4: MAR ← PC`, `T5: MBR ← RAM[MAR]`, `T6: IR ← MBR; PC ← PC + 1` e `T7: AC ← AC + MBR`). O MAR recebe `01h`, o MBR lê o segundo byte da memória (`RAM[01h] = 03h`), o IR atualiza-se para `03h` e o PC é incrementado para `02h`. Ao acionar `AC_Exec = 1` no passo `T7`, a ULA soma o valor acumulado no AC (`05h`) ao novo valor no MBR (`03h`), resultando em `AC = 08h` (8 em decimal) e exibindo `00001000` no pino `Monitor`.

## 6. Conclusões e Considerações Finais

O desenvolvimento do circuito no Logisim-Evolution, aliado ao simulador web interativo, cumpriu o propósito pedagógico delineado junto à NeoCore Tech: transformar o estudo das transferências entre registradores em uma experiência visual e manipulável. Ao permitir que o estudante atue como a própria Unidade de Controle — acionando manualmente cada sinal de habilitação e observando o tráfego de palavras de 8 bits entre memória, registradores e ULA —, a Prova de Conceito torna transparente a mecânica síncrona do caminho de dados (*datapath*).

Respondendo à questão central do projeto sobre como os componentes do computador trabalham de forma coordenada para buscar, interpretar e executar uma instrução, a simulação demonstra que o processamento ocorre por uma ação sincronizada pelo sinal de clock:

- **Busca coordenada:** o contador PC indica o endereço atual, o MAR aponta essa posição pelo barramento de endereços e a memória entrega a palavra ao MBR através do barramento de dados.
- **Interpretação:** o registrador IR guarda a palavra recebida. Em uma CPU completa, a Unidade de Controle identificaria a operação nos bits do código e acionaria os sinais do barramento de controle; nesta PoC, essa função é exercida pelo estudante, que interpreta o IR e aciona manualmente os sinais.
- **Execução e saída:** a ULA recebe os operandos vindos do acumulador (AC) e do MBR, realiza o cálculo aritmético e grava o resultado de volta no AC para exibição imediata no periférico de saída (Monitor).

Como limitação deliberada deste primeiro recorte, o circuito opera exclusivamente com controle manual e trata os bytes lidos da memória como operandos diretos de soma, não dispondo de conjunto de instruções (ISA) codificado, decodificador automático, indicadores de estado (*flags*) ou instrução de parada (HLT).

Como evolução futura, propõe-se: (i) uma UC automática, por FSM ou microprograma, comandada por um opcode no IR; (ii) uma ISA mínima com poucas instruções, por exemplo soma, carga e saída; (iii) *flags* e instrução HLT; e (iv) uma representação de cache com contagem de acertos e falhas.

## 7. Referências

STALLINGS, William. *Arquitetura e organização de computadores*. 8. ed. São Paulo: Pearson Prentice Hall, 2010.

TANENBAUM, Andrew S.; AUSTIN, Todd. *Organização estruturada de computadores*. Tradução: Daniel Vieira; revisão técnica: Wagner Luiz Zucchi. São Paulo: Pearson Prentice Hall, 2013.

TANENBAUM, Andrew S.; BOS, Herbert. *Sistemas operacionais modernos*. Tradução: Jorge Ritter; revisão técnica: Raphael Y. de Camargo. 4. ed. São Paulo: Pearson Education do Brasil, 2016.

LOGISIM-EVOLUTION. Repositório e documentação: https://github.com/logisim-evolution/logisim-evolution

WIKIPEDIA. Arquitetura de von Neumann: https://pt.wikipedia.org/wiki/Arquitetura\_de\_von\_Neumann

WIKIPEDIA. Arquitetura de Harvard: https://pt.wikipedia.org/wiki/Arquitetura\_Harvard e Arquitetura modificada de Harvard: https://en.wikipedia.org/wiki/Modified\_Harvard\_architecture

WIKIPEDIA. RISC e CISC: https://pt.wikipedia.org/wiki/RISC e https://pt.wikipedia.org/wiki/CISC

WIKIPEDIA. Componentes da CPU: https://pt.wikipedia.org/wiki/Unidade\_central\_de\_processamento

WIKIPEDIA. Barramentos: https://pt.wikipedia.org/wiki/Barramento\_(computação)

WIKIPEDIA. Ciclo de instrução: https://en.wikipedia.org/wiki/Instruction\_cycle

> ⚠ **\[RASCUNHO – DECIDIR\]** O enunciado pede Tanenbaum, Stallings e o manual do Logisim como fontes principais. Stallings e *Organização Estruturada* estão listados, mas não são citados no corpo do texto; vale citá-los nas Seções 2 e 3 (autor, ano, página) e reduzir a dependência da Wikipedia.
