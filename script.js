// =====================================================
// 1. SEGÉDFÜGGVÉNYEK (színek átváltása, kontraszt számolás)
// =====================================================
// A függvény egy névvel ellátott kódrészlet, amit bármikor meg lehet hívni.
// Ezek a függvények csak számolnak, az oldalhoz nem nyúlnak.

// "#3b82f6" -> { r: 59, g: 130, b: 246 }
// A HEX kód három kétjegyű, 16-os számrendszerbeli számból áll: vörös, zöld, kék.
function hexToRgb(hex) {
  // slice(1, 3) = a szöveg 1. és 2. karaktere (a 0. karakter a # jel).
  // parseInt(..., 16) = 16-os számrendszerbeli szövegből szám.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Egy objektumot adunk vissza, amiben három érték van.
  return { r: r, g: g, b: b };
}

// 59 -> "3b" (mindig két jegyű)
function kettoJegyu(szam) {
  // toString(16) = 16-os számrendszerbeli szöveg; padStart = elé tesz 0-t, ha csak egy jegyű (pl. "5" -> "05").
  return szam.toString(16).padStart(2, "0");
}

// 59, 130, 246 -> "#3b82f6"
function rgbToHex(r, g, b) {
  return "#" + kettoJegyu(r) + kettoJegyu(g) + kettoJegyu(b);
}

// RGB -> HSL (h: 0-360 fok, s: 0-100 %, l: 0-100 %)
// A HSL-ben a "h" a színkörön a szín helye, ezért ezzel könnyű harmóniákat számolni.
function rgbToHsl(r, g, b) {
  // Átváltjuk a 0-255 közötti számokat 0-1 közöttire.
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const max = Math.max(r, g, b); // a legnagyobb a három közül
  const min = Math.min(r, g, b); // a legkisebb a három közül
  const kulonbseg = max - min;
  const l = (max + min) / 2;     // a világosság a legnagyobb és legkisebb átlaga
  let h = 0;                     // let = ez az érték később még változhat
  let s = 0;

  // Ha a három érték egyforma (kulonbseg = 0), a szín szürke: nincs árnyalat és telítettség.
  if (kulonbseg !== 0) {
    s = kulonbseg / (1 - Math.abs(2 * l - 1));

    // Az árnyalat attól függ, melyik szín (R, G vagy B) a legerősebb.
    if (max === r) {
      h = ((g - b) / kulonbseg) % 6;
    } else if (max === g) {
      h = (b - r) / kulonbseg + 2;
    } else {
      h = (r - g) / kulonbseg + 4;
    }
    h = h * 60; // átváltás fokba
    if (h < 0) {
      h = h + 360; // a negatív fokot a színkör másik oldalára tesszük
    }
  }

  // Math.round = egészre kerekít. A telítettséget és világosságot 0-100 közötti %-ra váltjuk.
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// HSL -> "#rrggbb"
function hslToHex(h, s, l) {
  // a színkör körbeér: -30 fok ugyanaz, mint 330 fok; 390 ugyanaz, mint 30
  // A % a maradékot adja (osztás maradéka), így mindig 0-360 közötti lesz a fok.
  h = ((h % 360) + 360) % 360;
  s = s / 100;
  l = l / 100;

  const a = s * Math.min(l, 1 - l);

  // Egy belső függvény: kiszámolja az egyik színcsatorna (R, G vagy B) értékét.
  function csatorna(n) {
    const k = (n + h / 30) % 12;
    const ertek = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * ertek); // vissza a 0-255 közötti számra
  }

  // A három csatorna eltolása (0, 8, 4) adja a vörös, a zöld és a kék értékét.
  return rgbToHex(csatorna(0), csatorna(8), csatorna(4));
}

// Mennyire "világos" egy szín? (0 = fekete, 1 = fehér)
// A szemünk a zöldre a legérzékenyebb, ezért a három csatorna különböző súllyal számít.
function vilagossag(hex) {
  const rgb = hexToRgb(hex);
  const csatornak = [rgb.r, rgb.g, rgb.b]; // a [] egy lista (tömb)
  const atszamolt = [];

  // A for ciklus a lista minden elemén végigmegy (i = 0, 1, 2).
  for (let i = 0; i < csatornak.length; i++) {
    const c = csatornak[i] / 255;
    if (c <= 0.03928) {
      atszamolt.push(c / 12.92); // push = új elem a lista végére
    } else {
      atszamolt.push(Math.pow((c + 0.055) / 1.055, 2.4)); // Math.pow = hatványozás
    }
  }

  return 0.2126 * atszamolt[0] + 0.7152 * atszamolt[1] + 0.0722 * atszamolt[2];
}

// Kontrasztarány két szín között (1 = ugyanaz, 21 = fekete-fehér)
// Ez a hivatalos (WCAG) képlet: a világosabb és a sötétebb szín világosságának aránya.
function kontrasztArany(hex1, hex2) {
  const v1 = vilagossag(hex1);
  const v2 = vilagossag(hex2);
  const vilagosabb = Math.max(v1, v2);
  const sotetebb = Math.min(v1, v2);
  return (vilagosabb + 0.05) / (sotetebb + 0.05);
}

