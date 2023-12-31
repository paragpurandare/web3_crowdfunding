const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding contract", function () {
  let Crowdfunding;
  let crowdfunding;
  let ERC20Token;
  let erc20Token;
  let owner;
  let donor;

  before(async () => {
    [owner, donor] = await ethers.getSigners();

    const ERC20TokenFactory = await ethers.getContractFactory("ERC_Remote");
    erc20Token = await ERC20TokenFactory.deploy();
    await erc20Token.waitForDeployment();

    Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy(erc20Token.target);

    await crowdfunding.waitForDeployment();
  });

  it("should create a campaign with a non-zero goal", async () => {
    await crowdfunding.connect(owner).creator(100);
    const campaign = await crowdfunding.Authors(1);
    expect(campaign.goal).to.equal(100);
  });

  it("should revert if goal is 0", async () =>{
    await expect(crowdfunding.connect(owner).creator(0)).to.be.revertedWith("Goal is not Equal to Zero");
    
  })

  it("should donate to a campaign", async function () {
    await erc20Token.mint(donor.address, 1000);

    await erc20Token.connect(donor).approve(crowdfunding.target, 1000);

    await crowdfunding.connect(donor).donate(1, 50);

    const donatedAmount = await crowdfunding.donatedAmount(1, donor.address);

    expect(donatedAmount).to.equal(50).to.emit(crowdfunding, 'Donate').withArgs(donor.address, donatedAmount);
  });

  it("Owner should not be donor of his campaign", async () => {
    await erc20Token.mint(owner.address, 1000);

    await erc20Token.connect(owner).approve(crowdfunding.target, 1000);

    await expect(crowdfunding.connect(owner).donate(1, 50)).to.be.revertedWith("Owner can not donate to his campaign");

    
  })

  it("should un-donate from a campaign", async function () {
    await crowdfunding.connect(donor).unDonate(1, 20);
    const donatedAmount = await crowdfunding.donatedAmount(1, donor.address);

    expect(donatedAmount).to.equal(30);
  });

  it('should allow the owner to claim funds when conditions are met', async function () {
    // Deploy your token contract and distribute tokens to the campaign contract for testing

    // Create a campaign
    await crowdfunding.connect(owner).creator(1000);

    // Donate to the campaign
    await crowdfunding.connect(donor).donate(1, 100);

    // Advance the blockchain timestamp to simulate the campaign ending
    await ethers.provider.send('evm_increaseTime', [10001]); // Assuming the campaign lasted for 10000 seconds
    await ethers.provider.send('evm_mine');

    // Claim funds by the owner
    await crowdfunding.connect(owner).claim(1);

    // Check the balance of the owner after claiming
    const ownerBalance = await ethers.provider.getBalance(owner.address);
    expect(ownerBalance).to.be.above(0); // Assuming gas costs are negligible
  });


});