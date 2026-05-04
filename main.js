// Tatimi progresiv
function llogaritTatimin(paga) {
    let tatimi = 0;

    if (paga > 450) {
        tatimi += (paga - 450) * 0.10;
        paga = 450;
    }
    if (paga > 250) {
        tatimi += (paga - 250) * 0.08;
        paga = 250;
    }
    if (paga > 80) {
        tatimi += (paga - 80) * 0.04;
    }

    return tatimi;
}

// Bruto → Neto
function brutoNeNeto() {
    let bruto = parseFloat(document.getElementById("amount").value);

    if (isNaN(bruto)) return;

    let kontributi = bruto * 0.05;
    let pagaTatueshme = bruto - kontributi;
    let tatimi = llogaritTatimin(pagaTatueshme);
    let neto = bruto - kontributi - tatimi; 

    document.getElementById("PagaBruto").innerText =
        `€${bruto.toFixed(2)}`;
    document.getElementById("KontributiPunetori").innerText =
        `€${kontributi.toFixed(2)}`;
    document.getElementById("result").innerText =
        `Neto: €${neto.toFixed(2)} | Tatimi: €${tatimi.toFixed(2)} | Kontributi: €${kontributi.toFixed(2)}`;
}

// Neto → Bruto (iterative)
function netoNeBruto() {
    let neto = parseFloat(document.getElementById("amount").value);
    if (isNaN(neto)) return;

    let bruto = neto;

    // përafrim me iterim
    for (let i = 0; i < 100; i++) {
        let kontributi = bruto * 0.05;
        let pagaTatueshme = bruto - kontributi;
        let tatimi = llogaritTatimin(pagaTatueshme);
        let kalkuluarNeto = bruto - kontributi - tatimi;

        let diferenca = neto - kalkuluarNeto;
        bruto += diferenca;
    }

    let kontributi = bruto * 0.05;
    let tatimi = llogaritTatimin(bruto - kontributi);

    document.getElementById("PagaBruto").innerText =
        `€${bruto.toFixed(2)}`;
    document.getElementById("result").innerText =
        `Bruto: €${bruto.toFixed(2)} | Tatimi: €${tatimi.toFixed(2)} | Kontributi: €${kontributi.toFixed(2)}`;
}