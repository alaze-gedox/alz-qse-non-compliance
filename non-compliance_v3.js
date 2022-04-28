/*
    Three required lines to import alz-qse-non-compliance lib.
    Usage :
        - Lib URL must be "https://cdn.jsdelivr.net/gh/alaze-gedox/alz-qse-non-compliance@latest/non-compliance.js"
        - When update is done on lib. URL "https://purge.jsdelivr.net/gh/alaze-gedox/alz-qse-non-compliance@latest/non-compliance.js" must be called.
*/
/*
USAGE :
    CONST :
        const ID_TABLE = {string}
        const ID_DATE = {string}
        const FIELDS = {
            source     destination
            {string}:  {string},
            {string}:  {string},
            {string}:  {string},
            ...
        }
    CALL :
        getNonCompliance(ID_TABLE, ID_DATE, FIELDS)
*/

/*
* Function to get table, which contains data, titles
* @param {string} idTable - table identifier
* @return {Array} - array of table titles
*/
function getTitles(idTable) {
    let titles = [];

    $(`${idTable} thead tr th`).toArray().forEach(
        element => titles.push(element.firstChild.nodeValue)
    );
    return titles;
}

function getTitlePosition(idTable, titleId) {
    let titles = [];
    $(`${idTable} thead tr th`).toArray().forEach(
        element => titles.push(element.firstChild.nodeValue)
    );
    return titles.indexOf(titleId);
}

function getlineValueById(idTable, titleId, line) {
    return $(line).find("td")[getTitlePosition(idTable, titleId)].firstChild;
}

/*
* Function to get line month from table
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {Object} line - line in which the month is searched
* @return {number} - month number. -1 if month not found
*/
function month2number(idTable, idDate, line) {
    // let childFullText = $(line).find("td")[getTitlePosition(idDate)].firstChild;
    let childFullText = getlineValueById(idTable, idDate, line);
    return childFullText ? Number(childFullText.nodeValue.split("/")[1]) : -1;
}

/*
* Function to test if value is N-C
* @param {object} line - line where test is done
* @param {number} index - column number
* @return {boolean} - true if value is N-C else false
*/
function isNC(line, index) {
    return $(line).find('td')[index].firstChild.nodeValue == "N-C";
}

function setUpTable(tableId, title) {
    $(`#lien_btnAjLigne_${tableId}`).click();
    getTableInputByCoord(tableId, -1, 0).val(title);
}

function getTableInputByCoord(tableId, lineLocation, inputLocation) {
    let line = $(`#${tableId}_1 tbody tr`).get(lineLocation);
    let input = $(line).find("td input").get(inputLocation);
    return $(input);
}

function countField(sumField, counter) {
    sumField.val(Number(sumField.val()) + Number(counter));
    return sumField.val();
}

function writeCounter(tableId, lineNumber, inputNumber, count) {
    // MONTH
    countField(getTableInputByCoord(tableId, lineNumber, inputNumber), count);
    // GLOBAL
    countField(getTableInputByCoord(tableId, lineNumber, 13), count);
}

/*
* Function to count month iteration
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {object} lines - all lines to browse
* @return {void}
*/
function caculateCounter(idDate, titles, lines) {
    lines.toArray().forEach(line => {
        let month = month2number(idDate, titles, line);

        if (month > 0) {
            let monthCounter = $(`#month${month}Counter`);
            monthCounter.val(Number(monthCounter.val()) + 1);
        }
    });
}

/*
* Function to count global  iteration
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {object} lines - all lines to browse
* @return {void}
*/
function caculateCounterGlobal(idTable, idDate, lines, elements) {
    let field = 'TABTotal';

    elements.forEach(element => {
        setUpTable(field, element.title);
    });

    lines.toArray().forEach(line => {
        let month = month2number(idTable, idDate, line);

        if(month > 0) {
            writeCounter(field, 0, month, 1);
            elements.forEach(element => {
                let fieldLocation = elements.indexOf(element) + 1;
                writeCounter(field, fieldLocation, month, element.number);
            });
        }
    });
}

