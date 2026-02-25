// server.js（デバッグログ入り・それ以外は現状維持）
// 既存のserver.jsをこれで置き換えてください（ログ追加以外の挙動は変えていません）

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

// ====== defaults ======
const DEFAULT_DECK_CONFIG = {
  SHIFT_P1: 9,
  SHIFT_M1: 9,
  SWAP_17: 3,
  SWAP_26: 3,
  SWAP_35: 3,
  SWAP_ADJ: 7,
  T_ACCEL: 2,
  T_DECEL: 2,
  T_STOP: 2
};

const DEFAULT_SETTINGS = {
  N: 7,
  Z: 2,
  H: 3,
  T0: 10,
  Tmax: 12,
  wrap: true,
  seed: ""
};

const CARD_DEFS = {
  SHIFT_P1: { id:"SHIFT_P1", name:"シフト+1（パレード！）", type:"shift", val:+1, text:"全ての箱を+1" },
  SHIFT_M1: { id:"SHIFT_M1", name:"シフト-1（逆パレード！）", type:"shift", val:-1, text:"全ての箱を-1" },

  SWAP_17: { id:"SWAP_17", name:"入れ替え 1↔N（端から端まで）", type:"swap", kind:"edge", k:1, text:"位置1とNの箱を入れ替える" },
  SWAP_26: { id:"SWAP_26", name:"入れ替え 2↔(N-1)（二列目チェンジ）", type:"swap", kind:"edge", k:2, text:"位置2とN-1の箱を入れ替える" },
  SWAP_35: { id:"SWAP_35", name:"入れ替え 3↔(N-2)（センター崩し）", type:"swap", kind:"edge", k:3, text:"位置3とN-2の箱を入れ替える" },

  SWAP_ADJ:{ id:"SWAP_ADJ", name:"隣接入れ替え（席替え）", type:"swap", kind:"adj", text:"隣接2位置を指定して箱を入れ替える" },

  T_ACCEL:{ id:"T_ACCEL", name:"加速（煽れ）", type:"timer", tdelta:-1, text:"タイマー段でT-1" },
  T_DECEL:{ id:"T_DECEL", name:"減速（引き延ばせ）", type:"timer", tdelta:+1, text:"タイマー段でT+1" },
  T_STOP: { id:"T_STOP",  name:"停止（間）", type:"timer", stop:true,  text:"このラウンドの通常T-1を行わない" }
};

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

