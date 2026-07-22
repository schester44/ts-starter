import { generatorHandler } from "@prisma/generator-helper";

import { generate } from "./dbml-generator.js";

generatorHandler({
  onManifest: () => ({
    defaultOutput: "./dbml",
    prettyName: "DBML Schema",
  }),
  onGenerate: generate,
});
