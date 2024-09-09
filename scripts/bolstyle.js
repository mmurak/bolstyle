class GlobalManager {
	constructor() {
		this.inputSentenceButton = document.getElementById("InputSentenceButton");
		this.svgArea = document.getElementById("SVGarea");
		this.svgNS = this.svgArea.namespaceURI;

		this.loadSVG = document.getElementById("LoadSVG");
		this.loadSVG.addEventListener("change", loadSVG);

		this.uiField = document.getElementById("UIfield");
		this.mouseInMotion = false;
		this.uiField.addEventListener("mouseup", (evt) => {
			this.mouseInMotion = false;
			this.dragStartNo = -1;
		});
		this.uiField.addEventListener("mouseleave", (evt) => {
			this.mouseInMotion = false;
			this.dragStartNo = -1;
		});

		this.svgWidth = document.getElementById("SVGwidth");
		this.svgWidth.addEventListener("change", _adjustWidth);

		this.rulerField = document.getElementById("RulerField");
		this.rulerCanvas = document.createElement("canvas");
		this.rulerCanvas.width = this.svgWidth.value;
		this.rulerCanvas.height = 400;
		this.rulerField.appendChild(this.rulerCanvas);
		this.rulerCtx = this.rulerCanvas.getContext("2d");

		this.steps = document.getElementById("Steps");

		this.sentence = "";
		this.blankWidth = 15;
		this.leftMargin = 20;
		this.baselineHeight = 200;
		this.fontFamily = "Times New Roman";
		this.fontSize = 48;
		this.tagId = 1;
		this.dragStartNo = -1;
	}
}

const G = new GlobalManager();
_paintBackground();
_eraseRuler();
_clearUIfield();
_adjustWidth();

function processInputSentence() {
	G.sentence = prompt("Input sentence.");
	if (G.sentence == null) return;
	_eraseRuler();
	let cArray = _specialSplit(G.sentence);
	let yArray = Array(cArray.length).fill(G.baselineHeight);
	_buildUpField(cArray, yArray);
}

function _buildUpField(cArray, yArray) {
	// Clear the SVG area
	while(G.svgArea.firstChild) {
		G.svgArea.removeChild(G.svgArea.lastChild);
	}
	_paintBackground();
	_clearUIfield();
	let x = G.leftMargin;
	G.tagId = 1;
	for (let ch of cArray) {
		// Create SVG text node
		let txt = document.createElementNS(G.svgNS,"text");
		txt.setAttribute("font-family", G.fontFamily);
		txt.setAttribute("font-size", G.fontSize);
		txt.setAttribute("x", Math.trunc(x));
		txt.setAttribute("y", yArray.shift());
		txt.setAttribute("id", "t"+G.tagId);
		txt.innerHTML = ch;
		G.svgArea.appendChild(txt);
		// Determine character width
		let thisX = (ch != " ") ? txt.getBBox().width : G.blankWidth;
		// Create Cover canvas
		let cover = document.createElement("canvas");
		cover.width = thisX;
		cover.height = 400;
		cover.id = "r" + G.tagId;
		cover.addEventListener("mousedown", processMouseDown);
		cover.addEventListener("mouseenter", processMouseEnter);
		let ctx = cover.getContext("2d");
//		ctx.fillStyle = (G.tagId % 2 == 0) ? "green" : "red";
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, thisX, 400);
		cover.setAttribute("style", "position: absolute; left: " + x + "px;");
		G.uiField.appendChild(cover);
		// House keeping
		x += thisX;
		G.tagId++;
	}
}

function _clearUIfield() {
	// Clear & setup UI field
	while(G.uiField.firstChild) {
		G.uiField.removeChild(G.uiField.lastChild);
	}
	let margin = document.createElement("canvas");
	margin.width = G.leftMargin;
	margin.height = 400;
	margin.id = "r0";
	margin.addEventListener("click", _clearTagSelection);
	let marginCtx = margin.getContext("2d");
	marginCtx.fillStyle = "orange";
	marginCtx.fillRect(0, 0, G.leftMargin, 400);
	margin.setAttribute("style", "position: absolute; left: 0px;");
	G.uiField.appendChild(margin);
}

