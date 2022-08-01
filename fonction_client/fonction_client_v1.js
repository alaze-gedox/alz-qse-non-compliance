// ==========================================
// DATA
// ==========================================
class Line {
    #line;
    #columnDateIndex;

    constructor(line, columnDateIndex) {
        this.#line = $(line);
        this.#columnDateIndex = columnDateIndex;
    }

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

    getLine() {
        return $(this.#line);
    }

    getMonth() {
        return Number(this.#getDateElement(1));
    }

    getYear() {
        return Number(this.#getDateElement(2));
    }

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

    getNumericValue(columnIndex) {
        return Number(this.getValue(columnIndex).replace(/\s+/g, ''));
    }
}


class Dashboard {
    #id;
    #titles;
    #dateTitle;
    #lines;

    constructor(id, dateTitle) {
        this.#id = `#${id}`;
        this.#dateTitle = dateTitle;
    }
    
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
    getLines() {
        return this.#lines;
    }

    getColumnIndex(columnTitle) {
        return this.#titles.indexOf(columnTitle);
    }

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
class Input {
    #input;
    #max = 0;
    #nc = 0;
    
    constructor(input) {
        this.#input = $(input);
    }
    
    addNc(value) {
        this.#nc += value;
    }
    
    addMax(value) {
        this.#max += value;
    }
    
    addVal(value) {
        this.#input.val(Number(this.#input.val()) + value);
    }

    getVal() {
        return this.#input.val();
    }
    
    setVal(value) {
        this.#input.val(value);
    }
    
    getMax() {
        return this.#max;
    }
    
    getNc() {
        return this.#nc;
    }
}

class Row {
    #title;
    #global;
    #inputs = [];

    constructor(row) {
        $(row).find("input").toArray().forEach(input => this.#inputs.push(new Input(input)));
        this.#title = this.#inputs.shift();
        this.#global = this.#inputs.pop();
    }

    getInputs() {
        return this.#inputs;
    }

    addInputNc(column, value) {
        let input = this.#inputs[column - 1];
        input.addNc(value);
    }

    addInputMax(column, value) {
        let input = this.#inputs[column - 1];
        input.addMax(value);
    }
    
    getGlobal() {
        return this.#global;
    }
}

// =========================================
// MIXIN
// =========================================
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
class PercentTable {
    countNc(dashboard) {
        throw new Error("countNc must be implemented");
    }

    calculatePercent() {
        throw new Error("calculatePercent must be implemented");
    }

    _getPercent(input) {
        let percent = 100 - ((100 * input.getNc()) / input.getMax());
        input.setVal(!isNaN(percent) ? percent.toFixed(2) : "N/A");
    }

    _getTable(id) {
        return $(`#${id}_1`);
    }
}

class AnnualPercentTable extends PercentTable {
    #NON_COMPLIANCE_TITLE = "Nombre NC";
    #MAX_NON_COMPLIANCE_TITLE = "NBNC";
    NEW_ROW_TITLE = "Année N-1";
    
    #id;
    #table;
    #rowsByYear;

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

    // #addRow(id, rowTitle) {
    //     $(`#lien_btnAjLigne_${this.#id}`).click();
    //     $(this.#table.find("tbody tr").last().find("input").get(0)).val(rowTitle);
    // }

    #isSelectedYear(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val()) == year;
    }

    #getTableRow(year) {
        return this.#isSelectedYear(year) ? this.#rowsByYear.selectedYear : this.#rowsByYear.selectedYearMinusOne;
    }

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


class MonthlyPercentTable extends PercentTable {
    #table;
    #complianceInput;
    #inputs;
    
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

    calculatePercent() {
        this.#inputs.forEach(input => {
            this._getPercent(input.input);
        })
    }
}

class DisplayAnnualMonthlyPercentTables {
    #DATE_TITLE = "Date";
    #annual;
    #monthly;
    #dashboards;

    constructor(idAnnual, idMonthly, dashboardIds) {
        this.#annual = new AnnualPercentTable(idAnnual);
        this.#monthly = new MonthlyPercentTable(idMonthly);
        this.#dashboards = Array.from(dashboardIds, dashboardId => new Dashboard(dashboardId, this.#DATE_TITLE));
    }

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
function calculatePercentCompliance(idAnnual, idMonthly, dashboardIds) {
    let dampt = new DisplayAnnualMonthlyPercentTables(idAnnual, idMonthly, dashboardIds);
    dampt.calculate();
}


class DailySumTable {
    ID_DESTINATION; 
    ID_SOURCE;
    STATUS_COL_NAME = "Statut";
    STATUS_VALUE = "Retard retenu";
    table;
    dashboard;
    NEW_ROW_TITLE = "Année N-1";
    
    constructor(idDestination, idSource) {
        this.ID_DESTINATION = idDestination;
        this.ID_SOURCE = idSource;
        this.table = $(`#${this.ID_DESTINATION}_1`);
        this.dashboard = new Dashboard(this.ID_SOURCE, "Date de l'événement");
        this.addRow(this.ID_DESTINATION);
    }
    
    getTableId() {
        return this.ID_DESTINATION;
    }
    
    getTable() {
        return this.table;
    }
    
    getTableRow(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val() != year);
    }
    
    sumMonthly() {
        this.dashboard.getLines().forEach(line => {
            let row = $(this.table.find("tbody tr")).toArray()[this.getTableRow(line.getYear())];
            let input = new Input($($(row).find("input").toArray()[line.getMonth()]));

            // if (line.getValue(this.dashboard.getColumnIndex(this.STATUS_COL_NAME)) == this.STATUS_VALUE) {
                input.addVal(1);
            // }
        })
    }

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

    calculate() {
        this.dashboard.refreshDashboard();
        this.sumMonthly();
        this.sumGlobal();
    }
}
Object.assign(DailySumTable.prototype, AddRowMixin);
function calculateSumByMonth(idDestination, idSource) {
    let dst = DailySumTable(idDestination, idSource);
    dst.calculate();
}


// ==========================================
// QSE_FO_358
// ==========================================
class Date_QSE_FO_358 {
    constructor() {
        this._YEAR = Number($("#Annee").val());
        this._MONTH = this.#month2str($("#Mois").val());
        this._DATE = new Date(this._YEAR, this._MONTH, 1);
        this.#setup();
    }

    #month2str(month) {
        let monthList = $("#Mois option").map(function() { return $(this).val() }).toArray();
        monthList.shift();
        return Number(monthList.indexOf(month));
    }

    #twoDigitDate(number) {
        return number > 9 ? number.toString() : `0${number}`;
    }

