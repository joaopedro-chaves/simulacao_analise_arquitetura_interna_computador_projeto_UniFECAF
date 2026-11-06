/**
 * test_model.js
 * Teste unitário e de conformidade do modelo puro da CPU NeoCore Tech 8-bit.
 * Extrai o trecho delimitado por /* MODEL:START * / e /* MODEL:END * / de src/script.js (com fallback para index.html)
 * e executa as 4 Demos do projeto, além de testes de limites e integridade da memória RAM.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('  TEST_MODEL.JS — Validação da CPU NeoCore Tech 8-bit (UniFECAF)');
console.log('================================================================\n');

// 1. Extração do Modelo Puro de src/script.js (ou fallback para index.html)
const scriptPath = path.join(__dirname, 'src', 'script.js');
const htmlPath = path.join(__dirname, 'index.html');
const sourceFile = fs.existsSync(scriptPath) ? scriptPath : htmlPath;
const sourceContent = fs.readFileSync(sourceFile, 'utf8');

const startTag = '/* MODEL:START */';
const endTag = '/* MODEL:END */';

const startIndex = sourceContent.indexOf(startTag);
const endIndex = sourceContent.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error(`ERRO FATAL: Marcadores /* MODEL:START */ e /* MODEL:END */ não encontrados em ${path.basename(sourceFile)}`);
  process.exit(1);
}

const modelSource = sourceContent.substring(startIndex + startTag.length, endIndex);
console.log(`[OK] Bloco do modelo puro extraído de ${path.relative(__dirname, sourceFile)} (${modelSource.length} bytes).\n`);

// 2. Criação do contexto de execução isolado (sem DOM / navegador)
const context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
vm.createContext(context);
vm.runInContext(modelSource, context);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName} ${details ? `(${details})` : ''}`);
    totalPassed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${details ? `— ${details}` : ''}`);
    totalFailed++;
  }
}

// ============================================================================
// TESTE 1: Demo 0 — Modo Manual (Caso do Relatório T0..T7)
// ============================================================================
console.log('----------------------------------------------------------------');
console.log('TESTE 1: Demo 0 (Modo Manual — Caso de Teste do Relatório)');
console.log('----------------------------------------------------------------');
{
  const m = context.createCPUModel('MANUAL');
  context.loadDemo(m, 0);

  // Executa os 8 passos guiados (T0..T7)
  const traces = [];
  for (let i = 0; i < 8; i++) {
    traces.push(context.stepGuidedManual(m));
  }

  assert(m.regs.AC === 0x08, 'Demo 0: AC final deve ser 08h', `Obtido: ${context.toHex2(m.regs.AC)}h`);
  assert(m.regs.MAR === 0x01, 'Demo 0: MAR final deve ser 01h', `Obtido: ${context.toHex2(m.regs.MAR)}h`);
  assert(m.regs.IR === 0x03, 'Demo 0: IR final deve ser 03h', `Obtido: ${context.toHex2(m.regs.IR)}h`);
  assert(m.regs.PC === 0x02, 'Demo 0: PC final deve ser 02h', `Obtido: ${context.toHex2(m.regs.PC)}h`);

  // Teste de reatividade da RAM: altera RAM[00h] para 07h e reexecuta
  context.resetModel(m, true);
  m.ram[0] = 0x07;
  for (let i = 0; i < 4; i++) context.stepGuidedManual(m);
  assert(m.regs.AC === 0x07, 'Demo 0 (Reatividade 1): AC após T3 com RAM[0]=07h deve ser 07h', `Obtido: ${context.toHex2(m.regs.AC)}h`);

  for (let i = 0; i < 4; i++) context.stepGuidedManual(m);
  assert(m.regs.AC === 0x0A, 'Demo 0 (Reatividade 2): AC após T7 com RAM[0]=07h + RAM[1]=03h deve ser 0Ah (10 dec)', `Obtido: ${context.toHex2(m.regs.AC)}h`);
}

