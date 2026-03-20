// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
 * Reconstructed from raw runtime bytecode.
 *
 * High-confidence facts recovered from the bytecode:
 * - This is a proxy-style contract.
 * - Unknown selectors with non-empty calldata are delegated to the implementation.
 * - Empty calldata is accepted and returns immediately instead of delegating.
 * - The implementation address is stored in a custom storage slot:
 *   0x2b1ffc369630770908ae8b04282e29044dfb19c5b4378f67d00e0a2ef5f153e2
 * - A fixed admin/operator address is hardcoded:
 *   0xe2963654c2d243c52ebc6998b5a40eb5d2cd5658
 * - One admin-only function updates the implementation after a compatibility check.
 *
 * Selector mapping recovered from the dispatcher:
 * - 0xb2b958b8(address): admin-only upgrade function
 * - 0xdffad664(): returns current implementation
 * - 0xee89462a(): returns hardcoded admin
 *
 * One internal compatibility probe calls selector 0xa79e0863 on the new
 * implementation via STATICCALL. The original Solidity name for that selector
 * could not be recovered from bytecode alone, so it is kept as a raw selector.
 */
contract RestoredProxy {
    address public constant ADMIN = 0xE2963654C2d243c52ebC6998B5A40EB5D2cd5658;

    bytes32 internal constant IMPLEMENTATION_SLOT =
        0x2b1ffc369630770908ae8b04282e29044dfb19c5b4378f67d00e0a2ef5f153e2;

    function implementation() external view returns (address impl) {
        impl = _implementation();
    }

    function admin() external pure returns (address) {
        return ADMIN;
    }

    function upgradeTo(address newImplementation) external {
        require(msg.sender == ADMIN, "not admin");
        _probeImplementation(newImplementation);
        _setImplementation(newImplementation);
    }

    receive() external payable {}

    fallback() external payable {
        _delegate(_implementation());
    }

    function _implementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    function _setImplementation(address newImplementation) internal {
        require(newImplementation != address(0));
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }

    function _probeImplementation(address newImplementation) internal view {
        (bool ok, ) = newImplementation.staticcall(
            abi.encodeWithSelector(bytes4(0xa79e0863))
        );
        require(ok, "invalid implementation");
    }

    function _delegate(address target) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let ok := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch ok
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
