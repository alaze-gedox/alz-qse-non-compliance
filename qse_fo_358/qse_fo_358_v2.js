class Line {
    #line;
    #columnDateIndex;

    constructor(line, columnDateIndex) {
        this.#line = $(line);
        this.#columnDateIndex = columnDateIndex;
    }

    #getDateElement(dateElementIndex) {
        return this.#line[this.#columnDateIndex].split("/")[dateElementIndex];
    }

    getMonth() {
        return this.#getDateElement(1);
    }

    getYear() {
        return this.#getDateElement(2);
    }

    getValue(columnIndex) {
        return this.#line[columnIndex].firstChild.textContent;
    }
}


class Dashboard {
    #id;
    #titles;
    #dateTitle;
    #lines;

    constructor(id, dateTitle) {
        this.#id = id;
        this.#titles = Array.from($(this.#id).find("table thead tr th"), (title, _) => title.firstChild ? title.firstChild.textContent : null);
        this.#dateTitle = dateTitle;
        this.lines = Array.from($(this.#id).find("table.LstTableStat tbody tr").toArray(), (line, _) => new Line(line, this.getColumnIndex(this.#dateTitle)));
    }

    getLines() {
        return this.#lines;
    }

    getColumnIndex(columnIndex) {
        return this.#titles.indexOf(columnIndex);
    }

    refreshDashboard() {
        const URL = `${location.protocol}//${location.host}/servlet/Tbord.AfficheObjetStat`;
        const jqueryDashboard = $(this.#id);
        const DASHBOARD_ARGS = calculFiltreObjTbord(jqueryDashboard.attr("FILTRE").split("@@;@@"), false, 0, URL);
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
}


class DisplayTable {
    _id;
    _dashboards;
    static ADD_ROW_BUTTON_BASE = "#lien_btnAjLigne";
    static QUALIOS_BASE_TABLE = "TAB_OBJSTAT";

    constructor(id, dashboardIds, dateTitle) {
        // ABSTRACT
        if (this.constructor == DisplayTable) {
            throw new Error("Abstract class can't be instanciate");
        }

        this.#id = `table#${id}_1`;
        this.#dashboards = Array.from(
            dashboardIds,
            (dashboardId, _) => new Dashboard(DisplayTable.QUALIOS_BASE_TABLE.concat(dashboardId), dateTitle)
        );
    }

    _getInput(line, column) {
        return $(
            $(this.#id).find("tbody tr").get(line).find("td input").get(column)
        );
    }

    _addInputValue(input, value) {
        input.val(Number(input.val()) + Number(value));
    }

    addRow(newRowTitle) {
        $(DisplayTable.ADD_ROW_BUTTON_BASE.concat(this.#id)).click();
    }
}



class AnnualDisplayTable extends DisplayTable {
    #nonComplianceTitle;
    #maxNonComplianceTitle;
    #maxNonComplianceByMonthByYear;
    #selectedYearRow;
    #selectedYearMinusOneRow;;

    constructor(id, dashboardIds, dateTitle="Date", nonComplianceTitle="Nombre NC", maxNonComplianceTitle="NBNC") {
        super(id, dashboardIds, dateTitle);

        this.#nonComplianceTitle = nonComplianceTitle;
        this.#maxNonComplianceTitle = maxNonComplianceTitle;

        this.#maxNonComplianceByMonthByYear = [Array(12).fill(false), Array(12).fill(false)];

        this.#selectedYearRow = $(this._id).find("tbody tr").first();
        this.#selectedYearMinusOneRow = $(this._id).find("tbody tr").last();
    }

    #isSelectedYear(year) {
        const SELECTED_YEAR_ID = "#Annee";
        return Number($(SELECTED_YEAR_ID).val()) == year;
    }

    countNc() {
        this._dashboards.forEach(dashboard => {
            let maxNonCompliance = Number(
                dashboard.getLines().first().find(`td[title='${ this.#maxNonComplianceTitle }']`).get(0).firstChild.textContent
            );

            dashboard.getLines.forEach(line => {
                let monthColumn = line.getMonth();
                let yearRow = Number(!this.#isSelectedYear(line.getYear()));
                let lineValue = line.getValue(dashboard.getColumnIndex(this.#nonComplianceTitle));
                
                if (0 < monthColumn && monthColumn > 13 && lineValue > 0) {
                    this.#maxNonComplianceByMonthByYear[yearRow][monthColumn - 1] += maxNonCompliance;
                    this._addInputValue(this._getInput(yearRow, monthColumn), lineValue);
                }
            })
        });
    }
}