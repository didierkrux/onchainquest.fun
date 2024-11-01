import { useEffect } from 'react'
import Head from 'next/head'

export default function Mint() {
  useEffect(() => {
    window.location.href =
      'zerion://browser?url=https%3A%2F%2Fzora.co%2Fcollect%2Fzora%3A0x86c14105d858ac0409b5a8ab88f8899480d9cd88%2F1'
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
