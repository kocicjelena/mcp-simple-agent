/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Persists agent instruction presets to a JSON file so the "instruction maker"
 * survives reloads. Mirrors the file-store style used elsewhere (loadDocs).
 * Swap the fs implementation for a DB later without touching the UI contract.
 */

export type InstructionPreset = {
  id: string;
  name: string;
  instructions: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "instructions.json");

async function readAll(): Promise<InstructionPreset[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: InstructionPreset[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function GET() {
  const items = await readAll();
  return NextResponse.json({ instructions: items });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; instructions?: string };

    const name = body.name?.trim();
    const instructions = body.instructions?.trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!instructions) {
      return NextResponse.json({ error: "instructions are required" }, { status: 400 });
    }

    const items = await readAll();
    const existingIndex = items.findIndex((item) => item.name === name);

    const preset: InstructionPreset = {
      id: existingIndex >= 0 ? items[existingIndex].id : `instr-${Date.now()}`,
      name,
      instructions,
      createdAt: existingIndex >= 0 ? items[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      items[existingIndex] = preset; // upsert by name
    } else {
      items.push(preset);
    }

    await writeAll(items);
    return NextResponse.json(preset, { status: existingIndex >= 0 ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
