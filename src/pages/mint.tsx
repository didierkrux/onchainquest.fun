import { useEffect } from 'react'
import Head from 'next/head'

export default function Mint() {
  useEffect(() => {
    window.location.href =
      'zerion://browser?url=https%3A%2F%2Fzora.co%2Fcollect%2Fbase%3A0x87c3e3bbde274f5a0e27cded29df1f7526de85ec%2F1?referrer=0x767D1AF42CC93E15E72aFCF15477733C66e5460a'
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
