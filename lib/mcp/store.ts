/* eslint-disable @typescript-eslint/no-explicit-any */
//import { readFile } from "fs/promises";
import { readFile } from "node:fs/promises";
import path from "path";
import { DocEntry } from "@/lib/types/doc-entry";
import { getPublicFile } from "@/fileworker";
import file from "../file";

export async function loadDocs(): Promise<DocEntry[]> {
  try {
     // TO DO
   const filePath = path.join(process.cwd(), "data", "documents.json");
   const raw = await readFile(filePath, "utf-8");
    console.log(raw)
    return JSON.parse(raw) as DocEntry[];
  } catch (err) {
      console.log(err)
    return [];
  }
}