// Kontrasztarányból szöveges értékelés
function ertekeles(arany) {
  if (arany >= 7) {
    return "kiváló (AAA)";
  } else if (arany >= 4.5) {
    return "jó (AA)";
  } else if (arany >= 3) {
    return "gyenge – csak nagy betűnél jó";
  } else {
    return "rossz";
  }
}

// =====================================================
// 2. BEVEZETŐ: RGB-KEVERŐ
// =====================================================

// document.getElementById("...") = megkeresi az oldalon azt az elemet, aminek ez az id-ja.
// A const-tal elmentjük egy változóba, hogy később használni tudjuk.
const rCsuszka = document.getElementById("rCsuszka");
const gCsuszka = document.getElementById("gCsuszka");
const bCsuszka = document.getElementById("bCsuszka");

// Kiolvassa a három csúszkát, és frissíti a színmintát és a számokat.
function keveroFrissit() {
  // A csúszka értéke szöveg, a Number() számmá alakítja.
  const r = Number(rCsuszka.value);
  const g = Number(gCsuszka.value);
  const b = Number(bCsuszka.value);
  const hex = rgbToHex(r, g, b);

  // style.backgroundColor = az elem háttérszínének átállítása.
  document.getElementById("keveroMinta").style.backgroundColor = hex;
  // textContent = az elem szövegének átírása.
  document.getElementById("keveroKod").textContent =
    "rgb(" + r + ", " + g + ", " + b + ") = " + hex;
  document.getElementById("rErtek").textContent = r;
  document.getElementById("gErtek").textContent = g;
  document.getElementById("bErtek").textContent = b;
}

// Eseménykezelő: amikor a csúszka mozog ("input" esemény), lefut a keveroFrissit függvény.
rCsuszka.addEventListener("input", keveroFrissit);
gCsuszka.addEventListener("input", keveroFrissit);
bCsuszka.addEventListener("input", keveroFrissit);

// Gyors példák: ezekkel látszik, hogy a fény összeadódik
// Minden elem egy objektum: név és a három csúszka értéke.
const keveroPeldak = [
  { nev: "Vörös + zöld = sárga", r: 255, g: 255, b: 0 },
  { nev: "Zöld + kék = cián", r: 0, g: 255, b: 255 },
  { nev: "Vörös + kék = magenta", r: 255, g: 0, b: 255 },
  { nev: "Mind a három = fehér", r: 255, g: 255, b: 255 },
  { nev: "Egyik sem = fekete", r: 0, g: 0, b: 0 }
];

// Készít egy gombot egy példához.
function peldaGombKeszit(pelda) {
  const gomb = document.createElement("button"); // új <button> elem (még nincs az oldalon)
  gomb.type = "button";
  gomb.className = "gomb";                       // a CSS .gomb szabálya fog rá vonatkozni
  gomb.textContent = pelda.nev;
  // Kattintásra beállítja a három csúszkát, és frissíti a keverőt.
  gomb.addEventListener("click", function () {
    rCsuszka.value = pelda.r;
    gCsuszka.value = pelda.g;
    bCsuszka.value = pelda.b;
    keveroFrissit();
  });
  return gomb;
}

// Minden példához gombot készítünk, és berakjuk az oldalra.
for (let i = 0; i < keveroPeldak.length; i++) {
  // appendChild = az elem belsejének végére teszi az új elemet.
  document.getElementById("keveroGombok").appendChild(peldaGombKeszit(keveroPeldak[i]));
}

// =====================================================
// 3. BEVEZETŐ: UGYANAZ A SZÍN, MÁSNAK LÁTSZIK
// =====================================================

// A négy bemutató adatai. Új bemutatót úgy adhatsz hozzá, hogy ide beírsz egy újat.
//   szin = a négyzet színe (mindkét oldalon ugyanaz!)
//   hatter1, hatter2 = a két háttér színe
const demok = [
  {
    cim: "Lila négyzet sárga és sötétlila háttéren",
    szin: "#662d91",
    hatter1: "#fdcf09",
    hatter2: "#51276d",
    magyarazat: "A sárgán a lila sötétebbnek és kékesebbnek, a sötétlilán világosabbnak és élénkebbnek látszik."
  },
  {
    cim: "Piros négyzet rózsapiros és sötét zöldesszürke háttéren",
    szin: "#bf1e2d",
    hatter1: "#d91b5c",
    hatter2: "#2f4945",
    magyarazat: "A rózsapiroson a piros fakónak és barnásnak, a sötét zöldesszürkén ragyogónak és élénknek látszik."
  },
  {
    cim: "Zöld négyzet zöld és kék háttéren",
    szin: "#39b54a",
    hatter1: "#2bb673",
    hatter2: "#25aae1",
    magyarazat: "A kék háttéren a zöld sárgásabbnak és élénkebbnek, a zöldön halványabbnak és kékesebbnek látszik."
  },
  {
    cim: "Világoskék négyzet sötétkék és zöldeskék háttéren",
    szin: "#00aeef",
    hatter1: "#100c3c",
    hatter2: "#00a59a",
    magyarazat: "A sötétkék háttéren szinte világít, a zöldeskéken tompább és kékebb."
  }
];

