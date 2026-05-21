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
