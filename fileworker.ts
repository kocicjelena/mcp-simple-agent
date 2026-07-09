// Inside your worker.js
async function getPublicFile(fileName:any) {
  const response = await fetch(`/${fileName}`);
  if (response.ok) {
    return await response.json(); // or .text(), .blob(), etc.
  }
  throw new Error('File not found');
}
