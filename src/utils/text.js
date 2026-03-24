export function normalizeWord(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

export function tokenizeVerse(text = '') {
  const parts = text.match(/[A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ]+/g) ?? [];

  return parts.map((part, index) => {
    const normalized = normalizeWord(part);
    const isWord = normalized.length > 0;

    return {
      id: `${index}-${normalized || 'sep'}`,
      text: part,
      normalized,
      type: isWord ? 'word' : 'separator',
    };
  });
}
