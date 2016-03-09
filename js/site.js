// utility functions
Array.prototype.to_hash = function(get_key,get_value){
  var json = {};
  for(var i=0;i<this.length;i++){
    json[get_key(this[i],i)] = get_value ? get_value(this[i],i) : this[i];
  }
  return json;
}

Array.prototype.reset = function(){
  for(var i=0;i<this.length;i++){
    this[i] = 0;
  }
  return this;
}

Array.prototype.unzip = function(offset,length){
  var a = new Array(length);
  for(var i = 0; i < this.length; i++){
    a[offset + this[i][0]] = this[i][1];
  }
  return a;
}

Array.prototype.include = function(x){
  return this.indexOf(x) >= 0;
}

// chessman encoding:
// color arms   no
//     1    3    4
//     x  xxx xxxx

function Chess(){
  this.square = new Array(256).reset();
  this.pieces = new Array(256).reset();
  this.move_path = new Array(256);
  this.max_depth = 6;
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
  460,
  // bishop
  170,
  // elephant
  160,
  // pawn
  60,
];

Chess.arms_location_score = [
  // king
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // rook
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // horse
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // cannon
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // bishop
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // elephant
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
  // pawn
  [
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,-2, 0,0,0, -2,0,0, 0,0,0,0,
    0,0,0, 2,0,8, 0,8,0, 8,0,2, 0,0,0,0,

    0,0,0, 6,12,18, 18,20,18, 18,12,6, 0,0,0,0,
    0,0,0, 10,20,30, 34,40,34, 30,20,10, 0,0,0,0,
    0,0,0, 14,26,42, 60,80,60, 42,26,14, 0,0,0,0,
    0,0,0, 18,36,56, 80,120,80, 56,36,18, 0,0,0,0,
    0,0,0, 0,3,6, 9,12,9, 6,3,0, 0,0,0,0,

    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
    0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  ],
]

Chess.opening_square = [
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x11,0x21,0x51,0x41,0x01,0x42,0x52,0x22,0x12,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x31,0x00,0x00,0x00,0x00,0x00,0x32,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x61,0x00,0x62,0x00,0x63,0x00,0x64,0x00,0x65,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0xe1,0x00,0xe2,0x00,0xe3,0x00,0xe4,0x00,0xe5,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0xb1,0x00,0x00,0x00,0x00,0x00,0xb2,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x91,0xa1,0xd1,0xc1,0x81,0xc2,0xd2,0xa2,0x92,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
];

Chess.board_mask = [
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,

  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,
  0,0,0, 1,1,1, 1,1,1, 1,1,1, 0,0,0,0,

  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
];

Chess.king_room_mask = [
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,

  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0,0,

  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
  0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0,0,
];

Chess.horse_lag_delta  = [
  [ 0x0e, -0x01],
  [ 0x1f,  0x10],
  [ 0x21,  0x10],
  [ 0x12,  0x01],
  [-0x0e,  0x01],
  [-0x1f, -0x10],
  [-0x21, -0x10],
  [-0x12, -0x01],
].unzip(0x22,0x44);

Chess.valid_address = function(address){
  //return (address & 0x0f) >= 0x03 && (address & 0x0f) <= 0x0b && (address & 0xf0) >= 0x30 && (address & 0xf0) <= 0xc0;
  return Chess.board_mask[address] > 0;
}

Chess.encode_chessman = function(color,arms,no){
  return (color << 7) | (arms << 4) | no;
}

Chess.decode_chessman = function(chessman){
  return [chessman >> 7, (chessman & 0x70) >> 4, chessman & 0x0f]
}

Chess.encode_move = function(src,dest,chessman,killed_chessman){
  return src | (dest << 8) | (chessman << 16) | (killed_chessman << 24);
}

Chess.decode_move = function(move){
  return [move & 0xff, (move & 0xff00) >> 8, (move & 0xff0000) >> 16, move >>> 24]
}

Chess.move_def_help = function(arm,delta_list,check_address,check_move){
  var def = [new Array(256), new Array(256)];
  for(var color=0;color<2;color++){
    for(var src=0;src<256;src++){
      if(!Chess.valid_address(src) || check_address && !check_address(color,src))
        continue;
      def[color][src] = [];
      for(var i=0;i<delta_list.length;i++){
        var delta = delta_list[i];
        var dest = src + delta;
        if(!Chess.valid_address(dest) || check_address && !check_address(color,dest))
          continue;
        if(check_move && !check_move(color,src,dest)) continue;
        var move = src | (dest << 8) | (((color << 7) | (arm << 4)) << 16);
        def[color][src].push(move);
      }
    }
  }
  return def;
}

