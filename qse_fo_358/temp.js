function RefreshTousLesObjTBord(pUrl){
	var tabOBJTB = jQueryAppli.find("div[name='QUALIOS_OBJTDB']");

	for (var tabindice=0; tabindice<tabOBJTB.length; tabindice++) {
		if (
			tabOBJTB[tabindice].style.backgroundImage.indexOf("p_statistique") != -1
			&& tabOBJTB[tabindice].innerHTML.indexOf("flower.gif") == -1
		) {
			tabOBJTB[tabindice].style.backgroundImage="";
			tabOBJTB[tabindice].style.borderStyle="none";
			tabOBJTB[tabindice].style.borderWidth="0px";
			tabOBJTB[tabindice].style.width="100%";
			tabOBJTB[tabindice].style.height=""
		}
		tabOBJTB[tabindice].innerHTML="<IMG src='"+pUrl+jQueryAppli.find("#HidCheminIMG").val()+"/flower.gif'>"
	}

	if(tabOBJTB.length != 0) {
		AfficheObjTBord(tabOBJTB[0], pUrl + "servlet/Tbord.AfficheObjetStat", false, tabOBJTB, 0)
	}
}


function AfficheObjTBord(pCalque, url, pFirstTime, pTabCalque, pIndiceCalque) {
	if (pCalque.style.backgroundImage.indexOf("p_statistique") != -1 && pCalque.innerHTML.indexOf("flower.gif") == -1 && pFirstTime == true) {
		pCalque.style.backgroundImage="";
		pCalque.style.borderStyle="none";
		pCalque.style.borderWidth="0px";
		pCalque.style.width="100%";
		pCalque.style.height="";
		pCalque.innerHTML="<IMG src='"+url.split("servlet")[0] + jQueryAppli.find("#HidCheminIMG").val() + "/flower.gif'>"
	}

	var xhr_object = null;

	if (window.XMLHttpRequest) {
		xhr_object = new XMLHttpRequest()
	} else {
		if (window.ActiveXObject) {
			xhr_object = new ActiveXObject("Microsoft.XMLHTTP")
		}
	}

	xhr_object.open("POST", url, true);
	xhr_object.onreadystatechange = function() {
		if (xhr_object.readyState == 4) {
			pCalque.innerHTML = xhr_object.responseText;
			var x = pCalque.getElementsByTagName("script");

			for (var i=0; i<x.length; i++) {
				window.eval(x[i].text)
			}

			if (pCalque.style.width == "") {
				var lStrCalqueId = pCalque.id.replace(/\s+/g,"_");
				lStrCalqueId = lStrCalqueId.replace(/[^a-zA-Z0-9]/g,"_");
	
				if (documentAppli.getElementById("TAB_OBJSTAT"+lStrCalqueId).width != "100%") {
					$(pCalque).css("width", $("#TAB_OBJSTAT"+lStrCalqueId).css("width")+5)
				}
			}

			NB_OBJTBORD_CHARGE = NB_OBJTBORD_CHARGE + 1;
	
			if(jQueryAppli.find("div[name='QUALIOS_OBJTDB']").length <= NB_OBJTBORD_CHARGE) {
				try{
					CacheVoileChargement(true)
				} catch(e) {}
			}

			if(detectDansLappli()) {
				$("for-viewer-content .ConteneurDocument", documentAppli).data("manageTdbChart")(pCalque)
			}
		}
	};

	if (pTabCalque != undefined) {
		if (pIndiceCalque + 1 < pTabCalque.length) {
			AfficheObjTBord(pTabCalque[pIndiceCalque + 1], url, undefined, pTabCalque, pIndiceCalque+1)
		}
	}

	var cFiltre = pCalque.getAttribute("FILTRE");
	var cRelCritereUti = "";

	if (pCalque.getAttribute("RELCRITEREUTI") != null && pCalque.getAttribute("RELCRITEREUTI") != "") {
		cRelCritereUti = "&RelCritereUti=" + pCalque.getAttribute("RELCRITEREUTI")
	}

	var cOrientation = pCalque.getAttribute("ORIENTATION");
	var TabFiltre=cFiltre.split("@@;@@");
	cFiltre="";
	var cAfficheRefresh=0;
	var lTabResult = calculFiltreObjTbord(TabFiltre, pFirstTime, cAfficheRefresh, url);
	cAfficheRefresh = lTabResult[0];
	cFiltre = lTabResult[1];
	xhr_object.setRequestHeader("Content-Type",lFormatURLEncoded);
	xhr_object.send(
        "NomObj=" + EncodeParametres(pCalque.id)
        + "&Param=" + EncodeParametres(pCalque.getAttribute("PARAM"))
        + "&Filtre=" + EncodeParametres(cFiltre) + cRelCritereUti
        + "&Orient=" + EncodeParametres(cOrientation)
        + "&ModCode=" + EncodeParametres(pCalque.getAttribute("MODCODE"))
        + "&Op=" + EncodeParametres(pCalque.getAttribute("TAG"))
        + "&Refresh=" + EncodeParametres(cAfficheRefresh)
        + "&detectDansLappli=" + detectDansLappli()
        + "&UtiCode=" + jQueryAppli.find("#Uti_UtiCode").val())
}



