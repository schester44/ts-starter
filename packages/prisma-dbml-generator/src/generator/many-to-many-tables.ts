import type { DMMF } from "@prisma/generator-helper";

import { getModelByType } from "./model.js";

export function generateManyToManyTables(
  models: readonly DMMF.Model[],
  mapToDbSchema: boolean = false,
): string[] {
  const manyToManyFields = filterManyToManyRelationFields(models);

  if (manyToManyFields.length === 0) {
    return [];
  }

  return generateTables(manyToManyFields, models, [], mapToDbSchema);
}

function generateTables(
  manyToManyFields: DMMF.Field[],
  models: readonly DMMF.Model[],
  manyToManyTables: string[] = [],
  mapToDbSchema: boolean = false,
): string[] {
  const [manyFirst, ...rest] = manyToManyFields;

  if (!manyFirst) {
    return manyToManyTables;
  }

  // In the case of a manyMany, second field should be found
  const manySecond = rest.find(
    (field) => field.relationName === manyFirst.relationName,
  );

  // If its a manyMany, generate the join table
  // Else, it's a oneMany: ignore it and continue
  if (manySecond) {
    manyToManyTables.push(
      `Table ${manyFirst.relationName} {\n` +
        `${generateJoinFields([manyFirst, manySecond], models, mapToDbSchema)}` +
        "\n}",
    );
  }

  return generateTables(
    rest.filter((field) => field.relationName !== manyFirst.relationName),
    models,
    manyToManyTables,
    mapToDbSchema,
  );
}

function generateJoinFields(
  fields: [DMMF.Field, DMMF.Field],
  models: readonly DMMF.Model[],
  mapToDbSchema: boolean = false,
): string {
  return fields
    .map((field) => joinField(field, models, mapToDbSchema))
    .join("\n");
}

function joinField(
  field: DMMF.Field,
  models: readonly DMMF.Model[],
  mapToDbSchema: boolean = false,
): string {
  const fieldName = mapToDbSchema
    ? getModelByType(models, field.type)?.dbName || field.type
    : field.type;

  const relationToField = field.relationToFields?.[0] ?? "id";

  return `  ${field.name.toLowerCase()}Id ${getJoinIdType(
    field,
    models,
  )} [ref: > ${fieldName}.${relationToField}]`;
}

function getJoinIdType(
  joinField: DMMF.Field,
  models: readonly DMMF.Model[],
): string {
  const relationToField = joinField.relationToFields?.[0] ?? "id";
  const joinIdField = models
    .filter((model) => model.name === joinField.type)
    .map((model) =>
      model.fields.find((field) => field.name === relationToField),
    )
    .find(Boolean);

  return joinIdField?.type ?? "String";
}

function filterManyToManyRelationFields(
  models: readonly DMMF.Model[],
): DMMF.Field[] {
  return models
    .map((model) =>
      model.fields
        .filter(
          (field) =>
            field.relationName &&
            field.isList &&
            field.relationFromFields?.length === 0 &&
            // Updated this condition to match manyMany fields as defined in the new DMMF
            field.relationToFields?.length === 0,
        )
        // As the relationToFields is not populated in the DMMF, we need to populate it manually
        .map((field) => ({
          ...field,
          relationToFields: model.fields
            .filter((f) => f.isId)
            .map((f) => f.name),
        })),
    )
    .flat();
}
