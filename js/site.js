// utility functions
Array.prototype.to_hash = function(get_key, get_value) {
    var json = {};
    for (var i = 0; i < this.length; i++) {
        json[get_key(this[i], i)] = get_value ? get_value(this[i], i) : this[i];
    }
    return json;
}

Array.prototype.reset = function() {
    for (var i = 0; i < this.length; i++) {
        this[i] = 0;
    }
    return this;
}

Array.prototype.unzip = function(offset, length) {
    var a = new Array(length);
    for (var i = 0; i < this.length; i++) {
        a[offset + this[i][0]] = this[i][1];
    }
    return a;
}

Array.prototype.include = function(x) {
    return this.indexOf(x) >= 0;
}

// chessman encoding:
// color arms   no
//     1    3    4
//     x  xxx xxxx

function Chess() {
    this.square = new Array(256).reset();
    this.pieces = new Array(256).reset();
    this.moves = new Array(1 << 10).reset();
    this.scores = new Array(1 << 10).reset();
    this.max_depth = 7;
    this.current_best_move = null;
    this.maximum_color = 0;
}

Chess.color_names = [
    // 0 = 0x00
    'red',
    // 1 = 0x80
    'black',
];

Chess.arms_names = [
    // 0 = 0x00
    'king',
    // 1 = 0x10
    'rook',
    // 2 = 0x20
    'horse',
    // 3 = 0x30
    'cannon',
    // 4 = 0x40
    'bishop',
    // 5 = 0x50
    'elephant',
    // 6 = 0x60
    'pawn',
];

Chess.arms_count = [
    // king
    1,
    // rook
    2,
    // horse
    2,
    // cannon
    2,
    // bishop
    2,
    // elephant
    2,
    // pawn
    5,
]

Chess.arms_static_score = [
    // king
    65535,
    // rook
    1000,
    // horse
    450,
    // cannon
    450,
    // bishop
    170,
    // elephant
    160,
    // pawn
    60,
];

Chess.arms_location_score = [[
    // king
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // rook
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // horse
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // cannon
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // bishop
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // elephant
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // pawn
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, -2, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 2, 0, 8, 0, 8, 0, 8, 0, 2, 0, 0, 0, 0,

        0, 0, 0, 6, 12, 18, 18, 20, 18, 18, 12, 6, 0, 0, 0, 0,
        0, 0, 0, 10, 20, 30, 34, 40, 34, 30, 20, 10, 0, 0, 0, 0,
        0, 0, 0, 14, 26, 42, 60, 80, 60, 42, 26, 14, 0, 0, 0, 0,
        0, 0, 0, 18, 36, 56, 80, 120, 80, 56, 36, 18, 0, 0, 0, 0,
        0, 0, 0, 0, 3, 6, 9, 12, 9, 6, 3, 0, 0, 0, 0, 0,

        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
],];

Chess.arms_location_score[1] = Chess.arms_location_score[0].map(function(arms){
   return arms.map(function(score,i){
       return arms[i & 0xf0 ^ 0xf0 | i & 0x0f];
   });
});

Chess.opening_square = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x11, 0x21, 0x51, 0x41, 0x01, 0x42, 0x52, 0x22, 0x12, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00, 0x64, 0x00, 0x65, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xe1, 0x00, 0xe2, 0x00, 0xe3, 0x00, 0xe4, 0x00, 0xe5, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xb1, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb2, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x91, 0xa1, 0xd1, 0xc1, 0x81, 0xc2, 0xd2, 0xa2, 0x92, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

Chess.board_mask = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,

    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

Chess.king_room_mask = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

Chess.horse_leg_delta = [
    [0x0e, -0x01],
    [0x1f, 0x10],
    [0x21, 0x10],
    [0x12, 0x01],
    [-0x0e, 0x01],
    [-0x1f, -0x10],
    [-0x21, -0x10],
    [-0x12, -0x01],
].unzip(0x22, 0x44);