Chess.base_move_def = [
  // king
  Chess.move_def_help(0,[-0x01,0x10,0x01,-0x10],
    function(c,a){
      return c == (a >> 7) && Chess.king_room_mask[a];
    },null
  ),
  // rook
  Chess.move_def_help(1,[],null,null),
  // horse
  Chess.move_def_help(2,[0x0e,0x1f,0x21,0x12,-0x0e,-0x1f,-0x21,-0x12],null,null),
  // cannon
  Chess.move_def_help(3,[],null,null),
  // bishop
  Chess.move_def_help(4,[0x0f,0x11,-0x0f,-0x11],
    function(c,a){
      return [0x36,0x38,0x47,0x56,0x58].include(a - c * 0x70);
    },null
  ),
  // elephant
  Chess.move_def_help(5,[0x1e,0x22,-0x1e,-0x22],
    function(c,a){
      return [0x35,0x53,0x75,0x57,0x79,0x5b,0x39].include(a - c * 0x50);
    },null
  ),
  // pawn
  Chess.move_def_help(6,[-0x01,0x10,0x01,-0x10],
    function(c,a){
      return c != (a >> 7) || (a & 0x1) && (c ? a < 0x9f : a > 0x60);
    },
    function(c,s,d){
      return (s & 0xf0) == (d & 0xf0) || (c == 0) == ((s & 0xf0) < (d & 0xf0));
    }
  ),
];

Chess.color_names_index_map = Chess.color_names.to_hash(
  function(x){return x;},
  function(x,i){return i;}
);

Chess.arms_names_index_map = Chess.arms_names.to_hash(
  function(x){return x;},
  function(x,i){return i;}
);

Chess.prototype.reset_square = function(square){
  this.pieces.reset();
  for(var i=0;i<square.length;i++){
    this.square[i] = square[i];
    this.pieces[square[i]] = i;
  }
}

Chess.prototype.get_square = function(){
  return this.square;
}

Chess.prototype.reset = function(){
  this.reset_square(Chess.opening_square);
}

Chess.prototype.generate_move = function(src,dest){
  return Chess.encode_move(src,dest,this.square[src],this.square[dest]);
}

Chess.prototype.apply_move = function(move){
  this.pieces[move >>> 24] = 0;
  this.square[move & 0xff] = 0;
  this.square[(move & 0xff00) >> 8] = (move & 0xff0000) >> 16;
  this.pieces[(move & 0xff0000) >> 16] = (move & 0xff00) >> 8;
}

Chess.prototype.reverse_move = function(move){
  this.square[move & 0xff] = (move & 0xff0000) >> 16;
  this.pieces[(move & 0xff0000) >> 16] = move & 0xff;
  this.square[(move & 0xff00) >> 8] = move >>> 24;
  this.pieces[move >>> 24] = (move & 0xff00) >> 8;
}

Chess.prototype.find_best_move = function(color){
  this.current_best_move = null;
  this.maximum_color = color;
  //this.max_depth = 7;

  // profile
  this.total_evaluated_times = 0;
  this.total_searched_nodes = 0;
  var start_time = new Date().getTime();

  this.alpha_beta(color, this.max_depth, -131072, 131072);

  // profile
  var end_time = new Date().getTime();
  console.debug("profile: total-evaluated-times = " + this.total_evaluated_times + ", total-searched-nodes = " + this.total_searched_nodes + ", duration = " + (end_time - start_time) + "ms");

  return this.current_best_move;
}

Chess.prototype.valid_move = function(move){
  var chessman = (move & 0xff0000) >> 16;
  var all_moves = this.find_all_moves(chessman >> 7, 0);
  return all_moves.include(move);
}

Chess.prototype.game_over = function(){
  return this.pieces[0x01] == 0 || this.pieces[0x81] == 0;
}

Chess.prototype.find_all_moves = function(color, depth){
  var moves = [];
  this.find_all_moves_rook(color,depth,moves);
  this.find_all_moves_cannon(color,depth,moves);
  this.find_all_moves_king(color,depth,moves);
  this.find_all_moves_base(color,depth,moves);

  var move_scores = new Array(moves.length);
  this.sort_moves(moves, move_scores, color, depth);

  return moves;
}

