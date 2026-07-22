# @surefin/prisma-dbml-generator

Forked from [prisma-dbml-generator](https://github.com/notiz-dev/prisma-dbml-generator) to maintain compatibility with Prisma v7 and allow custom modifications.

## Making Changes

After modifying any source files in `src/`, you need to rebuild the package before running Prisma generate:

```bash
# Build the package
yarn workspace @surefin/prisma-dbml-generator build

# Then generate Prisma client + DBML
yarn workspace @surefin/db generate
```

Or from this directory:

```bash
yarn build
```

The Prisma schema in `packages/db/src/prisma/schema.prisma` references this package via the `prisma-dbml-generator` binary name.

## Configuration Options

Configure the generator in your Prisma schema:

```prisma
generator dbml {
  provider              = "prisma-dbml-generator"
  output                = "./dbml"
  outputName            = "schema.dbml"
  manyToMany            = "true"
  mapToDbSchema         = "true"
  includeRelationFields = "true"
  projectName           = "Project Name"
  projectDatabaseType   = "PostgreSQL"
  projectNote           = "Project description"
}
```

## Credits

Original authors:
- Marc Stammerjohann
- Gary Großgarten

License: MIT
