# Especificação da Arquitetura NeoCore Tech 8-bit (Von Neumann)

Documento técnico de especificação do conjunto de instruções (ISA), microarquitetura temporal (T-states), matriz de controle da Unidade de Controle (UC), hierarquia de memória cache didática e rastreabilidade entre o simulador web e o circuito Logisim-Evolution (`neocore_cpu.circ`).

## 1. Conjunto de Instruções (ISA 8-bit)

A arquitetura opera com palavras de 8 bits em formato unificado:
- **Nibble Superior `[7:4]`**: Código de Operação (*Opcode* — 4 bits, permitindo até 16 instruções).
- **Nibble Inferior `[3:0]`**: Operando imediato (*n*) ou endereço direto de memória (*addr* — endereçamento direto nas posições `00h` a `0Fh`).

| Opcode (Hex) | Mnemônico | Operando | RTL (*Register Transfer Language*) | Descrição Funcional |
| :---: | :---: | :---: | :--- | :--- |
| `0x0` | **ADDI** | `n` (4 bits) | `AC ← AC + n` | Soma imediata: adiciona o operando (0 a 15) com extensão de zeros ao Acumulador. |
| `0x1` | **LDI** | `n` (4 bits) | `AC ← n` | Carga imediata: carrega o valor imediato diretamente no Acumulador. |
| `0x2` | **LDA** | `addr` (4 bits) | `AC ← RAM[addr]` | Carga direta: lê o byte da posição de memória `addr` (00h–0Fh) para o Acumulador. |
| `0x3` | **ADD** | `addr` (4 bits) | `AC ← AC + RAM[addr]` | Soma com memória: soma o conteúdo de `RAM[addr]` ao Acumulador. |
| `0x4` | **STA** | `addr` (4 bits) | `RAM[addr] ← AC` | Armazenamento: grava o valor atual do Acumulador na posição de memória `addr`. |
| `0x5` | **OUT** | *(nenhum)* | `SAIDA ← AC` | Saída de dados: transfere o byte do Acumulador para o registrador de saída `SAIDA`. |
| `0x6` | **IN** | *(nenhum)* | `AC ← TECLADO` | Entrada de dados: lê o byte disponível no dispositivo de entrada `TECLADO` para o `AC`. |
| `0xF` | **HLT** | *(nenhum)* | `HALT ← 1` | Parada da máquina: interrompe os pulsos de clock e sinaliza parada do sistema. |
| *Outros* | **NOP** | *(qualquer)* | `(nenhuma)` | Instrução não implementada / NOP: avança sem alterar registradores, sinalizando alerta visual. |

> **Nota Didática:** No operando de memória de 4 bits (`addr`), o alcance direto abrange os endereços `00h`–`0Fh` (16 bytes inferiores da RAM). As instruções imediatas originais do caso de teste do relatório (`05h` = ADDI 5 e `03h` = ADDI 3) mantêm 100% de compatibilidade binária.

## 2. Microarquitetura Temporal: T-states × Fase × RTL

A execução de qualquer instrução é decomposta em pulsos discretos de clock denominados **T-states** ($T_0$ até $T_6$):

### 2.1. Fases Comuns de Busca (Fetch) e Decodificação (Decode)
- **$T_0$ (FETCH A):** `MAR ← PC` (Transfere o contador de programa para o registrador de endereço).
- **$T_1$ (FETCH B):** `MBR ← RAM[MAR]` (Lê a palavra da memória principal via cache L1 para o buffer de dados).
- **$T_2$ (FETCH C):** `IR ← MBR; PC ← PC + 1` (Carrega a instrução no registrador de instrução e incrementa o PC).
- **$T_3$ (DECODE):** Decodificação pura pela UC sem transferência de registradores. Isola o opcode `IR[7:4]`, aciona o decodificador e prepara as linhas de controle para a execução.

### 2.2. Fases de Execução por Instrução (Execute)

