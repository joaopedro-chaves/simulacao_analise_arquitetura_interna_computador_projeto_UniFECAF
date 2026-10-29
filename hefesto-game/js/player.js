/* =====================================================================
 * CONFIGURAÇÃO DE RECORTE DO SPRITE (PIXELS EXATOS)
 * Edite os valores abaixo de acordo com as coordenadas da sua imagem:
 * - x: pixel horizontal inicial na imagem
 * - y: pixel vertical inicial na imagem
 * - w: largura do frame em pixels
 * - h: altura do frame em pixels
 * ===================================================================== */
const PLAYER_SPRITE_CLIPS = {
  // Caminho da imagem (coloque seu arquivo nessa pasta)
  imageSrc: 'images/sprites/player/astro_sprites.png',
  // Recortes em pixels para cada direção:
  front: { x: 0, y: 0, w: 16, h: 16 },
  right: { x: 16, y: 0, w: 16, h: 16 },
  left: { x: 32, y: 0, w: 16, h: 16 },
  up: { x: 48, y: 0, w: 16, h: 16 },
  down: { x: 64, y: 0, w: 16, h: 16 },
  ne: { x: 80, y: 0, w: 16, h: 16 },
  se: { x: 96, y: 0, w: 16, h: 16 },
  sw: { x: 112, y: 0, w: 16, h: 16 },
  nw: { x: 128, y: 0, w: 16, h: 16 },
};

/* =====================================================================
 * CONFIGURAÇÃO DO CURSOR / BÚSSOLA
 * O cursor orbita o jogador em um círculo invisível apontando a direção.
 * Estados: default -> transform -> select (ao se aproximar de componentes)
 * ===================================================================== */
const CURSOR_CONFIG = {
  // Caminho da imagem (sprite sheet com os 3 estados lado a lado)
  imageSrc: 'images/sprites/cursor/cursor.png',
  // Recortes em pixels para cada estado:
  default: { x: 0, y: 0, w: 12, h: 8 },
  transform: { x: 12, y: 0, w: 12, h: 8 },
  select: { x: 24, y: 0, w: 12, h: 8 },
  radius: 26,          // Distância (raio) do círculo invisível em volta do jogador
  width: 15,           // Largura do cursor na tela
  height: 10,          // Altura do cursor na tela
  transformDuration: 0.20 // Duração em segundos da animação de transformação
};

