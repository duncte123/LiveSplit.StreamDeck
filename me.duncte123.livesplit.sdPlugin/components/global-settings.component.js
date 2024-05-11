class GlobalSettings extends HTMLElement {
    #settingsKeys = ['ip', 'port', 'localPipe'];
    #defaultSettings = Object.freeze({
        ip: '127.0.0.1',
        port: '16834',
        localPipe: true,
    });
    #currentSettings = { ...this.#defaultSettings };

    constructor() {
        super();
    }

    initialize() {
        $PI.onDidReceiveGlobalSettings(({payload}) => {
            const {settings} = payload;

            this.#settingsKeys.forEach((key) => {
                if (key in settings) {
                    this.#currentSettings[key] = settings[key];
                }
            });

            this.#setIpPortVisibility();
        });

        // Request the current global settings
        $PI.getGlobalSettings();
    }

    connectedCallback() {
        this.#render();
    }

    #setIpPortVisibility() {
        const items = this.querySelectorAll('.ipAndPort');

        items.forEach((item) => {
            item.style.display = this.#currentSettings.localPipe ? 'none' : 'flex';
        });
    }

    get settings() {
        return this.#currentSettings;
    }

    set settings(newSettings) {
        this.#saveSettings(newSettings);
    }

    forceSaveSettings() {
        this.#saveSettings(this.#currentSettings);
    }

    #saveSettings(newSettings) {
        const oldSettings = { ...this.#currentSettings };

        this.#settingsKeys.forEach((key) => {
            if (key in newSettings) {
                this.#currentSettings[key] = newSettings[key];
            }
        });

        $PI.setGlobalSettings(this.#currentSettings);

        // Only send reconnect if the global settings have changed.
        if (!deepEqual(oldSettings, this.#currentSettings)) {
            $PI.sendToPlugin({
                event: 'ls-reconnect',
            });
        }
    }

    #render() {
        this.innerHTML = `
            <div type="checkbox" class="sdpi-item">
                <div data-localize class="sdpi-item-label">Use local pipe</div>
                <input data-localize class="sdpi-item-value sdProperty"
                       name="localPipe"
                       id="localPipe"
                       value="localPipeOn"
                       type="checkbox"/>
                <label for="localPipe"><span></span></label>
            </div>

            <div class="sdpi-item ipAndPort">
                <div data-localize class="sdpi-item-label">Computer IP</div>
                <input data-localize class="sdpi-item-value"
                       name="ip"
                       type="text"
                       value=""
                       placeholder="127.0.0.1"/>
            </div>

            <div class="sdpi-item ipAndPort">
                <div data-localize class="sdpi-item-label">Server Port</div>
                <input data-localize class="sdpi-item-value"
                       name="port"
                       type="text"
                       value=""
                       placeholder="16834"/>
            </div>

            <div class="sdpi-item">
                <div data-localize class="sdpi-item-label">Connection Status</div>
                <div data-localize class="sdpi-item-value" id="status">Not Connected</div>
            </div>

            <div id="connection-info" style="display: none">
                <div data-localize >
                    Please check that the LiveSplit server is enabled
                </div>
                <div data-localize >
                    To enable the server: right click LiveSplit > control > start server
                </div>
            </div>

            <div class="sdpi-item">
                <button
                        class="sdpi-item-value"
                        type="button"
                        value="Reconnect"
                        data-localize
                        id="connect-livesplit">
                    Reconnect
                </button>
            </div>
        `;
    }
}

customElements.define('app-global-settings', GlobalSettings);
