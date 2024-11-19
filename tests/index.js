import { Mongo } from "meteor/mongo";
import { Tinytest } from "meteor/tinytest";


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Contacts = new Mongo.Collection("contacts");
const Organizations = new Mongo.Collection("organizations");

Organizations.withSearch({
  fields: ["name", "miaw", "owner.name", "contacts.$.name"],
  deps: [{
    collection: Contacts,
    docFields: {
      contact: {
        _id: true,
      },
    },
  }],
});


Organizations.addLinks({
  contacts: {
    collection: Contacts,
    inversedBy: "organization",
  },
  owner: {
    collection: Contacts,
    field: "ownerId",
  },
});

Contacts.addLinks({
  organization: {
    collection: Organizations,
    field: "organizationId",
  },
});

Tinytest.addAsync("WithSearch - searchText is set onInsert", async function (test) {
  const docId = await Organizations.insertAsync({ name: "Test Document", miaw: "remiaw" });

  await wait(100); // wait for the index to be updated

  const doc = await Organizations.findOneAsync({ _id: docId });

  test.equal(doc.searchText, "test document - remiaw -  - ");
});

Tinytest.addAsync("WithSearch - searchText is set onUpdate", async function (test) {
  const _id = await Organizations.insertAsync({ name: "Test Document", miaw: "remiaw" });
  await Organizations.updateAsync({ _id }, { $set: { name: "Updated Document" } });
  const doc = await Organizations.findOneAsync({ _id });

  test.equal(doc.searchText, "updated document - remiaw -  - ");
});

Tinytest.addAsync("WithSearch - searchText is set with links", async function (test) {
  const ownerId = await Contacts.insertAsync({ name: "Test Contact" });
  const organizationId = await Organizations.insertAsync({ name: "Test Document", miaw: "remiaw", ownerId });
  await Contacts.insertAsync({ name: "Contact 1", organizationId });
  await Contacts.insertAsync({ name: "Contact 2", organizationId });

  const organization = await Organizations.findOneAsync({ _id: organizationId });

  test.equal(organization.searchText, "test document - remiaw - test contact - ");
  await Organizations.updateAsync({ _id: organizationId }, { $set: { name: "Test Document 2" } });

  const doc = await Organizations.findOneAsync({ _id: organizationId });

  test.equal(doc.searchText, "test document 2 - remiaw - test contact - contact 1 - contact 2");
});

Tinytest.addAsync("WithSearch - searchText is set with deps", async function (test) {
  const organizationId = await Organizations.insertAsync({ name: "Test Document", miaw: "remiaw" });
  const contactId = await Contacts.insertAsync({ name: "Test Contact", organizationId });

  await wait(100);

  const organization = await Organizations.findOneAsync({ _id: organizationId });

  test.equal(organization.searchText, "test document - remiaw -  - test contact");
});
