import { Router } from "express";
import archiver from "archiver";
import { getSkill, getSkillMarkdown, loadSkills, readSkillFile, skillDirPath } from "../services/registry.service.js";

export const skillsRouter = Router();

// Mounted at /api/skills — paths below are relative to that.
skillsRouter.get("/", async (_req, res) => {
  const skills = await loadSkills();
  res.json({
    skills: skills.map(({ name, description, dir }) => ({ name, description, dir })),
  });
});

skillsRouter.get("/:name", async (req, res) => {
  const skill = await getSkill(req.params.name);
  if (!skill) {
    res.status(404).json({ error: "skill not found" });
    return;
  }
  const markdown = await getSkillMarkdown(req.params.name);
  res.json({ ...skill, markdown });
});

skillsRouter.get("/:name/files/*", async (req, res) => {
  const relPath = (req.params as Record<string, string>)[0];
  try {
    const content = await readSkillFile(req.params.name, relPath);
    if (content === undefined) {
      res.status(404).json({ error: "skill not found" });
      return;
    }
    res.type("text/plain").send(content);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

skillsRouter.get("/:name/download", async (req, res) => {
  const skill = await getSkill(req.params.name);
  if (!skill) {
    res.status(404).json({ error: "skill not found" });
    return;
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${skill.dir}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).end(String(err)));
  archive.pipe(res);
  archive.directory(skillDirPath(skill.dir), skill.dir);
  await archive.finalize();
});