Chess.base_delta = [-0x01, 0x10, 0x01, -0x10];

Chess.valid_address = function(address) {
    //return (address & 0x0f) >= 0x03 && (address & 0x0f) <= 0x0b && (address & 0xf0) >= 0x30 && (address & 0xf0) <= 0xc0;
    return Chess.board_mask[address] > 0;
}

Chess.encode_chessman = function(color, arms, no) {
    return (color << 7) | (arms << 4) | no;
}

Chess.decode_chessman = function(chessman) {
    return [chessman >> 7, (chessman & 0x70) >> 4, chessman & 0x0f]
}

Chess.encode_move = function(src, dest, chessman, killed_chessman) {
    return src | (dest << 8) | (chessman << 16) | (killed_chessman << 24);
}

Chess.decode_move = function(move) {
    return [move & 0xff, (move & 0xff00) >> 8, (move & 0xff0000) >> 16, move >>> 24]
}

Chess.move_def_help = function(arm, delta_list, check_address, check_move) {
    var def = [new Array(256), new Array(256)];
    for (var color = 0; color < 2; color++) {
        for (var src = 0; src < 256; src++) {
            if (!Chess.valid_address(src) || check_address && !check_address(color, src))
                continue;
            def[color][src] = [];
            for (var i = 0; i < delta_list.length; i++) {
                var delta = delta_list[i];
                var dest = src + delta;
                if (!Chess.valid_address(dest) || check_address && !check_address(color, dest))
                    continue;
                if (check_move && !check_move(color, src, dest)) continue;
                var move = src | (dest << 8) | (((color << 7) | (arm << 4)) << 16);
                def[color][src].push(move);
            }
        }
    }
    return def;
}

Chess.base_move_def = [
    // king
    Chess.move_def_help(0, [-0x01, 0x10, 0x01, -0x10],
        function(c, a) {
            return c == (a >> 7) && Chess.king_room_mask[a];
        }, null
    ),
    // rook
    Chess.move_def_help(1, [], null, null),
    // horse
    Chess.move_def_help(2, [0x0e, 0x1f, 0x21, 0x12, -0x0e, -0x1f, -0x21, -0x12], null, null),
    // cannon
    Chess.move_def_help(3, [], null, null),
    // bishop
    Chess.move_def_help(4, [0x0f, 0x11, -0x0f, -0x11],
        function(c, a) {
            return [0x36, 0x38, 0x47, 0x56, 0x58].include(a - c * 0x70);
        }, null
    ),
    // elephant
    Chess.move_def_help(5, [0x1e, 0x22, -0x1e, -0x22],
        function(c, a) {
            return [0x35, 0x53, 0x75, 0x57, 0x79, 0x5b, 0x39].include(a - c * 0x50);
        }, null
    ),
    // pawn
    Chess.move_def_help(6, [-0x01, 0x10, 0x01, -0x10],
        function(c, a) {
            return c != (a >> 7) || (a & 0x1) && (c ? a < 0x9f : a > 0x60);
        },
        function(c, s, d) {
            return (s & 0xf0) == (d & 0xf0) || (c == 0) == ((s & 0xf0) < (d & 0xf0));
        }
    ),
];

Chess.color_names_index_map = Chess.color_names.to_hash(
    function(x) { return x; },
    function(x, i) { return i; }
);

Chess.arms_names_index_map = Chess.arms_names.to_hash(
    function(x) { return x; },
    function(x, i) { return i; }
);

Chess.prototype.reset_square = function(square) {
    this.pieces.reset();
    for (var i = 0; i < square.length; i++) {
        this.square[i] = square[i];
        this.pieces[square[i]] = i;
    }
}

Chess.prototype.get_square = function() {
    return this.square;
}

Chess.prototype.reset = function() {
    this.reset_square(Chess.opening_square);
}

