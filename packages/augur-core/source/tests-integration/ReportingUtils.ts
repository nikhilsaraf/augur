import { ethers } from "ethers";
import { expect } from "chai";
import { TestFixture } from "./TestFixture";
import { Address, Market, UInt256 } from "../libraries/ContractInterfaces";

const ZERO_ADDRESS = (new Address()).from("0x0000000000000000000000000000000000000000");

export class ReportingUtils {
    public async proceedToDesignatedReporting(fixture: TestFixture, market: Market<ethers.utils.BigNumber>) {
        const marketEndTime = await market.getEndTime_();
        await fixture.setTimestamp(marketEndTime.add(new ethers.utils.BigNumber(1)) as UInt256<ethers.utils.BigNumber>);
    }

    public async proceedToInitialReporting(fixture: TestFixture, market: Market<ethers.utils.BigNumber>) {
        const designatedReportingEndTime = await market.getDesignatedReportingEndTime_();
        await fixture.setTimestamp(designatedReportingEndTime.add(new ethers.utils.BigNumber(1)) as UInt256<ethers.utils.BigNumber>);
    }

    // TODO: Add `contributor` param, like `proceedToNextRound` function in Python tests
    public async proceedToNextRound(fixture: TestFixture, market: Market<ethers.utils.BigNumber>, doGenerateFees: boolean = false, moveTimeForward: boolean = true, randomPayoutNumerators: boolean = false) {
        const currentTimestamp = await fixture.getTimestamp();
        const marketEndTime = await market.getEndTime_();
        if (currentTimestamp.lt(marketEndTime)) {
            const marketDesignatedReportingEndTime = await market.getDesignatedReportingEndTime_();
            await fixture.setTimestamp(marketDesignatedReportingEndTime.add(new ethers.utils.BigNumber(1)) as UInt256<ethers.utils.BigNumber>);
        }

        const disputeWindowAddress = await market.getDisputeWindow_();

        const numberOfOutcomes = await market.getNumberOfOutcomes_();
        const numTicks = await market.getNumTicks_();
        let payoutNumerators = new Array(numberOfOutcomes.toNumber()).fill(new ethers.utils.BigNumber(0));
        payoutNumerators[1] = numTicks;

        if (disputeWindowAddress === ZERO_ADDRESS) {
            await market.doInitialReport(payoutNumerators, "");
            expect(await market.getDisputeWindow_() === ZERO_ADDRESS).to.be.false;
            console.log("Submitted initial report");

            // Buy and sell complete sets to generate reporting fees
            let outcome = new ethers.utils.BigNumber(0) as UInt256<ethers.utils.BigNumber>;
            let numShares = new ethers.utils.BigNumber(10000000000000) as UInt256<ethers.utils.BigNumber>;
            // Buy complete sets
            await fixture.buyCompleteSets(market, numShares);
            let numOwnedShares = await fixture.getNumSharesInMarket(market, outcome);

            let ethBalance = await fixture.getEthBalance();
            console.log("ethBalance after buying complete set", ethBalance.toString());
            console.log("numOwnedShares after buying complete set", numOwnedShares.toString());

            // Sell Complete Sets
            ethBalance = await fixture.getEthBalance();
            console.log("ethBalance before selling complete set", ethBalance.toString());
            let numOwnedSharesBefore = await fixture.getNumSharesInMarket(market, outcome);
            console.log("numOwnedShares before selling complete set", numOwnedSharesBefore.toString());
            await fixture.sellCompleteSets(market, numShares);
            ethBalance = await fixture.getEthBalance();
            console.log("ethBalance before selling complete set", ethBalance.toString());
            numOwnedSharesBefore = await fixture.getNumSharesInMarket(market, outcome);
            console.log("numOwnedShares after selling complete set", numOwnedSharesBefore.toString());
        } else {
            const disputeWindow = await fixture.getDisputeWindow(market);
            const disputeWindowStartTime = await disputeWindow.getStartTime_();
            await fixture.setTimestamp(disputeWindowStartTime.add(new ethers.utils.BigNumber(1)) as UInt256<ethers.utils.BigNumber>);
            // This will also use the InitialReporter which is not a DisputeCrowdsourcer, but has the called function from abstract inheritance
            const winningReport = await fixture.getWinningReportingParticipant(market);
            const winningPayoutHash = await winningReport.getPayoutDistributionHash_();

            let chosenPayoutNumerators = new Array(numberOfOutcomes.toNumber()).fill(new ethers.utils.BigNumber(0));
            chosenPayoutNumerators[1] = numTicks;
            if (randomPayoutNumerators) {
                // Set chosenPayoutNumerators[1] to number >= 0 and <= numTicks
                chosenPayoutNumerators[1] = new ethers.utils.BigNumber(Math.floor(Math.random() * Math.floor(numTicks.toNumber() + 1)));
                chosenPayoutNumerators[2] = numTicks.sub(chosenPayoutNumerators[1]);
            } else {
                const firstReportWinning = await market.derivePayoutDistributionHash_(payoutNumerators) === winningPayoutHash;
                if (firstReportWinning) {
                    chosenPayoutNumerators[1] = new ethers.utils.BigNumber(0);
                    chosenPayoutNumerators[2] = numTicks;
                }
            }

            console.log("Reporting with payout numerators: ", chosenPayoutNumerators);
            const chosenPayoutHash = await market.derivePayoutDistributionHash_(chosenPayoutNumerators);
            const participantStake = await market.getParticipantStake_();
            const stakeInOutcome = await market.getStakeInOutcome_(chosenPayoutHash);
            const amount = participantStake.mul(new ethers.utils.BigNumber(2)).sub(stakeInOutcome.mul(new ethers.utils.BigNumber(3))) as UInt256<ethers.utils.BigNumber>;
            await fixture.contribute(market, chosenPayoutNumerators, amount);
            console.log("Staked", amount.toString());
            const forkingMarket = await market.getForkingMarket_();
            const marketDisputeWindow = await market.getDisputeWindow_();
            expect(forkingMarket !== ZERO_ADDRESS || marketDisputeWindow !== disputeWindowAddress).to.be.true;
        }

        if (doGenerateFees) {
            // TODO: Create and call `generateFees` function
        }

        if (moveTimeForward) {
            let disputeWindow = await fixture.getDisputeWindow(market);
            let disputeWindowStartTime = await disputeWindow.getStartTime_();
            await fixture.setTimestamp(disputeWindowStartTime.add(new ethers.utils.BigNumber(1)) as UInt256<ethers.utils.BigNumber>);
        }
    }

