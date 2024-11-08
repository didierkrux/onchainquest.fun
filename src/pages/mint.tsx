import { useEffect } from 'react'
import Head from 'next/head'

export default function Mint() {
  useEffect(() => {
    window.location.href =
      'https://newtoweb3.io/deeplink?url=https://zora.co/collect/base:0x87c3e3bbde274f5a0e27cded29df1f7526de85ec/1?referrer=0x767D1AF42CC93E15E72aFCF15477733C66e5460a'
  }, [])

  return (
    <>
      <Head>
        <title>Redirecting to Zerion...</title>
      </Head>
      <div>
        <p>Redirecting to Zerion app...</p>
      </div>
    </>
  )
}
