// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./EtherlinkFusionResolver.sol";

/**
 * @title EtherlinkFusionFactory
 *  Factory contract for deploying user-specific swap instances
 */
contract EtherlinkFusionFactory is Ownable {
    using Clones for address;

    // Implementation contract address
    address public immutable implementation;
    
    // Mapping of user addresses to their resolver instances
    mapping(address => address) public userResolvers;
    
    // Array of all deployed resolvers
    address[] public deployedResolvers;
    
    // Deployment fee
    uint256 public deploymentFee = 0.001 ether;
    
    // Core contract addresses
    address public bridgeAdapter;
    address public priceOracle;
    address public feeRecipient;

    event ResolverDeployed(
        address indexed user,
        address indexed resolver,
        uint256 index
    );
    
    event ImplementationUpdated(address indexed newImplementation);

    constructor(
        address _implementation,
        address _bridgeAdapter,
        address _priceOracle,
        address _feeRecipient
    ) {
        implementation = _implementation;
        bridgeAdapter = _bridgeAdapter;
        priceOracle = _priceOracle;
        feeRecipient = _feeRecipient;
    }

    /**
     *  Deploy a new resolver instance for a user
     */
    function deployResolver() external payable returns (address resolver) {
        require(msg.value >= deploymentFee, "Insufficient fee");
        require(userResolvers[msg.sender] == address(0), "Resolver already exists");
        
        // Clone the implementation
        resolver = implementation.clone();
        
        // Initialize the clone
        EtherlinkFusionResolver(resolver).initialize(
            bridgeAdapter,
            priceOracle,
            feeRecipient,
            msg.sender
        );
        
        // Store the resolver
        userResolvers[msg.sender] = resolver;
        deployedResolvers.push(resolver);
        
        emit ResolverDeployed(msg.sender, resolver, deployedResolvers.length - 1);
        
        // Refund excess fee
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }
        
        return resolver;
    }

    /**
     *  Deploy resolver for another user (admin only)
     */
    function deployResolverFor(address user) external onlyOwner returns (address resolver) {
        require(userResolvers[user] == address(0), "Resolver already exists");
        
        resolver = implementation.clone();
        
        EtherlinkFusionResolver(resolver).initialize(
            bridgeAdapter,
            priceOracle,
            feeRecipient,
            user
        );
        
        userResolvers[user] = resolver;
        deployedResolvers.push(resolver);
        
        emit ResolverDeployed(user, resolver, deployedResolvers.length - 1);
        
        return resolver;
    }

    /**
     *  Get resolver for a user
     */
    function getResolver(address user) external view returns (address) {
        return userResolvers[user];
    }

    /**
     *  Get total number of deployed resolvers
     */
    function getDeployedResolversCount() external view returns (uint256) {
        return deployedResolvers.length;
    }

    /**
     *  Get deployed resolvers in a range
     */
    function getDeployedResolvers(
        uint256 start,
        uint256 end
    ) external view returns (address[] memory) {
        require(start <= end && end < deployedResolvers.length, "Invalid range");
        
        address[] memory resolvers = new address[](end - start + 1);
        for (uint256 i = start; i <= end; i++) {
            resolvers[i - start] = deployedResolvers[i];
        }
        
        return resolvers;
    }

    /**
     *  Check if user has a resolver
     */
    function hasResolver(address user) external view returns (bool) {
        return userResolvers[user] != address(0);
    }

    /**
     *  Predict resolver address for a user
     */
    function predictResolverAddress(address user) external view returns (address) {
        return Clones.predictDeterministicAddress(
            implementation,
            keccak256(abi.encodePacked(user)),
            address(this)
        );
    }

    // Admin functions
    function setDeploymentFee(uint256 _fee) external onlyOwner {
        deploymentFee = _fee;
    }

    function setBridgeAdapter(address _bridgeAdapter) external onlyOwner {
        bridgeAdapter = _bridgeAdapter;
    }

    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = _priceOracle;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Emergency functions
    function pause() external onlyOwner {
        // Pause all deployed resolvers
        for (uint256 i = 0; i < deployedResolvers.length; i++) {
            try EtherlinkFusionResolver(deployedResolvers[i]).pause() {} catch {}
        }
    }

    function unpause() external onlyOwner {
        // Unpause all deployed resolvers
        for (uint256 i = 0; i < deployedResolvers.length; i++) {
            try EtherlinkFusionResolver(deployedResolvers[i]).unpause() {} catch {}
        }
    }

    receive() external payable {}
}
