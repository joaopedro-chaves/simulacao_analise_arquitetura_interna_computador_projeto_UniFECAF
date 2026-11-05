/* MODEL:START */
// ============================================================================
// MODELO COMPUTACIONAL PURO DA CPU NEOCORE TECH (8-BIT VON NEUMANN)
// Totalmente desacoplado do DOM para determinismo estrito e testes em Node.js
// ============================================================================

const ISA = {
  OPCODES: {
    0x0: { mnemonic: 'ADDI', name: 'Soma Imediata', type: 'imm', cycles: 5 },
    0x1: { mnemonic: 'LDI', name: 'Carga Imediata', type: 'imm', cycles: 5 },
    0x2: { mnemonic: 'LDA', name: 'Carga Direta da RAM', type: 'addr', cycles: 7 },
    0x3: { mnemonic: 'ADD', name: 'Soma com Dado da RAM', type: 'addr', cycles: 7 },
    0x4: { mnemonic: 'STA', name: 'Armazenar AC na RAM', type: 'addr', cycles: 7 },
    0x5: { mnemonic: 'OUT', name: 'Saída AC para SAIDA', type: 'impl', cycles: 5 },
    0x6: { mnemonic: 'IN', name: 'Entrada TECLADO para AC', type: 'impl', cycles: 5 },
    0xF: { mnemonic: 'HLT', name: 'Parada da Máquina', type: 'impl', cycles: 5 }
  }
};

function toHex2(val) {
  return (Number(val) & 0xFF).toString(16).toUpperCase().padStart(2, '0');
}

function toBin8(val) {
  return (Number(val) & 0xFF).toString(2).padStart(8, '0');
}

function createCPUModel(mode = 'AUTO') {
  return {
    mode: mode, // 'MANUAL' ou 'AUTO'
    regs: {
      PC: 0x00,
      MAR: 0x00,
      IR: 0x00,
      MBR: 0x00,
      AC: 0x00,
      SAIDA: 0x00
    },
    pins: {
      MAR_Load: 0,
      RAM_Read_MBR: 0,
      IR_Load: 0,
      PC_Inc: 0,
      AC_Exec: 0
    },
    controlSignals: {
      MAR_Load: 0,
      RAM_Read: 0,
      RAM_Write: 0,
      MBR_Load: 0,
      MBR_From_AC: 0,
      IR_Load: 0,
      PC_Inc: 0,
      AC_Load: 0,
      ALU_Op: 'NONE',
      SAIDA_Load: 0,
      IN_Read: 0,
      HALT: 0
    },
    teclado: 0x05,
    ram: new Array(256).fill(0),
    halted: false,
    tState: 0,
    guidedStep: 0,
    mbrInitialized: true,
    cacheEnabled: true,
    cache: {
      lines: [
        { valid: false, tag: 0, data: [0, 0] },
        { valid: false, tag: 0, data: [0, 0] },
        { valid: false, tag: 0, data: [0, 0] },
        { valid: false, tag: 0, data: [0, 0] }
      ],
      stats: { reads: 0, hits: 0, misses: 0, cost: 0 },
      lastAccess: null
    },
    stepCount: 0,
    cycleCount: 0
  };
}

function resetModel(model, keepMemory = true) {
  const oldRam = keepMemory ? [...model.ram] : new Array(256).fill(0);
  const oldTeclado = model.teclado;
  const oldCacheEnabled = model.cacheEnabled;
  const oldMode = model.mode;

  model.regs = { PC: 0, MAR: 0, IR: 0, MBR: 0, AC: 0, SAIDA: 0 };
  model.pins = { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 };
  model.controlSignals = {
    MAR_Load: 0, RAM_Read: 0, RAM_Write: 0, MBR_Load: 0, MBR_From_AC: 0,
    IR_Load: 0, PC_Inc: 0, AC_Load: 0, ALU_Op: 'NONE', SAIDA_Load: 0, IN_Read: 0, HALT: 0
  };
  model.halted = false;
  model.tState = 0;
  model.guidedStep = 0;
  model.mbrInitialized = true;
  model.stepCount = 0;
  model.cycleCount = 0;
  model.mode = oldMode;
  model.cacheEnabled = oldCacheEnabled;
  model.ram = oldRam;
  model.teclado = oldTeclado;
  model.cache = {
    lines: [
      { valid: false, tag: 0, data: [0, 0] },
      { valid: false, tag: 0, data: [0, 0] },
      { valid: false, tag: 0, data: [0, 0] },
      { valid: false, tag: 0, data: [0, 0] }
    ],
    stats: { reads: 0, hits: 0, misses: 0, cost: 0 },
    lastAccess: null
  };
}

function readCacheOrRAM(model, addr) {
  const a = addr & 0xFF;
  if (!model.cacheEnabled) {
    model.cache.stats.reads++;
    model.cache.stats.cost += 4;
    const res = { data: model.ram[a], hit: false, miss: false, bypassed: true, cost: 4, line: -1, tag: -1, offset: -1 };
    model.cache.lastAccess = res;
    return res;
  }

  const offset = a & 1;
  const index = (a >> 1) & 0x03;
  const tag = (a >> 3) & 0x1F;
  const line = model.cache.lines[index];

  model.cache.stats.reads++;

  if (line.valid && line.tag === tag) {
    model.cache.stats.hits++;
    model.cache.stats.cost += 1;
    const res = {
      data: line.data[offset],
      hit: true,
      miss: false,
      bypassed: false,
      cost: 1,
      line: index,
      tag: tag,
      offset: offset
    };
    model.cache.lastAccess = res;
    return res;
  } else {
    model.cache.stats.misses++;
    model.cache.stats.cost += 4;
    const blockBase = a & ~1;
    const b0 = model.ram[blockBase];
    const b1 = model.ram[(blockBase + 1) & 0xFF];
    line.valid = true;
    line.tag = tag;
    line.data = [b0, b1];
    const res = {
      data: line.data[offset],
      hit: false,
      miss: true,
      bypassed: false,
      cost: 4,
      line: index,
      tag: tag,
      offset: offset
    };
    model.cache.lastAccess = res;
    return res;
  }
}

function writeCacheAndRAM(model, addr, val) {
  const a = addr & 0xFF;
  const v = val & 0xFF;
  model.ram[a] = v;

  if (model.cacheEnabled) {
    const offset = a & 1;
    const index = (a >> 1) & 0x03;
    const tag = (a >> 3) & 0x1F;
    const line = model.cache.lines[index];
    if (line.valid && line.tag === tag) {
      line.data[offset] = v;
    }
  }
}

function writeTecladoToRAMModel(model) {
  const addr = model.regs.MAR & 0xFF;
  const val = model.teclado & 0xFF;
  writeCacheAndRAM(model, addr, val);
}

const GUIDED_MANUAL_STEPS = [
  { t: 'T0', fase: 'FETCH', code: 'T0 · FETCH A', title: 'Passo 1 (Busca / Fetch — Parte A): PC → MAR', pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 } },
  { t: 'T1', fase: 'FETCH', code: 'T1 · FETCH B', title: 'Passo 2 (Busca / Fetch — Parte B): RAM[MAR] → MBR', pins: { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 } },
  { t: 'T2', fase: 'FETCH', code: 'T2 · FETCH C', title: 'Passo 3 (Busca / Fetch — Parte C): MBR → IR e PC ← PC + 1', pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 1, PC_Inc: 1, AC_Exec: 0 } },
  { t: 'T3', fase: 'EXECUTE', code: 'T3 · EXECUTE', title: 'Passo 4 (Execução / Execute): ULA soma AC + MBR → AC', pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 } },
  { t: 'T4', fase: 'FETCH', code: 'T4 · FETCH A (Palavra 2)', title: 'Passo 5 (Busca Palavra 2 — Parte A): PC → MAR', pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 } },
  { t: 'T5', fase: 'FETCH', code: 'T5 · FETCH B (Palavra 2)', title: 'Passo 6 (Busca Palavra 2 — Parte B): RAM[MAR] → MBR', pins: { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 } },
  { t: 'T6', fase: 'FETCH', code: 'T6 · FETCH C (Palavra 2)', title: 'Passo 7 (Busca Palavra 2 — Parte C): MBR → IR e PC ← PC + 1', pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 1, PC_Inc: 1, AC_Exec: 0 } },
  { t: 'T7', fase: 'EXECUTE', code: 'T7 · EXECUTE (Palavra 2)', title: 'Passo 8 (Execução Palavra 2): ULA soma AC + MBR → AC', pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 } }
];

