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
function getKontributiRate() {
    const input = document.getElementById("kontributi-punetori");
    if (!input) return 5;

    const rawValue = input.value.replace("%", "").trim();
    const parsed = parseFloat(rawValue);
    return isNaN(parsed) ? 5 : parsed;
}

function setKontributiRate(rate) {
    const clamped = Math.max(0, Math.min(100, rate));
    document.getElementById("kontributi-punetori").value = `${clamped}%`;
}

function changeKontributi(delta) {
    setKontributiRate(getKontributiRate() + delta);
}

function increasePunetori() {
    changeKontributi(1);
}

function decreasePunetori() {
    changeKontributi(-1);
}

function getPunedhensiRate() {
    const input = document.getElementById("kontributi-punedhensi");
    if (!input) return 5;

    const rawValue = input.value.replace("%", "").trim();
    const parsed = parseFloat(rawValue);
    return isNaN(parsed) ? 5 : parsed;
}

function setPunedhensiRate(rate) {
    const clamped = Math.max(0, Math.min(100, rate));
    document.getElementById("kontributi-punedhensi").value = `${clamped}%`;
}

function changePunedhensi(delta) {
    setPunedhensiRate(getPunedhensiRate() + delta);
}

function increasePunedhensi() {
    changePunedhensi(1);
}

function decreasePunedhensi() {
    changePunedhensi(-1);
}

// Bruto → Neto
function brutoNeNeto() {
    let bruto = parseFloat(document.getElementById("amount").value);

    if (isNaN(bruto)) return;

    let punetoriRate = getKontributiRate() / 100;
    let punedhensiRate = getPunedhensiRate() / 100;
    let kontributiPunetori = bruto * punetoriRate;
    let kontributiPunedhensi = bruto * punedhensiRate;
    let pagaTatueshme = bruto - kontributiPunetori;
    let tatimi = llogaritTatimin(pagaTatueshme);
    let neto = pagaTatueshme - tatimi; 

    document.getElementById("PagaBruto").innerText =
        `€${bruto.toFixed(2)}`;
    document.getElementById("KontributiPunetori").innerText =
        `€${kontributiPunetori.toFixed(2)}`;
    document.getElementById("KontributiPunedhensi").innerText =
        `€${kontributiPunedhensi.toFixed(2)}`;
    document.getElementById("result").innerText =
        `Neto: €${neto.toFixed(2)} | Tatimi: €${tatimi.toFixed(2)} | Kontributi Punetori: €${kontributiPunetori.toFixed(2)} | Kontributi Punedhensi: €${kontributiPunedhensi.toFixed(2)}`;
}

// Neto → Bruto (iterative)
function netoNeBruto() {
    let neto = parseFloat(document.getElementById("amount").value);
    if (isNaN(neto)) return;

    let bruto = neto;
    let punetoriRate = getKontributiRate() / 100;
    let punedhensiRate = getPunedhensiRate() / 100;

    // përafrim me iterim
    for (let i = 0; i < 100; i++) {
        let kontributiPunetori = bruto * punetoriRate;
        let pagaTatueshme = bruto - kontributiPunetori;
        let tatimi = llogaritTatimin(pagaTatueshme);
        let kalkuluarNeto = pagaTatueshme - tatimi;

        let diferenca = neto - kalkuluarNeto;
        bruto += diferenca;
    }

    let kontributiPunetori = bruto * punetoriRate;
    let kontributiPunedhensi = bruto * punedhensiRate;
    let tatimi = llogaritTatimin(bruto - kontributiPunetori);

    document.getElementById("PagaBruto").innerText =
        `€${bruto.toFixed(2)}`;
    document.getElementById("KontributiPunetori").innerText =
        `€${kontributiPunetori.toFixed(2)}`;
    document.getElementById("KontributiPunedhensi").innerText =
        `€${kontributiPunedhensi.toFixed(2)}`;
    document.getElementById("result").innerText =
        `Bruto: €${bruto.toFixed(2)} | Tatimi: €${tatimi.toFixed(2)} | Kontributi Punetori: €${kontributiPunetori.toFixed(2)} | Kontributi Punedhensi: €${kontributiPunedhensi.toFixed(2)}`;
}

document.getElementById("increase-kontributi")?.addEventListener("click", increasePunetori);
document.getElementById("decrease-kontributi")?.addEventListener("click", decreasePunetori);
document.getElementById("increase-punedhensi")?.addEventListener("click", increasePunedhensi);
document.getElementById("decrease-punedhensi")?.addEventListener("click", decreasePunedhensi);
