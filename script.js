let svgDoc; // isi SVG
let signals = {};
let wesels = {};

// tunggu svg selesai load
document.getElementById("stasiun").addEventListener("load", function () {
  svgDoc = this.contentDocument;

  // ambil sinyal
  ["S1", "S2", "S3", "S4", "S5", "S6"].forEach(id => {
    signals[id] = svgDoc.getElementById(id);
  });

  // ambil wesel
  ["wesel1", "wesel2"].forEach(id => {
    wesels[id] = svgDoc.getElementById(id);
  });
});

// ubah warna sinyal
function toggleSignal(id) {
  if (!signals[id]) return;
  if (signals[id].classList.contains("signal-red")) {
    signals[id].classList.remove("signal-red");
    signals[id].classList.add("signal-green");
  } else {
    signals[id].classList.remove("signal-green");
    signals[id].classList.add("signal-red");
  }
}

// ganti posisi wesel
function toggleWesel(id) {
  if (!wesels[id]) return;
  let el = wesels[id];
  if (el.getAttribute("data-pos") === "belok") {
    el.setAttribute("x2", parseInt(el.getAttribute("x2")) - 50); // lurus
    el.setAttribute("data-pos", "lurus");
  } else {
    el.setAttribute("x2", parseInt(el.getAttribute("x2")) + 50); // belok
    el.setAttribute("data-pos", "belok");
  }
}

// animasi kereta
function jalankanKereta() {
  if (!svgDoc) return;
  let svg = svgDoc.querySelector("svg");

  // bikin kereta (lok + gerbong)
  let kereta = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  kereta.setAttribute("x", 140);
  kereta.setAttribute("y", 520);
  kereta.setAttribute("width", 20);
  kereta.setAttribute("height", 10);
  kereta.setAttribute("fill", "blue");
  svg.appendChild(kereta);

  let y = 520;
  let interval = setInterval(() => {
    y -= 2;
    kereta.setAttribute("y", y);
    if (y <= 100) clearInterval(interval);
  }, 50);
}
