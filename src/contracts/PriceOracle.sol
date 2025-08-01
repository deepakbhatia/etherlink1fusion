// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title PriceOracle
 *  Price oracle adapted for Etherlink with support for multiple price feeds
 * 
 * This contract provides real-time price data for the Etherlink Fusion+ protocol:
 * - Stores and manages token prices with timestamps
 * - Provides exchange rate calculations between any two tokens
 * - Implements price validation to prevent stale data attacks
 * - Supports batch price updates for efficiency
 * - Integrates with authorized price updaters for security
 * 
 * Key Features:
 * - Real-Time Prices: Current token prices with automatic staleness checks
 * - Exchange Rates: Calculate optimal swap rates between any token pair
 * - Security: Only authorized updaters can modify prices
 * - Validation: Prevents use of stale or invalid price data
 * - Batch Updates: Efficient bulk price updates for multiple tokens
 * 
 * @author Etherlink Fusion+ Team
 */
contract PriceOracle is IPriceOracle, Ownable(msg.sender), ReentrancyGuard {
    
    // Price data storage
    mapping(address => PriceData) private prices;
    
    // Authorized price updaters
    mapping(address => bool) public priceUpdaters;
    
    // Maximum price age (default 1 hour)
    uint256 public maxPriceAge = 3600;
    
    // Price decimals (18 for most tokens)
    uint8 public constant PRICE_DECIMALS = 18;
    
    modifier onlyPriceUpdater() {
        require(priceUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() {
        // Set owner as initial price updater
        priceUpdaters[msg.sender] = true;
        
        // Initialize common token prices (for demo)
        _initializeDefaultPrices();
    }

    /**
     *  Get current price for a token
     */
    function getPrice(address token) 
        external 
        view 
        override 
        returns (uint256 price, uint8 decimals) 
    {
        PriceData storage priceData = prices[token];
        require(priceData.timestamp > 0, "Price not available");
        require(
            block.timestamp - priceData.timestamp <= maxPriceAge, 
            "Price too old"
        );
        
        return (priceData.price, priceData.decimals);
    }

    /**
     *  Get price with timestamp
     */
    function getPriceWithTimestamp(address token) 
        external 
        view 
        override 
        returns (uint256 price, uint256 timestamp, uint8 decimals) 
    {
        PriceData storage priceData = prices[token];
        return (priceData.price, priceData.timestamp, priceData.decimals);
    }

    /**
     *  Update price for a token
     */
    function updatePrice(address token, uint256 price) 
        external 
        override 
        onlyPriceUpdater 
    {
        require(token != address(0), "Invalid token");
        require(price > 0, "Invalid price");
        
        prices[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            decimals: PRICE_DECIMALS
        });
        
        emit PriceUpdated(token, price, block.timestamp);
    }

    /**
     *  Batch update prices for multiple tokens
     */
    function updatePrices(
        address[] calldata tokens,
        uint256[] calldata tokenPrices
    ) external onlyPriceUpdater {
        require(tokens.length == tokenPrices.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            require(tokenPrices[i] > 0, "Invalid price");
            
            prices[tokens[i]] = PriceData({
                price: tokenPrices[i],
                timestamp: block.timestamp,
                decimals: PRICE_DECIMALS
            });
            
            emit PriceUpdated(tokens[i], tokenPrices[i], block.timestamp);
        }
    }

    /**
     *  Get exchange rate between two tokens
     */
    function getExchangeRate(address tokenA, address tokenB) 
        external 
        view 
        override 
        returns (uint256 rate, uint8 decimals) 
    {
        PriceData storage priceA = prices[tokenA];
        PriceData storage priceB = prices[tokenB];
        
        require(priceA.timestamp > 0 && priceB.timestamp > 0, "Price not available");
        require(
            block.timestamp - priceA.timestamp <= maxPriceAge &&
            block.timestamp - priceB.timestamp <= maxPriceAge,
            "Price too old"
        );
        
        // Calculate rate: tokenA/tokenB
        rate = (priceA.price * 10**PRICE_DECIMALS) / priceB.price;
        decimals = PRICE_DECIMALS;
    }

    /**
     *  Check if price is valid (not too old)
     */
    function isValidPrice(address token, uint256 maxAge) 
        external 
        view 
        override 
        returns (bool) 
    {
        PriceData storage priceData = prices[token];
        if (priceData.timestamp == 0) return false;
        return block.timestamp - priceData.timestamp <= maxAge;
    }

    /**
     *  Initialize default prices for common tokens (for demo)
     */
    function _initializeDefaultPrices() internal {
        // ETH price (example: $2000)
        prices[address(0)] = PriceData({
            price: 2000 * 10**PRICE_DECIMALS,
            timestamp: block.timestamp,
            decimals: PRICE_DECIMALS
        });
        
        // Add more default prices as needed for demo
    }

    // Admin functions
    function setPriceUpdater(address updater, bool authorized) external onlyOwner {
        priceUpdaters[updater] = authorized;
    }

    function setMaxPriceAge(uint256 _maxPriceAge) external onlyOwner {
        require(_maxPriceAge > 0, "Invalid max age");
        maxPriceAge = _maxPriceAge;
    }

    // Emergency function to set price with custom decimals
    function emergencySetPrice(
        address token,
        uint256 price,
        uint8 decimals
    ) external onlyOwner {
        prices[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            decimals: decimals
        });
        
        emit PriceUpdated(token, price, block.timestamp);
    }
}