// Decisão didática (B2): Tabela declarativa da Unidade de Controle (estado × opcode → sinais e próximo estado T).
// Permite inspecionar e testar a FSM da UC como uma matriz pura sem efeitos colaterais de DOM.
const UC_TABLE = {
  0: {
    ALL: { fase: 'FETCH', signals: { MAR_Load: 1 }, pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 1 }
  },
  1: {
    ALL: { fase: 'FETCH', signals: { RAM_Read: 1, MBR_Load: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 2 }
  },
  2: {
    ALL: { fase: 'FETCH', signals: { IR_Load: 1, PC_Inc: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 1, PC_Inc: 1, AC_Exec: 0 }, nextT: 3 }
  },
  3: {
    ALL: { fase: 'DECODE', signals: {}, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 4 }
  },
  4: {
    0x0: { fase: 'EXECUTE', signals: { AC_Load: 1, ALU_Op: 'ADD' }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 }, nextT: 0 },
    0x1: { fase: 'EXECUTE', signals: { AC_Load: 1, ALU_Op: 'PASS' }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 }, nextT: 0 },
    0x2: { fase: 'EXECUTE', signals: { MAR_Load: 1 }, pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 5 },
    0x3: { fase: 'EXECUTE', signals: { MAR_Load: 1 }, pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 5 },
    0x4: { fase: 'EXECUTE', signals: { MAR_Load: 1 }, pins: { MAR_Load: 1, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 5 },
    0x5: { fase: 'EXECUTE', signals: { SAIDA_Load: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 0 },
    0x6: { fase: 'EXECUTE', signals: { IN_Read: 1, AC_Load: 1, ALU_Op: 'PASS' }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 }, nextT: 0 },
    0xF: { fase: 'EXECUTE', signals: { HALT: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 4 },
    DEFAULT: { fase: 'EXECUTE', signals: {}, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 0 }
  },
  5: {
    0x2: { fase: 'EXECUTE', signals: { RAM_Read: 1, MBR_Load: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 6 },
    0x3: { fase: 'EXECUTE', signals: { RAM_Read: 1, MBR_Load: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 6 },
    0x4: { fase: 'EXECUTE', signals: { MBR_Load: 1, MBR_From_AC: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 6 }
  },
  6: {
    0x2: { fase: 'EXECUTE', signals: { AC_Load: 1, ALU_Op: 'PASS' }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 }, nextT: 0 },
    0x3: { fase: 'EXECUTE', signals: { AC_Load: 1, ALU_Op: 'ADD' }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 1 }, nextT: 0 },
    0x4: { fase: 'EXECUTE', signals: { RAM_Write: 1 }, pins: { MAR_Load: 0, RAM_Read_MBR: 0, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 }, nextT: 0 }
  }
};

function lookupUCEntry(tState, opcode) {
  const row = UC_TABLE[tState] || UC_TABLE[0];
  return row.ALL || row[opcode] || row.DEFAULT;
}

function step(model) {
  model.stepCount++;
  const prevRegs = { ...model.regs };

  // ======================================================================
  // 1. MODO MANUAL (Fiel ao circuito Logisim-Evolution v5.0.0 de bancada)
  // Decisão didática (A2, A5, A9): Semântica síncrona de borda de subida —
  // lê todos os registradores anteriores (prevRegs) antes de gravar novos.
  // O carregamento do IR ocorre em T2 (FETCH) e o estudante exerce a decodificação.
  // ======================================================================
  if (model.mode === 'MANUAL') {
    const prevPC = prevRegs.PC;
    const prevMAR = prevRegs.MAR;
    const prevMBR = prevRegs.MBR;
    const prevAC = prevRegs.AC;
    const aluSum = (prevAC + prevMBR) & 0xFF;

    const activePins = {};
    const mappedSignals = {};
    const rtlParts = [];

    if (model.pins.MAR_Load === 1) {
      model.regs.MAR = prevPC;
      activePins.MAR_Load = 1;
      mappedSignals.MAR_Load = 1;
      rtlParts.push(`MAR ← PC (${toHex2(prevPC)}h)`);
    }
    if (model.pins.RAM_Read_MBR === 1) {
      const addr = prevMAR & 0xFF;
      const val = model.ram[addr];
      model.regs.MBR = val;
      model.mbrInitialized = true;
      activePins.RAM_Read_MBR = 1;
      mappedSignals.RAM_Read = 1;
      mappedSignals.MBR_Load = 1;
      rtlParts.push(`MBR ← RAM[${toHex2(addr)}h] (${toHex2(val)}h)`);
    }
    if (model.pins.IR_Load === 1) {
      model.regs.IR = prevMBR;
      activePins.IR_Load = 1;
      mappedSignals.IR_Load = 1;
      rtlParts.push(`IR ← MBR (${toHex2(prevMBR)}h)`);
    }
    if (model.pins.PC_Inc === 1) {
      model.regs.PC = (prevPC + 1) & 0xFF;
      activePins.PC_Inc = 1;
      mappedSignals.PC_Inc = 1;
      rtlParts.push(`PC ← PC + 1 (${toHex2(model.regs.PC)}h)`);
    }
    if (model.pins.AC_Exec === 1) {
      model.regs.AC = aluSum;
      activePins.AC_Exec = 1;
      mappedSignals.AC_Load = 1;
      mappedSignals.ALU_Op = 'ADD';
      rtlParts.push(`AC ← AC + MBR (${toHex2(prevAC)}h + ${toHex2(prevMBR)}h = ${toHex2(aluSum)}h)`);
    }

    // Atualiza os sinais de controle da instância para que o HUD no SVG e o Drawer reflitam o Modo Manual
    model.controlSignals = mappedSignals;

    const tNum = (model.stepCount - 1) % 4;
    const faseName = activePins.AC_Exec ? 'EXECUTE' : (tNum <= 2 ? 'FETCH' : 'EXECUTE');
    const rtl = rtlParts.length > 0 ? rtlParts.join('; ') : 'Nenhum pino ativo (Pulso NOP)';

    let desc = '';
    if (activePins.MAR_Load) {
      desc = `Ativamos <code>MAR_Load = 1</code> e pulsamos o clock. O endereço <code>${toHex2(prevPC)}h</code> do <code>PC</code> foi copiado para o <code>MAR</code>, apontando para a RAM.`;
    } else if (activePins.RAM_Read_MBR) {
      desc = `Ativamos <code>RAM_Read_MBR = 1</code> (OE na RAM e WE no MBR). O byte <code>${toHex2(model.regs.MBR)}h</code> da posição <code>${toHex2(prevMAR)}h</code> foi transferido para o <code>MBR</code>.`;
    } else if (activePins.IR_Load || activePins.PC_Inc) {
      desc = `Carregamos o <code>IR</code> com <code>${toHex2(model.regs.IR)}h</code> vindo do MBR e avançamos o contador <code>PC</code> para <code>${toHex2(model.regs.PC)}h</code>. No modo manual, a decodificação é exercida pelo estudante ao selecionar os pinos de controle.`;
    } else if (activePins.AC_Exec) {
      desc = `Ativamos <code>AC_Exec = 1</code>. A <code>ULA</code> somou o acumulador anterior (<code>${toHex2(prevAC)}h</code>) com o operando do MBR (<code>${toHex2(prevMBR)}h</code>), gravando <code>${toHex2(model.regs.AC)}h</code> no <code>AC</code> e exibindo no Monitor.`;
    } else {
      desc = 'Pulso de clock aplicado sem pinos de controle habilitados. Nenhum registrador teve seu valor alterado.';
    }

    return {
      t: `T${tNum}`,
      fase: faseName,
      rtl: rtl,
      sinais: activePins,
      antes: prevRegs,
      depois: { ...model.regs },
      cache: null,
      halt: false,
      desc: desc
    };
  }

  // ======================================================================
  // 2. MODO AUTOMÁTICO (T-States: T0..T2 Fetch, T3 Decode, T4..T6 Execute)
  // Decisão didática (B1, B2): A UC consulta a tabela UC_TABLE (estado × opcode)
  // e aciona os sinais de controle síncronos do caminho de dados.
  // ======================================================================
  if (model.halted) {
    model.controlSignals = { HALT: 1 };
    return {
      t: 'HALT',
      fase: 'HALTED',
      rtl: 'CPU em estado HALT — Clock interrompido',
      sinais: { HALT: 1 },
      antes: prevRegs,
      depois: { ...model.regs },
      cache: null,
      halt: true,
      desc: 'A CPU está parada pela instrução HLT (Opcode 0xF). Reinicie pelo botão "Resetar CPU" para nova execução.'
    };
  }

  const curT = model.tState;
  const opcode = (prevRegs.IR >> 4) & 0x0F;
  const operand = prevRegs.IR & 0x0F;
  const ucEntry = lookupUCEntry(curT, opcode);
  const activeSignals = { ...ucEntry.signals };
  model.pins = { ...ucEntry.pins };

  let rtl = '';
  const fase = ucEntry.fase;
  let cacheAccess = null;
  let desc = '';

  if (curT === 0) {
    // T0: FETCH A (MAR ← PC)
    model.regs.MAR = prevRegs.PC;
    rtl = `MAR ← PC (${toHex2(prevRegs.PC)}h)`;
    desc = `Início do ciclo de busca: o contador de programa <code>PC = ${toHex2(prevRegs.PC)}h</code> é transferido ao <code>MAR</code> pelo barramento de endereços.`;
  } else if (curT === 1) {
    // T1: FETCH B (MBR ← RAM[MAR] via Cache)
    cacheAccess = readCacheOrRAM(model, prevRegs.MAR);
    model.regs.MBR = cacheAccess.data;
    const statusTag = cacheAccess.bypassed ? 'Sem Cache' : (cacheAccess.hit ? 'HIT L1' : 'MISS L1');
    rtl = `MBR ← RAM[${toHex2(prevRegs.MAR)}h] (${toHex2(cacheAccess.data)}h) [${statusTag}]`;
    desc = `Leitura da instrução na memória: o byte <code>${toHex2(cacheAccess.data)}h</code> foi transferido para o <code>MBR</code> via ${cacheAccess.hit ? '<strong style="color:#00d800">Cache HIT (1 ciclo)</strong>' : '<strong style="color:#cf6679">Cache MISS (4 ciclos)</strong>'}.`;
  } else if (curT === 2) {
    // T2: FETCH C (IR ← MBR; PC ← PC + 1)
    model.regs.IR = prevRegs.MBR;
    model.regs.PC = (prevRegs.PC + 1) & 0xFF;
    rtl = `IR ← MBR (${toHex2(prevRegs.MBR)}h); PC ← PC + 1 (${toHex2(model.regs.PC)}h)`;
    desc = `Fim da busca: o byte no <code>MBR</code> foi gravado no <code>IR</code> (<code>${toHex2(model.regs.IR)}h</code>) e o <code>PC</code> avançou para <code>${toHex2(model.regs.PC)}h</code>.`;
  } else if (curT === 3) {
    // T3: DECODE (Decodificação pura pela UC sem transferência de registradores)
    const info = ISA.OPCODES[opcode];
    if (info) {
      rtl = `Decoder UC: Opcode ${toHex2(opcode)}h → ${info.mnemonic} ${info.type === 'imm' || info.type === 'addr' ? toHex2(operand) + 'h' : ''}`;
      desc = `Decodificação pela UC: o nibble superior <code>${toHex2(opcode)}h</code> identifica a instrução <strong>${info.mnemonic}</strong> (${info.name}). As linhas de controle correspondentes estão armadas na tabela da UC.`;
    } else {
      rtl = `Decoder UC: Opcode ${toHex2(opcode)}h não reconhecido (NOP)`;
      desc = `Opcode não implementado (<code>${toHex2(opcode)}h</code>). A UC interpretará como NOP (operação neutra).`;
    }
  } else if (curT === 4) {
    // T4: EXECUTE 1 (Acionado pelos sinais da tabela UC_TABLE[4][opcode])
    if (opcode === 0x0) {
      model.regs.AC = (prevRegs.AC + operand) & 0xFF;
      rtl = `AC ← AC + ${toHex2(operand)}h (${toHex2(prevRegs.AC)}h + ${toHex2(operand)}h = ${toHex2(model.regs.AC)}h)`;
      desc = `Execução ADDI: a ULA somou o imediato <code>${toHex2(operand)}h</code> ao Acumulador, resultando em <code>${toHex2(model.regs.AC)}h</code>.`;
    } else if (opcode === 0x1) {
      model.regs.AC = operand & 0xFF;
      rtl = `AC ← ${toHex2(operand)}h`;
      desc = `Execução LDI: valor imediato <code>${toHex2(operand)}h</code> carregado diretamente no Acumulador <code>AC</code>.`;
    } else if (opcode === 0x2 || opcode === 0x3 || opcode === 0x4) {
      model.regs.MAR = operand & 0xFF;
      rtl = `MAR ← IR[3:0] (${toHex2(model.regs.MAR)}h)`;
      desc = `Execução (Endereçamento): endereço de memória do operando <code>${toHex2(operand)}h</code> carregado no <code>MAR</code>.`;
    } else if (opcode === 0x5) {
      model.regs.SAIDA = prevRegs.AC;
      rtl = `SAIDA ← AC (${toHex2(model.regs.SAIDA)}h)`;
      desc = `Execução OUT: o valor <code>${toHex2(prevRegs.AC)}h</code> do Acumulador foi transferido para o registrador <code>SAIDA</code> e exibido no Monitor.`;
    } else if (opcode === 0x6) {
      model.regs.AC = model.teclado & 0xFF;
      rtl = `AC ← TECLADO (${toHex2(model.regs.AC)}h)`;
      desc = `Execução IN: o byte <code>${toHex2(model.teclado)}h</code> do dispositivo de entrada <code>TECLADO</code> foi lido para o Acumulador <code>AC</code>.`;
    } else if (opcode === 0xF) {
      model.halted = true;
      rtl = `HALT — Parada da Máquina`;
      desc = `Instrução HLT executada: a CPU interrompeu a geração de pulsos de clock e entrou em estado de parada.`;
    } else {
      rtl = `NOP (Opcode ${toHex2(opcode)}h)`;
      desc = `Instrução NOP / não reconhecida: nenhum registrador foi modificado.`;
    }
  } else if (curT === 5) {
    // T5: EXECUTE 2 (Leitura ou Preparação de Escrita)
    if (opcode === 0x2 || opcode === 0x3) {
      cacheAccess = readCacheOrRAM(model, prevRegs.MAR);
      model.regs.MBR = cacheAccess.data;
      const statusTag = cacheAccess.bypassed ? 'Sem Cache' : (cacheAccess.hit ? 'HIT L1' : 'MISS L1');
      rtl = `MBR ← RAM[${toHex2(prevRegs.MAR)}h] (${toHex2(cacheAccess.data)}h) [${statusTag}]`;
      desc = `Leitura do operando de dados na posição <code>${toHex2(prevRegs.MAR)}h</code> para o <code>MBR</code> via ${cacheAccess.hit ? 'HIT L1' : 'MISS L1'}.`;
    } else if (opcode === 0x4) {
      model.regs.MBR = prevRegs.AC;
      rtl = `MBR ← AC (${toHex2(prevRegs.AC)}h)`;
      desc = `Armazenamento (STA): o valor <code>${toHex2(prevRegs.AC)}h</code> do Acumulador foi colocado no <code>MBR</code> para gravação na RAM.`;
    }
  } else if (curT === 6) {
    // T6: EXECUTE 3 (Carga final ou Escrita em Memória)
    if (opcode === 0x2) {
      model.regs.AC = prevRegs.MBR;
      rtl = `AC ← MBR (${toHex2(model.regs.AC)}h)`;
      desc = `Fim do LDA: Acumulador carregado com <code>${toHex2(model.regs.AC)}h</code> vindo da memória.`;
    } else if (opcode === 0x3) {
      model.regs.AC = (prevRegs.AC + prevRegs.MBR) & 0xFF;
      rtl = `AC ← AC + MBR (${toHex2(prevRegs.AC)}h + ${toHex2(prevRegs.MBR)}h = ${toHex2(model.regs.AC)}h)`;
      desc = `Fim do ADD: soma entre <code>AC (${toHex2(prevRegs.AC)}h)</code> e <code>MBR (${toHex2(prevRegs.MBR)}h)</code> resultou em <code>${toHex2(model.regs.AC)}h</code> gravado no Acumulador.`;
    } else if (opcode === 0x4) {
      writeCacheAndRAM(model, prevRegs.MAR, prevRegs.MBR);
      rtl = `RAM[${toHex2(prevRegs.MAR)}h] ← MBR (${toHex2(prevRegs.MBR)}h)`;
      desc = `Fim do STA: o byte <code>${toHex2(prevRegs.MBR)}h</code> foi gravado na posição <code>${toHex2(prevRegs.MAR)}h</code> da RAM principal (política Write-Through).`;
    }
  }

  model.tState = ucEntry.nextT;
  if (model.tState === 0 && !model.halted) {
    model.cycleCount++;
  }
  model.controlSignals = activeSignals;

  return {
    t: `T${curT}`,
    fase: fase,
    rtl: rtl,
    sinais: activeSignals,
    antes: prevRegs,
    depois: { ...model.regs },
    cache: cacheAccess,
    halt: model.halted,
    desc: desc
  };
}

function stepGuidedManual(model) {
  const stepIdx = model.guidedStep % GUIDED_MANUAL_STEPS.length;
  model.pins = { ...GUIDED_MANUAL_STEPS[stepIdx].pins };
  const trace = step(model);
  model.guidedStep = (model.guidedStep + 1) % GUIDED_MANUAL_STEPS.length;
  return trace;
}

function stepInstruction(model) {
  const traces = [];
  let count = 0;
  if (model.halted) return traces;
  do {
    const tr = step(model);
    traces.push(tr);
    count++;
  } while (model.tState !== 0 && !model.halted && count < 10);
  return traces;
}

function runUntilHalt(model, maxSteps = 500) {
  const traces = [];
  let steps = 0;
  while (!model.halted && steps < maxSteps) {
    traces.push(step(model));
    steps++;
  }
  return traces;
}

function loadDemo(model, demoId) {
  const id = Number(demoId);
  resetModel(model, false);
  if (id === 0) {
    model.mode = 'MANUAL';
    model.ram[0] = 0x05;
    model.ram[1] = 0x03;
    model.ram[2] = 0x0A;
    model.ram[3] = 0x00;
  } else if (id === 1) {
    model.mode = 'AUTO';
    model.ram[0] = 0x05; // ADDI 5
    model.ram[1] = 0x03; // ADDI 3
    model.ram[2] = 0x50; // OUT
    model.ram[3] = 0xF0; // HLT
  } else if (id === 2) {
    model.mode = 'AUTO';
    model.ram[0] = 0x2E; // LDA 0Eh
    model.ram[1] = 0x3F; // ADD 0Fh
    model.ram[2] = 0x50; // OUT
    model.ram[3] = 0xF0; // HLT
    model.ram[0x0E] = 0x07;
    model.ram[0x0F] = 0x09;
  } else if (id === 3) {
    model.mode = 'AUTO';
    model.ram[0] = 0x60; // IN
    model.ram[1] = 0x01; // ADDI 1
    model.ram[2] = 0x50; // OUT
    model.ram[3] = 0xF0; // HLT
    model.teclado = 0x0A;
  }
}
/* MODEL:END */

// ============================================================================
// CAMADA DE CONTROLE E VISUALIZAÇÃO INTERATIVA (VIEW & UI BINDINGS)
// ============================================================================

// Instância global do modelo da CPU
const state = createCPUModel('AUTO');
loadDemo(state, 1);

let autoClockTimer = null;
// Decisão didática (A6): Multiplicador de velocidade onde 1x = 1000 ms exatos (1 Hz).
let autoClockSpeed = 1;
let currentRamPage = 0;
let focusedRamAddr = null;
const executionLogs = [];
let lastTrace = null;

function getAutoClockIntervalMs() {
  return Math.round(1000 / autoClockSpeed);
}

function togglePin(pinName) {
  state.pins[pinName] = state.pins[pinName] === 1 ? 0 : 1;
  renderCircuit();
}

function updateRamFromInput(idx, rawVal) {
  const parsed = parseInt(rawVal, 16);
  const val = Number.isNaN(parsed) ? 0 : (parsed & 0xFF);
  state.ram[idx] = val;
  if (state.cacheEnabled) {
    const offset = idx & 1;
    const index = (idx >> 1) & 0x03;
    const tag = (idx >> 3) & 0x1F;
    const line = state.cache.lines[index];
    if (line.valid && line.tag === tag) line.data[offset] = val;
  }
  renderCircuit();
}

function updateTecladoFromInput(rawVal) {
  const parsed = parseInt(rawVal, 16);
  state.teclado = Number.isNaN(parsed) ? 0 : (parsed & 0xFF);
  renderCircuit();
}

function writeTecladoToRAM() {
  const addr = state.regs.MAR & 0xFF;
  writeTecladoToRAMModel(state);
  clearComponentInfoView();
  document.getElementById('step-counter').textContent = 'E/S · WRITE';
  document.getElementById('step-title').textContent = `Escrita E/S na RAM[${toHex2(addr)}h]:`;
  document.getElementById('step-desc').innerHTML = `O byte <code>${toHex2(state.teclado)}h</code> do pino <code>Teclado</code> foi gravado na posição <code>${toHex2(addr)}h</code> da RAM. (<em>Caminho de E/S manual da bancada PoC sem sinal formal no barramento de controle</em>).`;
  showCtxCard(100);
  renderCircuit();
}

// Decisão didática (A9): pulseClock() aplica 1 pulso de subida preservando os pinos manuais
// caso o aluno tenha clicado diretamente nos pinos e no componente CLOCK.
// Quando useGuidedInManual === true (botão "Próximo Passo" ou Auto-Clock), arma os pinos do passo guiado.
function pulseClock(useGuidedInManual = false) {
  const clkWires = document.querySelectorAll('.clk-wire');
  const clkNodes = document.querySelectorAll('.clk-node');
  clkWires.forEach(w => w.setAttribute('stroke', '#00d800'));
  clkNodes.forEach(n => n.setAttribute('fill', '#00d800'));
  setTimeout(() => {
    clkWires.forEach(w => w.setAttribute('stroke', '#006400'));
    clkNodes.forEach(n => n.setAttribute('fill', '#006400'));
  }, 200);

  const trace = (state.mode === 'MANUAL' && useGuidedInManual) ? stepGuidedManual(state) : step(state);
  lastTrace = trace;
  executionLogs.push({ step: state.stepCount, ...trace });

  clearComponentInfoView();
  document.getElementById('step-counter').textContent = state.halted ? 'HALT' : `${trace.t} · ${trace.fase}`;
  document.getElementById('step-title').textContent = `${trace.t} (${trace.fase}): ${trace.rtl}`;
  document.getElementById('step-desc').innerHTML = trace.desc;

  const progressPct = state.mode === 'MANUAL'
    ? ((state.guidedStep === 0 ? 8 : state.guidedStep) / 8) * 100
    : (state.tState === 0 ? 100 : (state.tState / 6) * 100);
  showCtxCard(progressPct);

  if (state.halted && autoClockTimer) {
    toggleAutoClock();
  }

  renderCircuit();
  triggerRegisterFlash(trace);
}

function triggerRegisterFlash(trace) {
  if (!trace || !trace.antes || !trace.depois) return;
  ['PC', 'MAR', 'IR', 'MBR', 'AC', 'SAIDA'].forEach(r => {
    if (trace.antes[r] !== trace.depois[r]) {
      const el = document.getElementById(`bg-val-${r}`);
      if (el) {
        el.classList.remove('reg-flash');
        void el.offsetWidth;
        el.classList.add('reg-flash');
      }
    }
  });
}

function runStepInstruction() {
  if (state.mode === 'MANUAL') {
    for (let i = 0; i < 4; i++) pulseClock(true);
  } else {
    if (state.halted) return;
    let count = 0;
    do {
      pulseClock(false);
      count++;
    } while (state.tState !== 0 && !state.halted && count < 10);
  }
}

function runUntilHaltUI() {
  if (state.mode === 'MANUAL') {
    for (let i = 0; i < 8; i++) pulseClock(true);
  } else {
    let count = 0;
    while (!state.halted && count < 100) {
      pulseClock(false);
      count++;
    }
  }
}

function runGuidedStep() {
  pulseClock(true);
}

// Decisão didática (A7): jumpToGuidedStep reexecuta de forma 100% determinística a partir
// do reset usando o mesmo step(), preservando edições feitas na RAM e no Teclado.
function jumpToGuidedStep(targetIdx) {
  const keepRam = [...state.ram];
  const keepTeclado = state.teclado;
  resetModel(state, true);
  state.ram = keepRam;
  state.teclado = keepTeclado;
  executionLogs.length = 0;
  let tr = null;
  if (state.mode === 'MANUAL') {
    state.guidedStep = 0;
    for (let i = 0; i <= targetIdx; i++) {
      tr = stepGuidedManual(state);
      executionLogs.push({ step: state.stepCount, ...tr });
    }
  } else {
    for (let i = 0; i <= targetIdx && !state.halted; i++) {
      tr = step(state);
      executionLogs.push({ step: state.stepCount, ...tr });
    }
  }
  lastTrace = tr;
  if (tr) {
    clearComponentInfoView();
    document.getElementById('step-counter').textContent = state.halted ? 'HALT' : `${tr.t} · ${tr.fase}`;
    document.getElementById('step-title').textContent = `${tr.t} (${tr.fase}): ${tr.rtl}`;
    document.getElementById('step-desc').innerHTML = tr.desc;
    showCtxCard(100);
  }
  renderCircuit();
}

function toggleAutoClock() {
  const btn = document.getElementById('btn-autoclock');
  const txt = document.getElementById('txt-autoclock');
  const intervalMs = getAutoClockIntervalMs();
  if (autoClockTimer) {
    clearInterval(autoClockTimer);
    autoClockTimer = null;
    btn.classList.remove('running');
    txt.textContent = `Auto-Clock (${autoClockSpeed}x · ${intervalMs} ms)`;
  } else {
    if (state.halted) resetCPU();
    btn.classList.add('running');
    txt.textContent = `Pausar (${autoClockSpeed}x · ${intervalMs} ms)`;
    pulseClock(true);
    autoClockTimer = setInterval(() => pulseClock(true), intervalMs);
  }
}

function setAutoClockSpeed(spd) {
  autoClockSpeed = spd;
  ['025', '05', '1', '2'].forEach(id => {
    const b = document.getElementById(`spd-${id}`);
    if (b) b.classList.remove('active');
  });
  const key = spd === 0.25 ? '025' : (spd === 0.5 ? '05' : String(spd));
  const activeBtn = document.getElementById(`spd-${key}`);
  if (activeBtn) activeBtn.classList.add('active');

  const intervalMs = getAutoClockIntervalMs();
  const txt = document.getElementById('txt-autoclock');
  if (txt) {
    txt.textContent = autoClockTimer
      ? `Pausar (${autoClockSpeed}x · ${intervalMs} ms)`
      : `Auto-Clock (${autoClockSpeed}x · ${intervalMs} ms)`;
  }
  if (autoClockTimer) {
    clearInterval(autoClockTimer);
    autoClockTimer = setInterval(() => pulseClock(true), intervalMs);
  }
}

function setMode(newMode) {
  state.mode = newMode;
  document.getElementById('btn-mode-manual').classList.toggle('active', newMode === 'MANUAL');
  document.getElementById('btn-mode-auto').classList.toggle('active', newMode === 'AUTO');
  resetCPU();
}

function onSelectDemo(demoId) {
  loadDemo(state, demoId);
  document.getElementById('btn-mode-manual').classList.toggle('active', state.mode === 'MANUAL');
  document.getElementById('btn-mode-auto').classList.toggle('active', state.mode === 'AUTO');
  const sel = document.getElementById('select-demo');
  if (sel && sel.value !== String(demoId)) sel.value = String(demoId);
  executionLogs.length = 0;
  lastTrace = null;
  clearComponentInfoView();
  document.getElementById('step-counter').textContent = 'T0 · PRONTO';
  document.getElementById('step-title').textContent = `Demo ${demoId} Carregada (${state.mode === 'MANUAL' ? 'Modo Manual' : 'Modo Automático'})`;
  document.getElementById('step-desc').innerHTML = `Programa carregado na RAM. Clique em <strong>Próximo Passo</strong>, <strong>Pulso Manual</strong> ou <strong>Executar até HLT</strong> para iniciar.`;
  showCtxCard(0);
  renderCircuit();
}

function toggleCache() {
  state.cacheEnabled = !state.cacheEnabled;
  const btn = document.getElementById('btn-toggle-cache');
  if (btn) btn.textContent = state.cacheEnabled ? 'Cache: LIGADA' : 'Cache: DESLIGADA';
  renderCircuit();
}

// Decisão didática (A1): Permite navegar diretamente para qualquer endereço entre 00h e FFh,
// ajustando a página de 16 células (addr & 0xF0) e destacando/focando a célula exata (addr & 0xFF).
function jumpToRAMPage(hexStr) {
  const parsed = parseInt(hexStr, 16);
  if (!Number.isNaN(parsed)) {
    const targetAddr = Math.min(255, Math.max(0, parsed));
    currentRamPage = targetAddr & 0xF0;
    focusedRamAddr = targetAddr;
  }
  renderCircuit();
  if (focusedRamAddr !== null) {
    const inp = document.getElementById(`inp-ram-${focusedRamAddr}`);
    if (inp) {
      inp.focus();
      inp.select();
    }
  }
}

function stepRAMPage(delta) {
  currentRamPage = (currentRamPage + delta + 256) & 0xF0;
  focusedRamAddr = null;
  renderCircuit();
}

function resetCPU() {
  if (autoClockTimer) toggleAutoClock();
  resetModel(state, true);
  executionLogs.length = 0;
  lastTrace = null;
  clearComponentInfoView();
  document.getElementById('step-counter').textContent = 'T0 · RESET';
  document.getElementById('step-title').textContent = 'CPU Resetada:';
  document.getElementById('step-desc').innerHTML = 'Todos os registradores voltaram para <code>00h</code>. Pinos, contadores e estado HALT foram zerados. O conteúdo da RAM e do Teclado foi preservado.';
  showCtxCard(0);
  renderCircuit();
}

function setWireFilter(mode) {
  const layers = {
    clock: document.getElementById('layer-clock'),
    control: document.getElementById('layer-control'),
    address: document.getElementById('layer-address'),
    data: document.getElementById('layer-data')
  };

  ['all', 'clock', 'control', 'address', 'data'].forEach(m => {
    const btn = document.getElementById(`btn-filter-${m}`);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  for (const [key, el] of Object.entries(layers)) {
    el.style.opacity = (mode === 'all' || mode === key) ? '1' : '0.12';
  }
}

function copyLogMarkdown() {
  if (executionLogs.length === 0) {
    alert('Nenhum log gravado ainda. Execute alguns pulsos para gerar dados.');
    return;
  }
  let md = '| # | T | Fase | Micro-operação (RTL) | Sinais Ativos | Registradores | Cache |\n';
  md += '| :---: | :---: | :---: | :--- | :--- | :--- | :---: |\n';
  executionLogs.forEach(l => {
    const sigs = Object.keys(l.sinais || {}).join(', ') || '-';
    const regs = `PC:${toHex2(l.depois.PC)} MAR:${toHex2(l.depois.MAR)} IR:${toHex2(l.depois.IR)} MBR:${toHex2(l.depois.MBR)} AC:${toHex2(l.depois.AC)} SAIDA:${toHex2(l.depois.SAIDA)}`;
    const cacheTag = l.cache ? (l.cache.hit ? 'HIT' : 'MISS') : '-';
    md += `| ${l.step} | ${l.t} | ${l.fase} | \`${l.rtl}\` | ${sigs} | \`${regs}\` | ${cacheTag} |\n`;
  });
  navigator.clipboard.writeText(md).then(() => {
    alert('Log de execução copiado para a área de transferência em formato Markdown!');
  }).catch(() => {
    prompt('Copie o Markdown abaixo:', md);
  });
}

function clearLog() {
  executionLogs.length = 0;
  renderLogTable();
}

function renderLogTable() {
  const tbody = document.getElementById('log-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  executionLogs.slice(-40).forEach(l => {
    const tr = document.createElement('tr');
    const sigs = Object.keys(l.sinais || {}).join(', ') || '-';
    const regs = `PC:${toHex2(l.depois.PC)} MAR:${toHex2(l.depois.MAR)} MBR:${toHex2(l.depois.MBR)} AC:${toHex2(l.depois.AC)} SAIDA:${toHex2(l.depois.SAIDA)}`;
    const cacheText = l.cache ? (l.cache.hit ? '<span style="color:#80ff80;">HIT</span>' : '<span style="color:#ffb4ab;">MISS</span>') : '-';
    tr.innerHTML = `
      <td>${l.step}</td>
      <td><strong>${l.t}</strong></td>
      <td>${l.fase}</td>
      <td><code>${l.rtl}</code></td>
      <td>${sigs}</td>
      <td><code>${regs}</code></td>
      <td>${cacheText}</td>
    `;
    tbody.appendChild(tr);
  });
  const pane = document.getElementById('log-scroll-pane');
  if (pane) pane.scrollTop = pane.scrollHeight;
}

function formatAsciiByte(val) {
  const v = val & 0xFF;
  if (v === 0) return 'NUL';
  if (v >= 32 && v <= 126) return `'${String.fromCharCode(v)}'`;
  return `0x${toHex2(v)}`;
}

function renderRTLList() {
  const list = document.getElementById('rtl-list');
  const modeBadge = document.getElementById('cycle-mode-badge');
  const note = document.getElementById('mode-didactic-note');
  if (!list) return;

  const curFase = state.halted ? 'EXECUTE' : (lastTrace ? lastTrace.fase : 'FETCH');
  ['FETCH', 'DECODE', 'EXECUTE'].forEach(f => {
    const box = document.getElementById(`phase-box-${f}`);
    if (!box) return;
    const isActive = curFase === f;
    box.style.borderColor = isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)';
    box.style.background = isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-low)';
    box.style.color = isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)';
    if (f === 'DECODE' && state.mode === 'MANUAL') {
      box.style.opacity = '0.55';
      box.textContent = '2. DECODE (Estudante)';
    } else {
      box.style.opacity = '1';
      box.textContent = f === 'FETCH' ? '1. FETCH (T0–T2)' : (f === 'DECODE' ? '2. DECODE (T3)' : '3. EXECUTE (T4–T6)');
    }
  });

  if (modeBadge) {
    modeBadge.textContent = state.mode === 'MANUAL' ? 'Modo Manual (Circuito .circ)' : 'Modo Automático (UC + ISA)';
  }
  if (note) {
    note.innerHTML = state.mode === 'MANUAL'
      ? 'No <strong>Modo Manual</strong>, T2 pertence à fase <strong>FETCH</strong> (<code>IR ← MBR; PC ← PC+1</code>) e <em>o estudante exerce a decodificação ao decidir qual sinal acionar</em>.'
      : 'No <strong>Modo Automático</strong>, a Unidade de Controle (UC) decodifica <code>IR[7:4]</code> em <strong>T3 (DECODE)</strong> e aciona os sinais da tabela <code>UC_TABLE</code>.';
  }

  const r0 = toHex2(state.ram[0]);
  const r1 = toHex2(state.ram[1]);
  const sum01 = toHex2((state.ram[0] + state.ram[1]) & 0xFF);
  const pcHex = toHex2(state.regs.PC);
  const marHex = toHex2(state.regs.MAR);
  const mbrHex = toHex2(state.regs.MBR);
  const irHex = toHex2(state.regs.IR);
  const acHex = toHex2(state.regs.AC);

  if (state.mode === 'MANUAL') {
    const items = [
      { idx: 0, label: 'T0 · Busca (Fetch A): Endereçamento da RAM', rtl: `MAR ← PC (${pcHex}h)` },
      { idx: 1, label: 'T1 · Busca (Fetch B): Leitura da RAM[00h]', rtl: `MBR ← RAM[00h] (${r0}h)` },
      { idx: 2, label: 'T2 · Busca (Fetch C): Carga do IR e PC+1', rtl: `IR ← MBR (${r0}h); PC ← 01h` },
      { idx: 3, label: 'T3 · Execução (Execute): Soma 1ª Palavra', rtl: `AC ← 00h + ${r0}h = ${r0}h` },
      { idx: 7, label: 'T4–T7 · Ciclo 2 Completo: Soma 2ª Palavra', rtl: `AC ← ${r0}h + ${r1}h = ${sum01}h` }
    ];
    const activeGuided = (state.guidedStep - 1 + 8) % 8;
    list.innerHTML = items.map(it => {
      const isCurrent = state.stepCount > 0 && (activeGuided === it.idx || (it.idx === 7 && activeGuided >= 4));
      return `
        <li class="rtl-step-item ${isCurrent ? 'active-step' : ''}" onclick="jumpToGuidedStep(${it.idx})">
          <span><strong>${it.label}</strong></span>
          <span class="rtl-code">${it.rtl}</span>
        </li>
      `;
    }).join('');
  } else {
    const op = (state.regs.IR >> 4) & 0x0F;
    const imm = state.regs.IR & 0x0F;
    const info = ISA.OPCODES[op];
    const mnem = info ? `${info.mnemonic} ${info.type === 'imm' || info.type === 'addr' ? toHex2(imm) + 'h' : ''}`.trim() : `NOP (${toHex2(op)}h)`;
    const curT = state.halted ? 4 : (lastTrace ? parseInt(lastTrace.t.replace('T', ''), 10) : -1);
    const items = [
      { idx: 0, tMatch: [0], label: 'T0 · Busca (Fetch A): Endereçamento', rtl: `MAR ← PC (${pcHex}h)` },
      { idx: 1, tMatch: [1], label: 'T1 · Busca (Fetch B): Leitura via Cache/RAM', rtl: `MBR ← RAM[${marHex}h] (${toHex2(state.ram[state.regs.MAR])}h)` },
      { idx: 2, tMatch: [2], label: 'T2 · Busca (Fetch C): Carga do IR e PC+1', rtl: `IR ← MBR (${mbrHex}h); PC ← PC+1` },
      { idx: 3, tMatch: [3], label: 'T3 · Decodificação (Decode pela UC)', rtl: `IR=${irHex}h → ${mnem}` },
      { idx: 4, tMatch: [4, 5, 6], label: 'T4–T6 · Execução (Execute na ULA / E/S / RAM)', rtl: lastTrace && curT >= 4 ? lastTrace.rtl : `AC=${acHex}h · SAIDA=${toHex2(state.regs.SAIDA)}h` }
    ];
    list.innerHTML = items.map(it => {
      const isCurrent = it.tMatch.includes(curT);
      return `
        <li class="rtl-step-item ${isCurrent ? 'active-step' : ''}" onclick="jumpToGuidedStep(${it.idx})">
          <span><strong>${it.label}</strong></span>
          <span class="rtl-code">${it.rtl}</span>
        </li>
      `;
    }).join('');
  }
}