Chess.prototype.sort_moves = function(moves, move_scores, color, depth){
  var max_i = -1;
  for(var i = 0; i < moves.length; i++){
    var move = moves[i];
    move_scores[i] = ((move & 0xff000000 ? Chess.arms_static_score[(move >>> 28) & 07] : 0) << 8);
  }

  for(var i = 0; i < moves.length; i++){
    for(var j = i + 1; j < moves.length; j++){
      if(move_scores[i] < move_scores[j]){
        var t = moves[i];
        moves[i] = moves[j];
        moves[j] = t;
        t = move_scores[i];
        move_scores[i] = move_scores[j];
        move_scores[j] = t;
      }
    }
  }
}

Chess.prototype.evaluate = function(c, depth){
  var score = 0, man, addr;
  for(var arm=0; arm < 7;arm++){
    for(var no=1; no <= Chess.arms_count[arm]; no++){
      man = (c << 7) | (arm << 4) | no;
      addr = this.pieces[man];
      if(addr != 0){
        score += Chess.arms_static_score[arm] + Chess.arms_location_score[arm][addr ^ ((0x100 - (c << 4)) & 0xff)];
      }

      man = ((1 - c) << 7) | (arm << 4) | no;
      addr = this.pieces[man];
      if(addr != 0){
        score -= Chess.arms_static_score[arm] + Chess.arms_location_score[arm][addr ^ ((0x100 - (c << 4)) & 0xff)];
      }
    }
  }
  //console.debug("evaluate: score = " + score + ", depth = " + depth + ", color = " + color);
  // profile
  this.total_evaluated_times++;

  return score;
}

Chess.prototype.alpha_beta = function(color, depth, alpha, beta){
  //profile
  this.total_searched_nodes++;

  if(depth == 0 || this.game_over()) return this.evaluate(color, depth);
  var all_moves = this.find_all_moves(color,depth);
  for(var i = 0; i < all_moves.length; i++){
    var move = all_moves[i];
    //console.debug("apply move: " + move.toString(16) + " | color = " + color + ", depth = " + depth);
    this.apply_move(move);
    this.move_path[this.max_depth - depth] = move;
    var value = - this.alpha_beta(1 - color, depth - 1, -beta, -alpha);
    this.reverse_move(move);
    if(value >= beta){
      return value;
    }else if(value > alpha){
      alpha = value;
      if(depth == this.max_depth){
        this.current_best_move = move;
      }
    }
  }
  return alpha;
}

Chess.prototype.find_all_moves_rook = function(color, depth, moves){
  for(var no = 1; no <= 2; no++){
    var man = (color << 7) | (1 << 4) | no;
    var src = this.pieces[man];
    if(src == 0) continue;
    for(var shift = 0; shift < 4; shift++){
      var delta = ((shift & 0x1) ? 1 : -1) * (1 << ((shift & 0x2) << 1));
      for(var dest = src;Chess.board_mask[(dest = dest + delta)];){
        var killed_man = this.square[dest];
        if(killed_man > 0 && (killed_man >> 7) == color) break;
        moves.push(src | (dest << 8) | (man << 16) | (killed_man << 24));
        if(killed_man > 0) break;
      }
    }
  }
}

Chess.prototype.find_all_moves_cannon = function(color, depth,moves){
  for(var no = 1;no <= 2; no++){
    var man = (color << 7) | (3 << 4) | no;
    var src = this.pieces[man];
    if(src == 0) continue;
    for(var shift = 0; shift < 4; shift++){
      var delta = ((shift & 0x1) ? 1 : -1) * (1 << ((shift & 0x2) << 1));
      var mark = false;
      for(var dest = src;Chess.board_mask[(dest = dest + delta)];){
        var killed_man = this.square[dest];
        if(mark){
          if(killed_man > 0){
            if((killed_man >> 7) != color){
              moves.push(src | (dest << 8) | (man << 16) | (killed_man << 24));
            }
            break;
          }
        }else if(killed_man > 0){
          mark = true;
        }else{
          moves.push(src | (dest << 8) | (man << 16));
        }
      }
    }
  }
}

Chess.prototype.find_all_moves_base = function(color, depth,moves){
  for(var arm = 0; arm < 7; arm++){
    for(var no = 1; no <= Chess.arms_count[arm]; no++){
      var man = (color << 7) | (arm << 4) | no;
      var src = this.pieces[man];
      if(src == 0) continue;
      var ms = Chess.base_move_def[arm][color][src];
      if(!ms) continue;
      for(var i=0;i<ms.length;i++){
        var m = ms[i];
        var dest = (m & 0xff00) >> 8;
        var killed_man = this.square[dest];
        if(killed_man > 0 && (killed_man >> 7) == color) continue;
        if(arm == 2){
          if(this.square[src + Chess.horse_lag_delta[dest - src + 0x22]] != 0) continue;
        }else if(arm == 5){
          if(this.square[(src + dest) >> 1] != 0) continue;
        }
        moves.push(m | (no << 16) | (killed_man << 24));
      }
    }
  }
}

