/// <reference path="../libs/js/property-inspector.js" />
/// <reference path="../libs/js/utils.js" />

let activeTab = '';

const defaultSettings = Object.freeze({
    ip: '127.0.0.1',
    port: '16834',
});

let currentSettings = defaultSettings;

let count = 0;

$PI.onConnected((jsn) => {
    const form = document.querySelector('#property-inspector');
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    console.log('loaded??', ++count);

    // Request the current global settings
    $PI.getGlobalSettings();

    form.addEventListener(
        'input',
        Utils.debounce(150, () => {
            const value = Utils.getFormValue(form);

            value.localPipe = value.localPipe === 'localPipeOn';
            currentSettings = value;

            setIpPortVisibility(currentSettings.localPipe);
            $PI.setGlobalSettings(value);
            $PI.sendToPlugin({
                event: 'ls-reconnect',
            });
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
    const {settings} = payload;
    const form = document.querySelector('#property-inspector');

    currentSettings = {
        ...defaultSettings,
        ...settings,
    };

    setIpPortVisibility(currentSettings.localPipe);

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

function setIpPortVisibility(usingLocalPipe) {
    const items = document.querySelectorAll('.ipAndPort');

    items.forEach((item) => {
        item.style.display = usingLocalPipe ? 'none' : 'flex';
    });
}

document.querySelector('#connect-livesplit').addEventListener('click', () => {
    // save settings
    $PI.setGlobalSettings(currentSettings);

    // Connect to livesplit!
    $PI.sendToPlugin({
        event: 'ls-reconnect',
    });
});


/**
 * TABS
 * ----
 *
 * This will make the tabs interactive:
 * - clicking on a tab will make it active
 * - clicking on a tab will show the corresponding content
 * - clicking on a tab will hide the content of all other tabs
 * - a tab must have the class "tab"
 * - a tab must have a data-target attribute that points to the id of the content
 * - the content must have the class "tab-content"
 * - the content must have an id that matches the data-target attribute of the tab
 *
 *  <div class="tab selected" data-target="#tab1" title="Show some inputs">Inputs</div>
 *  <div class="tab" data-target="#tab2" title="Here's some text-areas">Text</div>
 * a complete tab-example can be found in the index.html
 <div type="tabs" class="sdpi-item">
 <div class="sdpi-item-label empty"></div>
 <div class="tabs">
 <div class="tab selected" data-target="#tab1" title="Show some inputs">Inputs</div>
 <div class="tab" data-target="#tab2" title="Here's some text-areas">Text</div>
 </div>
 </div>
 <hr class="tab-separator" />
 * You can use the code below to activate the tabs (`activateTabs` and `clickTab` are required)
 */

function activateTabs(activeTab) {
    const allTabs = Array.from(document.querySelectorAll('.tab'));
    let activeTabEl = null;
    allTabs.forEach((el, i) => {
        el.onclick = () => clickTab(el);
        if (el.dataset?.target === activeTab) {
            activeTabEl = el;
        }
    });
    if (activeTabEl) {
        clickTab(activeTabEl);
    } else if (allTabs.length) {
        clickTab(allTabs[0]);
    }
}

function clickTab(clickedTab) {
    const allTabs = Array.from(document.querySelectorAll('.tab'));
    allTabs.forEach((el, i) => el.classList.remove('selected'));
    clickedTab.classList.add('selected');
    activeTab = clickedTab.dataset?.target;
    allTabs.forEach((el, i) => {
        if (el.dataset.target) {
            const t = document.querySelector(el.dataset.target);
            if (t) {
                t.style.display = el === clickedTab ? 'block' : 'none';
            }
        }
    });
}

activateTabs();