function renderCircuit() {
  // 1. Pinos e Fios de Controle
  const pinWireMap = {
    MAR_Load: ['wire-MAR_Load'],
    RAM_Read_MBR: ['wire-RAM_Read_MBR-1', 'wire-RAM_Read_MBR-2'],
    IR_Load: ['wire-IR_Load'],
    PC_Inc: ['wire-PC_Inc'],
    AC_Exec: ['wire-AC_Exec']
  };

  for (const [pin, val] of Object.entries(state.pins)) {
    const bg = document.getElementById(`pin-bg-${pin}`);
    const txt = document.getElementById(`pin-txt-${pin}`);
    const color = val === 1 ? '#00d800' : '#006400';
    if (bg) bg.setAttribute('fill', color);
    if (txt) txt.textContent = val.toString();

    pinWireMap[pin]?.forEach(wId => {
      const w = document.getElementById(wId);
      if (w) {
        w.setAttribute('stroke', color);
        w.setAttribute('stroke-width', val === 1 ? '3.5' : '3');
      }
    });
  }
  const nodeRam = document.getElementById('node-RAM_Read_MBR');
  if (nodeRam) nodeRam.setAttribute('fill', state.pins.RAM_Read_MBR === 1 ? '#00d800' : '#006400');

  // 1B. Destaque visual dos barramentos de Endereço e Dados ativos (B5)
  const sig = state.controlSignals || {};
  const addrPcMar = document.getElementById('wire-addr-pc-mar');
  const addrMarRam = document.getElementById('wire-addr-mar-ram');
  if (addrPcMar) addrPcMar.setAttribute('stroke', sig.MAR_Load ? '#2b6cb0' : '#010757');
  if (addrMarRam) addrMarRam.setAttribute('stroke', (sig.MAR_Load || sig.RAM_Read || sig.RAM_Write) ? '#2b6cb0' : '#010757');

  const dataRamMbr = document.getElementById('wire-data-ram-mbr');
  const dataMbrBus = document.getElementById('wire-data-mbr-bus');
  const dataMbrUla = document.getElementById('wire-data-mbr-ula');
  const dataUlaAc = document.getElementById('wire-data-ula-ac');
  const dataAcMon = document.getElementById('wire-data-ac-mon');
  const wireAcSaida = document.getElementById('wire-ac-saida');
  if (dataRamMbr) dataRamMbr.setAttribute('stroke', (sig.RAM_Read || sig.RAM_Write) ? '#d9381e' : '#3d0000');
  if (dataMbrBus) dataMbrBus.setAttribute('stroke', (sig.IR_Load || sig.AC_Load) ? '#d9381e' : '#3d0000');
  if (dataMbrUla) dataMbrUla.setAttribute('stroke', (sig.IR_Load || sig.AC_Load) ? '#d9381e' : '#3d0000');
  if (dataUlaAc) dataUlaAc.setAttribute('stroke', sig.AC_Load ? '#d9381e' : '#3d0000');
  if (dataAcMon) dataAcMon.setAttribute('stroke', (state.mode === 'MANUAL' && sig.AC_Load) ? '#d9381e' : '#3d0000');
  if (wireAcSaida) wireAcSaida.setAttribute('stroke', sig.SAIDA_Load ? '#00d800' : '#3d0000');

  // 2. Registradores no Canvas SVG
  document.getElementById('val-PC').textContent = toHex2(state.regs.PC);
  document.getElementById('val-MAR').textContent = toHex2(state.regs.MAR);
  document.getElementById('val-IR').textContent = toHex2(state.regs.IR);
  document.getElementById('val-MBR').textContent = toHex2(state.regs.MBR);
  document.getElementById('val-AC').textContent = toHex2(state.regs.AC);
  const valSaidaEl = document.getElementById('val-SAIDA');
  if (valSaidaEl) valSaidaEl.textContent = toHex2(state.regs.SAIDA);

  // Monitor: exibe SAIDA no modo Auto e AC no modo Manual, com binário + hex/dec/ASCII (B4)
  const monEl = document.getElementById('val-Monitor');
  const monLbl = document.getElementById('lbl-Monitor');
  const monMeta = document.getElementById('val-Monitor-meta');
  const monVal = state.mode === 'AUTO' ? state.regs.SAIDA : state.regs.AC;
  monEl.textContent = toBin8(monVal);
  if (monLbl) monLbl.textContent = state.mode === 'AUTO' ? 'Monitor (SAIDA)' : 'Monitor (AC)';
  if (monMeta) monMeta.textContent = `${toHex2(monVal)}h · ${monVal} · ${formatAsciiByte(monVal)}`;

  document.getElementById('val-Teclado').textContent = toBin8(state.teclado);
  const inpTec = document.getElementById('inp-teclado');
  if (inpTec && document.activeElement !== inpTec) inpTec.value = toHex2(state.teclado);

  // 3. Bloco Decoder UC no SVG (A4: no Modo Manual mostrar "decode manual" neutro)
  const decEl = document.getElementById('val-DECODER');
  if (state.mode === 'MANUAL') {
    decEl.textContent = 'decode manual';
    decEl.setAttribute('fill', '#00497d');
  } else {
    const opcode = (state.regs.IR >> 4) & 0x0F;
    const operand = state.regs.IR & 0x0F;
    const info = ISA.OPCODES[opcode];
    if (state.tState < 3 && state.stepCount > 0 && !state.halted) {
      decEl.textContent = 'FETCH';
      decEl.setAttribute('fill', '#006400');
    } else if (info) {
      decEl.textContent = `${info.mnemonic} ${info.type === 'imm' || info.type === 'addr' ? toHex2(operand) + 'h' : ''}`.trim();
      decEl.setAttribute('fill', '#00497d');
    } else {
      decEl.textContent = `NOP (${toHex2(opcode)}h)`;
      decEl.setAttribute('fill', '#cf6679');
    }
  }

  // 4. Bloco Cache L1 no SVG
  const cStatusBg = document.getElementById('cache-svg-status-bg');
  const cStatusTxt = document.getElementById('cache-svg-status-txt');
  const cDetails = document.getElementById('cache-svg-details');
  if (cStatusBg && cStatusTxt) {
    if (!state.cacheEnabled) {
      cStatusBg.setAttribute('fill', '#555555');
      cStatusTxt.textContent = 'OFF';
      if (cDetails) cDetails.textContent = `Bypass direto RAM`;
    } else if (state.cache.lastAccess) {
      const acc = state.cache.lastAccess;
      if (acc.hit) {
        cStatusBg.setAttribute('fill', '#00a000');
        cStatusTxt.textContent = 'HIT';
      } else {
        cStatusBg.setAttribute('fill', '#c0392b');
        cStatusTxt.textContent = 'MISS';
      }
      if (cDetails) cDetails.textContent = `L:${acc.line} T:${toHex2(acc.tag)} C:${state.cache.stats.cost}`;
    } else {
      cStatusBg.setAttribute('fill', '#555555');
      cStatusTxt.textContent = 'IDLE';
      if (cDetails) cDetails.textContent = `L:-- T:-- Custo:0`;
    }
  }

  // 5. Painel de Sinais de Controle da UC no Canvas (12 LEDs + Resumo)
  const hudSigList = document.getElementById('hud-sig-list');
  const hudPhase = document.getElementById('hud-phase-txt');
  const hudRtl = document.getElementById('hud-rtl-txt');
  const hudHalt = document.getElementById('hud-halt-badge');
  const hudAluTxt = document.getElementById('hud-txt-ALU_Op');
  const allSignals = ['MAR_Load', 'RAM_Read', 'RAM_Write', 'MBR_Load', 'MBR_From_AC', 'IR_Load', 'PC_Inc', 'AC_Load', 'ALU_Op', 'SAIDA_Load', 'IN_Read', 'HALT'];
  const activeSignalNames = Object.keys(sig).filter(k => sig[k] && sig[k] !== 'NONE');

  allSignals.forEach(sName => {
    const led = document.getElementById(`hud-led-${sName}`);
    if (!led) return;
    const isOn = sName === 'HALT' ? Boolean(state.halted || sig.HALT) : Boolean(sig[sName] && sig[sName] !== 'NONE');
    led.setAttribute('fill', isOn ? (sName === 'HALT' ? '#c0392b' : '#00d800') : '#cccccc');
  });
  if (hudAluTxt) {
    hudAluTxt.textContent = `ULA:${sig.ALU_Op && sig.ALU_Op !== 'NONE' ? sig.ALU_Op : 'IDLE'}`;
  }
  if (hudSigList) {
    hudSigList.textContent = activeSignalNames.length > 0 ? `Ativos: ${activeSignalNames.join(', ')}` : 'Ativos: IDLE';
  }
  if (hudPhase) hudPhase.textContent = state.halted ? 'HALT' : (lastTrace ? `${lastTrace.t}·${lastTrace.fase}` : 'T0·PRONTO');
  if (hudRtl) hudRtl.textContent = lastTrace ? (lastTrace.rtl.length > 23 ? lastTrace.rtl.substring(0, 23) + '…' : lastTrace.rtl) : 'MAR ← PC';
  if (hudHalt) hudHalt.style.display = state.halted ? 'block' : 'none';

  // 6. Janela deslizante de 4 endereços da RAM no SVG (Base = MAR & 0xFC)
  const baseAddr = state.regs.MAR & 0xFC;
  const activeAddr = state.regs.MAR & 0xFF;
  const ramRowBase = document.getElementById('ram-row-base');
  if (ramRowBase) ramRowBase.textContent = toHex2(baseAddr);

  for (let i = 0; i < 4; i++) {
    const curAddr = (baseAddr + i) & 0xFF;
    const box = document.getElementById(`ram-box-${i}`);
    const txt = document.getElementById(`ram-txt-${i}`);
    const addrLabel = document.getElementById(`ram-addr-${i}`);
    const hex = toHex2(state.ram[curAddr]);

    if (txt) txt.textContent = hex;
    if (addrLabel) addrLabel.textContent = toHex2(curAddr);

    if (curAddr === activeAddr) {
      box.setAttribute('fill', '#444444');
      txt.setAttribute('fill', '#ffffff');
      if (addrLabel) addrLabel.setAttribute('fill', '#80ff80');
    } else {
      box.setAttribute('fill', 'transparent');
      txt.setAttribute('fill', '#111111');
      if (addrLabel) addrLabel.setAttribute('fill', '#444444');
    }
  }

  // 7. Sequência do Ciclo de Instrução (Card 1) e Grid de 16 posições da RAM no Drawer (Card 3)
  renderRTLList();
  renderRAM16Grid();

  // 8. Tabela de Registradores no Drawer
  const aluOut = (state.regs.AC + state.regs.MBR) & 0xFF;
  document.getElementById('alu-preview').textContent = `ULA Out: ${toHex2(aluOut)}h (${aluOut})`;

  const regPinMap = {
    PC: ['PC_Inc', state.pins.PC_Inc],
    MAR: ['MAR_Load', state.pins.MAR_Load],
    MBR: ['RAM_Read_MBR', state.pins.RAM_Read_MBR],
    IR: ['IR_Load', state.pins.IR_Load],
    AC: ['AC_Exec', state.pins.AC_Exec],
    SAIDA: ['SAIDA_Load', state.controlSignals?.SAIDA_Load || 0]
  };

  for (const [rName, rVal] of Object.entries(state.regs)) {
    const hexEl = document.getElementById(`tbl-hex-${rName}`);
    const binEl = document.getElementById(`tbl-bin-${rName}`);
    const decEl = document.getElementById(`tbl-dec-${rName}`);
    const ctlCell = document.getElementById(`tbl-ctl-${rName}`);

    if (hexEl) hexEl.textContent = toHex2(rVal) + 'h';
    if (binEl) binEl.textContent = toBin8(rVal);
    if (decEl) decEl.textContent = rVal.toString();

    if (ctlCell && regPinMap[rName]) {
      const [pLabel, pVal] = regPinMap[rName];
      ctlCell.textContent = `${pLabel} = ${pVal}`;
      ctlCell.style.color = pVal === 1 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface-variant)';
    }
  }

  // 9. Tabela da Cache no Drawer
  renderCacheTable();

  // 10. Chips de Sinais de Controle no Drawer
  allSignals.forEach(sName => {
    const chip = document.getElementById(`chip-${sName}`);
    if (!chip) return;
    const active = Boolean(sig[sName] && sig[sName] !== 'NONE');
    if (sName === 'ALU_Op') {
      chip.textContent = `ALU_Op: ${active ? sig.ALU_Op : 'IDLE'}`;
    }
    if (sName === 'HALT') {
      chip.classList.toggle('active-halt', state.halted || active);
    } else {
      chip.classList.toggle('active', active);
    }
  });
  const ucDesc = document.getElementById('uc-state-desc');
  if (ucDesc) {
    ucDesc.textContent = state.halted ? 'HALT' : (lastTrace ? `${lastTrace.t} · ${lastTrace.fase}` : 'T0 · PRONTO');
  }

  // 11. Tabela de Log
  renderLogTable();

  if (state.activeInfoKey && typeof COMPONENT_INFO !== 'undefined' && COMPONENT_INFO[state.activeInfoKey]?.reg) {
    openInfo(state.activeInfoKey);
  }
}

