# CupheadMascot v1.2 — Mira Livre / Kwai

## Correções pedidas
- Personagem visualmente ~1,5x maior (render 145×163 no canvas 540×960), hitbox de 80×106, pés alinhados às plataformas.
- Sprite com tiro para cima, baixo e diagonal, retirado do ZIP enviado. Espelhamento para a esquerda.
- Joystick direito em 8 direções: mantenha o dedo no joystick para mirar **e disparar**; o botão ATIRAR é independente e continua usando a última direção.
- Boss alterna ataques automaticamente por padrão, sem repetir o tipo imediatamente. Ao carregar projeto antigo com apenas 1 ataque, o modo SURPRESA adiciona variações temporárias sem alterar os ataques salvos.
- Incluídos áudios do anunciador, tiro, dash, dano, derrota e knockout, fornecidos pelo usuário. Arquivos convertidos de WAV para OGG, para reduzir tamanho.
- Plataformas com camada visual translúcida e sprites/tiros do jogador desenhados por cima.
- Compatível com 9:16 vertical (540×960), controles de toque e gravação WebM se o Android suportar; para MP4 e áudio interno, usar gravação de tela do Android.
- `applicationId` mantido `com.viniison.cupheadmascot.vertical` para preservar projetos locais da v1.1. **Não desinstale a v1.1 antes de instalar esta atualização.**

## Como gerar o APK
Abra GitHub Actions > Android APK > último workflow bem-sucedido > artifact `CupheadMascot-APK` > extrair `app-debug.apk` e instalar.

## Aviso de direitos
Protótipo pessoal com arquivos de jogo enviados pelo usuário. Personagens, sprites e sons são de seus respectivos titulares. Para distribuição pública, verificar a licença dos assets e substituir recursos não autorizados.


## v1.3 Dramatic Edition
- Abertura animada com 28 quadros de entrada já fornecidos pelo usuário, e espera antes de habilitar ataques.
- Variação anti-repetição entre 10 arquivos de áudio fornecidos (anunciador).
- Projéteis rosa com PARRY: aproxime-se, pressione PARRY e receba impulso, invulnerabilidade curta e super medidor.
- Chefe com 375 HP por padrão, slider até 1200 HP e três fases de dificuldade.
- Padrões adicionais: ricochete, cruz, perseguidor, rajada, órbita e cortina.
- Cinemática KNOCKOUT! e tela de pontuação com tempo, acertos, parries, vidas e nota S–D.
- Gameplay 9:16 e botão de gravação preservados.
- Aviso: som só pode ser registrado na gravação de tela do sistema; gravação interna pode conter só imagem.


## v1.4 — Controle estável + importação local de áudio

- Corrige posicionamento do personagem: colisão de plataformas por cruzamento do topo, limitador de deslocamento e verificação numérica.
- Sprite 110×130 e hitbox 64×86; movimento com aceleração e dash mais curto.
- Botão PARRY rosa separado do PULAR, janela 0,48 segundo e proximidade 102 px; toque PULAR no ar junto do objeto rosa também faz parry.
- Importação de MP3 / OGG e ZIP contendo MP3s e WAVs de parry/acerto. Músicas ficam **somente no armazenamento privado do Android** e não entram no repositório GitHub. Seleção aleatória e volume ajustável.
- Abra Chefão & Ataques → Trilha sonora → Importar MP3s ou Importar ZIP. Basta importar uma vez no próprio aparelho.
- O som deve ser capturado com o gravador de tela Android para vídeo com áudio.

**Instalação:** use um identificador de app novo (`.vertical.v14`) para evitar conflito com a assinatura de APK debug anterior. O app antigo e os projetos nele não são apagados; a v1.4 mantém projetos próprios.


