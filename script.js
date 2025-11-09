/* ============================================================
   BÄRTSCHI FENSTER – script.js – V3.2
   • Speicher-Fix (Safari/iPhone)
   • Hellblaue Hervorhebung unterste 4 Werte
   • Foto-Kompression stabilisiert
   • Verbesserte Berechnungslogik
   • PWA kompatibel
   ============================================================ */

const $ = (id) => document.getElementById(id);
const num = (value) => { const n = Number(value); return isFinite(n) ? n : 0; };
const fmt = (value) => (value===null||value===undefined||Number.isNaN(value)) ? "–" : String(Math.round((value+Number.EPSILON)*100)/100);
function showMsg(text, green=true){ const el=$("msg"); el.style.color = green ? "#7be495" : "#ff9e9e"; el.textContent=text; setTimeout(()=> el.textContent="", 3000); }

/* ------------------ Image Handling ------------------ */
function createImage(dataUrl){ return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=rej; img.src=dataUrl; }); }
function dataURLSizeKB(dataUrl){ const b64=(dataUrl.split(",")[1]||""); return Math.ceil((b64.length*3/4)/1024); }
async function resizeAndCompress(dataUrl, maxKB=100){
  const img = await createImage(dataUrl);
  const c = document.createElement("canvas"); c.width=151; c.height=151;
  c.getContext("2d").drawImage(img,0,0,151,151);
  let q=0.92, out=c.toDataURL("image/jpeg", q);
  for(let i=0;i<8 && dataURLSizeKB(out)>maxKB && q>0.4;i++){ q-=0.08; out=c.toDataURL("image/jpeg", q); }
  return out;
}

/* ------------------ Defaults / Overrides ------------------ */
function getDefaults(){ return { L:num($("defL").value), R:num($("defR").value), O:num($("defO").value), U:num($("defU").value), N:num($("defN").value) }; }
function getOverrides(){ const d=getDefaults(); return {
  L: $("ovL").value===""? d.L : num($("ovL").value),
  R: $("ovR").value===""? d.R : num($("ovR").value),
  O: $("ovO").value===""? d.O : num($("ovO").value),
  U: $("ovU").value===""? d.U : num($("ovU").value),
  N: $("ovN").value===""? d.N : num($("ovN").value),
}; }

/* ------------------ Foto UI ------------------ */
let pendingPhoto=null, acceptedPhoto=null;
const cameraInput=$("cameraInput"), photoPreview=$("photoPreview");
cameraInput.addEventListener("change",(ev)=>{
  const f=ev.target.files?.[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ pendingPhoto=rd.result; renderPhotoPreview(pendingPhoto); $("acceptPhoto").disabled=false; $("discardPhoto").disabled=false; };
  rd.readAsDataURL(f);
});
$("acceptPhoto").addEventListener("click",()=>{ if(!pendingPhoto) return; acceptedPhoto=pendingPhoto; showMsg("Foto übernommen."); });
$("discardPhoto").addEventListener("click",()=>{ pendingPhoto=null; acceptedPhoto=null; cameraInput.value=""; renderPhotoPreview(null); $("acceptPhoto").disabled=true; $("discardPhoto").disabled=true; });
function renderPhotoPreview(dataUrl){ photoPreview.innerHTML = dataUrl ? `<img src="${dataUrl}" alt="Foto">` : "Noch kein Foto"; }

/* ------------------ Live-Berechnung ------------------ */
const inputIds=["inFLBreite","inFLHoehe","inUKFutter","inUKOK","inRahmenbreite","inEingabeL","inEingabeR","ovL","ovR","ovO","ovU","ovN","defL","defR","defO","defU","defN"];
inputIds.forEach(id=>{ const el=$(id); if(el) el.addEventListener("input", refreshCalcs); });

