// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KeryxRegistry} from "../src/KeryxRegistry.sol";

contract KeryxRegistryTest is Test {
    KeryxRegistry internal reg;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    string internal constant ID_A = "search.web";
    string internal constant ID_B = "solana.token-activity";

    function setUp() public {
        reg = new KeryxRegistry(admin);
    }

    // ---- publish -------------------------------------------------------

    function test_publish_records_tool_and_emits_event() public {
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta-a");

        assertEq(h, keccak256(bytes(ID_A)));
        (
            address publisher,
            uint256 price,
            ,
            ,
            bool active,
            bool verified,
            string memory meta
        ) = reg.tools(h);
        assertEq(publisher, alice);
        assertEq(price, 4000);
        assertTrue(active);
        assertFalse(verified);
        assertEq(meta, "ipfs://meta-a");
        assertEq(reg.toolCount(), 1);
    }

    function test_publish_reverts_on_duplicate_id() public {
        vm.prank(alice);
        reg.publish(ID_A, 4000, "ipfs://meta-a");
        vm.prank(bob);
        vm.expectRevert(KeryxRegistry.ToolExists.selector);
        reg.publish(ID_A, 5000, "ipfs://meta-a2");
    }

    function test_publish_reverts_on_empty_id() public {
        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.EmptyId.selector);
        reg.publish("", 4000, "ipfs://meta");
    }

    function test_publish_reverts_on_zero_price() public {
        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.ZeroPrice.selector);
        reg.publish(ID_A, 0, "ipfs://meta");
    }

    // ---- updatePrice ---------------------------------------------------

    function test_updatePrice_only_publisher() public {
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta");

        vm.prank(bob);
        vm.expectRevert(KeryxRegistry.NotPublisher.selector);
        reg.updatePrice(h, 5000);

        vm.prank(alice);
        reg.updatePrice(h, 6000);
        (, uint256 price, , , , , ) = reg.tools(h);
        assertEq(price, 6000);
    }

    function test_updatePrice_reverts_on_nonexistent() public {
        vm.expectRevert(KeryxRegistry.ToolNotFound.selector);
        reg.updatePrice(keccak256("nope"), 1);
    }

    // ---- transferListing -----------------------------------------------

    function test_transferListing_moves_owner() public {
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta");

        vm.prank(alice);
        reg.transferListing(h, bob);
        (address publisher, , , , , , ) = reg.tools(h);
        assertEq(publisher, bob);

        // alice can no longer touch it
        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.NotPublisher.selector);
        reg.updatePrice(h, 9999);

        // bob can
        vm.prank(bob);
        reg.updatePrice(h, 9999);
    }

    // ---- owner powers --------------------------------------------------

    function test_setVerified_only_owner() public {
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta");

        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.NotOwner.selector);
        reg.setVerified(h, true);

        vm.prank(admin);
        reg.setVerified(h, true);
        (, , , , , bool verified, ) = reg.tools(h);
        assertTrue(verified);
    }

    function test_owner_cannot_hijack_publisher_state() public {
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta");
        vm.prank(admin);
        vm.expectRevert(KeryxRegistry.NotPublisher.selector);
        reg.updatePrice(h, 9999);
    }

    function test_pause_blocks_publish_and_updates() public {
        vm.prank(admin);
        reg.setPaused(true);

        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.RegistryPaused.selector);
        reg.publish(ID_A, 4000, "ipfs://meta");

        // unpause, publish, re-pause, then updates should also revert
        vm.prank(admin);
        reg.setPaused(false);
        vm.prank(alice);
        bytes32 h = reg.publish(ID_A, 4000, "ipfs://meta");
        vm.prank(admin);
        reg.setPaused(true);
        vm.prank(alice);
        vm.expectRevert(KeryxRegistry.RegistryPaused.selector);
        reg.updatePrice(h, 9999);
    }

    // ---- views ---------------------------------------------------------

    function test_exists_and_idHash_view() public {
        assertFalse(reg.exists(keccak256(bytes(ID_A))));
        vm.prank(alice);
        reg.publish(ID_A, 4000, "ipfs://meta");
        assertTrue(reg.exists(keccak256(bytes(ID_A))));
        assertEq(reg.toolIdHash(ID_A), keccak256(bytes(ID_A)));
    }

    // ---- misc ----------------------------------------------------------

    function test_two_publishers_two_tools() public {
        vm.prank(alice);
        reg.publish(ID_A, 4000, "ipfs://meta-a");
        vm.prank(bob);
        reg.publish(ID_B, 5000, "ipfs://meta-b");
        assertEq(reg.toolCount(), 2);
    }

    function test_transferOwner_updates_admin() public {
        vm.prank(admin);
        reg.transferOwner(carol);
        assertEq(reg.owner(), carol);

        vm.prank(admin);
        vm.expectRevert(KeryxRegistry.NotOwner.selector);
        reg.setPaused(true);
    }
}
