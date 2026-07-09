// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KeryxRegistry
 * @notice Onchain registry of paid tools for AI agents on Arc.
 *
 * The registry is the source of truth for who owns which tool id and what
 * it costs. The x402 flow on keryxhq.xyz uses these records to build the
 * PaymentRequirements it hands back on a 402, and settles USDC directly
 * to the publisher wallet stored here.
 *
 * Design decisions worth flagging up front:
 *   - Tool ids are keccak256(bytes(stringId)). The full string lives on
 *     the offchain metadata layer; onchain we only need a stable key.
 *   - Publishers own their listing. The wallet that first publishes an id
 *     is the only wallet allowed to update its price or transfer ownership.
 *   - Prices are stored in USDC atomic units (6 decimals). $0.005 is `5000`.
 *   - No custody. The registry never holds funds. Payment happens in the
 *     x402 layer against the USDC contract directly.
 *   - Owner is Keryx, and can only pause / unpause and mark a tool as
 *     verified. Owner cannot rewrite a publisher's listing.
 */
contract KeryxRegistry {
    struct Tool {
        address publisher;
        uint256 priceAtomicUsdc; // 6-decimal USDC atomic units, per call
        uint40 createdAt;
        uint40 updatedAt;
        bool active;
        bool verified;
        string metadataUri;
    }

    address public owner;
    bool public paused;
    uint256 public toolCount;

    /// @dev keccak256(bytes(toolIdString)) => Tool
    mapping(bytes32 => Tool) public tools;

    event ToolPublished(
        bytes32 indexed idHash,
        string id,
        address indexed publisher,
        uint256 priceAtomicUsdc,
        string metadataUri
    );
    event PriceUpdated(bytes32 indexed idHash, uint256 oldPrice, uint256 newPrice);
    event MetadataUpdated(bytes32 indexed idHash, string metadataUri);
    event ActiveSet(bytes32 indexed idHash, bool active);
    event OwnershipTransferred(bytes32 indexed idHash, address indexed from, address indexed to);
    event VerifiedSet(bytes32 indexed idHash, bool verified);
    event Paused(bool paused);
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotPublisher();
    error ToolExists();
    error ToolNotFound();
    error EmptyId();
    error ZeroPrice();
    error ZeroAddress();
    error RegistryPaused();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert RegistryPaused();
        _;
    }

    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
        emit OwnerTransferred(address(0), _owner);
    }

    // ---------------------------------------------------------------------
    // Publisher-facing writes
    // ---------------------------------------------------------------------

    /**
     * @notice Publish a new tool. Publisher pays gas exactly once.
     * @param id Human-readable tool id (e.g. "solana.token-activity"). Must
     *           match the offchain registry entry. Empty ids revert.
     * @param priceAtomicUsdc Per-call price in USDC atomic units (6 decimals).
     *                       Must be non-zero.
     * @param metadataUri IPFS/HTTPS URL of the tool's metadata json (schema,
     *                    summary, category, latency estimate). Free-form.
     */
    function publish(
        string calldata id,
        uint256 priceAtomicUsdc,
        string calldata metadataUri
    ) external whenNotPaused returns (bytes32 idHash) {
        if (bytes(id).length == 0) revert EmptyId();
        if (priceAtomicUsdc == 0) revert ZeroPrice();
        idHash = keccak256(bytes(id));
        if (tools[idHash].publisher != address(0)) revert ToolExists();

        tools[idHash] = Tool({
            publisher: msg.sender,
            priceAtomicUsdc: priceAtomicUsdc,
            createdAt: uint40(block.timestamp),
            updatedAt: uint40(block.timestamp),
            active: true,
            verified: false,
            metadataUri: metadataUri
        });
        unchecked {
            toolCount += 1;
        }
        emit ToolPublished(idHash, id, msg.sender, priceAtomicUsdc, metadataUri);
    }

    function updatePrice(bytes32 idHash, uint256 newPrice) external whenNotPaused {
        Tool storage t = tools[idHash];
        if (t.publisher == address(0)) revert ToolNotFound();
        if (t.publisher != msg.sender) revert NotPublisher();
        if (newPrice == 0) revert ZeroPrice();
        uint256 oldPrice = t.priceAtomicUsdc;
        t.priceAtomicUsdc = newPrice;
        t.updatedAt = uint40(block.timestamp);
        emit PriceUpdated(idHash, oldPrice, newPrice);
    }

    function updateMetadata(bytes32 idHash, string calldata metadataUri) external whenNotPaused {
        Tool storage t = tools[idHash];
        if (t.publisher == address(0)) revert ToolNotFound();
        if (t.publisher != msg.sender) revert NotPublisher();
        t.metadataUri = metadataUri;
        t.updatedAt = uint40(block.timestamp);
        emit MetadataUpdated(idHash, metadataUri);
    }

    function setActive(bytes32 idHash, bool active) external whenNotPaused {
        Tool storage t = tools[idHash];
        if (t.publisher == address(0)) revert ToolNotFound();
        if (t.publisher != msg.sender) revert NotPublisher();
        t.active = active;
        t.updatedAt = uint40(block.timestamp);
        emit ActiveSet(idHash, active);
    }

    function transferListing(bytes32 idHash, address to) external whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        Tool storage t = tools[idHash];
        if (t.publisher == address(0)) revert ToolNotFound();
        if (t.publisher != msg.sender) revert NotPublisher();
        address prev = t.publisher;
        t.publisher = to;
        t.updatedAt = uint40(block.timestamp);
        emit OwnershipTransferred(idHash, prev, to);
    }

    // ---------------------------------------------------------------------
    // Owner-only controls
    // ---------------------------------------------------------------------

    function setVerified(bytes32 idHash, bool verified) external onlyOwner {
        Tool storage t = tools[idHash];
        if (t.publisher == address(0)) revert ToolNotFound();
        t.verified = verified;
        emit VerifiedSet(idHash, verified);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function transferOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address prev = owner;
        owner = newOwner;
        emit OwnerTransferred(prev, newOwner);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function toolIdHash(string calldata id) external pure returns (bytes32) {
        return keccak256(bytes(id));
    }

    function getTool(bytes32 idHash) external view returns (Tool memory) {
        return tools[idHash];
    }

    function exists(bytes32 idHash) external view returns (bool) {
        return tools[idHash].publisher != address(0);
    }
}
