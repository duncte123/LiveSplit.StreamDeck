import streamDeck, { Action, LogLevel } from '@elgato/streamdeck';

import { Split } from './actions/split';
import { LivesplitSettings } from './actions/base/livesplit-settings';
import { instance } from './livesplit';

async function doConnect(action: Action<LivesplitSettings>, reconnect = false) {
    if (instance.isConnected && !reconnect) {
        await action.sendToPropertyInspector({
            event: 'ls-connect',
            success: true,
        });
        return;
    }

    const { ip, port } = await streamDeck.settings.getGlobalSettings<LivesplitSettings>();

    try {
        await instance.connect(ip, port);
        await action.sendToPropertyInspector({
            event: 'ls-connect',
            success: true,
        });
        await action.showOk();
    } catch (error: any) {
        await action.sendToPropertyInspector({
            event: 'ls-connect',
            success: false,
        });
        await action.showAlert();
    }
}

streamDeck.ui.onSendToPlugin<{ event: string }, LivesplitSettings>(async ({ payload, action }) => {
    const { event } = payload

    switch (event) {
        case 'ls-connect':
            await doConnect(action);
            break
        case 'ls-reconnect':
            await doConnect(action, true);
            break
    }
});

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the increment action.
streamDeck.actions.registerAction(new Split());

// Finally, connect to the Stream Deck.
streamDeck.connect();
