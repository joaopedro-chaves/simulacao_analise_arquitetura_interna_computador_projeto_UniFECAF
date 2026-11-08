# Roteiro Completo do Vídeo Pitch — NeoCore Computer Lab (Até 4 Minutos)

**Projeto:** NeoCore Computer Lab — Simulação e Análise da Arquitetura Interna de um Computador  
**Disciplina:** *Computer Architecture and Organization* — UniFECAF  
**Autor:** João Pedro Vieira da Costa Chaves (`[PREENCHER: inserir RA e demais integrantes, se houver]`)  
**Meta de Duração:** 3min40s (margem de segurança de 20s para o limite de 4min00s)  
**Volume Total de Narração:** 539 palavras (ritmo médio de ~145 palavras/minuto)

---

## 1. Roteiro Cronometrado em Tabela

| Tempo | Tela / O que mostrar (tela exata, componente destacado, clique ou botão a usar) | Narração (texto exato a falar) | Nº de palavras |
| :--- | :--- | :--- | :---: |
| **0:00–0:20**<br>*(Bloco 1: Abertura e Objetivo — Item 1)* | **Tela 1 — Simulador Web (`index.html`) em tela cheia (zoom 100%).**<br>Mostrar a visão geral do circuito SVG `#logisim-svg` e alternar rapidamente (2s) para a janela do **Logisim-Evolution (`neocore_cpu.circ`)**, voltando ao Simulador Web. | Olá, eu sou João Pedro Vieira da Costa Chaves. Apresento à NeoCore Tech a prova de conceito do NeoCore Computer Lab. Eu desenvolvi um circuito no Logisim-Evolution e um simulador web interativo para mostrar como o processador busca, interpreta e executa instruções. | 42 |
| **0:20–0:45**<br>*(Bloco 2: Arquitetura Escolhida — Item 2)* | **Tela 2 — Diagrama da Figura 1 (ou Simulador Web com botão `Explicar` ativo na barra inferior `#dock`).**<br>Passar o cursor sobre a `RAM 256 x 8`, o `AC (Acumulador)` e o pino `CLOCK (1 Hz)` no canto superior esquerdo do SVG. | Eu escolhi a arquitetura de Von Neumann de oito bits, com organização baseada em acumulador. Nela, instruções e dados compartilham a mesma memória principal. O recorte didático de oito bits e o relógio de um hertz eliminam a complexidade visual, permitindo acompanhar cada transferência binária. | 45 |
| **0:45–1:10**<br>*(Bloco 3: Componentes da CPU — Item 3)* | **Tela 3 — Simulador Web (`index.html`) com zoom de 120% na área da CPU.**<br>Com o modo `Explicar` ativo, clicar/apontar sequencialmente nos blocos SVG: `#val-PC`, `#val-MAR`, `#val-MBR`, `#val-IR`, `ULA (Adder 8 bits)` e `#val-AC`, exibindo o card contextual `#ctx-card`. | Na Unidade Central de Processamento, a CPU, implementei cinco registradores de oito bits. O Contador de Programa, PC, guarda o endereço seguinte. O Registrador de Endereço de Memória, MAR, aponta a posição na memória. O Registrador de Buffer de Memória, MBR, recebe o byte lido. O Registrador de Instrução, IR, retém a instrução. E a Unidade Lógica e Aritmética, ULA, soma o MBR ao Acumulador, AC. | 66 |
| **1:10–1:35**<br>*(Bloco 4: Memória e Barramentos — Item 4)* | **Tela 4 — Simulador Web (`index.html`) com a Gaveta Lateral (`#drawer`) aberta no card `Memória RAM` e filtros de fios na barra `#dock`.**<br>Apontar para a `RAM 256 x 8` (`00h`–`FFh`), clicar nos botões de filtro `Endereço` (azul), `Dados` (verde) e `Controle` (laranja/vermelho) na barra inferior para destacar cada barramento. | A Memória de Acesso Aleatório, RAM, tem duzentas e cinquenta e seis posições de oito bits. Na hierarquia de memória, a cache reduz o tempo de acesso à RAM. Três barramentos interligam o sistema. O de endereços liga PC, MAR e RAM. O de dados conecta RAM, MBR, IR, ULA, AC e Monitor. Já o de controle possui cinco sinais. | 60 |
| **1:35–1:48**<br>*(Bloco 5.1: Demonstração — Preparação 5 + 3 — Item 5)* | **Tela 5 — Simulador Web (`index.html`) com a Gaveta (`#drawer`) aberta mostrando os cards `Registradores`, `Memória RAM` e `Passo a Passo Guiado`.**<br>No seletor `#demo-select`, manter `Demo 0: Soma 5+3 (Manual SAP-1)`. Clicar no botão `Reset` (`resetSimulation`). Destacar `RAM[00h] = 05h`, `RAM[01h] = 03h` e a tabela de registradores em `00h`. | Vou demonstrar a soma de cinco mais três. Na RAM, o endereço zero zero guarda zero cinco hexadecimal, e o endereço zero um guarda zero três. Todos os registradores começam em zero zero. | 33 |
| **1:48–2:02**<br>*(Bloco 5.2: Demonstração — Pulso T0: Fetch Endereço)* | **Tela 5 — Simulador Web (`index.html`).**<br>Clicar no pino `MAR_Load` no SVG (ou no botão `Próximo Passo` do guia) e clicar em `Pulso de Clock`. Mostrar o fio azul `wire-pc-mar` brilhando e o valor de `#val-MAR` em `00h` apontando para `RAM[00h]`. | No pulso T0, fase de busca, aciono o sinal MAR_Load no barramento de controle. Pelo barramento de endereços, o PC transfere zero zero para o MAR, que endereça a posição zero zero da RAM. | 34 |
| **2:02–2:16**<br>*(Bloco 5.3: Demonstração — Pulso T1: Fetch Memória)* | **Tela 5 — Simulador Web (`index.html`).**<br>Desativar `MAR_Load`, clicar no pino `RAM_Read_MBR` e clicar em `Pulso de Clock`. Mostrar o fio verde `wire-ram-mbr` animando e `#val-MBR` mudando de `00h` para `05h` na tabela e no SVG. | No pulso T1, ativo o sinal RAM_Read_MBR no controle. A RAM lê o endereço zero zero do MAR e envia zero cinco pelo barramento de dados. Assim, o MBR muda para zero cinco hexadecimal. | 34 |
| **2:16–2:36**<br>*(Bloco 5.4: Demonstração — Pulso T2: Decode e Avanço do PC)* | **Tela 5 — Simulador Web (`index.html`).**<br>Ativar os pinos `IR_Load` e `PC_Inc` simultaneamente e clicar em `Pulso de Clock`. Destacar `#val-IR` mudando para `05h`, `#val-PC` mudando para `01h` e apontar para o bloco `Decoder UC` (`#box-decoder`). | No pulso T2, aciono IR_Load e PC_Inc juntos. Pelo barramento de dados, o IR recebe zero cinco do MBR, e o PC avança para zero um. Na decodificação, o estudante lê o IR e decide o próximo sinal. Uma Unidade de Controle real faria essa leitura automaticamente em hardware. | 49 |
| **2:36–2:48**<br>*(Bloco 5.5: Demonstração — Pulso T3: Execute na ULA)* | **Tela 5 — Simulador Web (`index.html`).**<br>Ativar apenas o pino `AC_Exec` e clicar em `Pulso de Clock`. Mostrar os fios `wire-mbr-ula`, `wire-ac-ula` e `wire-ula-ac` iluminados e `#val-AC` mudando de `00h` para `05h`. | No pulso T3, fase de execução, ativo o sinal AC_Exec. Pelo caminho de dados, a ULA soma zero zero do AC com zero cinco do MBR. O AC muda para zero cinco hexadecimal. | 33 |
| **2:48–3:00**<br>*(Bloco 5.6: Demonstração — 2º Ciclo T4 a T7: Soma 5 + 3 = 8)* | **Tela 5 → Tela 6 — Simulador Web (`index.html`) e corte rápido para o Logisim-Evolution (`neocore_cpu.circ`).**<br>Avançar os passos `T4`, `T5`, `T6` e `T7` pelo botão `Próximo Passo` do guia (ou `Auto-Clock 1 Hz`). Destacar `#val-AC = 08h` e o pino `Monitor` exibindo `00001000` (tanto no Web quanto no Logisim). | Nos pulsos T4 a T7, repetimos o ciclo para o endereço zero um: MAR_Load em T4, RAM_Read_MBR trazendo zero três ao MBR em T5, IR_Load e PC_Inc em T6, e AC_Exec em T7. A ULA soma cinco mais três, o AC muda para zero oito hexadecimal e o Monitor mostra zero zero zero zero um zero zero zero. | 58 |
| **3:00–3:25**<br>*(Bloco 6: Fluxo da Instrução, Síntese Coordenada e Limitações — Item 6)* | **Tela 7 — Simulador Web (`index.html`) mostrando a lista `#rtl-list` (Histórico RTL `T0`–`T7`) e alternando brevemente a chave `Modo Manual / UC Automática` no topo.** | Em síntese, os componentes operam coordenados pelo clock: PC e MAR endereçam a RAM, o MBR entrega a palavra ao IR para interpretação, e os sinais de controle comandam a soma na ULA e a gravação no AC. No circuito base não há controle automático nem cache física, adicionados como extensão no simulador web. | 54 |
| **3:25–3:40**<br>*(Bloco 7: Valor para o Estudante e Fechamento — Item 7)* | **Tela 8 — Simulador Web (`index.html`) destacando a tabela multi-base (`HEX / BIN / DEC`) e os fios animados.** | Com isso, o estudante enxerga cada barramento ativo, compara bases numéricas e compreende na prática o ciclo de máquina. Obrigado pela atenção; os links do projeto estão na descrição do vídeo. | 31 |

