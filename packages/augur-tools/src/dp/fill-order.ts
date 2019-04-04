#!/usr/bin/env node

#!/usr/bin/env node

import chalk from 'chalk';

import Augur from 'augur.js';
import approveAugurEternalApprovalValue from './lib/approve-augur-eternal-approval-value';
import fillBothOrderTypes from './lib/fill-both-order-types';
import { getPrivateKey } from './lib/get-private-key';
import connectionEndpoints from '../connection-endpoints';
import debugOptions from '../debug-options';

var keystoreFilePath = process.argv[2];

var augur = new Augur();

augur.rpc.setDebugOptions(debugOptions);

getPrivateKey(keystoreFilePath, function (err, auth) {
  if (err) return console.error("getPrivateKey failed:", err);
  augur.connect(connectionEndpoints, function (err) {
    if (err) return console.error(err);
    var universe = augur.contracts.addresses[augur.rpc.getNetworkID()].Universe;
    var fillerAddress = auth.address;
    console.log(chalk.cyan.dim("networkId:"), chalk.cyan(augur.rpc.getNetworkID()));
    console.log(chalk.green.dim("universe:"), chalk.green(universe));
    approveAugurEternalApprovalValue(augur, fillerAddress, auth, function (err) {
      if (err) return console.error(err);
      var outcomeToFill = process.env.OUTCOME_TO_FILL || 1;
      var sharesToFill = process.env.SHARES_TO_FILL || "1";
      fillBothOrderTypes(augur, universe, fillerAddress, outcomeToFill, sharesToFill, auth, function (err) {
        if (err) console.error("fillBothOrderTypes failed:", err);
        process.exit();
      });
    });
  });
});