function refreshCalcs(){
  const FLB=num($("inFLBreite").value), FLH=num($("inFLHoehe").value), UKF=num($("inUKFutter").value), UKOK=num($("inUKOK").value), RB=num($("inRahmenbreite").value);
  let EingL = $("inEingabeL").value===""? null : num($("inEingabeL").value);
  let EingR = $("inEingabeR").value===""? null : num($("inEingabeR").value);
  const OV=getOverrides();

  if(EingL!==null && EingR===null) EingR = RB - FLB - EingL;
  else if(EingR!==null && EingL===null) EingL = RB - FLB - EingR;

  $("autoEingR").textContent = (EingR===null? "–" : fmt(EingR));
  $("autoEingL").textContent = (EingL===null? "–" : fmt(EingL));

  const RbL = RB - FLB - (EingR??0) + OV.L;
  const RbR = RB - FLB - (EingL??0) + OV.R;
  const RbU = UKF - FLH + OV.U;
  const RbO = UKOK - UKF + OV.O;
  const UeberO = Math.max(0, RbO - OV.N);
  const RlB = FLB - OV.L - OV.R;
  const RlH = FLH - OV.O - OV.U;
  const RaB = RlB + RbL + RbR;
  const RaH = RlH + RbU + RbO;

  $("rbL").textContent=fmt(RbL);
  $("rbR").textContent=fmt(RbR);
  $("rbU").textContent=fmt(RbU);
  $("rbO").textContent=fmt(RbO);
  $("ueberO").textContent=fmt(UeberO);
  $("rlB").textContent=fmt(RlB);
  $("rlH").textContent=fmt(RlH);
  $("raB").textContent=fmt(RaB);
  $("raH").textContent=fmt(RaH);

  return {FLB,FLH,UKF,UKOK,RB,EingL,EingR,RbL,RbR,RbU,RbO,UeberO,RlB,RlH,RaB,RaH};
}
refreshCalcs();

/* ------------------ Speichern einer Position ------------------ */
let nextId=1, position=1; const records=[];
$("saveRow").addEventListener("click", async ()=>{
  if(!acceptedPhoto){ showMsg("Bitte Foto aufnehmen & akzeptieren.", false); return; }
  const vFLB=$("inFLBreite").value.trim(), vFLH=$("inFLHoehe").value.trim(), vUKF=$("inUKFutter").value.trim(), vUKO=$("inUKOK").value.trim(), vRB=$("inRahmenbreite").value.trim();
  if(!vFLB||!vFLH||!vUKF||!vUKO||!vRB){ showMsg("Bitte alle 5 Hauptwerte eingeben.", false); return; }

  const calcs = refreshCalcs();
  const compressed = await resizeAndCompress(acceptedPhoto, 100);

  const record = {
    id: nextId++,
    position: position,
    bemerkung: $("bemerkung").value.trim(),
    photoDataUrl: compressed,
    defaults: getDefaults(),
    overrides: getOverrides(),
    inputs: { FLB:calcs.FLB, FLH:calcs.FLH, UKF:calcs.UKF, UKOK:calcs.UKOK, RB:calcs.RB, EingL:calcs.EingL, EingR:calcs.EingR },
    results: { RbL:calcs.RbL, RbR:calcs.RbR, RbU:calcs.RbU, RbO:calcs.RbO, UeberO:calcs.UeberO, RlB:calcs.RlB, RlH:calcs.RlH, RaB:calcs.RaB, RaH:calcs.RaH }
  };
  records.push(record);

  position++; $("posLabel").textContent=String(position);
  acceptedPhoto=null; pendingPhoto=null; cameraInput.value=""; renderPhotoPreview(null);
  ["inFLBreite","inFLHoehe","inUKFutter","inUKOK","inRahmenbreite","inEingabeL","inEingabeR","bemerkung","ovL","ovR","ovO","ovU","ovN"].forEach(id=>($(id).value=""));
  refreshCalcs(); renderList(); showMsg("Position gespeichert.");
});

