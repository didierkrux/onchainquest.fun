import dynamic from 'next/dynamic'

const NonSSRWrapper = (props: { children: React.ReactNode }) => <>{props.children}</>
export default dynamic(() => Promise.resolve(NonSSRWrapper), {
  ssr: false,
})