Chess.prototype.find_all_moves_king = function(color, depth, moves){
  var king1 = (color << 7) | (0 << 4) | 1;
  var king2 = ((1-color) << 7) | (0 << 4) | 1;
  var pking1 = this.pieces[king1], pking2 = this.pieces[king2]
  if((pking1 & 0x0f) == (pking2 & 0x0f)){
    var d = pking1 < pking2 ? 0x10 : -0x10;
    var found = false;
    for(var p = pking1;(p+=d) != pking2;){
      if(this.square[p] > 0) {
        found = true;
        break;
      }
    }
    if(!found){
      moves.push(pking1 | (pking2 << 8) | (king1 << 16) | (king2 << 24));
    }
  }
}

function GameStatus(){
  this.whos_turn = null;
  this.user_color = null;
  this.step_count = 0;
  this.total_game_count = 0;
  this.user_failed_game_count = 0;
  this.game_over = false;
  this.message = "";
  this.step_history = [];
}

GameStatus.prototype.render = function(){
  var s = '';
  if(this.game_over){
    if(this.whos_turn == this.user_color){
      s += "你赢了。";
    }
    else{
      s += "你输了，这是你第"+this.user_failed_game_count+"次输了。";
    }
  }else{
     s += "正在进行第"+(this.total_game_count+1)+"次比赛，当前步数："+(this.step_count+1)+"。";
     if(this.whos_turn == this.user_color){
       s += "请走棋：";
     }else{
       s += "机器正在思考中。。。"
     }
  }
  document.getElementById('status_span').textContent = s;
}

function Interactive(chess,render,status){
  this.chess = chess;
  this.render = render;
  this.status = status;
  this.selected_chessman = 0;
}

Interactive.prototype.transform_from_screen_to_panel = function(x,y){
  var pt = this.svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  var pt2 = pt.matrixTransform(this.matrix);
  return {x: pt2.x, y: pt2.y};
}

Interactive.prototype.init = function(){
  this.svg = document.getElementById('panel_svg');
  this.matrix = this.svg.getScreenCTM().inverse();
  this.panel_wrapper = document.getElementById('panel_wrapper');
  this.svg.addEventListener('click',this.on_board_click.bind(this),true);
  document.getElementById('btn_restart').addEventListener('click',this.on_restart_click.bind(this),true);
  document.getElementById('btn_back').addEventListener('click',this.on_back_click.bind(this),true);
  this.reset();
}

Interactive.prototype.reset = function(){
  this.chess.reset();
  this.render.reset_board(this.chess.get_square());
  this.status.step_count = 0;
  this.status.step_history = [];
  this.status.whos_turn = this.status.user_color = null;
  this.selected_chessman = 0;
  this.status.game_over = false;
  this.status.render();
}

Interactive.prototype.on_restart_click = function(e){
  this.reset();
}

Interactive.prototype.on_back_click = function(e){
  if(this.status.whos_turn != this.status.user_color) return;
  this.reverse_move();
}

Interactive.prototype.on_board_click = function(e){
  if(this.status.game_over) return;
  var render_addr = this.transform_from_screen_to_panel(e.clientX, e.clientY);
  var addr = BoardRender.logic_address(render_addr);
  if(!Chess.valid_address(addr)) return;
  var chessman = this.chess.get_square()[addr];
  var color = Chess.decode_chessman(chessman)[0];
  if(chessman != 0 && this.status.user_color == null){
    this.status.whos_turn = this.status.user_color = color;
  }
  if(this.status.user_color != this.status.whos_turn) return;
  if(this.status.user_color)
  if(chessman == 0 && this.selected_chessman == 0) return;
  if(this.selected_chessman == 0 || this.status.user_color == color){
    this.selected_chessman = chessman;
    this.src = addr;
    this.render.active_chessman(chessman);
  }else if(addr == this.src){
    this.selected_chessman = 0;
    this.render.active_chessman(0);
  }else{
    var move = this.chess.generate_move(this.src,addr);
    if(!this.chess.valid_move(move)) return;
    this.apply_move(move, this.status.user_color);
    this.selected_chessman = 0;
    this.render.active_chessman(0);
  }
}

