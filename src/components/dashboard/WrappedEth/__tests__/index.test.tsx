import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import WrappedEth from '@/components/dashboard/WrappedEth'
import useSafeTransactionFlow from '@/components/dashboard/WrappedEth/useSafeTransactionFlow'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

// Mocking necessary hooks and methods
jest.mock('@/components/dashboard/WrappedEth/useSafeTransactionFlow', () => jest.fn())

jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: jest.fn().mockReturnValue({
    balances: {
      items: [
        {
          tokenInfo: {
            symbol: 'ETH',
            decimals: 18,
            address: '0x0',
          },
          balance: '1000000000000000000', // 1 ETH in wei
        },
      ],
    },
    loading: false,
  }),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn().mockReturnValue({
    chainId: '1',
  }),
}))

// Example tests
// TODO: add more tests (unwrapping, error handling, etc)
describe('WrappedEth component', () => {
  beforeEach(() => {
    ;(useVisibleBalances as jest.Mock).mockReturnValue({
      balances: {
        items: [
          {
            tokenInfo: {
              symbol: 'ETH',
              decimals: 18,
              address: '0x0',
              type: TokenType.NATIVE_TOKEN,
            },
            balance: '1000000000000000000', // 1 ETH in wei
          },
        ],
      },
      loading: false,
    })
  })

  it('should render without crashing if no balances are available', () => {
    ;(useVisibleBalances as jest.Mock).mockReturnValue({
      balances: { items: [] },
      loading: false,
    })
    render(<WrappedEth />)
  })

  it('should render without crashing', () => {
    const { getByTestId, getByText } = render(<WrappedEth />)

    expect(getByTestId('wrap-button')).toBeInTheDocument()
    expect(screen.getByText('Your ETH balance is')).toBeInTheDocument()
    expect(screen.getByText('1', { selector: '.container' })).toBeInTheDocument()
  })

  it('should call wrap function with correct parameters', async () => {
    const mockSubmit = jest.fn()
    ;(useSafeTransactionFlow as jest.Mock).mockReturnValue(mockSubmit)

    const { getByTestId, getByText } = render(<WrappedEth />)

    fireEvent.change(getByTestId('amount-to-wrap'), { target: { value: '1.0' } })
    fireEvent.click(getByTestId('wrap-button'))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        to: expect.any(String),
        value: expect.any(String),
        data: expect.any(String),
      })
    })
  })

  it('should call unwrap function with correct parameters', async () => {
    const mockSubmit = jest.fn()
    ;(useSafeTransactionFlow as jest.Mock).mockReturnValue(mockSubmit)

    const { getByTestId, getByText } = render(<WrappedEth />)

    fireEvent.change(getByTestId('amount-to-unwrap'), { target: { value: '1.0' } })
    fireEvent.click(getByTestId('unwrap-button'))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        to: expect.any(String),
        value: expect.any(String),
        data: expect.any(String),
      })
    })
  })
})
