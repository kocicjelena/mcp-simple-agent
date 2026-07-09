export default function sha(s:any, l:any) {
  // for (let lel in l) {
  // //console.log(lel,'lel')
  // }

  const temp = l.filter((i:any)=>{
 //   //console.log(i, 'index');
    if(s==i.model)
    return i.digest})
  //console.log('sha',temp,'s', s)
  return temp; 
}
