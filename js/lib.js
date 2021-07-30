class Fretboard {
    constructor(roots, fretNum, inlayPattern=null) {
        var strings = []
        for (i in roots) {
            strings.push(new GuitarString(Note.fromStr(roots[i]), fretNum))
        }
        this.strings = strings
        this.roots = roots
        this.fretNum = fretNum
        this.notesInScale = 0
        this.setInlayPattern(inlayPattern)
    }

    setChromatic(root, chromatic) {
        this.notesInScale = chromatic.notesInScale()
        for (i in this.strings) {
            var offset = root.offsetUp(this.strings[i].root)
            var rot = chromatic.rotate(offset)
            this.strings[i].setChromatic(rot)
        }
    }

    setMajor(root, major) {
        this.setChromatic(root, major.chromatic())
    }

    fullStr(start, end, printNoteLetters, printNoteNumbers, posIndexOnly) {
        var data = []
        for (i in this.strings) {
            data.push(this.strings[i].fullStr(start, end, printNoteLetters, printNoteNumbers, posIndexOnly))
        }
        return this.wrapData(data, start, end)
    }

    wrapData(data, start, end) {
        var legend, lines, slines, spaces
        [legend, lines, slines, spaces] = this.border(start, end)
        data = data.reverse().join('\n' + slines + '\n')
        return legend + '\n' + spaces + '\n' + data + '\n' + lines + '\n' + legend + reset_code +'\n'
    }


    border(start, end) {
        var frets = []
        for (var i = start; i<end; i++) { frets.push(padString('<', ' ', 10, i.toString())) }
        var legend = `Fret:      ` + frets.join('')
        var lines = '_'.repeat(legend.length)
        var slines = '-'.repeat(legend.length)
        var spaces = ' '.repeat(legend.length)
        return [ reset_code + bold_code + legend + reset_code,
                new Color() + lines + reset_code,
                new Color() + slines + reset_code,
                new Color() + overline_code + spaces + reset_code]
    }

    scaleSubset(indices, newColors) {
        var f = new Fretboard(this.roots, this.fretNum, this.inlayPattern)
        for (var i in f.strings) {
            f.strings[i] = this.strings[i].scaleSubset(indices, newColors)
        }
        return f
    }

    setColors(colors) {
        this.colors = colors
        for (var i in this.strings) {
            this.strings[i].setColorsByScaleIndex(colors)
        }
    }

    setInlayPattern(pattern) {
        this.inlayPattern = pattern
        if (pattern != null) {
            for (var string in pattern.allInlays) {
                if (string < this.strings.length) {
                    var i = string == -1 ? this.strings.length - 1 : string
                    this.strings[i].setInlays(pattern.allInlays[string])
                }
            }
        }
    }

    setMajorFormula(formula, root) {
        var majorNotes = []
        formula.forEach(function(s){ majorNotes.push(MajorNote.fromStr(s)) })
        var major_scale = new MajorScale(majorNotes)
        this.setMajor(Note.fromStr(root), major_scale)
    }

    setChromaticFormula(scale, root) {
    //  scale should be 12 len binary list // 
        var i = 1
        var chromatic_notes = []
        scale.forEach(function(c) {
            if (c == 0) {
                chromatic_notes.push(c)
            } else {
                chromatic_notes.push(i)
                i+=1
            }
        })
        this.setChromatic(Note.fromStr(root), new ChromaticScale(chromatic_notes))
    }

    setFromScaleName(scale, mode, root) {
        this.setChromatic(Note.fromStr(root), scales[scale][mode].chromatic)
    }

    intervalSubsets(subsetBase, intervals, recolor) {
        var distances = []
        for (var i = 1; i < subsetBase.length; i++) {
            distances.push(subsetBase[i] - subsetBase[i-1])
        }
        var offset = subsetBase[0] - 1
        var subsets = []
        var f = this
        intervals.forEach(function(i) {
            var subset = [i+offset]
            distances.forEach(function(d) {
                if ((subset[subset.length-1] + d) == f.notesInScale) {
                    subset.push(f.notesInScale)
                } else {
                    subset.push((subset[subset.length-1] + d) % f.notesInScale)
                }
            })
            var intervalColors = {}
            for (var j = 0; j < subset.length; j++) {
                if (subsetBase[j] in f.colors) {
                    if (recolor) {
                        intervalColors[subset[j]] = f.colors[subsetBase[j]]
                    } else {
                        intervalColors[subset[j]] = f.colors[subset[j]]
                    }
                }
            }
            subsets.push([subset, f.scaleSubset(subset, intervalColors)])
        })
        return subsets
    }

}

