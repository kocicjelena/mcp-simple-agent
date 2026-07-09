import ollama from 'ollama'
const listollama = async () => {
    const response = await ollama.list()
return response
}
export { listollama as olistollama };