/*
* Function to count N-C element by month and global
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {object} lines - all lines to browse
* @param {object} elements - match between source and destination fields
* @return {void}
*/
function countNC(idDate, titles, lines, fields) {
    lines.toArray().forEach(line => {
        for (let i=0; i < titles.length; i++) {
            let field = fields[titles[i]];
            let fieldMonth = month2number(idDate, titles, line);

            // SET N-C TITLE
            $($($(`#${field}_1 tbody tr`)[0]).find("td input")[0]).val("N-C");

            // SET VALUES
            if (typeof field != "undefined" && fieldMonth > 0) {
                let sumFieldByMonth = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[fieldMonth]);
                let sumFieldGlobal = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[13]);

                if (isNC(line, i)) {
                    // MONTHLY SUM
                    sumFieldByMonth.val(Number(sumFieldByMonth.val()) + 1);
                    sumFieldGlobal.val(Number(sumFieldGlobal.val()) + 1);
                }

                if (sumFieldByMonth.val() == ""){
                    sumFieldByMonth.val(0);
                }
            }
        }
    });
}

/*
* Function to count N-C element by month and global
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {object} lines - all lines to browse
* @param {object} elements - match between source and destination fields
* @return {void}
*/
function countNonComplianceItems(idTable, idDate, lines, items) {
    items.forEach(element => {
        let globalCountLine = items.indexOf(item) + 1;
        setUpTable(item.id, "% Conformité");
        
        lines.toArray().forEach(line => {
            let fieldMonth = month2number(idTable, idDate, line);
            writeCounter(element.id, 0, fieldMonth, getlineValueById(element.id, line))
        });
        // for (let i=0; i < titles.length; i++) {
        //     let field = fields[titles[i]];
        //     let fieldMonth = month2number(idDate, titles, line);

        //     // SET N-C TITLE
        //     $($($(`#${field}_1 tbody tr`)[0]).find("td input")[0]).val("Total");

        //     // SET VALUES
        //     if (typeof field != "undefined" && fieldMonth > 0) {
        //         let sumFieldByMonth = $($($(`#${field.id}_1 tbody tr`)[0]).find("td input")[fieldMonth]);
        //         let sumFieldGlobal = $($($(`#${field.id}_1 tbody tr`)[0]).find("td input")[13]);

        //         sumFieldByMonth.val(Number(sumFieldByMonth.val()) + Number($(line).find('td')[i].firstChild.nodeValue));
        //         sumFieldGlobal.val(Number(sumFieldGlobal.val()) + Number($(line).find('td')[i].firstChild.nodeValue));

        //         /*if (isNC(line, i)) {
        //             // MONTHLY SUM
        //             sumFieldByMonth.val(Number(sumFieldByMonth.val()) + 1);
        //             sumFieldGlobal.val(Number(sumFieldGlobal.val()) + 1);
        //         }*/

        //         if (sumFieldByMonth.val() == ""){
        //             sumFieldByMonth.val(0);
        //         }
        //     }
        // }
    });
}

/*
* Function to calculate N-C percent by month and global
* @param {object} elements - match between source and destination fields
* @return {void}
*/
function calculatePercentNC(lines, fields) {
    Object.keys(fields).forEach(key => {
        let field = `${fields[key]}`;

        setUpTable(field, "% Conformité");
        // Add table row
        // $(`#lien_btnAjLigne_${field}`).click();
        // SET % TITLE
        // $($($(`#${field}_1 tbody tr`)[1]).find("td input")[0]).val("% Conformité");

        // MONTHLY PERCENT
        for (let i = 1; i <= 12; i++) {
            let percentFieldByMonth = $($($(`#${field}_1 tbody tr`)[1]).find("td input")[i]);
            let sumFieldByMonth = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[i]);
            percentFieldByMonth.val(
                Number(
                    100-(100 * Number(sumFieldByMonth.val())) / Number($(`#month${i}Counter`).val())
                ).toFixed(2)
            );
        }

        // GLOBAL PERCENT
        let percentFieldGlobal = $($($(`#${field}_1 tbody tr`)[1]).find("td input")[13]);
        let sumFieldGlobal = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[13]);
        percentFieldGlobal.val(
            Number(
                100-(100 * Number(sumFieldGlobal.val())) / Number(lines.length)
            ).toFixed(2)
        );
    });
}

