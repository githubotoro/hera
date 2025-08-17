# HERA

## Description

HERA is a desktop overlay that lets you bet real money on fighting arcade games while playing with friends. It works with Fightcade's collection of fighting games, allowing players to bet USDC cryptocurrency on match outcomes.

### What it does:

You and a friend can play classic fighting games like Street Fighter II or King of Fighters, but now there's real money on the line.

### Key Features:

- Bet USDC cryptocurrency on match outcomes
- Peer-to-peer betting between friends (no house takes a cut)
- Automatic payout when matches end
- Works with any rated fighting game on Fightcade

### How it works

Players create a HERA session and connect with their opponent. Both players place their USDC bets, then launch their chosen fighting game through Fightcade. HERA monitors the game in the background. When a match ends, it automatically detects the winner and sends the money to their wallet. Even if someone disconnects mid-game, the remaining player still gets the winnings.

## How it's made

HERA is built with React, Vite, Electron, and NestJS. Here's how everything works together:

### Frontend (Electron + React + Vite):

- Electron creates the desktop app
- React handles the user interface
- Vite builds the app for development and production

### Backend (NestJS):

- NestJS provides the server with TypeScript support
- Handles user sessions, authentication, and bet processing
- Manages real-time communication between players
- Coinbase Embedded Wallets handle all USDC transactions
- Players don't need to manage private keys
- Automatic bet placement and payout distribution

### How data flows:

1. Players create a session in the Electron app
2. Both players bet USDC through Coinbase
3. They launch their fighting game through Fightcade
4. HERA monitors the game via Fightcade APIs and internal tracking
5. When a match ends, it detects the winner
6. Money goes to the winner's wallet
7. Session continues for more matches or ends

The combination of these technologies lets players focus on their fighting game while HERA handles all the betting behind the scenes.
