# Sanity Type Generator

> **Warning**
> This tool isn't quite ready to use yet.

Sanity Type Generator generates TypeScript types for Sanity Studio v3 schemas.

Run the `sanity-type-generator` command in the root of your Studio project to begin.

```
npx sanity-type-generator
```

A TypeScript file will be generated for each Studio workspace. By default, generated type files are written to the `types` directory. The output directory will be created automatically if it doesn't exist.

Sanity Type Generator will ask you to confirm before any files are overwritten, unless the `--force` (`-f`) flag is used.

## Required fields

By default, Sanity Type Generator assumes fields are not required. To express that a field is required, set the `typegen.required` option to `true` in its schema definition.

There are many ways to make a field required in Sanity Studio. Rather than attempt to detect whether a field is required, Sanity Type Generator expects this to be expressed explicitly in the field options.

```ts
defineField({
  name: 'name',
  title: 'Name',
  type: 'string',
  typegen: {
    required: true,
  },
})
```

Add the following module declaration to enable TypeScript support for the `typegen` option:

```ts
import { FieldOptions } from 'sanity-type-generator'

declare module 'sanity' {
  export interface FieldDefinitionBase extends FieldOptions {}
}
```