// Egy bemutató doboz elkészítése
function demoKeszit(d) {
  const doboz = document.createElement("article");
  doboz.className = "demo";
  // innerHTML = az elem belsejének HTML kódja. A + jellel fűzzük össze a szövegeket.
  // A két panelben ugyanaz a négyzet (d.szin) van, csak a háttér (d.hatter1 / d.hatter2) más.
  // A .hid az összekötő csík: ugyanolyan színű, mint a négyzet.
  doboz.innerHTML =
    "<h3>" + d.cim + "</h3>" +
    '<div class="par">' +
      '<div class="par-panel" style="background:' + d.hatter1 + '"><span class="negyzet" style="background:' + d.szin + '"></span></div>' +
      '<div class="par-panel" style="background:' + d.hatter2 + '"><span class="negyzet" style="background:' + d.szin + '"></span></div>' +
      '<span class="hid" style="background:' + d.szin + '"></span>' +
    "</div>" +
    "<p>" + d.magyarazat + "</p>" +
    '<p class="kod">Mindkét négyzet: ' + d.szin + "</p>" +
    '<button type="button" class="gomb">Összekötöm a négyzeteket</button>';

  // querySelector = a doboz belsejében megkeresi az első elemet, ami illik a CSS-választóra.
  const par = doboz.querySelector(".par");
  const gomb = doboz.querySelector(".gomb");

  // A gombbal egy ugyanolyan színű csík köti össze a két négyzetet
  gomb.addEventListener("click", function () {
    // classList.toggle = ha az osztály rajta van, leveszi; ha nincs rajta, ráteszi.
    // A CSS az "osszekotve" osztály alapján mutatja meg a csíkot.
    par.classList.toggle("osszekotve");
    if (par.classList.contains("osszekotve")) {
      gomb.textContent = "Szétválasztom";
    } else {
      gomb.textContent = "Összekötöm a négyzeteket";
    }
  });

  return doboz;
}

// Mindegyik bemutatóból elkészítjük a dobozt, és berakjuk az oldalra.
for (let i = 0; i < demok.length; i++) {
  document.getElementById("demok").appendChild(demoKeszit(demok[i]));
}

// "Játssz a háttérrel": a négyzet színe nem változik, csak a háttéré
const arnyalatCsuszka = document.getElementById("arnyalatCsuszka");
const vilagossagCsuszka = document.getElementById("vilagossagCsuszka");

function jatekFrissit() {
  const arnyalat = Number(arnyalatCsuszka.value);
  const vilagossag = Number(vilagossagCsuszka.value);

  // A háttér színét HSL formában adjuk meg: árnyalat, telítettség (fix 70%), világosság.
  document.getElementById("jatekPanel").style.backgroundColor =
    "hsl(" + arnyalat + ", 70%, " + vilagossag + "%)";
  document.getElementById("arnyalatErtek").textContent = arnyalat + "°";
  document.getElementById("vilagossagErtek").textContent = vilagossag + "%";
}

arnyalatCsuszka.addEventListener("input", jatekFrissit);
vilagossagCsuszka.addEventListener("input", jatekFrissit);
jatekFrissit(); // egyszer azonnal lefuttatjuk, hogy a kezdőértékek is megjelenjenek

// =====================================================
// 4. SZÍNKÖR RAJZOLÁS
// =====================================================

// A színkör háttere egy teljes korong:
// - körben az árnyalatok (0°-tól 360°-ig, 15°-onként egy szín),
// - a közepe felé fehérbe, a széle felé feketébe megy át.
function korHatterKeszit() {
  const szinek = [];
  // 0-tól 360-ig 15-ösével lépünk: ez 25 szín a színkörről.
  for (let fok = 0; fok <= 360; fok += 15) {
    szinek.push("hsl(" + fok + ",100%,50%)"); // teljesen telített, "tiszta" szín
  }
  // conic-gradient = színátmenet körben, a közepe körül (ettől lesz színkör).
  const arnyalatok = "conic-gradient(" + szinek.join(",") + ")"; // join = a lista elemeit vesszővel fűzi össze
  // radial-gradient = színátmenet a középpontból kifelé: fehér -> átlátszó -> fekete.
  const fenyAtmenet = "radial-gradient(closest-side, #fff 0%, rgba(255,255,255,0) 56%, rgba(0,0,0,0) 56%, #000 100%)";
  return fenyAtmenet + "," + arnyalatok; // az első réteg van felül
}
// Egyszer kiszámoljuk, és elmentjük (nagybetűs név = nem változó érték).
const KOR_HATTER = korHatterKeszit();

// Világosság (0-100%) -> milyen messze van a pont a középponttól (0-100 rajzegység)
// 100% (fehér) = középpont, 50% (tiszta szín) = 56, 0% (fekete) = a korong széle
function vilagossagSugar(l) {
  if (l >= 50) {
    return 56 * (100 - l) / 50; // a középpont (fehér) és a tiszta szín között
  }
  return 56 + 44 * (50 - l) / 50; // a tiszta szín és a korong széle (fekete) között
}

// És visszafelé: a távolságból világosság
function sugarVilagossag(sugar) {
  if (sugar <= 56) {
    return 100 - sugar * 50 / 56;
  }
  return 50 - (sugar - 56) * 50 / 44;
}

// Egy pont a körön: fok = hol van a színkörön (0° = felül), sugar = milyen messze a középponttól
// A rajz 200 × 200 egységes, a közepe a (100, 100).
function pont(fok, sugar) {
  const radian = fok * Math.PI / 180; // a számítógép a szögeket radiánban számolja, nem fokban
  // Math.sin és Math.cos = szinusz és koszinusz: ezekkel kapjuk meg a pont vízszintes (x) és függőleges (y) helyét.
  // Az y-ból kivonunk, mert a képernyőn lefelé nő az y.
  return { x: 100 + sugar * Math.sin(radian), y: 100 - sugar * Math.cos(radian) };
}

