import streamdeck, {
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
        decimals: false,
    };

    async onWillAppear(ev: WillAppearEvent<TimerDisplaySettings>): Promise<void> {
        // Start timer
        // TODO: global timer?
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

        let stripDecimals = !this.settings.decimals;

        // Remove the hour mark if it's 00
        if (time.startsWith('00:')) {
            time = time.substring(3);
        } else {
            // always strip decimals if we have hours.
            stripDecimals = true;
        }

        // If we have days, they may start with a period.
        const lastDotIndex = time.lastIndexOf('.');
        let timePart;
        let decimalPart;

        if (lastDotIndex > -1) {
            timePart = time.slice(0, lastDotIndex);
            decimalPart = time.slice(lastDotIndex + 1);
        } else {
            timePart = time;
            decimalPart = null;
        }

        const safeDecimals = decimalPart?.substring(0, 2);
        // Strip decimals if requested
        const decimalDisplay = stripDecimals ? '' : safeDecimals ? `.${safeDecimals}` : '.00';

        await action.setTitle(`${timePart}${decimalDisplay}`.trim());
    }
}