| Instrução | $T_4$ (Execute 1) | $T_5$ (Execute 2) | $T_6$ (Execute 3) | Total T-states |
| :--- | :--- | :--- | :--- | :---: |
| **ADDI $n$** | `AC ← AC + n` | — | — | 5 ($T_0..T_4$) |
| **LDI $n$** | `AC ← n` | — | — | 5 ($T_0..T_4$) |
| **LDA $addr$** | `MAR ← IR[3:0]` | `MBR ← RAM[MAR]` | `AC ← MBR` | 7 ($T_0..T_6$) |
| **ADD $addr$** | `MAR ← IR[3:0]` | `MBR ← RAM[MAR]` | `AC ← AC + MBR` | 7 ($T_0..T_6$) |
| **STA $addr$** | `MAR ← IR[3:0]` | `MBR ← AC` | `RAM[MAR] ← MBR` | 7 ($T_0..T_6$) |
| **OUT** | `SAIDA ← AC` | — | — | 5 ($T_0..T_4$) |
| **IN** | `AC ← TECLADO` | — | — | 5 ($T_0..T_4$) |
| **HLT** | `HALT ← 1` | — | — | 5 ($T_0..T_4$) |
| **NOP** | `(sem operação)` | — | — | 5 ($T_0..T_4$) |

## 3. Matriz de Sinais de Controle (Estado × Opcode → Sinais)

A Unidade de Controle atua como uma máquina de estados finitos que gera os seguintes sinais de controle a cada pulso de clock:

- `MAR_Load`: Habilita escrita no MAR (origem: PC ou `IR[3:0]`).
- `RAM_Read`: Habilita leitura na RAM / Cache (OE).
- `RAM_Write`: Habilita escrita na RAM (WE).
- `MBR_Load`: Habilita escrita no MBR.
- `MBR_From_AC`: Define a entrada do MBR (0 = Barramento de Dados da RAM, 1 = Acumulador AC).
- `IR_Load`: Habilita escrita no IR (recebe MBR).
- `PC_Inc`: Habilita incremento do PC (`PC ← PC + 1`).
- `AC_Load`: Habilita escrita no Acumulador AC.
- `ALU_Op`: Seleção da ULA (`ADD` para soma, `PASS` para passagem direta/carga).
- `SAIDA_Load`: Habilita escrita no registrador de saída SAIDA.
- `IN_Read`: Habilita leitura do registrador TECLADO para o barramento interno.
- `HALT`: Sinal de interrupção do gerador de clock.

| T-State / Opcode | MAR_Load | RAM_Read | RAM_Write | MBR_Load | MBR_From_AC | IR_Load | PC_Inc | AC_Load | ALU_Op | SAIDA_Load | IN_Read | HALT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$T_0$ (Fetch)** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_1$ (Fetch)** | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_2$ (Fetch)** | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | - | 0 | 0 | 0 |
| **$T_3$ (Decode)** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_4$ ADDI** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | ADD | 0 | 0 | 0 |
| **$T_4$ LDI** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | PASS | 0 | 0 | 0 |
| **$T_4$ LDA** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_5$ LDA** | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_6$ LDA** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | PASS | 0 | 0 | 0 |
| **$T_4$ ADD** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_5$ ADD** | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_6$ ADD** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | ADD | 0 | 0 | 0 |
| **$T_4$ STA** | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_5$ STA** | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_6$ STA** | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| **$T_4$ OUT** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 1 | 0 | 0 |
| **$T_4$ IN** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | PASS | 0 | 1 | 0 |
| **$T_4$ HLT** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 1 |

## 4. Hierarquia de Memória: Cache Didática L1

Para preencher a lacuna teórica abordada no relatório (princípio da localidade espacial e temporal e hierarquia de memória), o simulador integra uma memória cache didática unificada:

### 4.1. Parâmetros Arquiteturais
- **Capacidade Total:** 8 bytes.
- **Número de Linhas:** 4 linhas (`Linha 0`, `Linha 1`, `Linha 2`, `Linha 3`).
- **Tamanho do Bloco:** 2 bytes por bloco.
- **Mapeamento:** Mapeamento Direto (*Direct Mapped*).
- **Campos do Endereço de 8 bits `A[7:0]`:**
  $$\text{Endereço (8 bits)} = \underbrace{\text{Tag [7:3]}}_{5\text{ bits}} \;\Vert\; \underbrace{\text{Índice [2:1]}}_{2\text{ bits}} \;\Vert\; \underbrace{\text{Offset [0]}}_{1\text{ bit}}$$
  - **Offset (bit 0):** Seleciona o byte 0 ou byte 1 do bloco.
  - **Índice (bits 2..1):** Seleciona uma das 4 linhas da cache ($00_2$ a $11_2$).
  - **Tag (bits 7..3):** Identificador de bloco para validação de colisão ($00000_2$ a $11111_2$).

