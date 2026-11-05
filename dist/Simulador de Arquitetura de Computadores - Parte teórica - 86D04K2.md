# **Simulação e Análise de Arquitetura Interna de um Computador**

# **Parte teórica**

## João Pedro Vieira da Costa Chaves \- UniFECAF \- 2026

08/09/2026

# **Sumário**

1. Introdução e Contextualização  
2. Fundamentação Teórica e Contextualização Industrial  
   2.1. Arquiteturas Von Neumann e Harvard Modificada  
   2.2. Convergência CISC e RISC (Micro-operações Internas)  
   2.3. Limites Físicos e Eficiência Energética  
   2.4. Objetivo e Recorte Didático da Prova de Conceito  
3. Componentes da CPU e Subsistemas  
   3.1. Unidade Lógica e Aritmética (ULA)  
   3.2. Unidade de Controle (UC)  
   3.3. Registradores Internos  
   3.4. Barramentos de Comunicação  
   3.5. Hierarquia de Memória e o Papel da Cache  
4. O Ciclo de Instrução (Fetch – Decode – Execute)  
   4.1. Busca (*Fetch*)  
   4.2. Decodificação (*Decode*)  
   4.3. Execução (*Execute*)  
5. Modelagem e Implementação Prática  
   5.1. Ferramentas Utilizadas  
   5.2. Estrutura do Circuito e Fluxo de Dados  
   5.3. Caso de Teste: Simulação Passo a Passo  
6. Conclusões e Considerações Finais  
7. Referências Bibliográficas

# **1\. Introdução e contextualização**

No ecossistema atual de desenvolvimento de software e ensino de engenharia, observa-se uma lacuna entre a escrita de código de alto nível e a compreensão aprofundada da execução física no hardware. Embora estudantes e desenvolvedores projetem sistemas complexos com grande agilidade, frequentemente impulsionados por ferramentas de inteligência artificial, a dinâmica interna do processador permanece velada por camadas de abstração. Essa desconexão é frequentemente motivada por demandas de produtividade, portabilidade e segurança no desenvolvimento moderno.

Conceitos fundamentais, como a orquestração da Unidade Central de Processamento (CPU), a cooperação entre a Unidade Lógica e Aritmética (ULA) e a Unidade de Controle (UC), a manipulação em registradores de alta velocidade, a hierarquia de memória e a sinalização em barramentos acabam abordados de maneira puramente teórica ou compartimentada, dificultando a assimilação sistêmica do funcionamento da máquina.

Visando solucionar esse desafio pedagógico, este trabalho apresenta uma proposta desenvolvida em colaboração com a NeoCore Tech, empresa especializada em educação em tecnologia: a implementação de uma Prova de Conceito (PoC) para um simulador interativo de arquitetura de computadores. O objetivo do projeto é demonstrar, de forma visual, estruturada e funcional, a integração entre o projeto lógico (arquitetura) e sua concretização em engenharia física (organização).

Nesse contexto, os dois domínios complementam-se conceitualmente:

* **Arquitetura de Computadores:** define o conjunto de instruções, modos de endereçamento e atributos visíveis ao programador de sistema.  
* **Organização de Computadores:** detalha a interconexão das unidades funcionais, temporizações, circuitos lógicos, sinais de controle e barramentos responsáveis por materializar a execução da arquitetura.

# **2\. Fundamentação Teórica da Arquitetura Escolhida**

Como referência de contexto industrial para o estudo de Arquitetura e Organização de Computadores, observa-se a evolução dos processadores comerciais modernos da família x86-64 (exemplificados pelas linhas Intel Core e AMD Ryzen). Embora o modelo prático desenvolvido neste trabalho adote uma estrutura simplificada de 8 bits voltada ao ensino dos fundamentos clássicos, analisar como os processadores contemporâneos superam gargalos físicos permite situar a importância das transferências entre registradores e do controle de barramentos.

## **2.1. Arquiteturas Von Neumann e Harvard Modificada**

Na arquitetura clássica de Von Neumann, instruções de programa e dados compartilham o mesmo espaço de endereçamento da memória principal (RAM) e utilizam um único caminho físico de comunicação com a CPU. Esse conceito de programa armazenado constitui o alicerce dos computadores modernos.

