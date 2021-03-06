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
