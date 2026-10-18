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