Contudo, essa organização apresenta uma limitação de vazão conhecida como Gargalo de Von Neumann (Von Neumann Bottleneck). Como a busca de uma instrução e a leitura ou escrita de um operando não podem ocorrer simultaneamente pelo barramento compartilhado, a CPU frequentemente entra em estado de espera (wait state) aguardando o tráfego de informações. Esse efeito é agravado pela discrepância entre a alta velocidade de operação do processador e a menor taxa de transferência da memória principal (Memory Wall).

Para atenuar esse gargalo, processadores contemporâneos utilizam uma organização Harvard Modificada no subsistema de memória cache:

* **Externamente (Memória Principal e Caches L2/L3):** Preserva-se a unificação de Von Neumann, mantendo código e dados no mesmo espaço de endereçamento na memória RAM para facilitar o carregamento e o gerenciamento de programas pelo sistema operacional.  
* **Internamente (Cache L1):** Adota-se a divisão física da Arquitetura Harvard, segmentando a cache de primeiro nível em L1i (instruções) e L1d (dados). Isso permite que a CPU realize a busca (***fetch***) de uma instrução e a leitura ou escrita de um dado simultaneamente no mesmo ciclo de clock, eliminando conflitos estruturais de acesso no nível L1.

## **2.2. Convergência CISC e RISC (Micro-operações Internas)**

Processadores x86-64 modernos combinam um conjunto de instruções complexo (CISC) na camada visível ao software com um núcleo de execução interna baseado em princípios RISC (RISC-like).

Nessa abordagem híbrida, decodificadores de hardware e memórias ROM de microcódigo traduzem instruções CISC complexas em sequências de operações internas simples e de tamanho fixo (denominadas µops). Isso permite manter a compatibilidade de software da arquitetura x86 enquanto se aproveita o paralelismo em nível de instrução (ILP) e a eficiência de pipelines superescalares.

Para fins de rigor conceitual neste trabalho, distingue-se o conceito de *µops* internas (típicas de decodificadores x86) das micro-operações de transferência entre registradores (RTL), que representam os passos elementares de cada fase do ciclo de instrução e constituem o foco direto da simulação prática apresentada na Seção 5\.

## **2.3. Limites Físicos e Eficiência Energética**

O gerenciamento térmico e a eficiência energética representam restrições centrais no projeto de processadores contemporâneos. A potência dinâmica consumida por um circuito digital CMOS é expressa aproximadamente por:

P ≈ α · C · V² · f

Em que:

* α representa o fator de atividade de chaveamento;  
* C é a capacitância comutada do circuito;  
* V corresponde à tensão de alimentação;  
* f denota a frequência de clock.

No livro *Sistemas Operacionais Modernos*, Andrew S. Tanenbaum e Herbert Bos discutem as consequências da Lei de Moore e os limites físicos dos transistores. Os autores destacam que as restrições térmicas impediram o ganho contínuo de frequência pura, levando a indústria a adotar processadores com múltiplos núcleos (**multicore**) e técnicas avançadas de economia de energia.

A adoção desses mecanismos em arquiteturas x86-64 está diretamente alinhada às diretrizes da TI Verde. A busca por maior eficiência energética visa otimizar o uso da energia elétrica e eliminar desperdícios, reduzindo os custos operacionais do resfriamento contínuo em data centers e mitigando os impactos ambientais associados ao crescimento da infraestrutura computacional global.

## **2.4. Objetivo e Recorte Didático da Prova de Conceito**

Enquanto processadores comerciais x86-64 integram múltiplos núcleos, hierarquia de caches, pipelines superescalares e tradução de µops, tais estruturas aumentam a complexidade visual e ocultam do estudante iniciante o fluxo elementar dos sinais de hardware.

Para tornar diretamente observáveis o ciclo de instrução e as transferências entre registradores, a Prova de Conceito (PoC) implementada neste trabalho adota um recorte didático de 8 bits baseado no modelo clássico de Von Neumann e em uma organização de acumulador (semelhante a arquiteturas pedagógicas como o SAP-1). Foram deliberadamente omitidos múltiplos núcleos, memórias cache, *pipeline* e decodificação automática de instruções. Essas simplificações delimitam o escopo do protótipo ao caminho de dados (datapath) e ao acionamento manual dos sinais de habilitação, sendo retomadas na Seção 6 como oportunidades de evolução futura.

# **3\. Componentes da CPU e Subsistemas**

Apresenta-se a definição técnica das unidades funcionais integrantes da CPU e dos barramentos responsáveis pela comunicação entre subsistemas:

