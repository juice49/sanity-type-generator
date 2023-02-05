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