    #date2str(date) {
        return `${this.#twoDigitDate(date.getDate())}/${this.#twoDigitDate(date.getMonth() + 1)}/${date.getFullYear()}`;
    }

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

    #setup() {
        this.#setupDate();
        this.#setupPeriode();
    }
}

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

    constructor(displayTableId) {
        this.displayTableId = displayTableId;
        this.table = $(`#${this.displayTableId}_1`);
        this.dashboard = new Dashboard(this.dashboardId, "Année");
        this.addRow(this.displayTableId);
    }

    getTableRow(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val() != year);
    }
    
    getTable() {
        return this.table;
    }

    getTableId() {
        return this.displayTableId;
    }
    
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

    calculate() {
        this.dashboard.refreshDashboard();
        this.sumByMonth();
        this.sumGlobal();
    }
}
Object.assign(TouchedTable_QSE_FO_358.prototype, AddRowMixin);


class DisplayTablesPonctuality_QSE_FO_358 {
    TOUCHED = new TouchedTable_QSE_FO_358("TableauxTouches");
    DAILY = new DailySumTable("TableauxDl", "TDBQuotidien");
    ID_DESTINATION = "TableauxTauxPonctualite";
    table;

    constructor() {
        this.table = `#${this.ID_DESTINATION}_1`;
        
        [this.TOUCHED, this.DAILY].forEach(table => {
            // this.#addRow(table.getTableId());
            table.calculate();
        });

        this.addRow(this.ID_DESTINATION);
        this.calculate();
    }
    
    getInputValue(table, rowId, inputId) {
        return $($(table.find("tbody tr").toArray()[rowId]).find("input").toArray()[inputId]).val();
    }
    
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


// ==========================================
// UTILS
// ==========================================
function disableOneAutoRefresh(input) {
    input.attr("refresh_obj_tbord", "KO");
}

function disableManyAutoRefresh(inputs) {
    $('[typeliste="ListePaginee"]').toArray().forEach(input => disableOneAutoRefresh($(input)));
}