/* Jogador: movimento suave, colisão AABB por eixo e direção. */
const Player = {
  x: 600, y: 700,
  size: CONFIG.PLAYER_SIZE,
  dir: 'down',
  angle: Math.PI / 2, // Ângulo da direção em radianos (inicial: apontando para baixo)
  sprite: new Image(),
  spriteLoaded: false,

  // Sprite sheet e estados do cursor
  cursorSprite: new Image(),
  cursorLoaded: false,
  cursorState: 'default', // 'default' | 'transform' | 'select'
  cursorTimer: 0,
  isNearTarget: false,

  init() {
    this.sprite.src = PLAYER_SPRITE_CLIPS.imageSrc;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
    this.sprite.onerror = () => {
      this.spriteLoaded = false;
    };

    // Carregamento do sprite sheet do cursor
    this.cursorSprite.src = CURSOR_CONFIG.imageSrc;
    this.cursorSprite.onload = () => { this.cursorLoaded = true; };
    this.cursorSprite.onerror = () => { this.cursorLoaded = false; };
  },

  update(dt, solids, near) {
    let dx = 0, dy = 0;
    if (Input.isDown('left')) dx -= 1;
    if (Input.isDown('right')) dx += 1;
    if (Input.isDown('up')) dy -= 1;
    if (Input.isDown('down')) dy += 1;

    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; } // diagonal normalizada
    if (dx || dy) {
      this.angle = Math.atan2(dy, dx);

      // Suporte às 8 direções para coincidir com os recortes do sprite
      if (dx > 0 && dy < 0) this.dir = 'ne';
      else if (dx < 0 && dy < 0) this.dir = 'nw';
      else if (dx > 0 && dy > 0) this.dir = 'se';
      else if (dx < 0 && dy > 0) this.dir = 'sw';
      else if (dx > 0) this.dir = 'right';
      else if (dx < 0) this.dir = 'left';
      else if (dy > 0) this.dir = 'down';
      else if (dy < 0) this.dir = 'up';
    }

    // Gerencia animação do cursor (default -> transform -> select)
    const hasTarget = !!near;
    if (hasTarget && !this.isNearTarget) {
      // Chegou perto de um componente: executa transform e depois select
      this.isNearTarget = true;
      this.cursorState = 'transform';
      this.cursorTimer = CURSOR_CONFIG.transformDuration;
    } else if (!hasTarget && this.isNearTarget) {
      // Afastou-se do componente: volta por transform e depois default
      this.isNearTarget = false;
      this.cursorState = 'transform';
      this.cursorTimer = CURSOR_CONFIG.transformDuration;
    }

    if (this.cursorTimer > 0) {
      this.cursorTimer -= dt;
      if (this.cursorTimer <= 0) {
        this.cursorState = this.isNearTarget ? 'select' : 'default';
      }
    }

    // Se estiver perto de um componente, a bússola aponta na direção dele
    if (hasTarget) {
      const compCx = near.x + near.w / 2;
      const compCy = near.y + near.h / 2;
      const cx = this.x + this.size / 2;
      const cy = this.y + this.size / 2;
      this.angle = Math.atan2(compCy - cy, compCx - cx);
    }

    // Move e resolve colisão separadamente em cada eixo (permite deslizar nas paredes)
    this.x += dx * CONFIG.PLAYER_SPEED * dt;
    this.x = Math.max(0, Math.min(CONFIG.WORLD_W - this.size, this.x));
    for (const s of solids) {
      if (this.overlaps(s)) {
        this.x = dx > 0 ? s.x - this.size : s.x + s.w;
      }
    }

    this.y += dy * CONFIG.PLAYER_SPEED * dt;
    this.y = Math.max(0, Math.min(CONFIG.WORLD_H - this.size, this.y));
    for (const s of solids) {
      if (this.overlaps(s)) {
        this.y = dy > 0 ? s.y - this.size : s.y + s.h;
      }
    }
  },

  overlaps(r) {
    return this.x < r.x + r.w && this.x + this.size > r.x &&
      this.y < r.y + r.h && this.y + this.size > r.y;
  },

  /* Distância entre o jogador e a borda de um retângulo. */
  distanceTo(r) {
    const cx = this.x + this.size / 2, cy = this.y + this.size / 2;
    const dx = Math.max(r.x - cx, 0, cx - (r.x + r.w));
    const dy = Math.max(r.y - cy, 0, cy - (r.y + r.h));
    return Math.hypot(dx, dy);
  },

  draw(ctx) {
    const cx = this.x + this.size / 2, cy = this.y + this.size / 2;

    // 1. Desenha o personagem (sprite recortado ou fallback geométrico)
    if (this.spriteLoaded && this.sprite.complete && this.sprite.naturalWidth > 0) {
      const clip = PLAYER_SPRITE_CLIPS[this.dir] || PLAYER_SPRITE_CLIPS.down;
      ctx.drawImage(
        this.sprite,
        clip.x, clip.y, clip.w, clip.h,  // Coordenadas exatas de corte na imagem
        this.x, this.y, this.size, this.size // Posição e tamanho na tela
      );
    } else {
      // Fallback geométrico (enquanto a imagem não é carregada)
      const s = this.size;
      ctx.fillStyle = '#287affff';
      ctx.fillRect(this.x, this.y, s, s);
      ctx.strokeStyle = '#8fbcffff';
      ctx.lineWidth = 2;
      ctx.roundRect(this.x, this.y, s, s, 4);
      ctx.stroke();
    }

    // 2. Desenha o cursor (bússola conduzida no círculo invisível ao redor do jogador)
    this.drawCompassCursor(ctx, cx, cy);
  },

  drawCompassCursor(ctx, cx, cy) {
    const r = CURSOR_CONFIG.radius;
    // Posição no círculo invisível em volta do jogador
    const cursorX = cx + Math.cos(this.angle) * r;
    const cursorY = cy + Math.sin(this.angle) * r;

    ctx.save();
    ctx.translate(cursorX, cursorY);
    // Gira para a ponta do cursor apontar para fora do círculo
    ctx.rotate(this.angle + Math.PI / 2);

    const state = this.cursorState;
    const img = this.cursorSprite;
    const loaded = this.cursorLoaded && img.complete && img.naturalWidth > 0;

    if (loaded) {
      const clip = CURSOR_CONFIG[state] || CURSOR_CONFIG.default;
      const w = CURSOR_CONFIG.width;
      const h = CURSOR_CONFIG.height;
      ctx.drawImage(
        img,
        clip.x, clip.y, clip.w, clip.h, // Coordenadas exatas de corte na imagem
        -w / 2, -h / 2, w, h            // Posição e tamanho na tela
      );
    } else {
      // Fallback visual caso a imagem correspondente ainda esteja carregando
      ctx.fillStyle = state === 'select' ? '#f5c542' : (state === 'transform' ? '#38e8a0' : '#287aff');
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 5);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
};
