// Mock for @codemirror/language

export function foldable(state: any, from: number, to: number) {
  // Mock implementation that returns a foldable range
  return { from, to: to + 10 };
}