Interactive.prototype.apply_move = function(move, color){
  this.status.step_count += 1;
  this.chess.apply_move(move);
  this.status.step_history.push(move);
  this.render.apply_move(move);
  if(this.chess.game_over()){
    this.on_game_over();
    this.status.render();
  }else{
    var next_color = 1 - color;
    this.status.whos_turn = next_color;
    setTimeout(function(){
      var next_move = this.chess.find_best_move(next_color);
      if(next_move == null || next_move == 0){
        this.status.whos_turn = color;
        this.on_game_over();
      }else{
        this.status.step_count += 1;
        this.chess.apply_move(next_move);
        this.status.step_history.push(next_move);
        this.render.apply_move(next_move);
        if(this.chess.game_over()){
          this.on_game_over();
        }else{
          this.status.whos_turn = color;
        }
      }
      this.status.render();
    }.bind(this),0);
  }
  this.status.render();
  return true;
}

Interactive.prototype.reverse_move = function(){
  for(var i = 0; i < 2; i++){
    if(this.status.step_history.length == 0) return;
    var move = this.status.step_history.pop();
    var move_info = Chess.decode_move(move);
    this.chess.reverse_move(move);
    this.render.reverse_move(move);
    if(this.status.game_over){
      this.status.game_over = false;
    }
  }
}

Interactive.prototype.on_game_over = function(){
  this.status.game_over = true;
  this.status.total_game_count += 1;
  if(this.status.whos_turn != this.status.user_color){
    this.status.user_failed_game_count += 1;
  }
  this.status.render();
}

function BoardRender(){}

BoardRender.logic_address = function(render_address){
  return (Math.round(render_address.x / 10) + 3) + ((Math.round(render_address.y / 10) + 3) << 4)
}

BoardRender.render_address = function(logic_address){
  return {
    x: ((logic_address & 0x0f) - 3) * 10,
    y: ((logic_address >> 4) - 3) * 10
  }
}

BoardRender.chessman_id_to_code = function(chessman_id){
  var seg = chessman_id.split('_');
  return Chess.encode_chessman(Chess.color_names_index_map[seg[0]],Chess.arms_names_index_map[seg[1]],parseInt(seg[2]));
}

BoardRender.chessman_code_to_id = function(chessman_code){
  var seg = Chess.decode_chessman(chessman_code);
  return Chess.color_names[seg[0]] + '_' + Chess.arms_names[seg[1]] + '_' + seg[2];
}

BoardRender.prototype.reset_board = function(square){
  for(var i=0;i<square.length;i++){
    if(Chess.valid_address(i) && square[i] > 0){
      this.apply_move(Chess.encode_move(0x33, i, square[i], 0));
    }
  }
}

BoardRender.prototype.active_chessman = function(chessman){
  if(this.current_active_chessman){
    this.current_active_chessman.classList.remove('selected');
    this.current_active_chessman = null;
  }
  if(chessman != 0){
    var chessman_id = BoardRender.chessman_code_to_id(chessman);
    this.current_active_chessman = document.getElementById(chessman_id);
    this.current_active_chessman.classList.add('selected');
  }
}

BoardRender.prototype.apply_move = function(move){
  var move_info = Chess.decode_move(move);
  if(move_info[3]){
    this.kill_chessman(move_info[3]);
  }
  var dest = BoardRender.render_address(move_info[1]);
  var chessman = document.getElementById(BoardRender.chessman_code_to_id(move_info[2]));
  chessman.setAttribute('transform',"translate(" + dest.x + "," + dest.y + ")");
  chessman.classList.add('alive');
}

BoardRender.prototype.reverse_move = function(move){
  var move_info = Chess.decode_move(move);
  var src = BoardRender.render_address(move_info[0]);
  var chessman = document.getElementById(BoardRender.chessman_code_to_id(move_info[2]));
  chessman.setAttribute('transform',"translate(" + src.x + "," + src.y + ")");
  chessman.classList.add('alive');
  if(move_info[3]){
    var dest = BoardRender.render_address(move_info[1]);
    var chessman_killed = document.getElementById(BoardRender.chessman_code_to_id(move_info[3]));
    chessman_killed.setAttribute('transform',"translate(" + dest.x + "," + dest.y + ")");
    chessman_killed.classList.add('alive');
  }
}

BoardRender.prototype.kill_chessman = function(chessman_code){
  var chessman = document.getElementById(BoardRender.chessman_code_to_id(chessman_code));
  chessman.classList.remove('alive');
}

function Game(){
  this.status = new GameStatus();
  this.render = new BoardRender();
  this.chess = new Chess();
  this.ui = new Interactive(this.chess,this.render,this.status);
}

Game.prototype.init = function(){
  this.ui.init();
}

var game = new Game();
game.init();
