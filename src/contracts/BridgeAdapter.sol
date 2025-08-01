// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IBridgeAdapter.sol";

/**
 * @title BridgeAdapter
 *  LayerZero bridge adapter for cross-chain token transfers on Etherlink
 * 
 * This contract handles cross-chain token bridging operations:
 * - Bridges tokens between Etherlink and other L1/L2 chains
 * - Manages LayerZero endpoint integration for cross-chain messaging
 * - Implements fee calculation and collection for bridge operations
 * - Provides trusted remote validation for security
 * - Supports multiple destination chains with configurable fees
 * 
 * Key Features:
 * - Multi-Chain Bridging: Ethereum, Arbitrum, Optimism, Base, Etherlink
 * - LayerZero Integration: Uses LayerZero protocol for cross-chain messaging
 * - Fee Management: Configurable fees per destination chain
 * - Security: Trusted remote validation prevents unauthorized bridges
 * - Gas Optimization: Efficient cross-chain message handling
 * 
 * Supported Chains:
 * - Ethereum Mainnet (Chain ID: 1)
 * - Arbitrum One (Chain ID: 42161)
 * - Optimism (Chain ID: 10)
 * - Etherlink (Chain ID: 42793)
 * 
 * @author Etherlink Fusion+ Team
 */
contract BridgeAdapter is IBridgeAdapter, Ownable(msg.sender), ReentrancyGuard {
    using SafeERC20 for IERC20;

    // LayerZero endpoint (mock for demo)
    address public immutable lzEndpoint;
    
    // Mapping of supported chain IDs
    mapping(uint16 => bool) public supportedChains;
    
    // Mapping of trusted remote addresses
    mapping(uint16 => bytes) public trustedRemoteLookup;
    
    // Fee configuration
    uint256 public baseFee = 0.01 ether;
    mapping(uint16 => uint256) public chainFees;
    
    // Nonce for cross-chain messages
    uint64 public nonce;

    modifier onlySupportedChain(uint16 chainId) {
        require(supportedChains[chainId], "Unsupported chain");
        _;
    }

    constructor(address _lzEndpoint) {
        lzEndpoint = _lzEndpoint;
        
        // Initialize supported chains (Ethereum mainnet, Arbitrum, Optimism)
        supportedChains[1] = true;   // Ethereum
        supportedChains[42161] = true; // Arbitrum
        supportedChains[10] = true;    // Optimism
        
        // Set default fees
        chainFees[1] = 0.02 ether;
        chainFees[42161] = 0.005 ether;
        chainFees[10] = 0.005 ether;
    }

    /**
     *  Bridge tokens to destination chain
     */
    function bridgeToken(
        BridgeParams calldata params
    ) external payable override nonReentrant onlySupportedChain(params.dstChainId) {
        require(params.amount > 0, "Amount must be greater than 0");
        require(params.recipient != address(0), "Invalid recipient");
        
        // Calculate required fee
        uint256 requiredFee = chainFees[params.dstChainId];
        require(msg.value >= requiredFee, "Insufficient fee");
        
        // Transfer tokens to bridge
        IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.amount);
        
        // Increment nonce
        nonce++;
        
        // In a real implementation, this would call LayerZero endpoint
        // For demo purposes, we emit an event and simulate the bridge
        _simulateBridge(params);
        
        emit TokensBridged(
            params.dstChainId,
            params.token,
            params.amount,
            params.recipient,
            nonce
        );
        
        // Refund excess fee
        if (msg.value > requiredFee) {
            payable(msg.sender).transfer(msg.value - requiredFee);
        }
    }

    /**
     *  Simulate bridge operation (in real implementation, this would be LayerZero message handling)
     */
    function _simulateBridge(BridgeParams calldata params) internal {
        // In production, this would:
        // 1. Lock/burn tokens on source chain
        // 2. Send LayerZero message to destination
        // 3. Mint/unlock tokens on destination chain
        
        // For demo, we'll just store the bridge request
        // This simulates the cross-chain message
    }

    /**
     *  Estimate bridge fee for a given transfer
     */
    function estimateBridgeFee(
        uint16 dstChainId,
        address token,
        uint256 amount,
        bytes calldata adapterParams
    ) external view override returns (uint256 nativeFee, uint256 zroFee) {
        require(supportedChains[dstChainId], "Unsupported chain");
        
        nativeFee = chainFees[dstChainId];
        zroFee = 0; // No ZRO fee for this implementation
        
        // In real LayerZero implementation, would call:
        // return ILayerZeroEndpoint(lzEndpoint).estimateFees(dstChainId, address(this), payload, false, adapterParams);
    }

    /**
     *  Set trusted remote address for a chain
     */
    function setTrustedRemote(uint16 chainId, bytes calldata path) 
        external 
        override 
        onlyOwner 
    {
        trustedRemoteLookup[chainId] = path;
    }

    /**
     *  Check if remote address is trusted
     */
    function isTrustedRemote(uint16 chainId, bytes calldata path) 
        public 
        view 
        override 
        returns (bool) 
    {
        return keccak256(trustedRemoteLookup[chainId]) == keccak256(path);
    }

    /**
     *  Handle receiving tokens from other chains (LayerZero callback)
     */
    function lzReceive(
        uint16 srcChainId,
        bytes calldata srcAddress,
        uint64 _nonce,
        bytes calldata payload
    ) external {
        // In production, this would be called by LayerZero endpoint
        require(msg.sender == lzEndpoint, "Only endpoint");
        require(isTrustedRemote(srcChainId, srcAddress), "Untrusted source");
        
        // Decode payload and mint/unlock tokens
        (address token, uint256 amount, address recipient) = abi.decode(
            payload, 
            (address, uint256, address)
        );
        
        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, amount);
        
        emit TokensReceived(srcChainId, token, amount, recipient);
    }

    // Admin functions
    function setSupportedChain(uint16 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
    }

    function setChainFee(uint16 chainId, uint256 fee) external onlyOwner {
        chainFees[chainId] = fee;
    }

    function setBaseFee(uint256 fee) external onlyOwner {
        baseFee = fee;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
