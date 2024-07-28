window.onload = function() {
    showTime();
    setListeners();
    loadSavedConfiguration();
};

function loadSavedConfiguration() {
    let freq = window.localStorage.getItem('my-freq');
    if (freq === null) {
        freq = '7.028';
    }
    document.getElementById('my-freq').value = freq;
    sendBandSelectBox(freq);
    window.localStorage.setItem('my-band', document.getElementById('my-band').value);

    let showGrid = window.localStorage.getItem('show-grid');
    if (showGrid === null) {
        showGrid = 'true';
    }
    document.getElementById('js-show-grid').checked = showGrid === 'true';
    document.getElementById('js-show-grid').dispatchEvent(new Event('change'));

    let showFreq = window.localStorage.getItem('show-freq');
    if (showFreq === null) {
        showFreq = 'true';
    }
    document.getElementById('js-show-freq').checked = showFreq === 'true';
    document.getElementById('js-show-freq').dispatchEvent(new Event('change'));

    let myMode = window.localStorage.getItem('my-mode');
    if (myMode === null) {
        myMode = 'CW';
    }
    document.getElementById('my-mode').value = myMode;

    document.getElementById('my-sota-wwff').value = window.localStorage.getItem('my-sota-wwff');

    document.getElementById('my-call').value = window.localStorage.getItem('my-call');
    document.getElementById('operator').value = window.localStorage.getItem('operator');
    document.getElementById('my-power').value = window.localStorage.getItem('my-power');
}

function setListeners() {
    document.getElementById('my-freq').addEventListener('blur', function() {
        if (this.value !== '') {
            sendBandSelectBox(this.value);
            window.localStorage.setItem('my-freq', this.value);
            window.localStorage.setItem('my-band', document.getElementById('my-band').value);
        }
    });

    document.getElementById('my-band').addEventListener('change', function() {
        if (this.value !== '') {
            document.getElementById('my-freq').value = this.value;
            window.localStorage.setItem('my-freq', this.value);
            window.localStorage.setItem('my-band', document.getElementById('my-band').value);
        }
    });

    document.getElementById('my-call').addEventListener('blur', function() {
        window.localStorage.setItem('my-call', this.value);
    });

    document.getElementById('operator').addEventListener('blur', function() {
        window.localStorage.setItem('operator', this.value);
    });

    document.getElementById('my-power').addEventListener('blur', function() {
        window.localStorage.setItem('my-power', this.value);
    });

    document.getElementById('js-show-grid').addEventListener('change', function() {
        if (this.checked) {
            if (document.getElementById('js-visible-grid').classList.contains('d-none')) {
                document.getElementById('js-visible-grid').classList.remove('d-none');
            }
        } else {
            if (!document.getElementById('js-visible-grid').classList.contains('d-none')) {
                document.getElementById('js-visible-grid').classList.add('d-none');
            }
        }

        window.localStorage.setItem('show-grid', this.checked);
    });

    document.getElementById('js-show-freq').addEventListener('change', function() {
        if (this.checked) {
            if (document.getElementById('js-visible-freq').classList.contains('d-none')) {
                document.getElementById('js-visible-freq').classList.remove('d-none');
            }
        } else {
            if (!document.getElementById('js-visible-freq').classList.contains('d-none')) {
                document.getElementById('js-visible-freq').classList.add('d-none');
            }
        }

        window.localStorage.setItem('show-freq', this.checked);
    });

    document.getElementById('my-mode').addEventListener('change', function() {
        if (this.value !== '') {
            window.localStorage.setItem('my-mode', this.value);
        }
    });


    document.getElementById('js-clear-button').addEventListener('click', function() {
        document.getElementById('js-qso-data').value = '';
        document.getElementById('js-qso-data').focus();
    });

    document.getElementById('js-qso-data').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            console.log(this.value);
            parseQsoData(this.value);
            event.preventDefault();
        }
    });

    document.getElementById('my-sota-wwff').addEventListener('blur', function() {
        window.localStorage.setItem('my-sota-wwff', this.value);
    });
}

