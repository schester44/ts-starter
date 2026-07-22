import type { GeneratorConfig } from "@prisma/generator-helper";
import { readFile } from "fs/promises";

export type ProjectOptions = {
  name: string;
  databaseType: string;
  note: string;
  isMd: boolean;
};

export function generateProject({
  name,
  databaseType,
  note,
  isMd = false,
}: ProjectOptions): string[] {
  const projectNote = isMd
    ? `'''\n` +
      `    ${note
        .replace(/\n/g, "\n    ")
        .replace(/(\n\s+\n)/g, "\n\n")
        .replace(/\s+$/g, "")}\n  '''`
    : `'${note}'`;
  const project = [
    `Project ${name} {\n` +
      `  database_type: '${databaseType}'\n` +
      `  Note: ${projectNote}\n}`,
  ];

  return name ? project : [];
}

export async function getProjectOptions(
  config: GeneratorConfig["config"],
): Promise<ProjectOptions | undefined> {
  const { projectName, projectDatabaseType, projectNote, projectNotePath } =
    config;

  if (typeof projectName === "string") {
    let projectNoteMd = "";

    if (projectNotePath) {
      const fullPath = `${process.cwd()}/${projectNotePath}`;

      try {
        projectNoteMd = await readFile(fullPath, "utf-8");
      } catch {
        console.log(
          `❌ Error: project note markdown file not found: ${fullPath}`,
        );
      }
    }

    return {
      name: projectName && `"${projectName}"`,
      databaseType:
        typeof projectDatabaseType === "string" ? projectDatabaseType : "",
      note: projectNoteMd
        ? projectNoteMd
        : typeof projectNote === "string"
          ? projectNote
          : "", // noteMd takes precedence
      isMd: projectNoteMd !== "",
    };
  }

  return undefined;
}
