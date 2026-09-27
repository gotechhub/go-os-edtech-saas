import type { MessageDefinition } from "./types";

const RESERVED_KEY = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9_-]*)+$/;
const PLACEHOLDER = /\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*(?=,|\})/g;

export function validateTemplate(definition: MessageDefinition, text: string): string[] {
  const errors: string[] = [];
  if (!RESERVED_KEY.test(definition.key)) errors.push("INVALID_KEY");
  if (!text || text.length > 3000) errors.push("INVALID_LENGTH");
  if (/[<>\u202a-\u202e\u2066-\u2069]/u.test(text)) errors.push("UNSAFE_MARKUP_OR_BIDI");
  const found = new Set([...text.matchAll(PLACEHOLDER)].map((match) => match[1]));
  const expected = new Set(definition.params);
  if (found.size !== expected.size || [...found].some((parameter) => !expected.has(parameter))) errors.push("PLACEHOLDER_MISMATCH");
  let depth = 0;
  for (const character of text) {
    if (character === "{") depth++;
    if (character === "}") depth--;
    if (depth < 0) { errors.push("UNBALANCED_BRACES"); break; }
  }
  if (depth !== 0) errors.push("UNBALANCED_BRACES");
  return [...new Set(errors)];
}

/** Structural screening only; ICU grammar and translated meaning need a real parser and human QA before publication. */
export function assertEditableTemplate(definition: MessageDefinition, text: string): void {
  if (!definition.customerEditable) throw new Error("PROTECTED_LABEL");
  const errors = validateTemplate(definition, text);
  if (errors.length) throw new Error(errors[0]);
}
