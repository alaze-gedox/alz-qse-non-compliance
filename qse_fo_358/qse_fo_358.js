function display() {
    /*DisplayColumns('Row_Filtres', '0');*/
    DisplayColumns('Row_Ponctualite', '1');
    DisplayColumns('Row_Securite', '1');
    DisplayColumns('Row_ControleOP', '1');
    DisplayColumns('Row_INAD', '1');
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
    }
}


class QseFoBase {
    _ADD_BUTTON_BASE;
    _idSourceData;
    _idDestinationData;
    _dataLines;
    _dateTitle;
    _dataTitles;

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
        // TABLES
        this._idSourceData = QUALIOS_BASE_TABLE.concat(idSourceData);
        this._idDestinationData = `table#${idDestinationData}_1`;
        this._dataLines = $(this._idSourceData).find("table.LstTableStat tbody tr").toArray();
        // TITLES
        this._dateTitle = dateTitle;
        this._dataTitles = Array.from($(this._idSourceData).find("table thead tr th"), (title, _) => title.firstChild ? title.firstChild.textContent : null);

        if (addLine) {
            this._addTableRow($(this._ADD_BUTTON_BASE.concat(idDestinationData)), newLineTitle);
        }
    }

    _addTableRow(addButton, title) {
        addButton.click();
        $(this._idDestinationData).find("tr").last().find("td input").first().val(title);
    }

    _getTitlePosition(title) {
        return this._dataTitles.indexOf(title);
    }

    _getLineValueByTitle(title, line) {
        return $(line).find("td").get(this._getTitlePosition(title)).firstChild.textContent;
    }

    _getDateElement2Number(line, element) {
        let lineData = this._getLineValueByTitle(this._dateTitle, line);
        return lineData ? Number(lineData.split("/")[element]) : -1;
    }

    _getLineMonth2Number(line) {
        return this._getDateElement2Number(line, 1);
    }

    _getLineYear2Number(line) {
        return this._getDateElement2Number(line, 2);
    }
}


class QseFoCountNC extends QseFoBase {
    #dataId;
    #firstDestinationRow;
    #secondDestinationRow;
    #maxNc;
    #maxNcByMonthByYear;
    
    constructor(idSourceData, ...args) { // idDestinationData, ncColumnTitle) {
        if(!args[0]) {
            throw Error("Missing arguments");
        }

        super(idSourceData, args[0], "Date", true, "Année N-1");

        this.#dataId = !args[1] ? "Nombre NC" : args[1];
        this.#firstDestinationRow = $(this._idDestinationData).find("tbody tr").first();
        this.#secondDestinationRow = $(this._idDestinationData).find("tbody tr").last();
        // MAX NC
        this.#maxNc = Number($(this._dataLines).first().find("td[title='NBNC']").get(0).firstChild.data);
        this.#maxNcByMonthByYear = [Array(12).fill(false), Array(12).fill(false)]
    }

