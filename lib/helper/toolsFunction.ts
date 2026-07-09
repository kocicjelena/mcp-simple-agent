/* eslint-disable @typescript-eslint/no-explicit-any */

const toolFunction = (v:any, funName:any, funDescription:any, toolPrompt:any)=>{ 
    const tools=[
  {
    type: 'function',
    function: {
      name: `${funName}`,
      description: `${funDescription}`,
      parameters: {
        type: 'object',
        required: [`${v}`],
        properties: {
          [`${v}`]: { type: 'string', description: `${toolPrompt}` },
        },
      },
    },
  },
]
return tools
}
export { toolFunction as default };