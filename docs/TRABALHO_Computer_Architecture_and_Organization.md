# 1.  TÍTULO:

NeoCore Computer Lab — Simulação e Análise da Arquitetura Interna de um Computador

# 2.  DESAFIO:

A  NeoCore  Tech  é  uma  empresa  de  tecnologia  educacional  especializada  no desenvolvimento  de  soluções para ensino técnico e superior. A empresa está criando um novo  simulador  didático  de  arquitetura  de  computadores  destinado  a  escolas  técnicas, universidades e centros de formação profissional.

O objetivo do produto é permitir que estudantes compreendam, de forma visual e prática, como um computador processa informações internamente. Para isso, o simulador deverá representar  de  maneira  coerente  os  principais  componentes  de  uma  arquitetura computacional, incluindo processador, memória, barramentos e dispositivos de entrada e saída.

A  equipe  pedagógica  da  NeoCore  identificou  que  muitos  estudantes  conseguem  utilizar computadores e programar aplicações, mas possuem dificuldade para compreender o que acontece internamente quando uma instrução é executada. Conceitos como registradores, Unidade  Lógica  e  Aritmética  (ULA/ALU),  Unidade  de  Controle,  memória cache, memória principal, barramentos e ciclo de máquina acabam sendo estudados de forma isolada, sem que o aluno consiga visualizar a interação entre eles.

Você foi contratado(a) como Analista de Arquitetura de Computadores para desenvolver uma prova de conceito que servirá como referência para o novo simulador da empresa.

Sua  missão  será  projetar  uma  arquitetura  computacional  didática  e  tecnicamente coerente,  representando  o  fluxo  de  informações  entre  CPU,  memória  e  dispositivos  de entrada  e  saída.  A  solução  deverá  demonstrar  como  uma  instrução  percorre  o  ciclo fetch–decode–execute,  indicando  quais  componentes  participam  de  cada  etapa  e como os dados são movimentados internamente.

==🟠O projeto deverá considerar uma arquitetura de referência, como Von Neumann, e poderá incorporar  características  de  organizações  RISC  ou  outras  abordagens  estudadas  na disciplina, desde que as escolhas sejam justificadas.==

A CPU deverá ser representada com seus principais componentes, incluindo ULA, Unidade de  Controle  e  registradores,  enquanto  o  subsistema  de  memória  deverá  demonstrar  a relação entre registradores, cache, memória principal e armazenamento. Também deverá ser  representado  o  papel  dos  barramentos  de  dados,  endereços  e  controle  na comunicação entre os componentes.

Além da representação visual, espera-se que o estudante demonstre o funcionamento da arquitetura  por  meio  de  uma  simulação  ou  modelagem  funcional.  O  objetivo  não  é simplesmente  desenhar  componentes conectados, mas demonstrar como o computador executa uma instrução e como os dados percorrem a arquitetura.

Ao final, o projeto deverá responder à seguinte questão:

Como  os  diferentes  componentes  de  um  computador trabalham de forma coordenada para buscar, interpretar e executar uma instrução?


# 3.  FONTE DE PESQUISA:

Todas  as  unidades,  videoaulas,  textos-base,  atividades  e  materiais  complementares disponibilizados na disciplina Computer Architecture and Organization

TANENBAUM, A. S. Organização Estruturada de Computadores. Pearson.

STALLINGS, W. Arquitetura e Organização de Computadores. LTC.

Manual da ferramenta Logisim: https://github.com/logisim-evolution/logisim-evolution

Manual da ferramenta Tinkercad Circuits: https://www.tinkercad.com/learn/circuits

Artigos  e  vídeos  sobre  arquitetura  Von  Neumann,  ALU,  registradores  e  hierarquia  de memória

Documentações sobre RISC vs. CISC, organização da cache, barramentos e dispositivos de E/S

# 4. ENTREGÁVEL E DISTRIBUIÇÃO DA PONTUAÇÃO:

Sua  entrega  final  da  disciplina  Computer  Architecture  and  Organization  será  composta por  3  entregáveis  obrigatórios,  com  o  objetivo  de  demonstrar  domínio  sobre  a organização  interna  de  um  computador  e  capacidade  de  transformar  conceitos  de arquitetura computacional em uma representação funcional e compreensível.

## 1. Parte Teórica — 25% da nota

Entregue um relatório técnico em PDF contendo:

- contextualização da solução proposta para a NeoCore Tech;
- descrição e justificativa da arquitetura escolhida;
- diagrama geral da arquitetura;
- explicação da função da CPU, ULA, Unidade de Controle e registradores;
- descrição da hierarquia de memória e do papel da cache;
- explicação dos barramentos de dados, endereços e controle;
- descrição detalhada do ciclo fetch–decode–execute.

A  documentação  deverá  estar  diretamente  relacionada  à  arquitetura  efetivamente desenvolvida na Parte Prática.

## 2. Parte Prática — 50% da nota

Desenvolva  uma  simulação  ou  modelagem  funcional  da  arquitetura  computacional, contemplando:

- CPU com ULA, Unidade de Controle e registradores;
- memória principal e representação da cache;
- barramentos de dados, endereços e controle;
- dispositivos de entrada e saída;
- fluxo de comunicação entre os componentes;
- demonstração visual do ciclo de execução de uma instrução;
- simulação de pelo menos uma instrução, evidenciando as etapas de busca, decodificação e execução.

O  arquivo da simulação ou projeto deverá ser entregue junto aos demais materiais. Caso seja  utilizada  uma  ferramenta  exclusivamente  gráfica,  as  etapas  de  funcionamento deverão ser claramente identificadas e explicadas.

## 3. Vídeo Pitch — 25% da nota

Grave um vídeo de até 4 minutos, apresentando:

- o objetivo do simulador desenvolvido;
- a arquitetura escolhida;
- os principais componentes da CPU;
- a organização da memória e dos barramentos;
- a demonstração do ciclo fetch–decode–execute;
- o fluxo de uma instrução pela arquitetura;
- como a solução pode ajudar um estudante a compreender o funcionamento interno de um computador.

O  vídeo  deverá  ser  publicado  no  YouTube,  preferencialmente  em modo não listado, ou em outra plataforma que permita acesso para avaliação.

Antes  da submissão, verifique se o PDF, o arquivo da simulação e o link do vídeo estão corretos e acessíveis.