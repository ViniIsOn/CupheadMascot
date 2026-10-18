# CupheadMascot — Cinematic Edition v1.3.1

Editor de chefões para Android em 9:16 com controles touchscreen, imagens de fundo/chefão importadas do aparelho, hitboxes editáveis, plataformas, perfis de ataque, salvamento local e captura de vídeo WebM quando houver suporte.

## Novidades verificadas nesta versão

- Cena de abertura com **4,25 segundos**, usando **44 quadros da animação de entrada fornecida**, legendas cinematográficas, duas etapas de voz e só depois controles e ataques ficam ativos.
- 10 variantes de anúncio (5 para a introdução e 5 para o início de combate), com sorteio anti-repetição por tipo.
- Sprites extraídos do ZIP do usuário: **intro** (44), **parry** (8), **parryPink** (8), **derrota** (16) e **fantasma** (24). Os áudios adicionais enviados também foram integrados.
- Projéteis **rosa com parry**: no ar, pressione o botão PULAR novamente quando estiver a até aproximadamente 78 px de um projétil rosa. O parry dá impulso, invulnerabilidade curta e recupera um coração a cada três parries. Lógica e efeitos visuais implementados.
- Chefão com **340 HP padrão**, podendo ajustar entre 80 e 1200, e **três fases** com aumento de ritmo e novos padrões na fase 2 (64% HP) e fase 3 (30% HP).
- Padrões: tiro direcionado, leque, chuva, onda, espiral, anel, zigue-zague, perseguidor, meteoro que explode, rajada horizontal, bolas que quicam, projétil que se divide, colunas de chuva e estrelas rosas.
- Sequência **KNOCKOUT!** no próprio canvas, animação de derrota/fantasma e ficha de **resultados** com nota, duração, parries, dano sofrido e vidas.
- UI e gameplay em **540×960 (9:16)**, com mira em 8 direções.

## Testes

- Sintaxe JavaScript validada com Node 22.
- Fluxos de introdução, luta, parry/padrões, KO e resultados exercitados em Chromium headless em viewport de telefone (412×915), sem erros JavaScript.
- Build Android via GitHub Actions no workflow `.github/workflows/android.yml`; artefato `CupheadMascot-APK` (compile SDK 35).

## Notas

- A gravação WebM feita pelo canvas do Android pode não conter áudio do jogo. Para postar MP4 no Kwai com áudio use o gravador de tela do Android.
- O ID Android `com.viniison.cupheadmascot.vertical.v12` está preservado para atualizar a versão 1.2.2 sem apagar dados. Evite desinstalar a versão anterior.
- Sprites e áudios fornecidos pelo usuário são usados neste protótipo para fins pessoais. Distribuição pública depende da licença/autorização do titular dos direitos.
