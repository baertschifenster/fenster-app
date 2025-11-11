/* ---------------------------------------------------------
   Fenster-App V3.7 — Korrekte RB-Berechnung (Variante A)
   RB-Werte überschreiben sich NICHT gegenseitig
   RB wird nur gesetzt, wenn das Feld leer ist
---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    // ----- UI-ELEMENTE -----
    const FLB = $("FLB");
    const FLH = $("FLH");
    const UKR_FL = $("UKR_FL");
    const RAM_H_eingabe = $("RAM_H_eingabe");
    const RAM_B_eingabe = $("RAM_B_eingabe");

    const Einst_L = $("Einst_L");
    const Einst_R = $("Einst_R");
    const Einst_O = $("Einst_O");
    const Einst_U = $("Einst_U");

    const Anschlag_li = $("Anschlag_li");
    const Anschlag_re = $("Anschlag_re");

    const RB_L = $("RB_L");
    const RB_R = $("RB_R");
    const RB_O = $("RB_O");
    const RB_U = $("RB_U");

    const RAM_B = $("RAM_B");
    const RAM_H = $("RAM_H");

    // ----- DEFAULTS laden -----
    $("Einst_L").value = $("def_Einst_L").value;
    $("Einst_R").value = $("def_Einst_R").value;
    $("Einst_O").value = $("def_Einst_O").value;
    $("Einst_U").value = $("def_Einst_U").value;
    $("NRa").value    = $("def_NRa").value;

    // ---------------------------------------------------------
    //  Hilfsfunktion
    // ---------------------------------------------------------
    function $(id) {
        return document.getElementById(id);
    }

    function num(v) {
        let n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    // ---------------------------------------------------------
    //  AUTOMATISCHE RB-LOGIK (Variante A)
    // ---------------------------------------------------------

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

        // Nur aus Anschlag berechnen, wenn nur EIN Feld gesetzt ist
        if (Anschlag_li.value && !Anschlag_re.value) {
            Anschlag_re.value = ramB - flb - aLi;
        }
        if (Anschlag_re.value && !Anschlag_li.value) {
            Anschlag_li.value = ramB - flb - aRe;
        }

        aLi = num(Anschlag_li.value);
        aRe = num(Anschlag_re.value);

        // ---- RB L ----
        if (RB_L.value === "" || RB_L.dataset.auto === "1") {
            RB_L.dataset.auto = "1";
            RB_L.value = ramB - flb - aRe + eL;
        }

        // ---- RB R ----
        if (RB_R.value === "" || RB_R.dataset.auto === "1") {
            RB_R.dataset.auto = "1";
            RB_R.value = ramB - flb - aLi + eR;
        }

        // ---- RB O ----
        if (RB_O.value === "" || RB_O.dataset.auto === "1") {
            RB_O.dataset.auto = "1";
            RB_O.value = ramH - ukrfl + eO;
        }

        // ---- RB U ----
        if (RB_U.value === "" || RB_U.dataset.auto === "1") {
            RB_U.dataset.auto = "1";
            RB_U.value = ukrfl - flh + eU;
        }

        updateRAM();
    }

    // Wenn Benutzer RB manuell ändert → NICHT mehr automatisch überschreiben
    [RB_L, RB_R, RB_O, RB_U].forEach(el => {
        el.addEventListener("input", () => {
            el.dataset.auto = "0";
            updateRAM();
        });
    });

    // ---------------------------------------------------------
    //  RAM (Aussenmass) berechnen
    // ---------------------------------------------------------

    function updateRAM() {

        let rbL = num(RB_L.value);
        let rbR = num(RB_R.value);
        let rbO = num(RB_O.value);
        let rbU = num(RB_U.value);

        let flb = num(FLB.value);
        let flh = num(FLH.value);

        // Rahmenlicht
        let RL_B = flb - num(Einst_L.value) - num(Einst_R.value);
        let RL_H = flh - num(Einst_O.value) - num(Einst_U.value);

        // Rahmen Aussen
        RAM_B.value = RL_B + rbL + rbR;
        RAM_H.value = RL_H + rbO + rbU;
    }

    // ---------------------------------------------------------
    //  EVENTS
    // ---------------------------------------------------------

    [FLB, FLH, UKR_FL, RAM_H_eingabe, RAM_B_eingabe,
     Einst_L, Einst_R, Einst_O, Einst_U,
     Anschlag_li, Anschlag_re].forEach(el => {
        el.addEventListener("input", updateRB);
    });

    updateRB();
});
