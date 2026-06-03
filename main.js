function llogaritTatimin(Paga){
    let tatimi = 0;
    let tatimi1 = 0;
    let tatimi2 = 0;

    if (Paga <= 250.00) {
        tatimi = 0;
    }
    if (Paga <= 450.00) {
        tatimi1 = (Paga - 250) * 0.08;
        tatimi = tatimi1;
    }
    if (Paga > 450.00) {
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

function brutoToNeto(PagaBruto, kontributiPunetori, kontributiPunedhenesi){
    let kontributiPunetori = PagaBruto * parseFloat(document.getElementById("kontributi-punetori").value) / 100;
    let kontributiPunedhenesi = PagaBruto * parseFloat(document.getElementById("kontributi-punedhensi").value) / 100;
    let pagaETatueshme = PagaBruto - kontributiPunetori;
    const tatimi = llogaritTatimin(pagaETatueshme);
    const neto = pagaETatueshme - tatimi;
    
    return{
        KontributiPunetori : Number(kontributiPunetori.toFixed(2)),
        pagaETatueshme : Number(pagaETatueshme.toFixed(2)),
        Tatimi250to450: tatimi.tatimi1,
        Tatimi450up : tatimi.tatimi2,
        Tatimi : tatimi.tatimi,
        PagaNeto : Number(neto.toFixed(2))
    };
}


const Paga = document.getElementById("paga").value;

function increase(kontributi){
    const kontributiBaze = document.getElementById(kontributi);
    let value = parseFloat(kontributiBaze.value);

    value = value + 1;

    kontributiBaze.value = value + "%";
}

function decrease(kontributi){
    const kontributiBaze = document.getElementById(kontributi);
    let value = parseFloat(kontributiBaze.value);

    value = value - 1;

    kontributiBaze.value = value + "%";
}

