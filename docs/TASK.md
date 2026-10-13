# Tarefas do Projeto - UniFECAF

## Pré-produção e Pesquisa
- [x] Criar repositório Git e estrutura de pastas (`docs/`, `src/`, `dist/`)
- [x] Criar README.md inicial
- [x] Ler e entender os requisitos da entrega (`docs/REQUEST.md`)
- [x] Pesquisar em livros confiáveis (Tanenbaum / Stallings):
  - [x] Arquitetura Von Neumann vs. Harvard / RISC vs. CISC, Arquitetura modificada x86-64
  - [x] Componentes da CPU: ULA, Unidade de Controle e Registradores (`PC`, `MAR`, `MBR`, `IR`, `AC`)
  - [x] Barramentos (Dados, Endereço e Controle)
  - [x] Ciclo de instrução (*Busca*, *Decodificação* e *Execução*)

## Produção

### Parte Teórica – Relatório Técnico (25% da nota)
- [ ] Preencher o relatório em `docs/technical_report.md`:
  - [x] **Introdução:** Apresentar a empresa (NeoCore Tech) e o objetivo do simulador
  - [x] **Arquitetura Escolhida:** Explicar por que escolheu Von Neumann [REVISAR]
  - [x] **Componentes:** Explicar para que serve cada registrador, ULA, UC e barramentos [REVISAR]
  - [x] **Ciclo de Instrução:** Explicar o passo a passo da busca, decodificação e execução [REVISAR]
  - [ ] **Resultados e Prática:** Inserir imagens e explicar como o simulador funcionou
  - [ ] **Conclusão:** Resumir o impacto do projeto para o aprendizado
  - [ ] **Referências:** Citar os livros usados (formato ABNT)
- [ ] Revisar o texto e exportar para PDF na pasta `dist/`

### Parte Prática – Simulador (50% da nota)
- [ ] Escolher e abrir a ferramenta de simulação (Logisim, Tinkercad ou código)
- [ ] Montar a memória RAM e os barramentos (Dados, Endereço e Controle)
- [ ] Montar os componentes da CPU:
  - [ ] Registradores (`PC`, `MAR`, `MBR`, `IR`, `AC`)
  - [ ] Unidade Lógica e Aritmética (ULA)
  - [ ] Unidade de Controle (UC)
- [ ] Carregar uma instrução de teste na memória (ex: `LOAD`, `ADD` ou `STORE`)
- [ ] Testar e validar o ciclo passo a passo:
  - [ ] 1. **Busca (Fetch):** Enviar endereço do `PC`, buscar na memória e guardar no `IR`
  - [ ] 2. **Decodificação (Decode):** Interpretar o que a instrução faz
  - [ ] 3. **Execução (Execute):** Fazer a operação na ULA e salvar o resultado
- [ ] Salvar os arquivos do circuito e imagens na pasta `src/` e `docs/assets/`
### Vídeo Pitch (25% da nota)
- [ ] Revisar o roteiro em `docs/pitch/pitch_script.md` (máximo de 4 minutos)
- [ ] Gravar o vídeo dividido em 4 blocos:
  - [ ] Bloco 1 (~ 0:45 min): Apresentação pessoal e o objetivo do projeto
  - [ ] Bloco 2 (~ 1:00 min): Explicação da arquitetura e dos componentes da CPU
  - [ ] Bloco 3 (~ 1:30 min): Demonstração prática do simulador executando a instrução
  - [ ] Bloco 4 (~ 0:45 min): Conclusão e encerramento
- [ ] Editar o vídeo e postar no YouTube (não-listado ou público)
- [ ] Colar o link do vídeo no README, no relatório e no roteiro

## Pós-produção e Entrega
- [ ] Conferir se todos os entregáveis estão prontos (Simulador, Relatório PDF e Link do Vídeo)
- [ ] Fazer commit e push final no Git
- [ ] Enviar o trabalho na plataforma da UniFECAF dentro do prazo

## hefesto-game (Extra)