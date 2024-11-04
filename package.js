Package.describe({
  name: "pmogollons:with-search",
  version: "1.0.0",
  summary: "Adds a searchText field to collections",
  git: "https://github.com/pmogollons/with-search",
  documentation: "README.md",
});

const npmPackages = {
  "lodash.get": "4.4.2",
};

Package.onUse(function (api) {
  Npm.depends(npmPackages);

  api.versionsFrom(["3.0"]);

  const packages = [
    "typescript",
    "ecmascript",
    "mongo",
    "zodern:types@1.0.13",
    "pmogollons:collection-hooks",
  ];

  api.use(packages);

  api.mainModule("src/index.js", "server");
});

Package.onTest(function (api) {
  Npm.depends({
    ...npmPackages,
  });

  api.use([
    "mongo",
    "random",
    "tinytest",
    "ecmascript",
    "typescript",
    "pmogollons:nova",
    "pmogollons:zod-schema",
    "pmogollons:with-search",
  ]);

  api.mainModule("tests/index.js", "server");
});
