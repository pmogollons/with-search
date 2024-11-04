/* eslint-disable no-unused-vars */

declare module "meteor/mongo" {
  namespace Mongo {
    interface Collection<T, U = T> {
      withSearch(options: {
        fields: string[];
        index?: boolean;
      }): Collection<T, U>;
      syncSearchTextFields(): Promise<void>;
    }
  }
}