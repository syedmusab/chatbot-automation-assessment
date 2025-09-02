const stringSimilarity = require('string-similarity');
const natural = require('natural');
const TextStatistics = require('text-statistics');


function cosineSimilarity(vecA, vecB) {
   //  validating that vecA and vecB are the same length before calculation
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  // Compute magnitude of vecA
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  // Compute magnitude of vecB
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  // Handle case where one or both vectors have zero magnitude to avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  // Return cosine similarity as ratio of dot product to product of magnitudes
  return dotProduct / (magnitudeA * magnitudeB);
}


function evaluateAIResponse(query, ourResponse, externalResponse) {
  // Lexical similarity
  // using stringSimilarity to get a quick character-level comparison
  const similarity = stringSimilarity.compareTwoStrings(
    ourResponse.toLowerCase(),
    externalResponse.toLowerCase()
  );

  // Tokenization is good for semantic comparison
  const tokenizer = new natural.WordTokenizer();
  const ourTokens = tokenizer.tokenize(ourResponse.toLowerCase());
  const extTokens = tokenizer.tokenize(externalResponse.toLowerCase());

  // Cosine similarity via term frequency vectors
  const allTokens = Array.from(new Set([...ourTokens, ...extTokens]));
  const vectorize = (tokens, vocab) => vocab.map(w => tokens.filter(t => t === w).length);
  const ourVector = vectorize(ourTokens, allTokens);
  const extVector = vectorize(extTokens, allTokens);
  const cosineSim = cosineSimilarity(ourVector, extVector);

  // Fluency of TextStatistics for readability metrics
  const tsOur = new TextStatistics(ourResponse);
  const tsExt = new TextStatistics(externalResponse);
  const fluencyOur = tsOur.fleschKincaidReadingEase();
  const fluencyExt = tsExt.fleschKincaidReadingEase();

  // Return aggregated evaluation
  return {
    query,
    scores: {
      lexicalSimilarity: +(similarity * 100).toFixed(2),
      cosineSimilarity: +(cosineSim * 100).toFixed(2),
      fluencyOur: +fluencyOur.toFixed(2),
      fluencyExternal: +fluencyExt.toFixed(2),
    },
    verdict: similarity > 0.5 || cosineSim > 0.5
      ? 'Both responses are sufficiently aligned'
      : 'Responses differ significantly'
  };
}

module.exports = { evaluateAIResponse };
