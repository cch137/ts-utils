import concentrate from './concentrate'

// To-Do:
// 需要判斷數字，因為語句過短，數字過多，可能造成誤判。

export type SupportedLang = 'en' | 'zh' | 'ja' | 'ko' | 'ru';

const languageCodeRanges: { [languageCode: string]: [number, number][] } = {
  en: [[0x0000, 0x007F]], // Basic Latin (ASCII)
  zh: [[0x4E00, 0x9FFF], [0x3400, 0x4DBF], [0x20000, 0x2A6DF], [0x2A700, 0x2B73F], [0x2B740, 0x2B81F]], // Chinese
  ja: [[0x3040, 0x309F], [0x30A0, 0x30FF], [0x31F0, 0x31FF], [0x1B000, 0x1B0FF], [0x1F200, 0x1F2FF]], // Japanese
  ko: [[0xAC00, 0xD7AF]], // Korean
  ru: [[0x0400, 0x04FF], [0x0500, 0x052F]], // Russian
  // Add more languages and their corresponding Unicode ranges as needed
}

export function analyzeLanguages(text: string, sampleProportion = 0.1, minSampleSize = 100, maxSampleSize = 1000) {
  const selectedCharacters = concentrate(
    text.replace(/\s/g, ''),
    Math.floor(Math.min(maxSampleSize, Math.max(minSampleSize, text.length * sampleProportion)))
  ).split('')
  const languageDistribution: { [languageCode: string]: number } = {};
  let detectedTotal = 0, detected: boolean

  for (const character of selectedCharacters) {
    detected = false
    for (const languageCode in languageCodeRanges) {
      for (const characterRange of languageCodeRanges[languageCode]) {
        if (character.charCodeAt(0) >= characterRange[0] && character.charCodeAt(0) <= characterRange[1]) {
          if (languageCode in languageDistribution) languageDistribution[languageCode]++
          else languageDistribution[languageCode] = 1
          detectedTotal++
          detected = true
          break
        }
      }
      if (detected) break
    }
  }

  for (const languageCode in languageDistribution) languageDistribution[languageCode] /= detectedTotal

  return languageDistribution;
}

export function analyzeLanguage(text: string, sampleProportion = 0.1, minSampleSize = 100, maxSampleSize = 1000) {
  const data = analyzeLanguages(text, sampleProportion, minSampleSize, maxSampleSize)
  let language: string | null = null, v = 0
  for (const languageCode in data) {
    const u = data[languageCode]
    if (u > v) language = languageCode, v = u
  }
  return language || 'en' // default language is en
}
