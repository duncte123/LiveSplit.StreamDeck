import streamDeck, { Action, LogLevel } from '@elgato/streamdeck';

import { Split } from './actions/split';
import { LivesplitSettings } from './actions/base/livesplit-settings';
import { instance as livesplit } from './livesplit';
import { Unsplit } from './actions/unsplit';
import { Reset } from './actions/reset';
import { Skip } from './actions/skip';
import { Pause } from './actions/pause';
import { Resume } from './actions/resume';

async function doConnect(action: Action<LivesplitSettings>, reconnect = false) {
    if (livesplit.isConnected && !reconnect) {
        await action.sendToPropertyInspector({
            event: 'ls-connect',
            success: true,
        });
        return;
    }

    const settings = await streamDeck.settings.getGlobalSettings<LivesplitSettings>();

    try {
        if (livesplit.isConnected) {
            livesplit.disconnect();
        }

        await livesplit.connect(settings);
        await action.sendToPropertyInspector({
            event: 'ls-connect',
            success: true,
        });
        await action.showOk();
    } catch (error: any) {
        streamDeck.logger.error('connection failed', error);
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

function disconnectLS() {
    if (livesplit.isConnected) {
        livesplit.disconnect();
    }
}

process.on('exit', () => { disconnectLS(); });
process.on('SIGINT', () => { disconnectLS(); });

streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new Split());
streamDeck.actions.registerAction(new Unsplit());
streamDeck.actions.registerAction(new Reset());
streamDeck.actions.registerAction(new Skip());
streamDeck.actions.registerAction(new Pause());
streamDeck.actions.registerAction(new Resume());

async function registerDefaultSettings() {
    const defaultSettings = Object.freeze({
        ip: '127.0.0.1',
        port: '16834',
        localPipe: true,
    });
    const settings = await streamDeck.settings.getGlobalSettings<LivesplitSettings>();
    const parsedSettings = {
        ...defaultSettings,
        ...settings,
    };

    // Force use the local pipe if the ip is local host
    parsedSettings.localPipe = parsedSettings.ip === '127.0.0.1';

    await streamDeck.settings.setGlobalSettings(parsedSettings);
}

streamDeck.connect().then(() => {
    registerDefaultSettings();
});