/*
* iyggytccytc
*/
function calculatePercentNCGlobal(fields) {
    let counter = 'TABTotal';

    fields.forEach(field => {
        let id = field.id;

        $(`#lien_btnAjLigne_${field.id}`).click();
        $($($(`#${id}_1 tbody tr`)[1]).find("td input")[0]).val("% Conformité");

        for(let i = 1; i <= 13; i++) {
            let fieldLocation = fields.indexOf(field) + 1;
            let percentFieldByMonth = $($($(`#${id}_1 tbody tr`)[1]).find("td input")[i]);
            let sumFieldByMonth = $($($(`#${id}_1 tbody tr`)[0]).find("td input")[i]);
            let sumGlobalByMonth = $($($(`#${counter}_1 tbody tr`)[fieldLocation]).find("td input")[i]);

            percentFieldByMonth.val(
                Number(
                    100 - (100 * Number(sumFieldByMonth.val())) / Number(sumGlobalByMonth.val())
                ).toFixed(2)
            );
        }
    })

    // Object.keys(fields).forEach(key => {
    //     let field = `${fields[key]}`;

    //     // Add table row
    //     $(`#lien_btnAjLigne_${field}`).click();

    //     // SET % TITLE
    //     $($($(`#${field}_1 tbody tr`)[1]).find("td input")[0]).val("% Conformité");

    //     // MONTHLY PERCENT
    //     for (let i = 1; i <= 12; i++) {
    //         let percentFieldByMonth = $($($(`#${field}_1 tbody tr`)[1]).find("td input")[i]);
    //         let sumFieldByMonth = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[i]);
    //         let sumGlobalSURByMonth = $($($(`#${counter}_1 tbody tr`)[1]).find("td input")[i]);
    //         let sumGlobalSSTByMonth = $($($(`#${counter}_1 tbody tr`)[2]).find("td input")[i]);
    //         let sumGlobalSECByMonth = $($($(`#${counter}_1 tbody tr`)[3]).find("td input")[i]);
    //         let sumGlobalREAByMonth = $($($(`#${counter}_1 tbody tr`)[4]).find("td input")[i]);
    //         switch(field){
    //             case 'SUR':
    //                 percentFieldByMonth.val(
    //                     Number(
    //                         100-(100 * Number(sumFieldByMonth.val())) / Number(sumGlobalSURByMonth.val())
    //                     ).toFixed(2)
    //                 );
    //                 break;
    //             case 'SST':
    //                 percentFieldByMonth.val(
    //                     Number(
    //                         100-(100 * Number(sumFieldByMonth.val())) / Number(sumGlobalSSTByMonth.val())
    //                     ).toFixed(2)
    //                 );
    //                 break;
    //             case 'SEC':
    //                 percentFieldByMonth.val(
    //                     Number(
    //                         100-(100 * Number(sumFieldByMonth.val())) / Number(sumGlobalSECByMonth.val())
    //                     ).toFixed(2)
    //                 );
    //                 break;
    //             case 'REA':
    //                 percentFieldByMonth.val(
    //                     Number(
    //                         100-(100 * Number(sumFieldByMonth.val())) / Number(sumGlobalREAByMonth.val())
    //                     ).toFixed(2)
    //                 );
    //                 break;
    //             default:
    //                 percentFieldByMonth.val('-');
    //                 break;
    //         }
    //         /*percentFieldByMonth.val(
    //             Number(
    //                 100-(100 * Number(sumFieldByMonth.val())) / Number($(`#month${i}Counter`).val())
    //             ).toFixed(2)
    //         );*/
    //     }

    //     // GLOBAL PERCENT
    //     let percentFieldGlobal = $($($(`#${field}_1 tbody tr`)[1]).find("td input")[13]);
    //     let sumFieldGlobal = $($($(`#${field}_1 tbody tr`)[0]).find("td input")[13]);
    //     let sumGlobalSURGlobal = $($($(`#${counter}_1 tbody tr`)[1]).find("td input")[13]);
    //     let sumGlobalSSTGlobal = $($($(`#${counter}_1 tbody tr`)[2]).find("td input")[13]);
    //     let sumGlobalSECGlobal = $($($(`#${counter}_1 tbody tr`)[3]).find("td input")[13]);
    //     let sumGlobalREAGlobal = $($($(`#${counter}_1 tbody tr`)[4]).find("td input")[13]);
        
    //     /*percentFieldGlobal.val(
    //         Number(
    //             100-(100 * Number(sumFieldGlobal.val())) / Number(lines.length)
    //         ).toFixed(2)
    //     );*/
    //     switch(field){
    //         case 'SUR':
    //             percentFieldGlobal.val(
    //                 Number(
    //                     100-(100 * Number(sumFieldGlobal.val())) / Number(sumGlobalSURGlobal.val())
    //                 ).toFixed(2)
    //             );
    //             break;
    //         case 'SST':
    //             percentFieldGlobal.val(
    //                 Number(
    //                     100-(100 * Number(sumFieldGlobal.val())) / Number(sumGlobalSSTGlobal.val())
    //                 ).toFixed(2)
    //             );
    //             break;
    //         case 'SEC':
    //             percentFieldGlobal.val(
    //                 Number(
    //                     100-(100 * Number(sumFieldGlobal.val())) / Number(sumGlobalSECGlobal.val())
    //                 ).toFixed(2)
    //             );
    //             break;
    //         case 'REA':
    //             percentFieldGlobal.val(
    //                 Number(
    //                     100-(100 * Number(sumFieldGlobal.val())) / Number(sumGlobalREAGlobal.val())
    //                 ).toFixed(2)
    //             );
    //             break;
    //         default:
    //             percentFieldGlobal.val('-');
    //             break;
    //     }
    // });
}

