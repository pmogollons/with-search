/* eslint-disable no-unused-vars */

declare module "meteor/mongo" {
  namespace Mongo {
    interface Collection<T, U = T> {
      withSearch(options: {
        fields: string[];
        deps?: {
          collection: Collection<any>;
          docFields: Record<string, any>;
        }[];
      }): Collection<T, U>;
      syncSearchTextFields(): Promise<void>;
    }
  }
}