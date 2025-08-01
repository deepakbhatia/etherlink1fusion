// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IFusionResolver.sol";
import "./interfaces/IBridgeAdapter.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title CrossChainRouter
 *  Handles routing logic between Ethereum mainnet and Etherlink L2
 * 
 * This contract manages cross-chain token routing and bridging operations:
 * - Routes swaps between different chains (Ethereum, Arbitrum, Optimism, Etherlink)
 * - Calculates optimal routes and fees for cross-chain transfers
 * - Implements slippage protection to prevent unfavorable trades
 * - Integrates with EtherlinkFusionResolver for local swaps
 * - Uses BridgeAdapter for cross-chain token transfers
 * 
 * Key Features:
 * - Multi-Chain Support: Ethereum, Arbitrum, Optimism, Base, Etherlink
 * - Route Optimization: Finds best paths for cross-chain swaps
 * - Slippage Protection: Maximum 3% slippage with configurable limits
 * - Fee Management: Calculates and handles bridge fees automatically
 * - Price Oracle Integration: Uses real-time price feeds for accurate routing
 * 
 * @author Etherlink Fusion+ Team
 */
contract CrossChainRouter is Ownable(msg.sender), ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Core contracts
    IFusionResolver public fusionResolver;
    IBridgeAdapter public bridgeAdapter;
    IPriceOracle public priceOracle;
    
    // Route configuration
    struct RouteConfig {
        uint16 chainId;
        address token;
        address bridgeToken;
        uint256 minAmount;
        uint256 maxAmount;
        bool isActive;
    }
    
    mapping(bytes32 => RouteConfig) public routes;
    mapping(uint16 => bool) public supportedChains;
    
    // Slippage protection
    uint256 public maxSlippage = 300; // 3% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event RouteCreated(
        bytes32 indexed routeId,
        uint16 srcChainId,
        uint16 dstChainId,
        address srcToken,
        address dstToken
    );
    
    event SwapRouted(
        bytes32 indexed routeId,
        address indexed user,
        uint256 amountIn,
        uint256 expectedAmountOut,
        uint16 dstChainId
    );
    
    event RouteUpdated(bytes32 indexed routeId, bool isActive);

    constructor(
        address _fusionResolver,
        address _bridgeAdapter,
        address _priceOracle
    ) {
        fusionResolver = IFusionResolver(_fusionResolver);
        bridgeAdapter = IBridgeAdapter(_bridgeAdapter);
        priceOracle = IPriceOracle(_priceOracle);
        
        // Initialize supported chains
        supportedChains[1] = true;     // Ethereum
        supportedChains[42161] = true; // Arbitrum
        supportedChains[10] = true;    // Optimism
        supportedChains[42793] = true; // Etherlink Mainnet
    }

    /**
     *  Create a new routing configuration
     */
    function createRoute(
        uint16 srcChainId,
        uint16 dstChainId,
        address srcToken,
        address dstToken,
        address bridgeToken,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyOwner returns (bytes32 routeId) {
        require(supportedChains[srcChainId] && supportedChains[dstChainId], "Unsupported chain");
        require(srcToken != address(0) && dstToken != address(0), "Invalid token");
        require(minAmount > 0 && maxAmount > minAmount, "Invalid amounts");
        
        routeId = keccak256(abi.encodePacked(srcChainId, dstChainId, srcToken, dstToken));
        
        routes[routeId] = RouteConfig({
            chainId: dstChainId,
            token: dstToken,
            bridgeToken: bridgeToken,
            minAmount: minAmount,
            maxAmount: maxAmount,
            isActive: true
        });
        
        emit RouteCreated(routeId, srcChainId, dstChainId, srcToken, dstToken);
    }

    /**
     *  Execute cross-chain swap with optimal routing
     */
    function executeSwap(
        uint16 dstChainId,
        address srcToken,
        address dstToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external payable nonReentrant {
        require(supportedChains[dstChainId], "Unsupported destination chain");
        require(amountIn > 0, "Invalid amount");
        require(recipient != address(0), "Invalid recipient");
        
        bytes32 routeId = keccak256(abi.encodePacked(
            block.chainid, 
            dstChainId, 
            srcToken, 
            dstToken
        ));
        
        RouteConfig storage route = routes[routeId];
        require(route.isActive, "Route not active");
        require(amountIn >= route.minAmount && amountIn <= route.maxAmount, "Amount out of range");
        
        // Calculate expected output amount using price oracle
        uint256 expectedAmountOut = _calculateExpectedOutput(srcToken, dstToken, amountIn);
        require(expectedAmountOut >= minAmountOut, "Insufficient output amount");
        
        // Apply slippage protection
        uint256 minAcceptableAmount = expectedAmountOut * (BASIS_POINTS - maxSlippage) / BASIS_POINTS;
        require(minAmountOut >= minAcceptableAmount, "Slippage too high");
        
        // Transfer input tokens
        IERC20(srcToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        if (dstChainId == block.chainid) {
            // Same chain swap
            _executeLocalSwap(srcToken, dstToken, amountIn, recipient);
        } else {
            // Cross-chain swap
            _executeCrossChainSwap(route, srcToken, amountIn, recipient);
        }
        
        emit SwapRouted(routeId, msg.sender, amountIn, expectedAmountOut, dstChainId);
    }

    /**
     *  Execute swap on the same chain
     */
    function _executeLocalSwap(
        address srcToken,
        address dstToken,
        uint256 amountIn,
        address recipient
    ) internal {
        // Create order for local swap via Fusion+
        IFusionResolver.Order memory order = IFusionResolver.Order({
            maker: address(this),
            makerAsset: srcToken,
            takerAsset: dstToken,
            makingAmount: amountIn,
            takingAmount: _calculateExpectedOutput(srcToken, dstToken, amountIn),
            salt: keccak256(abi.encodePacked(block.timestamp, msg.sender)),
            expiry: block.timestamp + 300, // 5 minutes
            makerAssetData: "",
            takerAssetData: ""
        });
        
        // Approve and create order
        IERC20(srcToken).approve(address(fusionResolver), amountIn);
        fusionResolver.createOrder(order);
    }

    /**
     *  Execute cross-chain swap
     */
    function _executeCrossChainSwap(
        RouteConfig storage route,
        address srcToken,
        uint256 amountIn,
        address recipient
    ) internal {
        // Approve bridge adapter
        IERC20(srcToken).approve(address(bridgeAdapter), amountIn);
        
        // Estimate bridge fee
        (uint256 bridgeFee,) = bridgeAdapter.estimateBridgeFee(
            route.chainId,
            srcToken,
            amountIn,
            ""
        );
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        
        // Execute bridge transfer
        IBridgeAdapter.BridgeParams memory bridgeParams = IBridgeAdapter.BridgeParams({
            dstChainId: route.chainId,
            dstAddress: recipient,
            token: srcToken,
            amount: amountIn,
            recipient: recipient,
            adapterParams: ""
        });
        
        bridgeAdapter.bridgeToken{value: bridgeFee}(bridgeParams);
        
        // Refund excess fee
        if (msg.value > bridgeFee) {
            payable(msg.sender).transfer(msg.value - bridgeFee);
        }
    }

    /**
     *  Calculate expected output amount using price oracle
     */
    function _calculateExpectedOutput(
        address srcToken,
        address dstToken,
        uint256 amountIn
    ) internal view returns (uint256) {
        if (srcToken == dstToken) {
            return amountIn;
        }
        
        (uint256 rate, uint8 decimals) = priceOracle.getExchangeRate(srcToken, dstToken);
        return (amountIn * rate) / (10 ** decimals);
    }

    /**
     *  Get optimal route for a swap by comparing multiple routes
     */
    function getOptimalRoute(
        uint16 dstChainId,
        address srcToken,
        address dstToken,
        uint256 amountIn
    ) external view returns (
        bytes32 routeId,
        uint256 expectedAmountOut,
        uint256 estimatedFee,
        bool isValid
    ) {
        // Get all possible routes for this swap
        bytes32[] memory possibleRoutes = _getPossibleRoutes(dstChainId, srcToken, dstToken);
        
        uint256 bestAmountOut = 0;
        uint256 lowestFee = type(uint256).max;
        bytes32 bestRouteId = bytes32(0);
        bool foundValidRoute = false;
        
        // Compare all possible routes
        for (uint i = 0; i < possibleRoutes.length; i++) {
            bytes32 currentRouteId = possibleRoutes[i];
            RouteConfig storage route = routes[currentRouteId];
            
            // Skip invalid routes
            if (!route.isActive || amountIn < route.minAmount || amountIn > route.maxAmount) {
                continue;
            }
            
            // Calculate expected output for this route
            uint256 currentAmountOut = _calculateExpectedOutput(srcToken, dstToken, amountIn);
            
            // Calculate fees for this route
            uint256 currentFee = 0;
            if (dstChainId != block.chainid) {
                (currentFee,) = bridgeAdapter.estimateBridgeFee(dstChainId, srcToken, amountIn, "");
            }
            
            // Check if this route is better (higher output or lower fees)
            if (currentAmountOut > bestAmountOut || 
                (currentAmountOut == bestAmountOut && currentFee < lowestFee)) {
                bestAmountOut = currentAmountOut;
                lowestFee = currentFee;
                bestRouteId = currentRouteId;
                foundValidRoute = true;
            }
        }
        
        if (foundValidRoute) {
            return (bestRouteId, bestAmountOut, lowestFee, true);
        } else {
            return (bytes32(0), 0, 0, false);
        }
    }
    
    /**
     *  Get all possible routes for a given swap
     */
    function _getPossibleRoutes(
        uint16 dstChainId,
        address srcToken,
        address dstToken
    ) internal view returns (bytes32[] memory) {
        // In a real implementation, this would query a route database
        // For demo purposes, we'll return common route patterns
        
        bytes32[] memory possibleRoutes = new bytes32[](4);
        
        // Route 1: Direct swap
        possibleRoutes[0] = keccak256(abi.encodePacked(block.chainid, dstChainId, srcToken, dstToken));
        
        // Route 2: Via USDT
        address usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7; // USDT address
        possibleRoutes[1] = keccak256(abi.encodePacked(block.chainid, dstChainId, srcToken, usdt, dstToken));
        
        // Route 3: Via DAI
        address dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F; // DAI address
        possibleRoutes[2] = keccak256(abi.encodePacked(block.chainid, dstChainId, srcToken, dai, dstToken));
        
        // Route 4: Via WETH
        address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH address
        possibleRoutes[3] = keccak256(abi.encodePacked(block.chainid, dstChainId, srcToken, weth, dstToken));
        
        return possibleRoutes;
    }
    
    /**
     *  Calculate expected output for a multi-hop route
     */
    function _calculateMultiHopOutput(
        address[] memory tokens,
        uint256 amountIn
    ) internal view returns (uint256) {
        uint256 currentAmount = amountIn;
        
        for (uint i = 0; i < tokens.length - 1; i++) {
            (uint256 rate, uint8 decimals) = priceOracle.getExchangeRate(tokens[i], tokens[i + 1]);
            currentAmount = (currentAmount * rate) / (10 ** decimals);
        }
        
        return currentAmount;
    }

    // Admin functions
    function updateRoute(bytes32 routeId, bool isActive) external onlyOwner {
        routes[routeId].isActive = isActive;
        emit RouteUpdated(routeId, isActive);
    }

    function setMaxSlippage(uint256 _maxSlippage) external onlyOwner {
        require(_maxSlippage <= 1000, "Slippage too high"); // Max 10%
        maxSlippage = _maxSlippage;
    }

    function setSupportedChain(uint16 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
    }

    function setContracts(
        address _fusionResolver,
        address _bridgeAdapter,
        address _priceOracle
    ) external onlyOwner {
        if (_fusionResolver != address(0)) fusionResolver = IFusionResolver(_fusionResolver);
        if (_bridgeAdapter != address(0)) bridgeAdapter = IBridgeAdapter(_bridgeAdapter);
        if (_priceOracle != address(0)) priceOracle = IPriceOracle(_priceOracle);
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }

    receive() external payable {}
}