// Egy vonal két rétegben (sötét alap + fehér), hogy minden háttéren látsszon
function vonalSvg(x1, y1, x2, y2) {
  // toFixed(1) = egy tizedesjegyre kerekít (pl. 12.3).
  const koord = 'x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"';
  return '<line ' + koord + ' stroke="rgba(0,0,0,0.45)" stroke-width="5" stroke-linecap="round"/>' +
         '<line ' + koord + ' stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
}

// Ide jegyezzük meg, hol vannak épp a pontok az egyes köröknél (a húzáshoz kell)
// A {} egy üres objektum, amibe később a körök adatait tesszük, a körök azonosítója szerint.
const korAdatok = {};

// lista: [{ hex, fok, vil, alap }]  (fok = árnyalat, vil = világosság)
// forma: "vonal" (két pont összekötve), "sokszog" (zárt alakzat),
//        "kozep" (sugarak a középpontból), "sugar" (pontok egy sugár mentén)
function korKirajzol(helyId, lista, forma) {
  const hely = document.getElementById(helyId);
  const poziciok = [];

  // Kiszámoljuk minden pont helyét: az árnyalat adja az irányt, a világosság a távolságot.
  for (let i = 0; i < lista.length; i++) {
    poziciok.push(pont(lista[i].fok, vilagossagSugar(lista[i].vil)));
  }
  // Elmentjük a pontok helyét, hogy húzáskor tudjuk, melyiket fogták meg.
  korAdatok[helyId] = { lista: lista, forma: forma, poziciok: poziciok };

  // 1) vonalak
  let vonalak = "";
  if (forma === "vonal") {
    // két pont összekötése (komplementer)
    vonalak = vonalSvg(poziciok[0].x, poziciok[0].y, poziciok[1].x, poziciok[1].y);
  } else if (forma === "sokszog") {
    // zárt alakzat a pontok között (triád, osztott komplementer, tetrád)
    let pontok = "";
    for (let i = 0; i < poziciok.length; i++) {
      pontok += poziciok[i].x.toFixed(1) + "," + poziciok[i].y.toFixed(1) + " ";
    }
    vonalak =
      '<polygon points="' + pontok + '" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="5" stroke-linejoin="round"/>' +
      '<polygon points="' + pontok + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>';
  } else if (forma === "kozep") {
    // minden ponttól egy vonal a középpontba (analóg)
    for (let i = 0; i < poziciok.length; i++) {
      vonalak += vonalSvg(100, 100, poziciok[i].x, poziciok[i].y);
    }
  } else if (forma === "sugar") {
    // egyetlen vonal a középponttól a korong széléig (monokróm)
    const vege = pont(lista[0].fok, 98);
    vonalak = vonalSvg(100, 100, vege.x, vege.y);
  }

  // 2) pontok (az alapszín nagyobb)
  let pontok = "";
  for (let i = 0; i < lista.length; i++) {
    let meret = 10;
    if (lista[i].alap) {
      meret = 12; // az alapszín pontja nagyobb
    }
    if (forma === "sugar") {
      meret = 7.5; // a monokrómnál sok pont van egymás mellett, ezért kisebbek
    }
    // Minden pont két körből áll: egy sötétebb, nagyobb "árnyék" és a színes, fehér szélű pont.
    pontok +=
      '<circle cx="' + poziciok[i].x.toFixed(1) + '" cy="' + poziciok[i].y.toFixed(1) + '" r="' + (meret + 2.5) + '" fill="rgba(0,0,0,0.35)"/>' +
      '<circle cx="' + poziciok[i].x.toFixed(1) + '" cy="' + poziciok[i].y.toFixed(1) + '" r="' + meret + '" fill="' + lista[i].hex + '" stroke="#fff" stroke-width="3"/>';
  }

  // Beírjuk az oldalra: a színes korongot (div) és fölé az SVG rajzot a vonalakkal és pontokkal.
  hely.innerHTML =
    '<div class="kor-gyuru" style="background:' + KOR_HATTER + '"></div>' +
    '<svg viewBox="0 0 200 200" aria-hidden="true">' + vonalak + pontok + "</svg>";
}

// =====================================================
// 4/b. AZ ALAPSZÍN (ebből számolunk mindent) ÉS A PONTOK HÚZÁSA
// =====================================================

const szinvalaszto = document.getElementById("szinvalaszto");

// Az alapszínt két formában tároljuk. A let miatt ezek az értékek később módosulhatnak.
let alapHex = "#3b82f6";            // az alapszín HEX kódja
let alap = { h: 217, s: 91, l: 60 }; // ugyanez HSL-ben (árnyalat, telítettség, világosság)

// Épp húzunk-e egy pontot? Ha igen, itt van, melyiket.
// null = "nincs érték": most semmit nem húzunk.
let huzas = null;