Chess.prototype.generate_move = function(src, dest) {
    return Chess.encode_move(src, dest, this.square[src], this.square[dest]);
}

Chess.prototype.apply_move = function(move) {
    this.pieces[move >>> 24] = 0;
    this.square[move & 0xff] = 0;
    this.square[(move & 0xff00) >> 8] = (move & 0xff0000) >> 16;
    this.pieces[(move & 0xff0000) >> 16] = (move & 0xff00) >> 8;
}

Chess.prototype.reverse_move = function(move) {
    this.square[move & 0xff] = (move & 0xff0000) >> 16;
    this.pieces[(move & 0xff0000) >> 16] = move & 0xff;
    this.square[(move & 0xff00) >> 8] = move >>> 24;
    this.pieces[move >>> 24] = (move & 0xff00) >> 8;
}

Chess.prototype.find_best_move = function(color) {
    this.current_best_move = null;
    this.maximum_color = color;
    //this.max_depth = 7;

    // profile
    this.total_evaluated_times = 0;
    this.total_searched_nodes = 0;
    this.total_searched_moves = 0;
    this.total_static_searched_nodes = 0;
    var start_time = new Date().getTime();

    this.alpha_beta(color, this.max_depth, -131072, 131072, 0);

    // profile
    var end_time = new Date().getTime();
    console.debug("profile: duration = " + (end_time - start_time) + "ms" +
        ", total evaluated times = " + this.total_evaluated_times +
        ", total searched nodes = " + this.total_searched_nodes +
        ", total searched moves = " + this.total_searched_moves +
        ", total static searched nodes = " + this.total_static_searched_nodes);

    return this.current_best_move;
}

Chess.prototype.valid_move = function(move) {
    var chessman = (move & 0xff0000) >> 16;
    var count = this.find_all_moves(chessman >> 7, 0, 0);
    for (var i = 0; i < count; i++) {
        if (this.moves[i] == move) return true;
    }
    return false;
}

Chess.prototype.game_over = function() {
    return this.pieces[0x01] == 0 || this.pieces[0x81] == 0;
}

