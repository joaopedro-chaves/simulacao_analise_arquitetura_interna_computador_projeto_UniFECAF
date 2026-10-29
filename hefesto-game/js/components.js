/*
 * Dados dos componentes da placa-mãe.
 * Para adicionar um novo componente, basta incluir um objeto aqui.
 * Futuro: adicionar campo `sprite` quando entrar a pixel art.
 */
const COMPONENTS = [
  {
    id: 'cpu', label: 'CPU', color: '#4250fbff', border: '#4229ffff',
    x: 700, y: 400, w: 200, h: 200,
    name: 'CPU (Processador)',
    role: 'O cérebro do computador',
    text: 'A CPU executa as instruções dos programas. Ela faz contas e toma decisões milhões de vezes por segundo, comandando todos os outros componentes.',
    fun: 'Curiosidade: a velocidade da CPU é medida em GHz (bilhões de ciclos por segundo).'
  },
  {
    id: 'ram', label: 'RAM', color: '#ec1cffff', border: '#ff1cf0ff',
    // Quatro pentes de memória finos e compridos
    x: 1100, y: 120, w: 24, h: 280,
    copies: 4, gap: 18,
    name: 'Memória RAM',
    role: 'A mesa de trabalho do computador',
    text: 'A RAM guarda temporariamente os dados dos programas que estão abertos, para a CPU acessá-los muito rápido. Quando o computador desliga, tudo que está na RAM some.',
    fun: 'Curiosidade: quanto mais RAM, mais programas você abre ao mesmo tempo sem travar.'
  },
  {
    id: 'ssd', label: 'SSD', color: '#ff86f1ff', border: '#ffb2fdff',
    x: 200, y: 700, w: 220, h: 120,
    name: 'Disco / SSD',
    role: 'O cofre de armazenamento',
    text: 'O SSD (ou HD) guarda seus arquivos, fotos, jogos e o sistema operacional de forma permanente, mesmo com o computador desligado.',
    fun: 'Curiosidade: o SSD não tem partes móveis, por isso é muito mais rápido que o HD antigo.'
  },
  {
    id: 'gpu', label: 'GPU', color: '#2a8423ff', border: '#39fb28ff',
    x: 220, y: 190, w: 300, h: 130,
    name: 'GPU (Placa de Vídeo)',
    role: 'A artista do computador',
    text: 'A GPU cuida dos gráficos: desenha imagens, vídeos e cenários de jogos na tela, processando milhares de pixels ao mesmo tempo.',
    fun: 'Curiosidade: GPUs também são usadas para treinar inteligências artificiais.'
  }
];

/* Expande componentes com `copies` em retângulos individuais (sólidos). */
function buildSolids() {
  const solids = [];
  for (const c of COMPONENTS) {
    const n = c.copies || 1;
    for (let i = 0; i < n; i++) {
      solids.push({ ...c, x: c.x + i * (c.w + (c.gap || 0)), parent: c });
    }
  }
  return solids;
}

/* Trilhas de circuito (barramentos): listas de pontos [x, y]. */
const TRACES = [
  [[800, 400], [800, 330], [520, 330], [520, 255]],           // CPU -> GPU
  [[900, 480], [1060, 480], [1060, 330], [1100, 330]],        // CPU -> RAM
  [[1160, 480], [1160, 400]],
  [[700, 520], [560, 520], [560, 760], [420, 760]],           // CPU -> SSD
  [[800, 600], [800, 900], [1300, 900]],                      // barramento inferior
  [[100, 100], [100, 900], [800, 900]],                       // barramento externo
  [[1300, 100], [1300, 900]],
  [[900, 540], [1300, 540]]
];
