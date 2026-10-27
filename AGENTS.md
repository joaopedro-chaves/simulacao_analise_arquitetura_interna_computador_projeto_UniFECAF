# Guia de Agentes de IA (AGENTS.md)

Este documento estabelece as diretrizes, contexto arquitetural, convenções e regras de operação para agentes autônomos e copilotos de Inteligência Artificial trabalhando no repositório **UniFECAF - Simulação e Análise de Arquitetura Interna de um Computador (NeoCore Tech)**.

---

## 1. Visão Geral do Projeto

- **Instituição:** Centro Universitário UniFECAF
- **Disciplina:** Computer Architecture and Organization (Arquitetura e Organização de Computadores)
- **Autor / Aluno:** João Pedro Vieira da Costa Chaves
- **Cenário da Proposta:** Prova de Conceito (PoC) para a empresa fictícia educacional **NeoCore Tech**.
- **Objetivo Central:** Criar um simulador didático e documentação que expliquem de forma visual, prática e conceitualmente rigorosa o funcionamento interno da CPU e dos barramentos durante o ciclo de instrução (*fetch-decode-execute*).
- **Pergunta Norteadora:** *Como os diferentes componentes de um computador trabalham de forma coordenada para buscar, interpretar e executar uma instrução?*

---

## 2. Estrutura do Repositório

```text
simulacao_analise_arquitetura_interna_computador_projeto_UniFECAF/
├── .gitignore                      # Arquivos e pastas ignorados pelo Git
├── .obsidian/                      # Configurações do vault Obsidian
├── AGENTS.md                       # Diretrizes para agentes de IA (este arquivo)
├── README.md                       # Apresentação do projeto e visão geral
├── docs/                           # Documentação e pesquisa acadêmica
│   ├── REQUEST.md                  # Especificações e critérios resumidos da entrega
│   ├── ROADMAP_PROJECT.md          # Cronograma, diretrizes e política de uso de IA
│   ├── TASK.md                     # Checklist de tarefas do projeto
│   ├── NOTES.md                    # Anotações de pesquisa e referências bibliográficas
│   ├── TRABALHO_Computer_Architecture_and_Organization.md # Proposta oficial detalhada
│   ├── assets/ ou files/           # Diagramas, esquemáticos e imagens de apoio
│   └── pitch/
│       └── pitch_script.md         # Roteiro estruturado para gravação do vídeo pitch (<= 4 min)
├── src/                            # Arquivos do simulador / esquemáticos de circuitos (Logisim/código)
└── dist/                           # Entregáveis finais (relatórios em PDF, exportações)
```

---

## 3. Entregáveis e Pesos Avaliativos

| Entregável | Peso | Localização Principal | Descrição |
| :--- | :---: | :--- | :--- |
| **Parte Teórica** | 25% | `docs/` & `dist/` | Relatório técnico acadêmico (PDF) abordando contextualização, arquitetura Von Neumann / RISC, registradores, ULA, UC, barramentos, hierarquia de memória e detalhamento minucioso do ciclo *fetch-decode-execute*. |
| **Parte Prática** | 50% | `src/` & `docs/assets/` | Modelagem funcional / simulação visual de uma CPU (Logisim Evolution, circuitos ou código simulador) demonstrando a passagem de pelo menos uma instrução (`LOAD`, `ADD`, `STORE`, etc.) pelos barramentos e registradores. |
| **Vídeo Pitch** | 25% | `docs/pitch/pitch_script.md` | Roteiro e vídeo demonstrativo de até 4 minutos sintetizando arquitetura, componentes e demonstração visual do ciclo em execução. |

---

## 4. Fundamentação Teórica e Padrões Conceituais

Qualquer agente gerando documentação técnica, revisões ou diagramas deve seguir a nomenclatura e fundamentação clássica:

