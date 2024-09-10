class GlobalManager {
	constructor() {
		this.sentence = "";
		this.blankWidth = 15;
		this.leftMargin = 20;
		this.areaHeight = 400;
		this.baselineHeight = 200;
		this.fontFamily = "Times New Roman";
		this.fontSize = 48;
		this.tagId = 1;
		this.dragStartNo = -1;

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

		this.backgroundColour = document.getElementById("BackgroundColour");
		this.backgroundColour.addEventListener("change", _changeBackgroundColour);

		this.rulerField = document.getElementById("RulerField");
		this.rulerCanvas = document.createElement("canvas");
		this.rulerCanvas.width = this.svgWidth.value;
		this.rulerCanvas.height = this.areaHeight;
		this.rulerField.appendChild(this.rulerCanvas);
		this.rulerCtx = this.rulerCanvas.getContext("2d");

		this.steps = document.getElementById("Steps");

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
		cover.height = G.areaHeight;
		cover.id = "r" + G.tagId;
		cover.addEventListener("mousedown", processMouseDown);
		cover.addEventListener("mouseenter", processMouseEnter);
		let ctx = cover.getContext("2d");
//		ctx.fillStyle = (G.tagId % 2 == 0) ? "green" : "red";
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, thisX, G.areaHeight);
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
	margin.height = G.areaHeight;
	margin.id = "r0";
	margin.addEventListener("click", _clearTagSelection);
	let marginCtx = margin.getContext("2d");
	marginCtx.fillStyle = "orange";
	marginCtx.fillRect(0, 0, G.leftMargin, G.areaHeight);
	margin.setAttribute("style", "position: absolute; left: 0px;");
	G.uiField.appendChild(margin);
}

function _paintBackground() {
	let rect = document.createElementNS(G.svgNS,"rect");
	rect.setAttribute("id", "bg");
	rect.setAttribute("width", "100%");
	rect.setAttribute("height", "100%");
	rect.setAttribute("fill", G.backgroundColour.options[G.backgroundColour.selectedIndex].value);
	G.svgArea.appendChild(rect);
}

function _changeBackgroundColour() {
	const obj = document.getElementById("bg");
	if (obj == null)  {
		alert("I couldn't find 'bg' identifier.  Please add the 'id=\"bg\" ' to the first 'rect' element.");
		G.backgroundColour.selectedIndex = 0;
		return;
	}
	obj.setAttribute("fill", G.backgroundColour.options[G.backgroundColour.selectedIndex].value);
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
	G.rulerCanvas.remove();
	G.rulerCanvas = document.createElement("canvas");
	G.rulerCanvas.width = G.svgWidth.value;
	G.rulerCanvas.height = G.areaHeight;
	G.rulerField.appendChild(G.rulerCanvas);
	G.rulerCtx = G.rulerCanvas.getContext("2d");
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
	G.rulerCtx.fillRect(0, 0, G.svgWidth.value, G.areaHeight);
}
function _drawRuler(y) {
	G.rulerCtx.fillStyle = "red";
	G.rulerCtx.lineWidth = 2;
	G.rulerCtx.beginPath();
	G.rulerCtx.moveTo(0, y);
	G.rulerCtx.lineTo(G.svgWidth.value, y);
	G.rulerCtx.stroke();
}

function _getWidth() {
	if (G.svgWidth.value.match(/^\d+$/)) {
		return G.svgWidth.value;
	} else {
		G.svgWidth.value = 1200;
		return G.svgWidth.value;
	}
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
	_eraseRuler();
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
		if (G.svgWidth.value == "") G.svgWidth.value = 1200;		// shabby patch
		_adjustWidth();
		let bColour = document.getElementById("bg");
		if (bColour == null) {
			G.backgroundColour.selectedIndex = 0;
		} else {
			G.backgroundColour.selectedIndex = (bColour.getAttribute("fill").toLowerCase() == "white") ? 1 : 0;
		}
		// Some of the lines are violating DRY!  for now...
		let x = G.leftMargin;
		for (G.tagId = 1; ; G.tagId++) {
			const obj = document.getElementById("t" + G.tagId);
			if (obj == null) break;
			let thisX = (obj.innerHTML != " ") ? obj.getBBox().width : G.blankWidth;
			// Create Cover canvas
			let cover = document.createElement("canvas");
			cover.width = thisX;
			cover.height = G.areaHeight;
			cover.id = "r" + G.tagId;
			cover.addEventListener("mousedown", processMouseDown);
			cover.addEventListener("mouseenter", processMouseEnter);
			let ctx = cover.getContext("2d");
//			ctx.fillStyle = (G.tagId % 2 == 0) ? "green" : "red";
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, thisX, G.areaHeight);
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

function savePNG() {
	saveAsPNG()
	.then((data) => {
		const a = document.createElement("a");
		a.href = data;
		a.download = "output";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(data);	
	})
	.catch((err) => {
		console.log("ERROR:" + err);
	});
}

function saveAsPNG() {
	_clearTagSelection();

	G.svgArea.setAttribute("width", G.svgWidth.value);
	const svgText = new XMLSerializer().serializeToString(G.svgArea);

	// Convert an SVG text to PNG using the browser
	return new Promise(function(resolve, reject) {
		try {
			let domUrl = window.URL || window.webkitURL || window;
			if (!domUrl) {
				throw new Error("Browser doesn't support DOM URL feature.")
			}

			let aCanvas = document.createElement("canvas");
			aCanvas.width = G.svgWidth.value;
			aCanvas.height = G.areaHeight;
			let aCanvasCtx = aCanvas.getContext("2d");
			let blob = new Blob([svgText], {
				type: "image/svg+xml;charset=utf-8"
			});
			let url = domUrl.createObjectURL(blob);

			let img = new Image;
			img.onload = function() {
				aCanvasCtx.drawImage(this, 0, 0, aCanvas.width, aCanvas.height);
				domUrl.revokeObjectURL(url);
				resolve(aCanvas.toDataURL());
			};
			img.src = url;
		} catch (err) {
			reject("failed to convert SVG to PNG: " + err);
		}
	});
};
