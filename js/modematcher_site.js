function modematcherSite() {

/**
 * BEGIN ARGS
 */

var chordProgression = []
var default_chord = makeCommonChord('A', 'major')
var root = 'C'

/**
 * BEGIN WEB DISPLAY
 */

var Convert = require('ansi-to-html');
var convert = new Convert();
 
function clearSelect(select) {
    var length = select.options.length;
    for (i = length-1; i >= 0; i--) {
      select.options[i] = null;
    }
}

function addButtons(){
    var app = document.getElementById("app");
    var add_chord = document.createElement("button");
    add_chord.id = 'add_chord';
    add_chord.textContent = 'Add Chord';
    add_chord.onclick = function() {
         var t = document.getElementById('type')
         var cf = document.getElementById('chromatic_formula')
         chordProgression.push(new Chord(t.value, Note.fromStr(root), new ChromaticScale(cf.value.split(' '))))
         // TODO display chords
         console.log(chordProgression)
    }
    app.appendChild(add_chord);
    app.appendChild(document.createElement("br"));

    var generate = document.createElement("button");
    generate.id = 'generate';
    generate.textContent = 'Match!';
    generate.onclick = function() {
          // TODO display chords
          console.log(chordsScales(scales, chordProgression))
          console.log(chordsScales(scales, chordProgression, chordProgression[0].root))
          console.log(pairMergedChordsScales(scales, chordProgression, chordProgression[0].root))
          console.log(pairMergedChordsScales(scales, chordProgression))
          console.log(chordMergedChordsScales(scales, chordProgression, chordProgression[0]))
          console.log(chordMergedChordsScales(scales, chordProgression, chordProgression[0], chordProgression[0].root))
    }
    app.appendChild(generate);
 
    // Append a line break
    app.appendChild(document.createElement("br"));
}

function addCommonChordSelect() {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("Chord Root Note: "));
    // Create an <input> element, set its type and name attributes
    var input = document.createElement("input");
    input.type = "text";
    input.name = "root";
    input.id = "root";
    input.defaultValue = root
    input.onchange = function() { 
      r = document.getElementById('root')
      root = r.value
    }

    var check = document.createElement("input");
    check.type = "radio"
    check.name = "common_chord_selector";
    check.id = "common_chord_selector";
    check.checked = false 
    check.onclick = function() {
      chrombox = document.getElementById('chromatic_formula');
      chrombox.style.display='none';
      scalebox = document.getElementById('major_formula');
      scalebox.style.display='';
      snamebox = document.getElementById('scale_name_select');
      mnamebox = document.getElementById('mode_name_select');
      snamebox.style.display='none';
      mnamebox.style.display='none';
    };


    app.appendChild(input);
    // Append a line break
    app.appendChild(document.createElement("br"));
}

function addChromaticFormula() {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("Chromatic Scale Formula: "));
    // Create an <input> element, set its type and name attributes

    var input = document.createElement("input");
    input.type = "text"
    input.name = "chromatic_formula";
    input.id = "chromatic_formula";
    input.value = default_chord.chromatic.notes.join(' ')
    input.style.display=''

    app.appendChild(input);
    // Append a line break
    app.appendChild(document.createElement("br"));
}

function setMajorFormulaFromType() {
    mf = document.getElementById('major_formula')
    cf = document.getElementById('chromatic_formula')
    var type = document.getElementById('type').value
    var c = makeCommonChord(root, type)
    mf.value = commonChordFormulas[type].join(' ')
    cf.value = c.chromatic.notes.join(' ')
}


function addMajorFormula() {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("type: "));
    // Create an <input> element, set its type and name attributes
    var input = document.createElement("select");
    input.name = "type";
    input.id = "type";
    for (var i in commonChordFormulas) {
        var option = document.createElement("option");
        option.value = i;
        option.text = i;
        input.appendChild(option);
    }
    input.selectedIndex = 0
    input.onchange = setMajorFormulaFromType 
    app.appendChild(input);

    app.appendChild(document.createTextNode("Major Scale Formula: "));
    // Create an <input> element, set its type and name attributes
    var input = document.createElement("input");
    input.type = "text"
    input.name = "major_formula";
    input.id = "major_formula";
    input.value = commonChordFormulas['major'].join(' ')
    input.style.display=''
    input.onchange = function() {
      var mf = document.getElementById('major_formula').value
      var cf = document.getElementById('chromatic_formula')
      var c = parseChord(root, mf.split(' '))
      cf = c.chromatic.notes.join(' ')
    }

    app.appendChild(input);
    // Append a line break
    app.appendChild(document.createElement("br"));
}

function addChordSelection() {
    addCommonChordSelect()
    addMajorFormula()
    addChromaticFormula()
}

addChordSelection()
addButtons()

}