### 4.2. Políticas de Acesso e Atualização
- **Leitura (*Read*):**
  - **Hit:** O bloco está presente na linha indicada pelo índice e com `valid == 1` e `tag == linha.tag`. O dado é entregue com latência de **1 ciclo de custo**.
  - **Miss:** Falha de cache. O bloco inteiro de 2 bytes (`[A & ~1, (A & ~1) + 1]`) é transferido da RAM para a linha da cache. O bit `valid` é ativado e a tag atualizada. O dado solicitado é entregue com latência de **4 ciclos de custo**.
- **Escrita (*Write* — instrução STA):**
  - **Política Write-Through:** A escrita é sempre refletida imediatamente na RAM principal.
  - **Política No-Write-Allocate:** Em caso de *miss* de escrita, a gravação ocorre direto na RAM sem carregar o bloco na cache. Se houver *hit* na linha correspondente, o byte na cache também é atualizado para manter coerência. Escritas não alteram as estatísticas de acerto/falha de leitura.
- **Métricas:** Total de leituras, hits, misses, taxa de acerto ($\% = \frac{\text{Hits}}{\text{Total}} \times 100$) e custo temporal total acumulado ($\text{Custo} = 1 \times \text{Hits} + 4 \times \text{Misses}$).

## 5. Mapeamento de Rastreabilidade: Simulador Web × Circuito Logisim

| Bloco / Recurso no Simulador | Existe no `neocore_cpu.circ`? | Categoria | Observações Técnicas |
| :--- | :---: | :---: | :--- |
| **PC (Program Counter)** | **Sim** | Físico 1:1 | Contador de 8 bits síncrono com entrada `ct` e clock. |
| **MAR (Memory Address Register)** | **Sim** | Físico 1:1 | Registrador D de 8 bits com `WE` conectado ao sinal `MAR_Load`. |
| **MBR (Memory Buffer Register)** | **Sim** | Físico 1:1 | Registrador D de 8 bits que retém os dados da RAM. |
| **IR (Instruction Register)** | **Sim** | Físico 1:1 | Registrador D de 8 bits alimentado pelo barramento do MBR. |
| **AC (Acumulador)** | **Sim** | Físico 1:1 | Registrador D de 8 bits conectado à saída da ULA. |
| **RAM Principal 256x8** | **Sim** | Físico 1:1 | Módulo de memória RAM assíncrona/síncrona de 256 bytes. |
| **ULA (Somador 8 bits)** | **Sim** | Físico 1:1 | Bloco somador aritmético com Carry-in aterrado. |
| **Teclado (Entrada E/S)** | **Sim** | Físico 1:1 | Pino de entrada de 8 bits conectado ao barramento de dados da RAM. |
| **Monitor (Saída E/S)** | **Sim** | Físico 1:1 | Display/pino de saída de 8 bits conectado à saída do AC. |
| **Rede de Clock & Pinos Manuais** | **Sim** | Físico 1:1 | 5 pinos de controle manuais para teste de bancada na PoC. |
| **Decodificador UC (Decodificação Automática)** | **Não** | Extensão Digital | No circuito `.circ`, o decodificador é um bloco visual estático; no simulador web, implementa a lógica combinacional completa da ISA em T3. |
| **Unidade de Controle Automática (FSM)** | **Não** | Extensão Digital | No circuito `.circ`, a comutação é manual via pinos; no simulador web, opera como autômato de estados T0–T6. |
| **Cache Didática L1 (4 linhas × 2B)** | **Não** | Conceitual | Bloco pedagógico inserido entre MAR e RAM para demonstração de localidade e custos de acesso à memória. |
| **Registrador SAIDA (Porta OUT)** | **Não** | Extensão Digital | Registrador dedicado para isolamento de dados de saída, desacoplando o acumulador do display externo. |