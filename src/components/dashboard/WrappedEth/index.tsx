import { Box, Button, Typography } from '@mui/material'
import { Card, WidgetBody, WidgetContainer } from '../styled'
import useSafeTransactionFlow from './useSafeTransactionFlow'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useCurrentChain } from '@/hooks/useChains'
import { useCallback, useMemo, useState } from 'react'
import TokenAmount from '@/components/common/TokenAmount'
import NumberField from '@/components/common/NumberField'
import { ethers } from 'ethers'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

const WETH_ABI = [
  {
    constant: false,
    inputs: [],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: 'wad', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// Only supporting mainnet and xDai for now
const WETH_TOKEN_ADDRESSES: Record<string, string> = {
  '1': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '100': '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
}

/**
 * ASSUMPTIONS
 *
 * In a real implementation, we would need to validate that the user is entering a number in the field,
 * that this number is lower than the balance, and that it is not negative, etc.
 *
 * Here we assume that the user has entered a correct number and submit the transaction without any validation.
 *
 * @constructor
 */
const WrappedEth = () => {
  const onTxSubmit = useSafeTransactionFlow()
  const { balances } = useVisibleBalances()
  const chain = useCurrentChain()

  // get the WETH token address for the current chain
  const wethTokenAddress = useMemo(() => (chain ? WETH_TOKEN_ADDRESSES[chain?.chainId] : null), [chain])

  // get the native token and the wrapped token from the balances
  const nativeToken = useMemo(
    () => balances.items.filter((token) => token.tokenInfo.type === TokenType.NATIVE_TOKEN)[0],
    [balances],
  )
  const wrappedToken = useMemo(
    () => balances.items.filter((token) => token.tokenInfo.address === wethTokenAddress)[0],
    [balances, wethTokenAddress],
  )

  const [wrapAmount, setWrapAmount] = useState<string>('')
  const [unwrapAmount, setUnwrapAmount] = useState<string>('')

  const submit = useCallback(
    async (type: 'wrap' | 'unwrap', value: string) => {
      if (wethTokenAddress) {
        const wethContract = new ethers.Contract(wethTokenAddress, WETH_ABI)
        const etherValueInWei = ethers.utils.parseEther(value)

        if (type === 'wrap') {
          const unsignedTx = await wethContract.populateTransaction.deposit({ value: etherValueInWei })

          if (!unsignedTx) {
            console.log('failed to wrap')
            // TODO: handle error
          }

          onTxSubmit({
            to: wethTokenAddress,
            value: etherValueInWei.toString(),
            data: unsignedTx.data || '0x',
          })
        }

        if (type === 'unwrap') {
          const unsignedTx = await wethContract.populateTransaction.withdraw(etherValueInWei)

          if (!unsignedTx) {
            console.log('failed to unwrap')
            // TODO: handle error
          }

          onTxSubmit({
            to: wethTokenAddress,
            value: '0',
            data: unsignedTx.data || '0x',
          })
        }
      }
    },
    [onTxSubmit, wethTokenAddress],
  )

  // Don't render if the native token is not available or if the WETH token is not supported yet on the current chain
  if (nativeToken === undefined || wethTokenAddress == null) {
    return null
  }

  return (
    <WidgetContainer>
      <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
        Wrapped {nativeToken.tokenInfo.symbol}
      </Typography>

      <WidgetBody>
        <Card>
          <Typography component="h3" variant="subtitle1" fontWeight={700} mb={1}>
            Your {nativeToken.tokenInfo.symbol} balance is{' '}
            {nativeToken ? <TokenAmount value={nativeToken.balance} decimals={nativeToken.tokenInfo.decimals} /> : '0'}
          </Typography>

          {/* Wrap ETH */}
          <Box display="flex" mb={3} gap={2}>
            <NumberField
              label="Amount"
              inputProps={{
                'data-testid': 'amount-to-wrap',
              }}
              onChange={(event) => setWrapAmount(event.target.value)}
            />

            <Button
              variant="contained"
              data-testid="wrap-button"
              onClick={() => {
                submit('wrap', wrapAmount)
              }}
            >
              Wrap
            </Button>
          </Box>

          <Typography component="h3" variant="subtitle1" fontWeight={700} mb={1}>
            Your W{nativeToken.tokenInfo.symbol} balance is{' '}
            {wrappedToken ? (
              <TokenAmount value={wrappedToken.balance} decimals={wrappedToken.tokenInfo.decimals} />
            ) : (
              '0'
            )}
          </Typography>

          {/* Unwrap ETH */}
          <Box display="flex" gap={2}>
            <NumberField
              label="Amount"
              inputProps={{
                'data-testid': 'amount-to-unwrap',
              }}
              onChange={(event) => setUnwrapAmount(event.target.value)}
            />

            <Button
              variant="contained"
              data-testid={'unwrap-button'}
              onClick={() => {
                submit('unwrap', unwrapAmount)
              }}
            >
              Unwrap
            </Button>
          </Box>
        </Card>
      </WidgetBody>
    </WidgetContainer>
  )
}

export default WrappedEth