// ============================================================================
// TESTE 2: Demo 1 — Modo Automático (ADDI 5; ADDI 3; OUT; HLT)
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 2: Demo 1 (Modo Automático — ADDI 5; ADDI 3; OUT; HLT)');
console.log('----------------------------------------------------------------');
{
  const m = context.createCPUModel('AUTO');
  context.loadDemo(m, 1);
  const traces = context.runUntilHalt(m, 100);

  assert(m.regs.AC === 0x08, 'Demo 1: AC final deve ser 08h', `Obtido: ${context.toHex2(m.regs.AC)}h`);
  assert(m.regs.SAIDA === 0x08, 'Demo 1: SAIDA final deve ser 08h', `Obtido: ${context.toHex2(m.regs.SAIDA)}h`);
  assert(m.halted === true, 'Demo 1: CPU deve estar em estado HALT', `Halted: ${m.halted}`);
  assert(m.cache.stats.hits === 2, 'Demo 1: Cache deve registrar 2 Hits', `Hits: ${m.cache.stats.hits}`);
  assert(m.cache.stats.misses === 2, 'Demo 1: Cache deve registrar 2 Misses', `Misses: ${m.cache.stats.misses}`);

  // Verifica que T3 é decode puro (sem alteração de registradores)
  const decodeSteps = traces.filter(t => t.t === 'T3');
  assert(decodeSteps.length === 4, 'Demo 1: Deve conter exatamente 4 fases T3 de DECODE', `Obtido: ${decodeSteps.length}`);
  const pureDecode = decodeSteps.every(t => {
    return t.antes.PC === t.depois.PC &&
           t.antes.AC === t.depois.AC &&
           t.antes.MAR === t.depois.MAR &&
           t.antes.MBR === t.depois.MBR &&
           t.antes.IR === t.depois.IR;
  });
  assert(pureDecode, 'Demo 1: T3 DECODE não deve alterar nenhum registrador (RTL puro)');
}

// ============================================================================
// TESTE 3: Demo 2 — Modo Automático (LDA 0Eh; ADD 0Fh; OUT; HLT)
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 3: Demo 2 (Modo Automático — 2E 3F 50 F0 com RAM[0E]=07 e RAM[0F]=09)');
console.log('----------------------------------------------------------------');
{
  const m = context.createCPUModel('AUTO');
  context.loadDemo(m, 2);
  const traces = context.runUntilHalt(m, 100);

  assert(m.regs.AC === 0x10, 'Demo 2: AC final deve ser 10h (16 dec)', `Obtido: ${context.toHex2(m.regs.AC)}h`);
  assert(m.regs.SAIDA === 0x10, 'Demo 2: SAIDA final deve ser 10h', `Obtido: ${context.toHex2(m.regs.SAIDA)}h`);
  assert(m.halted === true, 'Demo 2: CPU deve estar em estado HALT', `Halted: ${m.halted}`);
  assert(m.cache.stats.hits === 3, 'Demo 2: Cache deve registrar 3 Hits', `Hits: ${m.cache.stats.hits}`);
  assert(m.cache.stats.misses === 3, 'Demo 2: Cache deve registrar 3 Misses (miss em 00h, 0Eh e 02h)', `Misses: ${m.cache.stats.misses}`);
}

// ============================================================================
// TESTE 4: Demo 3 — Modo Automático com Entrada E/S (IN; ADDI 1; OUT; HLT)
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 4: Demo 3 (Modo Automático — IN; ADDI 1; OUT; HLT com TECLADO=0Ah)');
console.log('----------------------------------------------------------------');
{
  const m = context.createCPUModel('AUTO');
  context.loadDemo(m, 3);
  context.runUntilHalt(m, 100);

  assert(m.regs.SAIDA === 0x0B, 'Demo 3: SAIDA final deve ser 0Bh (11 dec)', `Obtido: ${context.toHex2(m.regs.SAIDA)}h`);
  assert(m.cache.stats.hits === 2, 'Demo 3: Cache deve registrar 2 Hits', `Hits: ${m.cache.stats.hits}`);
  assert(m.cache.stats.misses === 2, 'Demo 3: Cache deve registrar 2 Misses', `Misses: ${m.cache.stats.misses}`);
}

// ============================================================================
// TESTE 5: Memória RAM 256x8 (Acessos além de 03h sem wrap-around)
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 5: Acesso à Memória RAM 256 posições (Sem wrap-around)');
console.log('----------------------------------------------------------------');
{
  const m = context.createCPUModel('MANUAL');
  m.ram[0x42] = 0xAA;
  m.ram[0xFF] = 0x55;

  // Testa leitura pelo MAR em 42h
  m.regs.MAR = 0x42;
  m.pins = { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 };
  context.step(m);
  assert(m.regs.MBR === 0xAA, 'RAM[42h] lida com sucesso sem wrap-around', `Obtido: ${context.toHex2(m.regs.MBR)}h`);

  // Testa leitura pelo MAR em FFh
  m.regs.MAR = 0xFF;
  m.pins = { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 };
  context.step(m);
  assert(m.regs.MBR === 0x55, 'RAM[FFh] lida com sucesso sem wrap-around', `Obtido: ${context.toHex2(m.regs.MBR)}h`);

  // Testa escrita manual do teclado em endereço alto
  m.regs.MAR = 0x80;
  m.teclado = 0x33;
  context.writeTecladoToRAMModel(m);
  assert(m.ram[0x80] === 0x33, 'Escrita de Teclado em RAM[80h] preservada no endereço de 8 bits', `Obtido: ${context.toHex2(m.ram[0x80])}h`);
}

