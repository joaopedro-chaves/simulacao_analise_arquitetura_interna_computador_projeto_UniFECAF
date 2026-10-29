Fazer uma prova conceito de como funciona uma arquitetura do computador, com todos os componentes e como eles se comunicam.

Modelar uma CPU  com seus componentes, que seja entendivel e didatico que simule "fetch, decode e execute" com os componentes básicos.

Como é executado o ciclo de instrução e como os componentes se comunicam coordenadamente?

## Definições

Antes de avançar, vou definir algumas definições que serão abordadas no projeto

Arquitetura de von Neumann: https://pt.wikipedia.org/wiki/Arquitetura_de_von_Neumann
Arquitetura de Harvard: https://pt.wikipedia.org/wiki/Arquitetura_Harvard
RISC E CISC: https://pt.wikipedia.org/wiki/RISC e https://pt.wikipedia.org/wiki/CISC
Componentes da CPU: https://pt.wikipedia.org/wiki/Unidade_central_de_processamento
Barramentos: https://pt.wikipedia.org/wiki/Barramento_(computa%C3%A7%C3%A3o)
Ciclo de instrução: https://en.wikipedia.org/wiki/Instruction_cycle

Esses são os links que vou adicionar para base junto com os livros:

Arquitetura e organização de computadores de William Stallings. — 8. ed. — São Paulo : Pearson Pratice Hall, 2010

Organização estruturada de computadores de Andrew S. Tanenbaum, Todd Austin; tradução Daniel Vieira; revisão técnica Wagner Luiz - Zucchi. -- São Paulo : Pearson Prentice Hall, 2013.

Sistemas operacionais modernos / Andrew S. Tanenbaum, Herbert Bos; tradução Jorge Ritter; revisão técnica Raphael Y. de Camargo.  - 4. ed. – São Paulo: Pearson Education do Brasil, 2016.

Os links adicionados são somente do Wikipedia como fonte confiável de informação.

## Arquitetura

> Vamos utilizar a arquitetura usadas em processadores x86/x64 (Intel e AMD) pois e o computador na sua maior essência

Dependendo dos requisitos e do tempo podemos incorporar outras provas conceitos ainda mais didáticos, como um jogo ou um mapa interativo.

Entretanto, possa ser mais trabalhoso por conta de exigir explicações de camadas adicionais de tradução e hibridização de hardware. Mas podemos usar isso para demostra domínio no assunto.

A primeira artefato a ser criada é a parte teórica no Google Docs

> Veja o [Parte Teórica](https://docs.google.com/document/d/1iN7AbfhUC7neMgXAucNmNMgSPVMIgc1Fp4ughGsdD_E/edit?usp=sharing) 

A arquitetura escolhida pode ser mais complexa pelo nivel de abstração, mas o objetivo é mostrar como funciona a arquitetura do computador e como os componentes se comunicam, baixando o nível de abstração para que seja didático e compreensível.

## Circuto no Logisim-evolution

Um dos requisitos é a criação e a utilização de circutos para demonstrar, Logisim-evolution é uma ferramenta que permite a criação de circutos lógicos, com ele podemos criar circutos que simulam o funcionamento de um computador, como uma CPU, memória, barramentos, etc.

A criação do circuto do projeto, não foi uma tarefa simples, pois exigiu a criação de vários circutos independentes para demonstrar o funcionamento de cada componente. Principalmente na ligação dos componentes para que a CPU possa se comunicar com a memória e os barramentos.

Uma das abordagens que utilizei foi o uso IA, não para fazer o circuto pronto ou o trabalho pronto, mas para auxiliar na compreensão do funcionamento do circuto e auxiliar na montagem do circuto.

Houve um trabalho muito trabalho na compreenção e na construção do circuito. Um gargalo que teve foi na parte da compreensão, ligação e na execulção, embora não tenho conhecimento no programa Logisim-evolution. a parte de construção foi bem sucedida. entretanto na simulação não ficou bem didatico.

minha ideia para o proximo passo é utilizar o circuto criado com os assets criados no logisim-evolution e criar uma simulação web utilizando HTML, CSS e JavaScript, com uma interface mais amigavel e didatica para demonstrar o funcionamento do circuto e auxiliar na compreensão do funcionamento do circuto e auxiliar na montagem do circuto.

Está no processo de avaliação.