    #isSelectedYear(line) {
        return this._getLineYear2Number(line) == Number($("#AnneeN").val());
    }

    #addToInputField(inputField, value) {
        inputField.val(Number(inputField.val()) + Number(value));
        return inputField.val();
    }

    #getTableInputByCoord(tableId, dataLine, inputCoord) {
        let resultLine = $(tableId).find("tbody tr").get(this.#isSelectedYear(dataLine) ? 0 : 1);
        let input = $(resultLine).find("td input").get(inputCoord);
        return $(input);
    }

    #countNc() {
        this._dataLines.forEach(line => {
            let monthColumn = this._getLineMonth2Number(line);
            let lineValue = Number($(line).find(`td[title='${ this.#dataId }']`).get(0).firstChild.textContent)

            if (monthColumn > 0 && monthColumn < 13 && lineValue > 0) {
                // Only two rows then converting Boolean to Number
                this.#maxNcByMonthByYear[Number(!this.#isSelectedYear(line))][monthColumn - 1] += this.#maxNc;

                if (lineValue > 0) {
                    this.#addToInputField(
                        this.#getTableInputByCoord(this._idDestinationData, line, monthColumn),
                        lineValue
                    );
                }
            }
        });
    }

    #sumNc() {
        [this.#firstDestinationRow, this.#secondDestinationRow].forEach(destination => {
            let ncToSum = Array.from($(destination).find("td input"), (input, _) => Number($(input).val()))
            ncToSum.shift();
            ncToSum.pop();
            $($(destination).find("input")[13]).val((ncToSum.reduce((a,b) => {return a+b})));
        });
    }
    
    #percentNcByMonth() {
        this.#maxNcByMonthByYear.forEach((ncBymonth, yearLine) => {
            let line = yearLine == 0 ? this.#firstDestinationRow : this.#secondDestinationRow;
            ncBymonth.forEach((nc, month) => {
                if (nc) {
                    let input = $(line.find("td input")[month + 1]);
                    input.val(
                        ((Number(input.val()) * 100) / nc).toFixed(2)
                    );
                }
            })
        })
    }
    
    #percentNcByYear() {
        this.#maxNcByMonthByYear.forEach((ncByMonth, yearLine) => {
            let sumNcByMonth = ncByMonth.reduce((a, b) => {return a+b});
            let line = yearLine == 0 ? this.#firstDestinationRow : this.#secondDestinationRow;
            let input = $(line.find("input")[13]);
            $(input).val(
                ((Number(input.val()) * 100) / sumNcByMonth).toFixed(2)
            );
        });
    }

    do() {
        // COUNT AND SUM NC
        this.#countNc();
        this.#sumNc();
        // CALCULATE NC PERCENT
        this.#percentNcByMonth();
        this.#percentNcByYear();
    }
}


function refreshDashboard(dashboard, url) {
    const jqueryDashboard = $(`#${dashboard.id}`);
    const DASHBOARD_ARGS = calculFiltreObjTbord(jqueryDashboard.attr("FILTRE").split("@@;@@"), false, 0, url);
    const data = {
		NomObj: jqueryDashboard.attr("id"),
		Param: jqueryDashboard.attr("PARAM"),
		Filtre: DASHBOARD_ARGS[1],
		RelCritereUti: jqueryDashboard.attr("RELCRITEREUTI"),
		Orient: jqueryDashboard.attr("ORIENTATION"),
		ModCode: jqueryDashboard.attr("MODCODE"),
		Op: jqueryDashboard.attr("TAG"),
		Refresh: DASHBOARD_ARGS[0],
		detectDansLappli: detectDansLappli(),
		UtiCode: jQueryAppli.find("#Uti_UtiCode").val()
	};

    $.ajax({
		url: url,
		method: "GET",
		headers: {"Content-Type": lFormatURLEncoded},
		data: data,
	}).done(response => {
		$(jqueryDashboard).html(response);
        let dashboardClass = eval(`new ${dashboard.klass}("${dashboard.id}", ...${JSON.stringify(dashboard.args)})`);
        dashboardClass.do();
	})
}

function exec() {
    const URL = `${location.protocol}//${location.host}/servlet/Tbord.AfficheObjetStat`;
    const DASHBOARDS = [
        // Somme trafic...
        {
            id: "TDBControleOpeTrafic",
            klass: "QseFoCountNC",
            args: ["TableauxControleOpeTraficAnnee"]
        },
        {
            id: "TDBControleOpePassage",
            klass: "QseFoCountNC",
            args: ["TableauxControleOpePassageAnnee"]
        },
        // Somme Piste...
        {
            id: "TDBControleOpePisteParis",
            klass: "QseFoCountNC",
            args: ["TableauxControleOpePisteAnnee"]
        },
        {
            id: "TDBControleOpeGalerie",
            klass: "QseFoCountNC",
            args: ["TableauxControleOpeGalerieAnnee"]
        },
    ]

    new DateQSE();
    DASHBOARDS.forEach(dashboard => refreshDashboard(dashboard, URL));
}
exec();