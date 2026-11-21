const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const verses = require('../src/data/verses.json');
const sources = new Map();

// Execute the real modules and hooks; native UI/audio/storage are replaced in memory.
function harness() {
  const slots = [], effects = [], timers = [], cache = new Map();
  let cursor = 0, dirty = false, renderFn, output;
  const stats = { victories: 0, successes: 0 };
  const changed = (a, b) => !a || !b || a.length !== b.length || b.some((v, i) => !Object.is(v, a[i]));
  const react = {
    memo: (component) => component,
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, (next) => {
        const value = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; }
      }];
    },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: fn(), deps };
      return slots[i].value;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) {
        const previous = slots[i]; slots[i] = { deps };
        effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  const animation = () => ({ start() {}, stop() {} });
  const native = {
    View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
    Animated: {
      Value: class { setValue() {} interpolate() { return 0; } },
      sequence: animation, parallel: animation, timing: animation,
      spring: animation, loop: animation, delay: animation,
      View: 'AnimatedView',
    },
    Easing: { out: () => {}, inOut: () => {}, cubic() {}, quad() {}, ease() {} },
    StyleSheet: { create: (v) => v, absoluteFillObject: {} },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    if (!sources.has(file)) sources.set(file, babel.transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file, babelrc: false, configFile: false,
      presets: ['babel-preset-expo'],
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code);
    const localRequire = (name) => {
      if (name.startsWith('@babel/runtime/')) return require(name);
      if (name === 'react') return react;
      if (name.includes('jsx-runtime')) return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === 'react-native') return native;
      if (name.includes('useSoundEffect')) return { useSoundEffect: () => () => stats.successes++ };
      if (name.includes('useVictorySound')) return { useVictorySound: () => () => stats.victories++ };
      if (name.includes('/components/')) return { __esModule: true, default: path.basename(name, '.js') };
      if (name.includes('verseSource')) return {
        getInitialVerse: () => verses[0], getRandomVerse: (id) => verses.find((v) => v.id !== id),
      };
      if (/\.(png|mp3|wav)$/.test(name)) return name;
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
      return { __esModule: true, default: name };
    };
    vm.runInThisContext(`(function(require,module,exports,setTimeout,clearTimeout){${sources.get(file)}\n})`, { filename: file })(
      localRequire, module, module.exports,
      (fn, delay) => { const timer = { fn, delay }; timers.push(timer); return timer; },
      (timer) => { timer.cancelled = true; }
    );
    return module.exports;
  }
  function flush() {
    for (let i = 0; i < 100; i++) {
      dirty = false; cursor = 0; output = renderFn();
      while (effects.length) effects.shift()();
      const ready = timers.filter((t) => !t.cancelled && !t.delay);
      for (const timer of ready) timers.splice(timers.indexOf(timer), 1);
      ready.forEach((t) => t.fn());
      if (!dirty) return output;
    }
    throw Error('Render did not settle');
  }
  return {
    load, stats, flush,
    advance(ms) {
      const ready = timers.filter((t) => !t.cancelled && t.delay <= ms);
      timers.forEach((t) => { t.delay = Math.max(0, t.delay - ms); });
      for (const timer of ready) {
        timers.splice(timers.indexOf(timer), 1);
        if (!timer.cancelled) timer.fn();
      }
      return flush();
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
    pending() { return timers.filter((t) => !t.cancelled).length; },
    mount(fn) { renderFn = fn; return flush(); },
  };
}

function find(tree, type) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === type) return tree.props;
  const children = tree.props?.children;
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const match = find(child, type); if (match) return match;
  }
  return null;
}

test('134 verses generate valid grids in all three modes, including previous failures', () => {
  const h = harness();
  const { verseHuntModes } = h.load('src/constants/verseHuntModes.js');
  const { useVerseHuntGame } = h.load('src/hooks/useVerseHuntGame.js');
  const { findMatchedPlacement } = h.load('src/utils/validation.js');
  const eligible = verses.filter((v) => v.text.trim().split(/\s+/).length <= 28);
  assert.equal(eligible.length, 134);
  let current, options;
  h.mount(() => useVerseHuntGame(current ?? eligible[0], options ?? verseHuntModes[0].gameOptions));
  for (const mode of verseHuntModes) {
    for (const verse of eligible) {
      current = verse; options = mode.gameOptions;
      const game = h.flush();
      assert.equal(game.error, null, `${mode.id}/${verse.id}`);
      assert.ok(game.placements.length > 0);
      for (const placement of game.placements) {
        assert.ok(options.directionDistribution[placement.directionId] > 0);
        const word = game.verse.targetWords.find((w) => w.normalized === placement.word);
        assert.equal(placement.cells.map((c) => game.grid[c.row][c.col].letter).join(''), word.letters);
        assert.equal(findMatchedPlacement(placement.cells, game.placements, new Set()), placement);
        assert.equal(findMatchedPlacement([...placement.cells].reverse(), game.placements, new Set()), placement);
        assert.equal(findMatchedPlacement(placement.cells, [placement], new Set([placement.word])), null);
      }
    }
  }
});

