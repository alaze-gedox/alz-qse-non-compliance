// ==========================================
// DATA
// ==========================================
/**
 * Class which represent data line
 */
class Line {
    #line;
    #columnDateIndex;

    /**
     * Constructor
     * 
     * @param {object} line - Line of a dashboard
     * @param {Number} columnDateIndex - Index of column where date is stored 
     */
    constructor(line, columnDateIndex) {
        this.#line = $(line);
        this.#columnDateIndex = columnDateIndex;
    }

    /**
     * Get line date with column index
     * 
     * @param {Number} dateElementIndex 
     * @returns {date}
     */
    #getDateElement(dateElementIndex) {
        let element = this.#line
                .find("td")
                .get(this.#columnDateIndex)
                .firstChild
                .textContent
                .split("/")[dateElementIndex];
                
        if (element == -1) {
            throw new Error("Date element not found");
        }

        return element;
    }

    /**
     * @returns {object} JQuery line
     */
    getLine() {
        return $(this.#line);
    }

    /**
     * @returns {Number} line month
     */
    getMonth() {
        return Number(this.#getDateElement(1));
    }

    /**
     * @returns {Number} line year
     */
    getYear() {
        return Number(this.#getDateElement(2));
    }

    /**
     * @param {Number} columnIndex 
     * @returns {string} line value
     */
    getValue(columnIndex) {
        if (this.#line.find("td").get(columnIndex).firstChild == null) {
            throw Error("Empty value");
        }
        
        return this.#line
            .find("td")
            .get(columnIndex)
            .firstChild
            .textContent;
    }

    /**
     * @param {Number} columnIndex 
     * @returns {string} line value
     */
    getNumericValue(columnIndex) {
        return Number(this.getValue(columnIndex).replace(/\s+/g, ''));
    }
}

/**
 * Class which represent dashboard
 * 
 * @class Dashboard
 */
class Dashboard {
    #id;
    #titles;
    #dateTitle;
    #lines;

    /**
     * Constructor
     * 
     * @param {string} id - Dashboard ID
     * @param {string} dateTitle - Column title where date is stored
     */
    constructor(id, dateTitle) {
        this.#id = `#${id}`;
        this.#dateTitle = dateTitle;
    }
    
    /**
     * Refreshing class content
     */
    #update() {
        this.#titles = Array.from(
            $(this.#id).find("table thead tr th").toArray(),
            title => title.firstChild ? title.firstChild.textContent : null
        );
        this.#lines = Array.from(
            $(this.#id).find("table.LstTableStat tbody tr").toArray(),
            line => new Line(line, this.getColumnIndex(this.#dateTitle))
        );
    }

    /**
     * Get all dashboard line
     * 
     * @returns {object} - All dashboard lines
     */
    getLines() {
        return this.#lines;
    }

    /**
     * Get column index with column title
     * 
     * @param {string} columnTitle - Column title
     * @returns {Number} - Column index
     */
    getColumnIndex(columnTitle) {
        return this.#titles.indexOf(columnTitle);
    }

    /**
     * Refreshing dashboard on page
     */
    refreshDashboard() {
        const URL = `${location.protocol}//${location.host}/servlet/Tbord.AfficheObjetStat`;
        const JQUERY_DASHBOARD = $(this.#id);
        const DASHBOARD_ARGS = calculFiltreObjTbord(JQUERY_DASHBOARD.attr("FILTRE").split("@@;@@"), false, 0, URL);
        const data = {
            NomObj: JQUERY_DASHBOARD.attr("id"),
            Param: JQUERY_DASHBOARD.attr("PARAM"),
            Filtre: DASHBOARD_ARGS[1],
            RelCritereUti: JQUERY_DASHBOARD.attr("RELCRITEREUTI"),
            Orient: JQUERY_DASHBOARD.attr("ORIENTATION"),
            ModCode: JQUERY_DASHBOARD.attr("MODCODE"),
            Op: JQUERY_DASHBOARD.attr("TAG"),
            Refresh: DASHBOARD_ARGS[0],
            detectDansLappli: detectDansLappli(),
            UtiCode: jQueryAppli.find("#Uti_UtiCode").val()
        };

        $.ajax({
            url: URL,
            method: "GET",
            headers: {"Content-Type": lFormatURLEncoded},
            data: data,
            async: false
        }).done(response => {
            $(JQUERY_DASHBOARD).html(response);
            this.#update();
        })
    }
}


// =========================================
// TABLE BASE
// =========================================
/**
 * Class which represent destination table input field
 */
class Input {
    #input;
    #max = 0;
    #nc = 0;
    
    /**
     * Constructor 
     * 
     * @param {object} input - Input field
     */
    constructor(input) {
        this.#input = $(input);
    }
    
    /**
     * Adding value to nc
     * 
     * @param {Number} value - Value to add
     */
    addNc(value) {
        this.#nc += value;
    }
    
    /**
     * Adding value to max
     * 
     * @param {Number} value = Value to add
     */
    addMax(value) {
        this.#max += value;
    }
    
    /**
     * Adding value to val
     * 
     * @param {Number} value - Value to add
     */
    addVal(value) {
        this.#input.val(Number(this.#input.val()) + value);
    }

    /**
     * value getter
     * 
     * @returns {Number}
     */
    getVal() {
        return this.#input.val();
    }
    
    /**
     * value setter
     * 
     * @param {Number} value
     */
    setVal(value) {
        this.#input.val(value);
    }
    
    /**
     * max getter
     * 
     * @returns {Number}
     */
    getMax() {
        return this.#max;
    }
    
    /**
     * nc getter
     * 
     * @returns  {Number}
     */
    getNc() {
        return this.#nc;
    }
}

/**
 * Class which represent destination table row
 */
class Row {
    #title;
    #global;
    #inputs = [];

    /**
     * Constructor
     * 
     * @param {object} row - table row
     */
    constructor(row) {
        $(row).find("input").toArray().forEach(input => this.#inputs.push(new Input(input)));
        this.#title = this.#inputs.shift();
        this.#global = this.#inputs.pop();
    }

    /**
     * inputs getter
     * 
     * @returns {Array}
     */
    getInputs() {
        return this.#inputs;
    }

    /**
     * Add value to input with column index
     * 
     * @param {Number} column - column index
     * @param {Number} value - value to add
     */
    addInputNc(column, value) {
        let input = this.#inputs[column - 1];
        input.addNc(value);
    }

    /**
     * 
     * @param {*} column 
     * @param {*} value 
     */
    addInputMax(column, value) {
        let input = this.#inputs[column - 1];
        input.addMax(value);
    }
    
    /**
     * Get global input
     * 
     * @returns {object}
     */
    getGlobal() {
        return this.#global;
    }
}


// =========================================
// MIXIN
// =========================================
/**
 * Mixin to add row
 */
let AddRowMixin = {
    addRow(idTable) {
        let table = $(`#${idTable}_1`);
        $(`#lien_btnAjLigne_${idTable}`).click();
        $(table.find("tbody tr").last().find("input").get(0)).val(this.NEW_ROW_TITLE);
    }
}


// =========================================
// GENERIC CALULATING
// =========================================
/**
 * Abstract class to calculate compliance rate
 * 
 * @class PercentTable
 */
class PercentTable {
    /**
     * Constructor
     */
    constructor() {
        // ABSTRACT
        if (this == PercentTable) {
            throw new Error("Abstract class can't be instanciate");
        }
    }

    /**
     * Abstract method to count non compliance
     * 
     * @param {string} dashboard 
     */
    countNc(dashboard) {
        throw new Error("countNc must be implemented");
    }

    /**
     * Abstract method to calculate percent
     */
    calculatePercent() {
        throw new Error("calculatePercent must be implemented");
    }

    /**
     * Calculating percent and storing it in input
     * 
     * @param {object} input - Input where data will be saved
     */
    _getPercent(input) {
        let percent = 100 - ((100 * input.getNc()) / input.getMax());
        input.setVal(!isNaN(percent) ? percent.toFixed(2) : "N/A");
    }

    /**
     * Get destination table
     * 
     * @param {string} id - Table destination id
     * @returns 
     */
    _getTable(id) {
        return $(`#${id}_1`);
    }
}

/**
 * Class to calculate compliance rate on a year
 * 
 * @class AnnualPercentTable
 */
class AnnualPercentTable extends PercentTable {
    #NON_COMPLIANCE_TITLE = "Nombre NC";
    #MAX_NON_COMPLIANCE_TITLE = "NBNC";
    NEW_ROW_TITLE = "Année N-1";
    
    #id;
    #table;
    #rowsByYear;

    /**
     * 
     * @param {string} id - Table id where data are displayed
     */
    constructor(id) {
        super();
        this.#id = id;
        this.#table = this._getTable(id);
        this.addRow(id);
        this.#rowsByYear = {
            selectedYear:         new Row(this.#table.find("tbody tr").first()),
            selectedYearMinusOne: new Row(this.#table.find("tbody tr").last())
        }
    }

    /**
     * Check if year line is selected year
     * 
     * @param {Number} year - year of dashboard selected line
     * @returns {Number}
     */
    #isSelectedYear(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val()) == year;
    }

    /**
     * Get table row with year 
     * 
     * @param {Number} year - year of dashboard selected line
     * @returns {object} - table row
     */
    #getTableRow(year) {
        return this.#isSelectedYear(year) ? this.#rowsByYear.selectedYear : this.#rowsByYear.selectedYearMinusOne;
    }

    /**
     * Counting all non-compliance for a dashboard
     * 
     * @param {object} dashboard - dashboard objects
     */
    countNc(dashboard) {
        dashboard.getLines().forEach(line => {
            let maxNonCompliance = Number(
                line.getLine().find(`td[title='${this.#MAX_NON_COMPLIANCE_TITLE}']`)
                    .get(0)
                    .firstChild.textContent
            );
            let monthColumn = line.getMonth();
            let row = this.#getTableRow(line.getYear());
            let lineValue = line.getNumericValue(dashboard.getColumnIndex(this.#NON_COMPLIANCE_TITLE));
            
            if (0 < monthColumn && monthColumn < 13 && lineValue > 0) {
                row.addInputNc(monthColumn, lineValue);
                row.getGlobal().addNc(lineValue);
            }
            row.addInputMax(monthColumn, maxNonCompliance);
            row.getGlobal().addMax(maxNonCompliance)
        })
    }

    /**
     * Calculate percent for each input
     */
    calculatePercent() {
        Object.keys(this.#rowsByYear).forEach(key => {
            let row = this.#rowsByYear[key];

            // Percent by month
            row.getInputs().forEach(input => {
                this._getPercent(input);
            })

            this._getPercent(row.getGlobal());
        });
    }
}
Object.assign(AnnualPercentTable.prototype, AddRowMixin);

/**
 * Class to calculate compliance rate for the selected month
 * 
 * @class MonthlyPercentTable
 * @extend PercentTable
 */
class MonthlyPercentTable extends PercentTable {
    #table;
    #complianceInput;
    #inputs;
    
    /**
     * Constructor
     * 
     * @param {string} id - table id
     */
    constructor(id) {
        super();
        this.#table = this._getTable(id);

        let tableInputs = this.#table.find("tbody input").toArray();
        tableInputs.shift();

        this.#complianceInput = new Input(tableInputs.shift());
        this.#inputs = [
            {
                dataColumn: "NC SST",
                maxColumn:  "NBSST",
                input:      new Input(tableInputs.shift())
            },
            {
                dataColumn: "NC Sûreté",
                maxColumn:  "NBSUR",
                input:      new Input(tableInputs.shift())
            },
            {
                dataColumn: "NC sécurité",
                maxColumn:  "NBSEC",
                input:      new Input(tableInputs.shift())
            },
            {
                dataColumn: "NC Réalisation",
                maxColumn:  "NBREA",
                input:      new Input(tableInputs.shift())
            },
            {
                dataColumn: "Nombre NC",
                maxColumn:  "NBNC",
                input:      new Input(tableInputs.shift())
            }
        ]
    }

    /**
     * Counting non compliance for the selected month by non compliance type
     * 
     * @param {object} dashboard - source dashboard
     */
    countNc(dashboard) {
        dashboard.getLines().forEach(line => {
            if (
                Number(line.getMonth()) == Number($("#MoisPeriode").val())
                && Number(line.getYear()) == Number($("#Annee").val())
            ) {
                this.#complianceInput.addVal(1);
                this.#inputs.forEach(input => {
                    input.input.addNc(line.getNumericValue(dashboard.getColumnIndex(input.dataColumn)));
                    input.input.addMax(line.getNumericValue(dashboard.getColumnIndex(input.maxColumn)));
                })
            }
        });
    }

    /**
     * Calculating compliance rate by non compliance type for the selected month 
     */
    calculatePercent() {
        this.#inputs.forEach(input => {
            this._getPercent(input.input);
        })
    }
}

/**
 * Class to calculate compliance rate by month for a year and by non compliance type for the selected month
 * 
 * @class DisplayAnnualMonthlyPercentTables
 */
class DisplayAnnualMonthlyPercentTables {
    #DATE_TITLE = "Date";
    #annual;
    #monthly;
    #dashboards;