function parseQsoData(qsoData) {
    let mode = document.getElementById('my-mode').value;
    let text = document.getElementById('js-qso-data').value;
    let band = document.getElementById('my-band').options[document.getElementById('my-band').selectedIndex].text;
    let rst_s = null;
    let rst_r = null;

    let freq = document.getElementById('my-freq').value;
    let row = text.trim();
    let itemNumber = 0;
    let qsoTime = getUtcTime();
    let qsoDate = getUtcDate();
    let sotaWff = '';
    let callsign = '';

    let items = row.split(" ");
    items.forEach((item) => {
        if (item === '') {
            return;
        }
        if (item.match(/^CW$|^SSB$|^FM$|^AM$|^PSK$|^FT8$/i)) {
            mode = item.toUpperCase();
        } else if (item.match(/^[1-9]?\d\d[Mm]$/) || item.toUpperCase() === '70CM') {
            band = item.toUpperCase();
            freq = 0;
        } else if (item.match(/^\d+\.\d+$/)) {
            freq = item;
            band = '';
        } else if (
            item.match(/^([A-Z]*[F]{2}-\d{4})|([A-Z]*[A-Z]\/[A-Z]{2}-\d{3})$/i)
        ) {
            sotaWff = item.toUpperCase();
        } else if (
            item.match(
                /([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])|.*\/([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])|([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])\/.*/
            )
        ) {
            callsign = item.toUpperCase();
        } else if ((itemNumber > 0) && (item.match(/(^[1-9][1-9]?[1-9]?$)/i))) {
            if (rst_r === null) {
                rst_r = item;
            } else {
                rst_s = item;
            }
        }

        itemNumber = itemNumber + 1;
    });

    rst_s = getFullReport(rst_s, mode);
    rst_r = getFullReport(rst_r, mode);

    console.log(
        'QSODATE:', qsoDate, "\n",
        'QSOTime:', qsoTime, "\n",
        'Call:', callsign, "\n",
        'Mode:', mode, "\n",
        'Band:', band, "\n",
        'Freq:', freq, "\n",
        'RST_S:', rst_s, "\n",
        'RST_R:', rst_r, "\n",
        'WWFF:', sotaWff, "\n",
    );

    checkSettings();
    document.getElementById('js-clear-button').dispatchEvent(new Event('click'));
}


function sendBandSelectBox(freq) {
    let value = 0;
    if ((freq > 1.7) && (freq < 2)) {
        value = "1.825";
    } else if (freq > 3.4 && freq < 4) {
        value = "3.525";
    } else if ((freq > 6.9) && (freq < 7.3)) {
        value = "7.025";
    } else if ((freq > 5) && (freq < 6)) {
        value = "5.353";
    } else if ((freq > 10) && (freq < 11)) {
        value = "10.120";
    } else if ((freq > 13) && (freq < 15)) {
        value = "14.025";
    } else if ((freq > 18) && (freq < 19)) {
        value = "18.068";
    } else if ((freq > 20) && (freq < 22)) {
        value = "21.025";
    } else if ((freq > 24) && (freq < 25)) {
        value = "24.890";
    } else if ((freq > 27) && (freq < 30)) {
        value = "28.025";
    } else if ((freq > 144) && (freq < 149)) {
        value = "144.100";
    }

    let select = document.getElementById('my-band')
    for(let i = 0; i < select.options.length; i++) {
        if(select.options[i].value === value) {
            select.options[i].selected = true;
            break;
        }
    }
}

function showTime() {
    let date = new Date();
    let year = date.getUTCFullYear();
    let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    let day = date.getUTCDate().toString().padStart(2, '0');
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');

    document.getElementById('js-datetime').innerText = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    setTimeout(showTime, 1000);
}

function getUtcTime() {
    let date = new Date();
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes =  date.getUTCMinutes().toString().padStart(2, '0');

    return hours + ':' + minutes;
}

function getUtcDate() {
    let date = new Date();
    let year = date.getUTCFullYear().toString().padStart(2, '0');
    let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    let day = date.getUTCDate().toString().padStart(2, '0');

    return year + '-' + month + '-' + day;
}

function getFullReport(rst, mode) {
    if (rst === null) {
        rst = '9';
    }

    if (rst.length === 1) {
        rst = '5' + rst;
    }

    if ((rst.length === 2) && (mode === 'CW')) {
        rst = rst + '9';
    }

    return rst;
}

function checkSettings() {
    let messages = 'Status: <br>';
    if (
        (window.localStorage.getItem('show-grid') === 'true') &&
        (document.getElementById('my-grid').value.length === 0)
        )
    {
        console.log('Enter your grid');
        messages += '<span class="text-warning">Enter your grid</span><br>';
    }

    if (document.getElementById('my-sota-wwff').value.length === 0) {
        console.log('Enter WWFF/SOTA');
        messages += '<span class="text-danger">Enter WWFF/SOTA</span><br>';
    }

    if (document.getElementById('my-call').value.length === 0) {
        console.log('Enter your call');
        messages += '<span class="text-danger">Enter your callsign on the Settings tab</Settuu></span><br>';
    }

    if (document.getElementById('operator').value.length === 0) {
        console.log('Enter your operator');
        messages += '<span class="text-danger">Enter operator callsign on the Settings tab</Settuu></span><br>';
    }

    if (document.getElementById('my-power').value.length === 0) {
        console.log('Enter your power');
        messages += '<span class="text-warning">Enter your output power on the Settings tab</Settuu></span><br>';
    }

    document.getElementById('js-status-message').innerHTML = messages;
}