test('selection and fallback exclude words impossible in the permitted directions', () => {
  const h = harness();
  const { selectTargetWords } = h.load('src/utils/verseProcessing.js');
  const { useVerseHuntGame } = h.load('src/hooks/useVerseHuntGame.js');
  for (const [distribution, limit] of [[{ right: 1 }, 7], [{ down: 1 }, 9], [{ diagonalDown: 1 }, 7]]) {
    const options = { rows: 9, cols: 7, maxWordLength: 11, minWordLength: 2,
      targetWordCount: 12, directionDistribution: distribution };
    const words = selectTargetWords('adversidade fortaleza presente luz paz', options);
    assert.ok(words.length > 0);
    assert.ok(words.every((w) => w.letters.length <= limit));
  }
  const verse = { id: 'fallback', text: 'adversidade luz paz' };
  const options = { rows: 1, cols: 3, maxWordLength: 11, minWordLength: 3,
    targetWordCount: 2, directionDistribution: { right: 1 }, maxAttempts: 1 };
  const game = h.mount(() => useVerseHuntGame(verse, options));
  assert.equal(game.error, null);
  assert.equal(game.placements.length, 1, 'fallback reduces an overcrowded grid');
  assert.ok(game.placements.every((p) => p.word.length <= 3));
});

test('manual and guide completion count once and automatically advance after 1300ms', () => {
  for (const guide of [false, true]) {
    const h = harness();
    const Screen = h.load('src/screens/VerseHuntScreen.js').default;
    let count = 0;
    const render = () => Screen({ modeId: 'facil', isTutorial: count < 5,
      tutorialRound: count + 1, onVersePlayed: () => count++, onBack() {} });
    let tree = h.mount(render);
    assert.equal(find(tree, 'VerseCard').onNextVerse, undefined);
    assert.equal(find(tree, 'WordSearchGrid').showOnboarding, true);
    find(tree, 'WordSearchGrid').onInteractionStart(); tree = h.flush();
    assert.equal(find(tree, 'WordSearchGrid').showOnboarding, false);
    assert.equal(find(tree, 'WordSearchGrid').hintCell, null);
    tree = h.advance(1500);
    assert.equal(count, 0, 'incomplete game must not advance automatically');
    const originalGrid = find(tree, 'WordSearchGrid').grid;
    if (guide) {
      while (!find(tree, 'VerseCard').isComplete) {
        const grid = find(tree, 'WordSearchGrid');
        grid.onGuideComplete(grid.guidePlacement);
        grid.onGuideComplete(grid.guidePlacement); // duplicate callback before render
        tree = h.flush();
      }
    } else {
      // Follow the guide's target, but complete it through the real selection handlers.
      while (!find(tree, 'VerseCard').isComplete) {
        const grid = find(tree, 'WordSearchGrid');
        const cells = grid.guidePlacement.cells;
        grid.onSelectionStart(cells[0]);
        grid.onSelectionMove(cells.at(-1));
        grid.onSelectionEnd();
        tree = h.flush();
      }
    }
    assert.equal(count, 1);
    assert.equal(h.stats.victories, 1);
    assert.ok(find(tree, 'PhraseToast').phrase);
    assert.equal(find(tree, 'WordSearchGrid').grid, originalGrid, 'tutorial advance must preserve completed round');
    tree = h.flush();
    assert.equal(count, 1);
    tree = h.advance(1299);
    assert.equal(find(tree, 'WordSearchGrid').grid, originalGrid);
    tree = h.advance(1);
    assert.notEqual(find(tree, 'WordSearchGrid').grid, originalGrid);
    assert.equal(count, 1);
    assert.equal(find(tree, 'WordSearchGrid').guidePlacement, null, 'next tutorial stage');
    assert.equal(find(tree, 'VerseCard').isComplete, false);
    assert.equal(h.stats.victories, 1);
    h.unmount();
    assert.equal(h.pending(), 0, 'timers must be cancelled on exit');
  }
});

test('actual card has no New button and onboarding dismisses without blocking selection', () => {
  const h = harness();
  const Card = h.load('src/components/VerseCard.js').default;
  const card = h.mount(() => Card({ reference: 'Teste', tokens: [], foundWordSet: new Set(), isComplete: false }));
  assert.equal(JSON.stringify(card).includes('Novo'), false);
  h.unmount();

  const gridHarness = harness();
  const Grid = gridHarness.load('src/components/WordSearchGrid.js').default;
  let visible = true, started = 0;
  const cell = { row: 0, col: 0, letter: 'A' };
  let tree = gridHarness.mount(() => Grid({
    grid: [[cell]], hintCell: visible ? cell : null, showOnboarding: visible,
    onInteractionStart: () => { visible = false; },
    onSelectionStart: () => started++,
  }));
  const instruction = 'Arraste da primeira at\u00e9 a \u00faltima letra';
  assert.ok(JSON.stringify(tree).includes(instruction));
  const frame = tree.props.children.find((child) => child?.props?.onResponderGrant);
  frame.props.onResponderGrant({ nativeEvent: { locationX: 30, locationY: 30 } });
  tree = gridHarness.flush();
  assert.equal(started, 1);
  assert.equal(JSON.stringify(tree).includes(instruction), false);
  gridHarness.unmount();
});
