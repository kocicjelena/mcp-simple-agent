/* eslint-disable @typescript-eslint/no-explicit-any */
// Inside your worker.js
export async function getPublicFile(fileName:any) {
  try{
  const response = await fetch("/`${fileName}`");
  if (response.ok) {
    return await response.text(); // or .text(), .blob(), etc.
  }
  throw new Error('File not found');
  }catch(err){
    console.error('Error fetching public file:', err);
    return [];
  }
}
