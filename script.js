/* ---------------------------------------------------------
   Fenster-App V3.8 — RB-Autoberechnung (Variante A)
   RB wird berechnet, bis der Benutzer es manuell ändert.
---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    function $(id) { return document.getElementById(id); }
    function num(v) { let n = parseFloat(v); return isNaN(n) ? 0 : n; }

    // Eingaben
    const FLB = $("FLB");
    const FLH = $("FLH");
    const UKR_FL = $("UKR_FL");
    const RAM_H_eingabe = $("RAM_H_eingabe");
    const RAM_B_eingabe = $("RAM_B_eingabe");

    // Einstände & Anschlag
    const Einst_L = $("Einst_L");
    const Einst_R = $("Einst_R");
    const Einst_O = $("Einst_O");
    const Einst_U = $("Einst_U");
    const Anschlag_li = $("Anschlag_li");
    const Anschlag_re = $("Anschlag_re");

    // RB + RAM Felder
    const RB_L = $("RB_L");
    const RB_R = $("RB_R");
    const RB_O = $("RB_O");
    const RB_U = $("RB_U");
    const RAM_B = $("RAM_B");
    const RAM_H = $("RAM_H");

    // Defaults setzen
    Einst_L.value = $("def_Einst_L").value;
    Einst_R.value = $("def_Einst_R").value;
    Einst_O.value = $("def_Einst_O").value;
    Einst_U.value = $("def_Einst_U").value;
    $("NRa").value = $("def_NRa").value;

    // Auto-Flags für RB Felder
    RB_L.dataset.auto = "1";
    RB_R.dataset.auto = "1";
    RB_O.dataset.auto = "1";
    RB_U.dataset.auto = "1";

    /* -----------------------------------------------------
       Hauptberechnung RB
    ------------------------------------------------------ */
    function updateRB() {

        let flb = num(FLB.value);
        let flh = num(FLH.value);
        let ukrfl = num(UKR_FL.value);
        let ramB = num(RAM_B_eingabe.value);
        let ramH = num(RAM_H_eingabe.value);

        let eL = num(Einst_L.value);
        let eR = num(Einst_R.value);
        let eO = num(Einst_O.value);
        let eU = num(Einst_U.value);

        let aLi = num(Anschlag_li.value);
        let aRe = num(Anschlag_re.value);

        // Nur berechnen wenn EIN Anschlag fehlt
        if (Anschlag_li.value && !Anschlag_re.value) {
            Anschlag_re.value = ramB - flb - aLi;
        }
        if (Anschlag_re.value && !Anschlag_li.value) {
            Anschlag_li.value = ramB - flb - aRe;
        }

        aLi = num(Anschlag_li.value);
        aRe = num(Anschlag_re.value);

        // RB_L
        if (RB_L.dataset.auto === "1") {
            RB_L.value = ramB - flb - aRe + eL;
        }

        // RB_R
        if (RB_R.dataset.auto === "1") {
            RB_R.value = ramB - flb - aLi + eR;
        }

        // RB_O (Variante A!)
        if (RB_O.dataset.auto === "1") {
            RB_O.value = ramH - ukrfl + eO;
        }

        // RB_U
        if (RB_U.dataset.auto === "1") {
            RB_U.value = ukrfl - flh + eU;
        }

        updateRAM();
    }

    /* -----------------------------------------------------
        RB manuelle Eingabe → Auto-Berechnung NICHT mehr!
    ------------------------------------------------------ */
    [RB_L, RB_R, RB_O, RB_U].forEach(el => {
        el.addEventListener("input", () => {
            el.dataset.auto = "0";
            updateRAM();
        });
    });

    /* -----------------------------------------------------
       RAM Berechnung
    ------------------------------------------------------ */
    function updateRAM() {

        let rbL = num(RB_L.value);
        let rbR = num(RB_R.value);
        let rbO = num(RB_O.value);
        let rbU = num(RB_U.value);

        let flb = num(FLB.value);
        let flh = num(FLH.value);

        let eL = num(Einst_L.value);
        let eR = num(Einst_R.value);
        let eO = num(Einst_O.value);
        let eU = num(Einst_U.value);

        let RL_B = flb - eL - eR;
        let RL_H = flh - eO - eU;

        RAM_B.value = RL_B + rbL + rbR;
        RAM_H.value = RL_H + rbO + rbU;
    }

    /* -----------------------------------------------------
       Events
    ------------------------------------------------------ */
    [
        FLB, FLH, UKR_FL, RAM_H_eingabe, RAM_B_eingabe,
        Einst_L, Einst_R, Einst_O, Einst_U,
        Anschlag_li, Anschlag_re
    ].forEach(el => el.addEventListener("input", updateRB));

    updateRB();
});