function _paintBackground() {
	let rect = document.createElementNS(G.svgNS,"rect");
	rect.setAttribute("width", "100%");
	rect.setAttribute("height", "100%");
	rect.setAttribute("fill", "lightGray");
	G.svgArea.appendChild(rect);
}

function _clearTagSelection() {
	if (G.tagId <= 1) return;
	_paintText(1, G.tagId - 1, "black");
	_eraseRuler();
}

function _getTagColour(tId) {
	const tag = document.getElementById("t" + tId);
	return tag.getAttribute("fill");
}

function _paintText(numFrom, numTo, colour) {
	let low = Number(numFrom);
	let high = Number(numTo);
	if (low > high) {
		const temp = low;
		low = high;
		high = temp;
	}
	for (let i = low; i <= high; i++) {
		const obj = document.getElementById("t" + i);
		obj.setAttribute("fill", colour);
		obj.setAttribute("stroke", colour);
	}
}
function _adjustWidth() {
	G.svgArea.setAttribute("width", G.svgWidth.value);
}

function _specialSplit(str) {
	let arr = str.split("");
	let result = [];
	let i = arr.length - 1;
	while (i >= 0) {
		if (arr[i] == "\u0301") {
			result.unshift(arr[i-1]+"\u0301");
			i -= 2;
		} else {
			result.unshift(arr[i]);
			i--;
		}
	}
	return result;
}

function _eraseRuler() {
	G.rulerCtx.fillStyle = "white";
	G.rulerCtx.fillRect(0, 0, G.svgWidth.value, 400);
}
function _drawRuler(y) {
	G.rulerCtx.fillStyle = "red";
	G.rulerCtx.lineWidth = 2;
	G.rulerCtx.beginPath();
	G.rulerCtx.moveTo(0, y);
	G.rulerCtx.lineTo(G.svgWidth.value, y);
	G.rulerCtx.stroke();
}

function processMouseDown(evt) {
	G.mouseInMotion = true;
	_clearTagSelection();
	let rId = evt.target.id;
	G.dragStartNo = rId.substring(1)
	_eraseRuler();
	let obj = document.getElementById("t" + G.dragStartNo);
	_drawRuler(obj.getAttribute("y"));
	_paintText(G.dragStartNo, G.dragStartNo, "red");
	evt.preventDefault();
}

function processMouseEnter(evt) {
	if (!G.mouseInMotion)  return;
	let rId = evt.target.id;
	_paintText(G.dragStartNo,  rId.substring(1), "red");
	evt.preventDefault();
}

function upTune() {
	const steps = Number(G.steps.value);
	for (let i = 1; i < G.tagId; i++) {
		if (_getTagColour(i) == "red") {
			const tag = document.getElementById("t" + i);
			tag.setAttribute("y", Number(tag.getAttribute("y")) - steps);
			_eraseRuler();
			_drawRuler(tag.getAttribute("y"));
		}
	}
}

function downTune() {
	const steps = Number(G.steps.value);
	for (let i = 1; i < G.tagId; i++) {
		if (_getTagColour(i) == "red") {
			const tag = document.getElementById("t" + i);
			tag.setAttribute("y", Number(tag.getAttribute("y")) + steps);
			_eraseRuler();
			_drawRuler(tag.getAttribute("y"));
		}
	}
}

function legato() {
	let high = G.tagId - 1;
	while(high > 0) {
		const obj = document.getElementById("t" + high);
		if (obj.getAttribute("fill") == "red") break;
		high--;
	}
	if (high == 0) return;
	let low = 1;
	while(true) {
		const obj = document.getElementById("t" + low);
		if (obj.getAttribute("fill") == "red") break;
		low++;
	}
	const dFactor = high - low;
	if (dFactor < 2) return;
	const startObj = document.getElementById("t" + low);
	const startY = Number(startObj.getAttribute("y"));
	const endObj = document.getElementById("t" + high);
	const endY = Number(endObj.getAttribute("y"));
	const deltaY = (endY - startY) / dFactor;
	let currentY = startY;
	for (let i = low + 1; i < high; i++) {
		currentY += deltaY;
		const obj = document.getElementById("t" + i);
		obj.setAttribute("y", currentY);
	}
}

