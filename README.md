# With Search extension for [Zod-Schema](https://github.com/pmogollons/zod-schema)

This extension adds support for search queries to Zod-Schema.

## How to install:
```bash
meteor add pmogollons:with-search
```

## Description

This extension adds support for mongodb $text indexes. If you depend on linked fields this extension will automatically update the searchText field on insert and update.

## Other packages
* [zod-schema](https://github.com/pmogollons/zod-schema)
* [grapher-nova](https://github.com/pmogollons/grapher-nova)

## Features
* Auto generates searchText field on insert and update
* Support for [grapher-nova](https://github.com/pmogollons/grapher-nova) links


## Usage

```js
import { Mongo } from "meteor/mongo";

const MyCollection = Mongo.Collection("myCollection");

const schema = z.object({
  name: z.string(),
  description: z.string(),
});

MyCollection.withSchema(schema);
MyCollection.withSearch({
  fields: ["name", "description"],
  hasLinks: true, // optional, only set if you use nova and your searchText depends on linked fields
});
```