function hashStringToUint32(str){
  let h = 2166136261 >>> 0;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed){
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedStr){
  if(!seedStr) return Math.random;
  const seed = hashStringToUint32(seedStr);
  return mulberry32(seed);
}
function shuffle(arr, rng=Math.random){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(rng()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function genRoomCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for(let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function now(){ return Date.now(); }

function clampInt(v, min, max, fallback){
  const n = Number(v);
  if(!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function normalizeSettings(input){
  const s = { ...DEFAULT_SETTINGS, ...(input || {}) };

  s.N = clampInt(s.N, 5, 12, DEFAULT_SETTINGS.N);
  const maxZByN = Math.max(1, Math.floor(s.N / 2));
  s.Z = clampInt(s.Z, 1, Math.min(5, maxZByN), DEFAULT_SETTINGS.Z);

  s.H = clampInt(s.H, 1, 5, DEFAULT_SETTINGS.H);

  s.T0 = clampInt(s.T0, 1, 50, DEFAULT_SETTINGS.T0);
  s.Tmax = clampInt(s.Tmax, 1, 99, DEFAULT_SETTINGS.Tmax);
  if(s.Tmax < s.T0) s.Tmax = s.T0;

  s.seed = (s.seed ?? "").toString();
  s.wrap = true;

  return s;
}

function buildInitialSlotToBox(N){
  const slotToBox = {};
  for(let i=1;i<=N;i++){
    slotToBox[i] = String.fromCharCode("A".charCodeAt(0) + (i-1));
  }
  return slotToBox;
}

function wrapPos(pos, delta, N){
  let x = ((pos - 1 + delta) % N + N) % N;
  return x + 1;
}
function applyShift(room, delta){
  if(delta===0) return;
  const N = room.settings.N;
  const newMap = {};
  for(let pos=1; pos<=N; pos++){
    const fromPos = wrapPos(pos, -delta, N);
    newMap[pos] = room.slotToBox[fromPos];
  }
  room.slotToBox = newMap;
}
function applySwap(room, a, b){
  const tmp = room.slotToBox[a];
  room.slotToBox[a] = room.slotToBox[b];
  room.slotToBox[b] = tmp;
}
function boxAt(room, pos){
  return room.slotToBox[pos];
}

function computeEdgeSwap(cardId, N){
  const def = CARD_DEFS[cardId];
  const k = def.k;
  const a = k;
  const b = N - (k - 1);
  if(a < 1 || b > N) return null;
  if(a >= b) return null;
  return [a,b];
}

function pushLog(room, line){
  room.log.unshift(line);
  if(room.log.length > 400) room.log.length = 400;
}

function buildDeckFromConfig(deckConfig, settings, room){
  const rng = makeRng(settings.seed);
  const deck = [];

  for(const [cardId, countRaw] of Object.entries(deckConfig)){
    const count = Math.max(0, Math.floor(Number(countRaw) || 0));
    if(count === 0) continue;
    if(!CARD_DEFS[cardId]) continue;

    if(cardId === "SWAP_35"){
      const pair = computeEdgeSwap("SWAP_35", settings.N);
      if(!pair){
        if(room) pushLog(room, `設定N=${settings.N}では「入れ替え 3↔(N-2)」が成立しないため除外した。`);
        continue;
      }
    }

    for(let i=0;i<count;i++) deck.push(cardId);
  }
  return shuffle(deck, rng);
}

function roomPublicState(room){
  const totalDeckCount = Object.values(room.deckConfig).reduce((a,b)=>a+b,0);
  return {
    code: room.code,
    phase: room.phase,
    hostClientId: room.hostClientId,
    settings: room.settings,
    deckConfig: room.deckConfig,
    deckTotal: totalDeckCount,
    slotToBox: room.slotToBox,
    timerT: room.timerT,
    round: room.round,
    firstPlayer: room.firstPlayer,
    bombSet: room.bombSet,
    revealed: {
      P1: room.picks.P1 ? { cardId: room.picks.P1.cardId, adj: room.picks.P1.adj || null } : null,
      P2: room.picks.P2 ? { cardId: room.picks.P2.cardId, adj: room.picks.P2.adj || null } : null,
    },
    participants: [...room.participants],
    spectators: [...room.spectators],
    log: room.log.slice(-200)
  };
}
function personalState(room, clientId){
  const role = room.rolesByClientId.get(clientId) || "UNKNOWN";
  const isP1 = role === "P1";
  const isP2 = role === "P2";
  return {
    role,
    hand: isP1 ? room.hands.P1.map(id => CARD_DEFS[id]) :
          isP2 ? room.hands.P2.map(id => CARD_DEFS[id]) : null,
    myBombBox: isP1 ? room.bombs.toP2Box :
               isP2 ? room.bombs.toP1Box : null,
    myBombSet: isP1 ? room.bombSet.P1 :
               isP2 ? room.bombSet.P2 : null
  };
}
function emitRoom(room){
  io.to(room.code).emit("room:update", roomPublicState(room));
  for(const [cid, sid] of room.socketsByClientId.entries()){
    io.to(sid).emit("room:me", personalState(room, cid));
  }
}

function drawOne(room){
  const rng = makeRng(room.settings.seed);
  if(room.deck.length === 0){
    room.deck = shuffle(room.discard, rng);
    room.discard = [];
    pushLog(room, "— 山札が尽きたため、捨て札をシャッフルして山札にした。");
  }
  return room.deck.pop();
}
function replenishHands(room){
  const H = room.settings.H;
  while(room.hands.P1.length < H) room.hands.P1.push(drawOne(room));
  while(room.hands.P2.length < H) room.hands.P2.push(drawOne(room));
}

// ===== rooms =====
const rooms = new Map();

function createRoom(hostClientId){
  let code;
  do { code = genRoomCode(); } while(rooms.has(code));

  const room = {
    code,
    hostClientId,
    phase: "SETTINGS",
    settings: normalizeSettings(DEFAULT_SETTINGS),
    deckConfig: clone(DEFAULT_DECK_CONFIG),

    deck: [],
    discard: [],
    hands: { P1: [], P2: [] },

    slotToBox: buildInitialSlotToBox(DEFAULT_SETTINGS.N),
    bombs: { toP1Box: null, toP2Box: null },
    bombSet: { P1:false, P2:false },

    picks: { P1:null, P2:null },
    timerT: DEFAULT_SETTINGS.T0,
    round: 0,
    firstPlayer: "P1",

    participants: new Set(),
    spectators: new Set(),
    rolesByClientId: new Map(),
    socketsByClientId: new Map(),
    lastSeenByClientId: new Map(),

    log: []
  };

  room.rolesByClientId.set(hostClientId, "HOST");
  rooms.set(code, room);
  return room;
}

function joinRoom(socket, { roomCode, clientId, joinAs }){
  const room = rooms.get(roomCode);
  if(!room) return { ok:false, error:"ROOM_NOT_FOUND" };

  socket.join(room.code);
  room.socketsByClientId.set(clientId, socket.id);
  room.lastSeenByClientId.set(clientId, now());

  const existing = room.rolesByClientId.get(clientId);

  if(existing){
    if(existing === "PARTICIPANT") room.participants.add(clientId);
    if(existing === "SPECTATOR") room.spectators.add(clientId);
    if(existing === "P1" || existing === "P2" || existing === "HOST"){
      room.participants.add(clientId);
      room.spectators.delete(clientId);
    }
  } else {
    if(joinAs === "SPECTATOR"){
      room.rolesByClientId.set(clientId, "SPECTATOR");
      room.spectators.add(clientId);
    } else {
      room.rolesByClientId.set(clientId, "PARTICIPANT");
      room.participants.add(clientId);
    }
  }

  emitRoom(room);
  return { ok:true, room: roomPublicState(room), me: personalState(room, clientId) };
}

function cleanupClient(room, clientId){
  room.socketsByClientId.delete(clientId);
  room.lastSeenByClientId.set(clientId, now());
}

setInterval(() => {
  const TTL = 5 * 60 * 1000;
  for(const room of rooms.values()){
    for(const [cid, ts] of room.lastSeenByClientId.entries()){
      if(now() - ts > TTL){
        room.socketsByClientId.delete(cid);
        room.lastSeenByClientId.delete(cid);
        room.participants.delete(cid);
        room.spectators.delete(cid);
      }
    }
  }
}, 30 * 1000);

function destroyRoom(roomCode, reason){
  const room = rooms.get(roomCode);
  if(!room) return;
  console.log("[room:destroy] destroying", roomCode, "reason=", reason);
  io.to(roomCode).emit("room:destroyed", { roomCode, reason: reason || "DESTROYED" });
  const sockIds = [...room.socketsByClientId.values()];
  for(const sid of sockIds){
    const s = io.sockets.sockets.get(sid);
    if(s) s.leave(roomCode);
  }
  rooms.delete(roomCode);
}

// ====== resolve round ======
function resolveRound(room){
  const N = room.settings.N;
  const Z = room.settings.Z;

  const p1 = room.picks.P1;
  const p2 = room.picks.P2;
  const c1 = CARD_DEFS[p1.cardId];
  const c2 = CARD_DEFS[p2.cardId];

  pushLog(room, `=== ラウンド${room.round}（先手:${room.firstPlayer} / T=${room.timerT}）===`);
  pushLog(room, `公開：P1「${c1.name}」 / P2「${c2.name}」`);

  const shiftDelta = (c1.type==="shift" ? c1.val : 0) + (c2.type==="shift" ? c2.val : 0);
  if(shiftDelta !== 0){
    applyShift(room, shiftDelta);
    pushLog(room, `シフト合算：${shiftDelta>0?"+":""}${shiftDelta}（箱が移動）`);
  } else {
    pushLog(room, "シフト合算：0（変化なし）");
  }

  const order = room.firstPlayer === "P1" ? ["P1","P2"] : ["P2","P1"];
  for(const role of order){
    const pick = room.picks[role];
    const cardId = pick.cardId;
    const card = CARD_DEFS[cardId];
    if(card.type !== "swap") continue;

    let a, b;
    if(card.kind === "adj"){
      [a,b] = pick.adj;
    } else if(card.kind === "edge"){
      const pair = computeEdgeSwap(cardId, N);
      if(!pair){
        pushLog(room, `入れ替え：${role}の「${card.name}」はN=${N}で不成立のため不発`);
        continue;
      }
      [a,b] = pair;
    } else {
      continue;
    }

    applySwap(room, a, b);
    pushLog(room, `入れ替え：${role}が位置${a}↔位置${b}`);
  }

  let tDelta = 0;
  let stop = false;
  if(c1.type==="timer"){
    if(c1.tdelta) tDelta += c1.tdelta;
    if(c1.stop) stop = true;
  }
  if(c2.type==="timer"){
    if(c2.tdelta) tDelta += c2.tdelta;
    if(c2.stop) stop = true;
  }

  if(tDelta !== 0){
    room.timerT = Math.max(0, Math.min(room.settings.Tmax, room.timerT + tDelta));
    pushLog(room, `タイマー効果合算：${tDelta>0?"+":""}${tDelta} → T=${room.timerT}`);
  } else {
    pushLog(room, "タイマー効果合算：0（変化なし）");
  }

  if(stop){
    pushLog(room, "停止：このラウンドの通常T-1は行わない");
  } else {
    room.timerT = Math.max(0, room.timerT - 1);
    pushLog(room, `ラウンド最後：通常T-1 → T=${room.timerT}`);
  }

  room.discard.push(p1.cardId, p2.cardId);

  if(room.timerT === 0){
    const loseP1 = [...Array(Z)].some((_,i) => boxAt(room, 1+i) === room.bombs.toP1Box);
    const loseP2 = [...Array(Z)].some((_,i) => boxAt(room, N-i) === room.bombs.toP2Box);

    pushLog(room, "--- 爆発（T=0）---");
    pushLog(room, `（開示）P1に贈られた爆弾入り箱：箱${room.bombs.toP1Box}`);
    pushLog(room, `（開示）P2に贈られた爆弾入り箱：箱${room.bombs.toP2Box}`);
    let posLine = "（開示）爆発時の配置：";
    for(let i=1;i<=N;i++) posLine += ` ${i}=${boxAt(room,i)}`;
    pushLog(room, posLine);

    if(loseP1 && loseP2) pushLog(room, "結果：引き分け（同時被弾）");
    else if(loseP1) pushLog(room, "結果：P1の負け");
    else if(loseP2) pushLog(room, "結果：P2の負け");
    else pushLog(room, "結果：引き分け（不発）");

    room.phase = "ENDED";
    room.picks = { P1:null, P2:null };
    return;
  }

  room.picks = { P1:null, P2:null };
  replenishHands(room);

  room.firstPlayer = room.firstPlayer === "P1" ? "P2" : "P1";
  room.round += 1;
  pushLog(room, `次ラウンドへ：ラウンド${room.round}。先手は${room.firstPlayer}。`);
}

// ====== sockets (with debug logs) ======
io.on("connection", (socket) => {
  console.log("[socket] connected", socket.id);

  socket.on("room:create", ({ clientId }) => {
    console.log("[room:create]", { clientId, socketId: socket.id });
    const room = createRoom(clientId);

    // NOTE: このテンプレでは client.js 側で room:created 後に room:join を必ず呼ぶ想定。
    socket.emit("room:created", { code: room.code });
  });

  socket.on("room:join", (payload, cb) => {
    console.log("[room:join]", { ...payload, socketId: socket.id });
    try{
      const res = joinRoom(socket, payload);
      cb && cb(res);
    } catch(e){
      console.error("[room:join] error", e);
      cb && cb({ ok:false, error:"JOIN_FAILED" });
    }
  });

  socket.on("room:leave", ({ roomCode, clientId }) => {
    console.log("[room:leave]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return;
    room.socketsByClientId.delete(clientId);
    room.lastSeenByClientId.delete(clientId);
    room.participants.delete(clientId);
    room.spectators.delete(clientId);
    room.rolesByClientId.delete(clientId);
    emitRoom(room);
  });

  socket.on("room:destroy", ({ roomCode, clientId }, cb) => {
    console.log("[room:destroy]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.hostClientId !== clientId) return cb && cb({ ok:false, error:"NOT_HOST" });
    destroyRoom(roomCode, "HOST_ENDED");
    cb && cb({ ok:true });
  });

  socket.on("settings:updateAll", ({ roomCode, clientId, settings, deckConfig }, cb) => {
    console.log("[settings:updateAll]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.hostClientId !== clientId) return cb && cb({ ok:false, error:"NOT_HOST" });
    if(room.phase !== "SETTINGS" && room.phase !== "LOBBY") return cb && cb({ ok:false, error:"LOCKED" });

    room.settings = normalizeSettings(settings);

    const nextDeck = {};
    for(const key of Object.keys(DEFAULT_DECK_CONFIG)){
      const v = Number(deckConfig?.[key] ?? room.deckConfig[key] ?? 0);
      nextDeck[key] = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    }
    room.deckConfig = nextDeck;

    room.slotToBox = buildInitialSlotToBox(room.settings.N);

    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("settings:resetDefault", ({ roomCode, clientId }, cb) => {
    console.log("[settings:resetDefault]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.hostClientId !== clientId) return cb && cb({ ok:false, error:"NOT_HOST" });
    if(room.phase !== "SETTINGS" && room.phase !== "LOBBY") return cb && cb({ ok:false, error:"LOCKED" });

    room.deckConfig = clone(DEFAULT_DECK_CONFIG);
    room.settings = normalizeSettings(DEFAULT_SETTINGS);
    room.slotToBox = buildInitialSlotToBox(room.settings.N);

    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("settings:confirm", ({ roomCode, clientId }, cb) => {
    console.log("[settings:confirm]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.hostClientId !== clientId) return cb && cb({ ok:false, error:"NOT_HOST" });

    room.phase = "LOBBY";
    pushLog(room, "ホストが設定を確定。ロビーへ。");
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("lobby:setJoinAs", ({ roomCode, clientId, joinAs }, cb) => {
    console.log("[lobby:setJoinAs]", { roomCode, clientId, joinAs, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.phase !== "SETTINGS" && room.phase !== "LOBBY") return cb && cb({ ok:false, error:"LOCKED" });

    const currentRole = room.rolesByClientId.get(clientId);
    if(currentRole === "P1" || currentRole === "P2") return cb && cb({ ok:false, error:"ROLE_LOCKED" });

    if(joinAs === "SPECTATOR"){
      room.rolesByClientId.set(clientId, "SPECTATOR");
      room.participants.delete(clientId);
      room.spectators.add(clientId);
    } else {
      room.rolesByClientId.set(clientId, "PARTICIPANT");
      room.spectators.delete(clientId);
      room.participants.add(clientId);
    }
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("game:start", ({ roomCode, clientId }, cb) => {
    console.log("[game:start]", { roomCode, clientId, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.hostClientId !== clientId) return cb && cb({ ok:false, error:"NOT_HOST" });
    if(room.phase !== "LOBBY") return cb && cb({ ok:false, error:"BAD_PHASE" });

    const rng = makeRng(room.settings.seed);

    const candidates = [...room.participants].filter(cid => {
      const r = room.rolesByClientId.get(cid);
      return r === "PARTICIPANT" || r === "HOST";
    });
    if(candidates.length < 1) return cb && cb({ ok:false, error:"NEED_2_PARTICIPANTS" });

    shuffle(candidates, rng);
    const p1cid = candidates[0];
    const p2cid = candidates[1];

    room.rolesByClientId.set(p1cid, "P1");
    room.rolesByClientId.set(p2cid, "P2");

    for(const cid of candidates.slice(2)){
      room.rolesByClientId.set(cid, "SPECTATOR");
      room.spectators.add(cid);
      room.participants.delete(cid);
    }

    room.slotToBox = buildInitialSlotToBox(room.settings.N);
    room.bombs = { toP1Box: null, toP2Box: null };
    room.bombSet = { P1:false, P2:false };

    room.timerT = room.settings.T0;
    room.round = 1;
    room.firstPlayer = rng() < 0.5 ? "P1" : "P2";
    room.picks = { P1:null, P2:null };

    room.deck = buildDeckFromConfig(room.deckConfig, room.settings, room);
    room.discard = [];
    room.hands = { P1: [], P2: [] };
    replenishHands(room);

    room.phase = "BOMB";
    pushLog(room, `ゲーム開始：P1/P2をランダム割当。先手は${room.firstPlayer}。T=${room.settings.T0}（上限${room.settings.Tmax}）。N=${room.settings.N}, Z=${room.settings.Z}, H=${room.settings.H}。seed=${room.settings.seed || "(random)"}`);
    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("bomb:set", ({ roomCode, clientId, pos }, cb) => {
    console.log("[bomb:set]", { roomCode, clientId, pos, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.phase !== "BOMB") return cb && cb({ ok:false, error:"BAD_PHASE" });

    const role = room.rolesByClientId.get(clientId);
    if(role !== "P1" && role !== "P2") return cb && cb({ ok:false, error:"NOT_PLAYER" });

    const p = Number(pos);
    if(!(p>=1 && p<=room.settings.N)) return cb && cb({ ok:false, error:"BAD_POS" });

    const chosenBox = room.slotToBox[p];

    if(role === "P1"){
      room.bombs.toP2Box = chosenBox;
      room.bombSet.P1 = true;
      pushLog(room, "P1が爆弾をセットした。");
    } else {
      room.bombs.toP1Box = chosenBox;
      room.bombSet.P2 = true;
      pushLog(room, "P2が爆弾をセットした。");
    }

    if(room.bombSet.P1 && room.bombSet.P2){
      room.phase = "PLAYING";
      pushLog(room, "両者の爆弾がセットされた。プレイ開始。");
    }

    emitRoom(room);
    cb && cb({ ok:true });
  });

  socket.on("play:pick", ({ roomCode, clientId, cardId, adj }, cb) => {
    console.log("[play:pick]", { roomCode, clientId, cardId, adj, socketId: socket.id });
    const room = rooms.get(roomCode);
    if(!room) return cb && cb({ ok:false, error:"ROOM_NOT_FOUND" });
    if(room.phase !== "PLAYING") return cb && cb({ ok:false, error:"BAD_PHASE" });
    if(!(room.bombSet.P1 && room.bombSet.P2)) return cb && cb({ ok:false, error:"BOMB_NOT_READY" });

    const role = room.rolesByClientId.get(clientId);
    if(role !== "P1" && role !== "P2") return cb && cb({ ok:false, error:"NOT_PLAYER" });

    const hand = role === "P1" ? room.hands.P1 : room.hands.P2;
    const idx = hand.indexOf(cardId);
    if(idx === -1) return cb && cb({ ok:false, error:"CARD_NOT_IN_HAND" });

    if(cardId === "SWAP_ADJ"){
      const ok = Array.isArray(adj) && adj.length===2 &&
        Number.isInteger(adj[0]) && Number.isInteger(adj[1]) &&
        Math.abs(adj[0]-adj[1])===1 &&
        adj[0]>=1 && adj[0]<=room.settings.N && adj[1]>=1 && adj[1]<=room.settings.N;
      if(!ok) return cb && cb({ ok:false, error:"BAD_ADJ" });
    }

    if(room.picks[role]) return cb && cb({ ok:false, error:"ALREADY_PICKED" });

    hand.splice(idx, 1);
    room.picks[role] = { cardId, adj: cardId==="SWAP_ADJ" ? adj : null };
    pushLog(room, `${role}がカードを確定：${CARD_DEFS[cardId]?.name || cardId}`);

    emitRoom(room);
    cb && cb({ ok:true });

    if(room.picks.P1 && room.picks.P2){
      resolveRound(room);
      emitRoom(room);
    }
  });

  socket.on("disconnect", () => {
    console.log("[socket] disconnected", socket.id);
    for(const room of rooms.values()){
      for(const [cid, sid] of room.socketsByClientId.entries()){
        if(sid === socket.id){
          cleanupClient(room, cid);
          emitRoom(room);
          break;
        }
      }
    }
  });
});

// ====== boot ======
server.listen(PORT, () => {
  console.log("Server listening on", PORT);
});