function getFretboardsWithName(args) {
    var fretboards = []
    var colors = {}
    for (i in args.colors) {
        colors[i] = new Color(args.colors[i][0], args.colors[i][1])
    }
    end = args.end == null ? args.frets : args.end
    inlayColor = new Color(args.inlay.color[0], args.inlay.color[1])
    fretboard = new Fretboard(args.tuning, args.frets, splitTopBottomDots(inlayColor, args.inlay.pattern))

    if (args.scale.major_formula != null) {
        fretboard.setMajorFormula(args.scale.major_formula, args.scale.root)
        fretboard.setColors(colors)
        fretboards.push([`Major Relative Scale Formula ${args.scale.major_formula}`, fretboard])
    } else if (args.scale.chromatic_formula != null) {
        fretboard.setChromaticFormula(args.scale.chromatic_formula, args.scale.root)
        fretboard.setColors(colors)
        fretboards.push([`Chromatic Binary Scale Formula ${args.scale.chromatic_formula}`, fretboard])
    } else if (args.scale.name != null) {
        fretboard.setFromScaleName(args.scale.name[0], args.scale.name[1], args.scale.root, colors)
        fretboard.setColors(colors)
        fretboards.push([`Mode Name ${args.scale.name}`, fretboard])
    }
    if (args.scale.subset && args.scale.intervals) {
        var subsets = fretboard.intervalSubsets(args.scale.subset, args.scale.intervals, args.recolor_intervals)
        for (i in subsets) {
            var intervals = subsets[i][0]
            var subset = subsets[i][1]
            fretboards.push([`Interval Subset (${intervals})`, subset])
        }
    }
    return fretboards
}
function padString(loc='^', pad=' ', width, s) {
    var padCount = width - s.length
    if (padCount < 1) {
        return s
    }
    var padL = 0
    var padR = 0
    if (loc == '^') {
        padL = Math.floor(padCount / 2)    
        padR = Math.ceil(padCount / 2)    
    } else if (loc == '<') {
        padR = padCount
    } else if (loc == '>') {
        padL = padCount
    }
    return ' '.repeat(padL) + s + ' '.repeat(padR)
}

function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}
letters = {
            'A': 1,
            'B': 3,
            'C': 4,
            'D': 6,
            'E': 8,
            'F': 9,
            'G': 11,
            }

letterVals = {
            1: 'A',
            3: 'B',
            4: 'C',
            6: 'D',
            8: 'E',
            9: 'F',
            11: 'G',
            }

accidentals = {
            '#': 1,
            'b': -1,
            '': 0,
            ' ': 0,
            }


class Note {
    //     A note as a combination of a letter and accidental (Eb, A#, F, etc)   // 
    constructor(letter, accidental=' ') {
        this.letter = letter
        this.accidental = accidental
        this.val = letters[letter] + accidentals[accidental]
    }

    offset(other) {
        // returns a positive offsetUp if other is above else returns a negative offset down // 
        if (this.val <= other.val) {
            return this.offsetUp(other)
        }
        return this.offsetDown(other) * -1
    }

    offsetUp(other) {
        // return the number of semitones to move from this note up to other // 
        if (this.val > other.val) {
            return 12 - other.offsetUp(this)
        }
        return (other.val - this.val) % 12
    }

    offsetDown(other) {
        // return the number of semitones to move from this note down to other // 
        if (this.val < other.val) {
            return 12 - other.offsetDown(this)
        }
        return (this.val - other.val) % 12
    }

    toString() {
        return this.letter + this.accidental
    }

    static fromStr(s) {
        if (s.length == 1) {
            return new this(s)
        }
        if (s[0] in letters) {
            return  new this(s[0], s[1])
        }
        return new this(s[1], s[0])
    }

    noteFromOffset(offset) {
        var val = (this.val + offset) % 12
        if (val in letterVals) {
            return new Note(letterVals[val])
        }
        val = (val + 1) % 12
        return new Note(letterVals[val], 'b')
    }

