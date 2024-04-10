import streamDeck, { Action, LogLevel } from '@elgato/streamdeck';

import { Split } from './actions/split';
import { LivesplitSettings } from './actions/base/livesplit-settings';
import { instance } from './livesplit';
import { Unsplit } from './actions/unsplit';
import { Reset } from './actions/reset';
import { Skip } from './actions/skip';

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

// TODO: device disconnect, auto disconnect from LS when no devices are connected

streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new Split());
streamDeck.actions.registerAction(new Unsplit());
streamDeck.actions.registerAction(new Reset());
streamDeck.actions.registerAction(new Skip());

async function registerDefaultSettings() {
    const defaultSettings = Object.freeze({
        ip: '127.0.0.1',
        port: '16834',
    });
    const settings = await streamDeck.settings.getGlobalSettings<LivesplitSettings>();

    await streamDeck.settings.setGlobalSettings({
        ...defaultSettings,
        ...settings,
    });
}

streamDeck.connect().then(() => {
    registerDefaultSettings();
});
