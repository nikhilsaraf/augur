#!/usr/bin/env node

#!/usr/bin/env node

import chalk from 'chalk';

import Augur from 'augur.js';
import approveAugurEternalApprovalValue from './lib/approve-augur-eternal-approval-value';
import createOrders from './lib/create-orders';
import { getPrivateKey } from './lib/get-private-key';
import connectionEndpoints from '../connection-endpoints';
import debugOptions from '../debug-options';

function _createOrders(augur, auth, callback) {
  console.log(chalk.cyan.dim("networkId:"), chalk.cyan(augur.rpc.getNetworkID()));
  var universe = augur.contracts.addresses[augur.rpc.getNetworkID()].Universe;
  console.log(chalk.green.dim("universe:"), chalk.green(universe));
  approveAugurEternalApprovalValue(augur, auth.address, auth, function (err) {
    if (err) return console.error(err);
    augur.markets.getMarkets({ universe: universe, sortBy: "creationBlockNumber" }, function (err, marketIds) {
      console.log("marketIds:", marketIds);
      if (err) return console.error(err);
      createOrders(augur, marketIds, auth, function (err) {
        if (err) callback(err);
        callback(null);
      });
    });
  });
}
export default _createOrders;

if (require.main === module) {
  var keystoreFilePath = process.argv[2];

  var augur = new Augur();

  augur.rpc.setDebugOptions(debugOptions);

  getPrivateKey(keystoreFilePath, function (err, auth) {
    if (err) return console.error("getPrivateKey failed:", err);
    augur.connect(connectionEndpoints, function (err) {
      if (err) return console.error(err);

      _createOrders(augur, auth, function (err) {
        if (err) {
          console.error(chalk.red.bold("Canned order creation failed:"), err);
          process.exit(1);
        }
        process.exit();
      });
    });
  });
}