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

function displayTables() {
    DisplayColumns('Row_Items', '1');
    DisplayColumns('Filtres','0');
}


/**
 * Abstract class to calculate non compliance
 * 
 * @class NonCompliance
 */
class NonCompliance {
    /**
     * Constructor
     * 
     * @param {string} idDataTable - Data table name
     * @param {string} idTitleDate - Title of date column
     * @param {Array} elements - List of elements to count
     */
    constructor(idDataTable, idTitleDate, elements) {
        // ABSTRACT
        if (this.constructor == NonCompliance) {
            throw new Error("Abstract class can't be instanciate");
        }

        this.idDataTable = `table[id-groupe=DIV_GROUPE${idDataTable}]`;
        this.idTitleDate = idTitleDate;
        this.elements = elements;
        
        // CONST
        this.GLOBAL_COORD = 13; // global column
        this.ADD_ROW_BUTTON_BASE_ID = "#lien_btnAjLigne_"; // define by Qualios
        this.GLOBAL_COUNT_TABLE_ID = "TABTotal";
        this.GLOBAL_ITEMS_COUNT = "#NBControle";
        this.TITLE_COMPLIANCE_PERCENT = "% Conformité";
        
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
     * Counting elements on the same table
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

        return $(tableId);
    }

    /**
     * Calculating compliance percent 
     * 
     * @param {object} nonComplianceInputField - Field where is stored non compliance number
     * @param {object} globalCounterInputField - Field where is stored global element counter
     * @returns {any} Percent which has beend calculated
     */
    calculateCompliancePercent(nonComplianceInputField, globalCounterInputField) {
        let percent = "N/A";
        let nonComplianceValue = Number(nonComplianceInputField.val());
        let globalComplianceValue = Number(globalCounterInputField.val());

        if (globalComplianceValue > 0) {
            percent = 100 - (
                (100 * nonComplianceValue) / globalComplianceValue
            ).toFixed(2);
        }

        return percent;
    }

    /**
     * Main function
     */
     do() {
        // Get all control
        $(this.GLOBAL_ITEMS_COUNT).val(this.dataLines.length);
        // Filling global counters table
        this.fillGlobalCounting();
        // Filling items tables
        this.elements.forEach(category => this.fillElementsTables(category));
    }
}

/**
 * Class to count and calculate non compliance by QSE categories
 * 
 * @class NonComplianceByCategories
 * @extends {NonCompliance}
 */
class NonComplianceByCategories extends NonCompliance {
    /**
     * Counting global
     */
    fillGlobalCounting() {
        // SETUP
        this.elements.forEach(category => {
            this.setUpTable(this.GLOBAL_COUNT_TABLE_ID, category.title);
        });

        // COUNTING
        this.dataLines.forEach(line => {
            let monthColumn = this.lineMonth2number(line);

            if (monthColumn > 0) {
                // Count number items by month and global
                this.countMonthlyAndGlobal(this.GLOBAL_COUNT_TABLE_ID, 0, monthColumn, 1);
                // Count global number items by month and global
                this.elements.forEach(category => {
                    let lineCoord = this.elements.indexOf(category) + 1;
                    this.countMonthlyAndGlobal(this.GLOBAL_COUNT_TABLE_ID, lineCoord, monthColumn, category.number)
                });
            }
        })
    }

    /**
     * Counting specific items
     * 
     * @param {object} category - Item which is added 
     */
    fillElementsTables(category) {
        // SETUP
        this.setUpTable(category.id, this.TITLE_COMPLIANCE_PERCENT);

        // COUNTING
        this.dataLines.forEach(line => {
            let monthColumn = this.lineMonth2number(line);
            this.countMonthlyAndGlobal(category.id, 0, monthColumn, this.getLineValueByTitle(category.id, line));
        });

        // PERCENT
        // Here we are starting at 1 because first column contains titles.
        for (let column = 1; column <= 13; column++) {
            this.getTableInputByCoord(category.id, 1, column).val(
                this.calculateCompliancePercent(
                    this.getTableInputByCoord(category.id, 0, column),
                    this.getTableInputByCoord(this.GLOBAL_COUNT_TABLE_ID, this.elements.indexOf(category) + 1, column)
                )
            );
        }
    }
}

/**
 * Function to calls NonComplianceByCategories.do()
 * 
 * @param {string} idDataTable - Table id where data are stored
 * @param {string} idTitleDate - Column which contains date name
 * @param {Array} categories - List of categories to sum
 */
function nonComplianceByCategories(idDataTable, idTitleDate, categories) {
    displayTables();
    setTimeout(_ => {
        let ncbc = new NonComplianceByCategories(idDataTable, idTitleDate, categories);
        ncbc.do();
    }, 3000);
}


/**
 * 
 */
class NonComplianceByItems extends NonCompliance {

    constructor(idDataTable, idTitleDate, elements, nonComplianceValue) {
        super(idDataTable, idTitleDate, elements);
        this.NON_COMPLIANCE_VALUE = nonComplianceValue;
    }

    getGlobalCounterInput(month) {
        return $(`month${month}Counter`);
    }

    fillGlobalCountingTable() {
        this.dataLines.forEach(line => {
            let month = this.lineMonth2number(line);

            if (month > 0) {
                this.addToInputField(this.getGlobalCounterInput(month), 1);
            }
        });
    }

    fillElementsTables(item) {
        // SETUP TABLE
        this.setUpTable(item.id, this.TITLE_COMPLIANCE_PERCENT);

        // COUNTING NON COMPLIANCE
        this.dataLines.forEach(line => {
            if (this.getLineValueByTitle(item.table, line) == this.NON_COMPLIANCE_VALUE) {
                let month = this.lineMonth2number(line);
                this.countMonthlyAndGlobal(item.id, 0, month, 1);
            }
        });

        // PERCENT COMPLIANCE
        for (let column = 1; column <= 13; column++) {
            this.getTableInputByCoord(item.id, 1, column).val(
                this.calculateCompliancePercent(
                    this.getTableInputByCoord(item.id, 0, column),
                    this.getGlobalCounterInput(column)
                )
            );
        }
    }
}

/**
 * 
 * @param {*} idDataTable 
 * @param {*} idTitleDate 
 * @param {*} items 
 * @param {*} nonComplianceValue 
 */
function nonComplianceByItems(idDataTable, idTitleDate, items, nonComplianceValue) {
    displayTables();
    setTimeout(_ => {
        let ncbi = new NonComplianceByItems(idDataTable, idTitleDate, items, nonComplianceValue);
        ncbi.do();
    }, 3000);
}