Chess.prototype.alpha_beta = function(color, depth, alpha, beta, offset) {
    //profile
    this.total_searched_nodes++;
    if (depth == 0 || this.game_over()) return this.evaluate(color, depth);
    var new_offset = this.find_all_moves(color, depth, offset);
    var best_move = null;
    var tried_times = 0;
    for (var i = offset; i < new_offset; i++) {
        var move = this.moves[i];
        if(depth > this.max_depth - 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | apply move");
        this.apply_move(move);
        if(this.check_king(color)){
            this.reverse_move(move);
            if(depth > this.max_depth - 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | check king, cancel move");
        }else{
            var value = - this.alpha_beta(1 - color, depth - 1, -beta, -alpha, new_offset);
            this.reverse_move(move);
            tried_times++;
            if(depth > this.max_depth - 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | cancel move, score = " + value);
            if (value >= beta) {
                return value;
            } else if (value > alpha) {
                alpha = value;
                best_move = move;
            }
        }
    }
    if(tried_times == 0){
        return this.max - depth - 65536;
    }
    if(depth == this.max_depth){
        this.current_best_move = best_move;
        console.debug("find best move: " + this.print_move(best_move) + ", score = " + alpha);
    }
    return alpha;
}

Chess.prototype.evaluate = function(c, depth) {
    var score = 0, man, addr;
    for (var arm = 0; arm < 7; arm++) {
        for (var no = 1; no <= Chess.arms_count[arm]; no++) {
            man = (c << 7) | (arm << 4) | no;
            addr = this.pieces[man];
            if (addr != 0) {
                score += Chess.arms_static_score[arm] + Chess.arms_location_score[c][arm][addr];
            }

            man = ((1 - c) << 7) | (arm << 4) | no;
            addr = this.pieces[man];
            if (addr != 0) {
                score -= Chess.arms_static_score[arm] + Chess.arms_location_score[1 - c][arm][addr];
            }
        }
    }
    //console.debug("evaluate: score = " + score + ", depth = " + depth + ", color = " + color);
    // profile
    this.total_evaluated_times++;

    return score;
}

Chess.prototype.print_move = function(move){
    var move_info = Chess.decode_move(move);
    return move_info.map(function(x){return x.toString(16);}).join("-");
}

Chess.prototype.check_king_2 = function(color){
    var c = color << 7, oc = (1 - color) << 7;
    var king_addr = this.pieces[c | 0x01];
    if(king_addr == 0) return true;
    
    // king, rook, cannon, pawn
    for(var i = 0; i < 4; i++){
        var delta = Chess.base_delta[i];
        var adjacent = true, met = false;
        for(var p = king_addr; Chess.board_mask[(p += delta)];adjacent = false){
            var man = this.square[p], mtype = man & 0x70;
            if(met){
                if((man & 0xf0) == (oc | 0x30)){
                    return true;
                }else if(man){
                    break;
                }
            }else if(man != 0){
                met = true;
                if((man & 0x80) != c && (mtype == 0x10 || mtype == 0x00 || adjacent && mtype == 0x60)){
                    return true;
                }
            }
        }
    }
        
    // horse
    var horse_ms = Chess.base_move_def[0x02][oc >> 7][king_addr];
    for(var i = 0; i < horse_ms.length; i++){
        var m = horse_ms[i];
        var horse_addr = (m & 0xff00) >> 8;
        var horse = this.square[horse_addr];
        if(horse && (horse & 0x80) == oc && !this.square[horse_addr + Chess.horse_leg_delta[king_addr - horse_addr + 0x22]]){
            return true;
        }
    }
    
    return false;
}

Chess.prototype.check_king = function(color){
    var c = color << 7, oc = (1 - color) << 7;
    var king_addr = this.pieces[c | 0x01];
    if(king_addr == 0) return true;
    
    return this.valid_king_kill(this.pieces[oc | 0x01], king_addr) ||
        this.valid_rook_kill(this.pieces[oc | 0x11], king_addr) ||
        this.valid_rook_kill(this.pieces[oc | 0x12], king_addr) ||
        this.valid_horse_kill(this.pieces[oc | 0x21], king_addr) ||
        this.valid_horse_kill(this.pieces[oc | 0x22], king_addr) ||
        this.valid_cannon_kill(this.pieces[oc | 0x31], king_addr) ||
        this.valid_cannon_kill(this.pieces[oc | 0x32], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x61], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x62], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x63], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x64], king_addr) ||
        this.valid_pawn_kill(this.pieces[oc | 0x65], king_addr);
}

Chess.prototype.valid_rook_kill = function(src, dest){
    if(src == 0) return false;
    var delta = this.get_delta(src,dest);
    if(delta == 0) return false;
    for(var p = src; (p += delta) != dest;){
        if(this.square[p]){
            return false;
        }
    }
    return true;
}

Chess.prototype.valid_king_kill = function(src, dest){
    return this.valid_rook_kill(src,dest);
}

Chess.prototype.valid_cannon_kill = function(src, dest){
    if(src == 0) return false;
    var delta = this.get_delta(src,dest);
    if(delta == 0) return false;
    var count = 0;
    for(var p = src; (p += delta) != dest;){
        if(this.square[p]){
            count++;
            if(count > 1) break;
        }
    }
    return count == 1;
}

Chess.prototype.valid_horse_kill = function(src, dest){
    if(src == 0) return false;
    var delta = dest - src;
    if(delta < -0x22 || delta > 0x22) return false;
    var leg_delta = Chess.horse_leg_delta[delta + 0x22];
    if(leg_delta == undefined) return false;
    return this.square[src + leg_delta] == 0;
}

