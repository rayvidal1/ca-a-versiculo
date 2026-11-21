# Caca-Palavra — Notas de Desenvolvimento Android

## Patches do Android/CMake (patch-package)

### Por que existem?

O projeto usa `react-native-reanimated@4.1.7` e `react-native-worklets@0.5.1`.
Ao compilar no Android com NDK 27 (`27.1.12297006`), esses módulos nativos falham
na etapa de linkagem com erros do tipo:

```
ld.lld: error: undefined symbol: __cxa_end_catch
ld.lld: error: undefined symbol: std::current_exception()
ld.lld: error: undefined symbol: vtable for __cxxabiv1::__si_class_type_info
```

Esses símbolos fazem parte da biblioteca C++ padrão (`libc++_shared.so`).
Os `CMakeLists.txt` originais desses módulos não linkam explicitamente contra ela,
o que causa falha no NDK 27 com New Architecture habilitada.

### O que os patches fazem

Adicionam duas linhas em cada `android/CMakeLists.txt` dos módulos afetados:

```cmake
find_library(c++_shared_LIBRARY c++_shared)
target_link_libraries(<modulo> ... ${c++_shared_LIBRARY})
```

Isso instrui o linker a incluir `libc++_shared.so` explicitamente, resolvendo
os símbolos C++ ausentes.

### Arquivos patcheados

| Patch | Arquivo modificado |
|---|---|
| `patches/react-native-worklets+0.5.1.patch` | `node_modules/react-native-worklets/android/CMakeLists.txt` |
| `patches/react-native-reanimated+4.1.7.patch` | `node_modules/react-native-reanimated/android/CMakeLists.txt` |
| `patches/expo-modules-core+3.0.29.patch` | `node_modules/expo-modules-core/android/CMakeLists.txt` + `android/src/fabric/CMakeLists.txt` |
| `patches/expo-av+16.0.8.patch` | `node_modules/expo-av/android/CMakeLists.txt` |

### Como funciona a reaplicação automática

O `package.json` tem o script:

```json
"postinstall": "patch-package"
```

Após qualquer `npm install`, o `patch-package` reaplica os patches automaticamente.
Não é necessário nenhuma ação manual.

### Configuração do build Android

`android/gradle.properties`:
- `reactNativeArchitectures=arm64-v8a` — compilar apenas para arm64 (dispositivos modernos).
  Reduz tempo de build e evita erros intermitentes ao compilar as 4 arquiteturas simultâneas.
- `newArchEnabled=true` — New Architecture habilitada (requisito do reanimated 4.x).

### Reproduzir o ambiente do zero

```bash
npm install          # instala deps + aplica patches automaticamente
npx expo run:android # compila e instala no dispositivo via USB
```

---

## AdMob — Banner na tela de reveal final

### Onde aparece

Somente quando `isComplete = true`, ou seja, quando o jogador encontra todas as palavras e a overlay final de celebração é exibida. O banner fica entre o `VerseCard` revelado (100%) e o botão "Novo versículo".

Não aparece durante: seleção de versículo, intro, gameplay, nem progress parcial.

### Componente

`src/components/FinalRevealAdBanner.js`

Lógica de exibição:
- Em `__DEV__`: usa `TestIds.BANNER` automaticamente (sem precisar de ID real)
- Em produção: exige `EXPO_PUBLIC_BIBLU_ADS_ENABLED=true` + `EXPO_PUBLIC_BIBLU_BANNER_UNIT_ID` preenchido
- Se o anúncio falhar ao carregar, o componente some sem deixar container vazio

### Configuração (produção)

Crie um `.env` a partir do `.env.example` e preencha:

```
EXPO_PUBLIC_BIBLU_ADS_ENABLED=true
EXPO_PUBLIC_BIBLU_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_BIBLU_BANNER_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

Após trocar o App ID real, rode:
```bash
npx expo prebuild --no-install --platform android
npx expo run:android
```

O plugin `react-native-google-mobile-ads` está em `app.config.js` e injeta o `APPLICATION_ID` no AndroidManifest automaticamente via prebuild.

### Compatibilidade verificada

- Expo SDK 54
- React Native 0.81.5
- react-native-reanimated 4.1.7
- react-native-worklets 0.5.1
- NDK 27.1.12297006
- Android compileSdk 36 / targetSdk 36
- New Architecture (Fabric + TurboModules)


## Catalogo BPM offline

A fonte de jogo e src/data/bpm/catalog.json, com indices pre-calculados em eligibility.json e origem, hashes e aviso Public Domain em provenance.json. Os nove suplementos TB 1917 de Proverbios 10:13-21 sao excluidos; textos e referencias originais sao preservados. src/data/verses.json fica apenas como fixture dos casos antigos de regressao.

Geracao (Node.js 22+, sem rede):

    node scripts/generate-verses.js
    node scripts/generate-verses.js "C:/caminho/biblu/src/data/bible/pt/books"

Tambem aceita BPM_BOOKS_DIR. O padrao procura o projeto biblu ao lado deste projeto. O gerador somente le o Biblu e escreve em src/data/bpm. Regerar ao alterar regras de palavras, grades, modos ou tutorial; os testes detectam indices desatualizados.

Mantem o limite de 28 palavras por versiculo e exige candidatos suficientes para o minimo de cada perfil. Uma grade testemunha e gerada antes de indexar. Perfis identicos compartilham o mesmo pool. Em execucao, somente o versiculo sorteado e processado; nao ha HTTP, download, ordenacao nem varredura completa da Biblia por rodada. O historico antirrepeticao usa AsyncStorage e retencao limitada a 512 IDs.

Validacao completa (inclui todas as entradas indexadas, pode levar cerca de 90 segundos):

    node --test tests/game-regressions.test.cjs tests/bpm-catalog.test.cjs

A comparacao byte a byte da fonte exige acesso local ao Biblu; os demais testes funcionam com os dados embarcados.
