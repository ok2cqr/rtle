window.onload = () => {
    showTime();
    setListeners();
    loadSavedConfiguration();

    "use strict";

    if ("serviceWorker" in navigator && document.URL.split(":")[0] !== "file") {
        navigator.serviceWorker.register("/offline.js?v=202409211610");
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/offline.js?v=202409211610"').then((function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }), function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

let logItems = [];
let myModal;
let maxId = 0;

const Bands = {
    b160M: {
        cw: "1.825",
        ssb: "1.890",
        digi: "1.840",
    },
    b80M: {
        cw: "3.532",
        ssb: "3.770",
        digi: "3.573",
    },
    b60M: {
        cw: "5.353",
        ssb: "5.450",
        digi: "5.357",
    },
    b40M: {
        cw: "7.032",
        ssb: "7.100",
        digi: "7.074",
    },
    b30M: {
        cw: "10.110",
        ssb: "10.120",
        digi: "10.136",
    },
    b20M: {
        cw: "14.032",
        ssb: "14.200",
        digi: "14.074",
    },
    b17M: {
        cw: "18.070",
        ssb: "18.120",
        digi: "18.104",
    },
    b15M: {
        cw: "21.032",
        ssb: "21.200",
        digi: "21.074",
    },
    b12M: {
        cw: "24.895",
        ssb: "24.910",
        digi: "24.915",
    },
    b10M: {
        cw: "28.032",
        ssb: "28.200",
        digi: "28.074",
    },
    b6M: {
        cw: "50.090",
        ssb: "50.350",
        digi: "50.313",
    },
    b2M: {
        cw: "144.090",
        ssb: "144.250",
        digi: "144.174",
    },
    b70CM: {
        cw: "432.050",
        ssb: "432.300",
        digi: "432.065",
    },
};


function loadSavedConfiguration() {
    logItems = loadAllQSO();
    maxId = logItems.length;
    displayTable();

    let freq = window.localStorage.getItem('my-freq');
    if (freq === null) {
        freq = '7.028';
    }
    document.getElementById('my-freq').value = freq;
    setBandSelectBoxByFreq(freq);
    window.localStorage.setItem('my-band', document.getElementById('my-band').value);

    let showGrid = window.localStorage.getItem('show-grid');
    if (showGrid === null) {
        showGrid = 'false';
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
    document.getElementById('my-grid').value = window.localStorage.getItem('my-grid');
}

function parseQsoData(qsoData) {
    let mode = document.getElementById('my-mode').value;
    let text = document.getElementById('js-qso-data').value;
    let freq = document.getElementById('my-freq').value;
    let band = document.getElementById('my-band').options[document.getElementById('my-band').selectedIndex].text;

    let sotaWff = '';
    let callsign = '';

    let rst_s = null;
    let rst_r = null;

    let qsoTime = getUtcTime();
    let qsoDate = getUtcDate();

    let itemNumber = 0;
    let row = text.trim();
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

    document.getElementById('my-mode').value = mode;
    if (band) {
        setBand(band);
        freq = getFreqFromBandMode(band, mode);
        document.getElementById('my-freq').value = freq;

        document.getElementById('js-clear-button').dispatchEvent(new Event('click'));
    }

    if (freq > 0) {
        document.getElementById('my-freq').value = freq;
        document.getElementById('my-freq').dispatchEvent(new Event('blur'));

        document.getElementById('js-clear-button').dispatchEvent(new Event('click'));
    }

    if (callsign) {
        logItems[maxId] = {
            "id" : maxId,
            "qsodate": qsoDate,
            "qsoTime": qsoTime,
            "callsign": callsign,
            "mode": mode,
            "band": band,
            "freq": freq,
            "rst_s": rst_s,
            "rst_r": rst_r,
            "sotaWff": sotaWff
        };
        maxId++;

        saveAllQSO();
        displayTable();
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

        document.getElementById('js-clear-button').dispatchEvent(new Event('click'));
    }

    checkSettings();
}

function displayTable() {
    const tbody = document.getElementById('logTable').querySelector('tbody');
    tbody.innerHTML = '';

    let reversed = JSON.parse(JSON.stringify(logItems));
    reversed.reverse();
    let itemCount = 0;
    for (const id in reversed) {
        const log = reversed[id];
        if (log === null) {
            continue;
        }
        const dateParts  = log.qsodate.split('-');

        const row = document.createElement('tr');
        row.setAttribute('data-id', log['id']);

        row.innerHTML = `
            <td>${dateParts[2]}/${dateParts[1]}/${log.qsoTime}</td>
            <td>${log.callsign}</td>
            <td>${log.mode}/${log.band}</td>
            <td>${log.sotaWff}</td>
        `;

        row.addEventListener('click', () => enableEdit(row, log['id']));

        tbody.appendChild(row);
        itemCount++;
    }

    document.getElementById('js-qso-info').innerText = 'QSO ('+itemCount+')';
}

function enableEdit(row, id) {
    id = parseInt(id);
    let options = [];
    let qsoId = -1;
    myModal = new bootstrap.Modal(document.getElementById('myModal'), options);
    for (const arrayId in logItems) {
        if (logItems[arrayId] === null) {
            continue;
        }

        const qso = logItems[arrayId];
        if (qso['id'] === id) {
            qsoId = arrayId;
        }
    }

    document.getElementById('editQsoDate').value = logItems[qsoId].qsodate;
    document.getElementById('editQsoTime').value = logItems[qsoId].qsoTime;
    document.getElementById('editCallsign').value = logItems[qsoId].callsign;
    document.getElementById('editMode').value = logItems[qsoId].mode;
    document.getElementById('editBand').value = logItems[qsoId].band;
    if (document.getElementById('js-show-freq').checked) {
        document.getElementById('editFreq').value = logItems[qsoId].freq;
    }
    document.getElementById('editRSTS').value = logItems[qsoId].rst_s;
    document.getElementById('editRSTR').value = logItems[qsoId].rst_r;
    document.getElementById('editSotaWff').value = logItems[qsoId].sotaWff;

    document.getElementById('js-delete-qso').setAttribute('data-id', id);
    document.getElementById('js-save-qso').setAttribute('data-id', id);
    myModal.show();
}

function deleteItem(id) {
    id = parseInt(id);
    for (const arrayId in logItems) {
        if (logItems[arrayId] === null) {
            continue;
        }
        if (logItems[arrayId]['id'] === id) {
            delete logItems[arrayId];
            break;
        }
    }
    // delete logItems[id];
    document.querySelector(`tr[data-id="${id}"]`).remove();
}

function editItem(id) {
    let log = logItems[id];
    log.qsodate = document.getElementById('editQsoDate').value;
    log.qsoTime = document.getElementById('editQsoTime').value;
    log.callsign = document.getElementById('editCallsign').value;
    log.mode = document.getElementById('editMode').value;
    log.band = document.getElementById('editBand').value;
    log.freq = document.getElementById('editFreq').value;
    log.rst_s = document.getElementById('editRSTS').value;
    log.rst_r = document.getElementById('editRSTR').value;
    log.sotaWff = document.getElementById('editSotaWff').value;

    displayTable();
}

function setBandSelectBoxByFreq(freq) {
    let band = getBandFromFreq(freq);
    setBand(band);
}

function setBand(band) {
    let select = document.getElementById('my-band')
    for(let i = 0; i < select.options.length; i++) {
        if(select.options[i].text === band) {
            select.options[i].selected = true;
            break;
        }
    }

    localStorage.setItem('my-band', band);
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
    let errorMessages = [];
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
        console.log('Enter the WWFF/SOTA');
        messages += '<span class="text-danger">Enter WWFF/SOTA</span><br>';
        errorMessages.push('Enter the WWFF/SOTA');
    }

    if (document.getElementById('my-call').value.length === 0) {
        console.log('Enter your callsign on the Settings tab');
        messages += '<span class="text-danger">Enter your callsign on the Settings tab</Settuu></span><br>';
        errorMessages.push('Enter your callsign on the Settings tab');
    }

    if (document.getElementById('operator').value.length === 0) {
        console.log('Enter your operator callsign on the Settings tab');
        messages += '<span class="text-danger">Enter operator callsign on the Settings tab</Settuu></span><br>';
        errorMessages.push('Enter your operator callsign on the Settings tab');
    }

    if (document.getElementById('my-power').value.length === 0) {
        console.log('Enter your power');
        messages += '<span class="text-warning">Enter your output power on the Settings tab</Settuu></span><br>';
    }

    document.getElementById('js-status-message').innerHTML = messages;

    return errorMessages;
}

function getBandFromFreq(freq) {
    if (freq > 1.7 && freq < 2) {
        return "160M";
    } else if (freq > 3.4 && freq < 4) {
        return "80M";
    } else if (freq > 6.9 && freq < 7.3) {
        return "40M";
    } else if (freq > 5 && freq < 6) {
        return "60M";
    } else if (freq > 10 && freq < 11) {
        return "30M";
    } else if (freq > 13 && freq < 15) {
        return "20M";
    } else if (freq > 18 && freq < 19) {
        return "17M";
    } else if (freq > 20 && freq < 22) {
        return "15M";
    } else if (freq > 24 && freq < 25) {
        return "12M";
    } else if (freq > 27 && freq < 30) {
        return "10M";
    } else if (freq > 50 && freq < 55) {
        return "6M";
    } else if (freq > 144 && freq < 149) {
        return "2M";
    } else if (freq > 430 && freq < 460) {
        return "70CM";
    }

    return '';
}

function getFreqFromBandMode(band, mode) {
    mode = mode.toLowerCase();

    band = 'b' + band.toUpperCase();

    if (Bands[band][mode] === undefined) {
        return '';
    } else {
        return Bands[band][mode];
    }
}

function getDefaultMode(mode) {
    mode = mode.toLowerCase();
    if (mode === 'CW' || mode === 'SSB' || mode === 'FM') {
        return mode;
    }

    return 'DIGI';
}

function loadAllQSO() {
    return JSON.parse(localStorage.getItem('logItems')) || [];
}

function saveAllQSO() {
    localStorage.setItem('logItems', JSON.stringify(logItems));
}

function exportLog() {
    let myCall = document.getElementById('my-call').value;
    let operator = document.getElementById('operator').value.toUpperCase();
    let power = document.getElementById('my-power').value;
    let grid = document.getElementById('my-grid').value.toUpperCase();
    let mySotaWwff = document.getElementById('my-sota-wwff').value.toUpperCase();
    let qsoCount = getAdifTag('QSO_COUNT', logItems.length.toString());
    let adifData = `
ADIF export from Real-time log entry by Petr, OK2CQR

Internet: https://rtle.ok2cqr.com

<ADIF_VER:5>2.2.1
<PROGRAMID:4>RTLE
<PROGRAMVERSION:5>0.0.2
${qsoCount}
<EOH>

`;
    logItems.forEach(function(line) {
        let qso = getAdifTag('QSO_DATE', line['qsodate'].replace("-", "").replace("-", ""));
        qso += getAdifTag('TIME_ON', line['qsoTime'].replace(":", ""));
        qso += getAdifTag('CALL', line['callsign']);
        qso += getAdifTag('BAND', line['band']);

        if (document.getElementById('js-show-freq').checked && line['freq']) {
            qso += getAdifTag('FREQ', line['freq']);
        }

        qso += getAdifTag('MODE', line['mode']);
        qso += getAdifTag('RST_SENT', line['rst_s']);
        qso += getAdifTag('RST_RCVD', line['rst_r']);
        qso += getAdifTag('OPERATOR', operator);
        qso += getAdifTag("STATION_CALLSIGN", myCall);

        let sotaWwff = line['sotaWff'];
        if (sotaWwff) {
            sotaWwff = sotaWwff.toUpperCase();
            if (isSOTA(sotaWwff)) {
                qso += getAdifTag("SOTA_REF", sotaWwff);
            } else if (isWWFF(sotaWwff)) {
                qso += getAdifTag("SIG", "WWFF");
                qso += getAdifTag("SIG_INFO", sotaWwff);
            }
        }

        if (power) {
            qso += getAdifTag('TX_PWR', power);
        }

        if (grid) {
            qso += getAdifTag('MY_GRIDSQUARE', grid);
        }

        if (isSOTA(mySotaWwff)) {
            qso += getAdifTag("MY_SOTA_REF", mySotaWwff);
        } else if (isWWFF(mySotaWwff)) {
            qso += getAdifTag("MY_SIG", "WWFF");
            qso += getAdifTag("MY_SIG_INFO", mySotaWwff);

        }

        adifData += qso + "<EOR> \n";
    });

    let qsoDate = getUtcDate().replace("-", "").replace("-", "");
    const filename =
        operator.replace("/", "-") +
        "_" +
        mySotaWwff.replace("/", "-") +
        "_" +
        qsoDate +
        ".adi";
    console.log(filename, adifData);
    download(filename, adifData);
}

function getAdifTag(tagName, value) {
    return "<" + tagName + ":" + value.length + ">" + value + " ";
}

function isSOTA(value) {
    return !!value.match(/^[A-Z]*[A-Z]\/[A-Z]{2}-\d{3}$/);
}

function isWWFF(value) {
    return !!value.match(/^[A-Z]*[F]{2}-\d{4}$/);
}

function download(filename, text) {
    let element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


/////////////////////////////// Listeners

function setListeners() {
    document.getElementById('my-freq').addEventListener('blur', function() {
        if (this.value !== '') {
            setBandSelectBoxByFreq(this.value);

            window.localStorage.setItem('my-freq', this.value);
            window.localStorage.setItem('my-band', document.getElementById('my-band').value);
        }
    });

    document.getElementById('my-band').addEventListener('change', function() {
        if (this.value !== '') {
            let freq = getFreqFromBandMode(this.value, document.getElementById('my-mode').value);
            document.getElementById('my-freq').value = freq;

            window.localStorage.setItem('my-freq', freq);
            window.localStorage.setItem('my-band', this.value);
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
            if (document.getElementById('editFreqContainer').classList.contains('d-none')) {
                document.getElementById('editFreqContainer').classList.remove('d-none');
            }
        } else {
            if (!document.getElementById('js-visible-freq').classList.contains('d-none')) {
                document.getElementById('js-visible-freq').classList.add('d-none');
            }
            if (!document.getElementById('editFreqContainer').classList.contains('d-none')) {
                document.getElementById('editFreqContainer').classList.add('d-none');
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
            parseQsoData(this.value);
            event.preventDefault();
        }
    });

    document.getElementById('my-sota-wwff').addEventListener('blur', function() {
        window.localStorage.setItem('my-sota-wwff', this.value);
    });

    document.getElementById('my-grid').addEventListener('blur', function() {
        window.localStorage.setItem('my-grid', this.value);
    });

    document.getElementById('js-delete-qso').addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (confirm('Do you really want to delete this QSO?')) {
            deleteItem(id);
            saveAllQSO();
            myModal.hide();
            displayTable();
        }
    });

    document.getElementById('js-save-qso').addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        editItem(id);
        saveAllQSO();

        myModal.hide();
    });

    document.getElementById('js-clear-log-button').addEventListener('click', function() {
        if (confirm("Do you really want to CLEAR the log? \n\n It will REMOVE ALL QSO permanently!")) {
            logItems = [];
            saveAllQSO();
            displayTable();

            document.getElementById("js-qso-data").focus();
        }
    });

    document.getElementById('js-export-log-button').addEventListener('click', function() {
        let errorMessages = checkSettings();
        if (errorMessages.length > 0) {
            alert("Please fill in all required fields!"  + "\n\n" + errorMessages.join("\n"));

            return;
        }
        exportLog();
    });
}
