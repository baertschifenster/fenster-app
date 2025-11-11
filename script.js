const $ = id => document.getElementById(id);
const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const fmt = v => Number.isFinite(v) ? String(Math.round((v + Number.EPSILON) * 100) / 100) : "–";


// ======================================================
//  THEME HANDLING (Light / Dark)
// ======================================================

const themeToggle = $("themeToggle");

themeToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("light", themeToggle.checked);
    localStorage.setItem("themeLight", themeToggle.checked ? "1" : "0");
});

if (localStorage.getItem("themeLight") === "1") {
    themeToggle.checked = true;
    document.documentElement.classList.add("light");
}


// ======================================================
//  PHOTO HANDLING + RESIZE TO ~100 KB
// ======================================================

let pendingPhoto = null;
let acceptedPhoto = null;

$("cameraInput").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const rd = new FileReader();
    rd.onload = () => {
        pendingPhoto = rd.result;
        $("photoPreview").innerHTML = `<img src="${pendingPhoto}">`;
        $("acceptPhoto").disabled = false;
        $("discardPhoto").disabled = false;
    };
    rd.readAsDataURL(f);
});

$("acceptPhoto").addEventListener("click", async () => {
    if (pendingPhoto) {
        acceptedPhoto = pendingPhoto;
        msg("Foto übernommen.");
    }
});

$("discardPhoto").addEventListener("click", () => {
    pendingPhoto = null;
    acceptedPhoto = null;
    $("cameraInput").value = "";
    $("photoPreview").textContent = "Kein Foto";
    $("acceptPhoto").disabled = true;
    $("discardPhoto").disabled = true;
});

function createImage(dataUrl) {
    return new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = dataUrl;
    });
}

function dataURLSizeKB(dataUrl) {
    const b64 = (dataUrl.split(",")[1] || "");
    return Math.ceil((b64.length * 3 / 4) / 1024);
}

async function resizeAndCompress(dataUrl, maxKB = 100) {
    const img = await createImage(dataUrl);
    const c = document.createElement("canvas");
    c.width = 151;
    c.height = 151;

    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, 151, 151);

    let q = 0.9;
    let out = c.toDataURL("image/jpeg", q);

    for (let i = 0; i < 8 && dataURLSizeKB(out) > maxKB && q > 0.4; i++) {
        q -= 0.08;
        out = c.toDataURL("image/jpeg", q);
    }

    return out;
}


// ======================================================
//  DEFAULT OVERRIDES
// ======================================================

function getDefaults() {
    return {
        Einst_L: num($("def_Einst_L").value),
        Einst_R: num($("def_Einst_R").value),
        Einst_O: num($("def_Einst_O").value),
        Einst_U: num($("def_Einst_U").value),
        NRa: num($("def_NRa").value)
    };
}

function seedOverrides() {
    const d = getDefaults();
    $("Einst_L").value = d.Einst_L;
    $("Einst_R").value = d.Einst_R;
    $("Einst_O").value = d.Einst_O;
    $("Einst_U").value = d.Einst_U;
    $("NRa").value = d.NRa;
}

seedOverrides();


// ======================================================
//  INPUTS TRIGGER RECALCULATION
// ======================================================

[
    "FLB", "FLH", "UKR_FL", "RAM_H_eingabe", "RAM_B_eingabe",
    "Anschlag_li", "Anschlag_re",
    "Einst_L", "Einst_R", "Einst_O", "Einst_U", "NRa",
    "def_Einst_L", "def_Einst_R", "def_Einst_O", "def_Einst_U", "def_NRa",
    "RB_L", "RB_R", "RB_U", "RB_O"
].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("input", () => {
        if (id.startsWith("def_")) seedOverrides();
        calcAll();
    });
});


// ======================================================
//  ANSCHLAG LINKS / RECHTS – NUR EINES EINGEBEN
// ======================================================

