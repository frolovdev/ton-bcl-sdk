[**ton-bcl-sdk**](../../../README.md) • **Docs**

***

[ton-bcl-sdk](../../../README.md) / [wrappers/BclMaster](../README.md) / BclMaster

# Class: BclMaster

Wrapper for Master BCL contract

## Implements

- `Contract`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `address` | `readonly` | `Address` | [wrappers/BclMaster.ts:29](https://github.com/ton-fun-tech/ton-bcl-sdk/blob/4dc8576c8b5afcf36dbccde36654b6e5b45787e5/src/wrappers/BclMaster.ts#L29) |

## Methods

### sendDeployCoin()

> **sendDeployCoin**(`provider`, `via`, `input`): `Promise`\<`void`\>

Deploys coin

#### Parameters

• **provider**: `ContractProvider`

• **via**: `Sender`

• **input**: [`DeployCoinInput`](../type-aliases/DeployCoinInput.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[wrappers/BclMaster.ts:40](https://github.com/ton-fun-tech/ton-bcl-sdk/blob/4dc8576c8b5afcf36dbccde36654b6e5b45787e5/src/wrappers/BclMaster.ts#L40)

***

### createFromAddress()

> `static` **createFromAddress**(`address`): [`BclMaster`](BclMaster.md)

#### Parameters

• **address**: `Address`

#### Returns

[`BclMaster`](BclMaster.md)

#### Defined in

[wrappers/BclMaster.ts:33](https://github.com/ton-fun-tech/ton-bcl-sdk/blob/4dc8576c8b5afcf36dbccde36654b6e5b45787e5/src/wrappers/BclMaster.ts#L33)
