import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from 'chai';
import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("MerkleTreeAirdrop", function() {
  async function deployFixture() {
    const ERCMock20 = await ethers.getContractFactory("ERC20Mock")
    const token = await ERCMock20.deploy()

    const APE_NFT_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"; 
    const NFT_HOLDER = "0xaAa2DA255DF9Ee74C7075bCB6D81f97940908A5D";
    await helpers.impersonateAccount(NFT_HOLDER);

    // Add this line to fund the impersonated account
    await helpers.setBalance(NFT_HOLDER, ethers.parseEther("10000"));

    const impersonatedSigner = await ethers.getSigner(NFT_HOLDER);
    const NFT_Contract = await ethers.getContractAt("IERC721", APE_NFT_ADDRESS, impersonatedSigner);
    

    // const [owner, addr1, addr2] = await ethers.getSigners();
    const addr1 = impersonatedSigner;
    const addr2 = await ethers.getSigner("0xe2A83b15FC300D8457eB9E176f98d92a8FF40a49");
    const NoNFTAddress =  await ethers.getSigner("0xc9cd96ce406eeb5b7ccecf19415eb640953ff6a0");

    const wl1 = [
        [NFT_HOLDER,ethers.parseEther("100")],
        ["0xe2A83b15FC300D8457eB9E176f98d92a8FF40a49", ethers.parseEther("50")]
    ]

    const merkletree = StandardMerkleTree.of(wl1, ["address", "uint256"])
    const root = merkletree.root;

    const MerkleDrop = await ethers.getContractFactory("MerkleAirdrop")
    const airdropContract = await MerkleDrop.deploy(await token.getAddress(), root)

    await token.transfer(await airdropContract.getAddress(), ethers.parseEther("2000"))

    return {root, airdropContract, merkletree, NFT_Contract, addr1, addr2, NoNFTAddress}

  }

  describe('merkle tree deployment', function () {
    it("should allow a user to claim their airdrop using a valid proof", async function() {
      const {root, addr1, merkletree, airdropContract } = await loadFixture(deployFixture)

      const proof = merkletree.getProof(0)

      await expect(airdropContract.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.emit(airdropContract, "SuccessfulClaim")
      .withArgs(addr1.address, ethers.parseEther("100"))
    })

    it("should reject invalid claims", async function() {
      const {root, addr1, addr2, NoNFTAddress, merkletree, airdropContract } = await loadFixture(deployFixture)

      const leaf = [addr2.address, ethers.parseEther("50")]

      const proof = merkletree.getProof(leaf)

      // test with wrong amount
      await expect(airdropContract.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
      .to.be.revertedWith("Invalid proof.")

    })

    // it('airdrop has already being claimed', async function () {
    //   const {root, addr1, merkletree, airdropContract } = await loadFixture(deployFixture)

    //   const leaf = [addr1.address, ethers.parseEther("100")]

    //   const proof = merkletree.getProof(leaf)

    //   await airdropContract.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof)

    //   await expect(airdropContract.connect(addr1).claimAirdrop(ethers.parseEther("100"), proof))
    //   .to.be.revertedWith("Airdrop already claimed.")
    // })

  }) 

})