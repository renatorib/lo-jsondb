**1.0**
* Project has initialized with support to create, find, find one, delete, update and update identical. Also can .chain() lodash. Write with .write();
* Supports ID auto incremention.

**1.1**
* Added method `.save()`: shorthand to update/create based on id field.

**1.2**
* Added methods `.findLast()` and `.getLastInsertId()`

**1.3**
* Added support to Single Documents, by `jsondb('file', {single: true})`
* Added instance shorthands: `jsondb.single('file')`, `jsondb.pretty('file')`, `jsondb.single.pretty('file')`
* Added methods `.findAll()`, `.findFirst(query)` and changes method `.findLast(query)`
* Added methods `setProp()` and `getProp()`