/* ------------------ Liste / Bearbeiten ------------------ */
function renderList(){
  const list=$("list");
  if(records.length===0){ list.innerHTML="<i>Keine Positionen erfasst.</i>"; return; }
  list.innerHTML = records.map(r=>{
    const res=r.results;
    return `<div class="rowCard">
      <img src="${r.photoDataUrl}" alt="Foto">
      <div class="rowMeta">
        <div><b>Pos. ${r.position}</b> – ${r.bemerkung||""}</div>
        <div>RL (B×H): ${fmt(res.RlB)} × ${fmt(res.RlH)}</div>
        <div>RA (B×H): ${fmt(res.RaB)} × ${fmt(res.RaH)}</div>
        <div>Links ${fmt(res.RbL)} | Rechts ${fmt(res.RbR)} | Unten ${fmt(res.RbU)} | Oben ${fmt(res.RbO)} (Rahmenverbreiterung ${fmt(res.UeberO)})</div>
      </div>
      <div class="rowActions"><button class="primary" onclick="openEdit(${r.id})">Bearbeiten</button></div>
    </div>`;
  }).join("");
}

const editDialog=$("editDialog"), editPhotoInput=$("editPhotoInput"); let editingId=null;
window.openEdit=(id)=>{
  const r=records.find(x=>x.id===id); if(!r) return;
  editingId=id;
  $("editPreview").innerHTML=`<img src="${r.photoDataUrl}" alt="Foto">`;
  $("eFLB").value=r.inputs.FLB; $("eFLH").value=r.inputs.FLH;
  $("eUKF").value=r.inputs.UKF; $("eUKOK").value=r.inputs.UKOK;
  $("eRB").value=r.inputs.RB; $("eEL").value=r.inputs.EingL??""; $("eER").value=r.inputs.EingR??"";
  $("eL").value=r.overrides.L; $("eR").value=r.overrides.R; $("eO").value=r.overrides.O; $("eU").value=r.overrides.U; $("eN").value=r.overrides.N;
  $("eBem").value=r.bemerkung||"";
  editDialog.showModal();
};
editPhotoInput.addEventListener("change",(e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ $("editPreview").innerHTML=`<img src="${rd.result}">`; $("editPreview").dataset.new=rd.result; };
  rd.readAsDataURL(f);
});
$("deleteBtn").addEventListener("click", ()=>{
  if(editingId==null) return;
  const idx=records.findIndex(x=>x.id===editingId);
  if(idx>=0) records.splice(idx,1);
  editDialog.close(); renderList(); showMsg("Position gelöscht.");
});
$("saveEditBtn").addEventListener("click", async (e)=>{
  e.preventDefault();
  if(editingId==null) return;
  const r=records.find(x=>x.id===editingId); if(!r) return;
  r.inputs.FLB=num($("eFLB").value); r.inputs.FLH=num($("eFLH").value);
  r.inputs.UKF=num($("eUKF").value); r.inputs.UKOK=num($("eUKOK").value);
  r.inputs.RB=num($("eRB").value);
  let ELs=$("eEL").value.trim(), ERs=$("eER").value.trim();
  let EL=ELs===""? null : num(ELs); let ER=ERs===""? null : num(ERs);
  if(EL!==null && ER===null) ER = r.inputs.RB - r.inputs.FLB - EL;
  else if(ER!==null && EL===null) EL = r.inputs.RB - r.inputs.FLB - ER;
  r.inputs.EingL=EL; r.inputs.EingR=ER;
  r.overrides={ L:num($("eL").value), R:num($("eR").value), O:num($("eO").value), U:num($("eU").value), N:num($("eN").value) };
  r.bemerkung=$("eBem").value.trim();

  const S=r.overrides;
  const RbL=(r.inputs.RB - r.inputs.FLB - (r.inputs.EingR??0) + S.L);
  const RbR=(r.inputs.RB - r.inputs.FLB - (r.inputs.EingL??0) + S.R);
  const RbU=(r.inputs.UKF - r.inputs.FLH + S.U);
  const RbO=(r.inputs.UKOK - r.inputs.UKF + S.O);
  const UeberO=Math.max(0, RbO - S.N);
  const RlB=(r.inputs.FLB - S.L - S.R);
  const RlH=(r.inputs.FLH - S.O - S.U);
  const RaB=RlB + RbL + RbR;
  const RaH=RlH + RbU + RbO;
  r.results={ RbL,RbR,RbU,RbO,UeberO,RlB,RlH,RaB,RaH };

  const newPhoto=$("editPreview").dataset.new;
  if(newPhoto){ r.photoDataUrl = await resizeAndCompress(newPhoto, 100); delete $("editPreview").dataset.new; }
  editDialog.close(); renderList(); showMsg("Änderungen gespeichert.");
});

