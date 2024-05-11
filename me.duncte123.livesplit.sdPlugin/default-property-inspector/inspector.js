/// <reference path="../libs/js/property-inspector.js" />
/// <reference path="../libs/js/utils.js" />

const globalSettingsStorage = document.querySelector('app-global-settings');

$PI.onConnected((jsn) => {
    const form = document.querySelector('#property-inspector');

    globalSettingsStorage.initialize();

    form.addEventListener(
        'input',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);

            value.localPipe = value.localPipe === 'localPipeOn';

            globalSettingsStorage.settings = value;
        })
    );

    $PI.onSendToPropertyInspector($PI.actionInfo.action, (jsn) => {
        const { event, success } = jsn.payload;

        switch (event) {
            case 'ls-connect':
                attemptedLiveSplitConnection(success);
                break;
        }

        console.log('onSendToPropertyInspector', JSON.stringify(jsn));
    });
});

$PI.onDidReceiveGlobalSettings(({payload}) => {
    const form = document.querySelector('#property-inspector');
    const currentSettings = globalSettingsStorage.settings;
    const formSettings = {
        ...currentSettings,
        localPipe: currentSettings.localPipe? 'localPipeOn' : undefined,
    };

    Utils.setFormValue(formSettings, form);

    $PI.sendToPlugin({
        event: 'ls-connect',
    });

    console.log('onDidReceiveGlobalSettings', JSON.stringify(payload));
});

document.querySelector('#connect-livesplit').addEventListener('click', () => {
    // save settings
    globalSettingsStorage.forceSaveSettings();

    // Connect to livesplit!
    $PI.sendToPlugin({
        event: 'ls-reconnect',
    });
});