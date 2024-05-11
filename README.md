[LS-server]: https://github.com/LiveSplit/LiveSplit.Server/releases

# LiveSplit.StreamDeck

Using `LiveSplit.Server` to control LiveSplit via your Stream Deck.

## Implemented buttons
- [x] Reset timer
- [x] Skip Split
- [x] Split/Start timer
- [x] Undo Split
- [x] Pause Timer
- [x] Resume Timer
- [ ] Cycle between comparisons (not implemented in LS atm)
- [ ] Switch to specific comparison (This is dangerous, need to allow for free input)
- [x] RTA display
- [X] IGT display
- And more....

# Troubleshooting
Before opening a support ticket please make sure that you have double-checked the following things:
- You are using LiveSplit version 1.8.29
  - [Versions prior to 1.8.29 will manually need to install the component][LS-server]
- The LiveSplit server component is added to your layout
- You have started the server (you need to do this every time you launch livesplit)
  - Start the server by right-clicking on LiveSplit -> Control -> Start Server
 
The split button does currently not reset the timer (limitation of LiveSplit), you will need to press the reset button.

# Why
I always find myself accidentally hitting hotkeys when typing stuff out because I want to keep the key combos simple.
Because of my unwillingness to assign more than 1 key to a hotkey (if I manually have to trigger it) I'm not a fan of them.
That is why I decided to build this plugin, just so I don't have to sacrifice hotkeys for livesplit.

# Thanks
I want to give a big thanks to @satanch, I took a lot of inspiration from their [livesplit client](https://github.com/satanch/node-livesplit-client) when creating the client in typescript for this project.