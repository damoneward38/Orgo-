import { CommandPattern, DecisionResult } from '../types';

export function decideCommand(prompt: string, patterns: CommandPattern[]): DecisionResult {
  const cleanPrompt = prompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  for (const pat of patterns) {
    try {
      // Support patterns with or without anchors
      let regexStr = pat.pattern;
      // If user typed raw regex without ^ $, check if it was intended as full match or substring
      const regex = new RegExp(regexStr, 'i');
      const match = lowerPrompt.match(regex);

      if (match) {
        const groups = match.slice(1);
        const resolvedArgs: Record<string, any> = {};

        for (const [key, templateVal] of Object.entries(pat.argsTemplate)) {
          if (typeof templateVal === 'string') {
            let replaced = templateVal;

            // Replace $1, $2 or \1, \2
            groups.forEach((grp, idx) => {
              const num = idx + 1;
              replaced = replaced
                .replace(new RegExp(`\\\\${num}`, 'g'), grp || '')
                .replace(new RegExp(`\\$${num}`, 'g'), grp || '')
                .replace(new RegExp(`\\{${idx}\\}`, 'g'), grp || '')
                .replace(new RegExp(`\\{${num}\\}`, 'g'), grp || '');
            });

            resolvedArgs[key] = replaced;
          } else {
            resolvedArgs[key] = templateVal;
          }
        }

        return {
          action: pat.action,
          args: resolvedArgs,
          matchedPattern: pat.pattern,
          patternId: pat.id,
          groups,
          rawPrompt: cleanPrompt,
          timestamp: Date.now(),
        };
      }
    } catch {
      // Continue to next pattern if invalid regex
      continue;
    }
  }

  return {
    action: 'unknown',
    args: {},
    rawPrompt: cleanPrompt,
    timestamp: Date.now(),
  };
}

export function testAllPrompts(
  prompts: string[],
  patterns: CommandPattern[]
): { prompt: string; decision: DecisionResult; isRecognized: boolean }[] {
  return prompts.map((p) => {
    const decision = decideCommand(p, patterns);
    return {
      prompt: p,
      decision,
      isRecognized: decision.action !== 'unknown',
    };
  });
}
