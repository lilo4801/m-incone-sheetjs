const CLIENT_ID = '1004183035730-n2a6r7dtl9smb0cc168tkvqdcg0efvk2.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA71Em4mZcEJ6CuuhjFgeF63ss7q9FowLk';
const SPREAD_SHEET_ID = '1urxFUkhyMjUaTkKQCA4X2DhzGn9j6pcGGs9Hkn7--v4'
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

//hiddent button
document.getElementById('authorize_button').style.visibility = 'hidden';
// document.getElementById('signout_button').style.visibility = 'hidden';
// document.getElementById('read_button').style.visibility = 'hidden';
// document.getElementById('write_button').style.visibility = 'hidden';
// document.getElementById('write_append_button').style.visibility = 'hidden';
// document.getElementById('create_new_sheet_button').style.visibility = 'hidden';
document.getElementById('formInput').style.visibility = 'hidden';
document.getElementById('information_button').style.visibility = 'hidden';




const formatDate = (currentDate) => {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit'
    }).format(currentDate);

    return formattedDate;
}

const App = {
    sheetsList: [],
    indexCurrentSheets: -1,
    gapiLoaded: () => {
        gapi.load('client', App.initializeGapiClient);
    },
    initializeGapiClient: async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        App.enableAuth();
    },
    gisLoaded: () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined later
        });
        gisInited = true;
        App.enableAuth();
    },
    enableAuth: () => {
        if (gapiInited && gisInited) {
            document.getElementById('authorize_button').style.visibility = 'visible';
        }
    },
    getValues: (spreadsheetId, range, callback) => {
        try {
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            }).then((response) => {
                const result = response.result;
                const numRows = result.values ? result.values.length : 0;
                console.log(`${numRows} rows retrieved.`);
                if (callback) callback(response);
            });
        } catch (err) {
            document.getElementById('content').innerText = err.message;
            return;
        }
    },
    insertSingleValue: (spreadsheetId, range, valueInputOption, _values, callback) => {
        try {

            gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: range,
                valueInputOption: valueInputOption,
                resource: {
                    values: _values,
                },
            }).then((res) => {
                if (callback) callback(res);
            });

        } catch (err) {
            console.error('Error inserting single value:', err.message);
        }
    },
    batchUpdateValues: async (spreadsheetId, range, valueInputOption, _values, callback) => {
        let values = [
            [
                // Cell values ...
            ],
            // Additional rows ...
        ];
        values = _values;
        const data = [];
        data.push({
            range: range,
            values: values,
        });
        // Additional ranges to update.

        const body = {
            data: data,
            valueInputOption: valueInputOption,
        };
        try {
            const response = await gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: body,
            })
            const result = response.result;
            console.log(`${result.totalUpdatedCells} cells updated.`);
            if (callback) callback(response);
        } catch (err) {
            document.getElementById('content').innerText = err.message;
            return;
        }
    },
    appendValues: async (spreadsheetId, range, valueInputOption, _values, callback) => {
        let values = [
            [
                // Cell values ...
            ],
            // Additional rows ...
        ];
        values = _values;
        const body = {
            values: values,
        };
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: range,
                valueInputOption: valueInputOption,
                resource: body,
            })
            const result = response.result;
            console.log(`${result.updates.updatedCells} cells appended.`);
            if (callback) callback(response);

        } catch (err) {
            document.getElementById('content').innerText = err.message;
            return;
        }
    },
    createSheet: async (spreadsheetId, nameSheets) => {
        try {

            // Specify the properties of the new sheet
            const sheetProperties = {
                title: nameSheets,
                gridProperties: {
                    rowCount: 100, // Specify the number of rows as needed
                    columnCount: 26 // Specify the number of columns as needed (A-Z)
                }
            };

            // Add a new sheet to the spreadsheet
            const response = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: {
                    requests: [
                        {
                            addSheet: {
                                properties: sheetProperties
                            }
                        }
                    ]
                }
            });
            console.log('New Sheet Created:', response);
        } catch (err) {
            console.error('Error creating sheet:', err.message);
        }
    },
    getAllSheets: async (spreadsheetId) => {
        try {
            // Get the spreadsheet information, including sheets
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId,
            });
            // Extract sheet information from the response
            const sheets = response.result.sheets;
            return sheets;

        } catch (err) {
            console.error('Error getting sheets:', err.message);
            return null;

        }
    },
    handleAuthClick: () => {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }

            App.main()

        };

        if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({ prompt: '' });
        }
    },
    handleSignoutClick: () => {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            document.getElementById('content').innerText = '';
            document.getElementById('authorize_button').innerText = 'Authorize';
            document.getElementById('signout_button').style.visibility = 'hidden';
        }
    },
    handleReadSheetClick: () => {
        console.log(App.indexCurrentSheets);
        console.log(App.sheetsList);
        App.getValues(SPREAD_SHEET_ID, 'Sheet1!A1:B1',
            (response) => {
                const range = response.result;
                if (!range || !range.values || range.values.length == 0) {
                    document.getElementById('content').innerText = 'No values found.';
                    return;
                }
                const output = range.values.reduce(
                    (str, row) => `${str}${row[0]}, ${row[1]}\n`,
                    'Name, Major:\n');
                document.getElementById('content').innerText = output;
            })
    },
    handleWriteSheetClick: async () => {
        await App.batchUpdateValues(SPREAD_SHEET_ID, 'Sheet1!A1:B1', 'raw', [['v1', 'v2']],
            (a) => {
                console.log("abc");
            }
        )
    },
    handleWriteAppendSheetClick: () => {
        App.appendValues(SPREAD_SHEET_ID, 'Sheet1', 'raw', [['a', 'b']],
            (res) => { console.log(res); }
        )
    },
    handleCreateNewSheetClick: () => {
        App.createSheet(SPREAD_SHEET_ID, 'Sheet2')
    },
    main: async () => {

        const currentDate = formatDate(new Date());
        const responseSheetsList = await App.getAllSheets(SPREAD_SHEET_ID);
        App.sheetsList = responseSheetsList.map(sheets => sheets.properties.title);

        let indexCurrentSheets = App.sheetsList.findIndex((value) => value == currentDate);

        // after login
        document.getElementById('authorize_button').innerText = 'Refresh';
        // document.getElementById('signout_button').style.visibility = 'visible';
        // document.getElementById('read_button').style.visibility = 'visible';
        // document.getElementById('write_button').style.visibility = 'visible';
        // document.getElementById('write_append_button').style.visibility = 'visible';
        // document.getElementById('create_new_sheet_button').style.visibility = 'visible';
        document.getElementById('formInput').style.visibility = 'visible';
        document.getElementById('information_button').style.visibility = 'visible';

        // insert data
        document.getElementById('currentDate').innerHTML = currentDate



        // create new sheets if sheets does not exist
        if (indexCurrentSheets == -1) {
            await App.createSheet(SPREAD_SHEET_ID, currentDate);
            App.sheetsList.push(currentDate)
            App.indexCurrentSheets = App.sheetsList.length - 1;
            const currentSheets = App.sheetsList[App.indexCurrentSheets];
            const range = currentSheets + "!A1:D1"
            await App.batchUpdateValues(
                SPREAD_SHEET_ID,
                range,
                'raw',
                [["DATE", "COST", "CONTENT", "TOTAL"]],
                (res) => {
                    console.log("Write header");
                }
            )

            await App.insertSingleValue(
                SPREAD_SHEET_ID,
                currentSheets + "!D2",
                'USER_ENTERED',
                [["=sum(B:B)"]],
                (res) => {
                    console.log("Write sum total cost");
                }
            )

        } else {
            App.indexCurrentSheets = indexCurrentSheets
        }

        document.getElementById("submit").addEventListener("click", (e) => {
            e.preventDefault()
            const costInputEle = document.getElementById("cost");
            const contentInputEle = document.getElementById("content");
            console.log(costInputEle.value);
            console.log(contentInputEle.value);

            const range = App.sheetsList[App.indexCurrentSheets]
            const currentDate = new Date();

            // Format the date using toLocaleString()
            const formattedDate = currentDate.toLocaleString();
            App.appendValues(
                SPREAD_SHEET_ID,
                range,
                "USER_ENTERED",
                [[formattedDate, parseInt(costInputEle.value, 0), contentInputEle.value]],
                (res) => {
                    console.log(res);
                }
            )

            costInputEle.value = ""
            contentInputEle.value = ""
        })

        document.getElementById("information_button").addEventListener("click", (e) => {
            // get total 
            App.getValues(
                SPREAD_SHEET_ID,
                currentSheets + "!D2",
                (response) => {
                    const range = response.result;
                    if (!range || !range.values || range.values.length == 0) {
                        console.log("No value found");
                        return;
                    }
                    console.log(range);
                    const output = range.values[0]
                    document.getElementById('totalCost').innerText = output;
                }
            )
        })


        const currentSheets = App.sheetsList[App.indexCurrentSheets];

        // get total 
        App.getValues(
            SPREAD_SHEET_ID,
            currentSheets + "!D2",
            (response) => {
                const range = response.result;
                if (!range || !range.values || range.values.length == 0) {
                    document.getElementById('content').innerText = 'No values found.';
                    return;
                }
                console.log(range);
                const output = range.values[0]
                document.getElementById('totalCost').innerText = output;
            }
        )


    }
}