Chess.prototype.valid_pawn_kill = function(src, dest){
    if(src == 0) return false;
    return src - 0x01 == dest || src + 0x10 == dest || src - 0x01 == dest || src - 0x10 == dest;
}

Chess.prototype.get_delta = function(src, dest){
    if((src & 0x0f) == (dest & 0x0f)){
        if(src < dest){
            return 0x10;
        }else if(src > dest){
            return -0x10;
        }else{
            return 0;
        }
    }else if((src & 0xf0) == (dest & 0xf0)){
        if(src < dest){
            return 0x01;
        }else if(src > dest){
            return -0x01;
        }else{
            return 0;
        }
    }else{
        return 0;
    }
}

Chess.prototype.find_all_moves = function(color, depth, offset) {
    var old_offset = offset;
    offset = this.find_all_moves_rook(color, depth, this.moves, offset);
    offset = this.find_all_moves_cannon(color, depth, this.moves, offset);
    offset = this.find_all_moves_king(color, depth, this.moves, offset);
    offset = this.find_all_moves_base(color, depth, this.moves, offset);

    this.sort_moves(color, depth, this.moves, this.scores, old_offset, offset);

    //profile
    this.total_searched_moves += offset - old_offset;

    return offset;
}

Chess.prototype.sort_moves = function(color, depth, moves, scores, offset, end) {
    for (var i = offset; i < end; i++) {
        var move = moves[i];
        scores[i] = ((move & 0xff000000 ? Chess.arms_static_score[(move >>> 28) & 07] : 0) << 8);
    }

    for (var i = offset; i < end; i++) {
        for (var j = i + 1; j < end; j++) {
            if (scores[i] < scores[j]) {
                var t = moves[i];
                moves[i] = moves[j];
                moves[j] = t;
                t = scores[i];
                scores[i] = scores[j];
                scores[j] = t;
            }
        }
    }
}

