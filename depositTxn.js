const { ethers, BigNumber } = require("ethers")
const { getPOSClient, from, ropstenProvider, pos } = require("./init/posClient.js")
const { depositETH, approveERC20, depositERC20, knowPayBacks, sendETH } = require("./helper.js")

/**
 * @title Main function
 * @dev If ETH balance > minBalanceETH, repay ETH to senders (except 0xspecific)
 * @dev If ETH balance > minBalanceETH, bridge ETH to Polygon
 * @dev If ETH balance > minBalanceETH, bridge ERC20s to Polygon
 * @param specificAddress Address allowed to send funds to 0xmain(our wallet)
 */
const execute = async (specificAddress) => {

    const client = await getPOSClient();
    const tokens = pos.parent.test
    const minBalanceETH = 3000000 * 500000000 // minimum eth balance of wallet


    // Repaying payBacks (ETH sent from other addresses except 0xspecific)
    let ethBalanceNow = await ropstenProvider.getBalance(from)
    ethBalanceNow = BigNumber.from(ethBalanceNow).toString()

    if (ethBalanceNow > minBalanceETH) {
        let latestPayBack = await knowPayBacks(from, specificAddress) // 0xmain, 0xspecific
        if (latestPayBack.length > 0) {
            let i = 0;
            while (i < latestPayBack.length) {
                console.log("hii")
                const transaction = await sendETH(latestPayBack[i]["sender"], latestPayBack[i]["amount"])
                console.log(transaction)
                i++
            }
        }
    } else {
        console.log("Wallet balance <", minBalanceETH / 1e18, "ETH, hence cannot check for pay-backs")
    }


    // Bridging ETH
    let ethBalanceNow1 = await ropstenProvider.getBalance(from)
    ethBalanceNow1 = BigNumber.from(ethBalanceNow1).toString()

    if (ethBalanceNow1 > minBalanceETH) {
        console.log("possible")
        const amount = ethBalanceNow1 - minBalanceETH;
        console.log(amount)
        await depositETH(client, amount, from); // bridge
    } else {
        console.log("Wallet balance <", minBalanceETH / 1e18, "ETH, hence cannot check for ETH")
    }


    // Bridging ERC20
    let ethBalanceNow2 = await ropstenProvider.getBalance(from)
    ethBalanceNow2 = BigNumber.from(ethBalanceNow2).toString()

    if (ethBalanceNow2 > minBalanceETH) {
        for (let i; i < tokens.length; i++) {

            const erc20Token = client.erc20(tokens[i], true);
            // get balance of user
            let balance = await erc20Token.getBalance(from);
            balance = BigNumber.from(ethBalanceNow).toString()

            if (balance > 0) {
                await approveERC20(erc20Token, balance) // lock asset
                await depositERC20(erc20Token, balance, from) // bridge
            }
        }
    } else {
        console.log("Wallet balance <", minBalanceETH / 1e18, "ETH, hence cannot check for ERC20s")
    }
};


// Main function call
execute("0xdd160613122C9b3ceb2a2709123e3020CaDa2546").then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
})