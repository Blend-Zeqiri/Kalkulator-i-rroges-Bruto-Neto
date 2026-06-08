function llogaritTatimin(Paga){
    let tatimi = 0;
    let tatimi1 = 0;
    let tatimi2 = 0;

      if (Paga <= 250.00) {
          tatimi = 0;
      }
      else if (Paga <= 450.00) {
          tatimi1 = (Paga - 250) * 0.08;
          tatimi = tatimi1;
      }
      else if (Paga > 450.00) {
          tatimi1 = 200 * 0.08;
          tatimi2 = (Paga - 450) * 0.10;
          tatimi = tatimi1 + tatimi2;
      }
      
      return {
          tatimi1,
          tatimi2,
          tatimi
      };

}


function brutoToNeto() {
    let bruto = parseFloat(document.getElementById("paga").value);

    if (!bruto || bruto < 0) {
        updateUI({
            bruto: 0, kontributiPunetori: 0, kontributiPunedhensi: 0,
            pagaETatueshme: 0, tatimi1: 0, tatimi2: 0,
            tatimiTotal: 0, neto: 0
        });
        return;
    }

    let kontributiPunetori = bruto * parseFloat(document.getElementById("kontributi-punetori").value) / 100;
    let kontributiPunedhensi = bruto * parseFloat(document.getElementById("kontributi-punedhensi").value) / 100;

    let pagaETatueshme = bruto - kontributiPunetori.toFixed(2);

    const tatimi = llogaritTatimin(pagaETatueshme);
    const neto = pagaETatueshme - tatimi.tatimi;

    updateUI({
        bruto,
        kontributiPunetori,
        kontributiPunedhensi,
        pagaETatueshme,
        tatimi1: tatimi.tatimi1,
        tatimi2: tatimi.tatimi2,
        tatimiTotal: tatimi.tatimi,
        neto
    });
}

function netoToBruto() {
    let targetNeto = parseFloat(document.getElementById("paga").value);

    if (!targetNeto || targetNeto < 0) {
        updateUI({
            bruto: 0, kontributiPunetori: 0, kontributiPunedhensi: 0,
            pagaETatueshme: 0, tatimi1: 0, tatimi2: 0,
            tatimiTotal: 0, neto: 0
        });
        return;
    }

    let low = 0;
    let high = targetNeto * 2;
    let bruto = 0;

    while (high - low > 0.01) {
        bruto = (low + high) / 2;

        let kontributiPunetori = bruto * parseFloat(document.getElementById("kontributi-punetori").value) / 100;
        let pagaETatueshme = bruto - kontributiPunetori.toFixed(2);

        let tatimi = llogaritTatimin(pagaETatueshme);
        let neto = pagaETatueshme - tatimi.tatimi;

        if (neto < targetNeto)
            low = bruto;
        else
            high = bruto;
    }

    let kontributiPunetori = bruto * parseFloat(document.getElementById("kontributi-punetori").value) / 100;
    let kontributiPunedhensi = bruto * parseFloat(document.getElementById("kontributi-punedhensi").value) / 100;
    let pagaETatueshme = bruto - kontributiPunetori.toFixed(2);

    const tatimi = llogaritTatimin(pagaETatueshme);
    const neto = targetNeto;

    updateUI({
        bruto,
        kontributiPunetori,
        kontributiPunedhensi,
        pagaETatueshme,
        tatimi1: tatimi.tatimi1,
        tatimi2: tatimi.tatimi2,
        tatimiTotal: tatimi.tatimi,
        neto
    });
}

function increase(kontributi){
    const kontributiBaze = document.getElementById(kontributi);
    let value = parseFloat(kontributiBaze.value);
    if(value<15){
      value = value + 1;
      kontributiBaze.value = value + "%";
    }
    
}

function decrease(kontributi){
    const kontributiBaze = document.getElementById(kontributi);
    let value = parseFloat(kontributiBaze.value);
    if(value > 5){
      value = value - 1;
      kontributiBaze.value = value + "%";
    }
}


function runCalculator(){
  const BoxBrutoToNeto = document.getElementById("BrutoToNeto");
  const BoxNetoToBruto = document.getElementById("NetoToBruto");
    if (BoxBrutoToNeto.checked) {
      brutoToNeto();
    } else if (BoxNetoToBruto.checked){
      netoToBruto();
    }
}

function updateUI(data) {
    const format = (v) => `€${Number(v).toFixed(2)}`;

    document.getElementById("PagaBruto").textContent = format(data.bruto);
    document.getElementById("KontributiPunetori").textContent = format(data.kontributiPunetori);
    document.getElementById("KontributiPunedhensi").textContent = format(data.kontributiPunedhensi);
    document.getElementById("PagaETatueshme").textContent = format(data.pagaETatueshme);
    document.getElementById("Tatimi250-450").textContent = format(data.tatimi1);
    document.getElementById("Tatimi450+").textContent = format(data.tatimi2);
    document.getElementById("TatimiTotal").textContent = format(data.tatimiTotal);
    document.getElementById("PagaNeto").textContent = format(data.neto);
}

function bind(id, event, action) {
    document.getElementById(id).addEventListener(event, () => {
        action();
        runCalculator();
    });
}


bind("paga", "input", () => {});

bind("increase-punetori", "click", () => increase("kontributi-punetori"));
bind("decrease-punetori", "click", () => decrease("kontributi-punetori"));

bind("increase-punedhensi", "click", () => increase("kontributi-punedhensi"));
bind("decrease-punedhensi", "click", () => decrease("kontributi-punedhensi"));


const checkboxes = document.querySelectorAll(".only-one");

// ensure at least one is checked on load
const ensureOneChecked = () => {
    const anyChecked = [...checkboxes].some(cb => cb.checked);
    if (!anyChecked && checkboxes.length > 0) {
        checkboxes[0].checked = true;
    }
};

checkboxes.forEach(box => {
    box.addEventListener("change", function () {

        // if user tries to uncheck the ONLY checked one → prevent it
        if (!this.checked) {
            const anyOtherChecked = [...checkboxes].some(cb => cb.checked);
            if (!anyOtherChecked) {
                this.checked = true; // force it back on
                return;
            }
        }

        // if user checks one → uncheck all others
        if (this.checked) {
            checkboxes.forEach(other => {
                if (other !== this) other.checked = false;
            });
        }

        runCalculator();
    });
});