Chess.prototype.find_all_moves_rook = function(color, depth, moves, offset) {
    for (var no = 1; no <= 2; no++) {
        var man = (color << 7) | (1 << 4) | no;
        var src = this.pieces[man];
        if (src == 0) continue;
        for (var i = 0; i < 4; i++) {
            var delta = Chess.base_delta[i];
            for (var dest = src; Chess.board_mask[(dest = dest + delta)];) {
                var killed_man = this.square[dest];
                if (killed_man > 0 && (killed_man >> 7) == color) break;
                moves[offset++] = src | (dest << 8) | (man << 16) | (killed_man << 24);
                if (killed_man > 0) break;
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_cannon = function(color, depth, moves, offset) {
    for (var no = 1; no <= 2; no++) {
        var man = (color << 7) | (3 << 4) | no;
        var src = this.pieces[man];
        if (src == 0) continue;
        for (var i = 0; i < 4; i++) {
            var delta = Chess.base_delta[i];
            var mark = false;
            for (var dest = src; Chess.board_mask[(dest = dest + delta)];) {
                var killed_man = this.square[dest];
                if (mark) {
                    if (killed_man > 0) {
                        if ((killed_man >> 7) != color) {
                            moves[offset++] = src | (dest << 8) | (man << 16) | (killed_man << 24);
                        }
                        break;
                    }
                } else if (killed_man > 0) {
                    mark = true;
                }else{
                    moves[offset++] = src | (dest << 8) | (man << 16);
                }
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_base = function(color, depth, moves, offset) {
    for (var arm = 0; arm < 7; arm++) {
        for (var no = 1; no <= Chess.arms_count[arm]; no++) {
            var man = (color << 7) | (arm << 4) | no;
            var src = this.pieces[man];
            if (src == 0) continue;
            var ms = Chess.base_move_def[arm][color][src];
            if (!ms) continue;
            for (var i = 0; i < ms.length; i++) {
                var m = ms[i];
                var dest = (m & 0xff00) >> 8;
                var killed_man = this.square[dest];
                if (killed_man > 0 && (killed_man >> 7) == color) continue;
                if (arm == 2) {
                    if (this.square[src + Chess.horse_leg_delta[dest - src + 0x22]] != 0) continue;
                } else if (arm == 5) {
                    if (this.square[(src + dest) >> 1] != 0) continue;
                }
                moves[offset++] = m | (no << 16) | (killed_man << 24);
            }
        }
    }
    return offset;
}

Chess.prototype.find_all_moves_king = function(color, depth, moves, offset) {
    var king1 = (color << 7) | (0 << 4) | 1;
    var king2 = ((1 - color) << 7) | (0 << 4) | 1;
    var pking1 = this.pieces[king1], pking2 = this.pieces[king2];
    if(!pking1 || !pking2) return offset;
    if ((pking1 & 0x0f) == (pking2 & 0x0f)) {
        var d = pking1 < pking2 ? 0x10 : -0x10;
        var found = false;
        for (var p = pking1; (p += d) != pking2;) {
            if (this.square[p] > 0) {
                found = true;
                break;
            }
        }
        if (!found) {
            moves[offset++] = pking1 | (pking2 << 8) | (king1 << 16) | (king2 << 24);
        }
    }
    return offset;
}

function TestEngine() {
    this.chess = new Chess();
    this.chess.reset();
}

TestEngine.prototype.assert = function(expect, real){
    if(expect != real){
        console.error("assert failed: " + expect + " != " + real);
    }
}

TestEngine.prototype.run_test = function(name, fn, args) {
    args = args || [];
    var start_time = new Date().getTime();
    fn.apply(this, args);
    var duration = new Date().getTime() - start_time;
    console.debug("TestEngine: " + name + "(" + args.join(",") + ") = " + duration + "ms");
}

TestEngine.prototype.test_perf_get_all_moves = function(count) {
    this.chess.reset();
    for (var i = 0; i < count; i++) {
        this.chess.find_all_moves(0, 7, 0);
    }
}

TestEngine.prototype.test_perf_evaluate = function(count) {
    this.chess.reset();
    for (var i = 0; i < count; i++) {
        this.chess.evaluate(0, 7);
    }
}

TestEngine.prototype.test_check_king = function() {
    this.chess.reset();
    
    this.assert(false,this.chess.check_king(0));
    
    this.chess.apply_move(0x00636867);
    this.chess.apply_move(0x00e39897);
    this.assert(true,this.chess.check_king(0));
    this.assert(true,this.chess.check_king(1));
    
    this.chess.apply_move(0x00636768);
    this.chess.apply_move(0x00b1a7a4);
    this.assert(true,this.chess.check_king(0));
    this.assert(false,this.chess.check_king(1));
    
    this.chess.apply_move(0x00b1a4a7);
    this.chess.apply_move(0x009147c3);
    this.assert(true,this.chess.check_king(0));
    
    this.chess.apply_move(0x0091c347);
    this.chess.apply_move(0x00a145c4);
    this.assert(true,this.chess.check_king(0));
    
    this.chess.apply_move(0x00e14693);
    this.assert(false,this.chess.check_king(0));
    
    this.chess.apply_move(0x00e24795);
    this.assert(true,this.chess.check_king(0));
}

var test = new TestEngine();
test.test_check_king();

function GameStatus() {
    this.whos_turn = null;
    this.user_color = null;
    this.step_count = 0;
    this.total_game_count = 0;
    this.user_failed_game_count = 0;
    this.game_over = false;
    this.message = "";
    this.step_history = [];
}

GameStatus.prototype.render = function() {
    var s = '';
    if (this.game_over) {
        if (this.whos_turn == this.user_color) {
            s += "你赢了。";
        }
        else {
            s += "你输了，这是你第" + this.user_failed_game_count + "次输了。";
        }
    } else {
        s += "正在进行第" + (this.total_game_count + 1) + "次比赛，当前步数：" + (this.step_count + 1) + "。";
        if (this.whos_turn == this.user_color) {
            s += "请走棋：";
        } else {
            s += "机器正在思考中。。。"
        }
    }
    document.getElementById('status_span').textContent = s;
}

function Interactive(chess, render, status) {
    this.chess = chess;
    this.render = render;
    this.status = status;
    this.selected_chessman = 0;
}

Interactive.prototype.transform_from_screen_to_panel = function(x, y) {
    var pt = this.svg.createSVGPoint();
    pt.x = x - this.svg.clientLeft;
    pt.y = y - this.svg.clientTop;
    var pt2 = pt.matrixTransform(this.matrix);
    return { x: pt2.x, y: pt2.y };
}

Interactive.prototype.init = function() {
    this.svg = document.getElementById('panel_svg');
    this.matrix = this.svg.getScreenCTM().inverse();
    this.panel_wrapper = document.getElementById('panel_wrapper');
    this.svg.addEventListener('click', this.on_board_click.bind(this), true);
    document.getElementById('btn_restart').addEventListener('click', this.on_restart_click.bind(this), true);
    document.getElementById('btn_back').addEventListener('click', this.on_back_click.bind(this), true);
    this.reset();
}

Interactive.prototype.reset = function() {
    this.chess.reset();
    this.render.reset_board(this.chess.get_square());
    this.status.step_count = 0;
    this.status.step_history = [];
    this.status.whos_turn = this.status.user_color = null;
    this.selected_chessman = 0;
    this.status.game_over = false;
    this.status.render();
}

Interactive.prototype.on_restart_click = function(e) {
    this.reset();
}

Interactive.prototype.on_back_click = function(e) {
    if (this.status.whos_turn != this.status.user_color) return;
    this.reverse_move();
}

Interactive.prototype.on_board_click = function(e) {
    if (this.status.game_over) return;
    var render_addr = this.transform_from_screen_to_panel(e.pageX, e.pageY);
    var addr = BoardRender.logic_address(render_addr);
    if (!Chess.valid_address(addr)) return;
    var chessman = this.chess.get_square()[addr];
    var color = Chess.decode_chessman(chessman)[0];
    if (chessman != 0 && this.status.user_color == null) {
        this.status.whos_turn = this.status.user_color = color;
    }
    if (this.status.user_color != this.status.whos_turn) return;
    if (this.status.user_color)
        if (chessman == 0 && this.selected_chessman == 0) return;
    if (this.selected_chessman == 0 || this.status.user_color == color) {
        this.selected_chessman = chessman;
        this.src = addr;
        this.render.active_chessman(chessman);
    } else if (addr == this.src) {
        this.selected_chessman = 0;
        this.render.active_chessman(0);
    } else {
        var move = this.chess.generate_move(this.src, addr);
        if (!this.chess.valid_move(move)) return;
        this.apply_move(move, this.status.user_color);
        this.selected_chessman = 0;
        this.render.active_chessman(0);
    }
}

Interactive.prototype.apply_move = function(move, color) {
    this.status.step_count += 1;
    this.chess.apply_move(move);
    this.status.step_history.push(move);
    this.render.apply_move(move);
    if (this.chess.game_over()) {
        this.on_game_over();
        this.status.render();
    } else {
        var next_color = 1 - color;
        this.status.whos_turn = next_color;
        setTimeout(function() {
            var next_move = this.chess.find_best_move(next_color);
            if (next_move == null || next_move == 0) {
                this.status.whos_turn = color;
                this.on_game_over();
            } else {
                this.status.step_count += 1;
                this.chess.apply_move(next_move);
                this.status.step_history.push(next_move);
                this.render.apply_move(next_move);
                if (this.chess.game_over()) {
                    this.on_game_over();
                } else {
                    this.status.whos_turn = color;
                }
            }
            this.status.render();
        }.bind(this), 1);
    }
    this.status.render();
    return true;
}

Interactive.prototype.reverse_move = function() {
    for (var i = 0; i < 2; i++) {
        if (this.status.step_history.length == 0) return;
        var move = this.status.step_history.pop();
        var move_info = Chess.decode_move(move);
        this.chess.reverse_move(move);
        this.render.reverse_move(move);
        if (this.status.game_over) {
            this.status.game_over = false;
        }
    }
}

Interactive.prototype.on_game_over = function() {
    this.status.game_over = true;
    this.status.total_game_count += 1;
    if (this.status.whos_turn != this.status.user_color) {
        this.status.user_failed_game_count += 1;
    }
    this.status.render();
}

function BoardRender() { }

BoardRender.logic_address = function(render_address) {
    return (Math.round(render_address.x / 10) + 3) + ((Math.round(render_address.y / 10) + 3) << 4)
}

BoardRender.render_address = function(logic_address) {
    return {
        x: ((logic_address & 0x0f) - 3) * 10,
        y: ((logic_address >> 4) - 3) * 10
    }
}

BoardRender.chessman_id_to_code = function(chessman_id) {
    var seg = chessman_id.split('_');
    return Chess.encode_chessman(Chess.color_names_index_map[seg[0]], Chess.arms_names_index_map[seg[1]], parseInt(seg[2]));
}

BoardRender.chessman_code_to_id = function(chessman_code) {
    var seg = Chess.decode_chessman(chessman_code);
    return Chess.color_names[seg[0]] + '_' + Chess.arms_names[seg[1]] + '_' + seg[2];
}

BoardRender.prototype.reset_board = function(square) {
    for (var i = 0; i < square.length; i++) {
        if (Chess.valid_address(i) && square[i] > 0) {
            this.apply_move(Chess.encode_move(0x33, i, square[i], 0));
        }
    }
}

BoardRender.prototype.active_chessman = function(chessman) {
    if (this.current_active_chessman) {
        this.current_active_chessman.classList.remove('selected');
        this.current_active_chessman = null;
    }
    if (chessman != 0) {
        var chessman_id = BoardRender.chessman_code_to_id(chessman);
        this.current_active_chessman = document.getElementById(chessman_id);
        this.current_active_chessman.classList.add('selected');
    }
}

BoardRender.prototype.apply_move = function(move) {
    var move_info = Chess.decode_move(move);
    if (move_info[3]) {
        this.kill_chessman(move_info[3]);
    }
    var dest = BoardRender.render_address(move_info[1]);
    var chessman = document.getElementById(BoardRender.chessman_code_to_id(move_info[2]));
    chessman.setAttribute('transform', "translate(" + dest.x + "," + dest.y + ")");
    chessman.classList.add('alive');
}

BoardRender.prototype.reverse_move = function(move) {
    var move_info = Chess.decode_move(move);
    var src = BoardRender.render_address(move_info[0]);
    var chessman = document.getElementById(BoardRender.chessman_code_to_id(move_info[2]));
    chessman.setAttribute('transform', "translate(" + src.x + "," + src.y + ")");
    chessman.classList.add('alive');
    if (move_info[3]) {
        var dest = BoardRender.render_address(move_info[1]);
        var chessman_killed = document.getElementById(BoardRender.chessman_code_to_id(move_info[3]));
        chessman_killed.setAttribute('transform', "translate(" + dest.x + "," + dest.y + ")");
        chessman_killed.classList.add('alive');
    }
}

BoardRender.prototype.kill_chessman = function(chessman_code) {
    var chessman = document.getElementById(BoardRender.chessman_code_to_id(chessman_code));
    chessman.classList.remove('alive');
}

function Game() {
    this.status = new GameStatus();
    this.render = new BoardRender();
    this.chess = new Chess();
    this.ui = new Interactive(this.chess, this.render, this.status);
}

Game.prototype.init = function() {
    this.ui.init();
}

var game = new Game();
game.init();