// Egy kör "megfogható" lesz: a pontjait egérrel vagy ujjal lehet húzni.
// Húzás közben az alapszín árnyalata és világossága változik, a többi szín követi.
function korMozgathato(helyId) {
  const hely = document.getElementById(helyId);

  // Az egér helye a 200 × 200-as rajz koordinátáiban
  function egerHelye(esemeny) {
    // getBoundingClientRect = a kör doboz helye és mérete a képernyőn.
    const doboz = hely.getBoundingClientRect();
    return {
      // Az egér helyéből kivonjuk a doboz bal/felső szélét, és átszámoljuk 200-as skálára.
      x: (esemeny.clientX - doboz.left) / doboz.width * 200,
      y: (esemeny.clientY - doboz.top) / doboz.height * 200
    };
  }

  // Ez fut le, amikor az egér (vagy az ujj) mozog húzás közben.
  function mozgat(esemeny) {
    const p = egerHelye(esemeny);

    // Hol van az egér a színkörön? (0° = felül, óramutató járása szerint)
    // Math.atan2 = a középpontból nézve az egér szöge radiánban; átváltjuk fokba.
    const fok = Math.atan2(p.x - 100, 100 - p.y) * 180 / Math.PI;
    // Az "eltolas" miatt a megfogott pont kerül az egér alá, az alapszín pedig annyival odébb van.
    alap.h = ((fok - huzas.eltolas) % 360 + 360) % 360;

    // A középponttól mért távolságból világosság (a monokróm körnél ez fix marad)
    if (huzas.forma !== "sugar") {
      // Math.hypot = két szám "átfogója": az egér távolsága a középponttól.
      const sugar = Math.min(100, Math.hypot(p.x - 100, p.y - 100));
      // A világosságot 10 és 90% közé szorítjuk, hogy ne legyen teljesen fekete vagy fehér.
      alap.l = Math.max(10, Math.min(90, sugarVilagossag(sugar)));
    }

    // Szürkén nem látszik az árnyalat, ezért ilyenkor élénkebbre állítjuk
    if (alap.s < 20) {
      alap.s = 70;
    }

    alapHex = hslToHex(alap.h, alap.s, alap.l);
    szinvalaszto.value = alapHex; // a színválasztó is kövesse a változást
    szinharmoniakFrissit();       // újraszámolunk és újrarajzolunk mindent
  }

  // Amikor lenyomjuk az egérgombot (vagy ujjal hozzáérünk) a körön
  hely.addEventListener("pointerdown", function (esemeny) {
    const adat = korAdatok[helyId];
    const p = egerHelye(esemeny);

    // Melyik pontot fogtuk meg? Amelyik a legközelebb van.
    let legkozelebbi = 0;
    let legkisebbTav = Infinity; // Infinity = végtelen: bármilyen valódi távolság kisebb nála
    for (let i = 0; i < adat.poziciok.length; i++) {
      const tav = Math.hypot(adat.poziciok[i].x - p.x, adat.poziciok[i].y - p.y);
      if (tav < legkisebbTav) {
        legkisebbTav = tav;
        legkozelebbi = i;
      }
    }

    // Hány fokkal van a megfogott pont az alapszíntől? (pl. a komplementer: 180)
    huzas = {
      forma: adat.forma,
      eltolas: adat.lista[legkozelebbi].fok - alap.h
    };

    hely.setPointerCapture(esemeny.pointerId); // a húzás akkor is megy, ha kicsúszik az egér a körből
    mozgat(esemeny); // a pont azonnal az egérhez ugrik
  });

  // Amikor az egér mozog
  hely.addEventListener("pointermove", function (esemeny) {
    // Csak akkor reagálunk, ha épp húzunk valamit.
    if (huzas !== null) {
      mozgat(esemeny);
    }
  });

  // Amikor elengedjük az egérgombot: vége a húzásnak.
  function vege() {
    huzas = null;
  }
  hely.addEventListener("pointerup", vege);
  hely.addEventListener("pointercancel", vege); // pl. ha a telefon megszakítja az érintést
}

// =====================================================
// 5. SZÍNHARMÓNIÁK
// =====================================================