## **3.1. Unidade Lógica e Aritmética (ULA)**

É o circuito combinacional encarregado de executar operações aritméticas elementares (adição, subtração, multiplicação, divisão), testes relacionais booleanos (A \> B, A \= B, A ≠ B) e operações lógicas bit a bit (AND, OR, XOR, NOT e deslocamentos) sobre os operandos fornecidos pelos registradores. **Em termos práticos, ele é nosso executor**.  
*(Nota: no recorte prático da Seção 5, a ULA foi implementada de forma simplificada como um somador binário fixo de 8 bits)*

## **3.2. Unidade de Controle (UC)**

**O coordenador**. Subsistema responsável por coordenar o funcionamento do processador. A UC interpreta o código de operação (*opcode*) contido no Registrador de Instrução (IR) e emite, na sequência temporal adequada, os sinais de controle que comandam o caminho de dados (*datapath*). A UC não armazena nem transporta dados; sua função é habilitar a leitura e a escrita nos registradores, selecionar a operação da ULA e comandar os acessos à memória principal.

## **3.3. Registradores Internos**

**PC (Program Counter):** Registrador que armazena o endereço de memória da próxima palavra (instrução ou operando) a ser buscada pela CPU. **É a nossa lista de tarefas/to-do.**

**IR (Instruction Register):** Armazena a palavra de instrução recém-buscada da memória (incluindo o código de operação e eventuais campos de operando ou endereço) enquanto ela é inspecionada e executada. **É a prancheta onde fica anotada a ordem de serviço atual que está sendo realizada.**

**MAR (Memory Address Register):** Armazena o endereço específico da posição de memória que será lida ou escrita, alimentando diretamente o barramento de endereços. **É o número da prateleira ou o endereço exato para onde devemos olhar.**

**MBR / MDR (Memory Buffer/Data Register):** Também denominado MDR (***Memory Data Register***), atua como registrador de interface entre o barramento de dados da memória e o caminho de dados interno da CPU, armazenando temporariamente a palavra lida da RAM ou o dado a ser gravado nela. **É a caixa ou o carrinho que transporta o conteúdo que estava na prateleira.**

**AC (Accumulator / Registradores de uso geral):** Registrador central em arquiteturas baseadas em acumulador, responsável por fornecer um dos operandos de entrada para a ULA e armazenar o resultado produzido pela operação. **É a bancada de trabalho, onde o operário manipula e guarda temporariamente o resultado da tarefa.**

## **3.4. Barramentos de Comunicação**

**Barramento de Endereços (Address Bus):** Conjunto de linhas condutoras unidirecionais utilizado para transmitir o endereço contido no MAR até a porta de seleção da memória principal. **É o Sistema de Roteamento e Etiquetas**.

**Barramento de Dados (Data Bus):** Via física que transporta o conteúdo binário (instruções e operandos) entre a memória principal (RAM), os periféricos de Entrada e Saída (E/S) e o registrador MBR da CPU. **É a frota de caminhões e esteiras de carga.**

**Barramento de Controle (Control Bus):** Conjunto de sinais dedicados a coordenar o acesso e o armazenamento nos componentes do caminho de dados por meio de sinais de habilitação — como habilitação de escrita (***Write Enable*** **– WE), habilitação de saída (*Output Enable* – OE) e incremento de contador — sob o sincronismo da rede de clock. É o rádio de comunicação dos fiscais de operação.**

## **3.5. Hierarquia de Memória e o Papel da Cache**

A organização de memória do computador funciona em níveis de velocidade e capacidade para evitar que o processador fique parado esperando dados (o chamado *Memory Wall*). Essa estrutura equilibra custo, espaço e tempo de resposta do topo até a base da pirâmide:

* **Registradores Internos:** Ficam dentro da CPU e oferecem o acesso mais rápido na frequência do clock, mas guardam poucos bits por vez. **São as ferramentas que já estão na mão do operário.**  
* **Memória Cache (L1, L2 e L3):** Memória ultrarrápida entre a CPU e a RAM que guarda cópias das instruções e dados mais usados, evitando esperas na leitura. **É o gaveteiro de acesso rápido ao lado da bancada.**  
* **Memória Principal (RAM):** Guarda temporariamente os programas e dados em execução, oferecendo espaço médio e velocidade menor que a cache. **É o estoque central da fábrica.**  
* **Armazenamento Secundário (SSD/HD):** Mantém arquivos e sistemas salvos de forma permanente com grande capacidade, mas tem o acesso mais lento da estrutura. **É o galpão externo de longa distância.**