function syncAnschlag() {
    const FLB = num($("FLB").value);
    const RAM_B_eingabe = num($("RAM_B_eingabe").value);

    const li = $("Anschlag_li");
    const re = $("Anschlag_re");

    const vL = li.value.trim();
    const vR = re.value.trim();

    // Only left entered
    if (vL !== "" && vR === "") {
        re.value = String(RAM_B_eingabe - FLB - num(vL));
        re.disabled = true;
        li.disabled = false;
    }
    // Only right entered
    else if (vR !== "" && vL === "") {
        li.value = String(RAM_B_eingabe - FLB - num(vR));
        li.disabled = true;
        re.disabled = false;
    }
    // None entered
    else if (vL === "" && vR === "") {
        li.disabled = false;
        re.disabled = false;
    }
    else {
        li.disabled = false;
        re.disabled = false;
    }
}

["Anschlag_li", "Anschlag_re", "FLB", "RAM_B_eingabe"].forEach(id =>
    $(id).addEventListener("input", () => {
        syncAnschlag();
        calcAll();
    })
);


// ======================================================
//  MAIN CALCULATION
// ======================================================

function calcAll() {

    const FLB = num($("FLB").value);
    const FLH = num($("FLH").value);
    const UKR_FL = num($("UKR_FL").value);

    const RAM_H_eingabe = num($("RAM_H_eingabe").value);
    const RAM_B_eingabe = num($("RAM_B_eingabe").value);

    const Einst_L = num($("Einst_L").value);
    const Einst_R = num($("Einst_R").value);
    const Einst_O = num($("Einst_O").value);
    const Einst_U = num($("Einst_U").value);
    const NRa = num($("NRa").value);

    const Anschlag_li = $("Anschlag_li").value.trim() === "" ? null : num($("Anschlag_li").value);
    const Anschlag_re = $("Anschlag_re").value.trim() === "" ? null : num($("Anschlag_re").value);


    // ----- Auto RB defaults (only when user hasn't set a custom value) -----

    const auto_RB_L = RAM_B_eingabe - FLB - (Anschlag_re ?? 0) + Einst_L;
    const auto_RB_R = RAM_B_eingabe - FLB - (Anschlag_li ?? 0) + Einst_R;
    const auto_RB_U = UKR_FL - FLH + Einst_U;
    const auto_RB_O = RAM_H_eingabe - UKR_FL + Einst_O;


    if ($("RB_L").value.trim() === "") $("RB_L").value = Number.isFinite(auto_RB_L) ? String(auto_RB_L) : "";
    if ($("RB_R").value.trim() === "") $("RB_R").value = Number.isFinite(auto_RB_R) ? String(auto_RB_R) : "";
    if ($("RB_U").value.trim() === "") $("RB_U").value = Number.isFinite(auto_RB_U) ? String(auto_RB_U) : "";
    if ($("RB_O").value.trim() === "") $("RB_O").value = Number.isFinite(auto_RB_O) ? String(auto_RB_O) : "";


    // ----- Now take editable RB values -----

    const RB_L = num($("RB_L").value);
    const RB_R = num($("RB_R").value);
    const RB_U = num($("RB_U").value);
    const RB_O = num($("RB_O").value);


    // ----- Derived values -----

    const RL_B = FLB - Einst_L - Einst_R;
    const RL_H = FLH - Einst_O - Einst_U;

    const RAM_B = RL_B + RB_L + RB_R;
    const RAM_H = RL_H + RB_U + RB_O;

    const RV_zu_Norm = RB_O - NRa;


    // ----- Display -----

    $("RL_B").textContent = fmt(RL_B);
    $("RL_H").textContent = fmt(RL_H);
    $("RAM_B").textContent = fmt(RAM_B);
    $("RAM_H").textContent = fmt(RAM_H);
    $("RV_zu_Norm").textContent = fmt(RV_zu_Norm);
}

calcAll();


// ======================================================
//  SAVE POSITION
// ======================================================

