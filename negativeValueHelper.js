import updateUI from "./main";

function negativeValue(value) {
     
 if (!value) {
        updateUI({
              bruto: 0, kontributiPunetori: 0, kontributiPunedhensi: 0,
    pagaETatueshme: 0, tatimi1: 0, tatimi2: 0,
        tatimiTotal: 0, neto: 0
       })
        return;
    }
}  


export default negativeValue