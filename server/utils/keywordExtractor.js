const extractor = require('keyword-extractor');

function extractKeywords(text, limit = 20) {
  if (!text) return [];
  const keywords = extractor.extract(text, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: false
  });
  const freq = {};
  for (const word of keywords) {
    freq[word] = (freq[word] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

module.exports = { extractKeywords };