function msg(t, ok = true) {
    const el = $("msg");
    el.style.color = ok ? "#69e09b" : "#ff8585";
    el.textContent = t;
    setTimeout(() => (el.textContent = ""), 2500);
}

let nextId = 1;
let position = 1;
const rows = [];

$("saveRow").addEventListener("click", async () => {

    const need = ["FLB", "FLH", "UKR_FL", "RAM_H_eingabe", "RAM_B_eingabe"];
    for (const id of need) {
        if ($(id).value.trim() === "") {
            msg("Bitte alle erforderlichen Felder ausfüllen.", false);
            return;
        }
    }

    calcAll();

    let photo = null;

    if (acceptedPhoto) {
        photo = await resizeAndCompress(acceptedPhoto, 100);
    }

    const rec = {
        id: nextId++,
        pos: position++,

        bau: $("bauposition").value.trim(),
        note: $("bemerkung").value.trim(),
        photo,

        inputs: {
            FLB: num($("FLB").value),
            FLH: num($("FLH").value),
            UKR_FL: num($("UKR_FL").value),
            RAM_H_eingabe: num($("RAM_H_eingabe").value),
            RAM_B_eingabe: num($("RAM_B_eingabe").value),
            Anschlag_li:
                $("Anschlag_li").value.trim() === "" ? "" : num($("Anschlag_li").value),
            Anschlag_re:
                $("Anschlag_re").value.trim() === "" ? "" : num($("Anschlag_re").value),
        },

        overrides: {
            Einst_L: num($("Einst_L").value),
            Einst_R: num($("Einst_R").value),
            Einst_O: num($("Einst_O").value),
            Einst_U: num($("Einst_U").value),
            NRa: num($("NRa").value),
        },

        rb: {
            L: num($("RB_L").value),
            R: num($("RB_R").value),
            U: num($("RB_U").value),
            O: num($("RB_O").value),
        },

        results: {
            RL_B: num($("RL_B").textContent),
            RL_H: num($("RL_H").textContent),
            RAM_B: num($("RAM_B").textContent),
            RAM_H: num($("RAM_H").textContent),
            RV_zu_Norm: num($("RV_zu_Norm").textContent),
        },
    };

    rows.push(rec);
    renderList();

    $("posLabel").textContent = String(position);

    // reset fields for next entry
    [
        "FLB", "FLH", "UKR_FL", "RAM_H_eingabe", "RAM_B_eingabe",
        "Anschlag_li", "Anschlag_re",
        "bauposition", "bemerkung",
        "RB_L", "RB_R", "RB_U", "RB_O"
    ].forEach(id => ($(id).value = ""));

    acceptedPhoto = null;
    pendingPhoto = null;
    $("cameraInput").value = "";
    $("photoPreview").textContent = "Kein Foto";
    $("acceptPhoto").disabled = true;
    $("discardPhoto").disabled = true;

    calcAll();
    msg("Position gespeichert.");
    window.scrollTo({ top: 0, behavior: "smooth" });
});


// ======================================================
//  LIST RENDERING
// ======================================================

function renderList() {
    const list = $("list");

    if (rows.length === 0) {
        list.innerHTML = "<i>Keine Positionen erfasst.</i>";
        return;
    }

    list.innerHTML = rows
        .map((r) => {
            const img = r.photo
                ? `<img src="${r.photo}" alt="Foto">`
                : `<div class="ph">kein Foto</div>`;

            return `
        <div class="item">
            ${img}

            <div>
                <div><b>Pos. ${r.pos}</b> — ${r.bau ? `<i>${r.bau}</i>` : ""} ${r.note ? "— " + r.note : ""}</div>
                <div>RL: ${r.results.RL_B} × ${r.results.RL_H} mm</div>
                <div>RAM: ${r.results.RAM_B} × ${r.results.RAM_H} mm — RV zu Norm: ${r.results.RV_zu_Norm} mm</div>
            </div>

            <div>
                <button class="btn ghost" onclick="del(${r.id})">Löschen</button>
            </div>
        </div>
        `;
        })
        .join("");
}

