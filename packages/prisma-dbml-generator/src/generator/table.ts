import type { DMMF } from "@prisma/generator-helper";

import { DBMLKeywords, PrismaScalars } from "../keywords.js";
import { getModelByType } from "./model.js";

export function generateTables(
  models: readonly DMMF.Model[],
  mapToDbSchema: boolean = false,
  includeRelationFields: boolean = true,
  fieldDbNameMaps: Map<string, string>,
): string[] {
  return models.map((model) => {
    const modelName = mapToDbSchema && model.dbName ? model.dbName : model.name;

    return (
      `${DBMLKeywords.Table} ${modelName} {\n` +
      generateFields(
        model.fields,
        models,
        mapToDbSchema,
        includeRelationFields,
      ) +
      generateTableIndexes(model, fieldDbNameMaps) +
      generateTableDocumentation(model) +
      "\n}"
    );
  });
}

const generateTableIndexes = (
  model: DMMF.Model,
  fieldDbNameMaps: Map<string, string>,
): string => {
  const primaryFields = model.primaryKey?.fields;
  const hasIdFields = primaryFields && primaryFields.length > 0;
  const hasCompositeUniqueIndex = hasCompositeUniqueIndices(model.uniqueFields);

  return hasIdFields || hasCompositeUniqueIndex
    ? `\n\n  ${DBMLKeywords.Indexes} {\n${generateTableBlockId(primaryFields, model.name, fieldDbNameMaps)}${
        hasIdFields && hasCompositeUniqueIndex ? "\n" : ""
      }${generateTableCompositeUniqueIndex(model.uniqueFields, model.name, fieldDbNameMaps)}\n  }`
    : "";
};

const hasCompositeUniqueIndices = (
  uniqueFields: readonly (readonly string[])[],
): boolean => {
  return uniqueFields.filter((composite) => composite.length > 1).length > 0;
};

const generateTableBlockId = (
  primaryFields: readonly string[] | undefined,
  modelName: string,
  fieldDbNameMaps: Map<string, string>,
): string => {
  if (primaryFields === undefined || primaryFields.length === 0) {
    return "";
  }

  return `    (${primaryFields
    .map((field) => {
      return fieldDbNameMaps.get(`${modelName}.${field}`) || field;
    })
    .join(", ")}) [${DBMLKeywords.Pk}]`;
};

const generateTableCompositeUniqueIndex = (
  uniqueFields: readonly (readonly string[])[],
  modelName: string,
  fieldDbNameMaps: Map<string, string>,
): string => {
  return uniqueFields
    .filter((composite) => composite.length > 1)
    .map(
      (composite) =>
        `    (${composite
          .map((field) => {
            return fieldDbNameMaps.get(`${modelName}.${field}`) || field;
          })
          .join(", ")}) [${DBMLKeywords.Unique}]`,
    )
    .join("\n");
};

const generateTableDocumentation = (model: DMMF.Model): string => {
  const doc = model.documentation?.replace(/'/g, "\\'");

  return doc ? `\n\n  Note: '${doc}'` : "";
};

const generateFields = (
  fields: readonly DMMF.Field[],
  models: readonly DMMF.Model[],
  mapToDbSchema: boolean = false,
  includeRelationFields: boolean = true,
): string => {
  let filteredFields: readonly DMMF.Field[] = fields;

  if (!includeRelationFields) {
    filteredFields = fields.filter((field) => !field.relationName);
  }

  return filteredFields
    .map((field) => {
      const relationToName = mapToDbSchema
        ? getModelByType(models, field.type)?.dbName || field.type
        : field.type;

      const fieldType =
        field.isList && !field.relationName
          ? `${relationToName}[]`
          : relationToName;

      return `  ${field.dbName || field.name} ${fieldType}${generateColumnDefinition(field)}`;
    })
    .join("\n");
};

const generateColumnDefinition = (field: DMMF.Field): string => {
  const columnDefinition: string[] = [];

  if (field.isId) {
    columnDefinition.push(DBMLKeywords.Pk);
  }

  if ((field.default as DMMF.FieldDefault)?.name === "autoincrement") {
    columnDefinition.push(DBMLKeywords.Increment);
  }

  if ((field.default as DMMF.FieldDefault)?.name === "now") {
    columnDefinition.push("default: `now()`");
  }

  if (field.isUnique) {
    columnDefinition.push(DBMLKeywords.Unique);
  }

  if (field.isRequired && !field.isId) {
    columnDefinition.push(DBMLKeywords.NotNull);
  }

  if (field.hasDefaultValue && typeof field.default != "object") {
    if (
      field.type === PrismaScalars.String ||
      field.type === PrismaScalars.Json ||
      field.kind === "enum"
    ) {
      columnDefinition.push(`${DBMLKeywords.Default}: '${field.default}'`);
    } else {
      columnDefinition.push(`${DBMLKeywords.Default}: ${field.default}`);
    }
  }

  if (field.documentation) {
    columnDefinition.push(
      `${DBMLKeywords.Note}: '${field.documentation.replace(/'/g, "\\'")}'`,
    );
  }

  if (columnDefinition.length) {
    return " [" + columnDefinition.join(", ") + "]";
  }

  return "";
};
