import fs from 'fs';
import chalk from 'chalk';
import keythereum from 'keythereum';
import speedomatic from 'speedomatic';
import readlineSync from 'readline-sync';
import debugOptions from '../../debug-options';

function getPrivateKeyFromString(privateKey) {
  privateKey = Buffer.from(speedomatic.strip0xPrefix(privateKey), "hex");
  let address = keythereum.privateKeyToAddress(privateKey);
  if (debugOptions.cannedMarkets) console.log(chalk.green.dim("sender:"), chalk.green(address));
  return { accountType: "privateKey", signer: privateKey, address: address };
}

function getPrivateKeyFromEnv() {
  return getPrivateKeyFromString(process.env.ETHEREUM_PRIVATE_KEY);
}

function getPrivateKeyFromKeystoreFile(keystoreFilePath, callback) {
  fs.readFile(keystoreFilePath, function (err, keystoreJson) {
    if (err) callback(err);
    let keystore = JSON.parse(keystoreJson);
    let address = speedomatic.formatEthereumAddress(keystore.address);
    if (debugOptions.cannedMarkets) console.log(chalk.green.dim("sender:"), chalk.green(address));
    keythereum.recover(process.env.ETHEREUM_PASSWORD || readlineSync.question("Password: ", { hideEchoBack: true }), keystore, function (privateKey) {
      if (privateKey == null || privateKey.error) {
        return callback(new Error("private key decryption failed"));
      }
      callback(null, { accountType: "privateKey", signer: privateKey, address: address });
    });
  });
}

function getPrivateKey(keystoreFilePath, callback) {
  if (process.env.ETHEREUM_PRIVATE_KEY != null) {
    try {
      callback(null, getPrivateKeyFromEnv());
    } catch (exc) {
      callback(exc);
    }
  } else {
    getPrivateKeyFromKeystoreFile(keystoreFilePath, callback);
  }
}

export { getPrivateKey, getPrivateKeyFromEnv, getPrivateKeyFromString };