    semitoneUp() {
        if ((this.val + 1) in letterVals) {
            return new Note(letterVals[this.val + 1])
        }
        return new Note(letterVals[this.val], '#')
    }

    semitoneDown() {
        if ((this.val - 1) in letterVals) {
            return new Note(letterVals[this.val - 1])
        }
        return new Note(letterVals[this.val], 'b')
    }
}


class ChromaticScale {
    // A representation of a scale as the 12 chromatic notes // 
    constructor(notes = []) {
        if (!notes.length) {
            this.notes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        } else {
            this.notes = notes
        }
    }

    toString() {
        return this.notes.toString()
    }

    rotate(semitones) {
        // return a rotated scale, cutting of the first n semitones and moving them to the end,
        // or moving the last n seminotes to the beginning if value is negative
        return new ChromaticScale(this.notes.slice(semitones).concat(this.notes.slice(0,semitones)))
    }

    notesInScale() {
        var notesInScale = 0
        this.notes.forEach(function(i) {
            if (i) {
                notesInScale++
            }
        })
        return notesInScale
    } 

    isSubset(other) {
      return other.notes == this.notes
    }
}

numToChromatic = {
        1: 1,
        2: 3,
        3: 5,
        4: 6,
        5: 8,
        6: 10,
        7: 12
        }
accidentalToChromatic = {
        '#': 1,
        'b': -1
        }
class MajorNote {
    /**
    MajorNote represets a position relative to any diatonic Ionian I
    given by an Ionian scale note number and optional accidental to
    achieve all 12 chromatic notes
    */ 
    constructor(num, accidentals = []) {
        this.num = num
        this.accidentals = accidentals
        // the position of this note on the chromatic scale (1 indexed)
        
        var acc = []
        for (var i in accidentals) {
            acc.push(accidentalToChromatic[this.accidentals[i]])
        }
        this.chromatic = numToChromatic[num] + acc.reduce((a, b) => a + b, 0)
        this.chromaticMod = this.chromatic % 12 == 0 ? 12 : this.chromatic % 12
    }

    toString() {
        return this.num + this.accidentals.join('')
    }

    static fromStr(s) {
        var num = 0
        var acc = []
        for (var c in s) {
            if ( s[c] >= '0' && s[c] <= '9' ) {
                num = parseInt(s[c])
            } else {
                acc.push(s[c])
            }
        }
        return new this(num, acc)
    }

}

class MajorScale {
    // A representation of a scale as a list of MajorNotes // 
    constructor(notes) {
        this.notes = notes
    }

    chromatic() {
        chromatic = new ChromaticScale()
        for (i = 0; i<this.notes.length; i++) {
            chromatic.notes[this.notes[i].chromaticMod - 1] = i + 1
        }
        return chromatic
    }

    chromaticMajorIndex() {
        chromatic = new ChromaticScale()
        for (i = 0; i<this.notes.length; i++) {
            chromatic.notes[this.notes[i].chromaticMod - 1] = this.notes[i].num
        }
        return chromatic
    }

    toString() {
        return this.notes.toString()
    }

}


class Mode {
    constructor(name, chromatic, num) {
        this.name = name
        this.chromatic = chromatic 
        this.num = num
    }

    toString() {
        return this.name + ': ' + this.chromatic.toString()
    }
}

scales = {}
pentatonicBase = new ChromaticScale([1, 0, 2, 0, 3, 0, 0, 4, 0, 5, 0, 0])
bluesBase = new ChromaticScale([1, 0, 2, 3, 4, 0, 0, 5, 0, 6, 0, 0])
majorBase = new ChromaticScale([1, 0, 2, 0, 3, 4, 0, 5, 0, 6, 0, 7])
harmonicMinorBase = new ChromaticScale([1, 0, 2, 3, 0, 4, 0, 5, 6, 0, 0, 7])
melodicMinorBase = new ChromaticScale([1, 0, 2, 3, 0, 4, 0, 5, 0, 6, 0, 7])
diminishedBase = new ChromaticScale([1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0, 8])
wholeToneBase = new ChromaticScale([1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0])
inFormula = ['1', 'b2', '4', '5', 'b6']
insenFormula = ['1', 'b2', '4', '5', 'b7']
iwatoFormula = ['1', 'b2', '4', 'b5', 'b7']
yoFormula = ['1', '2', '4', '5', '6']
hirajoshiFormula = ['1', '2', 'b3', '5', 'b6']
ryukyuFormula = ['1', '3', '4', '5', '7']
doubleHarmonicMinorFormula = ['1', 'b2', '3', '4', '5', 'b6', '7']

