# Changelog

## v1.0.0

[compare changes](https://github.com/AntelopeJS/database-decorators/compare/v0.1.0...v1.0.0)

### 🚀 Enhancements

- AQL2 - refactor database, schema, and model with global instance and schema options ([#16](https://github.com/AntelopeJS/database-decorators/pull/16))

### 🩹 Fixes

- Update primary key name in DatumStaticMetadata ([bd896f1](https://github.com/AntelopeJS/database-decorators/commit/bd896f1))

### 💅 Refactors

- Unify StaticModel and DynamicModel into a single Model decorator ([359dc66](https://github.com/AntelopeJS/database-decorators/commit/359dc66))
- Add default id primary key to Table and remove primary Index option ([f2f54fb](https://github.com/AntelopeJS/database-decorators/commit/f2f54fb))
- Rename default Table primary key from id to _id ([d372511](https://github.com/AntelopeJS/database-decorators/commit/d372511))

### 📦 Build

- Replace rm -rf with rimraf ([#13](https://github.com/AntelopeJS/database-decorators/pull/13))

### 🏡 Chore

- Replicate ai agent config files (.agents/.claude) ([#14](https://github.com/AntelopeJS/database-decorators/pull/14))
- Remove ci publish adopt guidelines strict ts interface tests ([#15](https://github.com/AntelopeJS/database-decorators/pull/15))
- Simplify CI workflow triggers and update AGENTS.md ([65ce481](https://github.com/AntelopeJS/database-decorators/commit/65ce481))
- Exports generate ([07d9290](https://github.com/AntelopeJS/database-decorators/commit/07d9290))
- Migrate from eslint/prettier to biome and fix all lint warnings ([#17](https://github.com/AntelopeJS/database-decorators/pull/17))
- Migrate from local beta interfaces to published @antelopejs packages ([b1026fa](https://github.com/AntelopeJS/database-decorators/commit/b1026fa))

### ✅ Tests

- Update primary key assertions from id to _id ([36caf32](https://github.com/AntelopeJS/database-decorators/commit/36caf32))

### 🤖 CI

- Remove test:coverage step from CI workflow ([3148e20](https://github.com/AntelopeJS/database-decorators/commit/3148e20))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Thomasims <thomas@antelopejs.com>
- Glastis ([@Glastis](http://github.com/Glastis))

## v0.1.0

[compare changes](https://github.com/AntelopeJS/database-decorators/compare/v0.0.1...v0.1.0)

### 🚀 Enhancements

- Changelog generation is now using changelogen ([#9](https://github.com/AntelopeJS/database-decorators/pull/9))
- Modifier Events ([#11](https://github.com/AntelopeJS/database-decorators/pull/11))
- Star key for continer modifiers ([371f8de](https://github.com/AntelopeJS/database-decorators/commit/371f8de))

### 🩹 Fixes

- InitializeDatabaseFromSchema now handles empty shema ([#8](https://github.com/AntelopeJS/database-decorators/pull/8))
- Fixture modifiers ([#12](https://github.com/AntelopeJS/database-decorators/pull/12))

### 💅 Refactors

- Use correct path mappings for playground interfaces ([#2](https://github.com/AntelopeJS/database-decorators/pull/2))
- Remove .antelope from git ([#3](https://github.com/AntelopeJS/database-decorators/pull/3))

### 📖 Documentation

- Update license section in README.md ([41d141a](https://github.com/AntelopeJS/database-decorators/commit/41d141a))
- Enhance README.md with interfaces section and installation details ([#1](https://github.com/AntelopeJS/database-decorators/pull/1))
- Improved shields ([#5](https://github.com/AntelopeJS/database-decorators/pull/5))

### 📦 Build

- Update prepare command ([f863011](https://github.com/AntelopeJS/database-decorators/commit/f863011))
- Command 'build' that remove previous one before building ([#7](https://github.com/AntelopeJS/database-decorators/pull/7))
- Update changelog config ([1998f00](https://github.com/AntelopeJS/database-decorators/commit/1998f00))

### 🏡 Chore

- Allow partial objects in fixture generator ([f477a4f](https://github.com/AntelopeJS/database-decorators/commit/f477a4f))
- Generate exports ([bd172dc](https://github.com/AntelopeJS/database-decorators/commit/bd172dc))
- Generate exports ([5bfb0ad](https://github.com/AntelopeJS/database-decorators/commit/5bfb0ad))
- Update tsconfig.json paths ([c141799](https://github.com/AntelopeJS/database-decorators/commit/c141799))

### ✅ Tests

- Unit testing initial commit ([#6](https://github.com/AntelopeJS/database-decorators/pull/6))

### 🤖 CI

- Add GitHub Workflow to validate interface export ([#10](https://github.com/AntelopeJS/database-decorators/pull/10))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Thomas ([@Thomasims](http://github.com/Thomasims))
- Thomasims <thomas@antelopejs.com>
- Glastis ([@Glastis](http://github.com/Glastis))
- Fabrice Cst <fabrice@altab.be>

## 0.0.1 (2025-05-08)