    /**
     * Constructor
     * 
     * @param {string} idAnnual - Annual table ID
     * @param {string} idMonthly - Monthly table ID
     * @param {string} dashboardIds - Data dashboards ID
     */
    constructor(idAnnual, idMonthly, dashboardIds) {
        this.#annual = new AnnualPercentTable(idAnnual);
        this.#monthly = new MonthlyPercentTable(idMonthly);
        this.#dashboards = Array.from(dashboardIds, dashboardId => new Dashboard(dashboardId, this.#DATE_TITLE));
    }

    /**
     * Calculating compliance rate
     */
    calculate() {
        this.#dashboards.forEach(dashboard => {
            dashboard.refreshDashboard()
            // optimisation: parcourir ligne ici (et envoyer data au lieu de dashboard ?)
            this.#annual.countNc(dashboard);
            this.#monthly.countNc(dashboard);
        })

        this.#annual.calculatePercent();
        this.#monthly.calculatePercent();
    }
}
/**
 * Function to calculate compliance rate by month for a year and by non compliance type for the selected month
 * 
 * @param {string} idAnnual - Annual table ID
 * @param {string} idMonthly - Monthly table ID
 * @param {string} dashboardIds - Data dashboards ID
 */
function calculatePercentCompliance(idAnnual, idMonthly, dashboardIds) {
    let dampt = new DisplayAnnualMonthlyPercentTables(idAnnual, idMonthly, dashboardIds);
    dampt.calculate();
}

