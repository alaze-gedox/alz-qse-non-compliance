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
* Function to get table titles
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

/*
* Function to get line month
* @param {string} idDate - title of date column
* @param {Array} titles - array of table titles
* @param {Object} line - line in which the month is searched
* @return {number} - month number. -1 if month not found
*/
function month2number(idDate, titles, line) {
    let childFullText = $(line).find("td")[titles.indexOf(idDate)].firstChild;
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
            
            if (typeof field != "undefined" && fieldMonth > 0) {
                if (isNC(line, i)) {
                    // MONTHLY SUM
                    let sumFieldByMonth = `#${field}${fieldMonth}Sum`;
                    $(sumFieldByMonth).val(Number($(sumFieldByMonth).val()) + 1);
                    // GLOBAL SUM
                    let sumFieldGlobal = `#${field}Sum`;
                    $(sumFieldGlobal).val(Number($(sumFieldGlobal).val()) + 1);
                }
            }
        }
    });
}

/*
* Function to calculate N-C percent by month and global
* @param {object} elements - match between source and destination fields
* @return {void}
*/
function calculatePercentNC(lines, fields) {
    Object.keys(fields).forEach(key => {
        let baseFieldId = `#${fields[key]}`;
        
        // MONTHLY PERCENT
        for (let i = 1; i <= 12; i++) {
            $(`${baseFieldId}${i}Percent`).val(
                Number(
                    (100 * Number($(`${baseFieldId}${i}Sum`).val())) / Number($(`#month${i}Counter`).val())
                ).toFixed(2)
            );
        }
        
        // GLOBAL PERCENT
        $(`${baseFieldId}Percent`).val(
            Number(
                (100 * Number($(`${baseFieldId}Sum`).val())) / Number(lines.length)
            ).toFixed(2)
        );
        
    });
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
        caculateCounter(idDate, titles, lines);

        // SUM
        countNC(idDate, titles, lines, fields);

        // PERCENT
        calculatePercentNC(lines, fields);
    }, 3000);
}