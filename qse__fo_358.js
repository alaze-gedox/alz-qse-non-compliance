// ==========================================
// QSE_FO_358
// ==========================================
/**
 * Class to determine dates in document QSE-FO-358
 * 
 * @class Date_QSE_FO_358
 */
class Date_QSE_FO_358 {
    /**
     * Constructor
     */
    constructor() {
        this._YEAR = Number($("#Annee").val());
        this._MONTH = this.#month2str($("#Mois").val());
        this._DATE = new Date(this._YEAR, this._MONTH, 1);
        this.#setup();
    }

    /**
     * Convert month in to string
     * 
     * @param {int} month - value of the month
     * @returns 
     */
    #month2str(month) {
        // TODO: vérifier mois valide
        let monthList = $("#Mois option").map(function() { return $(this).val() }).toArray();
        monthList.shift();
        return Number(monthList.indexOf(month));
    }

    /**
     * Add 0 before number if under 10
     * 
     * @param {int} number - Number to test
     * @returns {string} - Number with 0 before if under 10 or unchanged
     */
    #twoDigitDate(number) {
        return number > 9 ? number.toString() : `0${number}`;
    }

    /**
     * Convert date to string
     * 
     * @param {object} date - to convert
     * @returns {string}
     */
    #date2str(date) {
        return `${this.#twoDigitDate(date.getDate())}/${this.#twoDigitDate(date.getMonth() + 1)}/${date.getFullYear()}`;
    }

    /**
     * Calculate and adding period in input fields
     */
    #setupPeriode() {
        $("#MoisPeriode").val(this.#twoDigitDate(this._DATE.getMonth() + 1));
        [...Array(3).keys()].forEach(number => {
            number++;
            let dateCopy = new Date(this._DATE.getTime());
            dateCopy.setMonth(dateCopy.getMonth() - (number));
            $(`#AnneePeriodeMoins${number}`).val(this.#twoDigitDate(dateCopy.getFullYear()));
            $(`#MoisPeriodeMoins${number}`).val(this.#twoDigitDate(dateCopy.getMonth() + 1));
        });
    }

    /**
     * Calculate and adding date in input fields
     */
    #setupDate() {
        // YEAR
        $("#AnneeN").val(this._YEAR);
        $("#AnneeNMoins1").val(this._YEAR - 1);
        // DATE
        $("#DateDebutAnneeNMoins1").val(this.#date2str(new Date(this._YEAR - 1, 0, 1)));
        $("#DateFinAnneeN").val(this.#date2str(new Date(this._YEAR + 1, 0, 0)));
        // MONTH
        $("#DateDebutMoisN").val(this.#date2str(this._DATE));
        $("#DateFinMoisN").val(this.#date2str(new Date(this._YEAR, this._MONTH + 1, 0)));
    }

    /**
     * Executing setup
     */
    #setup() {
        this.#setupDate();
        this.#setupPeriode();
    }
}

/**
 * Class to calculating touched tables for QSE-FO-358
 * 
 * @class TouchedTable_QSE_FO_358
 */
class TouchedTable_QSE_FO_358 {
    NEW_ROW_TITLE = "Année N-1";
    displayTableId;
    table;
    dashboard;
    dashboardId = "TDBToucheesBrutes";
    monthEquivalent = {
        janvier: 1,
        février: 2,
        mars: 3,
        avril: 4,
        mai: 5,
        juin: 6,
        juillet: 7,
        août: 8,
        septembre: 9,
        octobre: 10,
        novembre: 11,
        décembre: 12
    };

    /**
     * Constructor
     * 
     * @param {string} displayTableId - Touched table id
     */
    constructor(displayTableId) {
        this.displayTableId = displayTableId;
        this.table = $(`#${this.displayTableId}_1`);
        this.dashboard = new Dashboard(this.dashboardId, "Année");
        this.addRow(this.displayTableId);
    }

    /**
     * Get row from destination table with year
     * 
     * @param {int} year - Data row year
     * @returns {int} - 0 if year is the selected year else 1
     */
    getTableRow(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val() != year);
    }
    
    /**
     * Get destination talbe.
     * 
     * @returns {object}
     */
    getTable() {
        return this.table;
    }

    /**
     * Get destination table ID
     * 
     * @returns {string}
     */
    getTableId() {
        return this.displayTableId;
    }
    
    /**
     * Summing each element by month
     */
    sumByMonth() {
        this.dashboard.getLines().forEach(line => {
            let row = $(this.table.find("tbody tr")).toArray()[this.getTableRow(line.getValue(this.dashboard.getColumnIndex("Année")))];
            let input = new Input($($(row).find("input").toArray()[this.monthEquivalent[line.getValue(this.dashboard.getColumnIndex("Mois")).toLowerCase().trim()]]));
            let value = null;
            
            try {
                value = line.getNumericValue(this.dashboard.getColumnIndex("Nombre de touchées brutes"));
            } catch (error) {
                value = 0;
            } finally {
                input.addVal(value);
            }
        });
    }
    
    /**
     * Summing for all month
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
     * Calculating sum
     */
    calculate() {
        this.dashboard.refreshDashboard();
        this.sumByMonth();
        this.sumGlobal();
    }
}
// Adding mixin
Object.assign(TouchedTable_QSE_FO_358.prototype, AddRowMixin);

/**
 * Class to calculate Ponctuality for QSE-FO-358
 * 
 * @class DisplayTablesPonctuality_QSE_FO_358
 */
class DisplayTablesPonctuality_QSE_FO_358 {
    TOUCHED = new TouchedTable_QSE_FO_358("TableauxTouches");
    DAILY = new DailySumTable("TableauxDl", "TDBQuotidien");
    ID_DESTINATION = "TableauxTauxPonctualite";
    table;

    /**
     * Constructor
     */
    constructor() {
        this.table = `#${this.ID_DESTINATION}_1`;
        
        [this.TOUCHED, this.DAILY].forEach(table => {
            // this.#addRow(table.getTableId());
            table.calculate();
        });

        this.addRow(this.ID_DESTINATION);
        this.calculate();
    }
    
    /**
     * Get value from an input in a table
     * 
     * @param {string} table - Table ID
     * @param {int} rowId - Table row number
     * @param {int} inputId - Input number
     * @returns 
     */
    getInputValue(table, rowId, inputId) {
        return $($(table.find("tbody tr").toArray()[rowId]).find("input").toArray()[inputId]).val();
    }
    
    /**
     * Calculate ponctuality
     */
    calculate() {
        let rows = $(this.table).find("tbody tr").toArray();

        for (let rowId = 0; rowId < rows.length; rowId++) {
            let inputs = $(rows[rowId]).find("input").toArray();
            inputs.shift();

            for (let inputId = 0; inputId < inputs.length; inputId++) {
                let touchedValue = Number(this.getInputValue(this.TOUCHED.getTable(), rowId, inputId + 1));
                let dailyValue = Number(this.getInputValue(this.DAILY.getTable(), rowId, inputId + 1));
                let value = ((touchedValue - dailyValue) / touchedValue) * 100;

                $(inputs[inputId]).val(isNaN(value) || !Number.isFinite(value) ? "N/A" : value.toFixed(2));
            }
        };
    }
}
Object.assign(DisplayTablesPonctuality_QSE_FO_358.prototype, AddRowMixin);


/**
 * Function to calculate data in document QSE-FO-358
 */
function exec_QSE_FO_358() {
    new Date_QSE_FO_358();
    new DisplayTablesPonctuality_QSE_FO_358();
    let tablesPercentCompliance = [
        ["TableauxControleOpePassageAnnee", "TableauxControleOpePassageMois", ["TDBControleOpePassage"]],
        ["TableauxControleOpePisteAnnee", "TableauxControleOpePisteMois", ["TDBControleOpePisteParis", "TDBControleOpePisteAF", "TDBControleOpePisteProvince", "TDBControleOpePisteBru"]],
        ["TableauxControleOpeTraficAnnee", "TableauxControleOpeTraficMois", ["TDBControleOpeTrafic", "TDBControleOpeTraficBru", "TDBControleOpeTraficAF"]],
        ["TableauxControleOpeGalerieAnnee", "TableauxControleOpeGalerieMois", ["TDBControleOpeGalerie"]],
    ];
    let tablesSumByMont = [
        ["TableauxInadAnnee", "TDBQuotidienInad"],
    ];
    tablesPercentCompliance.forEach(table => calculatePercentCompliance(table[0], table[1], table[2]));
    tablesSumByMont.forEach(table => calculateSumByMonth(table[0], table[1]));
}