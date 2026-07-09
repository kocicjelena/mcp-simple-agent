/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ollama } from 'ollama';
//import { Product } from '../types';
//export async function localollama(product: Product): Promise<string> {
 // const prompt = `Summarize the following customer reviews for the ${product.name} product:

const localollama = async (mod: string, prompt: string) => {
  const ollama = new Ollama({
    host: 'http://127.0.0.1:11434',
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY ?? 'c453fbe53d754f17a0e5bfaadbbd750a.Rjp2efvxxJ1jKUanh_yqQBZk'}`,
      'X-Custom-Header': 'custom-value',
      'User-Agent': 'MyApp/1.0',
    },
  });
console.log('prompt', prompt);
  const response = await ollama.chat({ model: `${mod}`, messages: [{ role: 'user', content: prompt }] });
  const content = response?.message?.content ?? String(response);
  return content;
};

export default localollama;