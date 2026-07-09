import { NextRequest, NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from 'next'
import LOCAL_URL from "../../../lib/localurl";
import axios from "axios";
import { ApiError } from "@/lib/errors";

const token = process.env.OLLAMA_API_KEY || ''; 

export async function GET(req: NextRequest) {
  try {
   const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json(data.models);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
