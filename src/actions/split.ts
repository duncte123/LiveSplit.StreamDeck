import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { LivesplitSettings } from './base/livesplit-settings';
import { instance as livesplit } from '../livesplit';

@action({ UUID: 'me.duncte123.livesplit.split' })
export class Split extends SingletonAction<LivesplitSettings> {
    onWillAppear(ev: WillAppearEvent<LivesplitSettings>): void | Promise<void> {
        if (!livesplit.isConnected) {
            // TODO: try connect
        }
    }

    async onKeyDown(ev: KeyDownEvent<LivesplitSettings>): Promise<void> {
        if (!livesplit.isConnected) {
            return ev.action.showAlert();
        }

        await ev.action.showOk();
    }
}