window.del = (id) => {
    const i = rows.findIndex((x) => x.id === id);
    if (i >= 0) {
        rows.splice(i, 1);
        renderList();
        msg("Position gelöscht.");
    }
};


// ======================================================
//  EXPORT (EXCEL + optional CSV)
// ======================================================

$("exportBtn").addEventListener("click", async () => {
    if (rows.length === 0) {
        msg("Keine Daten zum Export.", false);
        return;
    }

    try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Fenster");

        const headers = [
            "Position", "Foto", "Bauposition", "Hinweise",

            "FLB", "FLH", "UKR-FL",
            "RAM_H_eingabe", "RAM_B_eingabe",
            "Anschlag_li", "Anschlag_re",

            "Einst_L", "Einst_R", "Einst_O", "Einst_U", "NRa",

            "RB_L", "RB_R", "RB_U", "RB_O",

            "RL_B", "RL_H",
            "RAM_B", "RAM_H",
            "RV_zu_Norm"
        ];

        ws.addRow(headers);

        ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        ws.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1b84e8" },
        };

        ws.columns = Array.from({ length: headers.length }, (_, i) => ({ width: 14 }));

        const sorted = [...rows].sort((a, b) => a.pos - b.pos);

        for (let i = 0; i < sorted.length; i++) {
            const r = sorted[i];
            const rowIndex = i + 2;

            ws.addRow([
                r.pos, "", r.bau || "", r.note || "",

                r.inputs.FLB, r.inputs.FLH, r.inputs.UKR_FL,
                r.inputs.RAM_H_eingabe, r.inputs.RAM_B_eingabe,
                r.inputs.Anschlag_li, r.inputs.Anschlag_re,

                r.overrides.Einst_L, r.overrides.Einst_R,
                r.overrides.Einst_O, r.overrides.Einst_U,
                r.overrides.NRa,

                r.rb.L, r.rb.R, r.rb.U, r.rb.O,

                r.results.RL_B, r.results.RL_H,
                r.results.RAM_B, r.results.RAM_H,
                r.results.RV_zu_Norm
            ]);

            ws.getRow(rowIndex).height = 115;

            if (r.photo) {
                const [prefix, b64] = r.photo.split(",");
                const isPng = prefix.includes("png");

                const imgId = wb.addImage({
                    base64: b64,
                    extension: isPng ? "png" : "jpeg",
                });

                ws.addImage(imgId, {
                    tl: { col: 1, row: rowIndex - 1 },
                    ext: { width: 151, height: 151 },
                    editAs: "oneCell",
                });
            }
        }

        const buffer = await wb.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "fenster_erfassung_v3_6.xlsx"
        );


        if ($("csvToggle").checked) {
            const lines = [];
            lines.push(headers.map((h) => `"${h}"`).join(";"));

            for (const r of sorted) {
                const row = [
                    r.pos, "", r.bau || "", r.note || "",

                    r.inputs.FLB, r.inputs.FLH, r.inputs.UKR_FL,
                    r.inputs.RAM_H_eingabe, r.inputs.RAM_B_eingabe,
                    r.inputs.Anschlag_li, r.inputs.Anschlag_re,

                    r.overrides.Einst_L, r.overrides.Einst_R,
                    r.overrides.Einst_O, r.overrides.Einst_U,
                    r.overrides.NRa,

                    r.rb.L, r.rb.R, r.rb.U, r.rb.O,

                    r.results.RL_B, r.results.RL_H,
                    r.results.RAM_B, r.results.RAM_H,
                    r.results.RV_zu_Norm
                ];

                lines.push(row.join(";"));
            }

            saveAs(
                new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
                "fenster_erfassung_v3_6.csv"
            );
        }

    } catch (e) {
        console.error(e);
        msg("Export Fehler: " + e.message, false);
    }
});