/*
* Function to count non compliance and to calculate non-compliance percent
* @param {string} idTable - data table identifier
* @param {string} idDate - title of date column
* @param {object} elements - match between source and destination fields
* @return {void}
*/
function getNonCompliance(idTable, idDate, fields) {
    setTimeout(() => {
        let lines = $(`${idTable} tbody tr`);
        let titles = getTitles(idTable);

        // COUNTER
        caculateCounterGlobal(idDate, titles, lines);

        // SUM
        countNC(idDate, titles, lines, fields);

        // PERCENT
        calculatePercentNC(lines, fields);

        // LINES
        $("#NBControle").val(lines.length);
    }, 3000);
}

/*
* trrdtrdyrtc
*/
function getNonComplianceGlobal(idTable, idDate, elements) {
    setTimeout(() => {
        let lines = $(`${idTable} tbody tr`);

        // GLOBAL COUNTER
        caculateCounterGlobal(idTable, idDate, lines, elements);

        // COUNT N-C
        countNonComplianceItems(idTable, idDate, lines, elements);
        
        // PERCENT

        // LINES
        $("#NBControle").val(lines.length);
    }, 3000);
}

DisplayColumns('Row_Items', '1');
DisplayColumns('Filtres','0');


var ID_TABLE = "table[name=TAB_DATA]";
var ID_DATE = "date de saisie";
var ELEMENTS = {
    "REA":  "REA",
    "SEC":  "SEC",
    "SST":  "SST",
    "SUR":  "SUR"
};
var NBELEMENTS = {
    "SUR":  "5",
    "SST":  "6",
    "SEC":  "29",
    "REA":  "14"
};
var ELEMENTS1 = [
    {
        "id": "REA",
        "title": "REA",
        "number": 14
    },
    {
        "id": "SEC",
        "title": "SEC",
        "number": 29
    },
    {
        "id": "SST",
        "title": "SST",
        "number": 6 
    },
    {
        "id": "SUR",
        "title": "SUR",
        "number": 5
    }
];

getNonComplianceGlobal(ID_TABLE, ID_DATE, ELEMENTS1)