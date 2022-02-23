//cncordance entre le numéro de colonne du tableau de bord et le nom du champ à remplir; les 7 premières colonnes ne sont pas récupérées dans ce traitement
const Concord = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "REAPlaceurPresentArriveeAvion",
    "REAEquipePresente",
    "REACEStorno",
    "SECProcedureFOD",
    "SECAbsenceEpandage",
    "SECZECDegagee",
    "SSTGilet",
    "SSTProtectionsAuditives",
    "SSTGantsManutention",
    "SSTChaussuresSecurite",
    "SECVigiesBoutAiles",
    "SECPlacementConformeProcedure",
    "SECPlaceurPouceLeve",
    "SECAgentsAttenteOK",
    "SECCalesTrainsprincipaux",
    "SECPlaceurSigneCommandant",
    "SECCones",
    "SECCalageConforme",
    "SECBalisageConforme",
    "REAMaterielAdapte",
    "SECMaterielBonEtat",
    "REAMaterielQuantiteSuffisante",
    "SECVerifZonesAccostageSoute",
    "SECAnomaliePreventionCoordo",
    "SSTEscabeauTechnique",
    "SECMaterielGuidePositionne",
    "SECMaterielCale",
    "SSTMaterielRambardesAjustees",
    "SECMoteursEteintsFreinEnclenche",
    "REAEscabeauGPU",
    "SECGPUCaleTimonReleve",
    "SECTestFrein",
    "SECVitessePas",
    "SECSensCirculation",
    "SECKlaxonDemarrage",
    "SECAbsencePassageAile",
    "READechargement5MinBlockAvion",
    "REAProcedurePousseteDAARespectee",
    "SURCEVerifieContenuContainers",
    "REATransitSegregationBagages",
    "REARespectOrdrePrioriteBagages",
    "REALivraisonDerniersBagages",
    "SURMaintienIntegriteBagages",
    "SECCamionFretGuide",
    "REAFretRecupTempsImparti",
    "SURMaintienIntegriteFret",
    "SURCELivraisonBagages",
    "SECSoutesVides",
    "SECContainerMauvaisEtatSignal",
    "SECMalfonctionPUDSignal",
    "SECAnomaliesDetecteesSignal",
    "REAFeuilleToucheeRenseignee",
    "SURAgentBadgeApparent",
    "SURAgentAssureBadgeApparant",
];
const ID_TABLE = "#TAB_OBJSTATTDBTEST table[name=TAB_DATA]"

if($(ID_TABLE).length > 0) {
    // var Nblignetdb = $('#TAB_OBJSTATTDBTEST table[name=TAB_DATA]').get(0).rows.length; 
    var dbLineNumber = $(ID_TABLE)[0].rows.length;
    
    for (var i=1; i < dbLineNumber; i++){ 
        for(var j = 7; j<61; j++){
            var item = Concord[j];
            var valItem = $(ID_TABLE).get(0).rows[i].cells[j].innerHTML;
            if(valItem == "N-C") {
                var val = ReturnValue(eval(item));
                SumValue(val, '1', '', '2', '3');
                AssignValue(eval(item), val, '1', '2');
            }
        }
    }
}