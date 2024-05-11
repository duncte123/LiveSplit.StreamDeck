import { action } from '@elgato/streamdeck';
import { instance as livesplit } from '../livesplit';
import { BaseSplitAction } from './base/base-split-action';

@action({ UUID: 'me.duncte123.livesplit.resume' })
export class Resume extends BaseSplitAction {
    async liveSplitAction(): Promise<void> {
        await livesplit.resume();
    }
}
