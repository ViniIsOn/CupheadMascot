# CupheadMascot v1.1 Vertical — Kwai Edition

## Atualização v1.1
- **Portrait 9:16 real**: jogo em canvas 540×960, sem letterbox na gravação.
- Interface de editor em duas abas, chefões, ataques, plataformas, importação de imagens e hitboxes no celular em pé.
- Controles de toque na parte inferior e gravação acessível durante a luta.
- Ícone Android incluído em cinco resoluções (`mipmap-*`), desenhado programaticamente a partir de um sprite enviado pelo usuário; nenhuma imagem foi gerada por IA.
- AndroidManifest e MainActivity em orientação retrato.
- Pacote Android separado (`com.viniison.cupheadmascot.vertical`), para poder instalar ao lado da versão anterior sem apagar os projetos antigos; os projetos não são transferidos automaticamente entre apps. O formato de arquivos antigos é conversível se importado no armazenamento do novo app.

## APK
GitHub Actions > Android APK > último build bem-sucedido > artefato `CupheadMascot-APK` > `app-debug.apk`. A nova versão usa um pacote separado e instala ao lado da versão antiga para evitar conflitos de assinatura no GitHub Actions. A remoção da versão antiga pode apagar os projetos dela; mantenha-a instalada até ter seus projetos em segurança.

## Gravação
WebView pode ou não suportar MediaRecorder/captureStream; quando suportado, o vídeo é capturado **nativamente em 540×960** WebM, sem enquadramento horizontal. Para MP4 compatível com Kwai, use o gravador de tela do Android.

## Créditos e direitos
Personagens, nome e sprites de Cuphead pertencem a seus criadores/titulares. Esta versão é protótipo pessoal; para distribuir comercialmente, é necessário substituir materiais protegidos por recursos licenciados/originais.

# CupheadMascot — Boss Studio para Android

Protótipo Android off-line (Java + WebView + Canvas) de um editor de chefes inspirado nos jogos de plataforma clássicos. Código no namespace `com.viniison.cupheadmascot`.

## Recursos (beta 1.0)

- Importar imagem de cenário e/ou PNG do chefe pela galeria.
- Definir retângulo de colisão arrastando com o dedo.
- Arrastar o chefe e desenhar plataformas.
- Configurar vida do chefe e ataques de tiro dirigido, leque, chuva, onda e espiral.
- Jogo 2D de verdade: três vidas, pulo, dash, tiros, colisão com plataforma, projéteis, vitória/derrota.
- Controles touchscreen ou teclado.
- Salvar, reabrir e excluir projetos sem conexão, incluindo as imagens.
- Gravar vídeo **WebM** 16:9 ou 9:16 via MediaRecorder/Canvas.captureStream se o WebView suportar; compartilhar o arquivo salvo em `Filmes/CupheadMascot`. Como alternativa, use o gravador de tela do Android para gerar MP4, pois o suporte a WebM varia entre aplicativos.
- Som sintetizado localmente (sem acesso ao microfone).

## Gerar o APK

1. Abra **Actions → Android APK** do GitHub.
2. Se necessário, selecione **Run workflow**.
3. Ao terminar com sucesso, baixe o artefato **CupheadMascot-APK** e extraia `app-debug.apk`.
4. Instale no Android 10 ou posterior, permitindo instalar apps da fonte escolhida quando solicitado pelo Android.

Também é possível abrir no Android Studio e usar `assembleDebug`.

## Limitações atuais

A gravação depende de `MediaRecorder` + `Canvas.captureStream`, que podem não estar disponíveis em versões específicas do Android WebView. O vídeo sai em WebM, não MP4. No editor, o fundo importado não é recortado automaticamente para destacar o boss: a hitbox sobre a imagem faz o boss virar um alvo estático; para o chefe ter sprite próprio, importe PNG separado. É um protótipo de criação de batalhas, não um port de Cuphead.

## Aviso sobre assets

Os sprites extraídos do ZIP enviado pelo usuário são usados apenas para um protótipo pessoal; direitos de Cuphead e seus personagens pertencem a seus titulares. Para distribuir/publicar comercialmente o app, substitua sprites, nome, marcas e qualquer material não licenciado por gráficos originais e com permissão de uso.