/**
 * Class to sum non compliance
 * 
 * @class DailySumTable
 */
class DailySumTable {
    ID_DESTINATION; 
    ID_SOURCE;
    STATUS_COL_NAME = "Statut";
    STATUS_VALUE = "Retard retenu";
    table;
    dashboard;
    NEW_ROW_TITLE = "Année N-1";
    
    /**
     * Constructor
     * 
     * @param {string} idDestination - table ID where data are displayed
     * @param {string} idSource - Dashboard ID
     */
    constructor(idDestination, idSource) {
        this.ID_DESTINATION = idDestination;
        this.ID_SOURCE = idSource;
        this.table = $(`#${this.ID_DESTINATION}_1`);
        this.dashboard = new Dashboard(this.ID_SOURCE, "Date de l'événement");
        this.addRow(this.ID_DESTINATION);
    }
    
    /**
     * Table ID getter
     * 
     * @returns {string}
     */
    getTableId() {
        return this.ID_DESTINATION;
    }
    
    /**
     * Table getter
     * 
     * @returns {object}
     */
    getTable() {
        return this.table;
    }
    
    /**
     * Get table row where data must be wrote
     * 
     * @param {Numner} year - Dashboard line year
     * @returns table row where data must be write
     */
    getTableRow(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val() != year);
    }
    
    /**
     * Summing non compliance by month
     */
    sumMonthly() {
        this.dashboard.getLines().forEach(line => {
            let row = $(this.table.find("tbody tr")).toArray()[this.getTableRow(line.getYear())];
            let input = new Input($($(row).find("input").toArray()[line.getMonth()]));

            // if (line.getValue(this.dashboard.getColumnIndex(this.STATUS_COL_NAME)) == this.STATUS_VALUE) {
                input.addVal(1);
            // }
        })
    }

    /**
     * Summing all month
     */
    sumGlobal() {
        $(this.table.find("tbody tr")).toArray().forEach(row => {
            let inputs = $(row).find("input");

            let listOfInputs = inputs.toArray();
            listOfInputs.shift();
            listOfInputs.pop();

            inputs.last().val(
                Array.from(listOfInputs, input => Number($(input).val())).reduce((a, b) => {return a + b})
            );
        });
    }

    /**
     * Executing sum
     */
    calculate() {
        this.dashboard.refreshDashboard();
        this.sumMonthly();
        this.sumGlobal();
    }
}
Object.assign(DailySumTable.prototype, AddRowMixin);
/**
 * Function to sum non compliance
 * 
 * @param {string} idDestination - Table ID
 * @param {string} idSource - Dashboard ID
 */
function calculateSumByMonth(idDestination, idSource) {
    let dst = DailySumTable(idDestination, idSource);
    dst.calculate();
}


// ==========================================
// UTILS
// ==========================================
/**
 * Disable dashboard autoreload when input value is changed
 * 
 * @param {object} input 
 */
function disableOneAutoRefresh(input) {
    input.attr("refresh_obj_tbord", "KO");
}

/**
 * Disable dashboard autoreload for an input list
 *  
 * @param {object} inputs 
 */
function disableManyAutoRefresh(inputs) {
    $('[typeliste="ListePaginee"]').toArray().forEach(input => disableOneAutoRefresh($(input)));
}