function renderRAM16Grid() {
  const container = document.getElementById('ram-16-container');
  const pageInp = document.getElementById('ram-page-input');
  const pageRange = document.getElementById('ram-page-range');
  if (!container) return;
  if (pageInp && document.activeElement !== pageInp) {
    pageInp.value = toHex2(focusedRamAddr !== null ? focusedRamAddr : currentRamPage);
  }
  if (pageRange) {
    pageRange.textContent = `${toHex2(currentRamPage)}h–${toHex2(currentRamPage + 15)}h`;
  }

  container.innerHTML = '';
  const activeAddr = state.regs.MAR & 0xFF;

  for (let i = 0; i < 16; i++) {
    const addr = (currentRamPage + i) & 0xFF;
    const isMar = addr === activeAddr;
    const isFocused = addr === focusedRamAddr;
    const slot = document.createElement('div');
    slot.className = `ram-slot ${isMar || isFocused ? 'active-slot' : ''}`;
    slot.id = `slot-ram-${addr}`;
    slot.innerHTML = `
      <label for="inp-ram-${addr}">RAM[${toHex2(addr)}h]</label>
      <input id="inp-ram-${addr}" type="text" maxlength="2" value="${toHex2(state.ram[addr])}"
        onchange="updateRamFromInput(${addr}, this.value)">
    `;
    container.appendChild(slot);
  }
}