O papel central da memória cache é antecipar as leituras do processador. Quando a CPU busca uma instrução no endereço apontado pelo MAR, o sistema verifica primeiro se a informação já está na cache (*Cache Hit*) antes de percorrer o caminho mais lento até a memória RAM (*Cache Miss*), acelerando o ciclo de máquina.

# **4\. O Ciclo de Instrução (Fetch – Decode – Execute)**

O ciclo de instrução compreende o processo sequencial realizado pela CPU para buscar, interpretar e executar cada operação de um programa. Utilizando a Notação de Transferência entre Registradores (RTL), as etapas fundamentais são descritas a seguir:

## **4.1. Busca (Fetch)**

Durante a fase de busca, o processador localiza e lê a próxima palavra na memória RAM utilizando o endereço apontado pelo registrador PC. O processo desenvolve-se em três micro-operações sequenciais:

* **T0:** MAR ← PC  
  O endereço contido no PC é transferido para o registrador MAR através do barramento interno.  
* **T1:** MBR ← RAM\[MAR\]  
  A memória principal é lida no endereço selecionado pelo MAR e o byte resultante é carregado no MBR pelo barramento de dados.  
* **T2:** IR ← MBR; PC ← PC \+ 1  
  O conteúdo do MBR é transferido para o registrador IR, enquanto o contador PC é incrementado em uma unidade para apontar para o endereço seguinte. *(Nota: a realização do incremento do PC no instante T2 constitui uma escolha de projeto adotada na simulação prática para visualização conjunta com a carga do IR).*

## **4.2. Decodificação (Decode)**

Em uma CPU completa, a etapa de decodificação consiste na interpretação combinacional dos bits contidos no IR pela Unidade de Controle, identificando a operação solicitada e preparando os sinais de habilitação necessários para a fase de execução, sem ocorrer transferência de dados entre registradores.

## **4.3. Execução (Execute)**

Na fase de execução, os sinais de controle acionam as unidades funcionais pertinentes para concretizar a operação. No caso de uma adição imediata sobre o acumulador, a ULA soma o valor contido no AC com o operando presente no MBR e armazena o resultado de volta no acumulador:

* **T3:** AC ← AC \+ MBR  
  O resultado da soma realizada pela ULA é gravado no registrador AC na borda de subida do clock.

# **5\. Modelagem e Implementação Prática**

Para demonstrar de forma visual e interativa os conceitos de caminho de dados e transferências entre registradores, foi projetado o circuito digital de um núcleo de execução de 8 bits (modelo Von Neumann) acompanhado de uma aplicação web simuladora.

## **5.1. Ferramentas Utilizadas**

* **Logisim-Evolution (v5.0.0):** Utilizado para modelar e validar o esquemático lógico digital (neocore\_cpu.circ), operando com caminhos de dados de 8 bits e frequência de clock ajustada em 1,0 Hz.  
* **Simulador Web Interativo (index.html):** Desenvolvido em HTML5, CSS3 e JavaScript puro, reproduzindo o esquemático do circuito em formato vetorial (SVG). A interface permite filtrar visualmente cada caminho de interconexão, inspecionar os registradores em tempo real (nas bases hexadecimal, binária e decimal), editar diretamente os endereços da memória RAM e conduzir o ciclo passo a passo ou com geração automática de pulsos de clock (*Auto-Clock* a 1 Hz).

## **5.2. Estrutura do Circuito e Fluxo de Dados**

O circuito prático integra os registradores da CPU, a memória principal e pinos de entrada/saída por meio de quatro estruturas fundamentais:

* **Rede de Clock (1 bit):** Origina-se no gerador de pulsos (CLOCK) e distribui o sinal de sincronismo para as entradas de relógio (clk) dos registradores MAR, PC, IR, MBR e AC. Todas as transferências entre registradores ocorrem de forma síncrona na borda de subida do clock.  
* **Linhas de Controle do Datapath (5 linhas de 1 bit):** Para fins didáticos, a emissão dos sinais de controle foi externalizada em cinco pinos de acionamento manual, permitindo ao operador atuar como Unidade de Controle:  
  * MAR\_Load: Habilita a escrita (WE) no registrador MAR.  
  * RAM\_Read\_MBR: Habilita simultaneamente a saída de dados (OE) da memória RAM e a escrita (WE) no registrador MBR.  
  * IR\_Load: Habilita a escrita (WE) no registrador de instrução (IR).  
  * PC\_Inc: Aciona a entrada de contagem (ct) do Contador de Programa (PC), incrementando o endereço atual em \+1.  
  * AC\_Exec: Habilita a escrita (WE) no Acumulador (AC) para armazenar a soma calculada pela ULA.  
