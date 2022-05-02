/*
* Link to purge jsDelivr cache after an update "https://purge.jsdelivr.net/gh/alaze-gedox/alz-qse-non-compliance@main/non-compliance.js"
*/

/*
* ==========================================
* USAGE EXAMPLE
* ==========================================
* var ID_DATA_TABLE = "table[name=TAB_DATA]";
* var ID_TITLE_DATE = "date de saisie";
* var ITEMS = [
*    {
*        "id": "REA",
*        "title": "REA",
*        "number": 14
*    },
*    {
*        "id": "SEC",
*        "title": "SEC",
*        "number": 29
*    },
*    {
*        "id": "SST",
*        "title": "SST",
*        "number": 6 
*    },
*    {
*        "id": "SUR",
*        "title": "SUR",
*        "number": 5
*    }
* ]
*
* completeTables(ID_DATA_TABLE, ID_TITLE_DATE, ITEMS);
*/

/**
 * Class to calculate global non compliance
 */
class NonCompliance {
    /**
     * Constructor
     * 
     * @param {string} idDataTable - Data table name
     * @param {string} idTitleDate - Title of date column
     * @param {Array} items - List of items to count
     */
    constructor(idDataTable, idTitleDate, items) {
        this.idDataTable = `table[id-groupe=DIV_GROUPE${idDataTable}]`;
        this.idTitleDate = idTitleDate;
        this.items = items;
        
        // CONST
        this.GLOBAL_COORD = 13; // global column
        this.ADD_ROW_BUTTON_BASE_ID = "#lien_btnAjLigne_"; // define by Qualios
        this.GLOBAL_COUNT_TABLE_ID = "TABTotal";
        this.GLOBAL_ITEMS_COUNT = "#NBControle";
        
        // DATA TABLE LINES
        this.dataLines = $(`${this.idDataTable} tbody tr`).toArray();
        // DATA TABLE TITLES
        this.tableTitles = []
        $(`${this.idDataTable} thead tr th`).toArray().forEach(
            element => this.tableTitles.push(element.firstChild.textContent)
        );
    }

    /**
     * Get column position with column name
     * 
     * @param {string} idTitle - Column name
     * @returns {number}
     */
    getTitlePosition(idTitle) {
        return this.tableTitles.indexOf(idTitle);
    }

    /**
     * Get table data content of one line by tilte
     * 
     * @param {string} title - Column title
     * @param {object} line - Line wich contains many input
     * @returns {string}
     */
    getLineValueByTitle(title, line) {
        return $(line).find("td").get(this.getTitlePosition(title)).firstChild.textContent;
    }

    /**
     * Get line month
     * 
     * @param {object} line - Line where month is looking for
     * @returns {number}
     */
    lineMonth2number(line) {
        let lineDate = this.getLineValueByTitle(this.idTitleDate, line);
        return lineDate ? Number(lineDate.split("/")[1]) : -1;
    }

    /**
     * Table setting up.
     * Adding a row and a title
     * 
     * @param {string} idDataTable - Table which is setting up id
     * @param {string} title - Row title
     * @return {object} - Table
     */
    setUpTable(idDataTable, title) {
        $(this.ADD_ROW_BUTTON_BASE_ID.concat(idDataTable)).click();
        this.getTableInputByCoord(idDataTable, -1, 0).val(title);
        return $(idDataTable)
    }

    /**
     * Get table input by coordinates
     * 
     * @param {string} tableId - Table id where input is looking for
     * @param {number} lineCoord - Line number
     * @param {number} inputCoord - Column number
     * @returns {object} - Input
     */
    getTableInputByCoord(tableId, lineCoord, inputCoord) {
        let line = $(`#${tableId}_1 tbody tr`).get(lineCoord);
        let input = $(line).find("td input").get(inputCoord);
        return $(input);
    }

    /**
     * Add value to current input field value
     * 
     * @param {object} inputField - Input field where value is added
     * @param {number} value - Value to add
     * @returns {object} - Input value
     */
    addToInputField(inputField, value) {
        inputField.val(Number(inputField.val()) + Number(value));
        return inputField.val();
    }

    /**
     * Counting elements
     * 
     * @param {string} tableId - Table where items is writing
     * @param {number} lineCoord - Line number
     * @param {number} inputCoord - Column number
     * @param {number} value - Value to add
     * @returns {object} - table which has been updated
     */
    countMonthlyAndGlobal(tableId, lineCoord, inputCoord, value) {
        this.addToInputField(this.getTableInputByCoord(tableId, lineCoord, inputCoord), value);
        this.addToInputField(this.getTableInputByCoord(tableId, lineCoord, this.GLOBAL_COORD), value);
        return $(tableId)
    }

    /**
     * Counting global
     */
    fillGlobalCountingTable() {
        // SETUP
        this.items.forEach(item => {
            this.setUpTable(this.GLOBAL_COUNT_TABLE_ID, item.title);
        });

        // COUNTING
        this.dataLines.forEach(line => {
            let monthColumn = this.lineMonth2number(line);

            if (monthColumn > 0) {
                // Count number items by month and global
                this.countMonthlyAndGlobal(this.GLOBAL_COUNT_TABLE_ID, 0, monthColumn, 1);
                // Count global number items by month and global
                this.items.forEach(item => {
                    let lineCoord = this.items.indexOf(item) + 1;
                    this.countMonthlyAndGlobal(this.GLOBAL_COUNT_TABLE_ID, lineCoord, monthColumn, item.number);
                });
            }
        })
    }

    /**
     * Counting specific items
     * 
     * @param {object} item - Item which is added 
     */
    fillItemTable(item) {
        // SETUP
        this.setUpTable(item.id, "% Conformité");

        // COUNTING
        this.dataLines.forEach(line => {
            let monthColumn = this.lineMonth2number(line);
            this.countMonthlyAndGlobal(item.id, 0, monthColumn, this.getLineValueByTitle(item.id, line));
        });

        // PERCENT
        // Here we are starting at 1 because first column contains titles.
        for (let column = 1; column <= 13; column++) {
            let globalItemCount = Number(
                this.getTableInputByCoord(this.GLOBAL_COUNT_TABLE_ID, this.items.indexOf(item) + 1, column).val()
            );
            let resultInput = this.getTableInputByCoord(item.id, 1, column);
            if (globalItemCount > 0) {
                let compliancePercent = 100 - (
                    (100 * Number(this.getTableInputByCoord(item.id, 0, column).val())) / globalItemCount
                ).toFixed(2);
                resultInput.val(compliancePercent);
            } else {
                resultInput.val("N/A");
            }
        }
    }

    /**
     * Main function
     */
    do() {
        // Get all control
        $(this.GLOBAL_ITEMS_COUNT).val(this.dataLines.length);
        // Filling global counters table
        this.fillGlobalCountingTable();
        // Filling items tables
        this.items.forEach(item => this.fillItemTable(item));
    }
}

/**
 * Function to execute items sum
 * 
 * @param {string} idDataTable - Table id where data are stored
 * @param {string} idTitleDate - Column which contains date name
 * @param {Array} items - List of items to sum
 */
function completeTables(idDataTable, idTitleDate, items) {
    DisplayColumns('Row_Items', '1');
    DisplayColumns('Filtres','0');
    setTimeout(_ => {
        let nc = new NonCompliance(idDataTable, idTitleDate, items);
        nc.do();
    }, 3000);
}