function renderCacheTable() {
  const tbody = document.getElementById('tbl-cache-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  const lastAcc = state.cache.lastAccess;

  state.cache.lines.forEach((line, idx) => {
    const tr = document.createElement('tr');
    const isAccessed = lastAcc && lastAcc.line === idx;
    const statusBadge = !line.valid
      ? '<span class="cache-badge-idle">INV</span>'
      : (isAccessed ? (lastAcc.hit ? '<span class="cache-badge-hit">HIT</span>' : '<span class="cache-badge-miss">MISS</span>') : '<span class="cache-badge-hit">VALID</span>');

    tr.innerHTML = `
      <td><strong>Linha ${idx}</strong></td>
      <td>${line.valid ? '1' : '0'}</td>
      <td>${line.valid ? toHex2(line.tag) : '--'}</td>
      <td>${line.valid ? toHex2(line.data[0]) : '--'}</td>
      <td>${line.valid ? toHex2(line.data[1]) : '--'}</td>
      <td>${statusBadge}</td>
    `;
    if (isAccessed) tr.style.backgroundColor = 'rgba(255,255,255,0.06)';
    tbody.appendChild(tr);
  });

  const s = state.cache.stats;
  document.getElementById('c-stat-reads').textContent = s.reads;
  document.getElementById('c-stat-hits').textContent = `${s.hits}H`;
  document.getElementById('c-stat-misses').textContent = `${s.misses}M`;
  const rate = s.reads > 0 ? ((s.hits / s.reads) * 100).toFixed(1) : '0.0';
  document.getElementById('c-stat-rate').textContent = `${rate}%`;
  document.getElementById('c-stat-cost').textContent = s.cost;
}

// Download do circuito oficial
const CIRC_URLS = [
  './src/Logarism-Evolution/neocore_cpu.circ',
  './src/neocore_cpu.circ',
  'https://raw.githubusercontent.com/joaopedro-chaves/simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/main/src/Logarism-Evolution/neocore_cpu.circ',
  'https://raw.githubusercontent.com/joaopedro-chaves/simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/main/src/neocore_cpu.circ'
];

async function downloadCircFile() {
  for (const candidateUrl of CIRC_URLS) {
    try {
      const resp = await fetch(candidateUrl);
      if (!resp.ok) continue;
      const text = await resp.text();
      if (!text.includes('<project')) continue;
      const blob = new Blob([text], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neocore_cpu.circ';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch (err) { }
  }
  window.open(CIRC_URLS[1], '_blank', 'noopener');
}

// Inicialização da renderização
renderCircuit();

/* ======================================================================
   CANVAS: ZOOM, ARRASTAR, EXPLICAÇÃO DE COMPONENTES E GAVETA DE PAINÉIS
   ====================================================================== */
const SVG_W = 1151, SVG_H = 441;
const view = { x: 0, y: 0, s: 1 };
const viewportEl = document.getElementById('canvas-viewport');
const svgEl = document.getElementById('logisim-svg');
let explainMode = false;
let dragMoved = false;

function applyView() {
  // Redimensiona o SVG (em vez de escalar por CSS) para o navegador re-rasterizar o vetor nítido em qualquer zoom
  svgEl.style.width = (SVG_W * view.s) + 'px';
  svgEl.style.height = (SVG_H * view.s) + 'px';
  svgEl.style.transform = `translate(${view.x}px, ${view.y}px)`;
  const g = 10 * view.s;
  viewportEl.style.backgroundSize = `${g}px ${g}px`;
  viewportEl.style.backgroundPosition = `${view.x - g / 2}px ${view.y - g / 2}px`;
  document.getElementById('zoom-readout').textContent = Math.round(view.s * 100) + '%';
}

function zoomAt(factor, cx, cy) {
  const ns = Math.min(6, Math.max(0.25, view.s * factor));
  const k = ns / view.s;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.s = ns;
  applyView();
}

function zoomBy(factor) {
  const r = viewportEl.getBoundingClientRect();
  zoomAt(factor, r.width / 2, r.height / 2);
}

function updateDockMetrics() {
  const dock = document.getElementById('dock');
  document.documentElement.style.setProperty('--dock-h', dock.offsetHeight + 'px');
  document.documentElement.style.setProperty('--dock-w', dock.offsetWidth + 'px');
}

function fitCanvas() {
  updateDockMetrics();
  const r = viewportEl.getBoundingClientRect();
  const dock = document.getElementById('dock');
  const card = document.getElementById('ctx-card');
  const drawer = document.getElementById('drawer');
  const drawerOpenDesktop = drawer.classList.contains('open') && window.innerWidth > 960;
  const availW = Math.max(200, r.width - (drawerOpenDesktop ? drawer.offsetWidth : 0));

  // Reserva a faixa inferior ocupada pela dock e pelo card, para não cobrir o circuito
  let reserve = dock.offsetHeight + 24;
  if (!card.classList.contains('hidden') && !dock.classList.contains('collapsed')) {
    reserve += card.offsetHeight + 10;
  }
  const availH = Math.max(140, r.height - reserve);
  const s = Math.min(availW / SVG_W, availH / SVG_H) * 0.96;
  view.s = s;
  view.x = (availW - SVG_W * s) / 2;
  view.y = Math.max(6, (availH - SVG_H * s) / 2);
  applyView();
}

viewportEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = viewportEl.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

const pointers = new Map();
let dragStart = null;
let pinchDist = 0;

viewportEl.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    dragStart = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, captured: false };
    dragMoved = false;
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    dragMoved = true;
  }
});