* **Caminho e Barramento de Endereços (8 bits, unidirecional):** Conecta a saída do contador PC à entrada de dados do MAR e, a partir da saída do MAR, alimenta a porta de endereçamento A da memória principal (RAM 256 x 8).  
* **Barramento de Dados (8 bits) e Pinos de E/S:** Transporta o byte lido da saída da RAM até a entrada do MBR. A partir da saída do MBR, o caminho de dados bifurca-se para alimentar a entrada do IR e a primeira entrada da ULA (implementada com um somador binário *Adder* de 8 bits). A saída da ULA alimenta o registrador AC, cuja saída é exibida em binário no pino de saída Monitor (8 bits) e realimenta a segunda entrada da ULA (AC \+ MBR). O circuito dispõe ainda de um pino de entrada de 8 bits (Teclado) conectado à entrada de dados da RAM.

*(Insira aqui a imagem ou captura de tela do circuito no Logisim-Evolution e do Simulador Web)*

A Figura 1 apresenta o diagrama geral da arquitetura implementada para a NeoCore Tech, destacando a integração visual entre a CPU (ULA, registradores PC, MAR, MBR, IR, AC e linhas da Unidade de Controle), a hierarquia de memória (RAM e representação do buffer de Cache) e os dispositivos de entrada (Teclado) e saída (Monitor) interligados pelos barramentos de dados, endereços e controle.

## **5.3. Caso de Teste: Simulação Passo a Passo**

Para validar o funcionamento coordenado das transferências entre registradores, configurou-se um caso de teste de soma acumulada no qual cada byte armazenado na memória é processado diretamente como operando imediato (uma vez que o protótipo atual não particiona o byte em campos de *opcode* e operando).

Os primeiros endereços da memória principal foram inicializados com RAM\[00h\] \= 05h (5 decimal) e RAM\[01h\] \= 03h (3 decimal), iniciando todos os registradores com o valor 00h.

**Passo 1 — Busca / Fetch Parte 1 (T0: MAR ← PC):**  
Ativa-se o sinal MAR\_Load \= 1 e aplica-se um pulso de CLOCK. O endereço 00h contido no PC é copiado para o MAR, selecionando a linha 00h da memória RAM pelo barramento de endereços.

**Passo 2 — Busca / Fetch Parte 2 (T1: MBR ← RAM\[MAR\]):**  
Desativa-se MAR\_Load \= 0 e ativa-se RAM\_Read\_MBR \= 1. No pulso de CLOCK, a RAM disponibiliza o byte 05h no barramento de dados e o registrador MBR armazena esse valor (MBR \= 05h).

**Passo 3 — Busca Parte 3 e Decodificação (T2: IR ← MBR; PC ← PC \+ 1 e Decode):**  
Desativa-se RAM\_Read\_MBR \= 0 e ativam-se juntos os sinais IR\_Load \= 1 e PC\_Inc \= 1\. Com o pulso de CLOCK, a palavra 05h (00000101 em binário) vai para o IR e o contador PC avança para 01h. Na etapa de decodificação (*Decode*), os 4 bits mais significativos (0000) são interpretados como o código de operação (*opcode*) da instrução de adição imediata (ADD), enquanto os 4 bits menos significativos (0101) representam o operando 5, orientando o acionamento do sinal de execução na etapa seguinte.

**Passo 4 — Execução / Execute (T3: AC ← AC \+ MBR):**  
Desativam-se os sinais anteriores e ativa-se AC\_Exec \= 1. O somador da ULA realiza a adição entre o valor atual do AC (00h) e o valor do MBR (05h). Na subida do CLOCK, o resultado 05h é gravado no AC e exibido imediatamente no pino Monitor como 00000101.