// Minden harmónia egy lista elem. Új harmóniát úgy adhatsz hozzá, hogy ide beírsz egyet.
// fokok = hány fokkal forgatjuk el az alapszínt a színkörön
//   id = egyedi azonosító, cim = cím, forma = hogyan rajzoljuk a kört, nevek = a színek nevei
const harmoniak = [
  {
    id: "komplementer",
    cim: "Komplementer szín",
    forma: "vonal",
    fokok: [0, 180],
    nevek: ["Alapszín", "Komplementer (+180°)"],
    leiras: "A színkör átellenes színe, 180°-ra az alapszíntől. Nagyon erős kontrasztot ad, ezért gombokhoz és kiemelésekhez jó. Nagy felületen egymás mellett viszont vibrálnak."
  },
  {
    id: "analog",
    cim: "Analóg színek",
    forma: "kozep",
    fokok: [-30, 0, 30],
    nevek: ["Analóg (−30°)", "Alapszín", "Analóg (+30°)"],
    leiras: "A színkörön egymás mellett lévő színek (±30°). Nyugodt, harmonikus hatást keltenek, mint egy naplemente árnyalatai."
  },
  {
    id: "triad",
    cim: "Színhármas (triád)",
    forma: "sokszog",
    fokok: [0, 120, 240],
    nevek: ["Alapszín", "Triád (+120°)", "Triád (+240°)"],
    leiras: "Három szín egyenlő távolságra a színkörön, 120°-onként. Élénk, de kiegyensúlyozott. Válassz egy főszínt, a másik kettőt használd kiemelésre."
  },
  {
    id: "osztott",
    cim: "Osztott komplementer",
    forma: "sokszog",
    fokok: [0, 150, 210],
    nevek: ["Alapszín", "Osztott (+150°)", "Osztott (+210°)"],
    leiras: "Az alapszín és a komplementere két szomszédja (150° és 210°). Erős kontraszt, de nem olyan feszes, mint a sima komplementer."
  },
  {
    id: "tetrad",
    cim: "Négyes harmónia (tetrád)",
    forma: "sokszog",
    fokok: [0, 90, 180, 270],
    nevek: ["Alapszín", "+90°", "+180°", "+270°"],
    leiras: "Négy szín, 90°-onként a színkörön. Sok szín, ezért válassz egyet főszínnek, a többit csak apró részletekhez használd."
  },
  {
    // A monokrómnál nem az árnyalatot forgatjuk, hanem a világosságot változtatjuk,
    // ezért itt "fokok" helyett "vilagossagok" van.
    id: "monokrom",
    cim: "Monokróm árnyalatok",
    forma: "sugar",
    vilagossagok: [20, 35, 50, 65, 80],
    leiras: "Ugyanaz a szín világosabb és sötétebb változatokban. Egyszerű, és mindig jól néz ki. A pontok ugyanazon az árnyalaton ülnek, csak a világosságuk más."
  }
];

// A harmónia kártyák létrehozása (egyszer, az oldal betöltésekor)
function harmoniaKartyakLetrehoz() {
  const hely = document.getElementById("harmoniak");

  for (let i = 0; i < harmoniak.length; i++) {
    const h = harmoniak[i];
    // Egy új <section> elem, ami egy kártya lesz.
    const kartya = document.createElement("section");
    kartya.className = "kartya";
    // A kártya belseje: cím, színkör (üres hely), leírás, és üres hely a színkártyáknak.
    // Az id-kban a harmónia azonosítója szerepel (pl. "kor-triad"), hogy később meg tudjuk találni.
    kartya.innerHTML =
      "<h2>" + h.cim + "</h2>" +
      '<div class="harmonia">' +
        '<div class="kor" id="kor-' + h.id + '"></div>' +
        '<div class="harmonia-jobb">' +
          '<p class="leiras">' + h.leiras + " Fogd meg és húzd a kör pontjait!</p>" +
          '<div class="szinek" id="szinek-' + h.id + '"></div>' +
        "</div>" +
      "</div>";
    hely.appendChild(kartya);
    // A kártya színköre mostantól húzható.
    korMozgathato("kor-" + h.id);
  }
}

// Egy színes kártya a szín nevével és kódjával. Kattintásra a kódot kimásolja.
function szinDoboz(nev, hex) {
  const gomb = document.createElement("button");
  gomb.type = "button";
  gomb.className = "minta";
  gomb.title = "Kattints a HEX kód másolásához"; // ez az egér fölé érve megjelenő súgó
  gomb.innerHTML =
    '<span class="minta-szin" style="background:' + hex + '"></span>' +
    '<span class="minta-szoveg"><span class="minta-nev">' + nev + '</span><span class="minta-hex">' + hex + "</span></span>";

  gomb.addEventListener("click", function () {
    const hexHely = gomb.querySelector(".minta-hex");

    // Ha sikerült a másolás, egy másodpercre kiírjuk, hogy "Másolva!"
    function kesz() {
      hexHely.textContent = "Másolva!";
      // setTimeout = 1000 ezredmásodperc (1 mp) múlva lefut a függvény: visszaírja a HEX kódot.
      setTimeout(function () {
        hexHely.textContent = hex;
      }, 1000);
    }

    // Csak akkor másolunk, ha a böngésző engedi a vágólap használatát.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Ha a másolás nem sikerül (pl. nincs engedély), a catch miatt nem lesz hibaüzenet.
      navigator.clipboard.writeText(hex).then(kesz).catch(function () {});
    }
  });

  return gomb;
}

// Egy paletta kirajzolása egy adott helyre az oldalon
function palettaKirajzol(helyId, lista) {
  const hely = document.getElementById(helyId);
  hely.innerHTML = ""; // előző tartalom törlése
  // A CSS ebből a --db változóból tudja, hány oszlop legyen (ahány szín van).
  hely.style.setProperty("--db", lista.length);

  for (let i = 0; i < lista.length; i++) {
    hely.appendChild(szinDoboz(lista[i].nev, lista[i].hex));
  }
}

