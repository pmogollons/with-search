export default function flattenObject(ob) {
  const toReturn = {};

  for (const i in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, i)) {
      continue;
    }

    if ((typeof ob[i]) == "object" && ob[i] !== null) {
      const flatObject = flattenObject(ob[i]);

      for (const x in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, x)) {
          continue;
        }

        toReturn[i + "." + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }

  return toReturn;
}