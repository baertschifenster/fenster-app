/* ---------------------------------------------------------
   Fenster-App V4.0 — geprüfte Berechnungslogik
---------------------------------------------------------- */
(function(){
  const $ = id => document.getElementById(id);
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const show = (id, val) => { $(id).textContent = Number.isFinite(val) ? String(Math.round(val*100)/100) : "–"; };

  function seedDefaults(){
    $("Einst_L").value = $("def_Einst_L").value;
    $("Einst_R").value = $("def_Einst_R").value;
    $("Einst_O").value = $("def_Einst_O").value;
    $("Einst_U").value = $("def_Einst_U").value;
    $("NRa").value     = $("def_NRa").value;
  }
  seedDefaults();

  const RB_L = $("RB_L"), RB_R = $("RB_R"), RB_U = $("RB_U"), RB_O = $("RB_O");
  const RB_L_manual = $("RB_L_manual"), RB_R_manual = $("RB_R_manual"), RB_U_manual = $("RB_U_manual"), RB_O_manual = $("RB_O_manual");
  [RB_L, RB_R, RB_U, RB_O].forEach(el => { el.readOnly = true; el.dataset.auto="1"; });

  function toggleManual(chk, field){
    chk.addEventListener("change", () => {
      if (chk.checked){ field.readOnly = false; field.dataset.auto = "0"; }
      else { field.readOnly = true; field.dataset.auto = "1"; recalc(); }
    });
  }
  toggleManual(RB_L_manual, RB_L);
  toggleManual(RB_R_manual, RB_R);
  toggleManual(RB_U_manual, RB_U);
  toggleManual(RB_O_manual, RB_O);

  [RB_L, RB_R, RB_U, RB_O].forEach(el => el.addEventListener("input", recalc));

  ["FLB","FLH","UKR_FL","RAM_H_eingabe","RAM_B_eingabe",
   "Einst_L","Einst_R","Einst_O","Einst_U","NRa",
   "Anschlag_li","Anschlag_re",
   "Einst_L_over","Einst_R_over","Einst_O_over","Einst_U_over","NRa_over"
  ].forEach(id => { const el = $(id); if (el) el.addEventListener("input", recalc); });

  function effective(overId, defId){
    const over = $(overId)?.value ?? "";
    return over.trim() === "" ? num($(defId).value) : num(over);
  }

  function syncAnschlag(flb, ramB){
    const liEl = $("Anschlag_li"), reEl = $("Anschlag_re");
    const liT = liEl.value.trim(), reT = reEl.value.trim();
    if (liT!=="" && reT===""){ reEl.value = String(ramB - flb - num(liT)); }
    if (reT!=="" && liT===""){ liEl.value = String(ramB - flb - num(reT)); }
  }

  function recalc(){
    const FLB = num($("FLB").value);
    const FLH = num($("FLH").value);
    const UKR_FL = num($("UKR_FL").value);
    const RAM_H_eingabe = num($("RAM_H_eingabe").value);
    const RAM_B_eingabe = num($("RAM_B_eingabe").value);

    const Einst_L = effective("Einst_L_over", "Einst_L");
    const Einst_R = effective("Einst_R_over", "Einst_R");
    const Einst_O = effective("Einst_O_over", "Einst_O");
    const Einst_U = effective("Einst_U_over", "Einst_U");
    const NRa     = effective("NRa_over", "NRa");

    syncAnschlag(FLB, RAM_B_eingabe);
    const Anschlag_li = $("Anschlag_li").value.trim()==="" ? null : num($("Anschlag_li").value);
    const Anschlag_re = $("Anschlag_re").value.trim()==="" ? null : num($("Anschlag_re").value);

    if (RB_L.dataset.auto==="1"){
      const aRe = (Anschlag_re ?? 0);
      RB_L.value = (RAM_B_eingabe || FLB) ? String(RAM_B_eingabe - FLB - aRe + Einst_L) : "";
    }
    if (RB_R.dataset.auto==="1"){
      const aLi = (Anschlag_li ?? 0);
      RB_R.value = (RAM_B_eingabe || FLB) ? String(RAM_B_eingabe - FLB - aLi + Einst_R) : "";
    }
    if (RB_O.dataset.auto==="1"){
      RB_O.value = (RAM_H_eingabe || UKR_FL) ? String(RAM_H_eingabe - UKR_FL + Einst_O) : "";
    }
    if (RB_U.dataset.auto==="1"){
      RB_U.value = (UKR_FL || FLH) ? String(UKR_FL - FLH + Einst_U) : "";
    }

    const RL_B = FLB - Einst_L - Einst_R;
    const RL_H = FLH - Einst_O - Einst_U;

    const rbL = num(RB_L.value), rbR = num(RB_R.value), rbO = num(RB_O.value), rbU = num(RB_U.value);
    const RAM_B = RL_B + rbL + rbR;
    const RAM_H = RL_H + rbO + rbU;

    const RV_zu_Norm = rbO - NRa;

    show("RL_B", RL_B);
    show("RL_H", RL_H);
    show("RAM_B", RAM_B);
    show("RAM_H", RAM_H);
    show("RV_zu_Norm", RV_zu_Norm);
  }

  const photoInput = document.getElementById("photoInput");
  if (photoInput){
    photoInput.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      const prev = document.getElementById("photoPreview");
      if (!f) { if (prev) prev.textContent="Kein Foto"; return; }
      const rd = new FileReader();
      rd.onload = () => { if (prev){ prev.innerHTML = `<img src="${rd.result}" style="width:100%;height:100%;object-fit:cover;">`; } };
      rd.readAsDataURL(f);
    });
  }

  recalc();
})();
