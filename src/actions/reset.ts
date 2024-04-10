import { action } from '@elgato/streamdeck';
import { instance as livesplit } from '../livesplit';
import { BaseSplitAction } from './base/base-split-action';

@action({ UUID: 'me.duncte123.livesplit.reset' })
export class Reset extends BaseSplitAction {
    async liveSplitAction(): Promise<void> {
        await livesplit.reset();
    }

}