1. **Fontes de Referência Primárias:**
   - STALLINGS, William. *Arquitetura e Organização de Computadores*. 8ª/10ª ed. Pearson/LTC.
   - TANENBAUM, Andrew S.; AUSTIN, Todd. *Organização Estruturada de Computadores*. 6ª ed. Pearson.
   - Normas ABNT para citações e referências bibliográficas.

2. **Arquitetura de Referência:**
   - **Von Neumann:** Programa armazenado em memória única compartilhada para instruções e dados, acessada via barramentos do sistema.
   - **Subsistemas Principais:** CPU (Processador), Memória Principal (RAM), Barramento do Sistema (System Bus) e E/S (I/O).

3. **Registradores Essenciais da CPU:**
   - `PC` (*Program Counter*): Guarda o endereço da próxima instrução a ser buscada.
   - `MAR` (*Memory Address Register*): Conectado ao barramento de endereços, indica o endereço de memória para leitura/escrita.
   - `MBR` / `MDR` (*Memory Buffer Register* / *Memory Data Register*): Conectado ao barramento de dados, armazena o dado lido da memória ou pronto para escrita.
   - `IR` (*Instruction Register*): Armazena a instrução recém-buscada enquanto a Unidade de Controle a decodifica.
   - `AC` (*Accumulator*): Registrador de trabalho geral associado à ULA para retenção temporária de operandos e resultados.

4. **Barramentos do Sistema:**
   - **Barramento de Controle:** Transporta sinais de clock, leitura (`READ`), escrita (`WRITE`), enable e interrupções.
   - **Barramento de Endereços:** Unidirecional da CPU para memória/dispositivos, seleciona posições de memória.
   - **Barramento de Dados:** Bidirecional, transporta opcodes, dados e operandos.

5. **Ciclo de Instrução (Três Fases Primárias):**
   - **1. Busca (*Fetch*):** `PC -> MAR -> Barramento de Endereço -> Memória -> Barramento de Dados -> MBR -> IR; PC = PC + 1`.
   - **2. Decodificação (*Decode*):** `UC` interpreta o opcode contido no `IR`, determinando a operação e os modos de endereçamento.
   - **3. Execução (*Execute*):** Leitura de operandos adicionais se necessário, operação na `ULA`, escrita no `AC` ou gravação de volta na memória via `MBR/MAR`.

---

## 5. Diretrizes Operacionais para Agentes de IA

### 5.1 Papel do Agente
- Atuar como **copiloto pedagógico, analista técnico e revisor acadêmico**.
- Auxiliar na estruturação de textos didáticos, roteiros, esquemas conceituais, diagramas textuais (Mermaid) e organização de checklists.
- Respeitar a diretriz estipulada em `docs/ROADMAP_PROJECT.md`: a IA deve ser ferramenta de apoio à pesquisa, estruturação e refinamento conceitual, preservando o protagonismo do autor no aprendizado e desenvolvimento da solução prática.

### 5.2 Idioma e Comunicação
- Todo o conteúdo de documentação, relatórios, roteiros, checklists e comentários deve ser redigido em **Português do Brasil (pt-BR)** com tom acadêmico, formal, claro e didático.
- Respostas diretas ao usuário também devem priorizar pt-BR, a menos que solicitado expressamente de outra forma.

### 5.3 Padrões de Código e Versionamento
- **Commits:** Seguir a convenção do [Conventional Commits](https://www.conventionalcommits.org/):
  - `docs:` para atualizações na documentação (`docs/`, `README.md`, `AGENTS.md`).
  - `feat:` para novos esquemas, scripts ou componentes no simulador (`src/`).
  - `refactor:` para reorganização ou aprimoramento de diagramas/textos.
  - `chore:` para manutenção de metadados, `.gitignore` ou configurações.
- **Rastreamento de Tarefas:** Sempre que uma etapa for concluída ou expandida, verificar e sincronizar o status no checklist `docs/TASK.md`.
- **Integridade dos Arquivos:** Nunca sobrescrever nem remover anotações originais, referências e links presentes em `docs/NOTES.md` ou `docs/REQUEST.md` sem instrução explícita do usuário.