function toggleAcute() {
	for (let i = 1; i < G.tagId; i++) {
		const obj = document.getElementById("t" + i);
		if (obj.getAttribute("fill") == "red") {
			if (obj.innerHTML.indexOf("\u0301") != -1) {
				obj.innerHTML = obj.innerHTML.replace("\u0301", "");
			} else {
				obj.innerHTML = obj.innerHTML + "\u0301";
			}
		}
	}
}

function deleteChars() {
	let newArray = [];
	let newYarray = [];
	_eraseRuler();
	for (i = 1; i < G.tagId; i++) {
		const obj = document.getElementById("t" + i);
		if (obj.getAttribute("fill") != "red") {
			newArray.push(obj.innerHTML);
			newYarray.push(obj.getAttribute("y"));
		}
	}
	_buildUpField(newArray, newYarray);
}

function insertAfter() {
	const phrase = prompt("Input phrase.");
	if (phrase == null) return;
	_eraseRuler();
	let idx = G.tagId - 1;
	while ((idx > 0) && (document.getElementById("t" + idx).getAttribute("fill") != "red")) {
		idx--;
	}
	let newArray = [];
	let newYarray = []
	for (let i = 1; i <= idx; i++) {
		const obj = document.getElementById("t" + i);
		newArray.push(obj.innerHTML);
		newYarray.push(obj.getAttribute("y"));
	}
	newArray = newArray.concat(_specialSplit(phrase));
	newYarray = newYarray.concat(Array(phrase.length).fill(G.baselineHeight));
	for (let i = idx+1; i < G.tagId; i++) {
		const obj = document.getElementById("t" + i);
		newArray.push(obj.innerHTML);
		newYarray.push(obj.getAttribute("y"));
	}
	_buildUpField(newArray, newYarray);
}

async function loadSVG() {
	const file = G.loadSVG.files[0];
	await readFile(file);
}
async function readFile(file) {
	const reader = new FileReader();
	reader.onload = function (e) {
		const svgCode = e.target.result;
//		G.svgArea.innerHTML = svgCode;
		G.svgArea.remove();
		document.getElementById("Pnode").innerHTML = svgCode;
		G.svgArea = document.getElementById("SVGarea");
		G.svgWidth.value = G.svgArea.getAttribute("width");

		// Some of the lines are violating DRY!  for now...
		let x = G.leftMargin;
		for (G.tagId = 1; ; G.tagId++) {
			const obj = document.getElementById("t" + G.tagId);
			if (obj == null) break;
			let thisX = (obj.innerHTML != " ") ? obj.getBBox().width : G.blankWidth;
			// Create Cover canvas
			let cover = document.createElement("canvas");
			cover.width = thisX;
			cover.height = 400;
			cover.id = "r" + G.tagId;
			cover.addEventListener("mousedown", processMouseDown);
			cover.addEventListener("mouseenter", processMouseEnter);
			let ctx = cover.getContext("2d");
//			ctx.fillStyle = (G.tagId % 2 == 0) ? "green" : "red";
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, thisX, 400);
			cover.setAttribute("style", "position: absolute; left: " + x + "px;");
			G.uiField.appendChild(cover);
			x += thisX;
		}
	};
	reader.readAsText(file);
}

function saveSVG() {
	_clearTagSelection();

	G.svgArea.setAttribute("width", G.svgWidth.value);
	const svgText = new XMLSerializer().serializeToString(G.svgArea);
	const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
	const svgUrl = URL.createObjectURL(svgBlob);

	const a = document.createElement('a');
	a.href = svgUrl;
	a.download = "output";

	document.body.appendChild(a);
	a.click();

	document.body.removeChild(a);
	URL.revokeObjectURL(svgUrl);	
}