// Ez a legfontosabb függvény: az alapszínből újraszámol és újrarajzol mindent.
// Akkor hívjuk meg, ha az alapszín bármikor megváltozik.
function szinharmoniakFrissit() {
  const rgb = hexToRgb(alapHex);

  // Segéd: az alapszínből kiindulva elforgatunk a színkörön "fok" fokkal
  function forgat(fok) {
    return hslToHex(alap.h + fok, alap.s, alap.l);
  }

  // Alapszín adatai
  document.getElementById("szinadatok").innerHTML =
    "<p><span>HEX</span>" + alapHex + "</p>" +
    "<p><span>RGB</span>" + rgb.r + ", " + rgb.g + ", " + rgb.b + "</p>" +
    "<p><span>HSL</span>" + Math.round(alap.h) + "°, " + Math.round(alap.s) + "%, " + Math.round(alap.l) + "%</p>";

  // Ha a szín majdnem szürke, a harmóniák sem lesznek érdekesek
  // A hidden = true elrejti, a false megmutatja az elemet.
  document.getElementById("szurkeJegyzet").hidden = alap.s >= 10;

  // A színkör az alapszínnel
  korKirajzol("kor-alap", [{ hex: alapHex, fok: alap.h, vil: alap.l, alap: true }], "kozep");

  // Minden harmónia kiszámolása és kirajzolása
  for (let i = 0; i < harmoniak.length; i++) {
    const h = harmoniak[i];
    const lista = []; // ide gyűjtjük a harmónia színeit

    if (h.forma === "sugar") {
      // monokróm: a világosság változik, az árnyalat nem
      for (let j = 0; j < h.vilagossagok.length; j++) {
        lista.push({
          nev: "Világosság " + h.vilagossagok[j] + "%",
          hex: hslToHex(alap.h, alap.s, h.vilagossagok[j]),
          fok: alap.h,
          vil: h.vilagossagok[j]
        });
      }
    } else {
      // a többi: az árnyalatot forgatjuk
      for (let j = 0; j < h.fokok.length; j++) {
        lista.push({
          nev: h.nevek[j],
          hex: forgat(h.fokok[j]),
          fok: alap.h + h.fokok[j],
          vil: alap.l,
          alap: h.fokok[j] === 0 // az a szín az alapszín, ami 0 fokkal van elforgatva
        });
      }
    }

    // Kirajzoljuk a színkártyákat és a színkört is.
    palettaKirajzol("szinek-" + h.id, lista);
    korKirajzol("kor-" + h.id, lista, h.forma);
  }

  // Kontraszt az alapszínen
  const feherArany = kontrasztArany(alapHex, "#ffffff");
  const feketeArany = kontrasztArany(alapHex, "#000000");

  // A két doboz háttere az alapszín, a szöveg fehér, illetve fekete.
  const feherDoboz = document.getElementById("feherSzoveg");
  feherDoboz.style.backgroundColor = alapHex;
  feherDoboz.style.color = "#ffffff";
  document.getElementById("feherAdat").textContent =
    feherArany.toFixed(2) + " : 1 – " + ertekeles(feherArany);

  const feketeDoboz = document.getElementById("feketeSzoveg");
  feketeDoboz.style.backgroundColor = alapHex;
  feketeDoboz.style.color = "#000000";
  document.getElementById("feketeAdat").textContent =
    feketeArany.toFixed(2) + " : 1 – " + ertekeles(feketeArany);
}

// Az alapszín beállítása a színválasztó értékéből
function alapszinBeolvas() {
  alapHex = szinvalaszto.value;
  const rgb = hexToRgb(alapHex);
  alap = rgbToHsl(rgb.r, rgb.g, rgb.b);
}

// Amikor a felhasználó mozgatja a színválasztót, újraszámolunk mindent
szinvalaszto.addEventListener("input", function () {
  alapszinBeolvas();
  szinharmoniakFrissit();
});

// Véletlen szín gomb: véletlen árnyalat, jól látható telítettséggel
document.getElementById("veletlenGomb").addEventListener("click", function () {
  // Math.random() = 0 és 1 közötti véletlen szám; 360-nal szorozva és lekerekítve (Math.floor) véletlen fok lesz.
  alap = { h: Math.floor(Math.random() * 360), s: 75, l: 52 };
  alapHex = hslToHex(alap.h, alap.s, alap.l);
  szinvalaszto.value = alapHex;
  szinharmoniakFrissit();
});

// =====================================================
// 6. AZ OLDAL SZÍNEINEK BEÁLLÍTÁSA (3 legördülő lista)
// =====================================================

// Ez a 10 szín szerepel mindhárom listában
const szinLista = [
  { nev: "Fehér", hex: "#ffffff" },
  { nev: "Krém", hex: "#fef3c7" },
  { nev: "Fekete", hex: "#111111" },
  { nev: "Sötétkék", hex: "#1e3a8a" },
  { nev: "Égkék", hex: "#38bdf8" },
  { nev: "Zöld", hex: "#16a34a" },
  { nev: "Sárga", hex: "#facc15" },
  { nev: "Narancs", hex: "#f97316" },
  { nev: "Piros", hex: "#dc2626" },
  { nev: "Lila", hex: "#7c3aed" }
];

// A három legördülő lista az oldalról
const foLista = document.getElementById("foSzin");
const masodlagosLista = document.getElementById("masodlagosSzin");
const betuLista = document.getElementById("betuSzin");

// A lista feltöltése a 10 színnel
function listaFeltolt(lista, alapertelmezettIndex) {
  for (let i = 0; i < szinLista.length; i++) {
    // Minden színhez egy <option> (a lista egy sora) készül.
    const opcio = document.createElement("option");
    opcio.value = szinLista[i].hex;  // a lista értéke a HEX kód
    opcio.textContent = szinLista[i].nev + " (" + szinLista[i].hex + ")"; // a látható szöveg
    lista.appendChild(opcio);
  }
  // Melyik sor legyen alapból kiválasztva (0 = az első).
  lista.selectedIndex = alapertelmezettIndex;
}

