import get from "lodash.get";
import { Mongo } from "meteor/mongo";

import flattenObject from "./lib/flattenObject";


const TEXT_SEPARATOR = " - ";

Object.assign(Mongo.Collection.prototype, {
  withSearch: function (options) {
    const { fields, deps = [] } = options;

    this._searchFields = fields;

    if (this._schema) {
      import { z } from "zod";

      this._schema = this._schema.extend({
        searchText: z.string().optional(),
      });
    }

    this.createIndex({
      searchText: "text",
    });

    if (deps.length === 0) {
      this.onBeforeInsert(async ({ doc }) => {
        doc.searchText = generateSearchText({ doc, fields });
      });
    } else {
      this.onInsert(async ({ doc }) => {
        const searchText = generateSearchText({ doc, fields });

        this.updateAsync({ _id: doc._id }, { $set: { searchText } }, { skipHooks: true });
      }, {
        docFields: getDocFields(fields),
      });
    }

    this.onBeforeUpdate(async ({ doc, previousDoc }) => {
      doc.searchText = generateSearchText({ doc, previousDoc, fields });
    }, {
      docFields: getDocFields(fields),
      fetchPrevious: true,
    });

    if (deps.length > 0) {
      deps.forEach((dep) => {
        dep.collection.onInsert(async ({ doc }) => {
          const flattenedDoc = Object.keys(flattenObject(dep.docFields))[0];

          // TODO: We should try to use a more efficient way that reduces queries
          await this.syncSearchTextFields({ _id: doc[flattenedDoc] });
        }, {
          docFields: dep.docFields,
        });
      });
    }

    return this;
  },

  syncSearchTextFields: async function ({ _id }) {
    try {
      const query = {};

      if (_id) {
        query._id = _id;
      }

      const docs = await this.createQuery({
        $filters: query,

        _id: true,
        ...getDocFields(this._searchFields),
      }).fetchAsync();

      const bulkOps = docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { searchText: generateSearchText({ doc, fields: this._searchFields }) } },
        },
      }));

      await this.rawCollection().bulkWrite(bulkOps);
    } catch (error) {
      console.log(error);
    }
  },
});

function getDocFields(fields) {
  return fields.reduce((acc, field) => {
    const keys = field.replace(".$.", ".").split(".");
    keys.reduce((nested, key, index) => {
      if (index === keys.length - 1) {
        nested[key] = true;
      } else {
        nested[key] = nested[key] || {};
      }

      return nested[key];
    }, acc);

    return acc;
  }, {});
}

function generateSearchText({ doc = {}, previousDoc = {}, fields }) {
  return fields.map((field) => {
    if (field.includes(".$.")) {
      const keys = field.split(".$.");
      const key = keys[1];
      const field2 = keys[0];
      const values = get(doc, field2) || get(previousDoc, field2);

      return values?.map((value) => value[key]).join(TEXT_SEPARATOR) || "";
    }

    return get(doc, field) || get(previousDoc, field);
  }).join(TEXT_SEPARATOR).toLowerCase();
}