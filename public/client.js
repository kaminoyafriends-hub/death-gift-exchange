(() => {
  const socket = io();

  // ===== clientId (復帰用) =====
  const LS_KEY = "dpg_clientId";
  let clientId = localStorage.getItem(LS_KEY);
  if(!clientId){
    clientId = crypto.randomUUID();
    localStorage.setItem(LS_KEY, clientId);
  }

  let roomCode = null;
  let room = null;
  let me = null;
  let selectedCardId = null;

  // 日本語名（公開表示用）
  const CARD_NAME = {
    SHIFT_P1: "シフト+1（パレード！）",
    SHIFT_M1: "シフト-1（逆パレード！）",
    SWAP_17:  "入れ替え 1↔N（端から端まで）",
    SWAP_26:  "入れ替え 2↔(N-1)（二列目チェンジ）",
    SWAP_35:  "入れ替え 3↔(N-2)（センター崩し）",
    SWAP_ADJ: "隣接入れ替え（席替え）",
    T_ACCEL:  "加速（煽れ）",
    T_DECEL:  "減速（引き延ばせ）",
    T_STOP:   "停止（間）"
  };
  function cardLabel(cardId){ return cardId ? (CARD_NAME[cardId] || cardId) : "—"; }

  // ===== DOM =====
  const $ = (id) => document.getElementById(id);

  const viewHome = $("viewHome");
  const btnCreate = $("btnCreate");
  const joinCode = $("joinCode");
  const joinAs = $("joinAs");
  const btnJoin = $("btnJoin");

  const viewRoom = $("viewRoom");
  const roomCodeEl = $("roomCode");
  const myRoleEl = $("myRole");
  const phaseEl = $("phase");
  const timerEl = $("timer");
  const roundEl = $("round");
  const firstPlayerEl = $("firstPlayer");
  const NEl = $("N");
  const ZEl = $("Z");
  const HEl = $("H");
  const logEl = $("log");
  const boardEl = $("board");
  const btnLeave = $("btnLeave");
  const btnDestroyRoom = $("btnDestroyRoom");
  const destroyHint = $("destroyHint");

  const panelSettings = $("panelSettings");
  const setN = $("setN");
  const setZ = $("setZ");
  const setH = $("setH");
  const setT0 = $("setT0");
  const setTmax = $("setTmax");
  const setSeed = $("setSeed");
  const btnApplySettings = $("btnApplySettings");

  const deckTotalEl = $("deckTotal");
  const deckTable = $("deckTable");
  const btnResetDefault = $("btnResetDefault");
  const btnConfirmSettings = $("btnConfirmSettings");

  const panelLobby = $("panelLobby");
  const participantsEl = $("participants");
  const spectatorsEl = $("spectators");
  const btnSwitchJoinAs = $("btnSwitchJoinAs");
  const btnStartGame = $("btnStartGame");

  const panelBomb = $("panelBomb");
  const bombPos = $("bombPos");
  const btnSetBomb = $("btnSetBomb");

  const panelPlay = $("panelPlay");
  const playHint = $("playHint");
  const handEl = $("hand");
  const adjWrap = $("adjWrap");
  const adjSel = $("adjSel");
  const btnPick = $("btnPick");
  const revealP1 = $("revealP1");
  const revealP2 = $("revealP2");

  const panelSpectator = $("panelSpectator");
  const revealP1s = $("revealP1s");
  const revealP2s = $("revealP2s");

  // ===== board render (N variable) =====
  let boardReadyN = null;

  function buildBoxIds(N){
    const ids = [];
    for(let i=0;i<N;i++) ids.push(String.fromCharCode("A".charCodeAt(0) + i));
    return ids;
  }

  function renderBoardForN(N, Z){
    if(boardReadyN === N) return;
    boardReadyN = N;

    boardEl.innerHTML = "";
    // slots
    for(let pos=1; pos<=N; pos++){
      const d = document.createElement("div");
      d.className = "slot";
      d.dataset.pos = String(pos);
      d.innerHTML = `
        <div style="font-weight:700">位置${pos}</div>
        <div class="muted"></div>
      `;
      boardEl.appendChild(d);
    }
    // tokens
    for(const boxId of buildBoxIds(N)){
      const token = document.createElement("div");
      token.className = "boxToken";
      token.dataset.box = boxId;
      token.innerHTML = `<div>${boxId}</div><div class="tokenSub">箱</div>`;
      boardEl.appendChild(token);
    }
  }

  function updateZoneStyles(N, Z){
    const z = Math.max(1, Math.min(Z, Math.floor(N/2)));
    for(let pos=1; pos<=N; pos++){
      const slot = boardEl.querySelector(`[data-pos="${pos}"]`);
      if(!slot) continue;
      slot.classList.remove("zone");
      const inP1 = pos <= z;
      const inP2 = pos > N - z;
      if(inP1 || inP2) slot.classList.add("zone");
      const m = slot.querySelector(".muted");
      if(m) m.textContent = inP1 ? "P1被弾" : (inP2 ? "P2被弾" : "");
    }
  }

  function layoutTokens(slotToBox, N, animate){
    if(!slotToBox) return;
    renderBoardForN(N, room?.settings?.Z || 2);
    updateZoneStyles(N, room?.settings?.Z || 2);

    const gap = 8;
    const boardRect = boardEl.getBoundingClientRect();
    const tokenW = (boardRect.width - gap*(N-1)) / N;
    const tokens = boardEl.querySelectorAll(".boxToken");
    tokens.forEach(t => { t.style.width = `${tokenW}px`; });

    if(animate) tokens.forEach(t => t.classList.add("moving"));

    for(let pos=1; pos<=N; pos++){
      const boxId = slotToBox[pos];
      const token = boardEl.querySelector(`.boxToken[data-box="${boxId}"]`);
      if(!token) continue;
      const x = (pos-1)*(tokenW+gap);
      token.style.transform = `translate(${x}px, 0px)`;
    }

    if(animate){
      setTimeout(() => tokens.forEach(t => t.classList.remove("moving")), 320);
    }
  }

  // ===== deck UI =====
  const DECK_KEYS = [
    ["SHIFT_P1","シフト+1"],
    ["SHIFT_M1","シフト-1"],
    ["SWAP_17","入替 1↔N"],
    ["SWAP_26","入替 2↔(N-1)"],
    ["SWAP_35","入替 3↔(N-2)"],
    ["SWAP_ADJ","隣接入替"],
    ["T_ACCEL","加速"],
    ["T_DECEL","減速"],
    ["T_STOP","停止"]
  ];

  function renderDeckSettings(){
    const cfg = room.deckConfig || {};
    const total = Object.values(cfg).reduce((a,b)=>a+(Number(b)||0),0);
    deckTotalEl.textContent = String(total);

    deckTable.innerHTML = `
      <tr><th>カード</th><th>枚数</th><th>操作</th></tr>
      ${DECK_KEYS.map(([id,label]) => `
        <tr>
          <td>${label}</td>
          <td style="width:70px; text-align:right"><b>${cfg[id] ?? 0}</b></td>
          <td style="width:160px">
            <button data-dec="${id}">-</button>
            <button data-inc="${id}">+</button>
          </td>
        </tr>
      `).join("")}
    `;
    deckTable.querySelectorAll("button[data-inc]").forEach(btn => btn.onclick = () => adjustDeck(btn.dataset.inc, +1));
    deckTable.querySelectorAll("button[data-dec]").forEach(btn => btn.onclick = () => adjustDeck(btn.dataset.dec, -1));
  }

  function adjustDeck(cardId, delta){
    const next = { ...room.deckConfig };
    next[cardId] = Math.max(0, (next[cardId] ?? 0) + delta);
    applyAllSettings({ deckConfig: next });
  }

  // ===== settings apply =====
  function fillSettingsInputs(){
    const s = room.settings || {};
    setN.value = s.N;
    setZ.value = s.Z;
    setH.value = s.H;
    setT0.value = s.T0;
    setTmax.value = s.Tmax;
    setSeed.value = s.seed || "";
  }

  function readSettingsInputs(){
    return {
      N: Number(setN.value),
      Z: Number(setZ.value),
      H: Number(setH.value),
      T0: Number(setT0.value),
      Tmax: Number(setTmax.value),
      seed: (setSeed.value || "").trim()
    };
  }

  function applyAllSettings({ settings, deckConfig }){
    socket.emit("settings:updateAll", {
      roomCode,
      clientId,
      settings: settings || (room ? room.settings : {}),
      deckConfig: deckConfig || (room ? room.deckConfig : {})
    }, (res) => {
      if(!res?.ok) alert("更新できません：" + res?.error);
    });
  }

  // ===== views =====
  function show(el){ el.classList.remove("hidden"); }
  function hide(el){ el.classList.add("hidden"); }

  function render(){
    if(!room){
      show(viewHome); hide(viewRoom);
      return;
    }
    hide(viewHome); show(viewRoom);

    roomCodeEl.textContent = room.code;
    myRoleEl.textContent = me?.role ?? "—";
    phaseEl.textContent = room.phase;
    timerEl.textContent = room.timerT;
    roundEl.textContent = room.round;
    firstPlayerEl.textContent = room.firstPlayer;

    const s = room.settings || {N:7,Z:2,H:3};
    NEl.textContent = s.N;
    ZEl.textContent = s.Z;
    HEl.textContent = s.H;

    logEl.textContent = (room.log || []).join("\n");
    layoutTokens(room.slotToBox, s.N, true);

    destroyHint.textContent = (me?.role === "HOST") ? "ホストのみ部屋削除できます（全員強制退出）。" : "部屋削除はホストのみ。";

    // panels
    hide(panelSettings);
    hide(panelLobby);
    hide(panelBomb);
    hide(panelPlay);
    hide(panelSpectator);

    // 公開カード表示
    const r1 = room.revealed?.P1?.cardId || null;
    const r2 = room.revealed?.P2?.cardId || null;
    revealP1.textContent = cardLabel(r1);
    revealP2.textContent = cardLabel(r2);
    revealP1s.textContent = cardLabel(r1);
    revealP2s.textContent = cardLabel(r2);

    const role = me?.role;

    if(room.phase === "SETTINGS"){
      if(role === "HOST"){
        show(panelSettings);
        fillSettingsInputs();
        renderDeckSettings();
      } else {
        show(panelLobby);
      }
    }

    if(room.phase === "LOBBY"){
      show(panelLobby);
      participantsEl.textContent = room.participants.length ? room.participants.length + "人" : "0人";
      spectatorsEl.textContent = room.spectators.length ? room.spectators.length + "人" : "0人";
      btnStartGame.disabled = (role !== "HOST");
    }

    if(room.phase === "BOMB"){
      if(role === "P1" || role === "P2"){
        show(panelBomb);
        renderBombSelect();
      } else {
        show(panelSpectator);
      }
    }

    if(room.phase === "PLAYING"){
      if(role === "P1" || role === "P2"){
        show(panelPlay);
        const ready = room.bombSet?.P1 && room.bombSet?.P2;
        if(!ready){
          playHint.textContent = "爆弾セット完了待ち…";
          handEl.innerHTML = `<div class="muted">爆弾セット完了待ち…</div>`;
          btnPick.disabled = true;
          adjWrap.classList.add("hidden");
        } else {
          playHint.textContent = `${s.H}枚から1枚を選んで確定。両者確定で自動解決。`;
          renderHand();
        }
      } else {
        show(panelSpectator);
      }
    }

    if(room.phase === "ENDED"){
      show(panelSpectator);
    }
  }

  function renderBombSelect(){
    const N = room.settings.N;
    bombPos.innerHTML = "";
    for(let i=1;i<=N;i++){
      const opt = document.createElement("option");
      opt.value = String(i);
      const box = room.slotToBox?.[i] || "?";
      opt.textContent = `位置${i}（箱${box}）`;
      bombPos.appendChild(opt);
    }
  }

  function renderAdjOptions(){
    const N = room.settings.N;
    adjSel.innerHTML = "";
    for(let i=1;i<=N-1;i++){
      const opt = document.createElement("option");
      opt.value = `${i}-${i+1}`;
      opt.textContent = `${i}↔${i+1}`;
      adjSel.appendChild(opt);
    }
  }

  function renderHand(){
    handEl.innerHTML = "";
    selectedCardId = null;
    btnPick.disabled = true;
    adjWrap.classList.add("hidden");
    renderAdjOptions();

    const hand = me?.hand;
    if(!hand){
      handEl.innerHTML = `<div class="muted">手札はありません（観戦者）</div>`;
      return;
    }
    if(hand.length !== room.settings.H){
      handEl.innerHTML = `<div class="muted">手札補充中…</div>`;
      return;
    }

    hand.forEach(c => {
      const d = document.createElement("div");
      d.style.border = "1px solid #ddd";
      d.style.borderRadius = "10px";
      d.style.padding = "10px";
      d.style.marginTop = "8px";
      d.style.cursor = "pointer";
      d.innerHTML = `<b>${c.name}</b><div class="muted">${c.text}</div>`;
      d.onclick = () => {
        [...handEl.children].forEach(ch => ch.style.outline = "");
        d.style.outline = "3px solid #111";
        selectedCardId = c.id;
        btnPick.disabled = false;
        if(c.id === "SWAP_ADJ") adjWrap.classList.remove("hidden");
        else adjWrap.classList.add("hidden");
      };
      handEl.appendChild(d);
    });
  }

  // ===== actions =====
  btnCreate.onclick = () => {
    socket.emit("room:create", { clientId });
  };

  btnJoin.onclick = () => {
    const code = joinCode.value.trim().toUpperCase();
    if(!code) return alert("部屋コードを入力してください");
    socket.emit("room:join", { roomCode: code, clientId, joinAs: joinAs.value }, (res) => {
      if(!res?.ok) return alert("参加できません：" + res?.error);
      roomCode = code;
      room = res.room;
      me = res.me;
      render();
    });
  };

  btnLeave.onclick = () => {
    if(!roomCode) return;
    socket.emit("room:leave", { roomCode, clientId });
    resetToHome();
  };

  btnDestroyRoom.onclick = () => {
    if(!roomCode) return;
    if(me?.role !== "HOST") return alert("部屋削除はホストのみです");
    if(!confirm("部屋を削除します。全員が強制退出し、この部屋コードは使えなくなります。よろしいですか？")) return;
    socket.emit("room:destroy", { roomCode, clientId }, (res) => {
      if(!res?.ok) alert("削除できません：" + res?.error);
    });
  };

  btnResetDefault.onclick = () => {
    socket.emit("settings:resetDefault", { roomCode, clientId }, (res) => {
      if(!res?.ok) alert("できません：" + res?.error);
    });
  };

  btnApplySettings.onclick = () => {
    applyAllSettings({ settings: readSettingsInputs(), deckConfig: room.deckConfig });
  };

  btnConfirmSettings.onclick = () => {
    socket.emit("settings:confirm", { roomCode, clientId }, (res) => {
      if(!res?.ok) alert("できません：" + res?.error);
    });
  };

  btnSwitchJoinAs.onclick = () => {
    const next = (me?.role === "SPECTATOR") ? "PARTICIPANT" : "SPECTATOR";
    socket.emit("lobby:setJoinAs", { roomCode, clientId, joinAs: next }, (res) => {
      if(!res?.ok) alert("切替できません：" + res?.error);
    });
  };

  btnStartGame.onclick = () => {
    socket.emit("game:start", { roomCode, clientId }, (res) => {
      if(!res?.ok) alert("開始できません：" + res?.error);
    });
  };

  btnSetBomb.onclick = () => {
    const pos = Number(bombPos.value);
    socket.emit("bomb:set", { roomCode, clientId, pos }, (res) => {
      if(!res?.ok) alert("セットできません：" + res?.error);
    });
  };

  btnPick.onclick = () => {
    if(!selectedCardId) return;
    let adj = null;
    if(selectedCardId === "SWAP_ADJ"){
      const [a,b] = adjSel.value.split("-").map(Number);
      adj = [a,b];
    }
    socket.emit("play:pick", { roomCode, clientId, cardId: selectedCardId, adj }, (res) => {
      if(!res?.ok) alert("確定できません：" + res?.error);
    });
  };

  // ===== socket events =====

  // ★修正：作成後は必ず room:join を呼んで確実に遷移させる
  socket.on("room:created", ({ code }) => {
    roomCode = code;
    joinCode.value = code;

    socket.emit("room:join", { roomCode: code, clientId, joinAs: "PARTICIPANT" }, (res) => {
      if(!res?.ok) return alert("参加できません：" + res?.error);
      room = res.room;
      me = res.me;
      render();
    });
  });

  socket.on("room:update", (data) => {
    // ★roomCode未設定でも取りこぼさない（保険）
    if(!roomCode) roomCode = data.code;
    if(data.code !== roomCode) return;
    room = data;
    render();
  });

  socket.on("room:me", (data) => {
    me = data;
    render();
  });

  socket.on("room:destroyed", ({ roomCode: destroyedCode, reason }) => {
    if(roomCode !== destroyedCode) return;
    alert("部屋が削除されました（" + reason + "）。HOMEに戻ります。");
    resetToHome();
  });

  function resetToHome(){
    roomCode = null;
    room = null;
    me = null;
    selectedCardId = null;
    boardReadyN = null;
    render();
  }

  // init
  render();
})();