    public async proceedToFork(fixture: TestFixture, market: Market<ethers.utils.BigNumber>) {
        let forkingMarket = await market.getForkingMarket_();
        let disputeRound = 0;
        while (forkingMarket.equals(ZERO_ADDRESS)) {
            console.log("\nStarted round", disputeRound);
            await this.proceedToNextRound(fixture, market);
            forkingMarket = await market.getForkingMarket_();
            disputeRound++;
        }

        let ethBalance = await fixture.getEthBalance();
        console.log("ethBalance before calling forkAndRedeem", ethBalance.toString());

        const numParticipants = await market.getNumParticipants_();
        for (let i = 0; i < numParticipants.toNumber(); i++) {

            const index = new ethers.utils.BigNumber(i) as UInt256<ethers.utils.BigNumber>;
            const reportingParticipantAddress = await market.getReportingParticipant_(index);
            const reportingParticipant = await fixture.getReportingParticipant(reportingParticipantAddress);
            await reportingParticipant.forkAndRedeem();

            const reportingParticipantStake = await reportingParticipant.getStake_();
            expect(reportingParticipantStake === new ethers.utils.BigNumber(0));
        }

        ethBalance = await fixture.getEthBalance();
        console.log("ethBalance after calling forkAndRedeem", ethBalance.toString());

        console.log("\nCalled forkAndRedeem on reporting participants");
    }
}
