pragma solidity 0.5.4;


import 'ROOT/IAugur.sol';
import 'ROOT/reporting/IMarket.sol';


contract IProfitLoss {
    function initialize(IAugur _augur) public returns (bool);
    function recordTrade(IMarket _market, address _longAddress, address _shortAddress, uint256 _outcome, int256 _amount, int256 _price, uint256 _numLongTokens, uint256 _numShortTokens, uint256 _numLongShares, uint256 _numShortShares) public returns (bool);
    function recordClaim(IMarket _market, address _account) public returns (bool);
}
