/* ---------------------------------------------------------
   Fenster-App V3.9 — RB-Autoberechnung mit manueller Freigabe
   - RB-Felder sind standardmässig readonly + auto
   - Für manuelles Editieren muss "Manuell"-Häkchen gesetzt werden
   - Häkchen ausschalten → Feld wieder Auto + neu berechnen
---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  // kleine Helfer
  const $ = id => document.getElementById(id);
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const fmt = v => Number.isFinite(v) ? Math.round((v + Number.EPSILON) * 100) / 100 : 0;

  // Inputs
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

  // RB fields + manual checkboxes
  const RB_L = $("RB_L");
  const RB_R = $("RB_R");
  const RB_U = $("RB_U");
  const RB_O = $("RB_O");

  const RB_L_manual = $("RB_L_manual");
  const RB_R_manual = $("RB_R_manual");
  const RB_U_manual = $("RB_U_manual");
  const RB_O_manual = $("RB_O_manual");

  // RAM display fields (text or inputs depending on your HTML)
  const RAM_B = $("RAM_B");
  const RAM_H = $("RAM_H");

  // defaults initialisieren (aus Haupteinstellungen)
  Einst_L.value = $("def_Einst_L").value;
  Einst_R.value = $("def_Einst_R").value;
  Einst_O.value = $("def_Einst_O").value;
  Einst_U.value = $("def_Einst_U").value;
  $("NRa").value = $("def_NRa").value;

  // initial states: readonly + auto-flag = true (1)
  const setAutoFlag = (el, v) => { el.dataset.auto = v ? "1" : "0"; };
  [RB_L, RB_R, RB_U, RB_O].forEach(r => setAutoFlag(r, true));
  [RB_L, RB_R, RB_U, RB_O].forEach(r => r.readOnly = true);

  // when manual checkbox toggled -> allow editing or switch back to auto
  function setupManualToggle(checkbox, field) {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        // enable manual edit
        field.readOnly = false;
        // mark as manual (don't let auto overwrite)
        setAutoFlag(field, false);
      } else {
        // disable manual edit -> back to auto
        field.readOnly = true;
        setAutoFlag(field, true);
        // recalc immediately to set correct auto-value
        updateRB();
      }
    });
  }
  setupManualToggle(RB_L_manual, RB_L);
  setupManualToggle(RB_R_manual, RB_R);
  setupManualToggle(RB_U_manual, RB_U);
  setupManualToggle(RB_O_manual, RB_O);

  // if user types while checkbox is checked, leave dataset.auto = 0 (already set)
  [RB_L, RB_R, RB_U, RB_O].forEach(el => {
    el.addEventListener("input", () => {
      // only allow manual modifications if corresponding checkbox is checked
      // if user somehow typed while readOnly=false, accept it and keep manual state
      if (el.readOnly === false) {
        setAutoFlag(el, false);
        // update RAM from new manual RB
        updateRAM();
      } else {
        // if readOnly true, ignore user change by restoring auto calculation
        updateRB();
      }
    });
  });

  // Sync Anschlag logic (only one entered)
  function syncAnschlag() {
    const flb = num(FLB.value);
    const ramB = num(RAM_B_eingabe.value);
    const li = Anschlag_li.value.trim();
    const re = Anschlag_re.value.trim();

    if (li !== "" && re === "") {
      Anschlag_re.value = ramB - flb - num(Anschlag_li.value);
      Anschlag_re.disabled = true;
      Anschlag_li.disabled = false;
    } else if (re !== "" && li === "") {
      Anschlag_li.value = ramB - flb - num(Anschlag_re.value);
      Anschlag_li.disabled = true;
      Anschlag_re.disabled = false;
    } else if (li === "" && re === "") {
      Anschlag_li.disabled = false;
      Anschlag_re.disabled = false;
    } else {
      Anschlag_li.disabled = false;
      Anschlag_re.disabled = false;
    }
  }

  // core calculation - calculate RB fields only if auto-flag is set (1)
  function updateRB() {
    const flb = num(FLB.value), flh = num(FLH.value), ukrfl = num(UKR_FL.value);
    const ramB = num(RAM_B_eingabe.value), ramH = num(RAM_H_eingabe.value);
    const eL = num(Einst_L.value), eR = num(Einst_R.value), eO = num(Einst_O.value), eU = num(Einst_U.value);

    // update Anschlag if needed
    syncAnschlag();
    const aLi = num(Anschlag_li.value), aRe = num(Anschlag_re.value);

    // RB_L
    if (RB_L.dataset.auto === "1") {
      // only set if input values are available (ramB and flb meaningful)
      RB_L.value = String((ramB || flb) ? (ramB - flb - aRe + eL) : "");
    }

    // RB_R
    if (RB_R.dataset.auto === "1") {
      RB_R.value = String((ramB || flb) ? (ramB - flb - aLi + eR) : "");
    }

    // RB_O (Variante A)
    if (RB_O.dataset.auto === "1") {
      RB_O.value = String((ramH || ukrfl) ? (ramH - ukrfl + eO) : "");
    }

    // RB_U
    if (RB_U.dataset.auto === "1") {
      RB_U.value = String((ukrfl || flh) ? (ukrfl - flh + eU) : "");
    }

    // update RAM aussen from RB values
    updateRAM();
  }

  function updateRAM() {
    const rbL = num(RB_L.value), rbR = num(RB_R.value), rbU = num(RB_U.value), rbO = num(RB_O.value);
    const flb = num(FLB.value), flh = num(FLH.value);
    const eL = num(Einst_L.value), eR = num(Einst_R.value), eO = num(Einst_O.value), eU = num(Einst_U.value);

    const RL_B = flb - eL - eR;
    const RL_H = flh - eO - eU;

    // Write back to RAM_B / RAM_H (if they are inputs, update their .value; if spans, update textContent)
    if (RAM_B.tagName === "INPUT") RAM_B.value = String(RL_B + rbL + rbR);
    else RAM_B.textContent = String(RL_B + rbL + rbR);

    if (RAM_H.tagName === "INPUT") RAM_H.value = String(RL_H + rbO + rbU);
    else RAM_H.textContent = String(RL_H + rbO + rbU);
  }

  // wire events
  [
    FLB, FLH, UKR_FL, RAM_H_eingabe, RAM_B_eingabe,
    Einst_L, Einst_R, Einst_O, Einst_U,
    Anschlag_li, Anschlag_re
  ].forEach(el => {
    if (el) el.addEventListener("input", updateRB);
  });

  // initial calculation
  updateRB();

  // Optional: expose for console debugging
  window._fenster = { updateRB, updateRAM, RB_L, RB_R, RB_U, RB_O };

});
