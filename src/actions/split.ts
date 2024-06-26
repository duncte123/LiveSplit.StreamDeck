import { action } from '@elgato/streamdeck';
import { instance as livesplit } from '../livesplit';
import { BaseSplitAction } from './base/base-split-action';

@action({ UUID: 'me.duncte123.livesplit.split' })
export class Split extends BaseSplitAction {
    async liveSplitAction(): Promise<void> {
        await livesplit.startOrSplit();
    }

}
