import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const source = join(process.cwd(), ".openai", "hosting.json");
const target = join(process.cwd(), "dist", ".openai", "hosting.json");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
