bplist00�_WebMainResource�	
_WebResourceData_WebResourceMIMEType_WebResourceFrameName^WebResourceURL_WebResourceTextEncodingNameOo�<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2487.5">
  <style type="text/css">
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica}
    p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica; min-height: 14.0px}
  </style>
</head>
<body>
<p class="p1">const express = require("express");</p>
<p class="p1">const http = require("http");</p>
<p class="p1">const { Server } = require("socket.io");</p>
<p class="p2"><br></p>
<p class="p1">const app = express();</p>
<p class="p1">const server = http.createServer(app);</p>
<p class="p1">const io = new Server(server);</p>
<p class="p2"><br></p>
<p class="p1">app.use(express.static("public"));</p>
<p class="p1">const PORT = process.env.PORT || 3000;</p>
<p class="p2"><br></p>
<p class="p1">// ====== defaults ======</p>
<p class="p1">const DEFAULT_DECK_CONFIG = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>SHIFT_P1: 9,</p>
<p class="p1"><span class="Apple-converted-space">  </span>SHIFT_M1: 9,</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_17: 3,</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_26: 3,</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_35: 3,</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_ADJ: 7,</p>
<p class="p1"><span class="Apple-converted-space">  </span>T_ACCEL: 2,</p>
<p class="p1"><span class="Apple-converted-space">  </span>T_DECEL: 2,</p>
<p class="p1"><span class="Apple-converted-space">  </span>T_STOP: 2</p>
<p class="p1">};</p>
<p class="p2"><br></p>
<p class="p1">// playtest settings defaults</p>
<p class="p1">const DEFAULT_SETTINGS = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>N: 7,<span class="Apple-converted-space">          </span>// board size 5..12</p>
<p class="p1"><span class="Apple-converted-space">  </span>Z: 2,<span class="Apple-converted-space">          </span>// hazard width 1..5 (clipped by floor(N/2))</p>
<p class="p1"><span class="Apple-converted-space">  </span>H: 3,<span class="Apple-converted-space">          </span>// hand size 1..5</p>
<p class="p1"><span class="Apple-converted-space">  </span>T0: 10,<span class="Apple-converted-space">        </span>// timer start</p>
<p class="p1"><span class="Apple-converted-space">  </span>Tmax: 12,<span class="Apple-converted-space">      </span>// timer max</p>
<p class="p1"><span class="Apple-converted-space">  </span>wrap: true,<span class="Apple-converted-space">    </span>// movement wrap (kept true; not exposed in UI currently)</p>
<p class="p1"><span class="Apple-converted-space">  </span>seed: "" <span class="Apple-converted-space">      </span>// string; empty =&gt; random</p>
<p class="p1">};</p>
<p class="p2"><br></p>
<p class="p1">const CARD_DEFS = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>SHIFT_P1: { id:"SHIFT_P1", name:"シフト+1（パレード！）", type:"shift", val:+1, text:"全ての箱を+1" },</p>
<p class="p1"><span class="Apple-converted-space">  </span>SHIFT_M1: { id:"SHIFT_M1", name:"シフト-1（逆パレード！）", type:"shift", val:-1, text:"全ての箱を-1" },</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>// fixed-edge swaps become dynamic based on N at resolve time</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_17: { id:"SWAP_17", name:"入れ替え 1↔N（端から端まで）", type:"swap", kind:"edge", k:1, text:"位置1とNの箱を入れ替える" },</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_26: { id:"SWAP_26", name:"入れ替え 2↔(N-1)（二列目チェンジ）", type:"swap", kind:"edge", k:2, text:"位置2とN-1の箱を入れ替える" },</p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_35: { id:"SWAP_35", name:"入れ替え 3↔(N-2)（センター崩し）", type:"swap", kind:"edge", k:3, text:"位置3とN-2の箱を入れ替える" },</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>SWAP_ADJ:{ id:"SWAP_ADJ", name:"隣接入れ替え（席替え）", type:"swap", kind:"adj", text:"隣接2位置を指定して箱を入れ替える" },</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>T_ACCEL:{ id:"T_ACCEL", name:"加速（煽れ）", type:"timer", tdelta:-1, text:"タイマー段でT-1" },</p>
<p class="p1"><span class="Apple-converted-space">  </span>T_DECEL:{ id:"T_DECEL", name:"減速（引き延ばせ）", type:"timer", tdelta:+1, text:"タイマー段でT+1" },</p>
<p class="p1"><span class="Apple-converted-space">  </span>T_STOP: { id:"T_STOP",<span class="Apple-converted-space">  </span>name:"停止（間）", type:"timer", stop:true,<span class="Apple-converted-space">  </span>text:"このラウンドの通常T-1を行わない" }</p>
<p class="p1">};</p>
<p class="p2"><br></p>
<p class="p1">function clone(obj){ return JSON.parse(JSON.stringify(obj)); }</p>
<p class="p2"><br></p>
<p class="p1">function hashStringToUint32(str){</p>
<p class="p1"><span class="Apple-converted-space">  </span>// FNV-1a</p>
<p class="p1"><span class="Apple-converted-space">  </span>let h = 2166136261 &gt;&gt;&gt; 0;</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(let i=0;i&lt;str.length;i++){</p>
<p class="p1"><span class="Apple-converted-space">    </span>h ^= str.charCodeAt(i);</p>
<p class="p1"><span class="Apple-converted-space">    </span>h = Math.imul(h, 16777619);</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>return h &gt;&gt;&gt; 0;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function mulberry32(seed){</p>
<p class="p1"><span class="Apple-converted-space">  </span>let a = seed &gt;&gt;&gt; 0;</p>
<p class="p1"><span class="Apple-converted-space">  </span>return function() {</p>
<p class="p1"><span class="Apple-converted-space">    </span>a |= 0; a = (a + 0x6D2B79F5) | 0;</p>
<p class="p1"><span class="Apple-converted-space">    </span>let t = Math.imul(a ^ (a &gt;&gt;&gt; 15), 1 | a);</p>
<p class="p1"><span class="Apple-converted-space">    </span>t = (t + Math.imul(t ^ (t &gt;&gt;&gt; 7), 61 | t)) ^ t;</p>
<p class="p1"><span class="Apple-converted-space">    </span>return ((t ^ (t &gt;&gt;&gt; 14)) &gt;&gt;&gt; 0) / 4294967296;</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function makeRng(seedStr){</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(!seedStr) return Math.random;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const seed = hashStringToUint32(seedStr);</p>
<p class="p1"><span class="Apple-converted-space">  </span>return mulberry32(seed);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function shuffle(arr, rng=Math.random){</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(let i=arr.length-1;i&gt;0;i--){</p>
<p class="p1"><span class="Apple-converted-space">    </span>const j = Math.floor(rng()*(i+1));</p>
<p class="p1"><span class="Apple-converted-space">    </span>[arr[i],arr[j]]=[arr[j],arr[i]];</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>return arr;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function genRoomCode(){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";</p>
<p class="p1"><span class="Apple-converted-space">  </span>let s = "";</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(let i=0;i&lt;6;i++) s += chars[Math.floor(Math.random()*chars.length)];</p>
<p class="p1"><span class="Apple-converted-space">  </span>return s;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function now(){ return Date.now(); }</p>
<p class="p2"><br></p>
<p class="p1">// ====== settings helpers ======</p>
<p class="p1">function clampInt(v, min, max, fallback){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const n = Number(v);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(!Number.isFinite(n)) return fallback;</p>
<p class="p1"><span class="Apple-converted-space">  </span>return Math.max(min, Math.min(max, Math.floor(n)));</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function normalizeSettings(input){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const s = { ...DEFAULT_SETTINGS, ...(input || {}) };</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>s.N = clampInt(s.N, 5, 12, DEFAULT_SETTINGS.N);</p>
<p class="p1"><span class="Apple-converted-space">  </span>const maxZByN = Math.max(1, Math.floor(s.N / 2));</p>
<p class="p1"><span class="Apple-converted-space">  </span>s.Z = clampInt(s.Z, 1, Math.min(5, maxZByN), DEFAULT_SETTINGS.Z);</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>s.H = clampInt(s.H, 1, 5, DEFAULT_SETTINGS.H);</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>s.T0 = clampInt(s.T0, 1, 50, DEFAULT_SETTINGS.T0);</p>
<p class="p1"><span class="Apple-converted-space">  </span>s.Tmax = clampInt(s.Tmax, 1, 99, DEFAULT_SETTINGS.Tmax);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(s.Tmax &lt; s.T0) s.Tmax = s.T0;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>s.seed = (s.seed ?? "").toString();</p>
<p class="p1"><span class="Apple-converted-space">  </span>s.wrap = true; // keep true for this game (not exposed)</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>return s;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function buildInitialSlotToBox(N){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const slotToBox = {};</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(let i=1;i&lt;=N;i++){</p>
<p class="p1"><span class="Apple-converted-space">    </span>// A.. (N up to 12 -&gt; A..L)</p>
<p class="p1"><span class="Apple-converted-space">    </span>slotToBox[i] = String.fromCharCode("A".charCodeAt(0) + (i-1));</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>return slotToBox;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function boxAt(room, pos){</p>
<p class="p1"><span class="Apple-converted-space">  </span>return room.slotToBox[pos];</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function applyShift(room, delta){</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(delta===0) return;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const N = room.settings.N;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const newMap = {};</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(let pos=1; pos&lt;=N; pos++){</p>
<p class="p1"><span class="Apple-converted-space">    </span>const fromPos = wrapPos(pos, -delta, N);</p>
<p class="p1"><span class="Apple-converted-space">    </span>newMap[pos] = room.slotToBox[fromPos];</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.slotToBox = newMap;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function wrapPos(pos, delta, N){</p>
<p class="p1"><span class="Apple-converted-space">  </span>// wrap always true in this build</p>
<p class="p1"><span class="Apple-converted-space">  </span>let x = ((pos - 1 + delta) % N + N) % N;</p>
<p class="p1"><span class="Apple-converted-space">  </span>return x + 1;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function applySwap(room, a, b){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const tmp = room.slotToBox[a];</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.slotToBox[a] = room.slotToBox[b];</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.slotToBox[b] = tmp;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function computeEdgeSwap(cardId, N){</p>
<p class="p1"><span class="Apple-converted-space">  </span>// SWAP_17: k=1 =&gt; (1, N)</p>
<p class="p1"><span class="Apple-converted-space">  </span>// SWAP_26: k=2 =&gt; (2, N-1)</p>
<p class="p1"><span class="Apple-converted-space">  </span>// SWAP_35: k=3 =&gt; (3, N-2)</p>
<p class="p1"><span class="Apple-converted-space">  </span>const def = CARD_DEFS[cardId];</p>
<p class="p1"><span class="Apple-converted-space">  </span>const k = def.k;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const a = k;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const b = N - (k - 1);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(a &lt; 1 || b &gt; N) return null;</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(a &gt;= b) return null; // invalid (same or crossing)</p>
<p class="p1"><span class="Apple-converted-space">  </span>return [a,b];</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function buildDeckFromConfig(deckConfig, settings, room){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const rng = makeRng(settings.seed);</p>
<p class="p1"><span class="Apple-converted-space">  </span>const deck = [];</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>// include only valid cards; edge swaps may become invalid for small N</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(const [cardId, countRaw] of Object.entries(deckConfig)){</p>
<p class="p1"><span class="Apple-converted-space">    </span>const count = Math.max(0, Math.floor(Number(countRaw) || 0));</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(count === 0) continue;</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(!CARD_DEFS[cardId]) continue;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>if(cardId === "SWAP_35"){</p>
<p class="p1"><span class="Apple-converted-space">      </span>const pair = computeEdgeSwap("SWAP_35", settings.N);</p>
<p class="p1"><span class="Apple-converted-space">      </span>if(!pair){</p>
<p class="p1"><span class="Apple-converted-space">        </span>if(room) pushLog(room, `設定N=${settings.N}では「入れ替え 3↔(N-2)」が成立しないため除外した。`);</p>
<p class="p1"><span class="Apple-converted-space">        </span>continue;</p>
<p class="p1"><span class="Apple-converted-space">      </span>}</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>for(let i=0;i&lt;count;i++) deck.push(cardId);</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>return shuffle(deck, rng);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function pushLog(room, line){</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.log.unshift(line);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(room.log.length &gt; 400) room.log.length = 400;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">// ====== room management ======</p>
<p class="p1">/**</p>
<p class="p1">room = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>code, hostClientId,</p>
<p class="p1"><span class="Apple-converted-space">  </span>phase: SETTINGS|LOBBY|BOMB|PLAYING|ENDED,</p>
<p class="p1"><span class="Apple-converted-space">  </span>settings: {N,Z,H,T0,Tmax,seed,wrap},</p>
<p class="p1"><span class="Apple-converted-space">  </span>deckConfig,</p>
<p class="p1"><span class="Apple-converted-space">  </span>deck, discard,</p>
<p class="p1"><span class="Apple-converted-space">  </span>hands:{P1:[cardId],P2:[cardId]},</p>
<p class="p1"><span class="Apple-converted-space">  </span>slotToBox:{1:"A"...},</p>
<p class="p1"><span class="Apple-converted-space">  </span>bombs:{toP1Box,toP2Box},</p>
<p class="p1"><span class="Apple-converted-space">  </span>bombSet:{P1,P2},</p>
<p class="p1"><span class="Apple-converted-space">  </span>picks:{P1:null|{cardId,adj},P2:null|...},</p>
<p class="p1"><span class="Apple-converted-space">  </span>timerT, round, firstPlayer,</p>
<p class="p1"><span class="Apple-converted-space">  </span>participants:Set, spectators:Set,</p>
<p class="p1"><span class="Apple-converted-space">  </span>rolesByClientId:Map, socketsByClientId:Map, lastSeenByClientId:Map,</p>
<p class="p1"><span class="Apple-converted-space">  </span>log:[]</p>
<p class="p1">}</p>
<p class="p1">*/</p>
<p class="p1">const rooms = new Map();</p>
<p class="p2"><br></p>
<p class="p1">function createRoom(hostClientId){</p>
<p class="p1"><span class="Apple-converted-space">  </span>let code;</p>
<p class="p1"><span class="Apple-converted-space">  </span>do { code = genRoomCode(); } while(rooms.has(code));</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const room = {</p>
<p class="p1"><span class="Apple-converted-space">    </span>code,</p>
<p class="p1"><span class="Apple-converted-space">    </span>hostClientId,</p>
<p class="p1"><span class="Apple-converted-space">    </span>phase: "SETTINGS",</p>
<p class="p1"><span class="Apple-converted-space">    </span>settings: normalizeSettings(DEFAULT_SETTINGS),</p>
<p class="p1"><span class="Apple-converted-space">    </span>deckConfig: clone(DEFAULT_DECK_CONFIG),</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>deck: [],</p>
<p class="p1"><span class="Apple-converted-space">    </span>discard: [],</p>
<p class="p1"><span class="Apple-converted-space">    </span>hands: { P1: [], P2: [] },</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>slotToBox: buildInitialSlotToBox(DEFAULT_SETTINGS.N),</p>
<p class="p1"><span class="Apple-converted-space">    </span>bombs: { toP1Box: null, toP2Box: null },</p>
<p class="p1"><span class="Apple-converted-space">    </span>bombSet: { P1:false, P2:false },</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>picks: { P1:null, P2:null },</p>
<p class="p1"><span class="Apple-converted-space">    </span>timerT: DEFAULT_SETTINGS.T0,</p>
<p class="p1"><span class="Apple-converted-space">    </span>round: 0,</p>
<p class="p1"><span class="Apple-converted-space">    </span>firstPlayer: "P1",</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>participants: new Set(),</p>
<p class="p1"><span class="Apple-converted-space">    </span>spectators: new Set(),</p>
<p class="p1"><span class="Apple-converted-space">    </span>rolesByClientId: new Map(),</p>
<p class="p1"><span class="Apple-converted-space">    </span>socketsByClientId: new Map(),</p>
<p class="p1"><span class="Apple-converted-space">    </span>lastSeenByClientId: new Map(),</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>log: []</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>room.rolesByClientId.set(hostClientId, "HOST");</p>
<p class="p1"><span class="Apple-converted-space">  </span>rooms.set(code, room);</p>
<p class="p1"><span class="Apple-converted-space">  </span>return room;</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function roomPublicState(room){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const totalDeckCount = Object.values(room.deckConfig).reduce((a,b)=&gt;a+b,0);</p>
<p class="p1"><span class="Apple-converted-space">  </span>return {</p>
<p class="p1"><span class="Apple-converted-space">    </span>code: room.code,</p>
<p class="p1"><span class="Apple-converted-space">    </span>phase: room.phase,</p>
<p class="p1"><span class="Apple-converted-space">    </span>hostClientId: room.hostClientId,</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>settings: room.settings,</p>
<p class="p1"><span class="Apple-converted-space">    </span>deckConfig: room.deckConfig,</p>
<p class="p1"><span class="Apple-converted-space">    </span>deckTotal: totalDeckCount,</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>slotToBox: room.slotToBox,</p>
<p class="p1"><span class="Apple-converted-space">    </span>timerT: room.timerT,</p>
<p class="p1"><span class="Apple-converted-space">    </span>round: room.round,</p>
<p class="p1"><span class="Apple-converted-space">    </span>firstPlayer: room.firstPlayer,</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>bombSet: room.bombSet,</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>revealed: {</p>
<p class="p1"><span class="Apple-converted-space">      </span>P1: room.picks.P1 ? { cardId: room.picks.P1.cardId, adj: room.picks.P1.adj || null } : null,</p>
<p class="p1"><span class="Apple-converted-space">      </span>P2: room.picks.P2 ? { cardId: room.picks.P2.cardId, adj: room.picks.P2.adj || null } : null,</p>
<p class="p1"><span class="Apple-converted-space">    </span>},</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>participants: [...room.participants],</p>
<p class="p1"><span class="Apple-converted-space">    </span>spectators: [...room.spectators],</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>log: room.log.slice(-200)</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function personalState(room, clientId){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const role = room.rolesByClientId.get(clientId) || "UNKNOWN";</p>
<p class="p1"><span class="Apple-converted-space">  </span>const isP1 = role === "P1";</p>
<p class="p1"><span class="Apple-converted-space">  </span>const isP2 = role === "P2";</p>
<p class="p1"><span class="Apple-converted-space">  </span>return {</p>
<p class="p1"><span class="Apple-converted-space">    </span>role,</p>
<p class="p1"><span class="Apple-converted-space">    </span>hand: isP1 ? room.hands.P1.map(id =&gt; CARD_DEFS[id]) :</p>
<p class="p1"><span class="Apple-converted-space">          </span>isP2 ? room.hands.P2.map(id =&gt; CARD_DEFS[id]) : null,</p>
<p class="p1"><span class="Apple-converted-space">    </span>myBombBox: isP1 ? room.bombs.toP2Box :</p>
<p class="p1"><span class="Apple-converted-space">               </span>isP2 ? room.bombs.toP1Box : null,</p>
<p class="p1"><span class="Apple-converted-space">    </span>myBombSet: isP1 ? room.bombSet.P1 :</p>
<p class="p1"><span class="Apple-converted-space">               </span>isP2 ? room.bombSet.P2 : null</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function emitRoom(room){</p>
<p class="p1"><span class="Apple-converted-space">  </span>io.to(room.code).emit("room:update", roomPublicState(room));</p>
<p class="p1"><span class="Apple-converted-space">  </span>for(const [cid, sid] of room.socketsByClientId.entries()){</p>
<p class="p1"><span class="Apple-converted-space">    </span>io.to(sid).emit("room:me", personalState(room, cid));</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function drawOne(room){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const rng = makeRng(room.settings.seed);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(room.deck.length === 0){</p>
<p class="p1"><span class="Apple-converted-space">    </span>room.deck = shuffle(room.discard, rng);</p>
<p class="p1"><span class="Apple-converted-space">    </span>room.discard = [];</p>
<p class="p1"><span class="Apple-converted-space">    </span>pushLog(room, "— 山札が尽きたため、捨て札をシャッフルして山札にした。");</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>return room.deck.pop();</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function replenishHands(room){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const H = room.settings.H;</p>
<p class="p1"><span class="Apple-converted-space">  </span>while(room.hands.P1.length &lt; H) room.hands.P1.push(drawOne(room));</p>
<p class="p1"><span class="Apple-converted-space">  </span>while(room.hands.P2.length &lt; H) room.hands.P2.push(drawOne(room));</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">// ====== join/leave ======</p>
<p class="p1">function joinRoom(socket, { roomCode, clientId, joinAs }){</p>
<p class="p1"><span class="Apple-converted-space">  </span>const room = rooms.get(roomCode);</p>
<p class="p1"><span class="Apple-converted-space">  </span>if(!room) return { ok:false, error:"ROOM_NOT_FOUND" };</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>socket.join(room.code);</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.socketsByClientId.set(clientId, socket.id);</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.lastSeenByClientId.set(clientId, now());</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const existing = room.rolesByClientId.get(clientId);</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>if(existing){</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(existing === "PARTICIPANT") room.participants.add(clientId);</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(existing === "SPECTATOR") room.spectators.add(clientId);</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(existing === "P1" || existing === "P2" || existing === "HOST"){</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.participants.add(clientId);</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.spectators.delete(clientId);</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>} else {</p>
<p class="p1"><span class="Apple-converted-space">    </span>if(joinAs === "SPECTATOR"){</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.rolesByClientId.set(clientId, "SPECTATOR");</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.spectators.add(clientId);</p>
<p class="p1"><span class="Apple-converted-space">    </span>} else {</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.rolesByClientId.set(clientId, "PARTICIPANT");</p>
<p class="p1"><span class="Apple-converted-space">      </span>room.participants.add(clientId);</p>
<p class="p1"><span class="Apple-converted-space">    </span>}</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>emitRoom(room);</p>
<p class="p1"><span class="Apple-converted-space">  </span>return { ok:true, room: roomPublicState(room), me: personalState(room, clientId) };</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function cleanupClient(room, clientId){</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.socketsByClientId.delete(clientId);</p>
<p class="p1"><span class="Apple-converted-space">  </span>room.lastSeenByClientId.set(clientId, n</p>
</body>
</html>
Ytext/htmlP_file:///index.htmlUutf-8    ( : P g v �pDpNpOpd                           pj