import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

export interface SkillMeta {
  name: string;
  description: string;
  dir: string;
  files: string[];
}

/**
 * SKILL.md frontmatter is single-line `key: value` pairs, but `description`
 * routinely contains unescaped colons — invalid YAML. Parse line-by-line
 * instead of handing it to a YAML parser.
 */
function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const keyMatch = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (!keyMatch) continue;
    data[keyMatch[1]] = keyMatch[2].trim();
  }
  return data;
}

// Skills now live in a separate repo (CamkSkillV2), checked out wherever SKILLS_PATH
// points on this machine. Falls back to a sibling ../skills for local dev convenience.
const SKILLS_ROOT = env.skillsPath
  ? path.resolve(env.skillsPath)
  : path.resolve(import.meta.dirname, "../../../skills");

async function listFilesRecursive(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full, base)));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

export async function loadSkills(): Promise<SkillMeta[]> {
  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
  const skills: SkillMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(SKILLS_ROOT, entry.name);
    const skillMdPath = path.join(skillDir, "SKILL.md");
    try {
      const raw = await fs.readFile(skillMdPath, "utf-8");
      const data = parseFrontmatter(raw);
      skills.push({
        name: data.name ?? entry.name,
        description: data.description ?? "",
        dir: entry.name,
        files: await listFilesRecursive(skillDir),
      });
    } catch {
      // no SKILL.md in this folder, skip
    }
  }

  return skills;
}

export async function getSkill(name: string): Promise<SkillMeta | undefined> {
  const skills = await loadSkills();
  return skills.find((s) => s.name === name || s.dir === name);
}

/**
 * Resolves a possibly-partial, possibly-mistyped query to a skill: exact name/dir match
 * wins outright; otherwise falls back to a case-insensitive substring match against
 * name/dir, only auto-resolving when exactly one skill matches.
 */
export async function resolveSkill(
  query: string,
): Promise<{ skill: SkillMeta } | { candidates: SkillMeta[] }> {
  const skills = await loadSkills();
  const exact = skills.find((s) => s.name === query || s.dir === query);
  if (exact) return { skill: exact };

  const q = query.toLowerCase();
  const candidates = skills.filter((s) => s.name.toLowerCase().includes(q) || s.dir.toLowerCase().includes(q));
  if (candidates.length === 1) return { skill: candidates[0] };
  return { candidates };
}

export function skillDirPath(dir: string): string {
  return path.join(SKILLS_ROOT, dir);
}

export async function getSkillMarkdown(name: string): Promise<string | undefined> {
  const skill = await getSkill(name);
  if (!skill) return undefined;
  return fs.readFile(path.join(skillDirPath(skill.dir), "SKILL.md"), "utf-8");
}

/** Reads one file inside a skill's directory, rejecting paths that escape it. */
export async function readSkillFile(name: string, relPath: string): Promise<string | undefined> {
  const skill = await getSkill(name);
  if (!skill) return undefined;

  const root = skillDirPath(skill.dir);
  const resolved = path.resolve(root, relPath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("path escapes skill directory");
  }

  return fs.readFile(resolved, "utf-8");
}

export { SKILLS_ROOT };
