/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { ChangeEvent, useState } from "react";
import listModels from "@/lib/list";
import { useContextActions, useContextState } from "@/context/GlobalContext";
import sha from "@/utils/sha";

interface Model { 
  name: string;
  digest: any;
  size?: number;
  created?: string;
  modified?: string;
  tags?: string[];
  model: string;
}

const OptionModel = () => {
  const [models, setModels] = useState<any[]>([]);
  const [digests, setDigests] = useState<any[]>([]);
  const [dig, setDig] = useState<any>('') as any; 
  const state = useContextState();
  const actions = useContextActions();

  const getListOllamaModels2=async()=>{
    const lllmodels= actions.fetchMap();
     const llmodels = await listModels() as any;
   //     const lm = await olistollama();
  
     setModels(llmodels.data)
   }

   const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setDig(value);
      actions.addMessage(value);
      actions.setMessages(sha(value, models));
  };
    return (
        <>
        
        {/* <button onClick={getListOllamaModels2}
   style={{
    color: "#00ffff",
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    textShadow: "0 0 8px #00ffff",
    background: "#3a575f",
    fontWeight: 700,
    padding:"1rem",
    margin:"1.5rem"
  }}
   >Your Ollama Models</button> */}

 *** to do: list MODELS from mcp server api in this app
       </>
    );
};
export default OptionModel;
  // <label>
  //  {` ====>>  `}
  //   <select
  //     name="digest-select"
  //     className="digest-select"
  //     value={dig}
  //     onChange={handleSelectChange}
  //   style={{
  //          color: "#00ffff",
  //   fontSize: "0.7rem",
  //   letterSpacing: "0.2em",
  //   textTransform: "uppercase",
  //   textShadow: "0 0 8px #00ffff",
  //   background: "#3a575f",
  //   fontWeight: 700,
  //   padding:"1rem",
  //   margin:"1.2rem"
  //       }}>
  //      {models.map((mod, index) => (
  //         // Important: Each item in a list should have a unique 'key' prop
  //         <option key={index} value={mod.model}>
  //           {mod.name} 
  //           {/* {mod.digest} */}
  //         </option>
  //       ))}
 
  //   </select>
  //   </label>