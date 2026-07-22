import type { DMMF } from "@prisma/generator-helper";

export function generateEnums(enums: readonly DMMF.DatamodelEnum[]): string[] {
  return enums.map(
    (e) => `Enum ${e.name} {\n` + generateEnumValues(e.values) + "\n}",
  );
}

const generateEnumValues = (values: readonly DMMF.EnumValue[]): string => {
  return values.map((value) => `  ${value.name}`).join("\n");
};
