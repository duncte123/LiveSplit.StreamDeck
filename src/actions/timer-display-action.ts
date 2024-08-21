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

const storedTimers: { [actionId: string]: StoredTimer } = {};

interface StoredTimer {
    action: Action<any>;
    settings: TimerDisplaySettings;
    tick: (action: Action<any>, settings: TimerDisplaySettings) => void | Promise<void>;
}

setInterval(() => {
    const timers = Object.values(storedTimers);

    for (const timer of timers) {
        timer.tick(timer.action, timer.settings);
    }
}, 1000); // Can we go faster? Should we?

@action({ UUID: 'me.duncte123.livesplit.timer-display' })
export class TimerDisplayAction extends SingletonAction<TimerDisplaySettings> {
    private defaultSettings: TimerDisplaySettings = {
        timingMethod: 'current',
        decimals: false,
    };

    async onWillAppear(ev: WillAppearEvent<TimerDisplaySettings>): Promise<void> {
        const ctx = ev.action.id;

        if (ctx in storedTimers) {
            delete storedTimers[ctx];
        }

        const fetched = await ev.action.getSettings();

        // Start timer
        storedTimers[ctx] = {
            action: ev.action,
            settings: {
                ...this.defaultSettings,
                ...fetched,
            },
            tick: (action, settings) => {
                this.updateButton(action, settings);
            }
        };
    }

    onDidReceiveSettings(ev: DidReceiveSettingsEvent<TimerDisplaySettings>) {
        const ctx = ev.action.id;

        if (ctx in storedTimers) {
            storedTimers[ctx].settings = {
                ...this.defaultSettings,
                ...ev.payload.settings,
            };
        }
    }

    async onWillDisappear(ev: WillDisappearEvent<TimerDisplaySettings>): Promise<void> {
        const ctx = ev.action.id;

        // Stop timer
        if (ctx in storedTimers) {
            delete storedTimers[ctx];
        }
    }

    async updateButton(action: Action<any>, settings: TimerDisplaySettings) {
        let time = 'OFFLINE';

        // TODO: ask LS once and tell the buttons
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

        // await action.setTitle(`${timePart}${decimalDisplay}`.trim());
        await action.setTitle(settings.timingMethod);
    }
}
