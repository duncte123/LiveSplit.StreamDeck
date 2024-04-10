import streamDeck, { LogLevel } from '@elgato/streamdeck';

import { Split } from './actions/split';
import { LivesplitSettings } from './actions/base/livesplit-settings';
import { instance } from './livesplit';

streamDeck.ui.onSendToPlugin<{ event: string }, LivesplitSettings>(async ({ payload, action }) => {
    const { event } = payload

    switch (event) {
        case 'ls-reconnect':
            const { ip, port } = await streamDeck.settings.getGlobalSettings<LivesplitSettings>();

            try {
                await instance.connect(ip, port);
                await action.sendToPropertyInspector({
                    event: 'ls-reconnect',
                    success: true,
                });
                await action.showOk();
            } catch (error: any) {
                await action.sendToPropertyInspector({
                    event: 'ls-reconnect',
                    success: false,
                });
                await action.showAlert();
            }
            break
    }
});

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the increment action.
streamDeck.actions.registerAction(new Split());

// Finally, connect to the Stream Deck.
streamDeck.connect();
