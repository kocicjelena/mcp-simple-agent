"use client";

import Link from "next/link";
import ChatToolForm from "@/components/forms/Chat";
import OptionModel from "@/components/ui/Nav/OptionModel";
import ChatToolForm2 from "@/components/ChatToolForm2";
import ChatForm from "@/components/ChatForm";
//import styles from '@/page.module.css';
const ToolPage = () => {
  return (  <>
  <div style={{ padding: 20 }}>
   <title style={{
    color: "#00ffff",}}>OLLAMAVERSE</title>
        <span style={{
    color: "#00ffff",
    fontSize: "1.0rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    textShadow: "0 0 8px #00ffff",
    fontWeight: 700,
  }}>
   Chat with model tools served from your MCP route
  </span>
 
       <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
        A local App Router MCP endpoint with small built-in tools.
     </p>
  <hr />
   <div>
  <OptionModel />
  
    {/* <ChatWithMcpToolsUpload />  */}
      {/* <ChatToolForm /> */}
     
        </div>
     {/* <p>OLLAMA_API_URL has to be configured</p>
      */}
  <p>test tutorial weather:</p>
    
  {/* <ChatToolForm /> 
   <ChatForm /> */}
    <ChatToolForm2 />
    <div>
    
     
       {/* <ChatStreamForm /> */}
      <p style={{ marginTop: "1.25rem" }}></p>
       
    </div>
        {/* <div className={styles.page}> */}
 
      
     {/* <TestingOllamaRestAPI2 /> */}
   
       
         {/* <Link href="/ragtool" style={{ color: "#a78bfa" }}>
        MCP Server + RAG WORK in PROGRESS - showcase tools calling
        </Link> */}
    <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </div></>)
    }
  
 
export default ToolPage;