**Passo 5 — Segundo Ciclo Completo (T4 a T7):**  
Repete-se a sequência de quatro micro-operações para o endereço 01h apontado pelo PC (T4: MAR ← PC, T5: MBR ← RAM\[MAR\], T6: IR ← MBR; PC ← PC \+ 1 e T7: AC ← AC \+ MBR). O MAR recebe 01h, o MBR lê o segundo byte da memória (RAM\[01h\] \= 03h), o IR atualiza-se para 03h e o PC é incrementado para 02h. Ao acionar AC\_Exec \= 1 no passo T7, a ULA soma o valor acumulado no AC (05h) ao novo valor no MBR (03h), resultando em AC \= 08h (8 em decimal) e exibindo 00001000 no pino Monitor.

# **6\. Conclusões e Considerações Finais**

O desenvolvimento do circuito no Logisim-Evolution, aliado ao simulador web interativo, cumpriu o propósito pedagógico delineado junto à NeoCore Tech: transformar o estudo das transferências entre registradores em uma experiência visual e manipulável. Ao permitir que o estudante atue como a própria Unidade de Controle — acionando manualmente cada sinal de habilitação e observando o tráfego de palavras de 8 bits entre memória, registradores e ULA —, a Prova de Conceito torna transparente a mecânica síncrona do caminho de dados (*datapath*).

Como limitação deliberada deste primeiro recorte, o circuito opera exclusivamente com controle manual e trata os bytes lidos da memória como operandos diretos de soma, não dispondo de conjunto de instruções (ISA) codificado, decodificador automático, indicadores de estado (flags) ou instrução de parada (HLT).

Respondendo à questão central do projeto sobre como os componentes do computador trabalham de forma coordenada para buscar, interpretar e executar uma instrução, a simulação comprova que o processamento ocorre por uma ação sincronizada pelo sinal de clock:

* **Busca coordenada:** O contador PC indica o endereço atual, o MAR aponta essa posição pelo barramento de endereços e a memória entrega a palavra ao MBR através do barramento de dados.  
* **Interpretação:** O registrador IR guarda a instrução recebida para que a Unidade de Controle identifique a operação nos bits do código e acione os sinais elétricos do barramento de controle.  
* **Execução e saída:** A ULA recebe os operandos vindos do acumulador (AC) e do MBR, realiza o cálculo aritmético e grava o resultado de volta no AC para exibição imediata no periférico de saída (Monitor).

# **7\. Referências**

STALLINGS, William. Arquitetura e organização de computadores — 8\. ed. — São Paulo : Pearson Pratice Hall, 2010\.  
TANENBAUM, Andrew S.; Todd Austin. Organização estruturada de computadores; tradução: Daniel Vieira; revisão técnica: Wagner Luiz \- Zucchi. \-- São Paulo: Pearson Prentice Hall, 2013\.  
Andrew S. Tanenbaum; Herbert Bos. Sistemas operacionais modernos; tradução: Jorge Ritter; revisão técnica: Raphael Y. de Camargo. \- 4\. ed. – São Paulo: Pearson Education do Brasil, 2016\.  
Wikipedia. Arquitetura de von Neumann: [https\://pt.wikipedia.org/wiki/Arquitetura\_de\_von\_Neumann](https://pt.wikipedia.org/wiki/Arquitetura_de_von_Neumann)  
Wikipedia. Arquitetura de Harvard e Arquitetura modificada de Harvard: [https\://pt.wikipedia.org/wiki/Arquitetura\_Harvard](https://pt.wikipedia.org/wiki/Arquitetura_Harvard) e [https\://en.wikipedia.org/wiki/Modified\_Harvard\_architecture](https://en.wikipedia.org/wiki/Modified_Harvard_architecture)  
Wikipedia. RISC E CISC: [https\://pt.wikipedia.org/wiki/RISC](https://pt.wikipedia.org/wiki/RISC) e [https\://pt.wikipedia.org/wiki/CISC](https://pt.wikipedia.org/wiki/CISC)  
Wikipedia. Componentes da CPU: [https\://pt.wikipedia.org/wiki/Unidade\_central\_de\_processamento](https://pt.wikipedia.org/wiki/Unidade_central_de_processamento)  
Wikipedia. Barramentos: [https\://pt.wikipedia.org/wiki/Barramento\_(computa%C3%A7%C3%A3o)](https://pt.wikipedia.org/wiki/Barramento_\(computa%C3%A7%C3%A3o\))  
Wikipedia. Ciclo de instrução: [https\://en.wikipedia.org/wiki/Instruction\_cycle](https://en.wikipedia.org/wiki/Instruction_cycle)