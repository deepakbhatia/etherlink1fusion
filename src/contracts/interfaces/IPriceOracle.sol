// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPriceOracle
 *  Interface for price oracle adapted for Etherlink
 */
interface IPriceOracle {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
    }

    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp
    );

    function getPrice(address token) external view returns (uint256 price, uint8 decimals);
    
    function getPriceWithTimestamp(address token) 
        external 
        view 
        returns (uint256 price, uint256 timestamp, uint8 decimals);
    
    function updatePrice(address token, uint256 price) external;
    
    function getExchangeRate(address tokenA, address tokenB) 
        external 
        view 
        returns (uint256 rate, uint8 decimals);
    
    function isValidPrice(address token, uint256 maxAge) external view returns (bool);
}