## v1.5 — correção de movimento e alinhamento
- Eliminado o tremor de tela que deslocava visualmente o personagem e os disparos.
- Atlas de sprites de combate refeito com o MESMO recorte original 512×512 por quadro, para preservar o ponto de referência e evitar animação saltando.
- Corpo físico, centro dos sprites e ponto de saída do tiro derivados da mesma âncora dos pés.
- Hitbox verde e marca azul da saída de tiro ativáveis no painel para testar alinhamento.
- Sprites reais `cuphead_run_shoot_*` e `cuphead_run_shoot_diagonal_up_*` para movimento atirando.
- Colisão com plataformas checada por cruzamento do topo durante queda.
- `applicationId` novo (.vertical.v15) para preservar v1.4 e suas músicas/projetos (APKs debug do GitHub Actions não usam assinatura estável).
- Sem gerar imagens novas: atlases recortados apenas dos sprites fornecidos pelo usuário.

## Novos efeitos cinematograficos da v1.5.1
Os tres sons enviados pelo usuario foram incorporados como OGG (offline).
Ordem: KNOCKOUT + explosao ao zerar a vida, sino apos 0,65 s, vinheta de vitoria apos 2,8 s, resultados apos 5,4 s. Ao reiniciar/sair, os efeitos pendentes sao cancelados. A derrota do jogador continua com a sequencia original. Nao redistribua audios de terceiros sem permissao.


## v1.6 — Animações, idle e anunciador (19/10)

- **Preparação com variedade real:** seleciona uma dentre três sequências de entrada extraídas dos arquivos enviados pelo usuário (`cuphead_intro_b`, `cuphead_intro_a`, `cuphead_intro_no_cookie`), sem repetir a mesma na luta seguinte.
- **Idle refeito:** atlas gerado das imagens originais com margem para o chapéu e os pés e recorte uniforme por quadro.
- **Caminhada e mira:** animações de corrida acompanham a direção do movimento, mantendo a mira independente; quadros extras para viradas e reação ao dano.
- **Anunciador:** seleciona gravações diferentes de cada grupo usando rotação sem repetição imediata e com escolha lembrada entre sessões; intervalo entre frase inicial e chamada para começar aumentado para não sobrepor vozes. Há somente as frases presentes nos arquivos fornecidos, não foi inventada voz adicional.
- **Visibilidade:** altura do chão de jogo passou para y=820 para evitar esconder o Cuphead sob os controles virtuais inferiores.
- **Android:** `applicationId=com.viniison.cupheadmascot.vertical.v16` para instalar ao lado das versões beta anteriores. Projetos e músicas salvos anteriormente precisam ser importados novamente. O APK usa recursos fornecidos pelo usuário para prototipagem pessoal; verifique os direitos antes de qualquer distribuição pública.


## v1.7 – Cinema de chefões / conserto de intro
- Corrige introNoCookie: **33 frames reais**, não 40 (evita os quadros fora da imagem).
- Recorte do alfa frame a frame (sprite_metrics.js) e âncora pelos pés, com altura visual estável na animação do biscoito e idle. Não substitui sprites por IA.
- Chão desenhado exatamente em FLOOR_Y = 820, onde a física prende os pés (antes desenhado 54px abaixo, causando flutuação).
- Imagem de chefão até 1,38× maior mantendo hitbox física e proporção original.
- Chefão continua visível por instantes na derrota; explosão procedural em quatro ondas com fumaça, estilhaços, som e KNOCKOUT atrasado, sem flashes repetitivos.
- Arquivos de áudio originais do usuário continuam embutidos; nenhuma música comercial é embutida.


### v1.7.3 — Importação rápida (Android)
- Seleção de MP3, OGG, WAV e ZIP direto pelo seletor nativo, incluindo vários arquivos.
- Cópia de mídia feita numa thread em segundo plano sem Base64 / JavaScript, mantendo as partidas e projetos locais.
- Barra textual de progresso, relatório de erros e gravação atômica para evitar arquivos corrompidos.
- A importação via WebView/JS permanece como fallback.
