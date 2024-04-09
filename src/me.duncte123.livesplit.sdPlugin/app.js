/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const myAction = new Action('me.duncte123.livesplit.split');

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
    console.log('Stream Deck connected!');
});

myAction.onKeyUp(({ action, context, device, event, payload }) => {
    console.log('Your key code goes here!');
    console.log(JSON.stringify({ action, context, device, event, payload }));
});