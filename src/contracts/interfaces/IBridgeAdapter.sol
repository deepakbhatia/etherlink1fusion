// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeAdapter
 *  Interface for LayerZero bridge adapter on Etherlink
 */
interface IBridgeAdapter {
    struct BridgeParams {
        uint16 dstChainId;
        address dstAddress;
        address token;
        uint256 amount;
        address recipient;
        bytes adapterParams;
    }

    event TokensBridged(
        uint16 indexed dstChainId,
        address indexed token,
        uint256 amount,
        address indexed recipient,
        uint64 nonce
    );

    event TokensReceived(
        uint16 indexed srcChainId,
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    function bridgeToken(
        BridgeParams calldata params
    ) external payable;

    function estimateBridgeFee(
        uint16 dstChainId,
        address token,
        uint256 amount,
        bytes calldata adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee);

    function setTrustedRemote(uint16 chainId, bytes calldata path) external;
    
    function isTrustedRemote(uint16 chainId, bytes calldata path) external view returns (bool);
}