// ============================================================================
// TESTE 6: Comparação de Custo com Cache Ativada vs Desativada
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 6: Cache Didática — Comparação de Custo (Ligada vs Desligada)');
console.log('----------------------------------------------------------------');
{
  const mOn = context.createCPUModel('AUTO');
  mOn.cacheEnabled = true;
  context.loadDemo(mOn, 1);
  context.runUntilHalt(mOn, 100);
  const costOn = mOn.cache.stats.cost; // 2 hits * 1 + 2 misses * 4 = 10

  const mOff = context.createCPUModel('AUTO');
  mOff.cacheEnabled = false;
  context.loadDemo(mOff, 1);
  context.runUntilHalt(mOff, 100);
  const costOff = mOff.cache.stats.cost; // 4 leituras diretas * 4 = 16 (ou custo maior)

  assert(costOn < costOff, 'Custo com Cache L1 ligada deve ser menor que sem cache', `Cache On: ${costOn} ciclos, Cache Off: ${costOff} ciclos`);
}

// ============================================================================
// TESTE 7: Critério 3 (LDI 5 com 15h na RAM[00h]), STA e Tabela da UC (B2)
// ============================================================================
console.log('\n----------------------------------------------------------------');
console.log('TESTE 7: Critério 3 (RAM[00h]=15h -> LDI 5), STA e UC_TABLE');
console.log('----------------------------------------------------------------');
{
  // Critério 3: Editar RAM[00h] para 15h no Modo Automático executa LDI 5 (AC = 05h, não 15h/21)
  const mLdi = context.createCPUModel('AUTO');
  context.loadDemo(mLdi, 1);
  mLdi.ram[0x00] = 0x15; // LDI 5 (opcode 1, imediato 5)
  mLdi.ram[0x01] = 0x4E; // STA 0Eh (armazena AC em RAM[0Eh])
  mLdi.ram[0x02] = 0xF0; // HLT
  context.stepInstruction(mLdi); // Executa apenas a 1ª instrução (15h = LDI 5)
  assert(mLdi.regs.AC === 0x05, 'Critério 3: RAM[00h]=15h no Modo Automático carrega AC = 05h (LDI 5, e não soma 21)', `Obtido: ${context.toHex2(mLdi.regs.AC)}h`);

  // Executa o restante até HLT (STA 0Eh + HLT)
  context.runUntilHalt(mLdi, 100);
  assert(mLdi.ram[0x0E] === 0x05, 'Instrução STA 0Eh: deve gravar AC (05h) em RAM[0Eh]', `Obtido: ${context.toHex2(mLdi.ram[0x0E])}h`);

  // Verifica que UC_TABLE existe e mapeia estados T0..T6 via lookupUCEntry
  const ldiEntry = context.lookupUCEntry(4, 0x1);
  assert(ldiEntry && ldiEntry.signals.ALU_Op === 'PASS' && ldiEntry.signals.AC_Load === 1, 'Tabela declarativa UC_TABLE mapeia T4 x LDI (0x1) -> ALU_Op: PASS, AC_Load: 1');

  // Verifica que no Modo Manual o step() preserva os pinos manuais e atualiza controlSignals
  const mMan = context.createCPUModel('MANUAL');
  mMan.ram[0x00] = 0x09;
  mMan.pins = { MAR_Load: 0, RAM_Read_MBR: 1, IR_Load: 0, PC_Inc: 0, AC_Exec: 0 };
  context.step(mMan);
  assert(mMan.regs.MBR === 0x09 && mMan.controlSignals.RAM_Read === 1 && mMan.controlSignals.MBR_Load === 1, 'Modo Manual: step() atualiza controlSignals para o HUD e preserva pinos manuais');
}

// ============================================================================
// RESUMO FINAL
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${totalPassed + totalFailed}`);
console.log(`PASSOU: \x1b[32m${totalPassed}\x1b[0m`);
console.log(`FALHOU: \x1b[31m${totalFailed}\x1b[0m`);
console.log('================================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mTODOS OS TESTES PASSARAM COM SUCESSO!\x1b[0m\n');
  process.exit(0);
}

