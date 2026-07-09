/* eslint-disable @typescript-eslint/no-explicit-any */
import ollama from 'ollama'
import { olistollama } from './npm-ollama-list'
import toolFunction from './toolsFunction'
import { registerServerTool } from '../tools/registerTool'
import { getPrompt } from './getPrompt'
//import tool from '../tool'

export default async function chatWithFunTools(){
const messages = [{ 
    role: 'user', 
    content: "What is the temperature in New York?" 
}]
const listOllamaModels=await olistollama()
console.log('listOllamaModels', listOllamaModels)
const appTools= await toolFunction('city', 'get_temperature', 'Get the current temperature for a city', 'The name of the city')
const mytoolfun = await toolFunction('plan', 'agentic', 'Get agentic flow', 'Starts each sentence with one action verb')
const response = await ollama.chat({
  model: listOllamaModels.models[19].name,
  messages,
  tools: mytoolfun,
  think: true,
})

messages.push(response.message)
if (response.message.tool_calls?.length) {
  // only recommended for models which only return a single tool call
  const call = response.message.tool_calls[0]
  console.log('Tool call:', call)
 // const result = getPrompt('plan')
  const args = call.function.arguments as { prompt: string }
  //const result =registerServerTool()
  //const result = getPrompt(args.prompt)
  const result = getPrompt('plan')
  // add the tool result to the messages
  //messages.push({ role: 'tool', name: call.function.name, content: result })
  messages.push({ role: 'tool', content: result })

  // generate the final response
  const finalResponse = await ollama.chat({ model: 'qwen3', messages, tools: appTools, think: true })
  console.log(finalResponse.message.content)
}
​
}