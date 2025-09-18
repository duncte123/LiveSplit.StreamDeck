import streamdeck, { action } from '@elgato/streamdeck';
import { instance as livesplit } from '../livesplit';
import { BaseSplitAction } from './base/base-split-action';

@action({ UUID: 'me.duncte123.livesplit.split' })
export class Split extends BaseSplitAction {
    async liveSplitAction(): Promise<void> {
        const timerPhase = await livesplit.getTimerPhase();

        streamdeck.logger.debug(`[Split] timer state is ${timerPhase}`);

        if (timerPhase === 'Ended') {
            streamdeck.logger.debug('[Split] Resetting timer before starting');
            await livesplit.reset();
        }

        await livesplit.startOrSplit();
    }

}
