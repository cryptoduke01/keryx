// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {KeryxRegistry} from "../src/KeryxRegistry.sol";

/**
 * @notice Deploy KeryxRegistry to Arc testnet.
 *
 * Usage:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url https://rpc.testnet.arc.network \
 *     --broadcast \
 *     --private-key $DEPLOYER_PRIVATE_KEY
 *
 * The `owner` constructor arg reads KERYX_OWNER from env; falls back to the
 * deployer address if not set.
 */
contract Deploy is Script {
    function run() external returns (KeryxRegistry reg) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address owner = vm.envOr("KERYX_OWNER", deployer);

        console2.log("Deployer:", deployer);
        console2.log("Owner:", owner);

        vm.startBroadcast(pk);
        reg = new KeryxRegistry(owner);
        vm.stopBroadcast();

        console2.log("KeryxRegistry deployed at:", address(reg));
    }
}
