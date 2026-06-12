'use strict';

/**
 * Prompt Budget Metrics v1.0-Peng
 * 三指标统计：英文词数 / 中文台词 / 总字符
 */

const ENGLISH_WORD_LIMIT = 1000;
const CHINESE_DIALOGUE_LIMIT = 500;
const TOTAL_CHAR_LIMIT = 6500;

function countEnglishWords(text) {
  const words = String(text || '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
  return words ? words.length : 0;
}

function countChineseChars(text) {
  const chars = String(text || '').match(/[\u4e00-\u9fff]/g);
  return chars ? chars.length : 0;
}

function splitDialogue(prompt) {
  const text = String(prompt || '');
  const dialogueMatch = text.match(/【Dialogue】([\s\S]*?)(?=\s*\|\s*【|$)/i);
  const dialogueText = dialogueMatch ? dialogueMatch[1] : '';
  const nonDialogueText = text.replace(/【Dialogue】[\s\S]*?(?=\s*\|\s*【|$)/i, '');
  return { dialogueText, nonDialogueText };
}

function calcPromptBudgetMetrics(prompt) {
  const { dialogueText, nonDialogueText } = splitDialogue(prompt);
  const englishWords = countEnglishWords(nonDialogueText);
  const chineseChars = countChineseChars(dialogueText);
  const totalChars = String(prompt || '').length;
  return {
    englishWords,
    englishWordUsage: Math.round((englishWords / ENGLISH_WORD_LIMIT) * 100),
    chineseChars,
    chineseUsage: Math.round((chineseChars / CHINESE_DIALOGUE_LIMIT) * 100),
    totalChars,
    totalUsage: Math.round((totalChars / TOTAL_CHAR_LIMIT) * 100)
  };
}

module.exports = {
  ENGLISH_WORD_LIMIT, CHINESE_DIALOGUE_LIMIT, TOTAL_CHAR_LIMIT,
  countEnglishWords, countChineseChars, splitDialogue, calcPromptBudgetMetrics
};