listaFeltolt(foLista, 0);          // Fehér
listaFeltolt(masodlagosLista, 4);  // Égkék
listaFeltolt(betuLista, 2);        // Fekete

// Üzenet hozzáadása a listához. tipus: "jo", "figyelem" vagy "rossz"
function uzenetHozzaad(tipus, szoveg) {
  const elem = document.createElement("li"); // egy új listaelem
  elem.className = tipus;                    // a CSS ez alapján színezi (zöld, sárga vagy piros)
  elem.textContent = szoveg;
  document.getElementById("uzenetek").appendChild(elem);
}

// Egy betűszín–háttérszín páros ellenőrzése
function parEllenoriz(hatterNev, hatterHex, betuHex) {
  // Ha a két szín ugyanaz, nem is kell számolni: a szöveg láthatatlan.
  if (hatterHex === betuHex) {
    uzenetHozzaad("rossz", "❌ A betűszín ugyanaz, mint a " + hatterNev + " – a szöveg láthatatlan!");
    return; // a return kilép a függvényből, a lenti rész már nem fut le
  }

  const arany = kontrasztArany(hatterHex, betuHex);
  const szoveg = "A betű és a " + hatterNev + " kontrasztja: " + arany.toFixed(2) + " : 1 – " + ertekeles(arany) + ".";

  // A kontrasztarány szerint más-más üzenetet írunk ki.
  if (arany >= 7) {
    uzenetHozzaad("jo", "✅ " + szoveg);
  } else if (arany >= 4.5) {
    uzenetHozzaad("jo", "👍 " + szoveg);
  } else if (arany >= 3) {
    uzenetHozzaad("figyelem", "⚠️ " + szoveg + " Hosszú szövegnél nehezen olvasható.");
  } else {
    uzenetHozzaad("rossz", "❌ Rossz a kontraszt! " + szoveg);
  }
}

// Itt "írjuk át a CSS-t": a :root-ban lévő változókat átállítjuk,
// és a style.css minden helyen var(--...) formában használja őket.
function temaAlkalmaz() {
  // A három lista jelenlegi értéke (a kiválasztott színek HEX kódja).
  const fo = foLista.value;
  const masodlagos = masodlagosLista.value;
  const betu = betuLista.value;

  const gyoker = document.documentElement; // ez a <html> elem, vagyis a :root
  // setProperty = a CSS-változó értékének átírása. Az oldal minden eleme azonnal követi.
  gyoker.style.setProperty("--fo-szin", fo);
  gyoker.style.setProperty("--masodlagos-szin", masodlagos);
  gyoker.style.setProperty("--betu-szin", betu);

  // A kis színes négyzetek a listák mellett
  document.getElementById("mintaFo").style.backgroundColor = fo;
  document.getElementById("mintaMasodlagos").style.backgroundColor = masodlagos;
  document.getElementById("mintaBetu").style.backgroundColor = betu;

  // Üzenetek újraírása
  document.getElementById("uzenetek").innerHTML = ""; // először töröljük a régieket

  // A betűszín a háttéren és a fejlécen is olvasható-e?
  parEllenoriz("fő szín (háttér)", fo, betu);
  parEllenoriz("másodlagos szín (fejléc, lábléc)", masodlagos, betu);

  // Fő és másodlagos szín egymáshoz képest
  if (fo === masodlagos) {
    uzenetHozzaad("rossz", "❌ A fő és a másodlagos szín ugyanaz – a fejléc és a keretek eltűntek az oldalon.");
  } else if (kontrasztArany(fo, masodlagos) < 1.3) {
    uzenetHozzaad("figyelem", "⚠️ A fő és a másodlagos szín nagyon hasonló, alig látszik a különbség köztük.");
  } else {
    uzenetHozzaad("jo", "✅ A fő és a másodlagos szín jól elkülönül egymástól.");
  }

  // Egy kis színelméleti tipp: piros–zöld párosítás
  const sz = [fo, masodlagos, betu];
  // indexOf = megmondja, hol van az elem a listában; -1 azt jelenti, hogy nincs benne.
  if (sz.indexOf("#dc2626") !== -1 && sz.indexOf("#16a34a") !== -1) {
    uzenetHozzaad("figyelem", "⚠️ Piros és zöld együtt: a színtévesztők (kb. 8% a férfiaknál) nehezen különböztetik meg őket.");
  }
}

// Amikor bármelyik listában másik színt választanak ("change" esemény), újraalkalmazzuk a témát.
foLista.addEventListener("change", temaAlkalmaz);
masodlagosLista.addEventListener("change", temaAlkalmaz);
betuLista.addEventListener("change", temaAlkalmaz);

// =====================================================
// 7. INDÍTÁS – az oldal betöltésekor egyszer lefuttatjuk
// =====================================================
// A fenti részek csak a függvényeket készítették el. Itt indul el ténylegesen minden.
harmoniaKartyakLetrehoz(); // a harmónia kártyák létrehozása
korMozgathato("kor-alap"); // az alapszín színköre húzható lesz
keveroFrissit();           // az RGB-keverő kezdőállapota
alapszinBeolvas();         // az alapszín beolvasása a színválasztóból
szinharmoniakFrissit();    // a harmóniák, színkörök és kontrasztok kirajzolása
temaAlkalmaz();            // az oldal színeinek beállítása és az üzenetek kiírása
