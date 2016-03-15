// utility functions
Array.prototype.to_hash = function(get_key, get_value) {
    var json = {};
    for (var i = 0; i < this.length; i++) {
        json[get_key(this[i], i)] = get_value ? get_value(this[i], i) : this[i];
    }
    return json;
}

Array.prototype.reset = function(value) {
    for (var i = 0; i < this.length; i++) {
        this[i] = value;
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

function byte_rand(){
    return Math.round(Math.random() * 0x100);
}

function int_rand(){
    return (byte_rand() << 24) | (byte_rand() << 16) | (byte_rand() << 8) | byte_rand();
}

// chessman encoding:
// color arms   no
//     1    3    4
//     x  xxx xxxx

function Chess() {
    this.square = new Array(256).reset(0);
    this.pieces = new Array(256).reset(0);
    this.hash_high = 0;
    this.hash_low = 0;
    this.moves = new Array(1 << 10).reset(0);
    this.scores = new Array(1 << 10).reset(0);
    this.max_depth = 20;
    this.max_search_time = 5000;
    this.current_best_move = null;
    this.maximum_color = 0;
    this.history = new Array(16 << 10);
    this.step_index = -0x10;
    this.table_size_shift = 20;
    this.table_index_mask = -1 >>> (32 - this.table_size_shift);
    this.table_index_shift = 4;
    this.hash_table = new Array(1 << (this.table_size_shift + this.table_index_shift)).reset(null);
    this.best_move_table = new Array(0xffff).reset(0);
}

Chess.INFINITY = 65536;
Chess.MAX_PLY = 256;

Chess.HASH_FLAG_ALPHA = 0x01;
Chess.Hash_FLAG_EXACT = 0x02;
Chess.HASH_FLAG_BETA = 0x04;

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
    32768,
    // rook
    1000,
    // horse
    450,
    // cannon
    600,
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

// + address[8] color[1] arms[3] none[3] rand[1] -
Chess.zorist = new Array(0x10000);
for(var i = 0; i < Chess.zorist.length; i++){
    Chess.zorist[i] = int_rand();
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
    this.pieces.reset(0);
    this.hash_high = this.hash_low = 0;
    for (var i = 0; i < square.length; i++) {
        this.square[i] = square[i];
        this.pieces[square[i]] = i;
        if(square[i]){
            this.hash_low ^= Chess.zorist[(i << 8) | square[i] & 0xf0 | 0];
            this.hash_high ^= Chess.zorist[(i << 8) | square[i] & 0xf0 | 1];
        }
    }
    this.step_index = -0x10;
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

    this.hash_low ^= Chess.zorist[(move & 0xff) << 8 | (move & 0xf00000) >> 16 | 0];
    this.hash_high ^= Chess.zorist[(move & 0xff) << 8 | (move & 0xf00000) >> 16 | 1];
    if(move & 0xff000000){
        this.hash_low ^= Chess.zorist[move & 0xff00 | (move & 0xf0000000) >>> 24 | 0];
        this.hash_high ^= Chess.zorist[move & 0xff00 | (move & 0xf0000000) >>> 24 | 1];
    }
    this.hash_low ^= Chess.zorist[move & 0xff00 | (move & 0xf00000) >> 16 | 0];
    this.hash_high ^= Chess.zorist[move & 0xff00 | (move & 0xf00000) >> 16 | 1];

    this.step_index += 0x10;
    this.history[this.step_index | 0x0] = this.hash_low;
    this.history[this.step_index | 0x1] = this.hash_high;
    this.history[this.step_index | 0x2] = move;
}

Chess.prototype.reverse_move = function(move) {
    this.square[move & 0xff] = (move & 0xff0000) >> 16;
    this.pieces[(move & 0xff0000) >> 16] = move & 0xff;
    this.square[(move & 0xff00) >> 8] = move >>> 24;
    if(move & 0xff000000){
        this.pieces[move >>> 24] = (move & 0xff00) >> 8;
    }

    this.hash_low ^= Chess.zorist[move & 0xff00 | (move & 0xf00000) >> 16 | 0];
    this.hash_high ^= Chess.zorist[move & 0xff00 | (move & 0xf00000) >> 16 | 1];
    if(move & 0xff000000){
        this.hash_low ^= Chess.zorist[move & 0xff00 | (move & 0xf0000000) >>> 24 | 0];
        this.hash_high ^= Chess.zorist[move & 0xff00 | (move & 0xf0000000) >>> 24 | 1];
    }
    this.hash_low ^= Chess.zorist[(move & 0xff) << 8 | (move & 0xf00000) >> 16 | 0];
    this.hash_high ^= Chess.zorist[(move & 0xff) << 8 | (move & 0xf00000) >> 16 | 1];

    if(this.history[this.step_index | 2] != move){
        console.error("invalid apply/reverse move sequence: " + this.print_move(move));
    }
    this.step_index -= 0x10;
}

Chess.prototype.find_best_move = function(color) {
    this.current_best_move = null;
    this.maximum_color = color;
    // profile
    this.total_evaluated_times = 0;
    this.total_searched_nodes = 0;
    this.total_searched_moves = 0;
    this.total_hash_record = 0;
    this.total_hash_matched = 0;

    this.best_move_table.reset(0);

    this.start_search_time = new Date().getTime();

    this.iterative_deepening(color, this.max_depth, -Chess.INFINITY << 1, Chess.INFINITY << 1, 0);

    // profile
    var end_time = new Date().getTime();
    console.debug("profile: duration = " + (end_time - this.start_search_time) + "ms" +
        ", total evaluated times = " + this.total_evaluated_times +
        ", total searched nodes = " + this.total_searched_nodes +
        ", total searched moves = " + this.total_searched_moves +
        ", total hash record = " + this.total_hash_record +
        ", total hash matched = " + this.total_hash_matched);

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
    if(this.pieces[0x01] == 0 || this.pieces[0x81] == 0){
        return 1;
    }
    return this.check_if_repeat();
}

Chess.prototype.check_if_repeat = function(){
    if(this.step_index < 0x40) return 0;
    hash_low = this.history[this.step_index | 0x0];
    hash_high = this.history[this.step_index | 0x1];
    var move =  this.history[this.step_index | 0x2];
    color = (move & 0x800000) >> 23;
    var rep_count = 0;
    for(var i = this.step_index; (i -= 0x20) >= 0 && rep_count < 2 && (this.history[i | 0x2] & 0xff000000) == 0;){
        if(this.history[i | 0x0] == hash_low && this.history[i | 0x1] == hash_high){
            rep_count++;
        }
    }
    if(rep_count >= 2){
        if(this.check_king(1 - color)){
            return 3;
        }else{
            return 2;
        }
    }else{
        return 0;
    }
}

Chess.prototype.iterative_deepening = function(color, max_depth, alpha, beta, offset) {
    var value = null;
    for(var depth = 1; depth < max_depth; depth++){
        this.current_depth_search_timeout = false;
        var last_best_move = this.current_bast_move;
        value = this.alpha_beta(color, depth, 0, alpha, beta, offset);
        if(this.current_depth_search_timeout) break;
        this.current_bast_move = last_best_move;
        if(value >= Chess.INFINITY - Chess.MAX_PLY || (new Date().getTime() - this.start_search_time > this.max_search_time)){
            break;
        }
    }
    return value;
}

Chess.prototype.alpha_beta = function(color, depth, ply, alpha, beta, offset) {
    //profile
    this.total_searched_nodes++;
    var value;
    if (depth == 0){
        value = this.evaluate(color,depth);
        this.record_hash(depth, ply, value, Chess.Hash_FLAG_EXACT);
        return value;
        //return this.quies(color, depth,alpha,beta);
    }else{
        var status = this.game_over();
        if(status == 3){
            return Chess.INFINITY - ply;
        }else if(status == 2){
            return 0;
        }else if(status == 1){
            return -Chess.INFINITY + ply;
        }
    }
    var hash_flag = Chess.HASH_FLAG_ALPHA;
    if((value = this.probe_hash(depth, ply, alpha, beta)) != null){
        return value;
    }
    var new_offset = this.find_all_moves(color, depth, offset);
    var best_move = null;
    var tried_times = 0;
    for (var i = offset; i < new_offset; i++) {
        var move = this.moves[i];
        //if(ply < 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | apply move");
        this.apply_move(move);
        if(this.check_king(color)){
            this.reverse_move(move);
            //if(ply < 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | check king, cancel move");
        }else{
            var value = - this.alpha_beta(1 - color, depth - 1, ply + 1, -beta, -alpha, new_offset);
            this.reverse_move(move);
            tried_times++;
            //if(ply < 2) console.debug("[alpha-beta][" + depth + "] move = " + this.print_move(move) + " | cancel move, score = " + value);
            if (value >= beta) {
                this.record_hash(depth, ply, value, Chess.HASH_FLAG_BETA, move);
                this.best_move_table[move & 0xffff] = depth * depth;
                return value;
            } else if (value > alpha) {
                alpha = value;
                hash_flag = Chess.Hash_FLAG_EXACT;
                best_move = move;
                if(value >= Chess.INFINITY - Chess.MAX_PLY){
                    break;
                }
            }
        }
        if(new Date().getTime() - this.start_search_time > this.max_search_time){
            if(ply == 0){
                console.debug("time out occured in depth " + depth + " search....");
                this.current_depth_search_timeout = true;
            }
            break;
        }
    }
    this.record_hash(depth, ply, alpha, hash_flag, best_move);
    if(tried_times == 0){
        return -Chess.INFINITY + ply;
    }
    if(best_move != null){
        this.best_move_table[best_move & 0xffff] = depth * depth;
    }
    if(ply == 0){
        this.current_best_move = best_move;
        console.debug("find best move[" + depth + "]: " + this.print_move(best_move) + ", score = " + alpha);
    }
    return alpha;
}

Chess.prototype.quies = function(color,depth,alpha,beta,offset){
    var value = this.evaluate(color, depth);
    if(value >= beta){
        return beta;
    }else if(value > alpha){
        alpha = value;
    }
    var new_offset = this.find_all_moves(color, depth, offset);
    for (var i = offset; i < new_offset; i++) {
        var move = this.moves[i];
        if((move & 0xff000000) == 0) break;
        //if(depth > -2) console.debug("[quies][" + depth + "] move = " + this.print_move(move) + " | apply move");
        this.apply_move(move);
        value = - this.quies(1 - color, depth - 1, -beta, -alpha, new_offset);
        this.reverse_move(move);
        tried_times++;
        //if(depth > -2) console.debug("[quies][" + depth + "] move = " + this.print_move(move) + " | cancel move, score = " + value);
        if (value >= beta) {
            return beta;
        } else if (value > alpha) {
            alpha = value;
        }
    }
    return alpha;
}

Chess.prototype.filter_move = function(move){
    return true;
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

Chess.prototype.probe_hash = function(depth, ply, alpha, beta){
    var i = (this.hash_high & this.table_index_mask) << this.table_index_shift;
    for(var shift = 0;shift <= 0x8; shift += 0x8){
        var flag = this.hash_table[i | shift];
        if(flag != null && this.hash_table[i | 0x1 | shift] == this.hash_low && this.hash_table[i | 0x2 | shift] == this.hash_high){
            if(this.hash_table[i | 0x3 | shift] >= depth){
                var value = this.hash_table[i | 0x4 | shift];
                if(value >= Chess.INFINITY - Chess.MAX_PLY){
                    value -= ply;
                }else if(value <= -Chess.INFINITY + Chess.MAX_PLY){
                    value += ply;
                }
                var move = this.hash_table[i | 0x5 | shift];
                if(flag == Chess.Hash_FLAG_EXACT){
                    this.total_hash_matched++;
                    if(ply == 0) {
                        this.current_best_move = move;
                    }
                    return value;
                }
                if(flag == Chess.HASH_FLAG_ALPHA && value <= alpha){
                    this.total_hash_matched++;
                    if(ply == 0) {
                        this.current_best_move = move;
                    }
                    return alpha;
                }
                if(flag == Chess.HASH_FLAG_BETA && value >= beta){
                    this.total_hash_matched++;
                    if(ply == 0) {
                        this.current_best_move = move;
                    }
                    return beta;
                }
            }
        }
    }

    return null;
}

Chess.prototype.record_hash = function(depth, ply, value, hash_flag,move){
    this.total_hash_record++;
    if(value > Chess.INFINITY - Chess.MAX_PLY){
        value += ply;
    }else if(value <= -Chess.INFINITY + Chess.MAX_PLY){
        value -= ply;
    }
    var i = (this.hash_high & this.table_index_mask) << this.table_index_shift;
    for(var shift = 0;shift <= 0x8; shift += 0x8){
        if(shift > 0 || this.hash_table[i] == null || depth >= this.hash_table[i | 0x2 | shift]){
            this.hash_table[i | shift] = hash_flag;
            this.hash_table[i | 0x1 | shift] = this.hash_low;
            this.hash_table[i | 0x2 | shift] = this.hash_high;
            this.hash_table[i | 0x3 | shift] = depth;
            this.hash_table[i | 0x4 | shift] = value;
            this.hash_table[i | 0x5 | shift] = move;//best move
        }
    }
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
        scores[i] = this.best_move_table[move & 0xffff]; //((move & 0xff000000 ? Chess.arms_static_score[(move >>> 28) & 07] : 0) << 8);
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
                var move = src | (dest << 8) | (man << 16) | (killed_man << 24);
                if(this.filter_move(move)) moves[offset++] = move;
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
                            var move = src | (dest << 8) | (man << 16) | (killed_man << 24);
                            if(this.filter_move(move)) moves[offset++] = move;
                        }
                        break;
                    }
                } else if (killed_man > 0) {
                    mark = true;
                }else{
                    var move = src | (dest << 8) | (man << 16);
                    if(this.filter_move(move)) moves[offset++] = move;
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
                var move = m | (no << 16) | (killed_man << 24);
                if(this.filter_move(move)) moves[offset++] = move;
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
            var move = pking1 | (pking2 << 8) | (king1 << 16) | (king2 << 24);
            if(this.filter_move(move)) moves[offset++] = move;
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

TestEngine.prototype.test_zorist = function(){
    this.chess.reset();
    var hash_high = this.chess.hash_high, hash_low = this.chess.hash_low;
    this.chess.apply_move(0x00433311);
    this.assert(false, this.chess.hash_high == hash_high && this.chess.hash_low == hash_low);
    this.chess.reverse_move(0x00433311);
    this.assert(true, this.chess.hash_high == hash_high && this.chess.hash_low == hash_low);

    this.chess.apply_move(0xa131c454);
    this.assert(false, this.chess.hash_high == hash_high && this.chess.hash_low == hash_low);
    this.chess.reverse_move(0xa131c454);
    this.assert(true, this.chess.hash_high == hash_high && this.chess.hash_low == hash_low);
}

TestEngine.prototype.test_check_if_repeat = function(){
    this.chess.reset();
    this.chess.apply_move(0x00014737);
    this.chess.apply_move(0x009145c3);

    this.chess.apply_move(0x00015747);
    this.chess.apply_move(0x00915545);
    this.chess.apply_move(0x00014757);
    this.chess.apply_move(0x00914555);

    this.assert(0,this.chess.check_if_repeat());

    this.chess.apply_move(0x00015747);
    this.chess.apply_move(0x00915545);
    this.chess.apply_move(0x00014757);
    this.chess.apply_move(0x00914555);

    this.assert(3,this.chess.check_if_repeat());
}

var test = new TestEngine();
test.test_check_king();
test.test_zorist();
test.test_check_if_repeat();

function GameStatus() {
    this.whos_turn = null;
    this.user_color = null;
    this.step_count = 0;
    this.total_game_count = 0;
    this.user_failed_game_count = 0;
    this.game_over = 0;
    this.message = "";
    this.step_history = [];
}

GameStatus.prototype.render = function() {
    var s = '';
    if (this.game_over == 1) {
        if (this.whos_turn == this.user_color) {
            s += "你赢了，已走" + this.step_count + "步。";
        }
        else {
            s += "你输了，已走" + this.step_count + "步。这是你第" + this.user_failed_game_count + "次输了。";
        }
    } else if(this.game_over == 2){
        s += "重复局面已出现三次，已判和棋。";
    } else if(this.game_over == 3){
        if (this.whos_turn != this.user_color) {
            s += "你赢了，已走" + this.step_count + "步。";
        }
        else {
            s += "已长将三次，你输了，已走" + this.step_count + "步，这是你第" + this.user_failed_game_count + "次输了。";
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
    this.status.game_over = 0;
    this.status.render();
}

Interactive.prototype.on_restart_click = function(e) {
    this.reset();
}

Interactive.prototype.on_back_click = function(e) {
    if (this.status.whos_turn != this.status.user_color && this.status.game_over == 0) return;
    this.reverse_move();
    this.status.render();
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
    if (!this.check_game_over()) {
        var next_color = 1 - color;
        this.status.whos_turn = next_color;
        setTimeout(function() {
            var next_move = this.chess.find_best_move(next_color);
            if (next_move == null || next_move == 0) {
                this.status.whos_turn = color;
                this.on_game_over(1);
            } else {
                this.status.step_count += 1;
                this.chess.apply_move(next_move);
                this.status.step_history.push(next_move);
                this.render.apply_move(next_move);
                this.render.active_chessman((next_move & 0xff0000) >> 16)
                if (!this.check_game_over()) {
                    this.status.whos_turn = color;
                }
            }
            this.status.render();
        }.bind(this), 100);
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
        if(((move_info[2] & 0x80) >> 7) == this.status.user_color){
            this.status.whos_turn = this.status.user_color;
            break;
        }
    }
    if (this.status.game_over) {
        this.status.game_over = 0;
    }
}

Interactive.prototype.check_game_over = function(){
    var status = this.chess.game_over();
    this.on_game_over(status);
    return status;
}

Interactive.prototype.on_game_over = function(status) {
    if(status != 0){
        this.status.game_over = status;
        this.status.total_game_count += 1;
        if (status == 1 && this.status.whos_turn != this.status.user_color || status == 3 && this.status.whos_turn == this.status.user_color) {
            this.status.user_failed_game_count += 1;
        }
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
