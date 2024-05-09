import streamdeck, { KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { LivesplitSettings } from './livesplit-settings';
import { instance as livesplit } from '../../livesplit';

export abstract class BaseSplitAction extends SingletonAction<LivesplitSettings> {
    async onWillAppear(ev: WillAppearEvent<LivesplitSettings>): Promise<void> {
        if (!livesplit.isConnected) {
            const settings = await streamdeck.settings.getGlobalSettings<LivesplitSettings>();

            streamdeck.logger.debug(JSON.stringify(settings));

            if (settings.ip && settings.port) {
                livesplit.connect(settings.ip, settings.port).catch((e) => {
                    streamdeck.logger.warn(`Could not connect to livesplit: ${e}`)
                });
            }
        }
    }

    abstract liveSplitAction(): Promise<void>;

    async onKeyDown(ev: KeyDownEvent<LivesplitSettings>): Promise<void> {
        if (!livesplit.isConnected) {
            return ev.action.showAlert();
        }

        try {
            await this.liveSplitAction();
            await ev.action.showOk();
        } catch (error: any) {
            // likely not connected??
            await ev.action.showAlert();
        }
    }
}