viewportEl.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const r = viewportEl.getBoundingClientRect();
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) zoomAt(d / pinchDist, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    pinchDist = d;
    return;
  }
  if (!dragStart) return;
  const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
  if (!dragStart.captured && Math.hypot(dx, dy) > 4) {
    dragStart.captured = true;
    dragMoved = true;
    viewportEl.setPointerCapture(e.pointerId);
    viewportEl.classList.add('panning');
  }
  if (dragStart.captured) {
    view.x = dragStart.vx + dx;
    view.y = dragStart.vy + dy;
    applyView();
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchDist = 0;
  if (pointers.size === 0) {
    dragStart = null;
    viewportEl.classList.remove('panning');
  }
}
viewportEl.addEventListener('pointerup', endPointer);
viewportEl.addEventListener('pointercancel', endPointer);

// Após arrastar, o clique resultante não deve acionar pinos nem abrir popups
viewportEl.addEventListener('click', (e) => {
  if (dragMoved) {
    e.stopPropagation();
    e.preventDefault();
    dragMoved = false;
  }
}, true);

window.addEventListener('resize', fitCanvas);
new ResizeObserver(updateDockMetrics).observe(document.getElementById('dock'));

function toggleExplainMode() {
  explainMode = !explainMode;
  document.getElementById('btn-explain').setAttribute('aria-pressed', String(explainMode));
  viewportEl.classList.toggle('explain-mode', explainMode);
}

