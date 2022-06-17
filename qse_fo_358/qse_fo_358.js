function display() {
    /*DisplayColumns('Row_Filtres', '0');*/
    DisplayColumns('Row_Ponctualite', '1');
    DisplayColumns('Row_Securite', '1');
    DisplayColumns('Row_ControleOP', '1');
    DisplayColumns('Row_INAD', '1');
}

function refreshTDB() {
    var serverURL = `${location.protocol}//${location.host}/`;
    RefreshTousLesObjTBord(serverURL);
}


class DateQSE {
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
        refreshTDB();
    }
}


class QseFoBase {
    _ADD_BUTTON_BASE;
    _idSourceData;
    _idDestinationData;
    _dateTitle;

    constructor(idSourceData, idDestinationData, dateTitle, addLine=false, newLineTitle=null) {
        // ABSTRACT
        if (this.constructor == QseFoBase) {
            throw new Error("Abstract class can't be instanciate");
        }
        // TEST ARGS
        if (addLine && !newLineTitle) {
            throw new Error("If \"addLine\" is true, \"newLineTitle\" is required.");
        }

        // CONST
        this._ADD_BUTTON_BASE = "#lien_btnAjLigne_";
        const QUALIOS_BASE_TABLE = "#TAB_OBJSTAT";

        this._idSourceData = QUALIOS_BASE_TABLE.concat(idSourceData);
        this._idDestinationData = `table#${idDestinationData}_1`;
        this._dateTitle = dateTitle;

        if (addLine) {
            this._addTableRow($(this._ADD_BUTTON_BASE.concat(idDestinationData)), newLineTitle);
        }
    }

    _addTableRow(addButton, title) {
        addButton.click();
        $(this.idDestinationData).find("tr").last().find("td input").first().val(title);
    }
}


class QseFoCountNC extends QseFoBase {
    #ncColumnNumber;
    #dataTitles;
    #dataLines;
    #firstDestinationRow;
    #secondDestinationRow;
    
    constructor(idSourceData, idDestinationData, ncColumnTitle) {
        super(idSourceData, idDestinationData, "date", true, "Année N-1");
        this.#ncColumnNumber = this.#getNcColumnNumber(ncColumnTitle);
        this.#dataTitles = Array.from($(`#OBJ_TABSTAT${ this.idSourceData }`), (title, _) => title.firstChild.textContent);
        this.#dataLines = $(this._idSourceData).find("tr").toArray();
        
        this.#firstDestinationRow = $(this._idDestinationData).find("tr").first();
        this.#secondDestinationRow = $(this._idDestinationData).find("tr").last();
    }

    #getTitlePosition(title) {
        return this.#dataTitles.indexOf(title);
    }

    #getNcColumnNumber(ncColumnTitle) {
        var titles = [];
        $(this._idSourceData).find("thead tr th").toArray().forEach(
            title => titles.push(title.firstChild.textContent)
        );
        return titles.indexOf(ncColumnTitle);
    }

    #getLineValueByTitle(title, line) {
        return $(line).find("td").get(this.#getTitlePosition(title)).firstChild.textContent;
    }

    #lineMonth2number(line) {
        let lineData = this.#getLineValueByTitle(this._dateTitle, line);
        return lineData ? Number(lineData.split("/")[1]) : -1;
    }
    
    #isSelectedYear(line) {
        let lineDate = this.#getLineValueByTitle(this._dateTitle, line);
        return lineDate.split("/")[2] == $("#AnneeN");
    }

    #addToInputField(inputField, value) {
        inputField.val(Number(inputField.val()) + Number(value));
        return inputField.val();
    }

    #getTableInputByCoord(tableId, lineCoord, inputCoord) {
        let line = $(tableId).get(lineCoord);
        let input = $(line).find("td input").get(inputCoord);
        return $(input);
    }

    do() {
        this.#dataLines.forEach(line => {
            let monthColumn = this.#lineMonth2number(line);
            let lineValue = line.find("td")[this.#ncColumnNumber].firstChild.textContent;

            if (monthColumn > 0 && monthColumn < 13 && lineValue > 0) {
                this.#addToInputField(
                    this.#getTableInputByCoord(
                        this._idDestinationData,
                        this.#isSelectedYear(line) ? 0 : 1,
                        monthColumn
                    ),
                    1
                );
            }
        });
    }
}

function exec() {
    display();
    new DateQSE();

    // setTimeout(_ => {
        // let ncbc = new QseFoCountNC("TDBControleOpePisteParis", "TableauxControleOpePisteAnnee_1", "");
        // ncbc.do();    
    // }, 15000);

    let boardTables = [
        "TDBToucheesBrutes", "TDBQuotidien", "TDBControleOpePassage",
        "TDBControleOpePisteParis", "TDBControleOpePisteAF", "TDBControleOpePisteProvince",
        "TDBControleOpePisteBru", "TDBControleOpeTrafic", "TDBControleOpeTraficBru",
        "TDBControleOpeTraficAF", "TDBControleOpeGalerie"
    ]

    var allTablesAreNotLoaded = true
    while(allTablesAreNotLoaded) {
        var isLoaded = [];
        boardTables.forEach(tableId => {
            isLoaded.push(Boolean($(`#${ tableId }`).find("table").length));
        });

        if (isLoaded.every(elementIsLoaded => { return elementIsLoaded })) {
            allTablesAreNotLoaded = false;
        } else {
            setTimeout(_ => {}, 5000);
        }
    }
}
exec();