/* ------------------ Export ------------------ */
$("exportBtn").addEventListener("click", async ()=>{
  if(records.length===0){ showMsg("Keine Daten zum Export.", false); return; }
  try{
    const wb=new ExcelJS.Workbook();
    const ws=wb.addWorksheet("Fenster");
    const headers=[
      "Position","Foto","Hinweise/Speziell",
      "FL Breite","FL Höhe","UKR-Futter","UKR-OK","Rahmenbreite",
      "Eingabe L","Eingabe R",
      "Einstand L","Einstand R","Einstand O","Einstand U","Normrahmen",
      "Rb links","Rb rechts","Rb unten","Rb oben","(Rahmenverbreiterung)",
      "RL Breite","RL Höhe","RA Breite","RA Höhe"
    ];
    ws.addRow(headers);
    ws.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
    ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1b84e8"}};
    ws.columns=[
      {width:10},{width:26},{width:24},
      {width:12},{width:12},{width:14},{width:14},{width:14},
      {width:12},{width:12},
      {width:12},{width:12},{width:12},{width:12},{width:14},
      {width:14},{width:14},{width:14},{width:14},{width:18},
      {width:14},{width:14},{width:14},{width:14},
    ];
    const sorted=[...records].sort((a,b)=>a.position-b.position);
    for(let i=0;i<sorted.length;i++){
      const r=sorted[i]; const rowIndex=i+2;
      ws.addRow([
        r.position,"",r.bemerkung,
        r.inputs.FLB,r.inputs.FLH,r.inputs.UKF,r.inputs.UKOK,r.inputs.RB,
        r.inputs.EingL,r.inputs.EingR,
        r.overrides.L,r.overrides.R,r.overrides.O,r.overrides.U,r.overrides.N,
        r.results.RbL,r.results.RbR,r.results.RbU,r.results.RbO,r.results.UeberO,
        r.results.RlB,r.results.RlH,r.results.RaB,r.results.RaH
      ]);
      ws.getRow(rowIndex).height=115;
      const [prefix,b64]=r.photoDataUrl.split(",");
      const isPng=prefix.includes("image/png");
      const imgId=wb.addImage({base64:b64,extension:isPng?"png":"jpeg"});
      ws.addImage(imgId,{tl:{col:1,row:rowIndex-1},ext:{width:151,height:151},editAs:"oneCell"});
    }
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    saveAs(blob,"fenster_erfassung_v3_2.xlsx");

    if($("csvToggle").checked){
      const lines=[]; lines.push(headers.map(h=>`"${h}"`).join(";"));
      for(const r of sorted){
        const row=[
          r.position,"",r.bemerkung,
          r.inputs.FLB,r.inputs.FLH,r.inputs.UKF,r.inputs.UKOK,r.inputs.RB,
          r.inputs.EingL??"",r.inputs.EingR??"",
          r.overrides.L,r.overrides.R,r.overrides.O,r.overrides.U,r.overrides.N,
          r.results.RbL,r.results.RbR,r.results.RbU,r.results.RbO,r.results.UeberO,
          r.results.RlB,r.results.RlH,r.results.RaB,r.results.RaH
        ];
        lines.push(row.join(";"));
      }
      const csvBlob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
      saveAs(csvBlob,"fenster_erfassung_v3_2.csv");
    }
  }catch(err){ console.error(err); showMsg("Export-Fehler: "+err.message,false); }
});