function toggleDrawer() {
  const d = document.getElementById('drawer');
  const open = d.classList.toggle('open');
  document.body.classList.toggle('drawer-open', open);
  document.getElementById('btn-drawer').setAttribute('aria-pressed', String(open));
  if (window.innerWidth > 960) {
    setTimeout(fitCanvas, 50);
  }
}

function toggleDock() {
  const dock = document.getElementById('dock');
  const collapsed = dock.classList.toggle('collapsed');
  const btn = document.getElementById('btn-dock-collapse');
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.firstElementChild.style.transform = collapsed ? 'rotate(180deg)' : '';
  document.getElementById('ctx-card').classList.toggle('hidden', collapsed);
  updateDockMetrics();
  fitCanvas();
}

function clearComponentInfoView() {
  state.activeInfoKey = null;
  const chip = document.getElementById('ctx-chip');
  const dl = document.getElementById('ctx-fields');
  if (chip) {
    chip.hidden = true;
    chip.textContent = '';
  }
  if (dl) dl.replaceChildren();
  svgEl.querySelectorAll('.active-info').forEach((el) => el.classList.remove('active-info'));
}

function hideCtxCard() {
  clearComponentInfoView();
  document.getElementById('ctx-card').classList.add('hidden');
  fitCanvas();
}

function showCtxCard(pct) {
  document.getElementById('ctx-card').classList.remove('hidden');
  if (typeof pct === 'number') {
    document.getElementById('ctx-progress-fill').style.width = pct + '%';
    document.getElementById('ctx-progressbar').setAttribute('aria-valuenow', String(Math.round(pct)));
  }
}

// Ripple Material nos botões
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.m3-btn');
  if (!b) return;
  const rect = b.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const rp = document.createElement('span');
  rp.className = 'ripple';
  rp.style.width = rp.style.height = size + 'px';
  rp.style.left = (e.clientX - rect.left - size / 2) + 'px';
  rp.style.top = (e.clientY - rect.top - size / 2) + 'px';
  b.appendChild(rp);
  rp.addEventListener('animationend', () => rp.remove());
});

var COMPONENT_INFO = {
  PC: {
    title: 'PC — Contador de Programa (Program Counter)', kind: 'Registrador · 8 bits',
    desc: 'Guarda o endereço da próxima instrução a ser buscada na memória. Após cada busca é incrementado, o que faz o programa avançar sequencialmente.',
    fields: [['Entradas', 'clk (clock) e ct (contagem), ligada ao sinal PC_Inc'], ['Saída', 'Q → barramento de endereços → entrada D do MAR'], ['Fase', 'Lido em T0 (MAR ← PC) e incrementado em T2 (PC ← PC + 1)']],
    reg: 'PC'
  },
  MAR: {
    title: 'MAR — Registrador de Endereço de Memória', kind: 'Registrador · 8 bits',
    desc: 'Mantém o endereço que está sendo apresentado à memória. É a ponte entre a CPU e o barramento de endereços: nada é lido ou escrito na RAM sem passar por ele.',
    fields: [['Entradas', 'D (endereço vindo do PC ou do operando IR[3:0]), WE (MAR_Load) e clk'], ['Saída', 'Q → barramento de endereços → porta A da RAM / Cache'], ['Fase', 'T0: MAR ← PC; T4: MAR ← IR[3:0] (LDA/ADD/STA)']],
    reg: 'MAR'
  },
  MBR: {
    title: 'MBR — Registrador de Dados de Memória', kind: 'Registrador · 8 bits',
    desc: 'Retém temporariamente o byte lido da RAM (ou a ser gravado nela). Funciona como buffer entre o barramento de dados e o interior da CPU, distribuindo o valor para o IR e para a ULA.',
    fields: [['Entradas', 'D (barramento de dados da RAM ou AC via MBR_From_AC), WE (RAM_Read/MBR_Load) e clk'], ['Saída', 'Q → IR, entrada A da ULA e barramento de dados para gravação na RAM'], ['Fase', 'T1: MBR ← RAM[MAR]; T5: MBR ← AC (STA)']],
    reg: 'MBR'
  },
  IR: {
    title: 'IR — Registrador de Instrução', kind: 'Registrador · 8 bits',
    desc: 'Armazena a instrução recém-buscada enquanto a Unidade de Controle a decodifica. Seu conteúdo (nibble alto = opcode, nibble baixo = operando) determina as micro-operações acionadas.',
    fields: [['Entradas', 'D (vinda do MBR), WE (IR_Load) e clk'], ['Saída', 'Q → Decodificador da Unidade de Controle'], ['Fase', 'T2: IR ← MBR']],
    reg: 'IR'
  },
  DECODER: {
    title: 'Decodificador / Unidade de Controle (UC)', kind: 'Lógica combinacional e FSM',
    desc: 'Interpreta o opcode do IR e orquestra a máquina de estados (T0–T6). No Modo Manual, opera de forma neutra com acionamento manual de pinos. No Modo Automático, decodifica a ISA da CPU (ADDI, LDI, LDA, ADD, STA, OUT, IN, HLT).',
    fields: [['Entrada', 'Opcode IR[7:4] e operando IR[3:0]'], ['Saídas de Controle', 'MAR_Load, RAM_Read, RAM_Write, MBR_Load, MBR_From_AC, IR_Load, PC_Inc, AC_Load, ALU_Op, SAIDA_Load, IN_Read, HALT'], ['Fase', 'T3 (Decode) e T4..T6 (Execute)']]
  },
  CACHE: {
    title: 'Cache L1 — Hierarquia de Memória (Didática)', kind: 'Memória rápida · 4 linhas × 2 bytes',
    desc: 'Cache didática unificada de mapeamento direto posicionada entre o MAR e a RAM. Demonstra os princípios de localidade temporal e espacial: Leituras com HIT custam 1 ciclo; MISS custa 4 ciclos de barramento de memória (trazendo o bloco de 2 bytes da RAM). Escritas utilizam política Write-Through e No-Write-Allocate.',
    fields: [['Capacidade', '8 bytes (4 linhas de 2 bytes)'], ['Mapeamento', 'Direto (Offset: bit 0, Índice: bits 2:1, Tag: bits 7:3)'], ['Políticas', 'Write-Through e No-Write-Allocate'], ['Natureza', 'Representação conceitual didática (não presente no .circ do Logisim)']]
  },
  RAM: {
    title: 'RAM — Memória Principal 256 × 8', kind: 'Memória · 256 posições de 8 bits',
    desc: 'Armazena instruções e dados no mesmo espaço unificado (modelo Von Neumann). O endereço chega pelo barramento de endereços e o conteúdo trafega pelo barramento de dados. No canvas visualizamos uma janela de 4 posições (base = MAR & 0xFC), e no drawer é possível navegar em blocos de 16 posições por todo o espaço de 00h a FFh.',
    fields: [['Entradas', 'A (endereço, 8 bits), D (dado a gravar), WE e OE'], ['Saída', 'D (8 bits) → Barramento de dados / MBR'], ['Capacidade', '256 bytes acessíveis sem wrap-around']]
  },
  ULA: {
    title: 'ULA — Unidade Lógica e Aritmética', kind: 'Somador / Pass-through · 8 bits',
    desc: 'Executa as operações aritméticas e lógicas da CPU. Opera como somador de 8 bits (AC + MBR) ou transferência direta (PASS) para cargas no Acumulador.',
    fields: [['Entradas', 'A ← MBR, B ← AC (realimentação)'], ['Saída', 'A + B ou PASS → entrada D do AC'], ['Operações', 'ADD (ADDI, ADD), PASS (LDI, LDA, IN)']]
  },
  AC: {
    title: 'AC — Acumulador', kind: 'Registrador · 8 bits',
    desc: 'Registrador de trabalho principal que retém operandos e resultados intermediários da ULA. Seu valor pode ser enviado ao registrador SAIDA (instrução OUT) e realimenta a entrada B da ULA.',
    fields: [['Entradas', 'D (saída da ULA), WE (AC_Load / AC_Exec) e clk'], ['Saídas', 'Q → SAIDA, Monitor (modo manual) e entrada B da ULA'], ['Fase', 'T4 (ADDI/LDI/IN) ou T6 (LDA/ADD)']],
    reg: 'AC'
  },
  SAIDA: {
    title: 'SAIDA — Registrador de Saída de Dados (E/S)', kind: 'Registrador · 8 bits',
    desc: 'Registrador de saída dedicado, acionado pela instrução OUT (Opcode 0x5). Desacopla o acumulador do display externo e envia seu valor ao Monitor no Modo Automático.',
    fields: [['Entrada', 'Q do AC (habilitada pelo sinal SAIDA_Load)'], ['Saída', 'Monitor externo em tempo real'], ['Instrução', 'OUT (Opcode 0x5)']],
    reg: 'SAIDA'
  },
  MONITOR: {
    title: 'Monitor / Saída', kind: 'Pino de saída · 8 bits',
    desc: 'Exibe em binário e hexadecimal o resultado de saída. No Modo Automático, exibe o registrador SAIDA; no Modo Manual, espelha diretamente o Acumulador AC.',
    fields: [['Entrada', 'SAIDA (Modo Automático) ou AC (Modo Manual)']]
  },
  TECLADO: {
    title: 'Teclado — Entrada E/S', kind: 'Pino de entrada · 8 bits',
    desc: 'Dispositivo de entrada que fornece um byte à CPU. No Modo Automático é lido pela instrução IN (AC ← TECLADO). No simulador também permite gravação manual na RAM para testes de bancada.',
    fields: [['Saída', 'Barramento de dados interno / entrada D da RAM'], ['Valor editável', 'Painéis → “Teclado E/S” ou input no topo']]
  },
  CLOCK: {
    title: 'CLOCK — Sinal de sincronização', kind: 'Fonte · 1 bit',
    desc: 'Gera os pulsos que sincronizam todos os registradores. A cada borda de subida, os registradores com o sinal de escrita ativo capturam seus novos valores de forma síncrona.',
    fields: [['Saída', 'Rede de clock → entrada clk de PC, MAR, MBR, IR, AC e SAIDA'], ['No simulador', 'Pulso manual ou Auto-Clock com frequência ajustável (0.25x a 2x)']]
  },
  BUS_CLOCK: {
    title: 'Rede de Clock', kind: 'Fios · 1 bit',
    desc: 'Distribui o sinal de clock a todos os registradores do circuito, mantendo a operação sincronizada.',
    fields: [['Origem', 'CLOCK'], ['Destinos', 'clk de PC, MAR, MBR, IR, AC e SAIDA']]
  },
  BUS_CONTROL: {
    title: 'Barramento de Controle', kind: 'Fios de controle da UC',
    desc: 'Transporta os 12 sinais de controle gerados pela Unidade de Controle: MAR_Load, RAM_Read, RAM_Write, MBR_Load, MBR_From_AC, IR_Load, PC_Inc, AC_Load, ALU_Op, SAIDA_Load, IN_Read e HALT.',
    fields: [['Origem', 'Unidade de Controle (UC)'], ['Destinos', 'Habilitações WE/OE/Count de todos os registradores e barramentos']]
  },
  BUS_ADDR: {
    title: 'Barramento de Endereços', kind: 'Barramento · 8 bits · unidirecional',
    desc: 'Leva o endereço gerado pela CPU até a memória e a Cache L1, selecionando qual das 256 posições será acessada.',
    fields: [['Trajeto', 'PC / IR[3:0] → MAR → Cache L1 → porta A da RAM']]
  },
  BUS_DATA: {
    title: 'Barramento de Dados', kind: 'Barramento · 8 bits · bidirecional',
    desc: 'Transporta instruções, operandos e dados entre memória RAM, cache, registradores e periféricos de E/S.',
    fields: [['Trajeto', 'RAM ↔ Cache ↔ MBR ↔ IR / ULA ↔ AC ↔ SAIDA; Teclado ↔ RAM / AC']]
  },
  PIN_MAR_Load: {
    title: 'MAR_Load', kind: 'Sinal de controle · 1 bit',
    desc: 'Habilita a escrita do MAR. Em nível 1, o próximo pulso de clock copia o endereço presente no barramento para o MAR.',
    fields: [['Destino', 'WE do MAR'], ['Fase', 'T0 (Fetch) ou T4 (LDA/ADD/STA)']]
  },
  PIN_RAM_Read_MBR: {
    title: 'RAM_Read_MBR', kind: 'Sinal de controle · 1 bit',
    desc: 'Habilita a saída da RAM (OE) e a escrita do MBR, trazendo o byte do endereço indicado pelo MAR.',
    fields: [['Destinos', 'OE da RAM e WE do MBR'], ['Fase', 'T1 (Fetch) ou T5 (LDA/ADD)']]
  },
  PIN_IR_Load: {
    title: 'IR_Load', kind: 'Sinal de controle · 1 bit',
    desc: 'Habilita a escrita do IR, que captura a instrução presente no MBR.',
    fields: [['Destino', 'WE do IR'], ['Fase', 'T2 (Fetch)']]
  },
  PIN_PC_Inc: {
    title: 'PC_Inc', kind: 'Sinal de controle · 1 bit',
    desc: 'Habilita a contagem do PC: o contador avança para o endereço seguinte (PC ← PC + 1).',
    fields: [['Destino', 'ct do PC'], ['Fase', 'T2 (Fetch)']]
  },
  PIN_AC_Exec: {
    title: 'AC_Exec / AC_Load', kind: 'Sinal de controle · 1 bit',
    desc: 'Habilita a escrita do AC com o resultado gerado pela ULA (soma ou carga direta).',
    fields: [['Destino', 'WE do AC'], ['Fase', 'T3 (Manual) ou T4/T6 (Automático)']]
  }
};

