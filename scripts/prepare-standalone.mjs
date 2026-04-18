import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

function copyIfExists(sourceRelativePath, targetRelativePath) {
  const sourcePath = path.join(projectRoot, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) return;

  const targetPath = path.join(standaloneRoot, targetRelativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

if (!fs.existsSync(standaloneRoot)) {
  console.error("standalone output not found. Run `next build` first.");
  process.exit(1);
}

copyIfExists(path.join(".next", "static"), path.join(".next", "static"));
copyIfExists("public", "public");