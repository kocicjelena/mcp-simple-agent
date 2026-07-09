function getPrompt(myprompt: string): string {
  const explain: Record<string, string> = {
    'plan': 'Starts each sentence with one action verb',
    'review': '15°C',
    'suggest': '18°C',
  }
  return explain[myprompt] ?? 'Unknown'
}
export { getPrompt };