function refreshDashboard(dashboard) {
	const URL = `${location.protocol}//${location.host}/servlet/Tbord.AfficheObjetStat`;
	const DASHBOARD_ARGS = calculFiltreObjTbord(dashboard.getAttribute("FILTRE").split("@@;@@"), false, 0, URL);

	var data = {
		NomObj: dashboard.id,
		Param: dashboard.getAttribute("PARAM"),
		Filtre: DASHBOARD_ARGS[1],
		RelCritereUti: dashboard.getAttribute("RELCRITEREUTI"),
		Orient: dashboard.getAttribute("ORIENTATION"),
		ModCode: dashboard.getAttribute("MODCODE"),
		Op: dashboard.getAttribute("TAG"),
		Refresh: DASHBOARD_ARGS[0],
		detectDansLappli: detectDansLappli(),
		UtiCode: jQueryAppli.find("#Uti_UtiCode").val()
	}
	
	$.ajax({
		url: URL,
		method: "GET",
		headers: {"Content-Type": lFormatURLEncoded},
		data: data,
	}).done(response => {
		$(dashboard).html(response);
	})
}

// https://qualios.ast.aero/servlet/Tbord.AfficheObjetStat
// ?NomObj=TDBControleOpeGalerie&Param=&Filtre=%2D1%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%40TRI%2DFO%2D059%21%2E%21datedesaisie%40%40%3B%40%405%40%40%3B%40%4001%2F01%2F2021%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%402%40%40%3B%40%400%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%40TRI%2DFO%2D059%21%2E%21datedesaisie%40%40%3B%40%404%40%40%3B%40%4031%2F12%2F2022%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%402%40%40%3B%40%400%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%40TRI%2DFO%2D059%21%2E%21compagnie%40%40%3B%40%400%40%40%3B%40%40%5BTous%5D%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%400%40%40%3B%40%400%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%40TRI%2DFO%2D059%21%2E%21Entite%40%40%3B%40%400%40%40%3B%40%40%5BTous%5D%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%400%40%40%3B%40%400%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%40TRI%2DFO%2D059%21%2E%21Plateforme%40%40%3B%40%400%40%40%3B%40%40%5BTous%5D%40%40%3B%40%40%3CNULL%3E%40%40%3B%40%400%40%40%3B%40%40&RelCritereUti=2&Orient=1&ModCode=691&Op=1&Refresh=1&detectDansLappli=false&UtiCode=5638


// "NomObj=" + EncodeParametres(pCalque.id) + "&Param=" + EncodeParametres(pCalque.getAttribute("PARAM")) + "&Filtre=" + EncodeParametres(cFiltre) + cRelCritereUti + "&Orient=" + EncodeParametres(cOrientation) + "&ModCode=" + EncodeParametres(pCalque.getAttribute("MODCODE")) + "&Op=" + EncodeParametres(pCalque.getAttribute("TAG")) + "&Refresh=" + EncodeParametres(cAfficheRefresh) + "&detectDansLappli=" + detectDansLappli() + "&UtiCode=" + jQueryAppli.find("#Uti_UtiCode").val()