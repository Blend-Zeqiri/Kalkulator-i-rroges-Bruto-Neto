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
          tatimi1 : Number(tatimi1.toFixed(2)),
          tatimi2 : Number(tatimi2.toFixed(2)),
          tatimi : Number(tatimi.toFixed(2))
      };

}

function brutoToNeto(){
    let PagaBruto = parseFloat(document.getElementById("paga").value)
  
    let kontributiPunetori = PagaBruto * parseFloat(document.getElementById("kontributi-punetori").value) / 100;
    let kontributiPunedhenesi = PagaBruto * parseFloat(document.getElementById("kontributi-punedhensi").value) / 100;
    let pagaETatueshme = PagaBruto - kontributiPunetori;
    const tatimi = llogaritTatimin(pagaETatueshme);
    const neto = pagaETatueshme - tatimi.tatimi;
    if(PagaBruto >= 0){
        document.getElementById("PagaBruto").textContent =`€${PagaBruto.toFixed(2)}`;
        document.getElementById("KontributiPunetori").textContent =`€${kontributiPunetori.toFixed(2)}`;
        document.getElementById("KontributiPunedhensi").textContent =`€${kontributiPunedhenesi.toFixed(2)}`;
        document.getElementById("PagaETatueshme").textContent =`€${pagaETatueshme.toFixed(2)}`;
        document.getElementById("Tatimi250-450").textContent =`€${tatimi.tatimi1.toFixed(2)}`;
        document.getElementById("Tatimi450+").textContent =`€${tatimi.tatimi2.toFixed(2)}`;
        document.getElementById("TatimiTotal").textContent =`€${tatimi.tatimi.toFixed(2)}`;
        document.getElementById("PagaNeto").textContent =`€${neto.toFixed(2)}`;
    }else{
        document.getElementById("PagaBruto").textContent =`€0.00`;
        document.getElementById("KontributiPunetori").textContent =`€0.00`;
        document.getElementById("KontributiPunedhensi").textContent =`€0.00`;
        document.getElementById("PagaETatueshme").textContent =`€0.00`;
        document.getElementById("Tatimi250-450").textContent =`€0.00`;
        document.getElementById("Tatimi450+").textContent =`€0.00`;
        document.getElementById("TatimiTotal").textContent =`€0.00`;
        document.getElementById("PagaNeto").textContent =`€0.00`;
    };

    
    return{
        KontributiPunetori : Number(kontributiPunetori.toFixed(2)),
        pagaETatueshme : Number(pagaETatueshme.toFixed(2)),
        Tatimi250to450: tatimi.tatimi1,
        Tatimi450up : tatimi.tatimi2,
        Tatimi : tatimi.tatimi,
        PagaNeto : Number(neto.toFixed(2))
    };
}


function netoToBruto(){
    let PagaNeto = parseFloat(document.getElementById("paga").value)
}











const Paga = document.getElementById("paga");

Paga.addEventListener("input", function () {
    brutoToNeto();
});


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

      kontributiBaze.value = value + "%";}
}


document.getElementById("increase-punetori")
  .addEventListener("click", function () {
    increase("kontributi-punetori");
    brutoToNeto();
  });

document.getElementById("decrease-punetori")
  .addEventListener("click", function () {
    decrease("kontributi-punetori");
    brutoToNeto();
  });
document.getElementById("increase-punedhensi")
  .addEventListener("click", function () {
    increase("kontributi-punedhensi");
    brutoToNeto();
  });

document.getElementById("decrease-punedhensi")
  .addEventListener("click", function () {
    decrease("kontributi-punedhensi");
    brutoToNeto();
  });

const checkboxes = document.querySelectorAll(".only-one");

checkboxes.forEach(box => {
    box.addEventListener("change", function () {
        if (this.checked) {
            checkboxes.forEach(other => {
                if (other !== this) {
                    other.checked = false;
                }
            });
        }
    });
});

const BoxBrutoToNeto = document.getElementById("BrutoToNeto");
const BoxNetoToBruto = document.getElementById("NetoToBruto");