function attemptedLiveSplitConnection(success) {
    const statusField = document.querySelector('#status');
    const connInfo = document.querySelector('#connection-info');

    if (success) {
        connInfo.style.display = 'none';
        statusField.innerHTML = $PI.localize('Connected');
        statusField.removeAttribute('style');
        console.log('Successfully connected to LiveSplit!');
    } else {
        connInfo.style.display = 'block';
        statusField.innerHTML = $PI.localize('Connection Error');
        statusField.style.color ='red';
        console.error('Failed to connect to LiveSplit!');
    }
}