function addMode(scale, name, chromatic, num) {
    scales[scale][name] = new Mode(name, chromatic, num)
}

function addScale(scale, modes, base) {
    if (!(scale in scales)) {
        scales[scale] = {}
    }
    ni = 0
    for (i = 0; i < base.notes.length; i++) {
        if (base.notes[i] != 0) {
            chromatic = []
            var j = 1
            base.rotate(i).notes.forEach(function(k) {
                if (k == 0) {
                    chromatic.push(k)
                } else {
                    chromatic.push(j)
                    j+=1
                }
            })
            addMode(scale, modes[ni], new ChromaticScale(chromatic), ni)
            ni += 1
        }
        if (ni == modes.length) {
            return
        }
    }
}

function addScaleMajorFormula(scale, modes, majorFormula) {
    var majorNotes = []
    majorFormula.forEach(function(s){ majorNotes.push(MajorNote.fromStr(s)) })
    majorScale = new MajorScale(majorNotes)
    base = majorScale.chromatic()
    addScale(scale, modes, base)
}

function addAllModes(scale, base) {
    var modeNames = []
    for (i = 1; i <= base.notesInScale(); i++) {
        modeNames.push(i)
    }
    addScale(scale, modeNames, base)
}

function addAllModesMajorFormula(scale, formula) {
    var modeNames = []
    for (i = 1; i <= formula.length; i++) {
        modeNames.push(i)
    }
    addScaleMajorFormula(scale, modeNames, formula)
}

addScale('major',
        ['ionian (1)',
         'dorian (2)',
         'phrygian (3)',
         'lydian (4)',
         'mixolydian (5)',
         'aeolian (6)',
         'locrian (7)'
         ], majorBase)


//addAllModes('major', majorBase)
addAllModes('harmonic_minor', harmonicMinorBase)
addAllModes('melodic_minor', melodicMinorBase)
addAllModesMajorFormula('double_harmonic_minor', doubleHarmonicMinorFormula)
addAllModes('diminished', diminishedBase)
addAllModes('whole_tone', wholeToneBase)
addAllModes('pentatonic', pentatonicBase)
addAllModes('blues', bluesBase)
addAllModesMajorFormula('in', inFormula)
addAllModesMajorFormula('insen', insenFormula)
addAllModesMajorFormula('iwato', iwatoFormula)
addAllModesMajorFormula('yo', yoFormula)
addAllModesMajorFormula('hirajoshi', hirajoshiFormula)
addAllModesMajorFormula('ryukyu', ryukyuFormula)

function logScales() {
    console.log('Available scales:')
    for (var scale in scales) {
        console.log(`${scale} scale modes:`)
        for (var mode in scales[scale]) {
            console.log(`\t${scales[scale][mode]}`)
        }
    }
}

class Chord {
    constructor(name, root, chromatic) {
        this.name = name
        // root note
        this.root = root 
        // chords are really just a sparse mode, represented by a list of 12 binary values
        this.chromatic = chromatic 
    }

    toString() {
        return this.name + ': ' + this.root.toString() + ': ' + this.chromatic.toString()
    }

    merge(other) {
      var offset = other.root.offset(this.root)
      var merged = other.chromatic.rotate(offset)
      for (var i = 0; i < 12; i++)
      {
        if (this.chromatic.notes[i] != 0 && merged.notes[i] == 0)
        {
          merged.notes[i] = this.chromatic.notes[i]
        }
      }
      return new Chord(`${this.name} + ${other.name}`, this.root, merged)
    }
}

/**
 * create a chord from a root note string and a major formula list
 * ex: parseChord('D', ['1', 'b3', '5']) for a D minor chord
 */
