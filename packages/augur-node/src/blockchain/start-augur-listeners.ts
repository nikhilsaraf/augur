import * as _ from "lodash";
import Knex from "knex";
import { Augur, ErrorCallback } from "../types";
import { logProcessors } from "./log-processors";

import { EthersProviderBlockStreamAdapter } from "blockstream-adapters";
import { BlockAndLogStreamerListener } from "@augurproject/state/build/db/BlockAndLogStreamerListener";
import { EventLogDBRouter } from "@augurproject/state/build/db/EventLogDBRouter";
import { Addresses } from "@augurproject/artifacts";

export function startAugurListeners(db: Knex, pouch: PouchDB.Database, augur: Augur, highestBlockNumber: number, databaseDir: string, isWarpSync: boolean, errorCallback: ErrorCallback): BlockAndLogStreamerListener {
  const eventLogDBRouter = new EventLogDBRouter(augur.events.parseLogs);
  const blockAndLogStreamerListener =  BlockAndLogStreamerListener.create(augur.provider, eventLogDBRouter, Addresses[augur.networkId].Augur, augur.events.getEventTopics);

  _.forEach(logProcessors.Augur, (value, event) => {
    const onAdd = _.partial(value.add, augur);
    const onRemove = _.partial(value.remove, augur);

    blockAndLogStreamerListener.listenForEvent(event,
      (blockIdentifier, logs=[]) => {
        logs.forEach(onAdd);
      },
      (blockIdentifier, logs=[]) => {
        logs.forEach(onRemove);
      });
  });
  return blockAndLogStreamerListener;
}
