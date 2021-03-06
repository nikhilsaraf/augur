pragma solidity 0.5.4;

import 'ROOT/libraries/token/ERC20Token.sol';
import 'ROOT/reporting/IDisputeCrowdsourcer.sol';
import 'ROOT/reporting/IMarket.sol';
import 'ROOT/IAugur.sol';


contract IDisputeOverloadToken is ERC20Token {
    function initialize(IAugur _augur, IDisputeCrowdsourcer _disputeCrowdsourcer, address _erc820RegistryAddress) public returns (bool);
    function getMarket() public returns (IMarket);
    function trustedMint(address _target, uint256 _amount) public returns (bool);
    function trustedBurn(address _target, uint256 _amount) public returns (bool);
}