## 2. Lista de Gravação (*Shot List*) e Preparação do Ambiente

### 2.1. Ordem das Telas (Abas / Janelas abertas lado a lado ou via `Alt+Tab`)
1. **Janela 1 (Principal — 85% do vídeo):** Navegador em tela cheia (`F11`) com o Simulador Web (`index.html`) aberto em tema escuro ou claro (preferencialmente o tema padrão com alto contraste dos barramentos).
2. **Janela 2 (Apoio — ~10% do vídeo, nos tempos `0:08–0:14` e `2:54–3:00`):** *Logisim-Evolution* v5.0.0 com o arquivo `src/neocore_cpu.circ` aberto, posicionado no estado final (`AC = 08h`, `Monitor = 00001000`) ou pronto para pulsar.
3. **Janela 3 (Opcional — ~5% do vídeo, no tempo `0:20–0:30`):** Diagrama da Figura 1 do relatório PDF (ou permanecer no próprio diagrama SVG do Simulador Web usando o botão `Explicar`).

### 2.2. Configurações Recomendadas Antes de Iniciar a Gravação
- **Resolução da tela:** `1920x1080` (1080p) com escala do navegador em `100%`.
- **Zoom do Canvas SVG (`#logisim-svg`):**
  - Nos blocos `0:00–0:45` e `1:10–1:35`: manter enquadramento padrão (`Resetar Zoom`, `100%`) para exibir todos os blocos simultaneamente.
  - No bloco `0:45–1:10`: aplicar um leve zoom (`115%–120%`) centralizando os 5 registradores e a ULA.
  - No bloco `1:35–3:00` (Demonstração): abrir a **Gaveta Lateral (`#drawer`)** à direita para que o diagrama SVG fique visível à esquerda e os cards **`Passo a Passo Guiado`**, **`Registradores (HEX / BIN / DEC)`** e **`Memória RAM`** fiquem visíveis simultaneamente à direita.
