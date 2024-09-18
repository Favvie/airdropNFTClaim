import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("MerkleAirdrop", function () {
  async function deployMerkleAirdropFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockToken.deploy("MockToken", "MTK");

    // Create merkle tree
    const leaves = [
      [addr1.address, ethers.parseEther("100")],
      [addr2.address, ethers.parseEther("100")]
    ];
    const merkleTree = StandardMerkleTree.of(leaves, ["address", "uint256"]);
    const root = merkleTree.root;

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.deploy(await mockToken.getAddress(), root);

    // Transfer tokens to MerkleAirdrop contract
    await mockToken.transfer(await merkleAirdrop.getAddress(), ethers.parseEther("200"));

    return { merkleAirdrop, mockToken, owner, addr1, addr2, merkleTree };
  }

  it("Should allow eligible user with APE NFT to claim tokens", async function () {
    const { merkleAirdrop, mockToken, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);

    const proof = merkleTree.getProof([addr1.address, ethers.parseEther("100")]);

    await expect(merkleAirdrop.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.emit(merkleAirdrop, "SuccessfulClaim")
      .withArgs(addr1.address, ethers.parseEther("100"));

    expect(await mockToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should not allow claim without APE NFT", async function () {
    const { merkleAirdrop, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);

    const proof = merkleTree.getProof([addr1.address, ethers.parseEther("100")]);

    await expect(merkleAirdrop.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.be.revertedWith("Must own at least one APE NFT to claim.");
  });

  it("Should not allow double claiming", async function () {
    const { merkleAirdrop, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);

    const proof = merkleTree.getProof([addr1.address, ethers.parseEther("100")]);

    await merkleAirdrop.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof);

    await expect(merkleAirdrop.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.be.revertedWith("Airdrop already claimed.");
  });

  it("Should not allow claim with invalid proof", async function () {
    const { merkleAirdrop, addr1, addr2, merkleTree } = await loadFixture(deployMerkleAirdropFixture);

    const proof = merkleTree.getProof([addr2.address, ethers.parseEther("100")]);

    await expect(merkleAirdrop.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.be.revertedWith("Invalid proof.");
  });
});