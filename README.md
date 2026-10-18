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
