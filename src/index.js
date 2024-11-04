import get from "lodash.get";
import { Mongo } from "meteor/mongo";


const TEXT_SEPARATOR = " - ";

Object.assign(Mongo.Collection.prototype, {
  withSearch: function (options) {
    const { fields, index, hasLinks } = options;

    this._searchFields = fields;

    if (this._schema) {
      import { z } from "zod";

      this._schema = this._schema.extend({
        searchText: z.string().optional(),
      });
    }

    if (index) {
      this.createIndex({
        searchText: "text",
      });
    }

    if (!hasLinks) {
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

    return this;
  },

  syncSearchTextFields: async function () {
    try {
      const docs = await this.createQuery({
        $filters: {},

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

      console.log("Search text fields synced");
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