- **Uso do Passo a Passo vs. Auto-Clock:**
  - Para os pulsos **`T0` a `T3`** (`1:48–2:48`): usar **acionamento passo a passo** (clicando no botão `Próximo Passo` do card *Passo a Passo Guiado* ou clicando nos pinos e no botão `Pulso de Clock`), pois isso sincroniza perfeitamente o efeito visual dos barramentos com a sua fala sem correr o risco de o *clock* avançar antes de você terminar a frase.
  - Para os pulsos **`T4` a `T7`** (`2:48–3:00`): clicar rapidamente nos passos `5, 6, 7 e 8` do guia ou ativar o **`Auto-Clock` em `1 Hz` (ou `2 Hz`)** para completar o segundo ciclo enquanto você resume os quatro pulsos finais.

### 2.3. Valores Iniciais a Preparar Antes de Apertar "Gravar"
- No seletor superior da barra de ferramentas (`#demo-select`), selecionar **`Demo 0: Soma 5+3 (Manual SAP-1)`** e clicar em **`Reset`**.
- Conferir se a RAM exibe na primeira página (`00h–0Fh`):
  - `RAM[00h] = 05`
  - `RAM[01h] = 03`
  - `RAM[02h] = 0A`
  - `RAM[03h] = 00`
- Conferir se todos os registradores na tabela (`PC`, `MAR`, `MBR`, `IR`, `AC`) estão em `00h` (`00000000` binário, `0` decimal) e se todos os 5 pinos de controle estão em `0` (desligados).
- Conferir se todas as 4 camadas de fios (`Clock`, `Controle`, `Endereço`, `Dados`) estão ativas.

---

## 3. Versão Enxuta de Emergência (Corte de ~20 Segundos / -50 Palavras)

