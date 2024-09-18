import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const APE_NFT_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"; 

    const NFT_HOLDER = "0xaAa2DA255DF9Ee74C7075bCB6D81f97940908A5D";
    
    await helpers.impersonateAccount(NFT_HOLDER);

    const impersonatedSigner = await ethers.getSigner(NFT_HOLDER);

    const NFT_Contract = await ethers.getContractAt("IERC721", APE_NFT_ADDRESS, impersonatedSigner);

    const balance = await NFT_Contract.balanceOf(NFT_HOLDER);

    console.log("NFT balance", balance);

    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC_DAI_PAIR = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

    const ETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
    
    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);

    const amountUSDCDeposit = ethers.parseUnits("2", 6);

    const amountAMin = ethers.parseUnits("1", 6);


    const LP_ETH_Contract = await ethers.getContractAt("IERC20", ETH_USDC_PAIR, impersonatedSigner);
    
    
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    await USDC_Contract.approve(ROUTER, amountUSDCDeposit);
    

    const usdcBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const ETHBal = await ethers.provider.getBalance(impersonatedSigner.address)
    const ETHUSDCBal = await LP_ETH_Contract.balanceOf(impersonatedSigner.address)


    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

    console.log("usdc balance before liquidity", Number(usdcBal));
    console.log("ETH token balance before liquidity", Number(ETHBal));
    console.log("LP ETH token balance before liquidity", Number(ETHUSDCBal));    
    

    await ROUTER.addLiquidityETH(
        USDC, 
        amountUSDCDeposit, 
        amountAMin, 
        1, 
        TOKEN_HOLDER, 
        deadline,
        {value: ethers.parseEther("0.1")}
        )


    console.log("=========================================================");

    const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const ETHBalAfter = await ethers.provider.getBalance(impersonatedSigner.address)
    const ETHUSDCBalAfter = await LP_ETH_Contract.balanceOf(impersonatedSigner.address);

    console.log("usdc balance after liquidity", Number(usdcBalAfter));
    console.log("ETH token balance after liquidity", Number(ETHBalAfter));
    console.log("LP ETH token balance after liquidity", Number(ETHUSDCBalAfter));



    console.log("=========================================================");
    // const removeLiqTX = await ROUTER.removeLiquidity(USDC, DAI, LPBalAfter, 0, 0, impersonatedSigner.address, deadline )
    // await removeLiqTX.wait();
    

    // const usdcBalAfterRemove = await USDC_Contract.balanceOf(impersonatedSigner.address);
    // const daiBalAfterRemove = await DAI_Contract.balanceOf(impersonatedSigner.address);
    // const LPBalAfterRemove = await LP_Contract.balanceOf(impersonatedSigner.address);

    // console.log("usdc balance after removing liquidity", Number(usdcBalAfterRemove));
    // console.log("dai balance after removing liquidity", Number(daiBalAfterRemove));
    // console.log("LP token balance after removing liquidity", Number(LPBalAfterRemove));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
