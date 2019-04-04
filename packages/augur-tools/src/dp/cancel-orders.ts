#!/usr/bin/env node

#!/usr/bin/env node

import Augur from 'augur.js';

import approveAugurEternalApprovalValue from './lib/approve-augur-eternal-approval-value';
import cancelOrders from './lib/cancel-orders';
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
    var creatorAddress = auth.address;
    approveAugurEternalApprovalValue(augur, creatorAddress, auth, function (err) {
      if (err) return console.error(err);
      var universe = augur.contracts.addresses[augur.rpc.getNetworkID()].Universe;
      cancelOrders(augur, creatorAddress, universe, auth, function (err) {
        if (err) console.error(err);
        process.exit();
      });
    });
  });
});