Caso, durante o ensaio, a gravação ultrapasse 3min50s ou se aproxime dos 4 minutos, aplique estes **3 cortes diretos** (que reduzem **52 palavras**, economizando **~22 segundos** sem remover nenhum dos 7 itens obrigatórios do enunciado):

1. **Corte 1 — No Bloco 2 (`0:20–0:45`, economiza 13 palavras / ~5s):**
   - *Substituir a última frase por:* `"O recorte de oito bits a um hertz permite acompanhar cada transferência."`
2. **Corte 2 — No Bloco 5.6 (`2:48–3:00`, economiza 24 palavras / ~10s):**
   - *Substituir o bloco por:* `"Nos pulsos T4 a T7, repetimos os mesmos quatro sinais para o endereço zero um. A ULA soma cinco mais três, levando o AC a zero oito hexadecimal e o Monitor a zero zero zero zero um zero zero zero."`
3. **Corte 3 — No Bloco 6 (`3:00–3:25`, economiza 15 palavras / ~7s):**
   - *Substituir a primeira frase por:* `"Em síntese, PC e MAR endereçam a RAM, o MBR alimenta o IR, e o controle comanda a ULA e o AC a cada clock."`

*(Com os 3 cortes aplicados, o roteiro cai de 539 para **487 palavras**, fechando em aproximadamente **3min18s**).*

---

## 4. Título, Descrição e Etiquetas para o YouTube (Modo Não Listado)

- **Visibilidade recomendada no YouTube:** `Não listado` (*Unlisted*) — qualquer pessoa com o link (incluindo o professor avaliador) pode assistir sem necessidade de login ou permissão especial.
- **Título sugerido:**
  `NeoCore Computer Lab — Simulação e Análise da Arquitetura Interna de um Computador (CPU 8 bits)`
- **Descrição sugerida para o YouTube:**
  ```text
  Vídeo Pitch referente à Parte Prática do projeto "NeoCore Computer Lab — Simulação e Análise da Arquitetura Interna de um Computador", desenvolvido para a disciplina Computer Architecture and Organization (Centro Universitário UniFECAF).

  Autor: João Pedro Vieira da Costa Chaves [PREENCHER: inserir RA e demais integrantes, se houver]

  Resumo da Arquitetura (Prova de Conceito):
  - Modelo de Von Neumann de 8 bits com organização baseada em Acumulador (inspirada no SAP-1), operando com clock síncrono de 1,0 Hz.
  - Componentes da CPU: Contador de Programa (PC), Registrador de Endereço de Memória (MAR), Registrador de Buffer de Memória (MBR), Registrador de Instrução (IR), Acumulador (AC) e Unidade Lógica e Aritmética (ULA somadora de 8 bits).
  - Memória e E/S: Memória Principal RAM 256 x 8 bits (00h–FFh), entrada de 8 bits (Teclado) e saída de 8 bits (Monitor), além de extensão didática no simulador web com UC Automática (FSM), ISA de 8 bits e Cache L1 de 4 linhas com mapeamento direto.
  - Barramentos: Endereços (8 bits), Dados (8 bits) e Controle (MAR_Load, RAM_Read_MBR, IR_Load, PC_Inc e AC_Exec).
  - Caso de Teste Demonstrado: Soma 5 + 3 = 8 (RAM[00h] = 05h, RAM[01h] = 03h → AC = 08h / Monitor = 00001000 após os pulsos T0–T7).

  Links do Projeto:
  - Simulador Interativo Web (acesso direto): https://joaopedro-chaves.github.io/simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/
  - Repositório do Projeto e Circuito Logisim-Evolution (neocore_cpu.circ): https://github.com/joaopedro-chaves/simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF
  - Documentação Técnica (PDF / Google Docs): https://docs.google.com/document/d/1iN7AbfhUC7neMgXAucNmNMgSPVMIgc1Fp4ughGsdD_E/edit?usp=sharing
  - Vídeo Pitch (YouTube): https://youtu.be/d8o1PwhjVuo
  ```
- **Etiquetas (Tags) sugeridas:**
  `Arquitetura de Computadores, Organização de Computadores, Von Neumann, SAP-1, CPU 8 bits, Ciclo Fetch Decode Execute, Logisim Evolution, Simulador de CPU, NeoCore Tech, UniFECAF`

---

## 5. Checklist Final de Auditoria antes do Envio

