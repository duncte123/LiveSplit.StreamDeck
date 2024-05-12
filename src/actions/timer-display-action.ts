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
    private timers: {
        [key: string]: {
            timer: NodeJS.Timeout;
            settings: TimerDisplaySettings;
        }
    } = {};

    private defaultSettings: TimerDisplaySettings = {
        timingMethod: 'current',
        decimals: false,
    };

    async onWillAppear(ev: WillAppearEvent<TimerDisplaySettings>): Promise<void> {
        const ctx = ev.action.id;

        // Start timer
        // TODO: global timer?
        if (ctx in this.timers) {
            clearInterval(this.timers[ctx].timer);
            delete this.timers[ctx];
        }

        const fetched = await ev.action.getSettings();

        this.timers[ctx] = {
            settings: {
                ...this.defaultSettings,
                ...fetched,
            },
            timer: setInterval(() => {
                this.updateButton(ev.action);
            }, 1000), // Can we go faster? Should we?
        };
    }

    onDidReceiveSettings(ev: DidReceiveSettingsEvent<TimerDisplaySettings>) {
        const ctx = ev.action.id;

        if (ctx in this.timers) {
            this.timers[ctx].settings = {
                ...this.defaultSettings,
                ...ev.payload.settings,
            };
        }
    }

    async onWillDisappear(ev: WillDisappearEvent<TimerDisplaySettings>): Promise<void> {
        const ctx = ev.action.id;

        // Stop timer
        if (ctx in this.timers) {
            clearInterval(this.timers[ctx].timer);
            delete this.timers[ctx];
        }
    }

    async updateButton(action: Action<any>) {
        let time = 'OFFLINE';
        const settings = this.timers[action.id].settings;

        if (livesplit.isConnected) {
            switch (settings.timingMethod) {
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

        let stripDecimals = !settings.decimals;

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