function openInfo(key, targetEl) {
  const info = COMPONENT_INFO[key];
  if (!info) return;
  state.activeInfoKey = key;

  svgEl.querySelectorAll('.active-info').forEach((el) => el.classList.remove('active-info'));
  const highlightEl = targetEl || svgEl.querySelector(`[data-info="${key}"]`);
  if (highlightEl) highlightEl.classList.add('active-info');

  const chip = document.getElementById('ctx-chip');
  chip.textContent = info.kind;
  chip.hidden = false;

  document.getElementById('step-title').textContent = info.title;
  document.getElementById('step-desc').textContent = info.desc;

  const dl = document.getElementById('ctx-fields');
  dl.replaceChildren();
  const rows = info.fields.slice();
  if (info.reg) rows.push(['Valor atual', `${toHex2(state.regs[info.reg])}h (${toBin8(state.regs[info.reg])}b)`]);
  for (const [k, v] of rows) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }

  // Se a dock estiver minimizada, expande o card de contexto e destaca a barra inferior em 100%
  showCtxCard(100);
}

// Ao tocar/clicar em qualquer componente ou barramento com [data-info], exibe a explicação no #ctx-card.
// Nos pinos interativos (poke-target), se "Modo Explicação" estiver ativo, apenas explica sem acionar o pino;
// se estiver desativado, aciona o pino normalmente e também mostra a explicação do componente no #ctx-card.
svgEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-info]');
  if (!el) return;
  if (el.classList.contains('poke-target')) {
    if (explainMode) {
      e.stopPropagation();
      openInfo(el.dataset.info, el);
    } else if (el.dataset.info !== 'TECLADO') {
      setTimeout(() => openInfo(el.dataset.info, el), 0);
    }
    return;
  }
  e.stopPropagation();
  openInfo(el.dataset.info, el);
}, true);

fitCanvas();

/* ======================================================================
   TELA DE BLOQUEIO EM SMARTPHONES + GERADOR DE QR CODE (offline)
   ====================================================================== */
const GATE_MQ = window.matchMedia('(max-width: 767px), (max-height: 450px) and (max-width: 950px)');
const REPO_URL = 'https://github.com/joaopedro-chaves/simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF';

function applyGate() {
  const on = GATE_MQ.matches;
  // Desativa (inert + aria-hidden) todos os elementos da aplicação e barras de navegação enquanto o aviso estiver ativo
  ['.top-app-bar', '.workspace', '#dock', '#ctx-card', '#drawer'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.inert = on;
      el.setAttribute('aria-hidden', String(on));
    }
  });
  if (on) {
    if (state.autoClockTimer) toggleAutoClock();

  } else {
    fitCanvas();
  }
}
GATE_MQ.addEventListener('change', applyGate);

function toggleGateQr() {
  const box = document.getElementById('gate-qr');
  const surface = document.getElementById('gate-surface');
  const open = box.classList.toggle('open');
  surface.classList.toggle('qr-open', open);
  document.getElementById('btn-gate-qr').setAttribute('aria-expanded', String(open));
  document.getElementById('txt-gate-qr').textContent = open ? 'Ocultar QR Code' : 'Exibir QR Code';
  if (open && !box.dataset.ready) {
    let url = /^https?:$/.test(location.protocol) ? location.href.split('#')[0] : REPO_URL;
    let svg;
    try { svg = qrToSvg(url); } catch (err) { url = REPO_URL; svg = qrToSvg(url); }
    document.getElementById('gate-qr-code').innerHTML = svg;
    document.getElementById('gate-qr-url').textContent = url;
    box.dataset.ready = '1';
  }
}

/* Gerador de QR Code (modo byte, correção M, versões 1–10), baseado no algoritmo da ISO/IEC 18004 */
const QR_ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const QR_NUM_BLOCKS = [-1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5];

function qrMake(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const rawModules = (v) => {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  };
  let ver = 1, dataCw = 0;
  for (; ver <= 10; ver++) {
    dataCw = Math.floor(rawModules(ver) / 8) - QR_ECC_PER_BLOCK[ver] * QR_NUM_BLOCKS[ver];
    const cntBits = ver < 10 ? 8 : 16;
    if (4 + cntBits + bytes.length * 8 <= dataCw * 8) break;
  }
  if (ver > 10) throw new Error('URL longa demais para o QR Code');

  // 1. Bits de dados
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0x4, 4); put(bytes.length, ver < 10 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCw * 8 - bits.length));
  put(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xEC; bits.length < dataCw * 8; pad ^= 0xEC ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b);
  }

  // 2. Reed-Solomon (GF(256), polinômio 0x11D) e intercalação de blocos
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
  const eccLen = QR_ECC_PER_BLOCK[ver], nBlocks = QR_NUM_BLOCKS[ver];
  const div = new Array(eccLen).fill(0); div[eccLen - 1] = 1;
  for (let i = 0, root = 1; i < eccLen; i++) {
    for (let j = 0; j < eccLen; j++) { div[j] = mul(div[j], root); if (j + 1 < eccLen) div[j] ^= div[j + 1]; }
    root = mul(root, 2);
  }
  const rs = (blk) => {
    const res = new Array(eccLen).fill(0);
    blk.forEach((b) => { const f = b ^ res.shift(); res.push(0); div.forEach((c, i) => { res[i] ^= mul(c, f); }); });
    return res;
  };
  const rawCw = Math.floor(rawModules(ver) / 8);
  const nShort = nBlocks - rawCw % nBlocks, shortLen = Math.floor(rawCw / nBlocks);
  const blocks = [];
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1)); k += dat.length;
    const ecc = rs(dat); if (i < nShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const all = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((blk, j) => { if (i !== shortLen - eccLen || j >= nShort) all.push(blk[i]); });
  }

  // 3. Matriz de módulos e padrões de função
  const size = ver * 4 + 17;
  const mod = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const nAlign = ver === 1 ? 0 : Math.floor(ver / 7) + 2;
  const alignPos = [];
  if (nAlign) {
    const step = Math.ceil((ver * 4 + 4) / (nAlign * 2 - 2)) * 2;
    alignPos.push(6);
    for (let p = size - 7; alignPos.length < nAlign; p -= step) alignPos.splice(1, 0, p);
  }
  alignPos.forEach((ax, i) => alignPos.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === nAlign - 1) || (i === nAlign - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const d = (0 << 3) | mask; // correção M = 00
    let rem = d; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d << 10) | rem) ^ 0x5412, bit = (i) => ((f >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i));
    setFn(8, 7, bit(6)); setFn(8, 8, bit(7)); setFn(7, 8, bit(8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    const v = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const c = ((v >>> i) & 1) !== 0, a = size - 11 + i % 3, b = Math.floor(i / 3);
      setFn(a, b, c); setFn(b, a, c);
    }
  }

  // 4. Posicionamento dos codewords em zigue-zague
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x] && bi < all.length * 8) { mod[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
    }
  }

  // 5. Máscara com menor penalidade
  const maskFn = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0
  ];
  const applyMask = (m) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x]; };
  const penalty = () => {
    let p = 0, dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (mod[y][x]) dark++;
      if (x < size - 1 && y < size - 1 && mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) p += 3;
    }
    for (let a = 0; a < size; a++) for (const row of [true, false]) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        const cur = row ? mod[a][b] : mod[b][a], prev = row ? mod[a][b - 1] : mod[b - 1][a];
        if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
      }
    }
    return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  };
  let best = 0, bestP = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m); drawFormat(m);
    const p = penalty(); if (p < bestP) { bestP = p; best = m; }
    applyMask(m);
  }
  applyMask(best); drawFormat(best);
  return mod;
}

function qrToSvg(text) {
  const m = qrMake(text), n = m.length, q = 4;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x + q},${y + q}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

applyGate();
