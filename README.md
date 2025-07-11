# Onchain Quest

A Web3 event management platform designed for onboarding users at Ethereum events, providing an interactive experience with wallet integration, quest completion, and social features.

## Quick Summary

Onchain Quest is a Next.js application designed for Ethereum events that helps onboard new users by allowing attendees to:

- Connect their wallets and create profiles
- Complete interactive quests and earn points
- Check in at event booths via QR codes
- View leaderboards and social features
- Claim ENS subnames and tokens
- Install as a Progressive Web App (PWA)

The platform supports multiple events with configurable quests, booth check-ins, and social integrations focused on Ethereum ecosystem education.

## Quest Integrations

- **POAP**: [Proof of Attendance Protocol](https://poap.xyz/) for event memories
- **ENS**: [Subname claiming](https://docs.ens.domains/) thanks to [Durin](https://durin.dev/)
- **EFP**: [Ethereum Follow Protocol](https://efp.app/) for social following
- **EAS**: [Ethereum Attestation Service](https://docs.attest.org/docs/welcome) for on-chain attestations
- **Farcaster**: Display Farcaster channel messages + mini-apps host
- **Social Media**: Twitter and Instagram embeds via [react-social-media-embed](https://www.npmjs.com/package/react-social-media-embed)
- **Zupass**: [Zero-knowledge proof verification](https://zupass.org/)
- **Safe**: Ethereum faucet via [Safe](https://safe.global/) or EOA
- **QR Code**: Scanning for booth check-ins and ticket validation
- **DeFi**: Token swapping and balance verification
- **NFT**: Minting NFTs on Zora
- **Slice**: [Onchain shopping](https://shop.slice.so/)
- **Tally**: [Feedback forms](https://tally.so/) for event surveys

## App Infrastructure

- **PWA**: Progressive Web App capabilities
- **Internationalization**: [i18next](https://www.i18next.com/) with multiple languages
- **Wallet Connection**: [Dynamic Labs (embed wallet)](https://www.dynamic.xyz/), [Wagmi](https://wagmi.sh/), [Reown AppKit](https://reown.com/appkit)
- **Blockchain**: [Base network](https://base.org/), Ethereum
- **UI**: [Chakra UI](https://chakra-ui.com/) with custom theme
- **Database**: PostgreSQL with Knex.js migrations
