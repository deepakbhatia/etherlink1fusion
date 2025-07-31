// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IFusionResolver.sol";
import "./interfaces/IBridgeAdapter.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title EtherlinkFusionResolver
 *  Main resolver contract for 1inch Fusion+ integration on Etherlink
 * 
 * This contract implements the core 1inch Fusion+ protocol functionality on Etherlink:
 * - Creates and manages limit orders and Dutch auctions
 * - Handles cross-chain swaps between Etherlink and other L1/L2 chains
 * - Implements Dutch auction pricing mechanism with time-based price decay
 * - Provides signature verification for order security
 * - Supports LayerZero bridge integration for cross-chain transfers
 * 
 * Key Features:
 * - Dutch Auction: Orders start at 20% premium and decay to minimum price over 5 minutes
 * - Cross-Chain: Bridge tokens between Etherlink and Ethereum/Arbitrum/Optimism
 * - Security: ECDSA signature verification and reentrancy protection
 * - Fees: 0.3% protocol fee on successful trades
 * 
 * @author Etherlink Fusion+ Team
 */
contract EtherlinkFusionResolver is 
    IFusionResolver, 
    ReentrancyGuard, 
    Pausable, 
    Ownable(msg.sender) 
{
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Constants
    uint256 public constant AUCTION_DURATION = 300; // 5 minutes
    uint256 public constant MIN_AUCTION_DURATION = 60; // 1 minute
    uint256 public constant BASIS_POINTS = 10000;
    
    // State variables
    mapping(bytes32 => uint256) public orderFilled;
    mapping(bytes32 => bool) public orderCancelled;
    mapping(address => uint256) public nonces;
    
    IBridgeAdapter public bridgeAdapter;
    IPriceOracle public priceOracle;
    
    // Fee configuration
    uint256 public protocolFee = 30; // 0.3% in basis points
    address public feeRecipient;
    
    // Cross-chain configuration
    mapping(uint16 => bool) public supportedChains;
    mapping(bytes32 => CrossChainOrder) public crossChainOrders;
    
    modifier onlyValidChain(uint16 chainId) {
        require(supportedChains[chainId], "Unsupported chain");
        _;
    }

    // Initialize flag for proxy pattern
    bool private _initialized;

    constructor() {
        // Disable initialization on implementation contract
        _initialized = true;
    }

    /**
     *  Initialize the contract (for use with proxy pattern)
     */
    function initialize(
        address _bridgeAdapter,
        address _priceOracle,
        address _feeRecipient,
        address _owner
    ) external {
        require(!_initialized, "Already initialized");
        _initialized = true;
        
        bridgeAdapter = IBridgeAdapter(_bridgeAdapter);
        priceOracle = IPriceOracle(_priceOracle);
        feeRecipient = _feeRecipient;
        _transferOwnership(_owner);
    }

    /**
     *  Create a new order for token swap
     */
    function createOrder(Order calldata order) 
        external 
        override 
        whenNotPaused 
        returns (bytes32 orderHash) 
    {
        require(order.maker == msg.sender, "Invalid maker");
        require(order.expiry > block.timestamp, "Order expired");
        require(order.makingAmount > 0 && order.takingAmount > 0, "Invalid amounts");
        
        orderHash = getOrderHash(order);
        require(orderFilled[orderHash] == 0, "Order already exists");
        
        // Transfer maker asset to contract
        IERC20(order.makerAsset).safeTransferFrom(
            order.maker,
            address(this),
            order.makingAmount
        );
        
        emit OrderCreated(
            orderHash,
            order.maker,
            order.makerAsset,
            order.takerAsset,
            order.makingAmount,
            order.takingAmount
        );
    }

    /**
     *  Fill an existing order with Dutch auction pricing
     */
    function fillOrder(
        Order calldata order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    ) external override nonReentrant whenNotPaused {
        bytes32 orderHash = getOrderHash(order);
        
        // Verify order validity
        require(!orderCancelled[orderHash], "Order cancelled");
        require(order.expiry > block.timestamp, "Order expired");
        require(orderFilled[orderHash] + makingAmount <= order.makingAmount, "Insufficient balance");
        
        // Verify signature
        require(_verifySignature(orderHash, signature, order.maker), "Invalid signature");
        
        // Calculate Dutch auction price
        uint256 currentPrice = _calculateDutchAuctionPrice(order);
        require(takingAmount >= currentPrice * makingAmount / order.makingAmount, "Price too low");
        
        // Update filled amount
        orderFilled[orderHash] += makingAmount;
        
        // Calculate protocol fee
        uint256 fee = (takingAmount * protocolFee) / BASIS_POINTS;
        uint256 netAmount = takingAmount - fee;
        
        // Execute transfer
        IERC20(order.takerAsset).safeTransferFrom(msg.sender, order.maker, netAmount);
        if (fee > 0) {
            IERC20(order.takerAsset).safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        
        // Transfer maker asset to resolver
        IERC20(order.makerAsset).safeTransfer(msg.sender, makingAmount);
        
        emit OrderFilled(orderHash, msg.sender, makingAmount);
    }

    /**
     *  Initiate cross-chain swap using LayerZero bridge
     */
    function initiateCrossChainSwap(
        CrossChainOrder calldata order,
        bytes calldata signature
    ) external payable override nonReentrant whenNotPaused 
      onlyValidChain(order.dstChainId) {
        
        bytes32 orderHash = getOrderHash(order.order);
        
        // Verify order and signature
        require(!orderCancelled[orderHash], "Order cancelled");
        require(order.order.expiry > block.timestamp, "Order expired");
        require(_verifySignature(orderHash, signature, order.order.maker), "Invalid signature");
        
        // Store cross-chain order
        crossChainOrders[orderHash] = order;
        
        // Transfer source tokens
        IERC20(order.srcToken).safeTransferFrom(
            msg.sender,
            address(this),
            order.order.makingAmount
        );
        
        // Initiate bridge transfer
        IERC20(order.srcToken).approve(address(bridgeAdapter), order.order.makingAmount);
        
        IBridgeAdapter.BridgeParams memory bridgeParams = IBridgeAdapter.BridgeParams({
            dstChainId: order.dstChainId,
            dstAddress: address(this),
            token: order.srcToken,
            amount: order.order.makingAmount,
            recipient: order.order.maker,
            adapterParams: ""
        });
        
        bridgeAdapter.bridgeToken{value: msg.value}(bridgeParams);
        
        emit CrossChainSwapInitiated(
            orderHash,
            order.srcChainId,
            order.dstChainId,
            order.srcToken,
            order.dstToken,
            order.order.makingAmount
        );
    }

    /**
     *  Calculate Dutch auction price based on time elapsed
     */
    function _calculateDutchAuctionPrice(Order calldata order) 
        internal 
        view 
        returns (uint256) 
    {
        uint256 timeElapsed = block.timestamp - (order.expiry - AUCTION_DURATION);
        if (timeElapsed >= AUCTION_DURATION) {
            return order.takingAmount; // Minimum price reached
        }
        
        // Linear decay from initial price to minimum price
        uint256 initialPrice = order.takingAmount * 12 / 10; // 20% premium initially
        uint256 priceDecay = (initialPrice - order.takingAmount) * timeElapsed / AUCTION_DURATION;
        
        return initialPrice - priceDecay;
    }

    /**
     *  Verify ECDSA signature for order
     */
    function _verifySignature(
        bytes32 orderHash,
        bytes calldata signature,
        address signer
    ) internal pure returns (bool) {
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", orderHash));
        return ethSignedHash.recover(signature) == signer;
    }

    /**
     *  Get order hash for given order
     */
    function getOrderHash(Order calldata order) 
        public 
        pure 
        override 
        returns (bytes32) 
    {
        return keccak256(abi.encode(
            order.maker,
            order.makerAsset,
            order.takerAsset,
            order.makingAmount,
            order.takingAmount,
            order.salt,
            order.expiry
        ));
    }

    /**
     *  Get order filled amount
     */
    function getOrderStatus(bytes32 orderHash) 
        external 
        view 
        override 
        returns (uint256 filled) 
    {
        return orderFilled[orderHash];
    }

    // Admin functions
    function setBridgeAdapter(address _bridgeAdapter) external onlyOwner {
        bridgeAdapter = IBridgeAdapter(_bridgeAdapter);
    }

    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = IPriceOracle(_priceOracle);
    }

    function setProtocolFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        protocolFee = _fee;
    }

    function setSupportedChain(uint16 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}