### 5.1. Rastreabilidade dos 7 Itens Obrigatórios do Enunciado no Vídeo
- [x] **1. Objetivo do simulador desenvolvido:** aparece em **`0:00–0:20`** (Bloco 1).
- [x] **2. Arquitetura escolhida (Von Neumann 8 bits com acumulador e justificativa):** aparece em **`0:20–0:45`** (Bloco 2).
- [x] **3. Principais componentes da CPU (`PC`, `MAR`, `MBR`, `IR`, `ULA`, `AC`):** aparece em **`0:45–1:10`** (Bloco 3).
- [x] **4. Organização da memória (`RAM 256 x 8` e conceito de `Cache`) e dos barramentos (endereços, dados e controle):** aparece em **`1:10–1:35`** (Bloco 4).
- [x] **5. Demonstração prática do ciclo *fetch–decode–execute* (`T0`–`T3` e `T4`–`T7`, caso `5 + 3 = 8`):** aparece em **`1:35–3:00`** (Bloco 5).
- [x] **6. Fluxo de uma instrução pela arquitetura, síntese coordenada e limitações da PoC:** aparece em **`3:00–3:25`** (Bloco 6).
- [x] **7. Como a solução ajuda um estudante a compreender o funcionamento interno de um computador:** aparece em **`3:25–3:40`** (Bloco 7).

### 5.2. Conferência Técnica de Entrega
- [x] O vídeo final exportado possui duração **menor ou igual a 4 minutos (`04:00`)**?
- [x] O áudio da narração está claro, compreensível e sem ruídos ou música de fundo encobrindo a voz?
- [x] O vídeo foi publicado no YouTube como **Não listado** (ou *Público*) e o link abre normalmente em uma janela anônima do navegador?
- [x] O link do vídeo no YouTube foi inserido dentro do **documento PDF da Parte Teórica**?
- [x] Os 3 itens da entrega final foram verificados: **(1) PDF da Parte Teórica**, **(2) Arquivo/link da simulação prática (`neocore_cpu.circ` + simulador web)** e **(3) Link funcional do Vídeo Pitch**?

---

## 6. Pontos que Dependem de Decisão Sua (Ambiguidades do `ESTADO DA PRÁTICA`)

Assim como ocorreu no relatório escrito, as caixas de seleção `- [ ]` do bloco `ESTADO DA PRÁTICA` no prompt vieram desmarcadas, e o seu projeto possui **dois modos reais implementados**:
1. **O Modo Manual (`Demo 0` — idêntico ao circuito `neocore_cpu.circ` do Logisim-Evolution):** controle manual pelos 5 pinos (`MAR_Load`, `RAM_Read_MBR`, `IR_Load`, `PC_Inc`, `AC_Exec`), decode feito pelo próprio estudante e ausência de cache física no `.circ`.
2. **O Modo Automático do Simulador Web (`Demos 1 a 3` em `index.html` / `src/script.js`):** extensão em software que adiciona UC automática (máquina de estados `T0`–`T6`), ISA de 8 bits (`4 bits opcode + 4 bits operando`: `ADDI`, `LDI`, `LDA`, `ADD`, `STA`, `OUT`, `IN`, `HLT`) e Cache L1 didática de 4 linhas × 2 bytes.

**Como o roteiro acima tratou isso e o que você pode decidir:**
- O roteiro principal acima executa a demonstração de `1:35 a 3:00` no **Modo Manual (`Demo 0`)**, porque as instruções do seu prompt pediram explicitamente para percorrer `T0` a `T3` e `T4` a `T7` com os 5 sinais (`MAR_Load`, `RAM_Read_MBR`, `IR_Load`, `PC_Inc`, `AC_Exec`) e destacar que o estudante realiza o *decode*, enquanto no **Bloco 6 (`3:00–3:25`)** menciona em uma frase que o controle automático e a cache foram adicionados como extensão em software no Modo Automático do simulador web.
- **Decisão opcional:** Se você preferir apresentar a PoC **exclusivamente** como manual (sem nem mencionar o Modo Automático do simulador web), basta trocar a última frase do **Bloco 6 (`3:00–3:25`)** por:
  > *"Como limitação desta prova de conceito, não há Unidade de Controle automática nem memória cache implementada no circuito, que ficam como próximo passo de evolução."*
- **Campos `[PREENCHER]` para completar antes de publicar no YouTube:**
  1. Confirmar se o trabalho é individual (**João Pedro Vieira da Costa Chaves**, conforme constava em `docs/ROTEIRO.md`) ou se há outros integrantes/RAs para incluir na descrição do vídeo;
  2. Inserir na descrição do YouTube os links reais (`[PREENCHER: link do GitHub Pages / deploy]` e `[PREENCHER: link do repositório GitHub]`).
