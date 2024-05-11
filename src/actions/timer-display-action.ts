import {
    action,
    Action,
    DidReceiveSettingsEvent,
    SingletonAction,
    WillAppearEvent,
    WillDisappearEvent
} from '@elgato/streamdeck';
import { instance as livesplit } from '../livesplit';

export interface TimerDisplaySettings {
    timingMethod: 'current' | 'rta' | 'igt';
    decimals: boolean;
}

@action({ UUID: 'me.duncte123.livesplit.timer-display' })
export class TimerDisplayAction extends SingletonAction<TimerDisplaySettings> {
    private timer: NodeJS.Timeout | null = null;

    private settings: TimerDisplaySettings = {
        timingMethod: 'current',
        decimals: true,
    };

    async onWillAppear(ev: WillAppearEvent<TimerDisplaySettings>): Promise<void> {
        // Start timer
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const fetched = await ev.action.getSettings();

        this.settings = {
            ...this.settings,
            ...fetched,
        };

        this.timer = setInterval(() => {
            this.updateButton(ev.action);
        }, 1000); // Can we go faster? Should we?
    }

    onDidReceiveSettings(ev: DidReceiveSettingsEvent<TimerDisplaySettings>) {
        this.settings = {
            ...this.settings,
            ...ev.payload.settings,
        };
    }

    async onWillDisappear(ev: WillDisappearEvent<TimerDisplaySettings>): Promise<void> {
        // Stop timer
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async updateButton(action: Action<any>) {
        let time = 'OFFLINE';

        if (livesplit.isConnected) {
            switch (this.settings.timingMethod) {
                case 'rta':
                    time = await livesplit.getCurrentRealTime();
                    break;
                case 'igt':
                    time = await livesplit.getCurrentGameTime();
                    break;
                case 'current':
                default:
                    time = await livesplit.getCurrentTime();
                    break;
            }
        }

        // Strip decimals if requested
        if (!this.settings.decimals) {
            time = time.split('.')[0];
        }

        await action.setTitle(time);
    }
}
