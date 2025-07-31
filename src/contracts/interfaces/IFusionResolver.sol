// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IFusionResolver
 *  Interface for 1inch Fusion+ resolver integration on Etherlink
 */
interface IFusionResolver {
    struct Order {
        address maker;
        address makerAsset;
        address takerAsset;
        uint256 makingAmount;
        uint256 takingAmount;
        bytes32 salt;
        uint256 expiry;
        bytes makerAssetData;
        bytes takerAssetData;
    }

    struct CrossChainOrder {
        Order order;
        uint16 srcChainId;
        uint16 dstChainId;
        address srcToken;
        address dstToken;
        uint256 minDstAmount;
        bytes32 secretHash;
        uint256 timelock;
    }

    event OrderCreated(
        bytes32 indexed orderHash,
        address indexed maker,
        address makerAsset,
        address takerAsset,
        uint256 makingAmount,
        uint256 takingAmount
    );

    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed resolver,
        uint256 filledAmount
    );

    event CrossChainSwapInitiated(
        bytes32 indexed orderHash,
        uint16 srcChainId,
        uint16 dstChainId,
        address srcToken,
        address dstToken,
        uint256 amount
    );

    function createOrder(Order calldata order) external returns (bytes32 orderHash);
    
    function fillOrder(
        Order calldata order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    ) external;

    function initiateCrossChainSwap(
        CrossChainOrder calldata order,
        bytes calldata signature
    ) external payable;

    function getOrderHash(Order calldata order) external pure returns (bytes32);
    
    function getOrderStatus(bytes32 orderHash) external view returns (uint256 filled);
}
