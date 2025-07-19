declare module '@farcaster/frame-sdk' {
  export interface FrameContext {
    // Add Frame context properties as needed
    [key: string]: any
  }

  export interface FrameSDK {
    context: Promise<FrameContext | null>
    actions: {
      ready: (options?: any) => Promise<void>
      signIn: (options: { nonce: string }) => Promise<{
        message: string
        signature: string
      }>
      close: () => void
      openUrl: (url: string) => void
    }
    wallet: {
      getEthereumProvider: () => Promise<any>
    }
  }

  const frameSdk: FrameSDK
  export default frameSdk
} 