function parseChord(note, majorFormula, name='') {
    if (name == '') {
      name = note + ' Chord'
    }
    var root = Note.fromStr(note)
    var majorNotes = []
    majorFormula.forEach(function(s){ majorNotes.push(MajorNote.fromStr(s)) })
    majorScale = new MajorScale(majorNotes)
    chromatic = majorScale.chromaticMajorIndex()
    return new Chord(name, root, chromatic)
}

commonChordFormulas = {
                    'major': ['1', '3', '5'],    
                    'major sus+': ['1', '3', '4', '5'],    
                    'major sus-': ['1', '2', '3', '5'],    
                    'minor': ['1', 'b3', '5'],    
                    'minor sus+': ['1', 'b3', '4', '5'],    
                    'minor sus-': ['1', '2', 'b3', '5'],    
                    'minor b5': ['1', 'b3', 'b5'],    
                    'augmented': ['1', '3', '#5'],    
                    'major 7': ['1', '3', '5', '7'],    
                    'dominant 7': ['1', '3', '5', 'b7'],    
                    'minor 7': ['1', 'b3', '5', 'b7'],    
                    'minor 7b5': ['1', 'b3', 'b5', 'b7'],    
                    'minor maj7': ['1', 'b3', '5', '7'],    
                    'diminished': ['1', 'b3', 'b5', 'bb7'],    
                    'augmented 7': ['1', '3', '#5', 'b7'],    
                      }

function makeCommonChord(root, name) {
  name = name.toLowerCase()
  console.assert(name in commonChordFormulas)
  return parseChord(root, commonChordFormulas[name], root + ' ' + name)
}

/**
 * get all scales for the chord
 * root effectively reduces the possible sets of scales by specifying a required root note
 */
function chordScales(scales, chord, root='') {
  if (root != '') {
    var offset = chord.root.offset(root)
    var rot = chord.chromatic.rotate(offset)
    rot[0] = 1
    chord = new Chord(chord.name, root, rot)
  }
  var chordScales = {}
  for (var scale in scales) {
    for (var mode in scales[scale]) {
      var match = true
      for (var i=0; i < 12; i++) {
        if ( scales[scale][mode].chromatic.notes[i] == 0 && chord.chromatic.notes[i] != 0 ) {
          match = false
        }
      }
      if (match) {
        if (!(scale in chordScales)) {
          chordScales[scale] = {}
        }
        chordScales[scale][mode] = scales[scale][mode]
      }
    }
  }
  return chordScales
}

/**
 * all possible scales[modes] for the given Chord list and root Note
 */
function chordsScales(scales, chords, root='') {
  var chordsScales = {}
  for (var i in chords) {
    chordsScales[chords[i]] = chordScales(scales, chords[i], root)
  }
  return chordsScales
}

/**
 * returns all possible modes for first chord, then merges each pair of chords to create a new chord.
 * This will give only modes that are shared between each chord movement
 * optonal root Note
 */
function pairMergedChordsScales(scales, chords, root='') {
  var chordsScales = {}
  for (var i in chords) {
    if (i == 0) {
      chordsScales[chords[i]] = chordScales(scales, chords[i], root)
    }
    else {
      chordsScales[chords[i]] = chordScales(scales, chords[i].merge(chords[i-1]), root)
    }
  }
  return chordsScales
}

/**
 * merges a given chord with each of chords before calculating possible roots
 * optonal root Note
 */
function chordMergedChordsScales(scales, chords, chord, root='') {
  var chordsScales = {}
  for (var i in chords) {
    var merged = chords[i].merge(chord)
    chordsScales[chords[i]] = chordScales(scales, merged, root)
  }
  return chordsScales
}

//chords = []
//chords.push(makeCommonChord('D', 'minor'))
//chords.push(makeCommonChord('B', 'minor 7b5'))
//chords.push(makeCommonChord('A#', 'major 7'))
//chords.push(makeCommonChord('A', 'Dominant 7'))

//console.log(chordsScales(scales, chords))
//console.log(chordsScales(scales, chords, chords[0].root))
//console.log(pairMergedChordsScales(scales, chords, chords[0].root))
//console.log(pairMergedChordsScales(scales, chords))
//console.log(chordMergedChordsScales(scales, chords, chords[0]))
//console.log(chordMergedChordsScales(scales, chords, chords[0], chords[0].root))


//logScales()
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
modematcherSite()
