import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
} from "@ton/core";

import { Constants } from "../constants";
import { crc32str } from "../utils/crc32";

import { BclWallet } from "./BclWallet";

export type BclData = {
    /**
     * Current supply of the coin
     */
    totalSupply: bigint
    /**
     * BCL supply of the coin
     * This is the max amount of coins that are going to be sold on curve
     */
    bclSupply: bigint
    /**
     * Amount of tokens be minted for liquidity on STON.fi
     */
    liqSupply: bigint
    admin: Address
    /**
     * Address of the author
     */
    author: Address
    /**
     * Metadata of the coin in raw format
     */
    content: Cell
    /**
     * Address of the fees
     */
    feeAddress: Address
    tradeFeeNumerator: number
    tradeFeeDenominator: number
    ttl: number
    /**
     * Unixtime of last trade
     */
    lastTradeDate: number
    /**
     * Is trading phase active
     */
    tradingEnabled: boolean
    /**
     * Amount of TONs collected for STON.fi liquidity
     */
    tonLiqCollected: bigint
    referral: Cell
}


export type ContractEvent =
    | EventSendLiq
    | EventBuy
    | EventSell

export type EventSendLiq = {
    type: 'send_liq'
    tonLiq: bigint
    jettonLiq: bigint
}

export type EventBuy = {
    type: 'buy'
    trader: Address
    tonValue: bigint
    supplyDelta: bigint
    newSupply: bigint
    tonLiqCollected: bigint
    referral: Cell|null
}

export type EventSell = {
    type: 'sell'
    trader: Address
    tonValue: bigint
    supplyDelta: bigint
    newSupply: bigint
    tonLiqCollected: bigint
    referral: Cell|null
}

/**
 * Parses on-chain events from BCL contract
 * Events are external messages generated on sell/buy/send liq operations
 * @param cell
 */
export function parseBclEvent(cell: Cell): ContractEvent {
    let cs = cell.beginParse()
    let eventId = cs.loadUint(32)

    if (eventId === crc32str('send_liq_log')) {
        return {
            type: 'send_liq',
            tonLiq: cs.loadCoins(),
            jettonLiq: cs.loadCoins(),
        }
    } else if (eventId === crc32str('sell_log')) {
        return {
            type: 'sell',
            trader: cs.loadAddress(),
            tonValue: cs.loadCoins(),
            supplyDelta: cs.loadCoins(),
            newSupply: cs.loadCoins(),
            tonLiqCollected: cs.loadCoins(),
            referral: cs.loadMaybeRef()
        }
    } else if (eventId === crc32str('buy_log')) {
        return {
            type: 'buy',
            trader: cs.loadAddress(),
            tonValue: cs.loadCoins(),
            supplyDelta: cs.loadCoins(),
            newSupply: cs.loadCoins(),
            tonLiqCollected: cs.loadCoins(),
            referral: cs.loadMaybeRef()
        }
    }

    throw new Error('Unknown BCL event with id: ' + eventId.toString(16))
}


/**
 * Wrapper for BCL contract
 */
export class BclJetton implements Contract {
    private constructor(
        readonly address: Address,
    ) {
    }

    static createFromAddress(address: Address) {
        return new BclJetton(address);
    }

    /**
     * Returns standard Jetton data
     */
    async getData(provider: ContractProvider) {
        const res = (await provider.get("get_jetton_data", [])).stack;
        return {
            totalSupply: res.readBigNumber(),
            mintable: res.readBigNumber() !== BigInt(0),
            adminAddress: res.readAddressOpt(),
            jettonContent: res.readCell(),
            jettonWalletCode: res.readCell()
        };
    }

    /**
     * Returns user Jetton wallet address
     */
    async getWalletAddress(provider: ContractProvider, address: Address) {
        const res = await provider.get("get_wallet_address", [
            { type: "slice", cell: beginCell().storeAddress(address).endCell() }
        ]);

        return res.stack.readAddress();
    }

    /**
     * Returns current price of token
     */
    async getCoinPrice(provider: ContractProvider): Promise<bigint> {
        const res = await provider.get("coin_price", []);
        return res.stack.readBigNumber();
    }

    /**
     * Returns how many coins one can get for given amount of TONs
     *
     * fees - amount of platform fees in TONs
     * coins - amount of coins buyer would receive
     */
    async getCoinsForTons(
        provider: ContractProvider,
        tons: bigint
    ): Promise<{ fees: bigint; coins: bigint }> {
        const res = await provider.get("coins_for_tons", [
            { type: "int", value: tons }
        ]);
        return {
            fees: res.stack.readBigNumber(),
            coins: res.stack.readBigNumber()
        };
    }

    /**
     * Returns how many TONs one can get for given amount of coins
     *
     * fees - amount of platform fees in TONs
     * tons - amount of TONs user seller would receive
     */
    async getTonsForCoins(
        provider: ContractProvider,
        coins: bigint
    ): Promise<{ fees: bigint; tons: bigint }> {
        const res = await provider.get("tons_for_coins", [
            { type: "int", value: coins }
        ]);
        return {
            fees: res.stack.readBigNumber(),
            tons: res.stack.readBigNumber()
        };
    }

    /**
     * Buy operation
     *
     * opts.tons - how many TONs user wants to spend
     * opts.minReceive - min amount of coins expected to receive
     */
    async sendBuy(
        provider: ContractProvider,
        via: Sender,
        opts: { tons: bigint; minReceive: bigint, referral: Cell | null, queryId?: bigint }
    ) {
        await provider.internal(via, {
            value: opts.tons + Constants.BUY_OPERATION_NETWORK_FEE,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: beginCell()
                .storeUint(crc32str("op::buy"), 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeCoins(opts.minReceive)
                .storeMaybeRef(opts.referral)
                .endCell()
        });
    }



    /**
     * Returns BCL specific data
     */
    async getBclData(provider: ContractProvider): Promise<BclData> {
        const res = (await provider.get("get_bcl_data", [])).stack;

        return {
            totalSupply: res.readBigNumber(),
            bclSupply: res.readBigNumber(),
            liqSupply: res.readBigNumber(),
            admin: res.readAddress(),
            author: res.readAddress(),
            content: res.readCell(),
            feeAddress: res.readAddress(),
            tradeFeeNumerator: res.readNumber(),
            tradeFeeDenominator: res.readNumber(),
            ttl: res.readNumber(),
            lastTradeDate: res.readNumber(),
            tradingEnabled: res.readBoolean(),
            tonLiqCollected: res.readBigNumber(),
            referral: res.readCell()
        };
    }

    /**
     * Returns instance of BclWallet for given user address
     */
    async getUserWallet(provider: ContractProvider, userAddress: Address) {
        const walletAddress = await this.getWalletAddress(provider, userAddress);
        return provider.open(BclWallet.createFromAddress(walletAddress));
    }
}
