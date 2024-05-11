import streamdeck, { KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { LivesplitSettings } from './livesplit-settings';
import { instance as livesplit } from '../../livesplit';

export abstract class BaseSplitAction extends SingletonAction<LivesplitSettings> {
    async onWillAppear(ev: WillAppearEvent<LivesplitSettings>): Promise<void> {
        if (!livesplit.isConnected) {
            this.attemptConnection().catch((e) => {
                streamdeck.logger.warn(`Could not connect to livesplit: ${e}`)
            });
        }
    }

    // returns true if a connection was made
    private async attemptConnection(): Promise<boolean> {
        if (livesplit.isConnected) {
            return false;
        }

        try {
            const settings = await streamdeck.settings.getGlobalSettings<LivesplitSettings>();

            await livesplit.connect(settings);
        } catch (error: any) {
            streamdeck.logger.error(error);
            return false;
        }

        return true;
    }

    abstract liveSplitAction(): Promise<void>;

    async onKeyDown(ev: KeyDownEvent<LivesplitSettings>): Promise<void> {
        if (!livesplit.isConnected) {
            const madeConnection = await this.attemptConnection();

            if (!madeConnection) {
                return ev.action.showAlert();
            }
        }

        try {
            await this.liveSplitAction();
            await ev.action.showOk();
        } catch (error: any) {
            // likely not connected??
            streamdeck.logger.error(error);
            await ev.action.showAlert();
        }
    }
}
