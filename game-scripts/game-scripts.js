IFRAME = (()=>{
    let t, o = !0;
    try {
        o = window.self !== window.top
    } catch (t) {}
    const postMessage = o=>{
        t || (t = logger({
            context: "IFRAME",
            color: "red"
        })),
        t(o),
        window.parent.postMessage(o, "*")
    }
    ;
    return {
        within: o,
        close: ()=>postMessage({
            close: !0
        }),
        craft: t=>postMessage({
            craft: t
        })
    }
}
)();
const SESSION_STORAGE = {
    get: t=>{
        try {
            return sessionStorage.getItem(t)
        } catch (t) {
            return
        }
    }
    ,
    set: (t,e)=>{
        try {
            return sessionStorage.setItem(t, e)
        } catch (t) {
            return
        }
    }
    ,
    remove: t=>{
        try {
            return sessionStorage.removeItem(t)
        } catch (t) {
            return
        }
    }
}
  , LOCAL_STORAGE = {
    get: t=>{
        try {
            return localStorage.getItem(t)
        } catch (t) {
            return
        }
    }
    ,
    set: (t,e)=>{
        try {
            return localStorage.setItem(t, e)
        } catch (t) {
            return
        }
    }
    ,
    remove: t=>{
        try {
            return localStorage.removeItem(t)
        } catch (t) {
            return
        }
    }
}
  , sessionId = Array.from(crypto.getRandomValues(new Uint8Array(24))).map((t=>t.toString(16).padStart(2, "0"))).join("");
let token;
location.hash ? (token = location.hash.substring(1),
IFRAME.within || (history.replaceState({}, "", `${location.origin}${location.pathname}${location.search}`),
SESSION_STORAGE.set("townstar:api:token", token || null))) : token = SESSION_STORAGE.get("townstar:api:token");
let TEMP_USER = !1;
res = (t=>{
    try {
        return JSON.parse(atob(t.split(".")[1]))
    } catch (t) {
        return null
    }
}
)(token),
TEMP_USER = !(!res || "temporary" != res.role);
const baseUri = LOCAL_STORAGE.get("townstar:api:baseUri") || ("launch.playcanvas.com" === location.host ? "https://dev-townstar.sandbox-games.com/api" : "/api")
  , query = "?" === location.search[0] && location.search.substring(1).split("=").reduce(((t,e,a,r)=>(a % 2 == 0 && (t[r[a]] = r[a + 1]),
t)), {})
  , SERVER_CONFIG = {
    sessionId: sessionId,
    baseUri: baseUri,
    token: token,
    gameId: LOCAL_STORAGE.get("townstar:api:gameId") || query && query.gameId || "default",
    msgpack: "false" !== LOCAL_STORAGE.get("townstar:api:msgpack")
};
function debugPromptChooseGameId() {
    return API.getGames().then((t=>{
        const e = prompt(`Valid games:\n    ${t.map((t=>t.gameId)).join("\n    ")}`);
        if (e) {
            t.find((t=>t.gameId === e)) ? LOCAL_STORAGE.set("townstar:api:gameId", e) : alert(`Couldn't find game ${e}`)
        }
    }
    ))
}
function debugPromptChooseBaseUri() {
    const t = prompt("Override base URI for API (default: https://dev-townstar.sandbox-games.com/api)", API.baseUri);
    t && LOCAL_STORAGE.set("townstar:api:baseUri", t)
}
function showGalaToken() {
    prompt("Your current Gala token", SESSION_STORAGE.get("townstar:api:token"))
}
function toggleMsgpack() {
    LOCAL_STORAGE.set("townstar:api:msgpack", !(!LOCAL_STORAGE.get("townstar:api:msgpack") || "true" === LOCAL_STORAGE.get("townstar:api:msgpack")))
}
const Logging = (()=>{
    const e = -1 !== document.location.search.indexOf("debug");
    function storageKey(e) {
        return `townstar:logging:${e}`
    }
    function loadList(e) {
        return (LOCAL_STORAGE.get(storageKey(e)) || "").split(",").map((e=>e.trim())).filter((e=>e)).reduce(((e,t)=>(e[t] = !0,
        e)), {})
    }
    return {
        Enabled: "false" !== LOCAL_STORAGE.get(storageKey("enabled")) && e,
        WhiteList: loadList("whitelist"),
        BlackList: loadList("blacklist"),
        configureList: e=>{
            const t = storageKey(e)
              , o = LOCAL_STORAGE.get(t) || "";
            let n = `Update logging ${e}, available contexts:\n`;
            n += contexts.map((e=>`    ${e}`)).join("\n");
            const r = prompt(n, o);
            null !== r && (LOCAL_STORAGE.set(t, r),
            Logging.WhiteList = loadList("whitelist"),
            Logging.BlackList = loadList("blacklist"))
        }
        ,
        toggle: e=>{
            const t = storageKey("enabled");
            void 0 === e ? (result = prompt("Enable logging (true/false)?", "false" !== LOCAL_STORAGE.get(t)),
            null !== result ? LOCAL_STORAGE.set(t, result) : LOCAL_STORAGE.remove(t)) : LOCAL_STORAGE.set(t, !!e),
            Logging.Enabled = "false" !== LOCAL_STORAGE.get(storageKey("enabled"))
        }
    }
}
)()
  , logger = (()=>{
    let e = 0
      , t = Date.now();
    const o = [];
    return n=>{
        (n = "string" == typeof n ? {
            context: n
        } : n || {}).context && (-1 === o.indexOf(n.context) && o.push(n.context),
        e = Math.max(n.context.length, e));
        const serverLogger = e=>(...t)=>{
            API.serverLog(n.context, e, t)
        }
          , logger = o=>(...r)=>{
            if (!Logging.Enabled)
                return;
            if (Logging.BlackList[n.context] && !Logging.WhiteList[n.context])
                return;
            let g = [""];
            !1 !== n.timing && (g[0] = ((Date.now() - t) / 1e3).toFixed(3) + " "),
            n.context && (g[0] += `[${n.context.padEnd(e)}] `),
            n.color && (g[0] = `%c${g[0]}`,
            g.push(`color: ${n.color}`)),
            r.length && ("string" == typeof r[0] ? (g[0] += r[0],
            g = g.concat(r.splice(1))) : g = g.concat(r)),
            console[o](...g)
        }
          , r = logger("log");
        return Object.assign(r, {
            warn: logger("warn"),
            error: logger("error"),
            debug: logger("debug"),
            info: logger("info"),
            server: {
                warn: serverLogger("warn"),
                error: serverLogger("error"),
                debug: serverLogger("debug"),
                info: serverLogger("info")
            }
        }),
        r
    }
}
)();
(()=>{
    logger("Logging")("Logging configured", Logging);
    const errorToObject = e=>{
        const t = Object.getOwnPropertyNames(e).reduce(((t,o)=>(t[o] = e[o],
        t)), {});
        return t.stack && (t.stack = t.stack.split("\n").slice(0, 5).join("\n")),
        t
    }
    ;
    window.addEventListener("error", (e=>{
        e.error && API.serverLog("window", "error", [errorToObject(e.error)])
    }
    )),
    pc.Application.getApplication().systems.script.on("add", ((e,t)=>{
        t instanceof pc.ScriptComponent && t.scripts.forEach((e=>{
            const t = e.__scriptType.__name
              , o = t.charAt(0).toUpperCase() + t.slice(1)
              , n = {
                context: o
            };
            e.__scriptType.logger && Object.assign(n, e.__scriptType.logger),
            e.on("error", ((e,t)=>{
                console.error(e),
                API.serverLog(o, "error", [t, errorToObject(e)])
            }
            )),
            e.log = logger(n)
        }
        ))
    }
    ))
}
)();
var PhaseManager = pc.createScript("phaseManager");
PhaseManager.prototype.initialize = function() {
    this.app.on("PhaseChanged", ((a,e)=>this.log(e, " -> ", a))),
    this.app.on("RealtimeGameState", (a=>{
        this.log("RealtimeGameState", a),
        "end" === a && this.change(PhaseManager.GameOverPhase)
    }
    )),
    PhaseManager.instance = this
}
,
PhaseManager.prototype.change = function(a) {
    const e = this.phase;
    e !== a && (this.phase = a,
    this.app.fire("PhaseChanged", this.phase, e))
}
,
PhaseManager.prototype.onPhaseChanged = function(a, e) {
    PhaseManager.onEnter(a, e)
}
,
PhaseManager.onEnter = function(a, e) {
    pc.app.on("PhaseChanged", ((n,h)=>{
        n === a && e(n, h)
    }
    ))
}
,
PhaseManager.onExit = function(a, e) {
    pc.app.on("PhaseChanged", ((n,h)=>{
        h === a && e(n, h)
    }
    ))
}
,
PhaseManager.logger = {
    color: "purple"
},
PhaseManager.InitPhase = "Init",
PhaseManager.GameOverPhase = "GameOver",
PhaseManager.WorldInitPhase = "WorldInit",
PhaseManager.TownLoadPhase = "TownLoad",
PhaseManager.PlayingPhase = "Playing";
pc.EventHandler.prototype.onceAny = function(n, o) {
    function callback2() {
        o.apply(this, arguments),
        n.forEach((n=>{
            console.log("turning off", n),
            this.off(n, callback2)
        }
        ))
    }
    n.forEach((n=>{
        console.log("turning on", n),
        this.off(n, callback2),
        this.on(n, callback2)
    }
    ))
}
,
pc.EventHandler.prototype.offAll = function(n, o) {
    function callback2() {
        o.apply(this, arguments),
        n.forEach((n=>{
            console.log("turning off", n),
            this.off(n, callback2)
        }
        ))
    }
    n.forEach((n=>{
        console.log("turning off", n),
        this.off(n, callback2)
    }
    ))
}
,
TS_OnCheckEvents = {},
pc.EventHandler.prototype.onCheck = function(n, o) {
    console.log("doing on check"),
    n in TS_OnCheckEvents ? console.log("skipping") : (this.on(n, o),
    TS_OnCheckEvents[n] = o)
}
,
pc.EventHandler.prototype.offCheck = function(n, o) {
    console.log("doing off check"),
    TS_OnCheckEvents[n] = o,
    n in TS_OnCheckEvents ? (delete TS_OnCheckEvents[n],
    this.off(n, o)) : console.log("skipping off check")
}
,
pc.EventHandler.prototype.onAndNow = function(n, o) {
    return o(),
    this.on(n, o)
}
,
pc.EventHandler.prototype.ever = function(n, o) {
    const e = this.__everHistory = this.__everHistory || {};
    e[n] && o.apply(this, e[n]),
    this.on(n, (function() {
        e[n] = arguments,
        o.apply(this, arguments)
    }
    ))
}
,
pc.EventHandler.prototype.onNew = function(n, o, e) {
    this.on(n, callback2)
}
,
pc.EventHandler.prototype.subscribe = function(n, o, e) {
    return this.on(n, o, e),
    function() {
        this.off(n, o, e)
    }
}
,
pc.EventHandler.prototype.onceToPromise = function(n, o) {
    return new Promise(((e,c)=>{
        this.once(n, (n=>{
            e(n)
        }
        ), o)
    }
    ))
}
,
pc.app.scenes.loadSceneHierarchyAsync = function(n) {
    return new Promise(((o,e)=>{
        pc.app.scenes.loadSceneHierarchy(n, ((n,c)=>{
            n ? e(n) : o(c)
        }
        ))
    }
    ))
}
,
pc.app.scenes.loadAllScenesAsync = function(n, o) {
    return n.reduce(((n,e)=>n.then((()=>pc.app.scenes.loadSceneHierarchyAsync(e).then((n=>o(n)))))), Promise.resolve())
}
,
Math.clamp = function(n, o, e) {
    return Math.max(o, Math.min(n, e))
}
;
var Stylesheet = pc.createScript("stylesheet");
Stylesheet.attributes.add("css", {
    type: "asset",
    assetType: "css",
    array: !0
}),
Stylesheet.prototype.initialize = function() {
    this.css.forEach((e=>{
        const t = document.createElement("style");
        document.head.appendChild(t);
        let s = "";
        const update = ()=>{
            e.resource !== s && (this.log("updating style asset", e.file.filename),
            t.innerHTML = s = e.resource)
        }
        ;
        update(),
        e.on("change", update)
    }
    ))
}
,
Stylesheet.logger = {
    color: "firebrick"
};
class TS_UIBase extends pc.EventHandler {
    constructor(e) {
        if (super(),
        this._VerifyConfig) {
            if (e.html ? this.htmlAsset = e.html : this.htmlAsset = Game.app.assets.find(e.name),
            !this.htmlAsset)
                throw new Error(`Could not find html: ${e.name}`);
            this.html = this.htmlAsset,
            this.html.on("change", this._OnResourceUpdate, this),
            this._CreateDiv(e.divClass),
            void 0 !== e.fullScreenUI ? this.fullScreenUI = e.fullScreenUI : this.fullScreenUI = !1,
            this.isOpen = !1,
            this.Initialize(),
            Game.app.on("InternetConnectionLost", this.OnInternetConnectionLost, this)
        }
    }
    OpenUI() {
        !0 !== this.isOpen && (this.fullScreenUI && this._DisableHUD(),
        this.div.style.display = "flex",
        this.isOpen = !0,
        this.OnOpen(),
        this.fire("Opened"))
    }
    CloseUI() {
        !1 !== this.isOpen && (this.fullScreenUI && this._EnableHUD(),
        this.div.style.display = "none",
        this.isOpen = !1,
        this.OnClose(),
        this.fire("Closed"))
    }
    ReloadUI() {
        this.div.innerHTML = this.html.resource,
        this.OnReload(),
        this.fire("Loaded"),
        console.log("loaded")
    }
    UpdateImageAssets() {
        UiTools.updateImageAssets(this.div)
    }
    TranslateTextAssets() {
        UiTools.translateTextAssets(this.div)
    }
    UpdateImagesAndTranslate() {
        this.UpdateImageAssets(),
        this.TranslateTextAssets()
    }
    _VerifyConfig(e) {
        return UIBaseConfigObject ? UIBaseConfigObject.html ? !!UIBaseConfigObject.divClass || (console.error("Config Verification Failed : No divClass"),
        !1) : (console.error("Config Verification Failed : No HTML Resource"),
        !1) : (console.error("Config Verification Failed : No Config Object"),
        !1)
    }
    _CreateDiv(e) {
        this.div = document.createElement("div"),
        this.div.classList.add(e),
        document.body.appendChild(this.div),
        this.div.innerHTML = this.html.resource,
        this.div.style.display = "none",
        this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
        this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
        this.div.addEventListener("wheel", (e=>e.stopPropagation()), {
            passive: !0
        })
    }
    _EnableHUD() {
        Game.app.fire("hud-enable"),
        Game.app.fire("objectmenu-enable"),
        Game.app.fire("object-float-enable")
    }
    _DisableHUD() {
        Game.app.fire("hud-disable"),
        Game.app.fire("objectmenu-disable"),
        Game.app.fire("object-float-disable")
    }
    _OnResourceUpdate() {
        this.ReloadUI(),
        this.Initialize()
    }
    Initialize() {}
    OnOpen() {}
    OnClose() {}
    OnReload() {}
    OnInternetConnectionLost() {}
}
Settings = (()=>{
    const e = "townstar:settingsId";
    let t = LOCAL_STORAGE.get(e);
    t || (t = Array.from(crypto.getRandomValues(new Uint8Array(12))).map((e=>e.toString(16).padStart(2, "0"))).join(""),
    LOCAL_STORAGE.set(e, t),
    t = LOCAL_STORAGE.get(e));
    const n = `settings-${t || "blocked"}`
      , o = {}
      , save = ()=>{
        n && API.setUserData(n, o)
    }
    ;
    return class extends pc.EventHandler {
        constructor() {
            super(),
            this.log = logger({
                context: "Settings",
                color: "Green",
                timing: !0
            });
            const defineSetting = (e,t,n=(()=>!0))=>{
                Object.defineProperty(this, e, {
                    get: ()=>{
                        const n = o[e];
                        return null != n ? n : "function" == typeof t ? t() : t
                    }
                    ,
                    set: t=>{
                        const s = o[e];
                        n(t) && (o[e] = t,
                        this.log("set", e, s, "->", t),
                        this.fire(e, t, s),
                        save())
                    }
                })
            }
            ;
            defineSetting("language", (()=>navigator.language.split("-")[0]), (e=>["en", "ja", "ko", "zn-Hans", "es-LA", "pt", "ru", "tr", "vi", "fr", "no"].indexOf(e) > -1)),
            defineSetting("resolutionLevel", "HI", (e=>["HI", "MED", "LOW"].indexOf(e) > -1)),
            defineSetting("showShadows", !0, (e=>"boolean" == typeof e)),
            defineSetting("antiAliasing", !1, (e=>"boolean" == typeof e)),
            defineSetting("showFps", !1, (e=>"boolean" == typeof e)),
            defineSetting("musicEnabled", !0, (e=>"boolean" == typeof e)),
            defineSetting("soundEffectsEnabled", !0, (e=>"boolean" == typeof e)),
            defineSetting("statusOverlay", !1, (e=>"boolean" == typeof e)),
            defineSetting("showSnow", !0, (e=>"boolean" == typeof e))
        }
        load() {
            return API.getUserData(n).then((e=>{
                if (e)
                    Object.assign(o, e);
                else {
                    const getStoredSetting = (e,t)=>{
                        const n = `townstar:${e}`
                          , o = LOCAL_STORAGE.get(n);
                        return null !== o ? (LOCAL_STORAGE.remove(n),
                        t(o)) : void 0
                    }
                    ;
                    o.showFps = getStoredSetting("showFps", (e=>"ON" === e)),
                    o.showShadows = getStoredSetting("showShadows", (e=>"ON" === e)),
                    o.antiAliasing = getStoredSetting("antiAliasing", (e=>"ON" === e)),
                    o.resolutionLevel = getStoredSetting("resolutionLevel", (e=>e)),
                    o.language = getStoredSetting("language", (e=>e)),
                    o.soundEffectsEnabled = getStoredSetting("soundEffectsEnabled", (e=>"true" === e)),
                    o.musicEnabled = getStoredSetting("musicEnabled", (e=>"true" === e)),
                    o.statusOverlay = getStoredSetting("statusOverlay", (e=>"true" === e)),
                    save()
                }
                Object.keys(o).forEach((e=>this.fire(e, o[e])))
            }
            ))
        }
        onAndNow(e, t) {
            return t(e, this[e]),
            this.on(e, t)
        }
    }
}
)();
var SETTINGS = new Settings;
(()=>{
    const e = logger({
        context: "vue-app",
        color: "green"
    })
      , t = {}
      , n = {}
      , addScript = t=>{
        (Array.isArray(t.vue) ? t.vue : [t.vue]).forEach((r=>{
            const o = r.name || t.__name
              , register = ()=>{
                e("Registering component", o),
                Vue.component(o, Object.assign({}, r)),
                n[o] = t
            }
            ;
            if (r.html) {
                const e = pc.app.assets.find(r.html, "html");
                e && (e.on("change", ((t,n)=>{
                    "resource" === n && (r.template = e.resource,
                    register(),
                    swapVms())
                }
                )),
                r.template = e.resource)
            }
            register()
        }
        ))
    }
      , swapVms = ()=>{
        for (let[r,o] of Object.entries(n)) {
            (Array.isArray(o.vue) ? o.vue : [o.vue]).forEach((n=>{
                if (n.name && (r = n.name),
                n.vm) {
                    const n = t[r];
                    n && (e("Destroying VM", r),
                    n.$destroy(),
                    n.$el.remove());
                    const c = document.createElement("div");
                    document.body.appendChild(c),
                    e("Creating VM", r),
                    t[r] = new Vue({
                        el: c,
                        render: e=>e(Vue.component(r))
                    }),
                    o.vm = t[r].$children[0]
                }
            }
            ))
        }
    }
      , r = pc.createScript;
    pc.createScript = function(e) {
        const t = r.apply(this, arguments);
        return e.startsWith("v-") && (t.prototype.swap = function(e) {}
        ),
        n[e] && setTimeout((()=>{
            addScript(t),
            swapVms()
        }
        ), 0),
        t
    }
    ,
    PhaseManager.onExit(PhaseManager.InitPhase, (()=>{
        for (const e of pc.app.scripts.list())
            e.vue && addScript(e);
        swapVms()
    }
    ))
}
)();
var CameraController = pc.createScript("cameraController");
CameraController.attributes.add("targetTag", {
    type: "string",
    title: "Tap Target Tag",
    description: "Tag of the plane for touch events"
}),
CameraController.attributes.add("targetTappedEvent", {
    type: "string",
    title: "Tap Target Event",
    description: "Event to fire when Target Plane is tapped"
}),
CameraController.attributes.add("targetStartPosition", {
    type: "vec3",
    default: [0, 0, 0],
    title: "Look Target Start Position",
    description: "Start position of the camera's look target"
}),
CameraController.attributes.add("canZoom", {
    type: "boolean",
    default: !0,
    title: "Can Zoom",
    description: "Whether or not this camera is able to zoom"
}),
CameraController.attributes.add("minZoom", {
    type: "number",
    default: -5,
    title: "Minimum Zoom",
    description: "Minimum Zoom Level For the camera"
}),
CameraController.attributes.add("maxZoom", {
    type: "number",
    default: 2,
    title: "Maximum Zoom",
    description: "Maximum Zoom Level For the camera"
}),
CameraController.attributes.add("zoomIntensity", {
    type: "number",
    default: 5,
    title: "Zoom Intensity",
    description: "Distance of each zoom level"
}),
CameraController.attributes.add("touchZoomMultiplier", {
    type: "number",
    default: 1.5,
    title: "Touch Zoom Multiplier",
    description: "Multiplier to modify sensitivity of pinch zoom"
}),
CameraController.attributes.add("cameraZoomSpeed", {
    type: "number",
    default: 8,
    title: "Camera Zoom Speed",
    description: "How quickly the camera lerps to a new zoom level"
}),
CameraController.attributes.add("scaleMoveWithZoom", {
    type: "boolean",
    default: !0,
    title: "Scale Movement With Zoom Level",
    description: "Whether or not movement intensity scales with zoom level"
}),
CameraController.attributes.add("invertZoomScale", {
    type: "boolean",
    default: !1,
    title: "Invert Zoom Scale",
    description: "Inverts the movement scale with zoom. If Inverted, camera movement is increased at close zoom and decreased at far zoom (only applies if Scale Movement With Zoom is TRUE)"
}),
CameraController.attributes.add("zoomScaleFactor", {
    type: "number",
    default: 1.25,
    min: 1,
    title: "Zoom Scale Factor",
    description: "How much the zoom level affects the camera movemement (only applies if Scale Movement With Zoom is TRUE)"
}),
CameraController.attributes.add("verticalMoveIntensity", {
    type: "number",
    default: 5,
    title: "Vertical Movement Intensity",
    description: "How much the look target moves with vertical touch / mouse movements"
}),
CameraController.attributes.add("horizontalMoveIntensity", {
    type: "number",
    default: 2.9,
    title: "Horizontal Movement Intensity",
    description: "How much the look target moves with horizontal touch / mouse movements"
}),
CameraController.attributes.add("touchMoveMultiplier", {
    type: "number",
    default: 1,
    title: "Touch Move Multiplier",
    description: "Multiplier to modify sensitivity of touch movements"
}),
CameraController.attributes.add("cameraMoveSpeed", {
    type: "number",
    default: 6,
    title: "Camera Move Speed",
    description: "How quickly the camera lerps to new position"
}),
CameraController.attributes.add("clampPositionToBounds", {
    type: "boolean",
    default: !1,
    title: "Clamp Camera Position",
    description: "Whether or not the Camera is clamped to boundaries"
}),
CameraController.attributes.add("minX", {
    type: "number",
    default: -15,
    title: "Min X",
    description: "The Minimum X position for the camera look target. (only applies if Clamp Camera Position is TRUE)"
}),
CameraController.attributes.add("maxX", {
    type: "number",
    default: 15,
    title: "Max X",
    description: "The Maximum X position for the camera look target. (only applies if Clamp Camera Position is TRUE)"
}),
CameraController.attributes.add("minZ", {
    type: "number",
    default: -15,
    title: "Min Z",
    description: "The Minimum Z position for the camera look target. (only applies if Clamp Camera Position is TRUE)"
}),
CameraController.attributes.add("maxZ", {
    type: "number",
    default: 15,
    title: "Max Z",
    description: "The Maximum Z position for the camera look target. (only applies if Clamp Camera Position is TRUE)"
}),
CameraController.attributes.add("canRotate", {
    type: "boolean",
    default: !0,
    title: "Can Rotate",
    description: "Whether or not this camera is able to rotate"
}),
CameraController.attributes.add("rotationIntensity", {
    type: "number",
    default: 25,
    title: "Rotation Intensity",
    description: "How much the look target rotates with touch / mouse movements"
}),
CameraController.attributes.add("cameraRotateSpeed", {
    type: "number",
    default: 10,
    title: "Camera Rotation Speed",
    description: "How quickly the camera lerps to new rotation"
}),
CameraController.prototype.initialize = function() {
    this.lookTarget = new pc.Entity,
    this.app.root.addChild(this.lookTarget),
    this.lookTarget.setPosition(this.targetStartPosition),
    this.lookTarget.setEulerAngles(0, 0, 0),
    this.entity.lookAt(this.lookTarget.getLocalPosition()),
    this.entity.reparent(this.lookTarget),
    this.posTarget = new pc.Entity,
    this.app.root.addChild(this.posTarget),
    this.posTarget.setPosition(this.lookTarget.getPosition()),
    this.posTarget.setRotation(this.lookTarget.getRotation()),
    this.zoomTarget = new pc.Entity,
    this.zoomTarget.setLocalPosition(this.entity.getLocalPosition()),
    this.zoomTarget.setLocalRotation(this.entity.getLocalRotation()),
    this.zoomLevel = 0,
    this.targetPosition = this.lookTarget.getPosition(),
    this.targetRotation = this.lookTarget.getEulerAngles(),
    this.app.mouse.disableContextMenu(),
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.OnMouseDown, this),
    this.app.mouse.on(pc.EVENT_MOUSEUP, this.OnMouseUp, this),
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.OnMouseMove, this),
    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.OnMouseScroll, this),
    document.addEventListener ? document.addEventListener("mouseout", this.OnMouseExit.bind(this), !1) : document.attachEvent && document.attachEvent("onmouseout", this.OnMouseExit.bind(this)),
    this.preAngle = 0,
    this.rotateAngle = 0,
    this.currentAngle = 0,
    this.prevAngle = 0,
    this.prevPinchScale = 1,
    this.pinching = !1,
    this.rotDelta = 0,
    this.rotating = !1;
    var t = new Hammer(document.querySelector("#application-canvas"));
    t.get("pinch").set({
        enable: !0
    }),
    t.get("pan").set({
        direction: Hammer.DIRECTION_ALL
    }),
    t.on("pinchmove", this.OnPinchMove.bind(this)),
    t.on("pinchend", this.OnPinchEnd.bind(this)),
    t.on("tap", this.OnTap.bind(this)),
    t.on("panstart", this.OnPanStart.bind(this)),
    t.on("panend", this.OnPanEnd.bind(this)),
    t.on("panmove", this.OnPanMove.bind(this)),
    this.isMoving = !1,
    this.isRotating = !1,
    this.entity.on("SetPosition", this.SetPosition.bind(this))
}
,
CameraController.prototype.SetPosition = function(t, e) {
    this.targetPosition = new pc.Vec3(t,this.posTarget.getPosition().y,e);
    let i = this.targetPosition.x
      , o = this.targetPosition.z;
    if (this.clampPositionToBounds) {
        let t = Math.min(Math.max(i, this.minX), this.maxX)
          , e = Math.min(Math.max(o, this.minZ), this.maxZ);
        this.targetPosition.x = t,
        this.targetPosition.z = e
    }
    this.posTarget.setPosition(this.targetPosition),
    this.lookTarget.setPosition(this.targetPosition)
}
,
CameraController.prototype.Move = function(t) {
    if (!this.entity.enabled)
        return;
    let e = 1;
    if (this.scaleMoveWithZoom) {
        let t = (this.zoomLevel - this.minZoom) / (this.maxZoom - this.minZoom);
        e = this.invertZoomScale ? this.zoomScaleFactor - this.zoomScaleFactor * Math.abs(t - 1) + 1 : this.zoomScaleFactor - this.zoomScaleFactor * t + 1
    }
    this.targetPosition = new pc.Vec3(this.posTarget.getPosition().x + this.entity.forward.x * (t.y * this.verticalMoveIntensity) * -1 * e + this.entity.right.x * (t.x * this.horizontalMoveIntensity) * e,this.posTarget.getPosition().y,this.posTarget.getPosition().z + this.entity.forward.z * (t.y * this.verticalMoveIntensity) * -1 * e + this.entity.right.z * (t.x * this.horizontalMoveIntensity) * e);
    let i = this.targetPosition.x
      , o = this.targetPosition.z;
    if (this.clampPositionToBounds) {
        let t = Math.min(Math.max(i, this.minX), this.maxX)
          , e = Math.min(Math.max(o, this.minZ), this.maxZ);
        this.targetPosition.x = t,
        this.targetPosition.z = e
    }
    this.posTarget.setPosition(this.targetPosition)
}
,
CameraController.prototype.Zoom = function(t, e) {
    e && (t *= this.touchZoomMultiplier),
    this.entity.enabled && this.canZoom && (t = Math.min(Math.max(t, -1), 1),
    e && (t *= this.touchZoomMultiplier),
    t = Math.min(Math.max(t, -1), 1),
    this.zoomLevel + t > this.maxZoom || this.zoomLevel + t < this.minZoom || (this.zoomLevel += t,
    this.zoomTarget.setPosition(this.zoomTarget.getPosition().x + this.zoomTarget.forward.x * t * this.zoomIntensity, this.zoomTarget.getPosition().y + this.zoomTarget.forward.y * t * this.zoomIntensity, this.zoomTarget.getPosition().z + this.zoomTarget.forward.z * t * this.zoomIntensity)))
}
,
CameraController.prototype.Rotate = function(t) {
    if (!this.entity.enabled)
        return;
    if (!this.canRotate)
        return;
    this.posTarget.rotate(0, t * this.rotationIntensity * 20, 0);
    let e = this.posTarget.getEulerAngles().y
      , i = this.lookTarget.getEulerAngles().y;
    if (Math.abs(e - i) > 90) {
        let t = this.posTarget.getEulerAngles();
        this.posTarget.setEulerAngles(t.x, i, t.x)
    }
    this.rotDelta = 0
}
,
CameraController.prototype.Tap = function(t) {
    if (!this.entity.enabled)
        return;
    if (Game.FullUI)
        return;
    let e = this.entity.getPosition()
      , i = this.entity.camera.screenToWorld(t.x, t.y, this.entity.camera.farClip)
      , o = this.app.systems.rigidbody.raycastFirst(e, i);
    o && (o.entity.fire("tapped"),
    o.entity.tags.has(this.targetTag) && (this.app.keyboard.isPressed(pc.KEY_CONTROL) && this.app.fire("DebugTownTapped", o),
    this.app.fire(this.targetTappedEvent, o)))
}
,
CameraController.prototype.OnMouseDown = function(t) {
    t.button == pc.MOUSEBUTTON_LEFT ? (this.isMoving = !0,
    this.isRotating = !1,
    this.startX = t.x,
    this.startY = t.y,
    this.lastX = t.x,
    this.lastY = t.y,
    this.delta = new pc.Vec2(0,0)) : t.button == pc.MOUSEBUTTON_RIGHT && (this.app.fire("object-float-disable"),
    this.isMoving = !1,
    this.isRotating = !0,
    this.rotStartX = t.x,
    this.rotDelta = 0)
}
,
CameraController.prototype.OnMouseUp = function(t) {
    if (this.isMoving && t.button == pc.MOUSEBUTTON_LEFT && t.x == this.startX && t.y == this.startY) {
        let e = new pc.Vec2(t.x,t.y);
        this.Tap(e)
    }
    this.isRotating = !1,
    this.isMoving = !1
}
,
CameraController.prototype.OnMouseMove = function(t) {
    if (this.isMoving) {
        this.app.graphicsDevice.width,
        this.app.graphicsDevice.height;
        let e = new pc.Vec2(0,0);
        e.x = this.lastX - t.x,
        e.y = this.lastY - t.y,
        e.x /= 100,
        e.y /= 100,
        this.lastX = t.x,
        this.lastY = t.y,
        this.Move(e)
    }
    if (this.isRotating) {
        let e = this.app.graphicsDevice.width;
        this.rotDelta = this.rotStartX - t.x,
        this.rotDelta /= e,
        this.rotStartX = t.x,
        this.rotDelta && this.Rotate(this.rotDelta)
    }
}
,
CameraController.prototype.OnMouseScroll = function(t) {
    this.Zoom(t.wheel)
}
,
CameraController.prototype.OnMouseExit = function(t) {
    this.isMoving = !1
}
,
CameraController.prototype.OnPinchMove = function(t) {
    if ("touch" === event.pointerType)
        if (0 === this.preAngle)
            this.preAngle = Math.round(t.rotation),
            this.prevAngle = 0,
            this.prevPinchScale = 1,
            this.rotDelta = 0,
            this.rotating = !1,
            this.pinching = !1;
        else {
            this.currentAngle = this.rotateAngle + Math.round(t.rotation) - this.preAngle;
            let e = (this.prevAngle - this.currentAngle) / 250 * -1;
            this.prevAngle = this.rotateAngle + t.rotation - this.preAngle,
            this.rotDelta += e,
            this.pinching || this.rotating || (Math.abs(1 - t.scale) > .15 ? this.pinching = !0 : Math.abs(this.rotDelta) >= .025 && (this.rotating = !0)),
            this.rotating && this.Rotate(e),
            this.pinching && (this.Zoom(-1 * (this.prevPinchScale - t.scale) * 5, !0),
            this.prevPinchScale = t.scale)
        }
}
,
CameraController.prototype.OnPinchEnd = function(t) {
    "touch" === event.pointerType && (this.preAngle = 0,
    this.prevPinchScale = 1,
    this.rotDelta = 0,
    this.rotateAngle = 0,
    this.currentAngle = 0,
    this.prevAngle = 0)
}
,
CameraController.prototype.OnTap = function(t) {
    "touch" === event.pointerType && this.Tap(new pc.Vec2(t.center.x,t.center.y))
}
,
CameraController.prototype.OnPanStart = function(t) {
    "touch" === event.pointerType && (this.rotating || this.pinching || (this.isMoving = !0),
    this.hasMoved = !1,
    this.startX = 0,
    this.startY = 0,
    this.lastX = 0,
    this.lastY = 0)
}
,
CameraController.prototype.OnPanEnd = function(t) {
    "touch" === event.pointerType && (this.rotating = !1,
    this.pinching = !1,
    this.isMoving = !1,
    this.preAngle = 0,
    this.rotateAngle = 0,
    this.currentAngle = 0,
    this.prevAngle = 0,
    this.lastX = 0,
    this.lastY = 0)
}
,
CameraController.prototype.OnPanMove = function(t) {
    if ("touch" !== event.pointerType)
        return;
    if (!this.isMoving)
        return;
    this.hasMoved || (this.lastX = t.deltaX,
    this.lastY = t.deltaY,
    this.hasMoved = !0);
    this.app.graphicsDevice.width,
    this.app.graphicsDevice.height;
    this.Move(new pc.Vec2(-(t.deltaX - this.lastX) / 100 * this.touchMoveMultiplier,-(t.deltaY - this.lastY) / 100 * this.touchMoveMultiplier)),
    this.lastX = t.deltaX,
    this.lastY = t.deltaY
}
,
CameraController.prototype.update = function(t) {
    if (!this.entity.enabled)
        return;
    let e = (new pc.Vec3).lerp(this.lookTarget.getPosition(), this.posTarget.getPosition(), this.cameraMoveSpeed * t);
    this.lookTarget.setPosition(e);
    let i = (new pc.Vec3).lerp(this.entity.getLocalPosition(), this.zoomTarget.getPosition(), this.cameraZoomSpeed * t);
    this.entity.setLocalPosition(i),
    this.zoomTarget.setLocalRotation(this.entity.getLocalRotation());
    let o = (new pc.Quat).slerp(this.lookTarget.getRotation(), this.posTarget.getRotation(), this.cameraRotateSpeed * t);
    this.lookTarget.setRotation(o),
    this.entity.lookAt(this.lookTarget.getLocalPosition())
}
;
function MapHelper() {}
MapHelper.tileData = [],
MapHelper.WorldPositionToMapPosition = function(e) {
    var o = this.WorldPositionToMapIndex(e);
    return this.GetTileTypeFromWorldPosition(e),
    new pc.Vec3(12.75 * o.x,0,12.75 * o.y)
}
,
MapHelper.WorldPositionToMapIndex = function(e) {
    return new pc.Vec2(parseInt(Math.round(e.x / 12.75)),parseInt(Math.round(e.z / 12.75)))
}
,
MapHelper.GetTileTypeFromWorldPosition = function(e) {
    return this.GetTileTypeFromMapIndex(this.WorldPositionToMapIndex(e))
}
,
MapHelper.GetTileTypeFromMapIndex = function(e) {}
,
MapHelper.GetTilePositionFromWorldPosition = function(e, o, n, t) {
    var r = new pc.Vec3(0,e.y,0);
    return r.x = Math.round((e.x - o) / t) * t + o,
    r.z = Math.round((e.z - n) / t) * t + n,
    r
}
;
var SelectionSquare = pc.createScript("selectionSquare");
SelectionSquare.attributes.add("UpdateEvent", {
    type: "string",
    default: "WorldTapped",
    title: "Update Location Event"
}),
SelectionSquare.attributes.add("TileSize", {
    type: "number",
    default: 1,
    title: "TileSize"
}),
SelectionSquare.attributes.add("MapXOffset", {
    type: "number",
    default: -500,
    title: "Map X Offset"
}),
SelectionSquare.attributes.add("MapZOffset", {
    type: "number",
    default: 0,
    title: "Map Z Offset"
}),
SelectionSquare.prototype.initialize = function() {
    this.app.on(this.UpdateEvent, this.UpdateLocation.bind(this)),
    this.entity.enabled = !1
}
,
SelectionSquare.prototype.UpdateLocation = function(t) {
    if (!UiWatcher.State.Intro_NameInput) {
        var e = MapHelper.GetTilePositionFromWorldPosition(t.point, this.MapXOffset, this.MapZOffset, this.TileSize);
        this.entity.setPosition(e.x, this.entity.getPosition().y, e.z),
        this.entity.enabled || (this.entity.enabled = !0)
    }
}
;
var SpawnObjectFromFile = pc.createScript("spawnObjectFromFile");
SpawnObjectFromFile.attributes.add("mapSize", {
    type: "number",
    default: 16
}),
SpawnObjectFromFile.attributes.add("objectSize", {
    type: "number",
    default: 5
}),
SpawnObjectFromFile.attributes.add("fileToLoad", {
    type: "asset",
    assetType: "text"
});
var prefabDictionary = {};
SpawnObjectFromFile.attributes.add("sceneId", {
    type: "string",
    default: "815375",
    title: "Prefab Scene ID"
}),
SpawnObjectFromFile.prototype.loadScene = function(e, t) {
    var n = e + ".json";
    console.log(`%c SOURCE OF WEIRD PROBLEM HAS BEEN FOUND : ${parent.children[i].name}`, "color: green; font-weight: bold"),
    this.app.loadSceneHierarchy(n, (function(e, i) {
        if (!e)
            return t(i),
            i;
        console.error(e)
    }
    ))
}
,
SpawnObjectFromFile.prototype.initialize = function() {
    this.loadScene(this.sceneId, this.loadCallback.bind(this))
}
,
SpawnObjectFromFile.prototype.loadCallback = function(e) {
    for (console.log("Object Scene Loaded"),
    console.log(`%c SOURCE OF WEIRD PROBLEM HAS BEEN FOUND : ${e.children[i].name}`, "color: green; font-weight: bold"),
    i = 0; i < e.children.length; i++)
        e.children[i].tags.has("DontImport") || (prefabDictionary[e.children[i].name] = e.children[i]),
        e.children[i].enabled = !1;
    this.spawnObjects()
}
,
SpawnObjectFromFile.prototype.spawnObjects = function() {
    var e = new pc.Entity;
    this.app.root.addChild(e),
    e.setPosition(0, 0, 0),
    e.name = "ObjectParent",
    e.enabled = !0;
    var t = this.fileToLoad.resource.replace(/(\r\n|\n|\r)/gm, "").split(",")
      , n = [];
    for (i = 0; i < t.length; i++)
        n.push(t[i].split(":"));
    for (i = 0; i < n.length; i++)
        "Grass" == n[i][0] && (n[i][0] = "Ground_P_" + Math.ceil(5 * Math.random()));
    for (i = 0; i < this.mapSize * this.mapSize; i++) {
        var o = this.spawnObject(n[i][0], i % this.mapSize * this.objectSize, 0, Math.floor(i / this.mapSize) * this.objectSize, e)
          , a = o.getLocalEulerAngles();
        o.setLocalEulerAngles(a.x, 90 * n[i][1], a.z)
    }
}
,
SpawnObjectFromFile.prototype.spawnObject = function(e, t, i, n, o) {
    if (e in prefabDictionary) {
        var a = prefabDictionary[e].clone();
        return o.addChild(a),
        a.setPosition(t, i, n),
        a.enabled = !0,
        a
    }
    console.log("Can not find entity for " + e)
}
;
// pathfinding-browser.min.js
!function(t) {
    if ("object" == typeof exports)
        module.exports = t();
    else if ("function" == typeof define && define.amd)
        define(t);
    else {
        var e;
        "undefined" != typeof window ? e = window : "undefined" != typeof global ? e = global : "undefined" != typeof self && (e = self),
        e.PF = t()
    }
}(function() {
    return function t(e, i, n) {
        function o(a, s) {
            if (!i[a]) {
                if (!e[a]) {
                    var l = "function" == typeof require && require;
                    if (!s && l)
                        return l(a, !0);
                    if (r)
                        return r(a, !0);
                    throw new Error("Cannot find module '" + a + "'")
                }
                var h = i[a] = {
                    exports: {}
                };
                e[a][0].call(h.exports, function(t) {
                    var i = e[a][1][t];
                    return o(i ? i : t)
                }, h, h.exports, t, e, i, n)
            }
            return i[a].exports
        }
        for (var r = "function" == typeof require && require, a = 0; a < n.length; a++)
            o(n[a]);
        return o
    }({
        1: [function(t, e, i) {
            e.exports = t("./lib/heap")
        }
        , {
            "./lib/heap": 2
        }],
        2: [function(t, e, i) {
            (function() {
                var t, i, n, o, r, a, s, l, h, u, p, c, f, d, g;
                n = Math.floor,
                u = Math.min,
                i = function(t, e) {
                    return e > t ? -1 : t > e ? 1 : 0
                }
                ,
                h = function(t, e, o, r, a) {
                    var s;
                    if (null == o && (o = 0),
                    null == a && (a = i),
                    0 > o)
                        throw new Error("lo must be non-negative");
                    for (null == r && (r = t.length); r > o; )
                        s = n((o + r) / 2),
                        a(e, t[s]) < 0 ? r = s : o = s + 1;
                    return [].splice.apply(t, [o, o - o].concat(e)),
                    e
                }
                ,
                a = function(t, e, n) {
                    return null == n && (n = i),
                    t.push(e),
                    d(t, 0, t.length - 1, n)
                }
                ,
                r = function(t, e) {
                    var n, o;
                    return null == e && (e = i),
                    n = t.pop(),
                    t.length ? (o = t[0],
                    t[0] = n,
                    g(t, 0, e)) : o = n,
                    o
                }
                ,
                l = function(t, e, n) {
                    var o;
                    return null == n && (n = i),
                    o = t[0],
                    t[0] = e,
                    g(t, 0, n),
                    o
                }
                ,
                s = function(t, e, n) {
                    var o;
                    return null == n && (n = i),
                    t.length && n(t[0], e) < 0 && (o = [t[0], e],
                    e = o[0],
                    t[0] = o[1],
                    g(t, 0, n)),
                    e
                }
                ,
                o = function(t, e) {
                    var o, r, a, s, l, h;
                    for (null == e && (e = i),
                    s = function() {
                        h = [];
                        for (var e = 0, i = n(t.length / 2); i >= 0 ? i > e : e > i; i >= 0 ? e++ : e--)
                            h.push(e);
                        return h
                    }
                    .apply(this).reverse(),
                    l = [],
                    r = 0,
                    a = s.length; a > r; r++)
                        o = s[r],
                        l.push(g(t, o, e));
                    return l
                }
                ,
                f = function(t, e, n) {
                    var o;
                    return null == n && (n = i),
                    o = t.indexOf(e),
                    -1 !== o ? (d(t, 0, o, n),
                    g(t, o, n)) : void 0
                }
                ,
                p = function(t, e, n) {
                    var r, a, l, h, u;
                    if (null == n && (n = i),
                    a = t.slice(0, e),
                    !a.length)
                        return a;
                    for (o(a, n),
                    u = t.slice(e),
                    l = 0,
                    h = u.length; h > l; l++)
                        r = u[l],
                        s(a, r, n);
                    return a.sort(n).reverse()
                }
                ,
                c = function(t, e, n) {
                    var a, s, l, p, c, f, d, g, b, v;
                    if (null == n && (n = i),
                    10 * e <= t.length) {
                        if (p = t.slice(0, e).sort(n),
                        !p.length)
                            return p;
                        for (l = p[p.length - 1],
                        g = t.slice(e),
                        c = 0,
                        d = g.length; d > c; c++)
                            a = g[c],
                            n(a, l) < 0 && (h(p, a, 0, null, n),
                            p.pop(),
                            l = p[p.length - 1]);
                        return p
                    }
                    for (o(t, n),
                    v = [],
                    s = f = 0,
                    b = u(e, t.length); b >= 0 ? b > f : f > b; s = b >= 0 ? ++f : --f)
                        v.push(r(t, n));
                    return v
                }
                ,
                d = function(t, e, n, o) {
                    var r, a, s;
                    for (null == o && (o = i),
                    r = t[n]; n > e && (s = n - 1 >> 1,
                    a = t[s],
                    o(r, a) < 0); )
                        t[n] = a,
                        n = s;
                    return t[n] = r
                }
                ,
                g = function(t, e, n) {
                    var o, r, a, s, l;
                    for (null == n && (n = i),
                    r = t.length,
                    l = e,
                    a = t[e],
                    o = 2 * e + 1; r > o; )
                        s = o + 1,
                        r > s && !(n(t[o], t[s]) < 0) && (o = s),
                        t[e] = t[o],
                        e = o,
                        o = 2 * e + 1;
                    return t[e] = a,
                    d(t, l, e, n)
                }
                ,
                t = function() {
                    function t(t) {
                        this.cmp = null != t ? t : i,
                        this.nodes = []
                    }
                    return t.push = a,
                    t.pop = r,
                    t.replace = l,
                    t.pushpop = s,
                    t.heapify = o,
                    t.updateItem = f,
                    t.nlargest = p,
                    t.nsmallest = c,
                    t.prototype.push = function(t) {
                        return a(this.nodes, t, this.cmp)
                    }
                    ,
                    t.prototype.pop = function() {
                        return r(this.nodes, this.cmp)
                    }
                    ,
                    t.prototype.peek = function() {
                        return this.nodes[0]
                    }
                    ,
                    t.prototype.contains = function(t) {
                        return -1 !== this.nodes.indexOf(t)
                    }
                    ,
                    t.prototype.replace = function(t) {
                        return l(this.nodes, t, this.cmp)
                    }
                    ,
                    t.prototype.pushpop = function(t) {
                        return s(this.nodes, t, this.cmp)
                    }
                    ,
                    t.prototype.heapify = function() {
                        return o(this.nodes, this.cmp)
                    }
                    ,
                    t.prototype.updateItem = function(t) {
                        return f(this.nodes, t, this.cmp)
                    }
                    ,
                    t.prototype.clear = function() {
                        return this.nodes = []
                    }
                    ,
                    t.prototype.empty = function() {
                        return 0 === this.nodes.length
                    }
                    ,
                    t.prototype.size = function() {
                        return this.nodes.length
                    }
                    ,
                    t.prototype.clone = function() {
                        var e;
                        return e = new t,
                        e.nodes = this.nodes.slice(0),
                        e
                    }
                    ,
                    t.prototype.toArray = function() {
                        return this.nodes.slice(0)
                    }
                    ,
                    t.prototype.insert = t.prototype.push,
                    t.prototype.top = t.prototype.peek,
                    t.prototype.front = t.prototype.peek,
                    t.prototype.has = t.prototype.contains,
                    t.prototype.copy = t.prototype.clone,
                    t
                }(),
                ("undefined" != typeof e && null !== e ? e.exports : void 0) ? e.exports = t : window.Heap = t
            }
            ).call(this)
        }
        , {}],
        3: [function(t, e, i) {
            var n = {
                Always: 1,
                Never: 2,
                IfAtMostOneObstacle: 3,
                OnlyWhenNoObstacles: 4
            };
            e.exports = n
        }
        , {}],
        4: [function(t, e, i) {
            function n(t, e, i) {
                var n;
                "object" != typeof t ? n = t : (e = t.length,
                n = t[0].length,
                i = t),
                this.width = n,
                this.height = e,
                this.nodes = this._buildNodes(n, e, i)
            }
            var o = t("./Node")
              , r = t("./DiagonalMovement");
            n.prototype._buildNodes = function(t, e, i) {
                var n, r, a = new Array(e);
                for (n = 0; e > n; ++n)
                    for (a[n] = new Array(t),
                    r = 0; t > r; ++r)
                        a[n][r] = new o(r,n);
                if (void 0 === i)
                    return a;
                if (i.length !== e || i[0].length !== t)
                    throw new Error("Matrix size does not fit");
                for (n = 0; e > n; ++n)
                    for (r = 0; t > r; ++r)
                        i[n][r] && (a[n][r].walkable = !1);
                return a
            }
            ,
            n.prototype.getNodeAt = function(t, e) {
                return this.nodes[e][t]
            }
            ,
            n.prototype.isWalkableAt = function(t, e) {
                return this.isInside(t, e) && this.nodes[e][t].walkable
            }
            ,
            n.prototype.isInside = function(t, e) {
                return t >= 0 && t < this.width && e >= 0 && e < this.height
            }
            ,
            n.prototype.setWalkableAt = function(t, e, i) {
                this.nodes[e][t].walkable = i
            }
            ,
            n.prototype.getNeighbors = function(t, e) {
                var i = t.x
                  , n = t.y
                  , o = []
                  , a = !1
                  , s = !1
                  , l = !1
                  , h = !1
                  , u = !1
                  , p = !1
                  , c = !1
                  , f = !1
                  , d = this.nodes;
                if (this.isWalkableAt(i, n - 1) && (o.push(d[n - 1][i]),
                a = !0),
                this.isWalkableAt(i + 1, n) && (o.push(d[n][i + 1]),
                l = !0),
                this.isWalkableAt(i, n + 1) && (o.push(d[n + 1][i]),
                u = !0),
                this.isWalkableAt(i - 1, n) && (o.push(d[n][i - 1]),
                c = !0),
                e === r.Never)
                    return o;
                if (e === r.OnlyWhenNoObstacles)
                    s = c && a,
                    h = a && l,
                    p = l && u,
                    f = u && c;
                else if (e === r.IfAtMostOneObstacle)
                    s = c || a,
                    h = a || l,
                    p = l || u,
                    f = u || c;
                else {
                    if (e !== r.Always)
                        throw new Error("Incorrect value of diagonalMovement");
                    s = !0,
                    h = !0,
                    p = !0,
                    f = !0
                }
                return s && this.isWalkableAt(i - 1, n - 1) && o.push(d[n - 1][i - 1]),
                h && this.isWalkableAt(i + 1, n - 1) && o.push(d[n - 1][i + 1]),
                p && this.isWalkableAt(i + 1, n + 1) && o.push(d[n + 1][i + 1]),
                f && this.isWalkableAt(i - 1, n + 1) && o.push(d[n + 1][i - 1]),
                o
            }
            ,
            n.prototype.clone = function() {
                var t, e, i = this.width, r = this.height, a = this.nodes, s = new n(i,r), l = new Array(r);
                for (t = 0; r > t; ++t)
                    for (l[t] = new Array(i),
                    e = 0; i > e; ++e)
                        l[t][e] = new o(e,t,a[t][e].walkable);
                return s.nodes = l,
                s
            }
            ,
            e.exports = n
        }
        , {
            "./DiagonalMovement": 3,
            "./Node": 6
        }],
        5: [function(t, e, i) {
            e.exports = {
                manhattan: function(t, e) {
                    return t + e
                },
                euclidean: function(t, e) {
                    return Math.sqrt(t * t + e * e)
                },
                octile: function(t, e) {
                    var i = Math.SQRT2 - 1;
                    return e > t ? i * t + e : i * e + t
                },
                chebyshev: function(t, e) {
                    return Math.max(t, e)
                }
            }
        }
        , {}],
        6: [function(t, e, i) {
            function n(t, e, i) {
                this.x = t,
                this.y = e,
                this.walkable = void 0 === i ? !0 : i
            }
            e.exports = n
        }
        , {}],
        7: [function(t, e, i) {
            function n(t) {
                for (var e = [[t.x, t.y]]; t.parent; )
                    t = t.parent,
                    e.push([t.x, t.y]);
                return e.reverse()
            }
            function o(t, e) {
                var i = n(t)
                  , o = n(e);
                return i.concat(o.reverse())
            }
            function r(t) {
                var e, i, n, o, r, a = 0;
                for (e = 1; e < t.length; ++e)
                    i = t[e - 1],
                    n = t[e],
                    o = i[0] - n[0],
                    r = i[1] - n[1],
                    a += Math.sqrt(o * o + r * r);
                return a
            }
            function a(t, e, i, n) {
                var o, r, a, s, l, h, u = Math.abs, p = [];
                for (a = u(i - t),
                s = u(n - e),
                o = i > t ? 1 : -1,
                r = n > e ? 1 : -1,
                l = a - s; ; ) {
                    if (p.push([t, e]),
                    t === i && e === n)
                        break;
                    h = 2 * l,
                    h > -s && (l -= s,
                    t += o),
                    a > h && (l += a,
                    e += r)
                }
                return p
            }
            function s(t) {
                var e, i, n, o, r, s, l = [], h = t.length;
                if (2 > h)
                    return l;
                for (r = 0; h - 1 > r; ++r)
                    for (e = t[r],
                    i = t[r + 1],
                    n = a(e[0], e[1], i[0], i[1]),
                    o = n.length,
                    s = 0; o - 1 > s; ++s)
                        l.push(n[s]);
                return l.push(t[h - 1]),
                l
            }
            function l(t, e) {
                var i, n, o, r, s, l, h, u, p, c, f, d = e.length, g = e[0][0], b = e[0][1], v = e[d - 1][0], A = e[d - 1][1];
                for (i = g,
                n = b,
                s = [[i, n]],
                l = 2; d > l; ++l) {
                    for (u = e[l],
                    o = u[0],
                    r = u[1],
                    p = a(i, n, o, r),
                    f = !1,
                    h = 1; h < p.length; ++h)
                        if (c = p[h],
                        !t.isWalkableAt(c[0], c[1])) {
                            f = !0;
                            break
                        }
                    f && (lastValidCoord = e[l - 1],
                    s.push(lastValidCoord),
                    i = lastValidCoord[0],
                    n = lastValidCoord[1])
                }
                return s.push([v, A]),
                s
            }
            function h(t) {
                if (t.length < 3)
                    return t;
                var e, i, n, o, r, a, s = [], l = t[0][0], h = t[0][1], u = t[1][0], p = t[1][1], c = u - l, f = p - h;
                for (r = Math.sqrt(c * c + f * f),
                c /= r,
                f /= r,
                s.push([l, h]),
                a = 2; a < t.length; a++)
                    e = u,
                    i = p,
                    n = c,
                    o = f,
                    u = t[a][0],
                    p = t[a][1],
                    c = u - e,
                    f = p - i,
                    r = Math.sqrt(c * c + f * f),
                    c /= r,
                    f /= r,
                    c === n && f === o || s.push([e, i]);
                return s.push([u, p]),
                s
            }
            i.backtrace = n,
            i.biBacktrace = o,
            i.pathLength = r,
            i.interpolate = a,
            i.expandPath = s,
            i.smoothenPath = l,
            i.compressPath = h
        }
        , {}],
        8: [function(t, e, i) {
            e.exports = {
                Heap: t("heap"),
                Node: t("./core/Node"),
                Grid: t("./core/Grid"),
                Util: t("./core/Util"),
                DiagonalMovement: t("./core/DiagonalMovement"),
                Heuristic: t("./core/Heuristic"),
                AStarFinder: t("./finders/AStarFinder"),
                BestFirstFinder: t("./finders/BestFirstFinder"),
                BreadthFirstFinder: t("./finders/BreadthFirstFinder"),
                DijkstraFinder: t("./finders/DijkstraFinder"),
                BiAStarFinder: t("./finders/BiAStarFinder"),
                BiBestFirstFinder: t("./finders/BiBestFirstFinder"),
                BiBreadthFirstFinder: t("./finders/BiBreadthFirstFinder"),
                BiDijkstraFinder: t("./finders/BiDijkstraFinder"),
                IDAStarFinder: t("./finders/IDAStarFinder"),
                JumpPointFinder: t("./finders/JumpPointFinder")
            }
        }
        , {
            "./core/DiagonalMovement": 3,
            "./core/Grid": 4,
            "./core/Heuristic": 5,
            "./core/Node": 6,
            "./core/Util": 7,
            "./finders/AStarFinder": 9,
            "./finders/BestFirstFinder": 10,
            "./finders/BiAStarFinder": 11,
            "./finders/BiBestFirstFinder": 12,
            "./finders/BiBreadthFirstFinder": 13,
            "./finders/BiDijkstraFinder": 14,
            "./finders/BreadthFirstFinder": 15,
            "./finders/DijkstraFinder": 16,
            "./finders/IDAStarFinder": 17,
            "./finders/JumpPointFinder": 22,
            heap: 1
        }],
        9: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.allowDiagonal = t.allowDiagonal,
                this.dontCrossCorners = t.dontCrossCorners,
                this.heuristic = t.heuristic || a.manhattan,
                this.weight = t.weight || 1,
                this.diagonalMovement = t.diagonalMovement,
                this.diagonalMovement || (this.allowDiagonal ? this.dontCrossCorners ? this.diagonalMovement = s.OnlyWhenNoObstacles : this.diagonalMovement = s.IfAtMostOneObstacle : this.diagonalMovement = s.Never),
                this.diagonalMovement === s.Never ? this.heuristic = t.heuristic || a.manhattan : this.heuristic = t.heuristic || a.octile
            }
            var o = t("heap")
              , r = t("../core/Util")
              , a = t("../core/Heuristic")
              , s = t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, a) {
                var s, l, h, u, p, c, f, d, g = new o(function(t, e) {
                    return t.f - e.f
                }
                ), b = a.getNodeAt(t, e), v = a.getNodeAt(i, n), A = this.heuristic, m = this.diagonalMovement, y = this.weight, k = Math.abs, M = Math.SQRT2;
                for (b.g = 0,
                b.f = 0,
                g.push(b),
                b.opened = !0; !g.empty(); ) {
                    if (s = g.pop(),
                    s.closed = !0,
                    s === v)
                        return r.backtrace(v);
                    for (l = a.getNeighbors(s, m),
                    u = 0,
                    p = l.length; p > u; ++u)
                        h = l[u],
                        h.closed || (c = h.x,
                        f = h.y,
                        d = s.g + (c - s.x === 0 || f - s.y === 0 ? 1 : M),
                        (!h.opened || d < h.g) && (h.g = d,
                        h.h = h.h || y * A(k(c - i), k(f - n)),
                        h.f = h.g + h.h,
                        h.parent = s,
                        h.opened ? g.updateItem(h) : (g.push(h),
                        h.opened = !0)))
                }
                return []
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Heuristic": 5,
            "../core/Util": 7,
            heap: 1
        }],
        10: [function(t, e, i) {
            function n(t) {
                o.call(this, t);
                var e = this.heuristic;
                this.heuristic = function(t, i) {
                    return 1e6 * e(t, i)
                }
            }
            var o = t("./AStarFinder");
            n.prototype = new o,
            n.prototype.constructor = n,
            e.exports = n
        }
        , {
            "./AStarFinder": 9
        }],
        11: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.allowDiagonal = t.allowDiagonal,
                this.dontCrossCorners = t.dontCrossCorners,
                this.diagonalMovement = t.diagonalMovement,
                this.heuristic = t.heuristic || a.manhattan,
                this.weight = t.weight || 1,
                this.diagonalMovement || (this.allowDiagonal ? this.dontCrossCorners ? this.diagonalMovement = s.OnlyWhenNoObstacles : this.diagonalMovement = s.IfAtMostOneObstacle : this.diagonalMovement = s.Never),
                this.diagonalMovement === s.Never ? this.heuristic = t.heuristic || a.manhattan : this.heuristic = t.heuristic || a.octile
            }
            var o = t("heap")
              , r = t("../core/Util")
              , a = t("../core/Heuristic")
              , s = t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, a) {
                var s, l, h, u, p, c, f, d, g = function(t, e) {
                    return t.f - e.f
                }, b = new o(g), v = new o(g), A = a.getNodeAt(t, e), m = a.getNodeAt(i, n), y = this.heuristic, k = this.diagonalMovement, M = this.weight, W = Math.abs, w = Math.SQRT2, N = 1, x = 2;
                for (A.g = 0,
                A.f = 0,
                b.push(A),
                A.opened = N,
                m.g = 0,
                m.f = 0,
                v.push(m),
                m.opened = x; !b.empty() && !v.empty(); ) {
                    for (s = b.pop(),
                    s.closed = !0,
                    l = a.getNeighbors(s, k),
                    u = 0,
                    p = l.length; p > u; ++u)
                        if (h = l[u],
                        !h.closed) {
                            if (h.opened === x)
                                return r.biBacktrace(s, h);
                            c = h.x,
                            f = h.y,
                            d = s.g + (c - s.x === 0 || f - s.y === 0 ? 1 : w),
                            (!h.opened || d < h.g) && (h.g = d,
                            h.h = h.h || M * y(W(c - i), W(f - n)),
                            h.f = h.g + h.h,
                            h.parent = s,
                            h.opened ? b.updateItem(h) : (b.push(h),
                            h.opened = N))
                        }
                    for (s = v.pop(),
                    s.closed = !0,
                    l = a.getNeighbors(s, k),
                    u = 0,
                    p = l.length; p > u; ++u)
                        if (h = l[u],
                        !h.closed) {
                            if (h.opened === N)
                                return r.biBacktrace(h, s);
                            c = h.x,
                            f = h.y,
                            d = s.g + (c - s.x === 0 || f - s.y === 0 ? 1 : w),
                            (!h.opened || d < h.g) && (h.g = d,
                            h.h = h.h || M * y(W(c - t), W(f - e)),
                            h.f = h.g + h.h,
                            h.parent = s,
                            h.opened ? v.updateItem(h) : (v.push(h),
                            h.opened = x))
                        }
                }
                return []
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Heuristic": 5,
            "../core/Util": 7,
            heap: 1
        }],
        12: [function(t, e, i) {
            function n(t) {
                o.call(this, t);
                var e = this.heuristic;
                this.heuristic = function(t, i) {
                    return 1e6 * e(t, i)
                }
            }
            var o = t("./BiAStarFinder");
            n.prototype = new o,
            n.prototype.constructor = n,
            e.exports = n
        }
        , {
            "./BiAStarFinder": 11
        }],
        13: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.allowDiagonal = t.allowDiagonal,
                this.dontCrossCorners = t.dontCrossCorners,
                this.diagonalMovement = t.diagonalMovement,
                this.diagonalMovement || (this.allowDiagonal ? this.dontCrossCorners ? this.diagonalMovement = r.OnlyWhenNoObstacles : this.diagonalMovement = r.IfAtMostOneObstacle : this.diagonalMovement = r.Never)
            }
            var o = t("../core/Util")
              , r = t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, r) {
                var a, s, l, h, u, p = r.getNodeAt(t, e), c = r.getNodeAt(i, n), f = [], d = [], g = this.diagonalMovement, b = 0, v = 1;
                for (f.push(p),
                p.opened = !0,
                p.by = b,
                d.push(c),
                c.opened = !0,
                c.by = v; f.length && d.length; ) {
                    for (l = f.shift(),
                    l.closed = !0,
                    a = r.getNeighbors(l, g),
                    h = 0,
                    u = a.length; u > h; ++h)
                        if (s = a[h],
                        !s.closed)
                            if (s.opened) {
                                if (s.by === v)
                                    return o.biBacktrace(l, s)
                            } else
                                f.push(s),
                                s.parent = l,
                                s.opened = !0,
                                s.by = b;
                    for (l = d.shift(),
                    l.closed = !0,
                    a = r.getNeighbors(l, g),
                    h = 0,
                    u = a.length; u > h; ++h)
                        if (s = a[h],
                        !s.closed)
                            if (s.opened) {
                                if (s.by === b)
                                    return o.biBacktrace(s, l)
                            } else
                                d.push(s),
                                s.parent = l,
                                s.opened = !0,
                                s.by = v
                }
                return []
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Util": 7
        }],
        14: [function(t, e, i) {
            function n(t) {
                o.call(this, t),
                this.heuristic = function(t, e) {
                    return 0
                }
            }
            var o = t("./BiAStarFinder");
            n.prototype = new o,
            n.prototype.constructor = n,
            e.exports = n
        }
        , {
            "./BiAStarFinder": 11
        }],
        15: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.allowDiagonal = t.allowDiagonal,
                this.dontCrossCorners = t.dontCrossCorners,
                this.diagonalMovement = t.diagonalMovement,
                this.diagonalMovement || (this.allowDiagonal ? this.dontCrossCorners ? this.diagonalMovement = r.OnlyWhenNoObstacles : this.diagonalMovement = r.IfAtMostOneObstacle : this.diagonalMovement = r.Never)
            }
            var o = t("../core/Util")
              , r = t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, r) {
                var a, s, l, h, u, p = [], c = this.diagonalMovement, f = r.getNodeAt(t, e), d = r.getNodeAt(i, n);
                for (p.push(f),
                f.opened = !0; p.length; ) {
                    if (l = p.shift(),
                    l.closed = !0,
                    l === d)
                        return o.backtrace(d);
                    for (a = r.getNeighbors(l, c),
                    h = 0,
                    u = a.length; u > h; ++h)
                        s = a[h],
                        s.closed || s.opened || (p.push(s),
                        s.opened = !0,
                        s.parent = l)
                }
                return []
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Util": 7
        }],
        16: [function(t, e, i) {
            function n(t) {
                o.call(this, t),
                this.heuristic = function(t, e) {
                    return 0
                }
            }
            var o = t("./AStarFinder");
            n.prototype = new o,
            n.prototype.constructor = n,
            e.exports = n
        }
        , {
            "./AStarFinder": 9
        }],
        17: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.allowDiagonal = t.allowDiagonal,
                this.dontCrossCorners = t.dontCrossCorners,
                this.diagonalMovement = t.diagonalMovement,
                this.heuristic = t.heuristic || o.manhattan,
                this.weight = t.weight || 1,
                this.trackRecursion = t.trackRecursion || !1,
                this.timeLimit = t.timeLimit || 1 / 0,
                this.diagonalMovement || (this.allowDiagonal ? this.dontCrossCorners ? this.diagonalMovement = a.OnlyWhenNoObstacles : this.diagonalMovement = a.IfAtMostOneObstacle : this.diagonalMovement = a.Never),
                this.diagonalMovement === a.Never ? this.heuristic = t.heuristic || o.manhattan : this.heuristic = t.heuristic || o.octile
            }
            var o = (t("../core/Util"),
            t("../core/Heuristic"))
              , r = t("../core/Node")
              , a = t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, o) {
                var a, s, l, h = 0, u = (new Date).getTime(), p = function(t, e) {
                    return this.heuristic(Math.abs(e.x - t.x), Math.abs(e.y - t.y))
                }
                .bind(this), c = function(t, e) {
                    return t.x === e.x || t.y === e.y ? 1 : Math.SQRT2
                }, f = function(t, e, i, n, a) {
                    if (h++,
                    this.timeLimit > 0 && (new Date).getTime() - u > 1e3 * this.timeLimit)
                        return 1 / 0;
                    var s = e + p(t, g) * this.weight;
                    if (s > i)
                        return s;
                    if (t == g)
                        return n[a] = [t.x, t.y],
                        t;
                    var l, d, b, v, A = o.getNeighbors(t, this.diagonalMovement);
                    for (b = 0,
                    l = 1 / 0; v = A[b]; ++b) {
                        if (this.trackRecursion && (v.retainCount = v.retainCount + 1 || 1,
                        v.tested !== !0 && (v.tested = !0)),
                        d = f(v, e + c(t, v), i, n, a + 1),
                        d instanceof r)
                            return n[a] = [t.x, t.y],
                            d;
                        this.trackRecursion && 0 === --v.retainCount && (v.tested = !1),
                        l > d && (l = d)
                    }
                    return l
                }
                .bind(this), d = o.getNodeAt(t, e), g = o.getNodeAt(i, n), b = p(d, g);
                for (a = 0; !0; ++a) {
                    if (s = [],
                    l = f(d, 0, b, s, 0),
                    l === 1 / 0)
                        return [];
                    if (l instanceof r)
                        return s;
                    b = l
                }
                return []
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Heuristic": 5,
            "../core/Node": 6,
            "../core/Util": 7
        }],
        18: [function(t, e, i) {
            function n(t) {
                o.call(this, t)
            }
            var o = t("./JumpPointFinderBase")
              , r = t("../core/DiagonalMovement");
            n.prototype = new o,
            n.prototype.constructor = n,
            n.prototype._jump = function(t, e, i, n) {
                var o = this.grid
                  , r = t - i
                  , a = e - n;
                if (!o.isWalkableAt(t, e))
                    return null;
                if (this.trackJumpRecursion === !0 && (o.getNodeAt(t, e).tested = !0),
                o.getNodeAt(t, e) === this.endNode)
                    return [t, e];
                if (0 !== r && 0 !== a) {
                    if (o.isWalkableAt(t - r, e + a) && !o.isWalkableAt(t - r, e) || o.isWalkableAt(t + r, e - a) && !o.isWalkableAt(t, e - a))
                        return [t, e];
                    if (this._jump(t + r, e, t, e) || this._jump(t, e + a, t, e))
                        return [t, e]
                } else if (0 !== r) {
                    if (o.isWalkableAt(t + r, e + 1) && !o.isWalkableAt(t, e + 1) || o.isWalkableAt(t + r, e - 1) && !o.isWalkableAt(t, e - 1))
                        return [t, e]
                } else if (o.isWalkableAt(t + 1, e + a) && !o.isWalkableAt(t + 1, e) || o.isWalkableAt(t - 1, e + a) && !o.isWalkableAt(t - 1, e))
                    return [t, e];
                return this._jump(t + r, e + a, t, e)
            }
            ,
            n.prototype._findNeighbors = function(t) {
                var e, i, n, o, a, s, l, h, u = t.parent, p = t.x, c = t.y, f = this.grid, d = [];
                if (u)
                    e = u.x,
                    i = u.y,
                    n = (p - e) / Math.max(Math.abs(p - e), 1),
                    o = (c - i) / Math.max(Math.abs(c - i), 1),
                    0 !== n && 0 !== o ? (f.isWalkableAt(p, c + o) && d.push([p, c + o]),
                    f.isWalkableAt(p + n, c) && d.push([p + n, c]),
                    f.isWalkableAt(p + n, c + o) && d.push([p + n, c + o]),
                    f.isWalkableAt(p - n, c) || d.push([p - n, c + o]),
                    f.isWalkableAt(p, c - o) || d.push([p + n, c - o])) : 0 === n ? (f.isWalkableAt(p, c + o) && d.push([p, c + o]),
                    f.isWalkableAt(p + 1, c) || d.push([p + 1, c + o]),
                    f.isWalkableAt(p - 1, c) || d.push([p - 1, c + o])) : (f.isWalkableAt(p + n, c) && d.push([p + n, c]),
                    f.isWalkableAt(p, c + 1) || d.push([p + n, c + 1]),
                    f.isWalkableAt(p, c - 1) || d.push([p + n, c - 1]));
                else
                    for (a = f.getNeighbors(t, r.Always),
                    l = 0,
                    h = a.length; h > l; ++l)
                        s = a[l],
                        d.push([s.x, s.y]);
                return d
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "./JumpPointFinderBase": 23
        }],
        19: [function(t, e, i) {
            function n(t) {
                o.call(this, t)
            }
            var o = t("./JumpPointFinderBase")
              , r = t("../core/DiagonalMovement");
            n.prototype = new o,
            n.prototype.constructor = n,
            n.prototype._jump = function(t, e, i, n) {
                var o = this.grid
                  , r = t - i
                  , a = e - n;
                if (!o.isWalkableAt(t, e))
                    return null;
                if (this.trackJumpRecursion === !0 && (o.getNodeAt(t, e).tested = !0),
                o.getNodeAt(t, e) === this.endNode)
                    return [t, e];
                if (0 !== r && 0 !== a) {
                    if (o.isWalkableAt(t - r, e + a) && !o.isWalkableAt(t - r, e) || o.isWalkableAt(t + r, e - a) && !o.isWalkableAt(t, e - a))
                        return [t, e];
                    if (this._jump(t + r, e, t, e) || this._jump(t, e + a, t, e))
                        return [t, e]
                } else if (0 !== r) {
                    if (o.isWalkableAt(t + r, e + 1) && !o.isWalkableAt(t, e + 1) || o.isWalkableAt(t + r, e - 1) && !o.isWalkableAt(t, e - 1))
                        return [t, e]
                } else if (o.isWalkableAt(t + 1, e + a) && !o.isWalkableAt(t + 1, e) || o.isWalkableAt(t - 1, e + a) && !o.isWalkableAt(t - 1, e))
                    return [t, e];
                return o.isWalkableAt(t + r, e) || o.isWalkableAt(t, e + a) ? this._jump(t + r, e + a, t, e) : null
            }
            ,
            n.prototype._findNeighbors = function(t) {
                var e, i, n, o, a, s, l, h, u = t.parent, p = t.x, c = t.y, f = this.grid, d = [];
                if (u)
                    e = u.x,
                    i = u.y,
                    n = (p - e) / Math.max(Math.abs(p - e), 1),
                    o = (c - i) / Math.max(Math.abs(c - i), 1),
                    0 !== n && 0 !== o ? (f.isWalkableAt(p, c + o) && d.push([p, c + o]),
                    f.isWalkableAt(p + n, c) && d.push([p + n, c]),
                    (f.isWalkableAt(p, c + o) || f.isWalkableAt(p + n, c)) && d.push([p + n, c + o]),
                    !f.isWalkableAt(p - n, c) && f.isWalkableAt(p, c + o) && d.push([p - n, c + o]),
                    !f.isWalkableAt(p, c - o) && f.isWalkableAt(p + n, c) && d.push([p + n, c - o])) : 0 === n ? f.isWalkableAt(p, c + o) && (d.push([p, c + o]),
                    f.isWalkableAt(p + 1, c) || d.push([p + 1, c + o]),
                    f.isWalkableAt(p - 1, c) || d.push([p - 1, c + o])) : f.isWalkableAt(p + n, c) && (d.push([p + n, c]),
                    f.isWalkableAt(p, c + 1) || d.push([p + n, c + 1]),
                    f.isWalkableAt(p, c - 1) || d.push([p + n, c - 1]));
                else
                    for (a = f.getNeighbors(t, r.IfAtMostOneObstacle),
                    l = 0,
                    h = a.length; h > l; ++l)
                        s = a[l],
                        d.push([s.x, s.y]);
                return d
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "./JumpPointFinderBase": 23
        }],
        20: [function(t, e, i) {
            function n(t) {
                o.call(this, t)
            }
            var o = t("./JumpPointFinderBase")
              , r = t("../core/DiagonalMovement");
            n.prototype = new o,
            n.prototype.constructor = n,
            n.prototype._jump = function(t, e, i, n) {
                var o = this.grid
                  , r = t - i
                  , a = e - n;
                if (!o.isWalkableAt(t, e))
                    return null;
                if (this.trackJumpRecursion === !0 && (o.getNodeAt(t, e).tested = !0),
                o.getNodeAt(t, e) === this.endNode)
                    return [t, e];
                if (0 !== r && 0 !== a) {
                    if (this._jump(t + r, e, t, e) || this._jump(t, e + a, t, e))
                        return [t, e]
                } else if (0 !== r) {
                    if (o.isWalkableAt(t, e - 1) && !o.isWalkableAt(t - r, e - 1) || o.isWalkableAt(t, e + 1) && !o.isWalkableAt(t - r, e + 1))
                        return [t, e]
                } else if (0 !== a && (o.isWalkableAt(t - 1, e) && !o.isWalkableAt(t - 1, e - a) || o.isWalkableAt(t + 1, e) && !o.isWalkableAt(t + 1, e - a)))
                    return [t, e];
                return o.isWalkableAt(t + r, e) && o.isWalkableAt(t, e + a) ? this._jump(t + r, e + a, t, e) : null
            }
            ,
            n.prototype._findNeighbors = function(t) {
                var e, i, n, o, a, s, l, h, u = t.parent, p = t.x, c = t.y, f = this.grid, d = [];
                if (u)
                    if (e = u.x,
                    i = u.y,
                    n = (p - e) / Math.max(Math.abs(p - e), 1),
                    o = (c - i) / Math.max(Math.abs(c - i), 1),
                    0 !== n && 0 !== o)
                        f.isWalkableAt(p, c + o) && d.push([p, c + o]),
                        f.isWalkableAt(p + n, c) && d.push([p + n, c]),
                        f.isWalkableAt(p, c + o) && f.isWalkableAt(p + n, c) && d.push([p + n, c + o]);
                    else {
                        var g;
                        if (0 !== n) {
                            g = f.isWalkableAt(p + n, c);
                            var b = f.isWalkableAt(p, c + 1)
                              , v = f.isWalkableAt(p, c - 1);
                            g && (d.push([p + n, c]),
                            b && d.push([p + n, c + 1]),
                            v && d.push([p + n, c - 1])),
                            b && d.push([p, c + 1]),
                            v && d.push([p, c - 1])
                        } else if (0 !== o) {
                            g = f.isWalkableAt(p, c + o);
                            var A = f.isWalkableAt(p + 1, c)
                              , m = f.isWalkableAt(p - 1, c);
                            g && (d.push([p, c + o]),
                            A && d.push([p + 1, c + o]),
                            m && d.push([p - 1, c + o])),
                            A && d.push([p + 1, c]),
                            m && d.push([p - 1, c])
                        }
                    }
                else
                    for (a = f.getNeighbors(t, r.OnlyWhenNoObstacles),
                    l = 0,
                    h = a.length; h > l; ++l)
                        s = a[l],
                        d.push([s.x, s.y]);
                return d
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "./JumpPointFinderBase": 23
        }],
        21: [function(t, e, i) {
            function n(t) {
                o.call(this, t)
            }
            var o = t("./JumpPointFinderBase")
              , r = t("../core/DiagonalMovement");
            n.prototype = new o,
            n.prototype.constructor = n,
            n.prototype._jump = function(t, e, i, n) {
                var o = this.grid
                  , r = t - i
                  , a = e - n;
                if (!o.isWalkableAt(t, e))
                    return null;
                if (this.trackJumpRecursion === !0 && (o.getNodeAt(t, e).tested = !0),
                o.getNodeAt(t, e) === this.endNode)
                    return [t, e];
                if (0 !== r) {
                    if (o.isWalkableAt(t, e - 1) && !o.isWalkableAt(t - r, e - 1) || o.isWalkableAt(t, e + 1) && !o.isWalkableAt(t - r, e + 1))
                        return [t, e]
                } else {
                    if (0 === a)
                        throw new Error("Only horizontal and vertical movements are allowed");
                    if (o.isWalkableAt(t - 1, e) && !o.isWalkableAt(t - 1, e - a) || o.isWalkableAt(t + 1, e) && !o.isWalkableAt(t + 1, e - a))
                        return [t, e];
                    if (this._jump(t + 1, e, t, e) || this._jump(t - 1, e, t, e))
                        return [t, e]
                }
                return this._jump(t + r, e + a, t, e)
            }
            ,
            n.prototype._findNeighbors = function(t) {
                var e, i, n, o, a, s, l, h, u = t.parent, p = t.x, c = t.y, f = this.grid, d = [];
                if (u)
                    e = u.x,
                    i = u.y,
                    n = (p - e) / Math.max(Math.abs(p - e), 1),
                    o = (c - i) / Math.max(Math.abs(c - i), 1),
                    0 !== n ? (f.isWalkableAt(p, c - 1) && d.push([p, c - 1]),
                    f.isWalkableAt(p, c + 1) && d.push([p, c + 1]),
                    f.isWalkableAt(p + n, c) && d.push([p + n, c])) : 0 !== o && (f.isWalkableAt(p - 1, c) && d.push([p - 1, c]),
                    f.isWalkableAt(p + 1, c) && d.push([p + 1, c]),
                    f.isWalkableAt(p, c + o) && d.push([p, c + o]));
                else
                    for (a = f.getNeighbors(t, r.Never),
                    l = 0,
                    h = a.length; h > l; ++l)
                        s = a[l],
                        d.push([s.x, s.y]);
                return d
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "./JumpPointFinderBase": 23
        }],
        22: [function(t, e, i) {
            function n(t) {
                return t = t || {},
                t.diagonalMovement === o.Never ? new r(t) : t.diagonalMovement === o.Always ? new a(t) : t.diagonalMovement === o.OnlyWhenNoObstacles ? new s(t) : new l(t)
            }
            var o = t("../core/DiagonalMovement")
              , r = t("./JPFNeverMoveDiagonally")
              , a = t("./JPFAlwaysMoveDiagonally")
              , s = t("./JPFMoveDiagonallyIfNoObstacles")
              , l = t("./JPFMoveDiagonallyIfAtMostOneObstacle");
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "./JPFAlwaysMoveDiagonally": 18,
            "./JPFMoveDiagonallyIfAtMostOneObstacle": 19,
            "./JPFMoveDiagonallyIfNoObstacles": 20,
            "./JPFNeverMoveDiagonally": 21
        }],
        23: [function(t, e, i) {
            function n(t) {
                t = t || {},
                this.heuristic = t.heuristic || a.manhattan,
                this.trackJumpRecursion = t.trackJumpRecursion || !1
            }
            var o = t("heap")
              , r = t("../core/Util")
              , a = t("../core/Heuristic");
            t("../core/DiagonalMovement");
            n.prototype.findPath = function(t, e, i, n, a) {
                var s, l = this.openList = new o(function(t, e) {
                    return t.f - e.f
                }
                ), h = this.startNode = a.getNodeAt(t, e), u = this.endNode = a.getNodeAt(i, n);
                for (this.grid = a,
                h.g = 0,
                h.f = 0,
                l.push(h),
                h.opened = !0; !l.empty(); ) {
                    if (s = l.pop(),
                    s.closed = !0,
                    s === u)
                        return r.expandPath(r.backtrace(u));
                    this._identifySuccessors(s)
                }
                return []
            }
            ,
            n.prototype._identifySuccessors = function(t) {
                var e, i, n, o, r, s, l, h, u, p, c = this.grid, f = this.heuristic, d = this.openList, g = this.endNode.x, b = this.endNode.y, v = t.x, A = t.y, m = Math.abs;
                Math.max;
                for (e = this._findNeighbors(t),
                o = 0,
                r = e.length; r > o; ++o)
                    if (i = e[o],
                    n = this._jump(i[0], i[1], v, A)) {
                        if (s = n[0],
                        l = n[1],
                        p = c.getNodeAt(s, l),
                        p.closed)
                            continue;
                        h = a.octile(m(s - v), m(l - A)),
                        u = t.g + h,
                        (!p.opened || u < p.g) && (p.g = u,
                        p.h = p.h || f(m(s - g), m(l - b)),
                        p.f = p.g + p.h,
                        p.parent = t,
                        p.opened ? d.updateItem(p) : (d.push(p),
                        p.opened = !0))
                    }
            }
            ,
            e.exports = n
        }
        , {
            "../core/DiagonalMovement": 3,
            "../core/Heuristic": 5,
            "../core/Util": 7,
            heap: 1
        }]
    }, {}, [8])(8)
});

var EntitySpawner = pc.createScript("objectSpawner");
EntitySpawner.attributes.add("spawnOnLoad", {
    type: "asset",
    assetType: "template",
    default: [],
    title: "Spawn On Load",
    array: !0
}),
EntitySpawner.prefabDictionary = {},
EntitySpawner.templates = {},
EntitySpawner.notFounds = {},
EntitySpawner.prototype.initialize = function() {
    this.currentSeason = ""
}
,
EntitySpawner.prototype.LoadScenes = function(t=0) {
    for (const t of this.spawnOnLoad)
        if (t && "template" == t.type) {
            const e = t.resource.instantiate();
            e.enabled = !0,
            Game.app.root.addChild(e),
            e.enabled = !1
        }
    Game.app.fire("PrefabLoadComplete")
}
,
EntitySpawner.spawnObject = function(t, e=0, a=0, n=0, o=null, l=!1) {
    let p = null;
    if (EntitySpawner.templates[t] && (p = EntitySpawner.templates[t]),
    EntitySpawner.notFounds[t])
        return;
    if (p = Game.app.assets.find(t, "template"),
    !p)
        return console.log(`No template found with name ${t}`),
        EntitySpawner.notFounds[t] = !0,
        null;
    EntitySpawner.templates[t] = p.resource,
    p = p.resource;
    const i = p.instantiate();
    if (i.enabled = !0,
    null !== o && o.addChild(i),
    i.setPosition(e, a, n),
    l) {
        const t = i.getLocalScale().x
          , e = i.getLocalScale().y
          , a = i.getLocalScale().z;
        i.setLocalScale(t / o.getScale().x * o.getLocalScale().x, e / o.getScale().y * o.getLocalScale().y, a / o.getScale().z * o.getLocalScale().z)
    }
    return i
}
;
var SBG_Utils = {
    setCookie: function(e, n, t) {
        var o = "";
        if (t) {
            var i = new Date;
            i.setTime(i.getTime() + 24 * t * 60 * 60 * 1e3),
            o = "; expires=" + i.toUTCString()
        }
        document.cookie = e + "=" + (n || "") + o + "; path=/"
    },
    getCookie: function getCookie(e) {
        for (var n = e + "=", t = document.cookie.split(";"), o = 0; o < t.length; o++) {
            for (var i = t[o]; " " == i.charAt(0); )
                i = i.substring(1, i.length);
            if (0 == i.indexOf(n))
                return i.substring(n.length, i.length)
        }
        return null
    },
    eraseCookie: function eraseCookie(e) {
        document.cookie = e + "=; Max-Age=-99999999;"
    },
    spawnObject: function spawnObject(e, n=0, t=0, o=0, i=null) {
        if (!(e in ObjectSpawner.prefabDictionary))
            return console.log("Can not find entity for " + e),
            null;
        var r = ObjectSpawner.prefabDictionary[e].clone();
        return null !== i && i.addChild(r),
        r.setPosition(n, t, o),
        r.enabled = !0,
        r
    }
};
const getSelfAndAllChildren = e=>{
    const n = [e];
    return e.children.forEach((e=>{
        n.push(...getSelfAndAllChildren(e))
    }
    )),
    n
}
;
!function(t) {
    if ("object" == typeof module && "object" == typeof module.exports)
        module.exports = t();
    else if ("function" == typeof define && define.amd)
        define([], t);
    else {
        var n = t();
        window.astar = n.astar,
        window.Graph = n.Graph
    }
}((function() {
    function pathTo(t) {
        for (var n = t, i = []; n.parent; )
            i.unshift(n),
            n = n.parent;
        return i
    }
    function getHeap() {
        return new BinaryHeap((function(t) {
            return t.f
        }
        ))
    }
    var t = {
        search: function(n, i, e, o) {
            n.cleanDirty();
            var r = (o = o || {}).heuristic || t.heuristics.manhattan
              , s = o.closest || !1
              , h = getHeap()
              , a = i;
            for (i.h = r(i, e),
            n.markDirty(i),
            h.push(i); h.size() > 0; ) {
                var c = h.pop();
                if (c === e)
                    return pathTo(c);
                c.closed = !0;
                for (var u = n.neighbors(c), p = 0, f = u.length; p < f; ++p) {
                    var d = u[p];
                    if (!d.closed && !d.isWall()) {
                        var l = c.g + d.getCost(c)
                          , g = d.visited;
                        (!g || l < d.g) && (d.visited = !0,
                        d.parent = c,
                        d.h = d.h || r(d, e),
                        d.g = l,
                        d.f = d.g + d.h,
                        n.markDirty(d),
                        s && (d.h < a.h || d.h === a.h && d.g < a.g) && (a = d),
                        g ? h.rescoreElement(d) : h.push(d))
                    }
                }
            }
            return s ? pathTo(a) : []
        },
        searchGen: function*(n, i, e, o) {
            let r = 0;
            n.cleanDirty();
            var s = (o = o || {}).heuristic || t.heuristics.manhattan
              , h = o.closest || !1
              , a = getHeap()
              , c = i;
            for (i.h = s(i, e),
            n.markDirty(i),
            a.push(i); a.size() > 0; ) {
                var u = a.pop();
                if (u === e)
                    return pathTo(u);
                u.closed = !0;
                for (var p = n.neighbors(u), f = 0, d = p.length; f < d; ++f) {
                    var l = p[f];
                    if (!l.closed && !l.isWall()) {
                        var g = u.g + l.getCost(u)
                          , y = l.visited;
                        (!y || g < l.g) && (l.visited = !0,
                        l.parent = u,
                        l.h = l.h || s(l, e),
                        l.g = g,
                        l.f = l.g + l.h,
                        n.markDirty(l),
                        h && (l.h < c.h || l.h === c.h && l.g < c.g) && (c = l),
                        y ? a.rescoreElement(l) : a.push(l))
                    }
                }
                r++,
                r >= 2e4 && (r = 0,
                yield)
            }
            return h ? pathTo(c) : []
        },
        heuristics: {
            manhattan: function(t, n) {
                return Math.abs(n.x - t.x) + Math.abs(n.y - t.y)
            },
            diagonal: function(t, n) {
                var i = Math.sqrt(2)
                  , e = Math.abs(n.x - t.x)
                  , o = Math.abs(n.y - t.y);
                return 1 * (e + o) + (i - 2) * Math.min(e, o)
            }
        },
        cleanNode: function(t) {
            t.f = 0,
            t.g = 0,
            t.h = 0,
            t.visited = !1,
            t.closed = !1,
            t.parent = null
        }
    };
    function Graph(t, n) {
        n = n || {},
        this.nodes = [],
        this.diagonal = !!n.diagonal,
        this.grid = [];
        for (var i = 0; i < t.length; i++) {
            this.grid[i] = [];
            for (var e = 0, o = t[i]; e < o.length; e++) {
                var r = new GridNode(i,e,o[e]);
                this.grid[i][e] = r,
                this.nodes.push(r)
            }
        }
        this.init()
    }
    function GridNode(t, n, i) {
        this.x = t,
        this.y = n,
        this.weight = i
    }
    function BinaryHeap(t) {
        this.content = [],
        this.scoreFunction = t
    }
    return Graph.prototype.init = function() {
        this.dirtyNodes = [];
        for (var n = 0; n < this.nodes.length; n++)
            t.cleanNode(this.nodes[n])
    }
    ,
    Graph.prototype.cleanDirty = function() {
        for (var n = 0; n < this.dirtyNodes.length; n++)
            t.cleanNode(this.dirtyNodes[n]);
        this.dirtyNodes = []
    }
    ,
    Graph.prototype.markDirty = function(t) {
        this.dirtyNodes.push(t)
    }
    ,
    Graph.prototype.neighbors = function(t) {
        var n = []
          , i = t.x
          , e = t.y
          , o = this.grid;
        return o[i - 1] && o[i - 1][e] && n.push(o[i - 1][e]),
        o[i + 1] && o[i + 1][e] && n.push(o[i + 1][e]),
        o[i] && o[i][e - 1] && n.push(o[i][e - 1]),
        o[i] && o[i][e + 1] && n.push(o[i][e + 1]),
        this.diagonal && (o[i - 1] && o[i - 1][e - 1] && n.push(o[i - 1][e - 1]),
        o[i + 1] && o[i + 1][e - 1] && n.push(o[i + 1][e - 1]),
        o[i - 1] && o[i - 1][e + 1] && n.push(o[i - 1][e + 1]),
        o[i + 1] && o[i + 1][e + 1] && n.push(o[i + 1][e + 1])),
        n
    }
    ,
    Graph.prototype.toString = function() {
        for (var t = [], n = this.grid, i = 0; i < n.length; i++) {
            for (var e = [], o = n[i], r = 0; r < o.length; r++)
                e.push(o[r].weight);
            t.push(e.join(" "))
        }
        return t.join("\n")
    }
    ,
    GridNode.prototype.toString = function() {
        return "[" + this.x + " " + this.y + "]"
    }
    ,
    GridNode.prototype.getCost = function(t) {
        return t && t.x != this.x && t.y != this.y ? 1.41421 * this.weight : this.weight
    }
    ,
    GridNode.prototype.isWall = function() {
        return 0 === this.weight
    }
    ,
    BinaryHeap.prototype = {
        push: function(t) {
            this.content.push(t),
            this.sinkDown(this.content.length - 1)
        },
        pop: function() {
            var t = this.content[0]
              , n = this.content.pop();
            return this.content.length > 0 && (this.content[0] = n,
            this.bubbleUp(0)),
            t
        },
        remove: function(t) {
            var n = this.content.indexOf(t)
              , i = this.content.pop();
            n !== this.content.length - 1 && (this.content[n] = i,
            this.scoreFunction(i) < this.scoreFunction(t) ? this.sinkDown(n) : this.bubbleUp(n))
        },
        size: function() {
            return this.content.length
        },
        rescoreElement: function(t) {
            this.sinkDown(this.content.indexOf(t))
        },
        sinkDown: function(t) {
            for (var n = this.content[t]; t > 0; ) {
                var i = (t + 1 >> 1) - 1
                  , e = this.content[i];
                if (!(this.scoreFunction(n) < this.scoreFunction(e)))
                    break;
                this.content[i] = n,
                this.content[t] = e,
                t = i
            }
        },
        bubbleUp: function(t) {
            for (var n = this.content.length, i = this.content[t], e = this.scoreFunction(i); ; ) {
                var o, r = t + 1 << 1, s = r - 1, h = null;
                if (s < n) {
                    var a = this.content[s];
                    (o = this.scoreFunction(a)) < e && (h = s)
                }
                if (r < n) {
                    var c = this.content[r];
                    this.scoreFunction(c) < (null === h ? e : o) && (h = r)
                }
                if (null === h)
                    break;
                this.content[t] = this.content[h],
                this.content[h] = i,
                t = h
            }
        }
    },
    {
        astar: t,
        Graph: Graph
    }
}
));
class PerformanceMetric {
    constructor(t=100) {
        this.factor = t,
        this.reset()
    }
    add(t) {
        this.counter++,
        this.avg = this.avg + (t - this.avg) / Math.min(this.counter, this.factor),
        this.min = Math.min(t, this.min),
        this.max = Math.max(t, this.max)
    }
    start() {
        this.started = Date.now()
    }
    stop() {
        if (void 0 !== this.started) {
            const t = Date.now() - this.started;
            t > 0 && (this.add(t),
            delete this.started)
        }
    }
    reset() {
        this.counter = 0,
        this.avg = 0,
        this.min = Number.MAX_VALUE,
        this.max = Number.MIN_VALUE
    }
    get data() {
        return {
            min: this.min,
            avg: this.avg,
            max: this.max
        }
    }
}
class PerformanceManager {
    constructor({intervalSeconds: t=3600}={}) {
        this.frame = new PerformanceMetric,
        this.api = new PerformanceMetric,
        this.realtime = new PerformanceMetric,
        this.concurrency = window.navigator.hardwareConcurrency,
        setInterval((()=>{
            API.event("perf", this.current).then((()=>{
                this.frame.reset(),
                this.api.reset(),
                this.realtime.reset()
            }
            ))
        }
        ), 1e3 * t)
    }
    get current() {
        const t = {
            frame: this.frame.data,
            api: this.api.data,
            realtime: this.realtime.data,
            concurrency: this.concurrency,
            quality: SETTINGS.resolutionLevel
        };
        if (window.performance.memory) {
            t.memory = {};
            for (let e in window.performance.memory)
                t.memory[e] = window.performance.memory[e]
        }
        return t
    }
}
PERF = new PerformanceManager;
var DBRequests = {
    CheckGame: function(e) {
        pc.http.get("https://noahmizrahiwebgl.pythonanywhere.com/GetCurrentGames?", e)
    },
    CheckSoftware: function(e) {
        pc.http.get("https://noahmizrahiwebgl.pythonanywhere.com/GetVersionGames?", e)
    },
    CheckUser: function(e, t) {
        pc.http.get("https://noahmizrahiwebgl.pythonanywhere.com/GetUsers?playerID=" + e, t)
    }
};
var TestSpawnMapFromFile = pc.createScript("testSpawnMapFromFile");
TestSpawnMapFromFile.attributes.add("objectSize", {
    type: "number",
    default: 5
}),
TestSpawnMapFromFile.attributes.add("fileToLoad", {
    type: "asset",
    assetType: "text"
}),
TestSpawnMapFromFile.prototype.initialize = function() {}
,
TestSpawnMapFromFile.prototype.onLoadComplete = function(e, t) {
    console.log("Start Map Load"),
    console.log(`World Map Position ${e} , ${t}`);
    var a = this.fileToLoad.resource.replace(/(\r\n|\n|\r)/gm, "")
      , o = JSON.parse(a)
      , n = o.playerMap
      , p = o.neighborList
      , r = new pc.Entity;
    for (var s in this.app.root.addChild(r),
    r.setPosition(0, 0, 0),
    r.name = "ObjectParent",
    r.enabled = !0,
    n) {
        console.log(`Spawning Object : ${n[s].type}, x: ${n[s].position.x - 500} y: ${n[s].position.y} z: ${n[s].position.z}`);
        var l = n[s].type
          , c = n[s].rotation.y + 180
          , d = 0
          , y = !1;
        if ("Grass" != l && "Pasture" != l || (l = "Ground_P_" + Math.ceil(5 * Math.random())),
        "Pond" == l || "Dirt_Road" == l || "Paved_Road" == l) {
            y = !0;
            var $, u = [!1, !1, !1, !1], M = s.split(",");
            M[0] = M[0].replace(/[^\d.-]/g, ""),
            $ = `(${M[0]},${M[1]}, ${parseInt(M[2]) - 5}.0)`,
            u[0] = n[s].type == n[$].type,
            $ = `(${parseInt(M[0]) + 5}.0,${M[1]},${M[2]}`,
            u[1] = n[s].type == n[$].type,
            $ = `(${M[0]},${M[1]}, ${parseInt(M[2]) + 5}.0)`,
            u[2] = n[s].type == n[$].type,
            $ = `(${parseInt(M[0]) - 5}.0,${M[1]},${M[2]}`,
            u[3] = n[s].type == n[$].type;
            var w = u.filter((e=>e)).length;
            0 === w && (l += "_Alone"),
            1 == w && (l += "_End",
            u[0] && (d += 180),
            u[1] && (d += 90),
            u[3] && (d -= 90)),
            2 == w && (u[0] && u[2] ? l += "_Run" : u[1] && u[3] ? (l += "_Run",
            d += 90) : (l += "_Corner",
            u[0] && u[1] && (d += 90),
            u[0] && u[3] && (d -= 180),
            u[2] && u[3] && (d += 180))),
            3 == w && (l += "_T"),
            4 == w && (l += "_Cross")
        }
        var S = ObjectSpawner.spawnObject(l, n[s].position.x - 500, n[s].position.y, n[s].position.z, r);
        if (S && (y ? S.setLocalEulerAngles(0, d, 0) : S.setLocalEulerAngles(0, c, 0),
        "Trees" == l || "Marsh" == l || "Rocks" == l))
            ObjectSpawner.spawnObject("Ground_P_" + Math.ceil(5 * Math.random()), n[s].position.x - 500, n[s].position.y, n[s].position.z, S)
    }
    var b = [[-42.5, 0, -42.5], [37.5, 0, -42.5], [117.5, 0, -42.5], [-42.5, 0, 37.5], [117.5, 0, 37.5], [-42.5, 0, 117.5], [37.5, 0, 117.5], [117.5, 0, 117.5]]
      , _ = {
        Forest: "Plains",
        Desert: "Plains",
        Ocean: "Ocean",
        River: "Ocean",
        Mountains: "Mountains",
        Town: "Plains"
    };
    for (i = 0; i < 8; i++) {
        p[i];
        ObjectSpawner.spawnObject(`SupTile_${_[p[i]]}`, b[i][0] - 500, b[i][1], b[i][2], r)
    }
}
;
var TestTiler = pc.createScript("testTiler");
TestTiler.attributes.add("tileType", {
    type: "string",
    title: "Tile Type"
}),
TestTiler.attributes.add("topTileType", {
    type: "string",
    title: "Top Tile Type"
}),
TestTiler.attributes.add("bottomTileType", {
    type: "string",
    title: "Bottom Tile Type"
}),
TestTiler.attributes.add("rightTileType", {
    type: "string",
    title: "Right Tile Type"
}),
TestTiler.attributes.add("leftTileType", {
    type: "string",
    title: "Left Tile Type"
}),
TestTiler.prototype.initialize = function() {
    this.app.on("PrefabLoadComplete", this.onLoadComplete.bind(this))
}
,
TestTiler.prototype.onLoadComplete = function() {
    var t = [this.tileType == this.bottomTileType, this.tileType == this.rightTileType, this.tileType == this.topTileType, this.tileType == this.leftTileType];
    console.log(t);
    var e = 0;
    const i = (this.tileType == this.bottomTileType) << 0;
    e += this.tileType == this.bottomTileType;
    const T = (this.tileType == this.rightTileType) << 1;
    e += this.tileType == this.rightTileType;
    const l = (this.tileType == this.topTileType) << 2;
    e += this.tileType == this.topTileType;
    const p = (this.tileType == this.leftTileType) << 3;
    e += this.tileType == this.leftTileType;
    var s = i | l | p | T;
    console.log(s.toString(2));
    1 == e && (console.log("End"),
    console.log("Rotation : ")),
    console.log(e)
}
;
var SceneMerger;
function SceneMerger() {}
(SceneMerger = pc.createScript("sceneMerger")).attributes.add("sceneIds", {
    type: "string",
    default: [],
    title: "Scene IDs to Merge",
    array: !0
}),
SceneMerger.sceneLoadCount = 0,
SceneMerger.prototype.loadScene = function(e, n) {
    let t = e + ".json";
    const c = Game.app.scenes.findByUrl(t);
    Game.app.scenes.loadSceneData(c, (function(e, n) {
        if (console.log("Load Scene Data:"),
        console.log(n.data.settings),
        "GameScene" == n.name || "WorldScene" == n.name) {
            Game.sceneSettings || (Game.sceneSettings = {});
            const e = "GameScene" == n.name ? "Town" : "World";
            Game.sceneSettings[e] = n.data.settings
        }
    }
    )),
    this.app.scenes.loadSceneHierarchy(c, (function(e, t) {
        if (!e)
            return n(t),
            t;
        console.error(e)
    }
    ))
}
,
SceneMerger.prototype.initialize = function() {}
,
SceneMerger.prototype.LoadScenes = function(e=0) {
    e < this.sceneIds.length ? this.loadScene(this.sceneIds[e], this.loadCallback.bind(this)) : this.app.fire("SceneMergeComplete")
}
,
SceneMerger.prototype.loadCallback = function(e) {
    for (let n = 0; n < e.children.length; n++)
        e.children[n].tags.has("DontImport") && (e.children[n].enabled = !1);
    SceneMerger.sceneLoadCount++,
    this.LoadScenes(SceneMerger.sceneLoadCount)
}
;
var MapDataManager;
function MapDataManager() {}
(MapDataManager = pc.createScript("mapDataManager")).attributes.add("mapData", {
    type: "asset",
    assetType: "json"
}),
MapDataManager.prototype.initialize = function() {
    this.app.on("WorldTapped", this.WorldTouched.bind(this)),
    MapDataManager.mapInfo = this.mapData.resource,
    MapDataManager.offset = new pc.Vec3,
    MapDataManager.offset.x = this.entity.getLocalPosition().x - this.entity.getLocalScale().x / 2 + .5,
    MapDataManager.offset.z = this.entity.getLocalPosition().z - this.entity.getLocalScale().z / 2 + .5,
    this.LoadWorldObjects()
}
,
MapDataManager.getTypeAtPosition = function(a, t, e=!0) {
    var n;
    n = e ? new pc.Vec3(parseInt(Math.round(a) - MapDataManager.offset.x),0,parseInt(Math.round(t) - MapDataManager.offset.z)) : new pc.Vec3(parseInt(Math.round(a)),0,parseInt(Math.round(t)));
    var p = new pc.Vec3(n.x,0,n.z)
      , o = `(${p.x}.0,${p.y}.0,${p.z}.0)`;
    if (MapDataManager.mapInfo[o])
        return MapDataManager.mapInfo[o].type
}
,
MapDataManager.KeyToVector3 = function(a) {
    for (var t = a.split(","), e = 0; e < t.length; e++)
        t[e] = t[e].split(".", 1)[0],
        t[e] = t[e].replace(/\D/g, "");
    return new pc.Vec3(parseInt(t[0]),parseInt(t[1]),parseInt(t[2]))
}
,
MapDataManager.prototype.LoadWorldObjects = function() {
    Object.keys(MapDataManager.mapInfo).forEach((function(a) {
        let t = Game.worldObjectData[MapDataManager.mapInfo[a].type.replace(/ /g, "_")];
        if (t)
            if ("City" == t.Class) {
                const t = MapDataManager.KeyToVector3(a)
                  , e = EntitySpawner.spawnObject("City", t.x + MapDataManager.offset.x, 0, t.z + MapDataManager.offset.z, Game.app.root);
                e.setLocalScale(.2, .2, .2),
                e.tags.add("WorldActiveOnly")
            } else if ("Mine" == t.Class) {
                const t = MapDataManager.KeyToVector3(a);
                EntitySpawner.spawnObject("BoxCoin_Mine", t.x + MapDataManager.offset.x, 0, t.z + MapDataManager.offset.z, Game.app.root).tags.add("WorldActiveOnly")
            }
    }
    ))
}
,
MapDataManager.prototype.WorldTouched = function(a) {
    var t = new pc.Vec3(parseInt(Math.round(a.point.x) - MapDataManager.offset.x),0,parseInt(Math.round(a.point.z) - MapDataManager.offset.z))
      , e = new pc.Vec3(t.x,0,t.z)
      , n = `(${e.x}.0,${e.y}.0,${e.z}.0)`;
    if (Game.position && (Game.position.x == e.x && Game.position.y == e.z ? this.app.fire("WorldTappedSelf") : this.app.fire("WorldTappedOther")),
    this.mapData.resource[n]) {
        var p = this.mapData.resource[n].type;
        "Forest" == p ? (!0,
        "SMF") : "Plains" == p ? (!0,
        "SMP") : "Desert" == p && (!0,
        "SMD")
    }
}
;
var CameraCommander;
function CameraCommander() {}
(CameraCommander = pc.createScript("cameraCommander")).attributes.add("WorldSceneID", {
    type: "string",
    default: "826040",
    title: "World Scene ID:"
}),
CameraCommander.attributes.add("TownSceneID", {
    type: "string",
    default: "814241",
    title: "Town Scene ID:",
    description: "This is the description of the attribute"
}),
CameraCommander.prototype.initialize = function() {
    this.instance = this,
    CameraCommander.instance = this,
    this.townCameraActive = !1,
    this.worldCameraActive = !0,
    this.app.on("SetTownView", this.SetTownView.bind(this)),
    this.app.on("SetWorldView", this.SetWorldView.bind(this))
}
,
CameraCommander.prototype.UpdateAA = function() {
    SETTINGS.antiAliasing ? (this.townCamera.script.create("fxaa"),
    this.worldCamera.script.create("fxaa"),
    this.cameraNX = this.app.root.findByName("Camera")) : (this.townCamera.script.destroy("fxaa"),
    this.worldCamera.script.destroy("fxaa"))
}
,
CameraCommander.prototype.FinalizeCameras = function() {
    this.activeCamera = this.entity.findByTag("TownCamera"),
    this.townCamera = this.app.root.findByTag("TownCamera")[0],
    this.worldCamera = this.app.root.findByTag("WorldCamera")[0],
    this.townCamera.enabled = !1,
    this.worldCamera.enabled = !1,
    this.TownActiveOnly = this.app.root.findByTag("TownActiveOnly"),
    this.WorldActiveOnly = this.app.root.findByTag("WorldActiveOnly"),
    this.townCamera && this.townCameraActive && this.SetTownView(),
    this.worldCamera && this.worldCameraActive && this.SetWorldView(),
    SETTINGS.onAndNow("antiAliasing", (()=>this.UpdateAA())),
    SETTINGS.onAndNow("showShadows", (()=>{
        this.app.root.findByTag("QualityShadow").forEach((t=>t.light.castShadows = SETTINGS.showShadows))
    }
    )),
    SettingsUI.instance.UI.onResize()
}
,
CameraCommander.prototype.SetTownView = function() {
    this.setCamera(this.townCamera);
    for (let t in this.WorldActiveOnly)
        this.WorldActiveOnly[t].enabled = !1;
    for (let t in this.TownActiveOnly)
        this.TownActiveOnly[t].enabled = !0;
    Game.app.applySceneSettings(Game.sceneSettings.Town)
}
,
CameraCommander.prototype.SetWorldView = function() {
    this.setCamera(this.worldCamera);
    for (let t in this.WorldActiveOnly)
        this.WorldActiveOnly[t].enabled = !0;
    for (let t in this.TownActiveOnly)
        this.TownActiveOnly[t].enabled = !1;
    Game.app.applySceneSettings(Game.sceneSettings.World)
}
,
CameraCommander.prototype.setCamera = function(t) {
    this.activeCamera.enabled = !1,
    this.activeCamera = t,
    this.activeCamera.enabled = !0
}
;
var ToolTest = pc.createScript("toolTest");
ToolTest.prototype.initialize = function() {
    this.app.on("DebugTownTapped", this.OutPutProxEffect.bind(this))
}
,
ToolTest.prototype.OutPutProxEffect = function(o) {
    if (!Game.town)
        return;
    const t = Game.town.WorldSpacePositionToLocalGrid(o.point.x, o.point.z)
      , e = Game.town.GetObjectAt(t.x, t.z);
    if (!e)
        return void console.log(`World Space Position ${o.point.x}, ${o.point.z}`);
    const l = Game.town.GetObjectType(t.x, t.z)
      , n = TS_ObjectLogic.GetLogicType(l);
    console.log("-----Town Object Debug Info-----"),
    console.log(`World Space Position ${o.point.x}, ${o.point.z}`),
    console.log(`Town Position ${t.x}, ${t.z}`),
    console.log(`Type : ${l}`),
    console.log("\nProximity Effects:");
    const c = Game.town.GetProximityEffects(t.x, t.z);
    if (c) {
        console.log(`Total Effects On Object: ${Game.town.GetTotalProximityAmount(t.x, t.z)}`);
        let o = "";
        for (let t in c)
            o += `${t}(${c[t]}) `;
        console.log(`Effects On Object: ${o}`)
    } else
        console.log("No Proximity Effects On Object");
    if (console.log("\nLogic Details :"),
    "Storage" == n) {
        console.log("Logic Type : Storage");
        const o = e.GetData();
        let t = 0
          , n = "";
        for (let e in o.storageList)
            n += `${e} : ${o.storageList[e]}\n`,
            t += o.storageList[e];
        console.log(`Storage (${t}/${Game.objectData[l].Capacity}):`),
        console.log(n)
    } else
        "Crafter" == n ? (console.log("Logic Type : Crafter"),
        e.logicObject.craft && console.log(`Negative Prox Penalty : ${e.logicObject.GetCraftProximityPenalty()}`)) : "Trade" == n ? console.log("Logic Type : Trade") : "BuildSite" == n ? console.log("Logic Type : Build Site") : console.log("Base Object Logic");
    console.log(e.GetData()),
    console.log("--------------------------------")
}
;
var ConfirmLoctaionDialog = pc.createScript("confirmLoctaionDialog");
ConfirmLoctaionDialog.prototype.initialize = function() {}
,
ConfirmLoctaionDialog.prototype.OnClick = function(t) {
    return t.stopPropagation(),
    "Button_Confirm" == t.element.entity.name && (this.app.fire("LocationConfirmed", this.worldX - MapDataManager.offset.x, this.worldZ - MapDataManager.offset.z),
    this.parentEntity.enabled = !1),
    "Button_Cancel" == t.element.entity.name && (this.parentEntity.enabled = !1),
    !1
}
,
ConfirmLoctaionDialog.prototype.WorldTouched = function(t) {
    if (Game.TownDataResponseReceived && !Game.town) {
        this.parentEntity.enabled && (this.parentEntity.enabled = !1);
        var n = MapDataManager.getTypeAtPosition(t.point.x, t.point.z);
        if (!UiWatcher.UiOpen() && PhaseManager.instance.phase === PhaseManager.TownLoadPhase && Game.worldObjectData[n] && Game.worldObjectData[n].TownOk) {
            let n = parseInt(Math.round(t.point.x))
              , a = parseInt(Math.round(t.point.z));
            if (Game.world.towns[[n, a + 255]])
                return;
            console.log(`townok ${this.parentEntity.name}`),
            this.parentEntity.enabled = !0,
            this.worldX = n,
            this.worldZ = a
        }
    }
}
;
var LoadTownFromJson = pc.createScript("loadTownFromJson");
LoadTownFromJson.prototype.initialize = function() {}
,
LoadTownFromJson.prototype.update = function(e) {}
,
LoadTownFromJson.attributes.add("objectSize", {
    type: "number",
    default: 5
}),
LoadTownFromJson.attributes.add("xOffset", {
    type: "number",
    default: -500
}),
LoadTownFromJson.attributes.add("zOffset", {
    type: "number",
    default: 0
}),
LoadTownFromJson.prototype.initialize = function() {
    this.app.on("TownDataLoadComplete", this.newLoad.bind(this)),
    this.app.on("ObjectLoaded", this.onObjectLoaded.bind(this))
}
,
LoadTownFromJson.prototype.onObjectLoaded = function(e, a, t, o) {}
,
LoadTownFromJson.prototype.newLoad = function(e, a, t) {
    const o = Game.position.x
      , n = Game.position.y
      , p = (Game.name,
    MapDataManager.getTypeAtPosition(o, n, !1));
    Game.town = new TS_Town;
    var r = [MapDataManager.getTypeAtPosition(o - 1, n - 1, !1), MapDataManager.getTypeAtPosition(o, n - 1, !1), MapDataManager.getTypeAtPosition(o + 1, n - 1, !1), MapDataManager.getTypeAtPosition(o - 1, n, !1), MapDataManager.getTypeAtPosition(o + 1, n, !1), MapDataManager.getTypeAtPosition(o - 1, n + 1, !1), MapDataManager.getTypeAtPosition(o, n + 1, !1), MapDataManager.getTypeAtPosition(o + 1, n + 1, !1)];
    let i = "P";
    if ("Desert" == p ? i = "D" : "Forest" == p && (i = "F"),
    Game.town.worldType = p,
    Game.town.groundBase = `Ground_${i}_`,
    Game.town.SuperTiles = r,
    e)
        Game.town.Load(e),
        Game.app.fire("GameReady");
    else {
        let e = "north";
        "WorldOpen" == Game.worldObjectData[r[1]].NavType ? e = "north" : "WorldOpen" == Game.worldObjectData[r[4]].NavType ? e = "east" : "WorldOpen" == Game.worldObjectData[r[6]].NavType ? e = "south" : "WorldOpen" == Game.worldObjectData[r[3]].NavType && (e = "west"),
        a && (e = t);
        let o = Game.startMap[p][e];
        if (a)
            for (let e in o)
                "Trade_Depot" == o[e].type && (o[e].type = "Trade_Pier");
        Game.town.Load(o),
        Game.town.GeneratePathingNodes(),
        Game.saveAll(),
        Game.app.fire("NewTownLoaded"),
        Game.app.fire("GameReady")
    }
    API.getTrades().then((e=>{
        Game.town.tradesList = e,
        this.app.fire("TownMapLoadComplete")
    }
    ))
}
;
var TempTesting = pc.createScript("tempTesting");
TempTesting.attributes.add("jsonFile", {
    type: "asset",
    assetType: "json"
}),
TempTesting.prototype.initialize = function() {
    console.log(`${this.jsonFile.resource[0]}`),
    console.log(`${this.jsonFile.resource[1]}`),
    console.log(`${this.jsonFile.resource[2]}`),
    console.log(`${this.jsonFile.resource[3].Alone}`)
}
,
TempTesting.prototype.update = function(e) {}
;
var WorldObjectLogic = pc.createScript("worldObjectLogic");
WorldObjectLogic.prototype.initialize = function() {
    console.log("worldObjectLogic created at " + this.entity.getPosition())
}
,
WorldObjectLogic.prototype.update = function(t) {}
;
var RandomRotateOntownLoad = pc.createScript("randomRotateOntownLoad");
RandomRotateOntownLoad.prototype.initialize = function() {
    this.app.on("TownLoadComplete", this.TownLoadComplete.bind(this))
}
,
RandomRotateOntownLoad.prototype.TownLoadComplete = function(o) {
    var t = Math.floor(4 * Math.random());
    this.entity.rotate(0, 90 * t, 0)
}
;
var OutputOnspawn = pc.createScript("outputOnspawn");
OutputOnspawn.prototype.initialize = function() {
    console.log("Object Spawned")
}
,
OutputOnspawn.prototype.update = function(t) {}
;
// msgpack.min.js
!function(t) {
    if ("object" == typeof exports && "undefined" != typeof module)
        module.exports = t();
    else if ("function" == typeof define && define.amd)
        define([], t);
    else {
        var r;
        r = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this,
        r.msgpack = t()
    }
}(function() {
    return function t(r, e, n) {
        function i(f, u) {
            if (!e[f]) {
                if (!r[f]) {
                    var a = "function" == typeof require && require;
                    if (!u && a)
                        return a(f, !0);
                    if (o)
                        return o(f, !0);
                    var s = new Error("Cannot find module '" + f + "'");
                    throw s.code = "MODULE_NOT_FOUND",
                    s
                }
                var c = e[f] = {
                    exports: {}
                };
                r[f][0].call(c.exports, function(t) {
                    var e = r[f][1][t];
                    return i(e ? e : t)
                }, c, c.exports, t, r, e, n)
            }
            return e[f].exports
        }
        for (var o = "function" == typeof require && require, f = 0; f < n.length; f++)
            i(n[f]);
        return i
    }({
        1: [function(t, r, e) {
            e.encode = t("./encode").encode,
            e.decode = t("./decode").decode,
            e.Encoder = t("./encoder").Encoder,
            e.Decoder = t("./decoder").Decoder,
            e.createCodec = t("./ext").createCodec,
            e.codec = t("./codec").codec
        }
        , {
            "./codec": 10,
            "./decode": 12,
            "./decoder": 13,
            "./encode": 15,
            "./encoder": 16,
            "./ext": 20
        }],
        2: [function(t, r, e) {
            (function(Buffer) {
                function t(t) {
                    return t && t.isBuffer && t
                }
                r.exports = t("undefined" != typeof Buffer && Buffer) || t(this.Buffer) || t("undefined" != typeof window && window.Buffer) || this.Buffer
            }
            ).call(this, t("buffer").Buffer)
        }
        , {
            buffer: 29
        }],
        3: [function(t, r, e) {
            function n(t, r) {
                for (var e = this, n = r || (r |= 0), i = t.length, o = 0, f = 0; f < i; )
                    o = t.charCodeAt(f++),
                    o < 128 ? e[n++] = o : o < 2048 ? (e[n++] = 192 | o >>> 6,
                    e[n++] = 128 | 63 & o) : o < 55296 || o > 57343 ? (e[n++] = 224 | o >>> 12,
                    e[n++] = 128 | o >>> 6 & 63,
                    e[n++] = 128 | 63 & o) : (o = (o - 55296 << 10 | t.charCodeAt(f++) - 56320) + 65536,
                    e[n++] = 240 | o >>> 18,
                    e[n++] = 128 | o >>> 12 & 63,
                    e[n++] = 128 | o >>> 6 & 63,
                    e[n++] = 128 | 63 & o);
                return n - r
            }
            function i(t, r, e) {
                var n = this
                  , i = 0 | r;
                e || (e = n.length);
                for (var o = "", f = 0; i < e; )
                    f = n[i++],
                    f < 128 ? o += String.fromCharCode(f) : (192 === (224 & f) ? f = (31 & f) << 6 | 63 & n[i++] : 224 === (240 & f) ? f = (15 & f) << 12 | (63 & n[i++]) << 6 | 63 & n[i++] : 240 === (248 & f) && (f = (7 & f) << 18 | (63 & n[i++]) << 12 | (63 & n[i++]) << 6 | 63 & n[i++]),
                    f >= 65536 ? (f -= 65536,
                    o += String.fromCharCode((f >>> 10) + 55296, (1023 & f) + 56320)) : o += String.fromCharCode(f));
                return o
            }
            function o(t, r, e, n) {
                var i;
                e || (e = 0),
                n || 0 === n || (n = this.length),
                r || (r = 0);
                var o = n - e;
                if (t === this && e < r && r < n)
                    for (i = o - 1; i >= 0; i--)
                        t[i + r] = this[i + e];
                else
                    for (i = 0; i < o; i++)
                        t[i + r] = this[i + e];
                return o
            }
            e.copy = o,
            e.toString = i,
            e.write = n
        }
        , {}],
        4: [function(t, r, e) {
            function n(t) {
                return new Array(t)
            }
            function i(t) {
                if (!o.isBuffer(t) && o.isView(t))
                    t = o.Uint8Array.from(t);
                else if (o.isArrayBuffer(t))
                    t = new Uint8Array(t);
                else {
                    if ("string" == typeof t)
                        return o.from.call(e, t);
                    if ("number" == typeof t)
                        throw new TypeError('"value" argument must not be a number')
                }
                return Array.prototype.slice.call(t)
            }
            var o = t("./bufferish")
              , e = r.exports = n(0);
            e.alloc = n,
            e.concat = o.concat,
            e.from = i
        }
        , {
            "./bufferish": 8
        }],
        5: [function(t, r, e) {
            function n(t) {
                return new Buffer(t)
            }
            function i(t) {
                if (!o.isBuffer(t) && o.isView(t))
                    t = o.Uint8Array.from(t);
                else if (o.isArrayBuffer(t))
                    t = new Uint8Array(t);
                else {
                    if ("string" == typeof t)
                        return o.from.call(e, t);
                    if ("number" == typeof t)
                        throw new TypeError('"value" argument must not be a number')
                }
                return Buffer.from && 1 !== Buffer.from.length ? Buffer.from(t) : new Buffer(t)
            }
            var o = t("./bufferish")
              , Buffer = o.global
              , e = r.exports = o.hasBuffer ? n(0) : [];
            e.alloc = o.hasBuffer && Buffer.alloc || n,
            e.concat = o.concat,
            e.from = i
        }
        , {
            "./bufferish": 8
        }],
        6: [function(t, r, e) {
            function n(t, r, e, n) {
                var o = a.isBuffer(this)
                  , f = a.isBuffer(t);
                if (o && f)
                    return this.copy(t, r, e, n);
                if (c || o || f || !a.isView(this) || !a.isView(t))
                    return u.copy.call(this, t, r, e, n);
                var s = e || null != n ? i.call(this, e, n) : this;
                return t.set(s, r),
                s.length
            }
            function i(t, r) {
                var e = this.slice || !c && this.subarray;
                if (e)
                    return e.call(this, t, r);
                var i = a.alloc.call(this, r - t);
                return n.call(this, i, 0, t, r),
                i
            }
            function o(t, r, e) {
                var n = !s && a.isBuffer(this) ? this.toString : u.toString;
                return n.apply(this, arguments)
            }
            function f(t) {
                function r() {
                    var r = this[t] || u[t];
                    return r.apply(this, arguments)
                }
                return r
            }
            var u = t("./buffer-lite");
            e.copy = n,
            e.slice = i,
            e.toString = o,
            e.write = f("write");
            var a = t("./bufferish")
              , Buffer = a.global
              , s = a.hasBuffer && "TYPED_ARRAY_SUPPORT"in Buffer
              , c = s && !Buffer.TYPED_ARRAY_SUPPORT
        }
        , {
            "./buffer-lite": 3,
            "./bufferish": 8
        }],
        7: [function(t, r, e) {
            function n(t) {
                return new Uint8Array(t)
            }
            function i(t) {
                if (o.isView(t)) {
                    var r = t.byteOffset
                      , n = t.byteLength;
                    t = t.buffer,
                    t.byteLength !== n && (t.slice ? t = t.slice(r, r + n) : (t = new Uint8Array(t),
                    t.byteLength !== n && (t = Array.prototype.slice.call(t, r, r + n))))
                } else {
                    if ("string" == typeof t)
                        return o.from.call(e, t);
                    if ("number" == typeof t)
                        throw new TypeError('"value" argument must not be a number')
                }
                return new Uint8Array(t)
            }
            var o = t("./bufferish")
              , e = r.exports = o.hasArrayBuffer ? n(0) : [];
            e.alloc = n,
            e.concat = o.concat,
            e.from = i
        }
        , {
            "./bufferish": 8
        }],
        8: [function(t, r, e) {
            function n(t) {
                return "string" == typeof t ? u.call(this, t) : a(this).from(t)
            }
            function i(t) {
                return a(this).alloc(t)
            }
            function o(t, r) {
                function n(t) {
                    r += t.length
                }
                function o(t) {
                    a += w.copy.call(t, u, a)
                }
                r || (r = 0,
                Array.prototype.forEach.call(t, n));
                var f = this !== e && this || t[0]
                  , u = i.call(f, r)
                  , a = 0;
                return Array.prototype.forEach.call(t, o),
                u
            }
            function f(t) {
                return t instanceof ArrayBuffer || E(t)
            }
            function u(t) {
                var r = 3 * t.length
                  , e = i.call(this, r)
                  , n = w.write.call(e, t);
                return r !== n && (e = w.slice.call(e, 0, n)),
                e
            }
            function a(t) {
                return d(t) ? g : y(t) ? b : p(t) ? v : h ? g : l ? b : v
            }
            function s() {
                return !1
            }
            function c(t, r) {
                return t = "[object " + t + "]",
                function(e) {
                    return null != e && {}.toString.call(r ? e[r] : e) === t
                }
            }
            var Buffer = e.global = t("./buffer-global")
              , h = e.hasBuffer = Buffer && !!Buffer.isBuffer
              , l = e.hasArrayBuffer = "undefined" != typeof ArrayBuffer
              , p = e.isArray = t("isarray");
            e.isArrayBuffer = l ? f : s;
            var d = e.isBuffer = h ? Buffer.isBuffer : s
              , y = e.isView = l ? ArrayBuffer.isView || c("ArrayBuffer", "buffer") : s;
            e.alloc = i,
            e.concat = o,
            e.from = n;
            var v = e.Array = t("./bufferish-array")
              , g = e.Buffer = t("./bufferish-buffer")
              , b = e.Uint8Array = t("./bufferish-uint8array")
              , w = e.prototype = t("./bufferish-proto")
              , E = c("ArrayBuffer")
        }
        , {
            "./buffer-global": 2,
            "./bufferish-array": 4,
            "./bufferish-buffer": 5,
            "./bufferish-proto": 6,
            "./bufferish-uint8array": 7,
            isarray: 34
        }],
        9: [function(t, r, e) {
            function n(t) {
                return this instanceof n ? (this.options = t,
                void this.init()) : new n(t)
            }
            function i(t) {
                for (var r in t)
                    n.prototype[r] = o(n.prototype[r], t[r])
            }
            function o(t, r) {
                function e() {
                    return t.apply(this, arguments),
                    r.apply(this, arguments)
                }
                return t && r ? e : t || r
            }
            function f(t) {
                function r(t, r) {
                    return r(t)
                }
                return t = t.slice(),
                function(e) {
                    return t.reduce(r, e)
                }
            }
            function u(t) {
                return s(t) ? f(t) : t
            }
            function a(t) {
                return new n(t)
            }
            var s = t("isarray");
            e.createCodec = a,
            e.install = i,
            e.filter = u;
            var c = t("./bufferish");
            n.prototype.init = function() {
                var t = this.options;
                return t && t.uint8array && (this.bufferish = c.Uint8Array),
                this
            }
            ,
            e.preset = a({
                preset: !0
            })
        }
        , {
            "./bufferish": 8,
            isarray: 34
        }],
        10: [function(t, r, e) {
            t("./read-core"),
            t("./write-core"),
            e.codec = {
                preset: t("./codec-base").preset
            }
        }
        , {
            "./codec-base": 9,
            "./read-core": 22,
            "./write-core": 25
        }],
        11: [function(t, r, e) {
            function n(t) {
                if (!(this instanceof n))
                    return new n(t);
                if (t && (this.options = t,
                t.codec)) {
                    var r = this.codec = t.codec;
                    r.bufferish && (this.bufferish = r.bufferish)
                }
            }
            e.DecodeBuffer = n;
            var i = t("./read-core").preset
              , o = t("./flex-buffer").FlexDecoder;
            o.mixin(n.prototype),
            n.prototype.codec = i,
            n.prototype.fetch = function() {
                return this.codec.decode(this)
            }
        }
        , {
            "./flex-buffer": 21,
            "./read-core": 22
        }],
        12: [function(t, r, e) {
            function n(t, r) {
                var e = new i(r);
                return e.write(t),
                e.read()
            }
            e.decode = n;
            var i = t("./decode-buffer").DecodeBuffer
        }
        , {
            "./decode-buffer": 11
        }],
        13: [function(t, r, e) {
            function n(t) {
                return this instanceof n ? void o.call(this, t) : new n(t)
            }
            e.Decoder = n;
            var i = t("event-lite")
              , o = t("./decode-buffer").DecodeBuffer;
            n.prototype = new o,
            i.mixin(n.prototype),
            n.prototype.decode = function(t) {
                arguments.length && this.write(t),
                this.flush()
            }
            ,
            n.prototype.push = function(t) {
                this.emit("data", t)
            }
            ,
            n.prototype.end = function(t) {
                this.decode(t),
                this.emit("end")
            }
        }
        , {
            "./decode-buffer": 11,
            "event-lite": 31
        }],
        14: [function(t, r, e) {
            function n(t) {
                if (!(this instanceof n))
                    return new n(t);
                if (t && (this.options = t,
                t.codec)) {
                    var r = this.codec = t.codec;
                    r.bufferish && (this.bufferish = r.bufferish)
                }
            }
            e.EncodeBuffer = n;
            var i = t("./write-core").preset
              , o = t("./flex-buffer").FlexEncoder;
            o.mixin(n.prototype),
            n.prototype.codec = i,
            n.prototype.write = function(t) {
                this.codec.encode(this, t)
            }
        }
        , {
            "./flex-buffer": 21,
            "./write-core": 25
        }],
        15: [function(t, r, e) {
            function n(t, r) {
                var e = new i(r);
                return e.write(t),
                e.read()
            }
            e.encode = n;
            var i = t("./encode-buffer").EncodeBuffer
        }
        , {
            "./encode-buffer": 14
        }],
        16: [function(t, r, e) {
            function n(t) {
                return this instanceof n ? void o.call(this, t) : new n(t)
            }
            e.Encoder = n;
            var i = t("event-lite")
              , o = t("./encode-buffer").EncodeBuffer;
            n.prototype = new o,
            i.mixin(n.prototype),
            n.prototype.encode = function(t) {
                this.write(t),
                this.emit("data", this.read())
            }
            ,
            n.prototype.end = function(t) {
                arguments.length && this.encode(t),
                this.flush(),
                this.emit("end")
            }
        }
        , {
            "./encode-buffer": 14,
            "event-lite": 31
        }],
        17: [function(t, r, e) {
            function n(t, r) {
                return this instanceof n ? (this.buffer = i.from(t),
                void (this.type = r)) : new n(t,r)
            }
            e.ExtBuffer = n;
            var i = t("./bufferish")
        }
        , {
            "./bufferish": 8
        }],
        18: [function(t, r, e) {
            function n(t) {
                t.addExtPacker(14, Error, [u, i]),
                t.addExtPacker(1, EvalError, [u, i]),
                t.addExtPacker(2, RangeError, [u, i]),
                t.addExtPacker(3, ReferenceError, [u, i]),
                t.addExtPacker(4, SyntaxError, [u, i]),
                t.addExtPacker(5, TypeError, [u, i]),
                t.addExtPacker(6, URIError, [u, i]),
                t.addExtPacker(10, RegExp, [f, i]),
                t.addExtPacker(11, Boolean, [o, i]),
                t.addExtPacker(12, String, [o, i]),
                t.addExtPacker(13, Date, [Number, i]),
                t.addExtPacker(15, Number, [o, i]),
                "undefined" != typeof Uint8Array && (t.addExtPacker(17, Int8Array, c),
                t.addExtPacker(18, Uint8Array, c),
                t.addExtPacker(19, Int16Array, c),
                t.addExtPacker(20, Uint16Array, c),
                t.addExtPacker(21, Int32Array, c),
                t.addExtPacker(22, Uint32Array, c),
                t.addExtPacker(23, Float32Array, c),
                "undefined" != typeof Float64Array && t.addExtPacker(24, Float64Array, c),
                "undefined" != typeof Uint8ClampedArray && t.addExtPacker(25, Uint8ClampedArray, c),
                t.addExtPacker(26, ArrayBuffer, c),
                t.addExtPacker(29, DataView, c)),
                s.hasBuffer && t.addExtPacker(27, Buffer, s.from)
            }
            function i(r) {
                return a || (a = t("./encode").encode),
                a(r)
            }
            function o(t) {
                return t.valueOf()
            }
            function f(t) {
                t = RegExp.prototype.toString.call(t).split("/"),
                t.shift();
                var r = [t.pop()];
                return r.unshift(t.join("/")),
                r
            }
            function u(t) {
                var r = {};
                for (var e in h)
                    r[e] = t[e];
                return r
            }
            e.setExtPackers = n;
            var a, s = t("./bufferish"), Buffer = s.global, c = s.Uint8Array.from, h = {
                name: 1,
                message: 1,
                stack: 1,
                columnNumber: 1,
                fileName: 1,
                lineNumber: 1
            }
        }
        , {
            "./bufferish": 8,
            "./encode": 15
        }],
        19: [function(t, r, e) {
            function n(t) {
                t.addExtUnpacker(14, [i, f(Error)]),
                t.addExtUnpacker(1, [i, f(EvalError)]),
                t.addExtUnpacker(2, [i, f(RangeError)]),
                t.addExtUnpacker(3, [i, f(ReferenceError)]),
                t.addExtUnpacker(4, [i, f(SyntaxError)]),
                t.addExtUnpacker(5, [i, f(TypeError)]),
                t.addExtUnpacker(6, [i, f(URIError)]),
                t.addExtUnpacker(10, [i, o]),
                t.addExtUnpacker(11, [i, u(Boolean)]),
                t.addExtUnpacker(12, [i, u(String)]),
                t.addExtUnpacker(13, [i, u(Date)]),
                t.addExtUnpacker(15, [i, u(Number)]),
                "undefined" != typeof Uint8Array && (t.addExtUnpacker(17, u(Int8Array)),
                t.addExtUnpacker(18, u(Uint8Array)),
                t.addExtUnpacker(19, [a, u(Int16Array)]),
                t.addExtUnpacker(20, [a, u(Uint16Array)]),
                t.addExtUnpacker(21, [a, u(Int32Array)]),
                t.addExtUnpacker(22, [a, u(Uint32Array)]),
                t.addExtUnpacker(23, [a, u(Float32Array)]),
                "undefined" != typeof Float64Array && t.addExtUnpacker(24, [a, u(Float64Array)]),
                "undefined" != typeof Uint8ClampedArray && t.addExtUnpacker(25, u(Uint8ClampedArray)),
                t.addExtUnpacker(26, a),
                t.addExtUnpacker(29, [a, u(DataView)])),
                c.hasBuffer && t.addExtUnpacker(27, u(Buffer))
            }
            function i(r) {
                return s || (s = t("./decode").decode),
                s(r)
            }
            function o(t) {
                return RegExp.apply(null, t)
            }
            function f(t) {
                return function(r) {
                    var e = new t;
                    for (var n in h)
                        e[n] = r[n];
                    return e
                }
            }
            function u(t) {
                return function(r) {
                    return new t(r)
                }
            }
            function a(t) {
                return new Uint8Array(t).buffer
            }
            e.setExtUnpackers = n;
            var s, c = t("./bufferish"), Buffer = c.global, h = {
                name: 1,
                message: 1,
                stack: 1,
                columnNumber: 1,
                fileName: 1,
                lineNumber: 1
            }
        }
        , {
            "./bufferish": 8,
            "./decode": 12
        }],
        20: [function(t, r, e) {
            t("./read-core"),
            t("./write-core"),
            e.createCodec = t("./codec-base").createCodec
        }
        , {
            "./codec-base": 9,
            "./read-core": 22,
            "./write-core": 25
        }],
        21: [function(t, r, e) {
            function n() {
                if (!(this instanceof n))
                    return new n
            }
            function i() {
                if (!(this instanceof i))
                    return new i
            }
            function o() {
                function t(t) {
                    var r = this.offset ? p.prototype.slice.call(this.buffer, this.offset) : this.buffer;
                    this.buffer = r ? t ? this.bufferish.concat([r, t]) : r : t,
                    this.offset = 0
                }
                function r() {
                    for (; this.offset < this.buffer.length; ) {
                        var t, r = this.offset;
                        try {
                            t = this.fetch()
                        } catch (t) {
                            if (t && t.message != v)
                                throw t;
                            this.offset = r;
                            break
                        }
                        this.push(t)
                    }
                }
                function e(t) {
                    var r = this.offset
                      , e = r + t;
                    if (e > this.buffer.length)
                        throw new Error(v);
                    return this.offset = e,
                    r
                }
                return {
                    bufferish: p,
                    write: t,
                    fetch: a,
                    flush: r,
                    push: c,
                    pull: h,
                    read: s,
                    reserve: e,
                    offset: 0
                }
            }
            function f() {
                function t() {
                    var t = this.start;
                    if (t < this.offset) {
                        var r = this.start = this.offset;
                        return p.prototype.slice.call(this.buffer, t, r)
                    }
                }
                function r() {
                    for (; this.start < this.offset; ) {
                        var t = this.fetch();
                        t && this.push(t)
                    }
                }
                function e() {
                    var t = this.buffers || (this.buffers = [])
                      , r = t.length > 1 ? this.bufferish.concat(t) : t[0];
                    return t.length = 0,
                    r
                }
                function n(t) {
                    var r = 0 | t;
                    if (this.buffer) {
                        var e = this.buffer.length
                          , n = 0 | this.offset
                          , i = n + r;
                        if (i < e)
                            return this.offset = i,
                            n;
                        this.flush(),
                        t = Math.max(t, Math.min(2 * e, this.maxBufferSize))
                    }
                    return t = Math.max(t, this.minBufferSize),
                    this.buffer = this.bufferish.alloc(t),
                    this.start = 0,
                    this.offset = r,
                    0
                }
                function i(t) {
                    var r = t.length;
                    if (r > this.minBufferSize)
                        this.flush(),
                        this.push(t);
                    else {
                        var e = this.reserve(r);
                        p.prototype.copy.call(t, this.buffer, e)
                    }
                }
                return {
                    bufferish: p,
                    write: u,
                    fetch: t,
                    flush: r,
                    push: c,
                    pull: e,
                    read: s,
                    reserve: n,
                    send: i,
                    maxBufferSize: y,
                    minBufferSize: d,
                    offset: 0,
                    start: 0
                }
            }
            function u() {
                throw new Error("method not implemented: write()")
            }
            function a() {
                throw new Error("method not implemented: fetch()")
            }
            function s() {
                var t = this.buffers && this.buffers.length;
                return t ? (this.flush(),
                this.pull()) : this.fetch()
            }
            function c(t) {
                var r = this.buffers || (this.buffers = []);
                r.push(t)
            }
            function h() {
                var t = this.buffers || (this.buffers = []);
                return t.shift()
            }
            function l(t) {
                function r(r) {
                    for (var e in t)
                        r[e] = t[e];
                    return r
                }
                return r
            }
            e.FlexDecoder = n,
            e.FlexEncoder = i;
            var p = t("./bufferish")
              , d = 2048
              , y = 65536
              , v = "BUFFER_SHORTAGE";
            n.mixin = l(o()),
            n.mixin(n.prototype),
            i.mixin = l(f()),
            i.mixin(i.prototype)
        }
        , {
            "./bufferish": 8
        }],
        22: [function(t, r, e) {
            function n(t) {
                function r(t) {
                    var r = s(t)
                      , n = e[r];
                    if (!n)
                        throw new Error("Invalid type: " + (r ? "0x" + r.toString(16) : r));
                    return n(t)
                }
                var e = c.getReadToken(t);
                return r
            }
            function i() {
                var t = this.options;
                return this.decode = n(t),
                t && t.preset && a.setExtUnpackers(this),
                this
            }
            function o(t, r) {
                var e = this.extUnpackers || (this.extUnpackers = []);
                e[t] = h.filter(r)
            }
            function f(t) {
                function r(r) {
                    return new u(r,t)
                }
                var e = this.extUnpackers || (this.extUnpackers = []);
                return e[t] || r
            }
            var u = t("./ext-buffer").ExtBuffer
              , a = t("./ext-unpacker")
              , s = t("./read-format").readUint8
              , c = t("./read-token")
              , h = t("./codec-base");
            h.install({
                addExtUnpacker: o,
                getExtUnpacker: f,
                init: i
            }),
            e.preset = i.call(h.preset)
        }
        , {
            "./codec-base": 9,
            "./ext-buffer": 17,
            "./ext-unpacker": 19,
            "./read-format": 23,
            "./read-token": 24
        }],
        23: [function(t, r, e) {
            function n(t) {
                var r = k.hasArrayBuffer && t && t.binarraybuffer
                  , e = t && t.int64
                  , n = T && t && t.usemap
                  , B = {
                    map: n ? o : i,
                    array: f,
                    str: u,
                    bin: r ? s : a,
                    ext: c,
                    uint8: h,
                    uint16: p,
                    uint32: y,
                    uint64: g(8, e ? E : b),
                    int8: l,
                    int16: d,
                    int32: v,
                    int64: g(8, e ? A : w),
                    float32: g(4, m),
                    float64: g(8, x)
                };
                return B
            }
            function i(t, r) {
                var e, n = {}, i = new Array(r), o = new Array(r), f = t.codec.decode;
                for (e = 0; e < r; e++)
                    i[e] = f(t),
                    o[e] = f(t);
                for (e = 0; e < r; e++)
                    n[i[e]] = o[e];
                return n
            }
            function o(t, r) {
                var e, n = new Map, i = new Array(r), o = new Array(r), f = t.codec.decode;
                for (e = 0; e < r; e++)
                    i[e] = f(t),
                    o[e] = f(t);
                for (e = 0; e < r; e++)
                    n.set(i[e], o[e]);
                return n
            }
            function f(t, r) {
                for (var e = new Array(r), n = t.codec.decode, i = 0; i < r; i++)
                    e[i] = n(t);
                return e
            }
            function u(t, r) {
                var e = t.reserve(r)
                  , n = e + r;
                return _.toString.call(t.buffer, "utf-8", e, n)
            }
            function a(t, r) {
                var e = t.reserve(r)
                  , n = e + r
                  , i = _.slice.call(t.buffer, e, n);
                return k.from(i)
            }
            function s(t, r) {
                var e = t.reserve(r)
                  , n = e + r
                  , i = _.slice.call(t.buffer, e, n);
                return k.Uint8Array.from(i).buffer
            }
            function c(t, r) {
                var e = t.reserve(r + 1)
                  , n = t.buffer[e++]
                  , i = e + r
                  , o = t.codec.getExtUnpacker(n);
                if (!o)
                    throw new Error("Invalid ext type: " + (n ? "0x" + n.toString(16) : n));
                var f = _.slice.call(t.buffer, e, i);
                return o(f)
            }
            function h(t) {
                var r = t.reserve(1);
                return t.buffer[r]
            }
            function l(t) {
                var r = t.reserve(1)
                  , e = t.buffer[r];
                return 128 & e ? e - 256 : e
            }
            function p(t) {
                var r = t.reserve(2)
                  , e = t.buffer;
                return e[r++] << 8 | e[r]
            }
            function d(t) {
                var r = t.reserve(2)
                  , e = t.buffer
                  , n = e[r++] << 8 | e[r];
                return 32768 & n ? n - 65536 : n
            }
            function y(t) {
                var r = t.reserve(4)
                  , e = t.buffer;
                return 16777216 * e[r++] + (e[r++] << 16) + (e[r++] << 8) + e[r]
            }
            function v(t) {
                var r = t.reserve(4)
                  , e = t.buffer;
                return e[r++] << 24 | e[r++] << 16 | e[r++] << 8 | e[r]
            }
            function g(t, r) {
                return function(e) {
                    var n = e.reserve(t);
                    return r.call(e.buffer, n, S)
                }
            }
            function b(t) {
                return new P(this,t).toNumber()
            }
            function w(t) {
                return new R(this,t).toNumber()
            }
            function E(t) {
                return new P(this,t)
            }
            function A(t) {
                return new R(this,t)
            }
            function m(t) {
                return B.read(this, t, !1, 23, 4)
            }
            function x(t) {
                return B.read(this, t, !1, 52, 8)
            }
            var B = t("ieee754")
              , U = t("int64-buffer")
              , P = U.Uint64BE
              , R = U.Int64BE;
            e.getReadFormat = n,
            e.readUint8 = h;
            var k = t("./bufferish")
              , _ = t("./bufferish-proto")
              , T = "undefined" != typeof Map
              , S = !0
        }
        , {
            "./bufferish": 8,
            "./bufferish-proto": 6,
            ieee754: 32,
            "int64-buffer": 33
        }],
        24: [function(t, r, e) {
            function n(t) {
                var r = s.getReadFormat(t);
                return t && t.useraw ? o(r) : i(r)
            }
            function i(t) {
                var r, e = new Array(256);
                for (r = 0; r <= 127; r++)
                    e[r] = f(r);
                for (r = 128; r <= 143; r++)
                    e[r] = a(r - 128, t.map);
                for (r = 144; r <= 159; r++)
                    e[r] = a(r - 144, t.array);
                for (r = 160; r <= 191; r++)
                    e[r] = a(r - 160, t.str);
                for (e[192] = f(null),
                e[193] = null,
                e[194] = f(!1),
                e[195] = f(!0),
                e[196] = u(t.uint8, t.bin),
                e[197] = u(t.uint16, t.bin),
                e[198] = u(t.uint32, t.bin),
                e[199] = u(t.uint8, t.ext),
                e[200] = u(t.uint16, t.ext),
                e[201] = u(t.uint32, t.ext),
                e[202] = t.float32,
                e[203] = t.float64,
                e[204] = t.uint8,
                e[205] = t.uint16,
                e[206] = t.uint32,
                e[207] = t.uint64,
                e[208] = t.int8,
                e[209] = t.int16,
                e[210] = t.int32,
                e[211] = t.int64,
                e[212] = a(1, t.ext),
                e[213] = a(2, t.ext),
                e[214] = a(4, t.ext),
                e[215] = a(8, t.ext),
                e[216] = a(16, t.ext),
                e[217] = u(t.uint8, t.str),
                e[218] = u(t.uint16, t.str),
                e[219] = u(t.uint32, t.str),
                e[220] = u(t.uint16, t.array),
                e[221] = u(t.uint32, t.array),
                e[222] = u(t.uint16, t.map),
                e[223] = u(t.uint32, t.map),
                r = 224; r <= 255; r++)
                    e[r] = f(r - 256);
                return e
            }
            function o(t) {
                var r, e = i(t).slice();
                for (e[217] = e[196],
                e[218] = e[197],
                e[219] = e[198],
                r = 160; r <= 191; r++)
                    e[r] = a(r - 160, t.bin);
                return e
            }
            function f(t) {
                return function() {
                    return t
                }
            }
            function u(t, r) {
                return function(e) {
                    var n = t(e);
                    return r(e, n)
                }
            }
            function a(t, r) {
                return function(e) {
                    return r(e, t)
                }
            }
            var s = t("./read-format");
            e.getReadToken = n
        }
        , {
            "./read-format": 23
        }],
        25: [function(t, r, e) {
            function n(t) {
                function r(t, r) {
                    var n = e[typeof r];
                    if (!n)
                        throw new Error('Unsupported type "' + typeof r + '": ' + r);
                    n(t, r)
                }
                var e = s.getWriteType(t);
                return r
            }
            function i() {
                var t = this.options;
                return this.encode = n(t),
                t && t.preset && a.setExtPackers(this),
                this
            }
            function o(t, r, e) {
                function n(r) {
                    return e && (r = e(r)),
                    new u(r,t)
                }
                e = c.filter(e);
                var i = r.name;
                if (i && "Object" !== i) {
                    var o = this.extPackers || (this.extPackers = {});
                    o[i] = n
                } else {
                    var f = this.extEncoderList || (this.extEncoderList = []);
                    f.unshift([r, n])
                }
            }
            function f(t) {
                var r = this.extPackers || (this.extPackers = {})
                  , e = t.constructor
                  , n = e && e.name && r[e.name];
                if (n)
                    return n;
                for (var i = this.extEncoderList || (this.extEncoderList = []), o = i.length, f = 0; f < o; f++) {
                    var u = i[f];
                    if (e === u[0])
                        return u[1]
                }
            }
            var u = t("./ext-buffer").ExtBuffer
              , a = t("./ext-packer")
              , s = t("./write-type")
              , c = t("./codec-base");
            c.install({
                addExtPacker: o,
                getExtPacker: f,
                init: i
            }),
            e.preset = i.call(c.preset)
        }
        , {
            "./codec-base": 9,
            "./ext-buffer": 17,
            "./ext-packer": 18,
            "./write-type": 27
        }],
        26: [function(t, r, e) {
            function n(t) {
                return t && t.uint8array ? i() : m || E.hasBuffer && t && t.safe ? f() : o()
            }
            function i() {
                var t = o();
                return t[202] = c(202, 4, p),
                t[203] = c(203, 8, d),
                t
            }
            function o() {
                var t = w.slice();
                return t[196] = u(196),
                t[197] = a(197),
                t[198] = s(198),
                t[199] = u(199),
                t[200] = a(200),
                t[201] = s(201),
                t[202] = c(202, 4, x.writeFloatBE || p, !0),
                t[203] = c(203, 8, x.writeDoubleBE || d, !0),
                t[204] = u(204),
                t[205] = a(205),
                t[206] = s(206),
                t[207] = c(207, 8, h),
                t[208] = u(208),
                t[209] = a(209),
                t[210] = s(210),
                t[211] = c(211, 8, l),
                t[217] = u(217),
                t[218] = a(218),
                t[219] = s(219),
                t[220] = a(220),
                t[221] = s(221),
                t[222] = a(222),
                t[223] = s(223),
                t
            }
            function f() {
                var t = w.slice();
                return t[196] = c(196, 1, Buffer.prototype.writeUInt8),
                t[197] = c(197, 2, Buffer.prototype.writeUInt16BE),
                t[198] = c(198, 4, Buffer.prototype.writeUInt32BE),
                t[199] = c(199, 1, Buffer.prototype.writeUInt8),
                t[200] = c(200, 2, Buffer.prototype.writeUInt16BE),
                t[201] = c(201, 4, Buffer.prototype.writeUInt32BE),
                t[202] = c(202, 4, Buffer.prototype.writeFloatBE),
                t[203] = c(203, 8, Buffer.prototype.writeDoubleBE),
                t[204] = c(204, 1, Buffer.prototype.writeUInt8),
                t[205] = c(205, 2, Buffer.prototype.writeUInt16BE),
                t[206] = c(206, 4, Buffer.prototype.writeUInt32BE),
                t[207] = c(207, 8, h),
                t[208] = c(208, 1, Buffer.prototype.writeInt8),
                t[209] = c(209, 2, Buffer.prototype.writeInt16BE),
                t[210] = c(210, 4, Buffer.prototype.writeInt32BE),
                t[211] = c(211, 8, l),
                t[217] = c(217, 1, Buffer.prototype.writeUInt8),
                t[218] = c(218, 2, Buffer.prototype.writeUInt16BE),
                t[219] = c(219, 4, Buffer.prototype.writeUInt32BE),
                t[220] = c(220, 2, Buffer.prototype.writeUInt16BE),
                t[221] = c(221, 4, Buffer.prototype.writeUInt32BE),
                t[222] = c(222, 2, Buffer.prototype.writeUInt16BE),
                t[223] = c(223, 4, Buffer.prototype.writeUInt32BE),
                t
            }
            function u(t) {
                return function(r, e) {
                    var n = r.reserve(2)
                      , i = r.buffer;
                    i[n++] = t,
                    i[n] = e
                }
            }
            function a(t) {
                return function(r, e) {
                    var n = r.reserve(3)
                      , i = r.buffer;
                    i[n++] = t,
                    i[n++] = e >>> 8,
                    i[n] = e
                }
            }
            function s(t) {
                return function(r, e) {
                    var n = r.reserve(5)
                      , i = r.buffer;
                    i[n++] = t,
                    i[n++] = e >>> 24,
                    i[n++] = e >>> 16,
                    i[n++] = e >>> 8,
                    i[n] = e
                }
            }
            function c(t, r, e, n) {
                return function(i, o) {
                    var f = i.reserve(r + 1);
                    i.buffer[f++] = t,
                    e.call(i.buffer, o, f, n)
                }
            }
            function h(t, r) {
                new g(this,r,t)
            }
            function l(t, r) {
                new b(this,r,t)
            }
            function p(t, r) {
                y.write(this, t, r, !1, 23, 4)
            }
            function d(t, r) {
                y.write(this, t, r, !1, 52, 8)
            }
            var y = t("ieee754")
              , v = t("int64-buffer")
              , g = v.Uint64BE
              , b = v.Int64BE
              , w = t("./write-uint8").uint8
              , E = t("./bufferish")
              , Buffer = E.global
              , A = E.hasBuffer && "TYPED_ARRAY_SUPPORT"in Buffer
              , m = A && !Buffer.TYPED_ARRAY_SUPPORT
              , x = E.hasBuffer && Buffer.prototype || {};
            e.getWriteToken = n
        }
        , {
            "./bufferish": 8,
            "./write-uint8": 28,
            ieee754: 32,
            "int64-buffer": 33
        }],
        27: [function(t, r, e) {
            function n(t) {
                function r(t, r) {
                    var e = r ? 195 : 194;
                    _[e](t, r)
                }
                function e(t, r) {
                    var e, n = 0 | r;
                    return r !== n ? (e = 203,
                    void _[e](t, r)) : (e = -32 <= n && n <= 127 ? 255 & n : 0 <= n ? n <= 255 ? 204 : n <= 65535 ? 205 : 206 : -128 <= n ? 208 : -32768 <= n ? 209 : 210,
                    void _[e](t, n))
                }
                function n(t, r) {
                    var e = 207;
                    _[e](t, r.toArray())
                }
                function o(t, r) {
                    var e = 211;
                    _[e](t, r.toArray())
                }
                function v(t) {
                    return t < 32 ? 1 : t <= 255 ? 2 : t <= 65535 ? 3 : 5
                }
                function g(t) {
                    return t < 32 ? 1 : t <= 65535 ? 3 : 5
                }
                function b(t) {
                    function r(r, e) {
                        var n = e.length
                          , i = 5 + 3 * n;
                        r.offset = r.reserve(i);
                        var o = r.buffer
                          , f = t(n)
                          , u = r.offset + f;
                        n = s.write.call(o, e, u);
                        var a = t(n);
                        if (f !== a) {
                            var c = u + a - f
                              , h = u + n;
                            s.copy.call(o, o, c, u, h)
                        }
                        var l = 1 === a ? 160 + n : a <= 3 ? 215 + a : 219;
                        _[l](r, n),
                        r.offset += n
                    }
                    return r
                }
                function w(t, r) {
                    if (null === r)
                        return A(t, r);
                    if (I(r))
                        return Y(t, r);
                    if (i(r))
                        return m(t, r);
                    if (f.isUint64BE(r))
                        return n(t, r);
                    if (u.isInt64BE(r))
                        return o(t, r);
                    var e = t.codec.getExtPacker(r);
                    return e && (r = e(r)),
                    r instanceof l ? U(t, r) : void D(t, r)
                }
                function E(t, r) {
                    return I(r) ? k(t, r) : void w(t, r)
                }
                function A(t, r) {
                    var e = 192;
                    _[e](t, r)
                }
                function m(t, r) {
                    var e = r.length
                      , n = e < 16 ? 144 + e : e <= 65535 ? 220 : 221;
                    _[n](t, e);
                    for (var i = t.codec.encode, o = 0; o < e; o++)
                        i(t, r[o])
                }
                function x(t, r) {
                    var e = r.length
                      , n = e < 255 ? 196 : e <= 65535 ? 197 : 198;
                    _[n](t, e),
                    t.send(r)
                }
                function B(t, r) {
                    x(t, new Uint8Array(r))
                }
                function U(t, r) {
                    var e = r.buffer
                      , n = e.length
                      , i = y[n] || (n < 255 ? 199 : n <= 65535 ? 200 : 201);
                    _[i](t, n),
                    h[r.type](t),
                    t.send(e)
                }
                function P(t, r) {
                    var e = Object.keys(r)
                      , n = e.length
                      , i = n < 16 ? 128 + n : n <= 65535 ? 222 : 223;
                    _[i](t, n);
                    var o = t.codec.encode;
                    e.forEach(function(e) {
                        o(t, e),
                        o(t, r[e])
                    })
                }
                function R(t, r) {
                    if (!(r instanceof Map))
                        return P(t, r);
                    var e = r.size
                      , n = e < 16 ? 128 + e : e <= 65535 ? 222 : 223;
                    _[n](t, e);
                    var i = t.codec.encode;
                    r.forEach(function(r, e, n) {
                        i(t, e),
                        i(t, r)
                    })
                }
                function k(t, r) {
                    var e = r.length
                      , n = e < 32 ? 160 + e : e <= 65535 ? 218 : 219;
                    _[n](t, e),
                    t.send(r)
                }
                var _ = c.getWriteToken(t)
                  , T = t && t.useraw
                  , S = p && t && t.binarraybuffer
                  , I = S ? a.isArrayBuffer : a.isBuffer
                  , Y = S ? B : x
                  , C = d && t && t.usemap
                  , D = C ? R : P
                  , O = {
                    boolean: r,
                    function: A,
                    number: e,
                    object: T ? E : w,
                    string: b(T ? g : v),
                    symbol: A,
                    undefined: A
                };
                return O
            }
            var i = t("isarray")
              , o = t("int64-buffer")
              , f = o.Uint64BE
              , u = o.Int64BE
              , a = t("./bufferish")
              , s = t("./bufferish-proto")
              , c = t("./write-token")
              , h = t("./write-uint8").uint8
              , l = t("./ext-buffer").ExtBuffer
              , p = "undefined" != typeof Uint8Array
              , d = "undefined" != typeof Map
              , y = [];
            y[1] = 212,
            y[2] = 213,
            y[4] = 214,
            y[8] = 215,
            y[16] = 216,
            e.getWriteType = n
        }
        , {
            "./bufferish": 8,
            "./bufferish-proto": 6,
            "./ext-buffer": 17,
            "./write-token": 26,
            "./write-uint8": 28,
            "int64-buffer": 33,
            isarray: 34
        }],
        28: [function(t, r, e) {
            function n(t) {
                return function(r) {
                    var e = r.reserve(1);
                    r.buffer[e] = t
                }
            }
            for (var i = e.uint8 = new Array(256), o = 0; o <= 255; o++)
                i[o] = n(o)
        }
        , {}],
        29: [function(t, r, e) {
            (function(r) {
                "use strict";
                function n() {
                    try {
                        var t = new Uint8Array(1);
                        return t.__proto__ = {
                            __proto__: Uint8Array.prototype,
                            foo: function() {
                                return 42
                            }
                        },
                        42 === t.foo() && "function" == typeof t.subarray && 0 === t.subarray(1, 1).byteLength
                    } catch (t) {
                        return !1
                    }
                }
                function i() {
                    return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
                }
                function o(t, r) {
                    if (i() < r)
                        throw new RangeError("Invalid typed array length");
                    return Buffer.TYPED_ARRAY_SUPPORT ? (t = new Uint8Array(r),
                    t.__proto__ = Buffer.prototype) : (null === t && (t = new Buffer(r)),
                    t.length = r),
                    t
                }
                function Buffer(t, r, e) {
                    if (!(Buffer.TYPED_ARRAY_SUPPORT || this instanceof Buffer))
                        return new Buffer(t,r,e);
                    if ("number" == typeof t) {
                        if ("string" == typeof r)
                            throw new Error("If encoding is specified then the first argument must be a string");
                        return s(this, t)
                    }
                    return f(this, t, r, e)
                }
                function f(t, r, e, n) {
                    if ("number" == typeof r)
                        throw new TypeError('"value" argument must not be a number');
                    return "undefined" != typeof ArrayBuffer && r instanceof ArrayBuffer ? l(t, r, e, n) : "string" == typeof r ? c(t, r, e) : p(t, r)
                }
                function u(t) {
                    if ("number" != typeof t)
                        throw new TypeError('"size" argument must be a number');
                    if (t < 0)
                        throw new RangeError('"size" argument must not be negative')
                }
                function a(t, r, e, n) {
                    return u(r),
                    r <= 0 ? o(t, r) : void 0 !== e ? "string" == typeof n ? o(t, r).fill(e, n) : o(t, r).fill(e) : o(t, r)
                }
                function s(t, r) {
                    if (u(r),
                    t = o(t, r < 0 ? 0 : 0 | d(r)),
                    !Buffer.TYPED_ARRAY_SUPPORT)
                        for (var e = 0; e < r; ++e)
                            t[e] = 0;
                    return t
                }
                function c(t, r, e) {
                    if ("string" == typeof e && "" !== e || (e = "utf8"),
                    !Buffer.isEncoding(e))
                        throw new TypeError('"encoding" must be a valid string encoding');
                    var n = 0 | v(r, e);
                    t = o(t, n);
                    var i = t.write(r, e);
                    return i !== n && (t = t.slice(0, i)),
                    t
                }
                function h(t, r) {
                    var e = r.length < 0 ? 0 : 0 | d(r.length);
                    t = o(t, e);
                    for (var n = 0; n < e; n += 1)
                        t[n] = 255 & r[n];
                    return t
                }
                function l(t, r, e, n) {
                    if (r.byteLength,
                    e < 0 || r.byteLength < e)
                        throw new RangeError("'offset' is out of bounds");
                    if (r.byteLength < e + (n || 0))
                        throw new RangeError("'length' is out of bounds");
                    return r = void 0 === e && void 0 === n ? new Uint8Array(r) : void 0 === n ? new Uint8Array(r,e) : new Uint8Array(r,e,n),
                    Buffer.TYPED_ARRAY_SUPPORT ? (t = r,
                    t.__proto__ = Buffer.prototype) : t = h(t, r),
                    t
                }
                function p(t, r) {
                    if (Buffer.isBuffer(r)) {
                        var e = 0 | d(r.length);
                        return t = o(t, e),
                        0 === t.length ? t : (r.copy(t, 0, 0, e),
                        t)
                    }
                    if (r) {
                        if ("undefined" != typeof ArrayBuffer && r.buffer instanceof ArrayBuffer || "length"in r)
                            return "number" != typeof r.length || H(r.length) ? o(t, 0) : h(t, r);
                        if ("Buffer" === r.type && Q(r.data))
                            return h(t, r.data)
                    }
                    throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
                }
                function d(t) {
                    if (t >= i())
                        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i().toString(16) + " bytes");
                    return 0 | t
                }
                function y(t) {
                    return +t != t && (t = 0),
                    Buffer.alloc(+t)
                }
                function v(t, r) {
                    if (Buffer.isBuffer(t))
                        return t.length;
                    if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t) || t instanceof ArrayBuffer))
                        return t.byteLength;
                    "string" != typeof t && (t = "" + t);
                    var e = t.length;
                    if (0 === e)
                        return 0;
                    for (var n = !1; ; )
                        switch (r) {
                        case "ascii":
                        case "latin1":
                        case "binary":
                            return e;
                        case "utf8":
                        case "utf-8":
                        case void 0:
                            return q(t).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * e;
                        case "hex":
                            return e >>> 1;
                        case "base64":
                            return X(t).length;
                        default:
                            if (n)
                                return q(t).length;
                            r = ("" + r).toLowerCase(),
                            n = !0
                        }
                }
                function g(t, r, e) {
                    var n = !1;
                    if ((void 0 === r || r < 0) && (r = 0),
                    r > this.length)
                        return "";
                    if ((void 0 === e || e > this.length) && (e = this.length),
                    e <= 0)
                        return "";
                    if (e >>>= 0,
                    r >>>= 0,
                    e <= r)
                        return "";
                    for (t || (t = "utf8"); ; )
                        switch (t) {
                        case "hex":
                            return I(this, r, e);
                        case "utf8":
                        case "utf-8":
                            return k(this, r, e);
                        case "ascii":
                            return T(this, r, e);
                        case "latin1":
                        case "binary":
                            return S(this, r, e);
                        case "base64":
                            return R(this, r, e);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return Y(this, r, e);
                        default:
                            if (n)
                                throw new TypeError("Unknown encoding: " + t);
                            t = (t + "").toLowerCase(),
                            n = !0
                        }
                }
                function b(t, r, e) {
                    var n = t[r];
                    t[r] = t[e],
                    t[e] = n
                }
                function w(t, r, e, n, i) {
                    if (0 === t.length)
                        return -1;
                    if ("string" == typeof e ? (n = e,
                    e = 0) : e > 2147483647 ? e = 2147483647 : e < -2147483648 && (e = -2147483648),
                    e = +e,
                    isNaN(e) && (e = i ? 0 : t.length - 1),
                    e < 0 && (e = t.length + e),
                    e >= t.length) {
                        if (i)
                            return -1;
                        e = t.length - 1
                    } else if (e < 0) {
                        if (!i)
                            return -1;
                        e = 0
                    }
                    if ("string" == typeof r && (r = Buffer.from(r, n)),
                    Buffer.isBuffer(r))
                        return 0 === r.length ? -1 : E(t, r, e, n, i);
                    if ("number" == typeof r)
                        return r = 255 & r,
                        Buffer.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(t, r, e) : Uint8Array.prototype.lastIndexOf.call(t, r, e) : E(t, [r], e, n, i);
                    throw new TypeError("val must be string, number or Buffer")
                }
                function E(t, r, e, n, i) {
                    function o(t, r) {
                        return 1 === f ? t[r] : t.readUInt16BE(r * f)
                    }
                    var f = 1
                      , u = t.length
                      , a = r.length;
                    if (void 0 !== n && (n = String(n).toLowerCase(),
                    "ucs2" === n || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
                        if (t.length < 2 || r.length < 2)
                            return -1;
                        f = 2,
                        u /= 2,
                        a /= 2,
                        e /= 2
                    }
                    var s;
                    if (i) {
                        var c = -1;
                        for (s = e; s < u; s++)
                            if (o(t, s) === o(r, c === -1 ? 0 : s - c)) {
                                if (c === -1 && (c = s),
                                s - c + 1 === a)
                                    return c * f
                            } else
                                c !== -1 && (s -= s - c),
                                c = -1
                    } else
                        for (e + a > u && (e = u - a),
                        s = e; s >= 0; s--) {
                            for (var h = !0, l = 0; l < a; l++)
                                if (o(t, s + l) !== o(r, l)) {
                                    h = !1;
                                    break
                                }
                            if (h)
                                return s
                        }
                    return -1
                }
                function A(t, r, e, n) {
                    e = Number(e) || 0;
                    var i = t.length - e;
                    n ? (n = Number(n),
                    n > i && (n = i)) : n = i;
                    var o = r.length;
                    if (o % 2 !== 0)
                        throw new TypeError("Invalid hex string");
                    n > o / 2 && (n = o / 2);
                    for (var f = 0; f < n; ++f) {
                        var u = parseInt(r.substr(2 * f, 2), 16);
                        if (isNaN(u))
                            return f;
                        t[e + f] = u
                    }
                    return f
                }
                function m(t, r, e, n) {
                    return G(q(r, t.length - e), t, e, n)
                }
                function x(t, r, e, n) {
                    return G(W(r), t, e, n)
                }
                function B(t, r, e, n) {
                    return x(t, r, e, n)
                }
                function U(t, r, e, n) {
                    return G(X(r), t, e, n)
                }
                function P(t, r, e, n) {
                    return G(J(r, t.length - e), t, e, n)
                }
                function R(t, r, e) {
                    return 0 === r && e === t.length ? Z.fromByteArray(t) : Z.fromByteArray(t.slice(r, e))
                }
                function k(t, r, e) {
                    e = Math.min(t.length, e);
                    for (var n = [], i = r; i < e; ) {
                        var o = t[i]
                          , f = null
                          , u = o > 239 ? 4 : o > 223 ? 3 : o > 191 ? 2 : 1;
                        if (i + u <= e) {
                            var a, s, c, h;
                            switch (u) {
                            case 1:
                                o < 128 && (f = o);
                                break;
                            case 2:
                                a = t[i + 1],
                                128 === (192 & a) && (h = (31 & o) << 6 | 63 & a,
                                h > 127 && (f = h));
                                break;
                            case 3:
                                a = t[i + 1],
                                s = t[i + 2],
                                128 === (192 & a) && 128 === (192 & s) && (h = (15 & o) << 12 | (63 & a) << 6 | 63 & s,
                                h > 2047 && (h < 55296 || h > 57343) && (f = h));
                                break;
                            case 4:
                                a = t[i + 1],
                                s = t[i + 2],
                                c = t[i + 3],
                                128 === (192 & a) && 128 === (192 & s) && 128 === (192 & c) && (h = (15 & o) << 18 | (63 & a) << 12 | (63 & s) << 6 | 63 & c,
                                h > 65535 && h < 1114112 && (f = h))
                            }
                        }
                        null === f ? (f = 65533,
                        u = 1) : f > 65535 && (f -= 65536,
                        n.push(f >>> 10 & 1023 | 55296),
                        f = 56320 | 1023 & f),
                        n.push(f),
                        i += u
                    }
                    return _(n)
                }
                function _(t) {
                    var r = t.length;
                    if (r <= $)
                        return String.fromCharCode.apply(String, t);
                    for (var e = "", n = 0; n < r; )
                        e += String.fromCharCode.apply(String, t.slice(n, n += $));
                    return e
                }
                function T(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i)
                        n += String.fromCharCode(127 & t[i]);
                    return n
                }
                function S(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i)
                        n += String.fromCharCode(t[i]);
                    return n
                }
                function I(t, r, e) {
                    var n = t.length;
                    (!r || r < 0) && (r = 0),
                    (!e || e < 0 || e > n) && (e = n);
                    for (var i = "", o = r; o < e; ++o)
                        i += V(t[o]);
                    return i
                }
                function Y(t, r, e) {
                    for (var n = t.slice(r, e), i = "", o = 0; o < n.length; o += 2)
                        i += String.fromCharCode(n[o] + 256 * n[o + 1]);
                    return i
                }
                function C(t, r, e) {
                    if (t % 1 !== 0 || t < 0)
                        throw new RangeError("offset is not uint");
                    if (t + r > e)
                        throw new RangeError("Trying to access beyond buffer length")
                }
                function D(t, r, e, n, i, o) {
                    if (!Buffer.isBuffer(t))
                        throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (r > i || r < o)
                        throw new RangeError('"value" argument is out of bounds');
                    if (e + n > t.length)
                        throw new RangeError("Index out of range")
                }
                function O(t, r, e, n) {
                    r < 0 && (r = 65535 + r + 1);
                    for (var i = 0, o = Math.min(t.length - e, 2); i < o; ++i)
                        t[e + i] = (r & 255 << 8 * (n ? i : 1 - i)) >>> 8 * (n ? i : 1 - i)
                }
                function L(t, r, e, n) {
                    r < 0 && (r = 4294967295 + r + 1);
                    for (var i = 0, o = Math.min(t.length - e, 4); i < o; ++i)
                        t[e + i] = r >>> 8 * (n ? i : 3 - i) & 255
                }
                function M(t, r, e, n, i, o) {
                    if (e + n > t.length)
                        throw new RangeError("Index out of range");
                    if (e < 0)
                        throw new RangeError("Index out of range")
                }
                function N(t, r, e, n, i) {
                    return i || M(t, r, e, 4, 3.4028234663852886e38, -3.4028234663852886e38),
                    K.write(t, r, e, n, 23, 4),
                    e + 4
                }
                function F(t, r, e, n, i) {
                    return i || M(t, r, e, 8, 1.7976931348623157e308, -1.7976931348623157e308),
                    K.write(t, r, e, n, 52, 8),
                    e + 8
                }
                function j(t) {
                    if (t = z(t).replace(tt, ""),
                    t.length < 2)
                        return "";
                    for (; t.length % 4 !== 0; )
                        t += "=";
                    return t
                }
                function z(t) {
                    return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "")
                }
                function V(t) {
                    return t < 16 ? "0" + t.toString(16) : t.toString(16)
                }
                function q(t, r) {
                    r = r || 1 / 0;
                    for (var e, n = t.length, i = null, o = [], f = 0; f < n; ++f) {
                        if (e = t.charCodeAt(f),
                        e > 55295 && e < 57344) {
                            if (!i) {
                                if (e > 56319) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                if (f + 1 === n) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                i = e;
                                continue
                            }
                            if (e < 56320) {
                                (r -= 3) > -1 && o.push(239, 191, 189),
                                i = e;
                                continue
                            }
                            e = (i - 55296 << 10 | e - 56320) + 65536
                        } else
                            i && (r -= 3) > -1 && o.push(239, 191, 189);
                        if (i = null,
                        e < 128) {
                            if ((r -= 1) < 0)
                                break;
                            o.push(e)
                        } else if (e < 2048) {
                            if ((r -= 2) < 0)
                                break;
                            o.push(e >> 6 | 192, 63 & e | 128)
                        } else if (e < 65536) {
                            if ((r -= 3) < 0)
                                break;
                            o.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128)
                        } else {
                            if (!(e < 1114112))
                                throw new Error("Invalid code point");
                            if ((r -= 4) < 0)
                                break;
                            o.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128)
                        }
                    }
                    return o
                }
                function W(t) {
                    for (var r = [], e = 0; e < t.length; ++e)
                        r.push(255 & t.charCodeAt(e));
                    return r
                }
                function J(t, r) {
                    for (var e, n, i, o = [], f = 0; f < t.length && !((r -= 2) < 0); ++f)
                        e = t.charCodeAt(f),
                        n = e >> 8,
                        i = e % 256,
                        o.push(i),
                        o.push(n);
                    return o
                }
                function X(t) {
                    return Z.toByteArray(j(t))
                }
                function G(t, r, e, n) {
                    for (var i = 0; i < n && !(i + e >= r.length || i >= t.length); ++i)
                        r[i + e] = t[i];
                    return i
                }
                function H(t) {
                    return t !== t
                }
                var Z = t("base64-js")
                  , K = t("ieee754")
                  , Q = t("isarray");
                e.Buffer = Buffer,
                e.SlowBuffer = y,
                e.INSPECT_MAX_BYTES = 50,
                Buffer.TYPED_ARRAY_SUPPORT = void 0 !== r.TYPED_ARRAY_SUPPORT ? r.TYPED_ARRAY_SUPPORT : n(),
                e.kMaxLength = i(),
                Buffer.poolSize = 8192,
                Buffer._augment = function(t) {
                    return t.__proto__ = Buffer.prototype,
                    t
                }
                ,
                Buffer.from = function(t, r, e) {
                    return f(null, t, r, e)
                }
                ,
                Buffer.TYPED_ARRAY_SUPPORT && (Buffer.prototype.__proto__ = Uint8Array.prototype,
                Buffer.__proto__ = Uint8Array,
                "undefined" != typeof Symbol && Symbol.species && Buffer[Symbol.species] === Buffer && Object.defineProperty(Buffer, Symbol.species, {
                    value: null,
                    configurable: !0
                })),
                Buffer.alloc = function(t, r, e) {
                    return a(null, t, r, e)
                }
                ,
                Buffer.allocUnsafe = function(t) {
                    return s(null, t)
                }
                ,
                Buffer.allocUnsafeSlow = function(t) {
                    return s(null, t)
                }
                ,
                Buffer.isBuffer = function(t) {
                    return !(null == t || !t._isBuffer)
                }
                ,
                Buffer.compare = function(t, r) {
                    if (!Buffer.isBuffer(t) || !Buffer.isBuffer(r))
                        throw new TypeError("Arguments must be Buffers");
                    if (t === r)
                        return 0;
                    for (var e = t.length, n = r.length, i = 0, o = Math.min(e, n); i < o; ++i)
                        if (t[i] !== r[i]) {
                            e = t[i],
                            n = r[i];
                            break
                        }
                    return e < n ? -1 : n < e ? 1 : 0
                }
                ,
                Buffer.isEncoding = function(t) {
                    switch (String(t).toLowerCase()) {
                    case "hex":
                    case "utf8":
                    case "utf-8":
                    case "ascii":
                    case "latin1":
                    case "binary":
                    case "base64":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        return !0;
                    default:
                        return !1
                    }
                }
                ,
                Buffer.concat = function(t, r) {
                    if (!Q(t))
                        throw new TypeError('"list" argument must be an Array of Buffers');
                    if (0 === t.length)
                        return Buffer.alloc(0);
                    var e;
                    if (void 0 === r)
                        for (r = 0,
                        e = 0; e < t.length; ++e)
                            r += t[e].length;
                    var n = Buffer.allocUnsafe(r)
                      , i = 0;
                    for (e = 0; e < t.length; ++e) {
                        var o = t[e];
                        if (!Buffer.isBuffer(o))
                            throw new TypeError('"list" argument must be an Array of Buffers');
                        o.copy(n, i),
                        i += o.length
                    }
                    return n
                }
                ,
                Buffer.byteLength = v,
                Buffer.prototype._isBuffer = !0,
                Buffer.prototype.swap16 = function() {
                    var t = this.length;
                    if (t % 2 !== 0)
                        throw new RangeError("Buffer size must be a multiple of 16-bits");
                    for (var r = 0; r < t; r += 2)
                        b(this, r, r + 1);
                    return this
                }
                ,
                Buffer.prototype.swap32 = function() {
                    var t = this.length;
                    if (t % 4 !== 0)
                        throw new RangeError("Buffer size must be a multiple of 32-bits");
                    for (var r = 0; r < t; r += 4)
                        b(this, r, r + 3),
                        b(this, r + 1, r + 2);
                    return this
                }
                ,
                Buffer.prototype.swap64 = function() {
                    var t = this.length;
                    if (t % 8 !== 0)
                        throw new RangeError("Buffer size must be a multiple of 64-bits");
                    for (var r = 0; r < t; r += 8)
                        b(this, r, r + 7),
                        b(this, r + 1, r + 6),
                        b(this, r + 2, r + 5),
                        b(this, r + 3, r + 4);
                    return this
                }
                ,
                Buffer.prototype.toString = function() {
                    var t = 0 | this.length;
                    return 0 === t ? "" : 0 === arguments.length ? k(this, 0, t) : g.apply(this, arguments)
                }
                ,
                Buffer.prototype.equals = function(t) {
                    if (!Buffer.isBuffer(t))
                        throw new TypeError("Argument must be a Buffer");
                    return this === t || 0 === Buffer.compare(this, t)
                }
                ,
                Buffer.prototype.inspect = function() {
                    var t = ""
                      , r = e.INSPECT_MAX_BYTES;
                    return this.length > 0 && (t = this.toString("hex", 0, r).match(/.{2}/g).join(" "),
                    this.length > r && (t += " ... ")),
                    "<Buffer " + t + ">"
                }
                ,
                Buffer.prototype.compare = function(t, r, e, n, i) {
                    if (!Buffer.isBuffer(t))
                        throw new TypeError("Argument must be a Buffer");
                    if (void 0 === r && (r = 0),
                    void 0 === e && (e = t ? t.length : 0),
                    void 0 === n && (n = 0),
                    void 0 === i && (i = this.length),
                    r < 0 || e > t.length || n < 0 || i > this.length)
                        throw new RangeError("out of range index");
                    if (n >= i && r >= e)
                        return 0;
                    if (n >= i)
                        return -1;
                    if (r >= e)
                        return 1;
                    if (r >>>= 0,
                    e >>>= 0,
                    n >>>= 0,
                    i >>>= 0,
                    this === t)
                        return 0;
                    for (var o = i - n, f = e - r, u = Math.min(o, f), a = this.slice(n, i), s = t.slice(r, e), c = 0; c < u; ++c)
                        if (a[c] !== s[c]) {
                            o = a[c],
                            f = s[c];
                            break
                        }
                    return o < f ? -1 : f < o ? 1 : 0
                }
                ,
                Buffer.prototype.includes = function(t, r, e) {
                    return this.indexOf(t, r, e) !== -1
                }
                ,
                Buffer.prototype.indexOf = function(t, r, e) {
                    return w(this, t, r, e, !0)
                }
                ,
                Buffer.prototype.lastIndexOf = function(t, r, e) {
                    return w(this, t, r, e, !1)
                }
                ,
                Buffer.prototype.write = function(t, r, e, n) {
                    if (void 0 === r)
                        n = "utf8",
                        e = this.length,
                        r = 0;
                    else if (void 0 === e && "string" == typeof r)
                        n = r,
                        e = this.length,
                        r = 0;
                    else {
                        if (!isFinite(r))
                            throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                        r = 0 | r,
                        isFinite(e) ? (e = 0 | e,
                        void 0 === n && (n = "utf8")) : (n = e,
                        e = void 0)
                    }
                    var i = this.length - r;
                    if ((void 0 === e || e > i) && (e = i),
                    t.length > 0 && (e < 0 || r < 0) || r > this.length)
                        throw new RangeError("Attempt to write outside buffer bounds");
                    n || (n = "utf8");
                    for (var o = !1; ; )
                        switch (n) {
                        case "hex":
                            return A(this, t, r, e);
                        case "utf8":
                        case "utf-8":
                            return m(this, t, r, e);
                        case "ascii":
                            return x(this, t, r, e);
                        case "latin1":
                        case "binary":
                            return B(this, t, r, e);
                        case "base64":
                            return U(this, t, r, e);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return P(this, t, r, e);
                        default:
                            if (o)
                                throw new TypeError("Unknown encoding: " + n);
                            n = ("" + n).toLowerCase(),
                            o = !0
                        }
                }
                ,
                Buffer.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                }
                ;
                var $ = 4096;
                Buffer.prototype.slice = function(t, r) {
                    var e = this.length;
                    t = ~~t,
                    r = void 0 === r ? e : ~~r,
                    t < 0 ? (t += e,
                    t < 0 && (t = 0)) : t > e && (t = e),
                    r < 0 ? (r += e,
                    r < 0 && (r = 0)) : r > e && (r = e),
                    r < t && (r = t);
                    var n;
                    if (Buffer.TYPED_ARRAY_SUPPORT)
                        n = this.subarray(t, r),
                        n.__proto__ = Buffer.prototype;
                    else {
                        var i = r - t;
                        n = new Buffer(i,void 0);
                        for (var o = 0; o < i; ++o)
                            n[o] = this[o + t]
                    }
                    return n
                }
                ,
                Buffer.prototype.readUIntLE = function(t, r, e) {
                    t = 0 | t,
                    r = 0 | r,
                    e || C(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256); )
                        n += this[t + o] * i;
                    return n
                }
                ,
                Buffer.prototype.readUIntBE = function(t, r, e) {
                    t = 0 | t,
                    r = 0 | r,
                    e || C(t, r, this.length);
                    for (var n = this[t + --r], i = 1; r > 0 && (i *= 256); )
                        n += this[t + --r] * i;
                    return n
                }
                ,
                Buffer.prototype.readUInt8 = function(t, r) {
                    return r || C(t, 1, this.length),
                    this[t]
                }
                ,
                Buffer.prototype.readUInt16LE = function(t, r) {
                    return r || C(t, 2, this.length),
                    this[t] | this[t + 1] << 8
                }
                ,
                Buffer.prototype.readUInt16BE = function(t, r) {
                    return r || C(t, 2, this.length),
                    this[t] << 8 | this[t + 1]
                }
                ,
                Buffer.prototype.readUInt32LE = function(t, r) {
                    return r || C(t, 4, this.length),
                    (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3]
                }
                ,
                Buffer.prototype.readUInt32BE = function(t, r) {
                    return r || C(t, 4, this.length),
                    16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3])
                }
                ,
                Buffer.prototype.readIntLE = function(t, r, e) {
                    t = 0 | t,
                    r = 0 | r,
                    e || C(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256); )
                        n += this[t + o] * i;
                    return i *= 128,
                    n >= i && (n -= Math.pow(2, 8 * r)),
                    n
                }
                ,
                Buffer.prototype.readIntBE = function(t, r, e) {
                    t = 0 | t,
                    r = 0 | r,
                    e || C(t, r, this.length);
                    for (var n = r, i = 1, o = this[t + --n]; n > 0 && (i *= 256); )
                        o += this[t + --n] * i;
                    return i *= 128,
                    o >= i && (o -= Math.pow(2, 8 * r)),
                    o
                }
                ,
                Buffer.prototype.readInt8 = function(t, r) {
                    return r || C(t, 1, this.length),
                    128 & this[t] ? (255 - this[t] + 1) * -1 : this[t]
                }
                ,
                Buffer.prototype.readInt16LE = function(t, r) {
                    r || C(t, 2, this.length);
                    var e = this[t] | this[t + 1] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }
                ,
                Buffer.prototype.readInt16BE = function(t, r) {
                    r || C(t, 2, this.length);
                    var e = this[t + 1] | this[t] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }
                ,
                Buffer.prototype.readInt32LE = function(t, r) {
                    return r || C(t, 4, this.length),
                    this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24
                }
                ,
                Buffer.prototype.readInt32BE = function(t, r) {
                    return r || C(t, 4, this.length),
                    this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]
                }
                ,
                Buffer.prototype.readFloatLE = function(t, r) {
                    return r || C(t, 4, this.length),
                    K.read(this, t, !0, 23, 4)
                }
                ,
                Buffer.prototype.readFloatBE = function(t, r) {
                    return r || C(t, 4, this.length),
                    K.read(this, t, !1, 23, 4)
                }
                ,
                Buffer.prototype.readDoubleLE = function(t, r) {
                    return r || C(t, 8, this.length),
                    K.read(this, t, !0, 52, 8)
                }
                ,
                Buffer.prototype.readDoubleBE = function(t, r) {
                    return r || C(t, 8, this.length),
                    K.read(this, t, !1, 52, 8)
                }
                ,
                Buffer.prototype.writeUIntLE = function(t, r, e, n) {
                    if (t = +t,
                    r = 0 | r,
                    e = 0 | e,
                    !n) {
                        var i = Math.pow(2, 8 * e) - 1;
                        D(this, t, r, e, i, 0)
                    }
                    var o = 1
                      , f = 0;
                    for (this[r] = 255 & t; ++f < e && (o *= 256); )
                        this[r + f] = t / o & 255;
                    return r + e
                }
                ,
                Buffer.prototype.writeUIntBE = function(t, r, e, n) {
                    if (t = +t,
                    r = 0 | r,
                    e = 0 | e,
                    !n) {
                        var i = Math.pow(2, 8 * e) - 1;
                        D(this, t, r, e, i, 0)
                    }
                    var o = e - 1
                      , f = 1;
                    for (this[r + o] = 255 & t; --o >= 0 && (f *= 256); )
                        this[r + o] = t / f & 255;
                    return r + e
                }
                ,
                Buffer.prototype.writeUInt8 = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 1, 255, 0),
                    Buffer.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)),
                    this[r] = 255 & t,
                    r + 1
                }
                ,
                Buffer.prototype.writeUInt16LE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 2, 65535, 0),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t,
                    this[r + 1] = t >>> 8) : O(this, t, r, !0),
                    r + 2
                }
                ,
                Buffer.prototype.writeUInt16BE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 2, 65535, 0),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8,
                    this[r + 1] = 255 & t) : O(this, t, r, !1),
                    r + 2
                }
                ,
                Buffer.prototype.writeUInt32LE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 4, 4294967295, 0),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r + 3] = t >>> 24,
                    this[r + 2] = t >>> 16,
                    this[r + 1] = t >>> 8,
                    this[r] = 255 & t) : L(this, t, r, !0),
                    r + 4
                }
                ,
                Buffer.prototype.writeUInt32BE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 4, 4294967295, 0),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24,
                    this[r + 1] = t >>> 16,
                    this[r + 2] = t >>> 8,
                    this[r + 3] = 255 & t) : L(this, t, r, !1),
                    r + 4
                }
                ,
                Buffer.prototype.writeIntLE = function(t, r, e, n) {
                    if (t = +t,
                    r = 0 | r,
                    !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        D(this, t, r, e, i - 1, -i)
                    }
                    var o = 0
                      , f = 1
                      , u = 0;
                    for (this[r] = 255 & t; ++o < e && (f *= 256); )
                        t < 0 && 0 === u && 0 !== this[r + o - 1] && (u = 1),
                        this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }
                ,
                Buffer.prototype.writeIntBE = function(t, r, e, n) {
                    if (t = +t,
                    r = 0 | r,
                    !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        D(this, t, r, e, i - 1, -i)
                    }
                    var o = e - 1
                      , f = 1
                      , u = 0;
                    for (this[r + o] = 255 & t; --o >= 0 && (f *= 256); )
                        t < 0 && 0 === u && 0 !== this[r + o + 1] && (u = 1),
                        this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }
                ,
                Buffer.prototype.writeInt8 = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 1, 127, -128),
                    Buffer.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)),
                    t < 0 && (t = 255 + t + 1),
                    this[r] = 255 & t,
                    r + 1
                }
                ,
                Buffer.prototype.writeInt16LE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 2, 32767, -32768),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t,
                    this[r + 1] = t >>> 8) : O(this, t, r, !0),
                    r + 2
                }
                ,
                Buffer.prototype.writeInt16BE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 2, 32767, -32768),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8,
                    this[r + 1] = 255 & t) : O(this, t, r, !1),
                    r + 2
                }
                ,
                Buffer.prototype.writeInt32LE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 4, 2147483647, -2147483648),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t,
                    this[r + 1] = t >>> 8,
                    this[r + 2] = t >>> 16,
                    this[r + 3] = t >>> 24) : L(this, t, r, !0),
                    r + 4
                }
                ,
                Buffer.prototype.writeInt32BE = function(t, r, e) {
                    return t = +t,
                    r = 0 | r,
                    e || D(this, t, r, 4, 2147483647, -2147483648),
                    t < 0 && (t = 4294967295 + t + 1),
                    Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24,
                    this[r + 1] = t >>> 16,
                    this[r + 2] = t >>> 8,
                    this[r + 3] = 255 & t) : L(this, t, r, !1),
                    r + 4
                }
                ,
                Buffer.prototype.writeFloatLE = function(t, r, e) {
                    return N(this, t, r, !0, e)
                }
                ,
                Buffer.prototype.writeFloatBE = function(t, r, e) {
                    return N(this, t, r, !1, e)
                }
                ,
                Buffer.prototype.writeDoubleLE = function(t, r, e) {
                    return F(this, t, r, !0, e)
                }
                ,
                Buffer.prototype.writeDoubleBE = function(t, r, e) {
                    return F(this, t, r, !1, e)
                }
                ,
                Buffer.prototype.copy = function(t, r, e, n) {
                    if (e || (e = 0),
                    n || 0 === n || (n = this.length),
                    r >= t.length && (r = t.length),
                    r || (r = 0),
                    n > 0 && n < e && (n = e),
                    n === e)
                        return 0;
                    if (0 === t.length || 0 === this.length)
                        return 0;
                    if (r < 0)
                        throw new RangeError("targetStart out of bounds");
                    if (e < 0 || e >= this.length)
                        throw new RangeError("sourceStart out of bounds");
                    if (n < 0)
                        throw new RangeError("sourceEnd out of bounds");
                    n > this.length && (n = this.length),
                    t.length - r < n - e && (n = t.length - r + e);
                    var i, o = n - e;
                    if (this === t && e < r && r < n)
                        for (i = o - 1; i >= 0; --i)
                            t[i + r] = this[i + e];
                    else if (o < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT)
                        for (i = 0; i < o; ++i)
                            t[i + r] = this[i + e];
                    else
                        Uint8Array.prototype.set.call(t, this.subarray(e, e + o), r);
                    return o
                }
                ,
                Buffer.prototype.fill = function(t, r, e, n) {
                    if ("string" == typeof t) {
                        if ("string" == typeof r ? (n = r,
                        r = 0,
                        e = this.length) : "string" == typeof e && (n = e,
                        e = this.length),
                        1 === t.length) {
                            var i = t.charCodeAt(0);
                            i < 256 && (t = i)
                        }
                        if (void 0 !== n && "string" != typeof n)
                            throw new TypeError("encoding must be a string");
                        if ("string" == typeof n && !Buffer.isEncoding(n))
                            throw new TypeError("Unknown encoding: " + n)
                    } else
                        "number" == typeof t && (t = 255 & t);
                    if (r < 0 || this.length < r || this.length < e)
                        throw new RangeError("Out of range index");
                    if (e <= r)
                        return this;
                    r >>>= 0,
                    e = void 0 === e ? this.length : e >>> 0,
                    t || (t = 0);
                    var o;
                    if ("number" == typeof t)
                        for (o = r; o < e; ++o)
                            this[o] = t;
                    else {
                        var f = Buffer.isBuffer(t) ? t : q(new Buffer(t,n).toString())
                          , u = f.length;
                        for (o = 0; o < e - r; ++o)
                            this[o + r] = f[o % u]
                    }
                    return this
                }
                ;
                var tt = /[^+\/0-9A-Za-z-_]/g
            }
            ).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }
        , {
            "base64-js": 30,
            ieee754: 32,
            isarray: 34
        }],
        30: [function(t, r, e) {
            "use strict";
            function n(t) {
                var r = t.length;
                if (r % 4 > 0)
                    throw new Error("Invalid string. Length must be a multiple of 4");
                return "=" === t[r - 2] ? 2 : "=" === t[r - 1] ? 1 : 0
            }
            function i(t) {
                return 3 * t.length / 4 - n(t)
            }
            function o(t) {
                var r, e, i, o, f, u, a = t.length;
                f = n(t),
                u = new h(3 * a / 4 - f),
                i = f > 0 ? a - 4 : a;
                var s = 0;
                for (r = 0,
                e = 0; r < i; r += 4,
                e += 3)
                    o = c[t.charCodeAt(r)] << 18 | c[t.charCodeAt(r + 1)] << 12 | c[t.charCodeAt(r + 2)] << 6 | c[t.charCodeAt(r + 3)],
                    u[s++] = o >> 16 & 255,
                    u[s++] = o >> 8 & 255,
                    u[s++] = 255 & o;
                return 2 === f ? (o = c[t.charCodeAt(r)] << 2 | c[t.charCodeAt(r + 1)] >> 4,
                u[s++] = 255 & o) : 1 === f && (o = c[t.charCodeAt(r)] << 10 | c[t.charCodeAt(r + 1)] << 4 | c[t.charCodeAt(r + 2)] >> 2,
                u[s++] = o >> 8 & 255,
                u[s++] = 255 & o),
                u
            }
            function f(t) {
                return s[t >> 18 & 63] + s[t >> 12 & 63] + s[t >> 6 & 63] + s[63 & t]
            }
            function u(t, r, e) {
                for (var n, i = [], o = r; o < e; o += 3)
                    n = (t[o] << 16) + (t[o + 1] << 8) + t[o + 2],
                    i.push(f(n));
                return i.join("")
            }
            function a(t) {
                for (var r, e = t.length, n = e % 3, i = "", o = [], f = 16383, a = 0, c = e - n; a < c; a += f)
                    o.push(u(t, a, a + f > c ? c : a + f));
                return 1 === n ? (r = t[e - 1],
                i += s[r >> 2],
                i += s[r << 4 & 63],
                i += "==") : 2 === n && (r = (t[e - 2] << 8) + t[e - 1],
                i += s[r >> 10],
                i += s[r >> 4 & 63],
                i += s[r << 2 & 63],
                i += "="),
                o.push(i),
                o.join("")
            }
            e.byteLength = i,
            e.toByteArray = o,
            e.fromByteArray = a;
            for (var s = [], c = [], h = "undefined" != typeof Uint8Array ? Uint8Array : Array, l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = 0, d = l.length; p < d; ++p)
                s[p] = l[p],
                c[l.charCodeAt(p)] = p;
            c["-".charCodeAt(0)] = 62,
            c["_".charCodeAt(0)] = 63
        }
        , {}],
        31: [function(t, r, e) {
            function n() {
                if (!(this instanceof n))
                    return new n
            }
            !function(t) {
                function e(t) {
                    for (var r in s)
                        t[r] = s[r];
                    return t
                }
                function n(t, r) {
                    return u(this, t).push(r),
                    this
                }
                function i(t, r) {
                    function e() {
                        o.call(n, t, e),
                        r.apply(this, arguments)
                    }
                    var n = this;
                    return e.originalListener = r,
                    u(n, t).push(e),
                    n
                }
                function o(t, r) {
                    function e(t) {
                        return t !== r && t.originalListener !== r
                    }
                    var n, i = this;
                    if (arguments.length) {
                        if (r) {
                            if (n = u(i, t, !0)) {
                                if (n = n.filter(e),
                                !n.length)
                                    return o.call(i, t);
                                i[a][t] = n
                            }
                        } else if (n = i[a],
                        n && (delete n[t],
                        !Object.keys(n).length))
                            return o.call(i)
                    } else
                        delete i[a];
                    return i
                }
                function f(t, r) {
                    function e(t) {
                        t.call(o)
                    }
                    function n(t) {
                        t.call(o, r)
                    }
                    function i(t) {
                        t.apply(o, s)
                    }
                    var o = this
                      , f = u(o, t, !0);
                    if (!f)
                        return !1;
                    var a = arguments.length;
                    if (1 === a)
                        f.forEach(e);
                    else if (2 === a)
                        f.forEach(n);
                    else {
                        var s = Array.prototype.slice.call(arguments, 1);
                        f.forEach(i)
                    }
                    return !!f.length
                }
                function u(t, r, e) {
                    if (!e || t[a]) {
                        var n = t[a] || (t[a] = {});
                        return n[r] || (n[r] = [])
                    }
                }
                "undefined" != typeof r && (r.exports = t);
                var a = "listeners"
                  , s = {
                    on: n,
                    once: i,
                    off: o,
                    emit: f
                };
                e(t.prototype),
                t.mixin = e
            }(n)
        }
        , {}],
        32: [function(t, r, e) {
            e.read = function(t, r, e, n, i) {
                var o, f, u = 8 * i - n - 1, a = (1 << u) - 1, s = a >> 1, c = -7, h = e ? i - 1 : 0, l = e ? -1 : 1, p = t[r + h];
                for (h += l,
                o = p & (1 << -c) - 1,
                p >>= -c,
                c += u; c > 0; o = 256 * o + t[r + h],
                h += l,
                c -= 8)
                    ;
                for (f = o & (1 << -c) - 1,
                o >>= -c,
                c += n; c > 0; f = 256 * f + t[r + h],
                h += l,
                c -= 8)
                    ;
                if (0 === o)
                    o = 1 - s;
                else {
                    if (o === a)
                        return f ? NaN : (p ? -1 : 1) * (1 / 0);
                    f += Math.pow(2, n),
                    o -= s
                }
                return (p ? -1 : 1) * f * Math.pow(2, o - n)
            }
            ,
            e.write = function(t, r, e, n, i, o) {
                var f, u, a, s = 8 * o - i - 1, c = (1 << s) - 1, h = c >> 1, l = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0, p = n ? 0 : o - 1, d = n ? 1 : -1, y = r < 0 || 0 === r && 1 / r < 0 ? 1 : 0;
                for (r = Math.abs(r),
                isNaN(r) || r === 1 / 0 ? (u = isNaN(r) ? 1 : 0,
                f = c) : (f = Math.floor(Math.log(r) / Math.LN2),
                r * (a = Math.pow(2, -f)) < 1 && (f--,
                a *= 2),
                r += f + h >= 1 ? l / a : l * Math.pow(2, 1 - h),
                r * a >= 2 && (f++,
                a /= 2),
                f + h >= c ? (u = 0,
                f = c) : f + h >= 1 ? (u = (r * a - 1) * Math.pow(2, i),
                f += h) : (u = r * Math.pow(2, h - 1) * Math.pow(2, i),
                f = 0)); i >= 8; t[e + p] = 255 & u,
                p += d,
                u /= 256,
                i -= 8)
                    ;
                for (f = f << i | u,
                s += i; s > 0; t[e + p] = 255 & f,
                p += d,
                f /= 256,
                s -= 8)
                    ;
                t[e + p - d] |= 128 * y
            }
        }
        , {}],
        33: [function(t, r, e) {
            (function(Buffer) {
                var t, r, n, i;
                !function(e) {
                    function o(t, r, n) {
                        function i(t, r, e, n) {
                            return this instanceof i ? v(this, t, r, e, n) : new i(t,r,e,n)
                        }
                        function o(t) {
                            return !(!t || !t[F])
                        }
                        function v(t, r, e, n, i) {
                            if (E && A && (r instanceof A && (r = new E(r)),
                            n instanceof A && (n = new E(n))),
                            !(r || e || n || g))
                                return void (t.buffer = h(m, 0));
                            if (!s(r, e)) {
                                var o = g || Array;
                                i = e,
                                n = r,
                                e = 0,
                                r = new o(8)
                            }
                            t.buffer = r,
                            t.offset = e |= 0,
                            b !== typeof n && ("string" == typeof n ? x(r, e, n, i || 10) : s(n, i) ? c(r, e, n, i) : "number" == typeof i ? (k(r, e + T, n),
                            k(r, e + S, i)) : n > 0 ? O(r, e, n) : n < 0 ? L(r, e, n) : c(r, e, m, 0))
                        }
                        function x(t, r, e, n) {
                            var i = 0
                              , o = e.length
                              , f = 0
                              , u = 0;
                            "-" === e[0] && i++;
                            for (var a = i; i < o; ) {
                                var s = parseInt(e[i++], n);
                                if (!(s >= 0))
                                    break;
                                u = u * n + s,
                                f = f * n + Math.floor(u / B),
                                u %= B
                            }
                            a && (f = ~f,
                            u ? u = B - u : f++),
                            k(t, r + T, f),
                            k(t, r + S, u)
                        }
                        function P() {
                            var t = this.buffer
                              , r = this.offset
                              , e = _(t, r + T)
                              , i = _(t, r + S);
                            return n || (e |= 0),
                            e ? e * B + i : i
                        }
                        function R(t) {
                            var r = this.buffer
                              , e = this.offset
                              , i = _(r, e + T)
                              , o = _(r, e + S)
                              , f = ""
                              , u = !n && 2147483648 & i;
                            for (u && (i = ~i,
                            o = B - o),
                            t = t || 10; ; ) {
                                var a = i % t * B + o;
                                if (i = Math.floor(i / t),
                                o = Math.floor(a / t),
                                f = (a % t).toString(t) + f,
                                !i && !o)
                                    break
                            }
                            return u && (f = "-" + f),
                            f
                        }
                        function k(t, r, e) {
                            t[r + D] = 255 & e,
                            e >>= 8,
                            t[r + C] = 255 & e,
                            e >>= 8,
                            t[r + Y] = 255 & e,
                            e >>= 8,
                            t[r + I] = 255 & e
                        }
                        function _(t, r) {
                            return t[r + I] * U + (t[r + Y] << 16) + (t[r + C] << 8) + t[r + D]
                        }
                        var T = r ? 0 : 4
                          , S = r ? 4 : 0
                          , I = r ? 0 : 3
                          , Y = r ? 1 : 2
                          , C = r ? 2 : 1
                          , D = r ? 3 : 0
                          , O = r ? l : d
                          , L = r ? p : y
                          , M = i.prototype
                          , N = "is" + t
                          , F = "_" + N;
                        return M.buffer = void 0,
                        M.offset = 0,
                        M[F] = !0,
                        M.toNumber = P,
                        M.toString = R,
                        M.toJSON = P,
                        M.toArray = f,
                        w && (M.toBuffer = u),
                        E && (M.toArrayBuffer = a),
                        i[N] = o,
                        e[t] = i,
                        i
                    }
                    function f(t) {
                        var r = this.buffer
                          , e = this.offset;
                        return g = null,
                        t !== !1 && 0 === e && 8 === r.length && x(r) ? r : h(r, e)
                    }
                    function u(t) {
                        var r = this.buffer
                          , e = this.offset;
                        if (g = w,
                        t !== !1 && 0 === e && 8 === r.length && Buffer.isBuffer(r))
                            return r;
                        var n = new w(8);
                        return c(n, 0, r, e),
                        n
                    }
                    function a(t) {
                        var r = this.buffer
                          , e = this.offset
                          , n = r.buffer;
                        if (g = E,
                        t !== !1 && 0 === e && n instanceof A && 8 === n.byteLength)
                            return n;
                        var i = new E(8);
                        return c(i, 0, r, e),
                        i.buffer
                    }
                    function s(t, r) {
                        var e = t && t.length;
                        return r |= 0,
                        e && r + 8 <= e && "string" != typeof t[r]
                    }
                    function c(t, r, e, n) {
                        r |= 0,
                        n |= 0;
                        for (var i = 0; i < 8; i++)
                            t[r++] = 255 & e[n++]
                    }
                    function h(t, r) {
                        return Array.prototype.slice.call(t, r, r + 8)
                    }
                    function l(t, r, e) {
                        for (var n = r + 8; n > r; )
                            t[--n] = 255 & e,
                            e /= 256
                    }
                    function p(t, r, e) {
                        var n = r + 8;
                        for (e++; n > r; )
                            t[--n] = 255 & -e ^ 255,
                            e /= 256
                    }
                    function d(t, r, e) {
                        for (var n = r + 8; r < n; )
                            t[r++] = 255 & e,
                            e /= 256
                    }
                    function y(t, r, e) {
                        var n = r + 8;
                        for (e++; r < n; )
                            t[r++] = 255 & -e ^ 255,
                            e /= 256
                    }
                    function v(t) {
                        return !!t && "[object Array]" == Object.prototype.toString.call(t)
                    }
                    var g, b = "undefined", w = b !== typeof Buffer && Buffer, E = b !== typeof Uint8Array && Uint8Array, A = b !== typeof ArrayBuffer && ArrayBuffer, m = [0, 0, 0, 0, 0, 0, 0, 0], x = Array.isArray || v, B = 4294967296, U = 16777216;
                    t = o("Uint64BE", !0, !0),
                    r = o("Int64BE", !0, !1),
                    n = o("Uint64LE", !1, !0),
                    i = o("Int64LE", !1, !1)
                }("object" == typeof e && "string" != typeof e.nodeName ? e : this || {})
            }
            ).call(this, t("buffer").Buffer)
        }
        , {
            buffer: 29
        }],
        34: [function(t, r, e) {
            var n = {}.toString;
            r.exports = Array.isArray || function(t) {
                return "[object Array]" == n.call(t)
            }
        }
        , {}]
    }, {}, [1])(1)
});

var MulitLoadFixer = pc.createScript("mulitLoadFixer");
MulitLoadFixer.attributes.add("sceneID", {
    type: "string"
}),
MulitLoadFixer.prototype.initialize = function() {
    if (MulitLoadFixer[this.sceneID]) {
        var e = this.app.root;
        for (let i = 0; i < e.children.length; i++)
            e.children[i].enabled = !1
    } else
        MulitLoadFixer[this.sceneID] = !0
}
;
class EventManager {
    constructor() {
        pc.Application.getApplication();
        this.endpoint = "event"
    }
    buildEventData(e, a={}, t=1) {
        var o = {};
        const s = {
            platform: pc.platform.environment
        };
        var r = {
            currency: Game.currency,
            stars: Game.points
        }
          , c = {
            serverId: Game.gameData?.gameId
        }
          , n = {
            townName: Game.townName,
            townPosition: {
                x: Game.position?.x,
                y: Game.position?.y
            },
            worldType: Game.town?.worldType || Game.world?.GetTypeAtPosition(Game.position?.x, Game.position?.y)
        }
          , i = {
            basePrice: Game.craftData[TradeUI.instance?.selectedCraftName]?.CityPrice,
            objectName: Game.town?.selectedObject.type,
            sellQuantity: Game.unitsData[Game.town?.selectedObject.objData?.UnitType]?.Capacity,
            unitType: Game.town?.selectedObject.objData?.UnitType,
            x: Game.town?.selectedObject.townX,
            z: Game.town?.selectedObject.townZ
        };
        switch (e) {
        case "ftue_start":
        case "server_select":
        case "game_launch":
            o = {
                ...o,
                ...s,
                ...c
            };
            break;
        case "town_claimed":
            o = {
                galaPower: Game.galaPower,
                townObject: Game.town.Serialize()
            };
        case "leaderboard_open":
            o = {
                ...o,
                ...r
            };
            break;
        case "ftue_complete":
        case "ftue_step_1":
            o = {
                ...n,
                worldType: n.worldType
            };
            break;
        case "craft_start":
        case "craft_stop":
            o = {
                ...o,
                laborCost: Game.town?.GetTotalLaborCost()
            };
            break;
        case "game_end":
            o = {
                laborCost: Game.town?.GetTotalLaborCost()
            };
        case "challenge_complete":
            o = {
                ...o,
                ...r,
                ...n
            };
            break;
        default:
            break;
        case "game_join":
            o = {
                ...o,
                ...c,
                ...n,
                name: c.serverId,
                x: n.townPosition.x,
                z: n.townPosition.y
            };
            break;
        case "object_sell":
            o = {
                ...o,
                price: i.itemCost,
                objectName: i.objectName,
                objectType: i.objectName
            };
        case "store_buy":
            o = {
                ...o,
                name: a.itemName,
                x: i.x,
                z: i.z
            };
        case "store_open":
            o = {
                ...o,
                ...r,
                laborCost: Game.town?.GetTotalLaborCost(),
                objectPosition: {
                    x: i.x,
                    z: i.z
                },
                worldType: n.worldType
            };
            break;
        case "trade_start":
            o = {
                ...o,
                game: c.serverId
            };
        case "trade_complete":
            o = {
                ...o,
                price: i.basePrice * i.sellQuantity,
                points: r.stars,
                game: c.serverId,
                laborCost: Game.town?.GetTotalLaborCost(),
                ...c
            };
        case "trade_cancel":
            o = {
                ...o,
                income: i.basePrice * i.sellQuantity,
                sellQuantity: i.sellQuantity,
                ...n
            };
        case "trade_open":
            o = {
                ...o,
                ...r,
                objectName: i.objectName,
                unitType: i.unitType
            };
            break;
        case "nft_placed":
        case "nft_return":
            o = {
                ...o,
                galaPower: Game.galaPower
            }
        }
        return {
            name: e,
            data: {
                ...o,
                ...a
            }
        }
    }
}
function arrayToPath(e) {
    const t = [];
    for (let r = 0; r < e.length; r += 2)
        t.push({
            x: e[r + 0],
            z: e[r + 1]
        });
    return t
}
function pathToArray(e) {}
const RETRY_COUNT = 5;
class Api {
    constructor({sessionId: e, baseUri: t, msgpack: r, token: s}) {
        this.sessionId = e,
        this.baseUri = t,
        this.msgpack = r,
        this.userId = null,
        this.secret = null,
        this.token = s,
        this.log("Configuration", {
            sessionId: e,
            baseUri: t,
            msgpack: r
        });
        const n = r ? "application/msgpack" : "application/json";
        this.headers = {
            "Content-Type": n,
            Accept: n,
            "X-SessionId": this.sessionId
        },
        this.alwaysFail = !1,
        this.textEncoder = new TextEncoder("utf8"),
        this.textDecoder = new TextDecoder("utf8"),
        this.eventManager = new EventManager
    }
    encode(e) {
        return this.msgpack ? window.msgpack.encode(e) : this.textEncoder.encode(JSON.stringify(e, ((e,t)=>t && "TypedArray" === Object.getPrototypeOf(t.constructor).name ? {
            $buffer: t.constructor.name,
            data: t.join(",")
        } : t)))
    }
    decode(e) {
        if (0 === e.byteLength)
            return null;
        if (this.msgpack)
            return window.msgpack.decode(new Uint8Array(e));
        {
            const t = this.textDecoder.decode(e);
            if (t)
                return JSON.parse(t, ((e,t)=>{
                    if (t && "string" == typeof t.$buffer) {
                        return new (Object.create(window[t.$buffer].prototype).constructor)(t.data.split(",").map((e=>+e)))
                    }
                    return t
                }
                ))
        }
    }
    request(e, t, r, s, n=!1) {
        const {baseUri: a, msgpack: i, alwaysFail: o} = this
          , g = s && Object.keys(s).map((e=>`${e}=${s[e]}`)).join("&");
        let h = 0;
        const readBody = e=>e.arrayBuffer().then((e=>this.decode(e)))
          , u = Object.assign({}, this.headers, n && this.token && {
            "X-Gala": this.token
        })
          , req = ()=>{
            const s = performance.now()
              , n = `${a}/${t}${g && "?" + g || ""}`;
            return o ? Promise.reject(new Error("always fail")) : fetch(n, {
                method: e,
                headers: u,
                credentials: "include",
                mode: "cors",
                body: r && this.encode(r)
            }).then((e=>{
                const t = (performance.now() - s) / 1e3;
                if (PERF.api.add(t),
                !e.ok) {
                    if (403 === e.status)
                        alert("Game is playing on another device."),
                        window.location.href = "https://app.gala.games/";
                    else {
                        if (e.status >= 500 && e.status <= 599) {
                            if (h >= 5)
                                throw this.log("Retries failed", e.status),
                                e;
                            return h++,
                            this.log("Retrying", e.status, h, "out of", 5),
                            req()
                        }
                        if (400 == e.status)
                            return readBody(e).then((e=>{
                                throw e
                            }
                            ))
                    }
                    throw e
                }
                return e
            }
            )).catch((e=>{
                if (e instanceof Error) {
                    if (h >= 5)
                        throw this.log("Retries failed", e),
                        e;
                    return h++,
                    this.log("Retrying", e, h, "out of", 5),
                    req()
                }
                throw e
            }
            ))
        }
        ;
        return req().catch((e=>{
            if ("authenticate" !== t && 401 === e.status)
                return this.authenticate().then((()=>req()));
            throw e
        }
        )).then((e=>readBody(e)))
    }
    get(e, t, r=!1) {
        return this.request("GET", e, null, t, r)
    }
    post(e, t, r, s=!1) {
        return this.request("POST", e, t, r, s)
    }
    delete(e, t, r, s=!1) {
        return this.request("DELETE", e, t, r, s)
    }
    ping() {
        return this.get("ping")
    }
    ping2() {
        return this.post("ping", {
            test123: !0
        })
    }
    register(e, t) {
        return this.post("register", {
            name: e,
            secret: t
        })
    }
    authenticate() {
        return this.post("authenticate", {
            userId: this.userId,
            secret: this.secret,
            token: this.token
        })
    }
    getSelf() {
        return this.get("self")
    }
    getUser(e) {
        return this.get(`user/${e}`)
    }
    scoreLeaderboard(e, t) {
        const r = {};
        return null != e && (r.start = e),
        null != t && (r.stop = t),
        this.get(`game/${this.gameId}/leader/score`, r)
    }
    scoreLeaderboardReverse(e, t) {
        const r = {};
        return null != e && (r.start = e),
        null != t && (r.stop = t),
        this.get(`game/${this.gameId}/leader/score/reverse`, r)
    }
    scoreLeaderboardGame(e) {
        return this.get(`game/${e}/leader/score`)
    }
    addFriend(e) {
        return this.post("friends", {
            name: e
        })
    }
    getFriends() {
        return this.get("friends")
    }
    deleteFriend(e) {
        return this.delete(`friends/${e}`)
    }
    sendMessage(e, t) {
        return this.post(`friends/${e}/message`, {
            message: t
        })
    }
    getGame() {
        return this.get(`game/${this.gameId}`)
    }
    getNextGame() {
        return this.get(`game/${this.gameId}/next`)
    }
    getLastWinner() {
        return this.get(`game/${this.gameId}/last-winner`)
    }
    joinGame(e, t, r) {
        return this.post(`game/${this.gameId}/join`, {
            name: e,
            x: t,
            y: r
        })
    }
    getGameSelf() {
        return this.get(`game/${this.gameId}/self`)
    }
    updateGameSelf(e, t) {
        return this.post(`game/${this.gameId}/self`, {
            currency: t,
            points: e
        })
    }
    getTown() {
        return this.get(`game/${this.gameId}/town`)
    }
    saveTown(e) {
        return this.post(`game/${this.gameId}/town`, e)
    }
    getGames() {
        return this.get("games")
    }
    viewMap(e, t, r, s) {
        return this.get(`game/${this.gameId}/map`, {
            fromX: e,
            fromY: t,
            toX: r,
            toY: s
        })
    }
    event(e, t) {
        const {eventManager: r} = this
          , s = r.buildEventData(e, t);
        return this.post(r.endpoint, s)
    }
    getTrades() {
        return this.get(`game/${this.gameId}/trade`).then((e=>(e.forEach((e=>e.path = arrayToPath(e.path))),
        e)))
    }
    deleteTrade(e, t) {
        return this.delete(`game/${this.gameId}/trade`, {
            x: e,
            z: t
        })
    }
    createTrade(e, t, r, s, n, a, i) {
        const o = a.reduce(((e,t,r)=>(e.set([t.x, t.z], 2 * r),
        e)), new Uint16Array(2 * a.length));
        return this.post(`game/${this.gameId}/trade`, {
            duration: e,
            unitType: t,
            craftType: r,
            destination: s,
            source: n,
            path: o,
            skin: i
        })
    }
    viewTradeMap(e, t, r, s) {
        return this.get(`game/${this.gameId}/trade-map`, {
            fromX: e,
            fromY: t,
            toX: r,
            toY: s
        }).then((e=>(e.forEach((e=>e.path = arrayToPath(e.path))),
        e)))
    }
    getGameUser(e) {
        return this.get(`game/${this.gameId}/user/${e}`)
    }
    getGameUserAtPosition(e, t) {
        return this.get(`game/${this.gameId}/position`, {
            x: e,
            z: t
        })
    }
    deleteTown() {
        return this.delete(`game/${this.gameId}/town`)
    }
    addLedger(e, t) {
        return this.post(`game/${this.gameId}/ledger`, {
            type: e,
            data: t
        })
    }
    createConveyor(e, t) {
        return this.post(`game/${this.gameId}/conveyor`, {
            x: e,
            z: t
        })
    }
    getConveyors() {
        return this.get(`game/${this.gameId}/conveyor`)
    }
    getConveyor(e) {
        return this.get(`game/${this.gameId}/conveyor/${e}`)
    }
    takeConveyorItem(e, t) {
        return this.delete(`game/${this.gameId}/conveyor/${e}/${t}`)
    }
    sendOnConveyor(e, t) {
        return this.post(`game/${this.gameId}/conveyor/${e}`, {
            craft: t
        })
    }
    acceptConveyor(e) {
        return this.post(`game/${this.gameId}/conveyor/${e}/accept`)
    }
    rejectConveyor(e) {
        return this.post(`game/${this.gameId}/conveyor/${e}/reject`)
    }
    setConveyorReceiverState(e, t) {
        return this.post(`/game/${this.gameId}/conveyor/receiver/${e}`, {
            state: t
        })
    }
    getItems(e) {
        return this.post("items", {
            items: e
        })
    }
    getItemRecipes() {
        return this.get("recipes")
    }
    getItemRecipe(e) {
        return this.get(`recipes/${e}`)
    }
    getPendingCrafts() {
        return this.get("items/pending")
    }
    getDrops() {
        return this.get(`game/${this.gameId}/drops`)
    }
    getBalance(e) {
        return this.get(`balance/${e}`)
    }
    setServer(e) {
        return this.post(`self/server/${e}`)
    }
    getUserData(e) {
        return this.get("self/data" + (e && `/${e}` || ""))
    }
    setUserData(e, t) {
        return this.post(`self/data/${e}`, t)
    }
    deleteUserData(e) {
        return this.delete(`self/data/${e}`)
    }
    serverLog(e, t, r) {
        return this.post("self/log", {
            context: e,
            level: t,
            data: r
        })
    }
    getReferrals() {
        return this.get("referrals")
    }
    acceptReferral(e) {
        return this.post(`referrals/${e}/accept`)
    }
    getQuest(e) {
        return this.get(`quest/${e}`)
    }
    getQuestStatus() {
        return this.get("quest")
    }
    getReferralLink() {
        return this.get("referral-link", null, !0)
    }
    collectEarnings(e) {
        return this.post("quest/collect", e)
    }
}
Api.prototype.log = logger && logger({
    context: "API",
    color: "blue",
    timing: !0
});
const API = new Api(SERVER_CONFIG);
var TouchFixer = pc.createScript("touchFixer");
TouchFixer.prototype.initialize = function() {
    var t = this.app.touch;
    t && t.on(pc.EVENT_TOUCHEND, (function(t) {
        t.event.preventDefault()
    }
    ))
}
;
var StoreHudbutton = pc.createScript("storeHudbutton");
StoreHudbutton.prototype.initialize = function() {}
,
StoreHudbutton.prototype.update = function(t) {}
;
var GameLogic = pc.createScript("gameLogic");
GameLogic.attributes.add("materials", {
    type: "asset",
    assetType: "material",
    array: !0
}),
GameLogic.prototype.initialize = function() {
    var e = new Graph([[1, 0, 0, 0, 0], [1, 0, 0, 1, 0], [1, 0, 0, 1, 1], [1, 0, 0, 1, 1], [1, 1, 1, 1, 1]],{
        diagonal: !0
    })
      , t = e.grid[0][0]
      , a = e.grid[4][4]
      , o = astar.search(e, t, a, {
        heuristic: astar.heuristics.diagonal
    })
      , s = new pc.Entity;
    s.addComponent("model", {
        type: "box"
    }),
    s.setPosition(t.x, 0, t.y),
    s.model.meshInstances[0].material = this.materials[2].resource,
    s.setLocalScale(.2, .2, .2),
    this.app.root.addChild(s);
    var n = new pc.Entity;
    for (n.addComponent("model", {
        type: "box"
    }),
    n.setPosition(a.x, 0, a.y),
    n.model.meshInstances[0].material = this.materials[0].resource,
    n.setLocalScale(.2, .2, .2),
    this.app.root.addChild(n),
    i = 0; i < e.nodes.length; i++) {
        var r = new pc.Entity;
        r.addComponent("model", {
            type: "plane"
        }),
        r.setPosition(e.nodes[i].x, 0, e.nodes[i].y),
        1 == e.nodes[i].weight ? r.model.meshInstances[0].material = this.materials[3].resource : r.model.meshInstances[0].material = this.materials[4].resource,
        this.app.root.addChild(r)
    }
    var c = [];
    for (i = 0; i < o.length; i++) {
        var d = new pc.Entity;
        d.addComponent("model", {
            type: "box"
        }),
        d.setPosition(o[i].x, 0, o[i].y),
        d.setLocalScale(.2, .2, .2),
        d.model.meshInstances[0].material = this.materials[1].resource,
        this.app.root.addChild(d),
        c.push(new pc.Vec3(o[i].x,0,o[i].y))
    }
    console.log("length is ", c.length);
    var l = new pc.Entity;
    l.addComponent("model", {
        type: "box"
    }),
    l.setLocalScale(.2, .2, .2),
    l.setPosition(t.x, 0, t.y),
    l.addComponent("script"),
    l.script.create("unitLogic"),
    l.model.meshInstances[0].material = this.materials[5].resource,
    l.script.unitLogic.targetPosition = new pc.Vec3(o[0].x,0,o[0].y),
    l.script.unitLogic.pathArray = c,
    this.app.root.addChild(l)
}
,
GameLogic.prototype.update = function(e) {}
;
RotationHelper = {},
RotationHelper.normalizeRotation = t=>t - 360 * Math.floor(t / 360);
class TS_Object {
    constructor(t, i, e, s, o, n=null) {
        this.debug = !1,
        this.entity = new pc.Entity,
        o.objParent.addChild(this.entity),
        this.entity.setPosition(i, 0, e),
        this.exists = !0,
        this.type = t.replace(/ /g, "_"),
        this.data = n,
        this.worldX = i,
        this.worldZ = e,
        this.town = o;
        const a = this.town.WorldSpacePositionToLocalPosition(i, e);
        if (this.townX = a.x,
        this.townZ = a.z,
        this.objData = Game.objectData[this.type],
        isNaN(s) && ("None" == this.objData.RotateTo ? s = 0 : this.town.townLoaded ? s = this.GetRotationToEdgeClass() : (s = 0,
        this.town.objParent.once("Townloaded", (()=>{
            const t = this.GetRotationToEdgeClass();
            this._SetRotation(t)
        }
        )))),
        this.rotation = RotationHelper.normalizeRotation(s),
        this.LoadEntity(),
        this.unitList = [],
        "None" != this.objData.UnitType && "Trade" != this.objData.Class) {
            var h = this.entity.getPosition();
            for (let t = 0; t < this.objData.UTValue; t++) {
                const i = new TS_Unit(this.objData.UnitType,h.x,h.z,t,this);
                this.unitList.push(i),
                i.entity.setRotation(this.entity.getRotation())
            }
        }
        switch (this.artLogicObject = new TS_ArtLogic(this.entity,this),
        this.logicType = TS_ObjectLogic.GetLogicType(t),
        this.logicType) {
        case "VOX_Home":
            this.logicObject = new TS_VoxHomeLogic(this);
            break;
        case "CraneBot":
            this.logicObject = new TS_CraneObjectLogic(this);
            break;
        case "BuildSite":
            this.logicObject = new TS_ConstructionSiteLogic(this);
            break;
        case "HolidayTree":
        case "SaltyBot_Shack":
            this.logicObject = new TS_JoyTreeLogic(this);
            break;
        case "Jimmy":
            this.logicObject = new TS_JimmySenderLogic(this);
            break;
        case "Trade":
            this.logicObject = new TS_TradeObjectLogic(this);
            break;
        case "Crafter":
            this.logicObject = new TS_CrafterObjectLogic(this);
            break;
        case "Storage":
        case "CraftExchange":
            this.logicObject = new TS_StorageObjectLogic(this);
            break;
        default:
            this.logicObject = new TS_ObjectLogic(this)
        }
        SKINS[this.type] && this.setSkinnedEntity(SKINS[this.type])
    }
    OnTapped() {
        this.logicObject.OnTapped()
    }
    select() {
        for (const t of this.unitList)
            console.log("Unit Homeselected"),
            t.onHomeSelect()
    }
    isSkinned() {
        return !!SKINS[this.type]
    }
    deselect() {
        for (const t of this.unitList)
            t.onHomeDeselect()
    }
    GetPathingNodes() {
        const t = [[]];
        let i;
        t.pop();
        const e = this.objData.PathBase.split(",")
          , s = this.objData.PathMask.split(",");
        if (Game.pathingData[this.objData.PathMaskType])
            if ("Tiled" == this.objData.PathMaskType) {
                const t = this.town.GetTilingDataAt(this.townX, this.townZ, this.type).modifier;
                i = Game.pathingData[this.objData.PathMaskType][t] ? Game.pathingData[this.objData.PathMaskType][t] : Game.pathingData.Fill
            } else
                i = Game.pathingData[this.objData.PathMaskType];
        else
            i = Game.pathingData.Fill;
        for (let o = 0; o < 5; o++) {
            const n = [];
            for (let t = 0; t < 5; t++)
                if (0 === i[t][o]) {
                    let t = 1e3;
                    if (1e3 != parseFloat(s[0])) {
                        t = 1 + 15 * (1 - parseFloat(s[1]))
                    }
                    n.push({
                        weight: t,
                        speedMod: parseFloat(s[1])
                    })
                } else {
                    let t = 1e3;
                    if (1e3 != parseFloat(e[0])) {
                        t = 1 + 15 * (1 - parseFloat(e[1]))
                    }
                    n.push({
                        weight: t,
                        speedMod: parseFloat(e[1])
                    })
                }
            t.push(n)
        }
        const o = RotationHelper.normalizeRotation(this.rotation) / 90;
        return TS_Object.GetRotatedNodeData(t, o)
    }
    static GetRotatedNodeData(t, i) {
        if (0 === i)
            return t;
        var e = [[]];
        e.pop();
        for (let t = 0; t < 5; t++) {
            var s = [];
            for (let t = 0; t < 5; t++)
                s.push(0);
            e.push(s)
        }
        for (let s = 0; s < 5; s++)
            for (let o = 0; o < 5; o++)
                1 == i && (e[o][s] = t[Math.abs(s - 4)][o]),
                2 == i && (e[o][s] = t[Math.abs(o - 4)][Math.abs(s - 4)]),
                3 == i && (e[o][s] = t[s][Math.abs(o - 4)]);
        return e
    }
    Update(t) {
        this.logicObject.Update(t),
        this.artLogicObject.Update(t);
        for (let i in this.unitList)
            this.unitList[i].Update(t);
        if (this.claimedBy) {
            const t = this.claimedBy.getTask();
            t.targetObject && t.targetObject != this && (this.claimedBy = null)
        }
    }
    GetType() {
        return this.type
    }
    GetTownPosition() {
        return new pc.Vec3(this.townX,0,this.townZ)
    }
    GetWorldSpacePosition() {
        return new pc.Vec3(this.worldX,0,this.worldZ)
    }
    GetObjectData() {
        return this.objData
    }
    Remove() {
        this.entity.destroy(),
        this.claimedBy && (this.claimedBy.logicObject.task = null),
        this.exists = !1,
        this.logicObject.OnRemove();
        for (let t in this.unitList)
            this.unitList[t].Remove()
    }
    _SetRotation(t) {
        this.rotation = RotationHelper.normalizeRotation(t),
        this.entity.setEulerAngles(0, this.rotation, 0);
        for (let t of this.unitList)
            t.isHome() && t.entity.setRotation(this.entity.getRotation())
    }
    GetRotationToEdgeClass() {
        let t = 0;
        const i = this.town.GetNeighborsOfObjectAt(this.townX, this.townZ);
        for (let e in i) {
            let s;
            if (s = i[e] ? Game.objectData[i[e].GetType()] : Game.worldObjectData[this.town.GetWorldObjectTypeFromDirection(e)],
            s) {
                if (this.objData.RotateTo.split(",").includes(s.EdgeClass)) {
                    t = 90 * e,
                    e % 2 == 0 && (t += 180);
                    break
                }
            } else
                console.log(`Could Not Find Data for object at direction ${e}`)
        }
        return t
    }
    Serialize() {
        const t = {};
        return t.type = this.type,
        t.rotation = {},
        t.rotation.y = RotationHelper.normalizeRotation(this.rotation),
        this.GetData() && (t.data = this.GetData()),
        t
    }
    DestroyEntity() {
        this.entity.destroy(),
        this.groundEntity && this.groundEntity.destroy()
    }
    OnPlaced() {
        this.logicObject.OnPlaced()
    }
    LoadEntity() {
        if ("None" == this.objData.TileWith && (this.entity = EntitySpawner.spawnObject(this.type, this.worldX, 0, this.worldZ, this.town.objParent)),
        this.entity || (this.entity = new pc.Entity,
        this.town.objParent.addChild(this.entity),
        this.entity.setPosition(this.worldX, 0, this.worldZ)),
        this.entity.tags.has("ProxVaries")) {
            var t = 0;
            (t = Game.town.GetTotalProximityAmount(this.townX, this.townZ)) > 4 && (t = 4);
            for (let i = 0; i < this.entity.children.length; i++)
                if (this.entity.children[i].tags.has("Prox" + t))
                    this.entity.children[i].enabled = !0;
                else {
                    let t = !0;
                    for (let e in this.entity.children[i].tags.list())
                        (this.entity.children[i].tags.list()[e].startsWith("VFX") || this.entity.children[i].tags.list()[e].startsWith("AFX")) && (t = !1);
                    t && (this.entity.children[i].enabled = !1)
                }
        }
        this.entity.setEulerAngles(0, this.rotation, 0),
        this.objData && (this.objData.HasDynamicGround && (this.groundEntity = EntitySpawner.spawnObject(this.town.GetGroundEntityAt(this.townX, this.townZ), this.worldX, 0, this.worldZ, this.entity)),
        "None" != this.objData.TileWith && (this.town.townLoaded ? this.TileEntity() : this.town.objParent.once("Townloaded", this.TileEntity, this)))
    }
    Rotate() {
        this._SetRotation(this.rotation + 90),
        this.logicObject.onRotate(this.rotation)
    }
    _SwapEntity(t) {
        this.entity.destroy(),
        this.entity = EntitySpawner.spawnObject(t, this.worldX, 0, this.worldZ, this.town.objParent),
        this.entity || (this.entity = new pc.Entity,
        this.entity.setLocalPosition(this.worldX, 0, this.worldZ),
        this.town.objParent.addChild(this.entity)),
        this.entity.setEulerAngles(0, this.rotation, 0),
        this.logicObject && this.logicObject.UpdateEntity(this.entity)
    }
    TileEntity() {
        if ("None" == this.objData.TileWith)
            return;
        const t = this.town.GetTilingDataAt(this.townX, this.townZ, this.type);
        this.tilingMod == t.modifier && this.rotation == t.rotation || (this.tilingMod = t.modifier,
        this.rotation = t.rotation,
        this._SwapEntity(`${this.type}${t.modifier}`),
        SKINS[this.type] && this.setSkinnedEntity(SKINS[this.type]),
        this.objData.HasDynamicGround && (this.groundEntity = EntitySpawner.spawnObject(this.town.GetGroundEntityAt(this.townX, this.townZ), this.worldX, 0, this.worldZ, this.entity)))
    }
    UpdateGround() {
        this.objData.HasDynamicGround && (this.groundEntity && this.groundEntity.destroy(),
        this.groundEntity = EntitySpawner.spawnObject(this.town.GetGroundEntityAt(this.townX, this.townZ), this.worldX, 0, this.worldZ, this.entity));
        const t = SKINS[this.type];
        if (t) {
            const s = (i = this.type,
            e = t,
            Game.skinData[Object.keys(Game.skinData).find((t=>Game.skinData[t].object == i && Game.skinData[t].skin == e))]);
            s && s.overrides && Object.keys(s.overrides).includes("HasDynamicGround") && this.groundEntity && (this.groundEntity.enabled = s.overrides.HasDynamicGround)
        }
        var i, e
    }
    SetCraft(t) {
        this.logicObject.SetCraft(t)
    }
    GetData() {
        return this.logicObject.GetData()
    }
    AddCraft(t, i=1) {
        return this.logicObject.AddCraft(t, i)
    }
    RemoveCraft(t, i=1) {
        return this.logicObject.RemoveCraft(t, i)
    }
    ApplyProxBonus(t, i) {
        this.logicObject.ApplyProxBonus(t, i)
    }
    CanStoreType(t) {
        return this.logicObject.CanStoreType(t)
    }
    CanAcceptCraft(t) {
        return this.logicObject.CanAcceptCraft(t)
    }
    CanDispenseCraft(t) {
        return this.logicObject.CanDispenseCraft(t)
    }
    HasRoom() {
        return this.logicObject.HasRoom()
    }
    GetState() {
        return this.logicObject.GetState()
    }
    SpawnDoobers(t, i, e) {}
    GetCountOfType(t) {
        return this.logicObject.GetCountOfType(t)
    }
    GetProxifiedCountOfType(t) {
        return this.logicObject.GetProxifiedCountOfType ? this.logicObject.GetProxifiedCountOfType(t) : 0
    }
    static satisfiesReqsFor(t, i) {
        let e = Game.objectData[t];
        e || (e = Game.worldObjectData[t]);
        let s = Game.objectData[i];
        if (s || (s = Game.worldObjectData[i]),
        !e)
            return null;
        if (!s)
            return null;
        const o = s.EdgeRequirements.split(":AND:");
        for (let i of o) {
            const s = i.split(":OR:");
            if (s.includes(t) || s.includes(e.EdgeClass))
                return i
        }
        return null
    }
    reqsMetBySelf() {
        return TS_Object.satisfiesReqsFor(this.type, this.type) == this.objData.EdgeRequirements
    }
    checkEdgeReqsValid() {
        if ("None" == this.objData.EdgeRequirements)
            return !0;
        if (this.reqsMetBySelf())
            return !0;
        const t = {};
        for (let i of this.objData.EdgeRequirements.split(":AND:"))
            t[i] = !1;
        const i = []
          , e = Game.town.GetNeighborsOfObjectAt(this.townX, this.townZ);
        for (let t = 0; t < 4; t++) {
            let s;
            if (e[t])
                s = e[t].GetType();
            else {
                s = Game.world.GetUserIdOfNeighbor(t) ? "Town" : Game.town.GetWorldObjectTypeFromDirection(t)
            }
            i[t] = s
        }
        for (let s = 0; s < 4; s++) {
            const o = TS_Object.satisfiesReqsFor(i[s], this.type);
            if (o) {
                let i = !1;
                if (i = !e[s] || (e[s].GetType() == this.type ? this.reqsMetBySelf() : e[s].checkEdgeReqsValid()),
                !i)
                    continue;
                !1 === t[o] && (t[o] = !0);
                let n = !0;
                for (let i in t)
                    !1 === t[i] && (n = !1);
                if (n)
                    return !0
            }
        }
        return !1
    }
    GetDisplayData() {
        return this.logicObject.GetDisplayData()
    }
    setSkinnedEntity(t) {
        const i = []
          , e = []
          , s = this.artLogicObject ? this.artLogicObject.getAnimation() : null
          , o = this.artLogicObject ? this.artLogicObject.getAnimationTime() : 0;
        this.entity.children.filter((t=>t.tags.has("Skinnable"))).forEach((s=>{
            s.enabled = !1,
            !s.tags.has("Skin:Default") && s.tags.list().some((t=>t.startsWith("Skin:"))) || i.push(s),
            s.tags.has(`Skin:${t}`) && e.push(s)
        }
        ));
        const n = (a = this.type,
        h = t,
        Game.skinData[Object.keys(Game.skinData).find((t=>Game.skinData[t].object == a && Game.skinData[t].skin == h))]);
        var a, h;
        n && n.overrides ? Object.keys(n.overrides).includes("HasDynamicGround") && this.groundEntity && (this.groundEntity.enabled = n.overrides.HasDynamicGround) : this.groundEntity && (this.groundEntity.enabled = this.objData.HasDynamicGround);
        if ((e.length > 0 ? e : i).forEach((t=>{
            t.enabled = !0
        }
        )),
        s) {
            const t = this.artLogicObject.getAnimationController();
            t && t.getAnimation(s) && (t.play(s),
            t.currentTime = o - .01)
        }
        for (const i of this.unitList || [])
            i.setSkinnedEntity(t)
    }
}
const supTileSize = 80
  , supTileSpan = 1
  , positionOnCorner = (t,e)=>!(0 !== t && 75 !== t || 0 !== e && 75 !== e);
class TS_Town {
    constructor() {
        this.loadPhases = ["loadMap", "getconveyors"],
        this.Getconveyorstates(),
        Game.app.on("RealtimeConveyorState", (t=>{
            this.RTUpdateconveyors(t)
        }
        )),
        Game.app.on("RealtimeConveyorItem", (t=>{
            console.log(t),
            this.OnReceiveCraft(t)
        }
        )),
        Game.app.on("TownMapLoadComplete", (t=>{
            this.TownPhaseComplete("loadMap")
        }
        )),
        Game.app.on("RealtimeDropClaimable", (t=>this.addPendingDrop(t))),
        API.getDrops().then((t=>{
            for (const e of t.filter((t=>"onboarding" !== t.name)))
                this.addPendingDrop(e)
        }
        )),
        this.selectedObject = {},
        this.conveyors = {},
        this.offsetX = -500,
        this.offsetZ = 0,
        this.tileSize = 5,
        this.laborTick = 0,
        this.saveTick = 0,
        this.groundBase = "Ground_F_",
        this.defaultObjectType = "Grass",
        this.objectDict = {},
        this.proxMap = [],
        this.pathingMap = [[]],
        this.pathingNodeWeights = [1e3, 25, 1e3, 5, 1],
        this.pathingMapRough = [[]],
        this.SuperTiles = [],
        this.laborPaid = !0,
        this.jimmyList = [],
        this.tradesList = [],
        this.pendingDrops = [],
        this.unitStep = 0,
        this.neighborListeners = [],
        this.neighborManageIcons = [],
        this.tradepaths = {},
        this.objParent = new pc.Entity,
        this.objParent.setPosition(this.offsetX, 0, this.offsetZ),
        Game.app.root.addChild(this.objParent),
        Game.app.on("TownTapped", this.OnTownTapped.bind(this)),
        REFERRALS.on("AllAccepted", (()=>{
            const t = EntitySpawner.spawnObject("VFX_AirDropPlane", -462.5, 0, 37.5).findByName("CraftNode")
              , e = Game.town.FindObjectType("SaltyBot_Shack");
            e && setTimeout((()=>{
                const i = t.getPosition();
                EntitySpawner.spawnObject("DooberSpawner_AirDrop", i.x, i.y, i.z, t).fire("DooberSetup", e, "Building_Materials", 1, {
                    OnLast: "doober"
                }),
                Game.town.pendingDrops.pop()
            }
            ), 8e3)
        }
        )),
        HOLIDAY_TREE_QUEST.on("Completed", (()=>{
            GenericRewardUI.vm.open()
        }
        ))
    }
    addPendingDrop(t) {
        if (t.claimable) {
            this.pendingDrops.find((e=>e.name === t.name)) || this.pendingDrops.push(t)
        }
    }
    placeNearPosition(t, e, i) {
        let o = 0;
        for (; o < 256; ) {
            const s = getSpiralPositionAtStep(e, i, o)
              , a = 5 * s.x
              , r = 5 * s.y
              , n = Game.town.GetObjectAt(a, r);
            if (n && n.objData.CanBuildUpon) {
                this.AddObject(t, a, r);
                break
            }
            o++
        }
    }
    GetCountOfObject(t) {
        let e = 0;
        for (let i in this.objectDict)
            this.objectDict[i].type == t && e++;
        return e
    }
    CheckEdgeRequirementsMet(t, e, i) {
        const {EdgeRequirements: o, EdgeExclusions: s} = Game.objectData[t];
        if ("None" === o && "None" === s)
            return !0;
        const a = [this.GetWorldObjectTypeFromDirection(0), this.GetWorldObjectTypeFromDirection(1), this.GetWorldObjectTypeFromDirection(2), this.GetWorldObjectTypeFromDirection(3)];
        let r = this.GetNeighborsOfObjectAt(e, i);
        if (r = r.filter((t=>!t || t.checkEdgeReqsValid())),
        this.edges = r.map(((t,e)=>{
            if (t)
                return {
                    name: t.type,
                    class: t.objData.EdgeClass
                };
            {
                const t = a[e];
                let i = {
                    name: t,
                    class: Game.worldObjectData[t].EdgeClass
                }
                  , o = Game.world.GetUserIdOfNeighbor(e);
                return o && (i.neighborID = o),
                i
            }
        }
        )),
        !this.edges)
            return !1;
        if ("Town" === o && this.edges.find((t=>t.neighborID)))
            return !positionOnCorner(e, i);
        let n = !1;
        n = o.indexOf(":AND:") > -1 ? o.split(":AND:").every((t=>this.edges.find((e=>e.name === t || e.class === t)))) : o.split(":OR:").some((t=>this.edges.find((e=>e.name === t || e.class === t))));
        let c = !1;
        return c = s.indexOf(":AND:") > -1 ? s.split(":AND:").every((t=>this.edges.find((e=>e.name === t || e.class === t)))) : s.split(":OR:").some((t=>this.edges.find((e=>e.name === t || e.class === t)))),
        n && !c
    }
    SetJimmyStateOnEdge(t, e, i) {
        positionOnCorner(e, i) || (API.getConveyors().then((o=>{
            if (0 === e || 75 === e)
                for (let i = 0; i <= 75; i += 5) {
                    let o = this.GetObjectAt(e, i);
                    o && o.entity.fire("SetJimmyState", t)
                }
            else if (0 === i || 75 === i)
                for (let e = 0; e <= 75; e += 5) {
                    let o = this.GetObjectAt(e, i);
                    o && o.entity.fire("SetJimmyState", t)
                }
            else
                console.log("Not on edge")
        }
        )),
        Game.saveAll())
    }
    ClearJimmyMessagesOnEdge(t, e) {
        if (!positionOnCorner(t, e)) {
            if (0 === t || 75 === t)
                for (let e = 0; e <= 75; e += 5) {
                    let i = this.GetObjectAt(t, e);
                    i && i.entity.fire("ClearJimmyMessage")
                }
            else if (0 === e || 75 === e)
                for (let t = 0; t <= 75; t += 5) {
                    let i = this.GetObjectAt(t, e);
                    i && i.entity.fire("ClearJimmyMessage")
                }
            else
                console.log("Not on edge");
            Game.saveAll()
        }
    }
    OnReceiveCraft(t) {
        let e = t.incomingCardinalDirection
          , i = t.craft;
        this.jimmyList.push(new TS_Jimmy(this,e,i))
    }
    checkTileType(t) {
        var e = {
            Grass: 1,
            Sand: 1,
            Pasture: 1,
            default: 0
        };
        return e[t] || e.default
    }
    SetTrophy(t, e) {
        let i = Game.town.GetNeighborsOfObjectAt(t, e);
        console.log(i),
        console.log(i[0].townX);
        for (var o = 0; o < 4; o++) {
            let t = i[o];
            console.log(t),
            console.log(t.townX),
            console.log(t.townZ),
            Game.town.AddObject("Grass", t.townX, t.townZ)
        }
    }
    SpawnDeliveryManageIcon(t, e) {
        let i = [{
            x: -465,
            z: -10
        }, {
            x: -415,
            z: 35
        }, {
            x: -465,
            z: 85
        }, {
            x: -510,
            z: 35
        }];
        this.neighborManageIcons[t] || (this.neighborManageIcons[t] = EntitySpawner.spawnObject("Delivery_Management_Icon", i[t].x, 5, i[t].z, Game.app.root),
        this.neighborManageIcons[t].fire("setData", e),
        this.neighborListeners.includes(e) || this.neighborListeners.push(e),
        RT.status(this.neighborListeners))
    }
    DestroyDeliveryManageIcon(t) {
        this.neighborManageIcons[t] && (this.neighborManageIcons[t].destroy(),
        delete this.neighborManageIcons[t])
    }
    Getconveyorstates() {
        API.getConveyors().then((t=>{
            this.conveyors = t,
            this.TownPhaseComplete("getconveyors");
            for (let e in t.outgoing)
                this.neighborListeners.includes(t.outgoing[e].target) || this.neighborListeners.push(t.outgoing[e].target);
            for (let e in t.incoming)
                if ("accepted" == t.incoming[e].state) {
                    let i = t.incoming[e].incomingCardinalDirection;
                    this.SpawnDeliveryManageIcon(i, t.incoming[e].userId)
                }
            RT.status(this.neighborListeners)
        }
        ))
    }
    RTUpdateconveyors(t) {
        t.conveyorId || (Game.town.conveyors.receivers[t.userId] = t.state);
        let e = !1;
        for (let i in this.conveyors.incoming)
            this.conveyors.incoming[i].conveyorId == t.conveyorId && (e = this.conveyors.incoming[i]);
        if (e)
            if ("rejected" == t.state) {
                e.state,
                e.state,
                e.state = t.state;
                let i = !0;
                for (let t in this.conveyors.incoming)
                    this.conveyors.incoming[t].userId == e.userId && "accepted" == this.conveyors.incoming[t].state && (i = !1);
                i && this.DestroyDeliveryManageIcon(e.incomingCardinalDirection)
            } else
                e.state = t.state;
        else {
            for (let i in this.conveyors.outgoing)
                this.conveyors.outgoing[i].conveyorId == t.conveyorId && (e = this.conveyors.outgoing[i]);
            e ? ("rejected" == t.state && (e.state,
            e.state),
            e.state = t.state) : t.userId != Game.userId && this.conveyors.incoming.push(t)
        }
    }
    checkEdgeReqsValid() {
        for (let t in this.objectDict) {
            const e = this.objectDict[t]
              , i = e.checkEdgeReqsValid();
            e.logicObject.reqsValid != i && (e.logicObject.reqsValid = i,
            this.townLoaded && (i ? (this.HandleProximityEffectsFrom(e.townX, e.townZ),
            e.logicObject.onReqsValid()) : (this.HandleProximityEffectsFrom(e.townX, e.townZ, "remove"),
            e.logicObject.onReqsInvalid())))
        }
    }
    OnTownTapped(t) {
        let e = this.WorldSpacePositionToLocalGrid(t.point.x, t.point.z)
          , i = (this.WorldSpacePositionToGrid(t.point.x, t.point.z),
        this.GetObjectAt(e.x, e.z));
        i && (this.selectObject(i),
        i.OnTapped())
    }
    selectObject(t) {
        Game.town.selectedObject !== t && (Game.town.selectedObject instanceof TS_Object && Game.town.selectedObject.deselect(),
        t.select(),
        Game.town.selectedObject = t,
        Game.app.fire("SelectionChanged")),
        Game.app.fire("ObjectSelected")
    }
    _PositionFromDataKey(t) {
        let e = {}
          , i = t.split(",");
        return e.x = i[0].replace(/[^\d.-]/g, ""),
        e.z = i[2].replace(/[^\d.-]/g, ""),
        e
    }
    GetTradeOffsetAt(t, e) {
        let i = this.GetObjectAt(t, e);
        if (!i)
            return {
                x: 0,
                z: 0
            };
        let o = i.rotation;
        return 0 === t || 75 == t || 0 === e || 75 == e ? 0 === o ? {
            x: 0,
            z: 1
        } : 90 == o ? {
            x: 1,
            z: 0
        } : 180 == o ? {
            x: 0,
            z: -1
        } : 270 == o ? {
            x: -1,
            z: 0
        } : {
            x: 0,
            z: 0
        } : {
            x: 0,
            z: 0
        }
    }
    Load(t) {
        if (LEDGER.townLoad(),
        this.townLoaded)
            return;
        this.SetAllProximityEffects(t);
        for (let t = -2; t <= 2; t++)
            for (let e = -2; e <= 2; e++)
                0 === e && 0 === t || new TS_SuperTile(e,t);
        for (let e in t) {
            let i = this._PositionFromDataKey(e)
              , o = t[e].type
              , s = t[e].rotation;
            s = s ? s.y : void 0;
            let a = t[e].data;
            this.AddObject(o, i.x * this.tileSize, i.z * this.tileSize, s, a)
        }
        for (let t = 0; t <= 15; t++)
            for (let e = 0; e <= 15; e++)
                this.GetObjectAt(5 * t, 5 * e) || this.AddObject(this.defaultObjectType, t * this.tileSize, e * this.tileSize);
        t.groundBase && (this.groundBase = t.groundBase),
        this.townLoaded = !0,
        this.GeneratePathingNodes(),
        this.checkEdgeReqsValid(),
        this.objParent.fire("Townloaded")
    }
    TownPhaseComplete(t) {
        this.loadPhases.includes(t) && (this.loadPhases = this.loadPhases.filter((e=>e != t)),
        0 === this.loadPhases.length && this.TownLoadComplete())
    }
    TownLoadComplete() {
        API.getItems().then((t=>{
            const e = Object.keys(t).filter((e=>Game.skinData[e] && (t[e].confirmed > 0 && t[e].pending) > 0)).map((t=>{
                const e = Game.skinData[t];
                return {
                    object: Game.objectData[e.object],
                    skin: e.skin,
                    active: !1
                }
            }
            ));
            if (API.getUserData("skinSettings").then((t=>{
                Object.keys(t || []).forEach((i=>{
                    e.find((e=>e.object.Name == i && e.skin == t[i])) && (SKINS[i] = t[i],
                    this.setSkin(i, t[i]))
                }
                )),
                Game.app.fire("TownLoadComplete")
            }
            )),
            !Game.earningsData) {
                Game.earningsData = {};
                for (const e in t) {
                    const i = t[e];
                    i.earning ? Game.earningsData[e] = i.earning : Array.isArray(i) && i.forEach((t=>{
                        Game.earningsData[`${e}:${t.voxNumber}`] = t.earning
                    }
                    ))
                }
            }
        }
        ))
    }
    GetTotalLaborCost() {
        let t = 0;
        for (let e in this.objectDict)
            t += this.objectDict[e].objData.LaborCost;
        return t
    }
    AddActiveTrade(t) {
        let e = t.source
          , i = !1;
        for (let t in this.tradesList) {
            let o = this.tradesList[t];
            if (o.source.x == e.x && o.source.z == e.z) {
                i = !0;
                break
            }
        }
        i || this.tradesList.push(t)
    }
    RemoveActiveTrade(t) {
        let e = -1;
        for (let i in this.tradesList) {
            let o = this.tradesList[i];
            if (o.source.x == t.x && o.source.z == t.z) {
                e = i;
                break
            }
        }
        e > -1 && this.tradesList.splice(e, 1)
    }
    GetActiveTradeData(t) {
        for (let e in this.tradesList) {
            let i = this.tradesList[e];
            if (i.source.x == t.x && i.source.z == t.z)
                return this.tradesList[e]
        }
        return null
    }
    RemoveJimmy(t) {
        t && (t.DestroyEntity(),
        this.jimmyList = this.jimmyList.filter((e=>e != t)))
    }
    Update(t) {
        if (this.townLoaded && Game.playClicked) {
            if (this.laborTick += t,
            this.saveTick += t,
            this.unitStep++,
            this.unitStep = 0,
            this.laborTick >= 60 || !this.laborPaid) {
                let t = this.GetTotalLaborCost();
                Game.currency >= t ? (LEDGER.laborCost(t),
                Game.addCurrency(-t),
                this.laborTick = 0,
                this.laborPaid = !0) : (this.laborPaid = !1,
                this.laborTick = 0)
            }
            this.saveTick >= 10 && (this.saveTick = 0,
            Game.saveAll());
            for (let e in this.objectDict)
                this.objectDict[e].Update(t);
            for (let e in this.jimmyList)
                this.jimmyList[e] && this.jimmyList[e].Update(t)
        }
    }
    GeneratePathingNodes() {
        let t = [[]];
        t.pop();
        for (let e = 0; e < 80; e++) {
            let e = [];
            for (let t = 0; t < 80; t++)
                e.push(0);
            t.push(e)
        }
        this.pathingMap = new Graph(t,{
            diagonal: !0
        });
        for (let t in this.objectDict) {
            let e = this.objectDict[t].GetPathingNodes();
            for (let i = 0; i < 5; i++)
                for (let o = 0; o < 5; o++)
                    this.pathingMap.grid[this.objectDict[t].GetTownPosition().x + i][this.objectDict[t].GetTownPosition().z + o].weight = e[i][o].weight,
                    this.pathingMap.grid[this.objectDict[t].GetTownPosition().x + i][this.objectDict[t].GetTownPosition().z + o].speedMod = e[i][o].speedMod
        }
        t = [[]],
        t.pop();
        for (let e = 0; e < 16; e++) {
            let e = [];
            for (let t = 0; t < 16; t++)
                e.push(0);
            t.push(e)
        }
        this.pathingMapRough = new Graph(t,{
            diagonal: !0
        });
        for (let t in this.objectDict) {
            const e = this.objectDict[t].GetPathingNodes();
            let i = 0;
            for (let t of e)
                for (let e of t)
                    i += e.weight;
            const o = i / 25;
            this.pathingMapRough.grid[this.objectDict[t].GetTownPosition().x / 5][this.objectDict[t].GetTownPosition().z / 5].weight = o
        }
    }
    FillPathingNodesAt(t, e, i) {
        for (let o = 0; o < 5; o++)
            for (let s = 0; s < 5; s++)
                this.pathingMap.grid[t + s][e + o].weight = i
    }
    findObjectsThatDispenseCrafts(t, e) {
        let i = [...t];
        "string" == typeof t && (i = [t]);
        const o = [];
        for (let t in this.objectDict) {
            if (e && e.only && !e.only.includes(this.objectDict[t].type))
                continue;
            let s = [];
            for (let e of i)
                this.objectDict[t].CanDispenseCraft(e) && s.push(e);
            s.length > 0 && o.push({
                obj: this.objectDict[t],
                crafts: s
            })
        }
        return o
    }
    findObjectsThatAcceptCraft(t, e) {
        const i = [];
        for (let o in this.objectDict)
            e && e.only && !e.only.includes(this.objectDict[o].type) || this.objectDict[o].CanAcceptCraft(t) && i.push(this.objectDict[o]);
        return i
    }
    receiveDrop(t) {
        if (t && t.source && t.contents && Array.isArray(t.contents))
            for (let e of t.contents)
                if (e.type && e.data)
                    switch (e.type.toLowerCase()) {
                    case "currency":
                        console.log("Currency Content"),
                        console.log(`Data: Amount : ${e.data.amount}`),
                        Game.addCurrency(e.data.amount);
                        break;
                    case "craft":
                        if (!e.data.craftType || !e.data.qty)
                            break;
                        console.log("Craft Content"),
                        console.log(`Data : ${e.data.craftType} (${e.data.qty})`),
                        this.addCraft(e.data.craftType, e.data.qty);
                        break;
                    default:
                        console.log(`Unsupported drop contents [${e.type}]`)
                    }
    }
    hasRoomInStorageFor(t, e=1) {}
    canReceiveDrop(t) {
        for (let e of t.contents)
            if (e.type && e.data && "craft" == e.type.toLowerCase() && (console.log(`Data : ${e.data.craftType} (${e.data.qty})`),
            this.findStorageOptions(e.data.craftType, e.data.qty).remainder > 0))
                return !1;
        return !0
    }
    findStorageOptions(t, e=1) {
        const i = {};
        let o = e;
        i.storage = [];
        const s = this.findObjectsThatAcceptCraft(t);
        for (let t of s) {
            if ("Storage" != TS_ObjectLogic.GetLogicType(t.type))
                continue;
            const e = t.logicObject.getAvailableSpace();
            if (e) {
                const s = {};
                s.obj = t;
                const a = Math.min(o, e);
                s.amount = a,
                i.storage.push(s),
                o -= a
            }
            if (o <= 0)
                break
        }
        return i.remainder = o,
        i
    }
    addCraft(t, e=1) {
        const i = this.findStorageOptions(t, e);
        for (let e of i.storage)
            e.obj.AddCraft(t, e.amount);
        return i
    }
    NodeToWorldPosition(t, e) {
        let i = {
            x: 0,
            z: 0
        };
        return i.x = t + this.offsetX - 2,
        i.z = e + this.offsetZ - 2,
        i
    }
    WorldPositionToNodeIndex(t, e) {
        let i = {
            x: 0,
            z: 0
        };
        return i.x = Math.round(t) - this.offsetX + 2,
        i.z = Math.round(e) - this.offsetZ + 2,
        i
    }
    WorldPositionToNode(t, e) {
        let i = this.WorldPositionToNodeIndex(t, e);
        if (this.pathingMap.grid[i.x])
            return this.pathingMap.grid[i.x][i.z]
    }
    GetRoughPath(t, e) {
        return astar.search(this.pathingMapRough, t, e, {
            heuristic: astar.heuristics.diagonal
        })
    }
    WorldPositionToRoughNode(t, e) {
        let i = this.offsetX + 15 * this.tileSize
          , o = this.offsetX
          , s = this.offsetZ + 15 * this.tileSize
          , a = this.offsetZ;
        t = Math.min(t, i),
        t = Math.max(t, o),
        e = Math.min(e, s),
        e = Math.max(e, a);
        let r = this.WorldPositionToNodeIndex(t, e);
        if (this.pathingMapRough.grid[Math.round(r.x / 5)]) {
            this.pathingMapRough.grid[Math.round(r.x / 5)][Math.round(r.z / 5)];
            return this.pathingMapRough.grid[Math.round(r.x / 5)][Math.round(r.z / 5)]
        }
    }
    GetPath(t, e, i, o) {
        let s = this.WorldPositionToNode(t, e)
          , a = this.WorldPositionToNode(i, o);
        if (s && a)
            return astar.search([...this.pathingMap], s, a, {
                heuristic: astar.heuristics.diagonal
            })
    }
    Serialize() {
        let t = {};
        for (let e in this.objectDict) {
            let i = this.objectDict[e].GetTownPosition();
            i.x = i.x / this.tileSize,
            i.z = i.z / this.tileSize,
            t[i] = this.objectDict[e].Serialize()
        }
        return t
    }
    GetGroundEntityAt(t, e) {
        let i = this.GetTotalProximityAmount(t, e);
        return i < 0 && (i = 0),
        i > 4 && (i = 4),
        `${this.groundBase}${i}`
    }
    GetRotationToEdgeClass(t, e, i) {
        let o = 0
          , s = this.GetNeighborsOfObjectAt(t, e);
        for (let t in s) {
            let e;
            if (e = s[t] ? Game.objectData[s[t].GetType()] : Game.worldObjectData[this.GetWorldObjectTypeFromDirection(t)],
            e) {
                if (Game.objectData[i].RotateTo.split(",").includes(e.EdgeClass)) {
                    o = 90 * t,
                    t % 2 == 0 && (o += 180);
                    break
                }
            } else
                console.log(`Could Not Find Data for object at direction ${t}`)
        }
        return o
    }
    GetTilingDataAt(t, e, i) {
        let o, s = {};
        if (s.modifier = "",
        s.rotation = 0,
        i)
            o = Game.objectData[i];
        else {
            if (!this.GetObjectAt(t, e))
                return s;
            o = GetObjectData()
        }
        if (!o)
            return s;
        if ("None" == o.TileWith)
            return s;
        let a = this.GetNeighborsOfObjectAt(t, e)
          , r = []
          , n = o.TileWith.split(",");
        for (let t = 0; t < 4; t++) {
            r[t] = !1;
            for (let e in n)
                a[t] && a[t].GetType().replace(/ /g, "_") == n[e] && (r[t] = !0)
        }
        var c = r.filter((t=>t)).length;
        return 0 === c && (s.modifier = "_Alone"),
        1 == c && (s.modifier = "_End",
        r[0] && (s.rotation += 180),
        r[1] && (s.rotation += 90),
        r[3] && (s.rotation -= 90)),
        2 == c && (r[0] && r[2] ? s.modifier = "_Run" : r[1] && r[3] ? (s.modifier = "_Run",
        s.rotation += 90) : (s.modifier = "_Corner",
        r[0] && r[1] && (s.rotation += 90),
        r[0] && r[3] && (s.rotation -= 180),
        r[2] && r[3] && (s.rotation -= 90))),
        3 == c && (s.modifier = "_T",
        r[2] || (s.rotation += 180),
        r[1] || (s.rotation -= 90),
        r[3] || (s.rotation += 90)),
        4 == c && (s.modifier = "_Cross"),
        s
    }
    AddObject(t, e, i, o, s=null) {
        if (!Game.objectData[t.replace(/ /g, "_")])
            return void console.log(`Cannot Create object of type ${t}. No Data for that type`);
        let a = new pc.Vec3(e,0,i)
          , r = this.GetObjectAt(e, i);
        r && r.Remove();
        let n = new TS_Object(t,e + this.offsetX,i + this.offsetZ,o,this,s);
        if (this.objectDict[a] = n,
        this.townLoaded && (n.logicObject.reqsValid = !1,
        this.checkEdgeReqsValid()),
        this.townLoaded) {
            let t = this.GetNeighborsOfObjectAt(e, i);
            for (let e in t)
                t[e] && (t[e].TileEntity(),
                this.UpdatePathingNodes(t[e].townX, t[e].townZ))
        }
        return this._ObjectsChanged(),
        this.townLoaded && (Game.app.fire("TownObjectAdded", e, i),
        this.UpdatePathingNodes(e, i),
        n.OnPlaced()),
        ShowPathNodes.RefreshNodes(),
        n
    }
    UpdatePathingNodes(t, e) {
        let i = this.GetObjectAt(t, e)
          , o = i.GetPathingNodes()
          , s = 0;
        for (let t = 0; t < 5; t++)
            for (let e = 0; e < 5; e++)
                this.pathingMap.grid[i.GetTownPosition().x + t][i.GetTownPosition().z + e].weight = o[t][e].weight,
                this.pathingMap.grid[i.GetTownPosition().x + t][i.GetTownPosition().z + e].speedMod = o[t][e].speedMod,
                s += o[t][e].weight;
        const a = s / 25;
        this.pathingMapRough.grid[i.GetTownPosition().x / 5][i.GetTownPosition().z / 5].weight = a
    }
    RotateObject(t, e) {
        let i = this.GetObjectAt(t, e);
        i && i.Rotate(),
        this.UpdatePathingNodes(t, e),
        ShowPathNodes.RefreshNodes()
    }
    GetObjectType(t, e) {
        let i = this.GetObjectAt(t, e);
        return i ? i.GetType() : ""
    }
    GetObjectAt(t, e) {
        let i = new pc.Vec3(t,0,e);
        return this.objectDict[i]
    }
    GetWorldObjectTypeFromDirection(t) {
        switch (parseInt(t)) {
        case 0:
            return this.SuperTiles[1];
        case 1:
            return this.SuperTiles[4];
        case 2:
            return this.SuperTiles[6];
        case 3:
            return this.SuperTiles[3]
        }
    }
    RemoveObject(t, e, i=!0) {
        let o = this.GetObjectAt(t, e);
        if (o) {
            if (o.logicObject.reqsValid && this.HandleProximityEffectsFrom(t, e, "remove"),
            o.Remove(),
            i) {
                var s = EntitySpawner.spawnObject("VFX_Destroy");
                if (s) {
                    let i = new pc.Vec3(this.LocalXToWorldX(t),0,this.LocalZToWorldZ(e));
                    s.setPosition(i),
                    Game.app.root.addChild(s)
                }
            }
            if (this.AddObject(this.defaultObjectType, t, e, 0),
            "None" != o.objData.TileWith) {
                let i = this.GetNeighborsOfObjectAt(t, e)
                  , s = o.objData.TileWith.split(",");
                for (let t in i)
                    if (i[t])
                        for (let e in s)
                            if (i[t].GetType().replace(/ /g, "_") == s[e]) {
                                let e = i[t].GetTownPosition();
                                this.GetObjectAt(e.x, e.z).TileEntity()
                            }
            }
            this._ObjectsChanged()
        }
    }
    GetNeighborsOfObjectAt(t, e) {
        return ["North", "East", "South", "West"].reduce(((i,o,s)=>{
            let a = -this.tileSize * (s - 2) * (s % 2)
              , r = (s - 1) * this.tileSize * ((s % 2 + 1) % 2);
            return i.push(this.GetObjectAt(t + a, e + r)),
            i
        }
        ), [])
    }
    GetNeighborsDataAt(t, e) {
        let i = this.GetNeighborsOfObjectAt(t, e);
        return i.reduce(((t,e,o)=>(e ? t.push(Game.objectData[i[o].GetType()]) : t.push(Game.worldObjectData[this.GetWorldObjectTypeFromDirection(o)]),
        t)), [])
    }
    _ObjectsChanged(t, e) {}
    HandleProximityEffectsFrom(t, e, i="add") {
        let o = this.GetObjectAt(t, e).GetObjectData();
        var s = o.ProximityEmit.split(",")
          , a = o.ProximityDist;
        if ("None" != s)
            for (let o = -1 * a; o <= a; o++)
                for (let r = -1 * a; r <= a; r++) {
                    let n = t + r * this.tileSize
                      , c = e + o * this.tileSize
                      , l = Math.abs(o) + Math.abs(r);
                    if (o * r != 0 ? l -= 1 : 0 === o && 0 === r && (l = 1),
                    l <= a)
                        for (let t in s)
                            if ("add" === i) {
                                if (this._AddEffectToProxMap(n, c, s[t], a - l + 1),
                                this.townLoaded) {
                                    let e = this.GetObjectAt(n, c);
                                    e && e.ApplyProxBonus(s[t], a - l + 1)
                                }
                            } else
                                "remove" === i && this._SubtractEffectFromProxMap(n, c, s[t], a - l + 1)
                }
    }
    SetProxEffectsFrom(t, e, i, o) {
        if ("None" != (i = i.split(",")))
            for (let s = -1 * o; s <= o; s++)
                for (let a = -1 * o; a <= o; a++) {
                    let r = t + a * this.tileSize
                      , n = e + s * this.tileSize
                      , c = Math.abs(s) + Math.abs(a);
                    if (s * a != 0 && (c -= 1),
                    0 === s && 0 === a && (c = 1),
                    c <= o)
                        for (let t in i)
                            this._SetEffectOnProxMap(r, n, i[t], o - c + 1)
                }
    }
    SetAllProximityEffects(t) {
        this.SetSuperTileProxEffects();
        for (let e in t) {
            let i = this._PositionFromDataKey(e)
              , o = t[e].type.replace(/ /g, "_");
            if (!Game.objectData[o])
                continue;
            let s = Game.objectData[o].ProximityEmit
              , a = Game.objectData[o].ProximityDist;
            this.SetProxEffectsFrom(i.x * this.tileSize, i.z * this.tileSize, s, a)
        }
    }
    SetSuperTileProxEffects() {
        let t = "None"
          , e = 0
          , i = "";
        if (i = this.SuperTiles[1],
        Game.worldObjectData[i]) {
            t = Game.worldObjectData[i].ProximityEmit.split(","),
            e = Game.worldObjectData[i].ProximityDist;
            for (let i in t)
                for (let o = 0; o < e; o++)
                    for (let s = 0; s <= 15; s++)
                        this._SetEffectOnProxMap(s * this.tileSize, o * this.tileSize, t[i], e - o)
        }
        if (i = this.SuperTiles[4],
        Game.worldObjectData[i]) {
            t = Game.worldObjectData[i].ProximityEmit.split(","),
            e = Game.worldObjectData[i].ProximityDist;
            for (let i in t)
                for (let o = 0; o < e; o++)
                    for (let s = 0; s <= 15; s++)
                        this._SetEffectOnProxMap((15 - o) * this.tileSize, s * this.tileSize, t[i], e - o)
        }
        if (i = this.SuperTiles[6],
        Game.worldObjectData[i]) {
            t = Game.worldObjectData[i].ProximityEmit.split(","),
            e = Game.worldObjectData[i].ProximityDist;
            for (let i in t)
                for (let o = 0; o < e; o++)
                    for (let s = 0; s <= 15; s++)
                        this._SetEffectOnProxMap(s * this.tileSize, (15 - o) * this.tileSize, t[i], e - o)
        }
        if (i = this.SuperTiles[3],
        Game.worldObjectData[i]) {
            t = Game.worldObjectData[i].ProximityEmit.split(","),
            e = Game.worldObjectData[i].ProximityDist;
            for (let i in t)
                for (let o = 0; o < e; o++)
                    for (let s = 0; s <= 15; s++)
                        this._SetEffectOnProxMap(o * this.tileSize, s * this.tileSize, t[i], e - o)
        }
    }
    ApplyEffect(t) {
        if (Game.worldObjectData[t]) {
            let e = Game.worldObjectData[TileType].ProximityEmit.split(",")
              , i = Game.worldObjectData[TileType].ProximityDist;
            for (let o in e)
                for (let s = 0; s < i; s++)
                    for (let a = 0; a <= 15; a++) {
                        let r = 0
                          , n = 0
                          , c = e[o]
                          , l = i - s;
                        switch (t) {
                        case "North":
                            r = a * this.tileSize,
                            n = s * this.tileSize;
                            break;
                        case "East":
                            r = (15 - s) * this.tileSize,
                            n = a * this.tileSize;
                            break;
                        case "South":
                            r = a * this.tileSize,
                            n = (s - z) * this.tileSize;
                            break;
                        case "West":
                            r = s * this.tileSize,
                            n = a * this.tileSize
                        }
                        this._SetEffectOnProxMap(r, n, c, l)
                    }
        }
    }
    GetProximityEffects(t, e) {
        const i = BIOME_EFFECTS.getEffectForBiomeType(this.worldType, "GlobalProx");
        let o = new pc.Vec3(t,0,e);
        return ((t={},e={})=>{
            const i = Object.assign({}, t);
            return Object.assign(i, e),
            Object.keys(i).forEach((o=>{
                t[o] && e[o] && (i[o] = t[o] + e[o])
            }
            )),
            i
        }
        )(this.proxMap[o], i)
    }
    GetTotalProximityAmount(t, e) {
        let i = 0
          , o = this.GetProximityEffects(t, e);
        if (o)
            for (let t in o)
                i += o[t];
        return i
    }
    GetStoredCrafts(t={}) {
        let e = 0
          , i = 0;
        const o = Object.keys(this.objectDict).reduce(((t,o)=>{
            const s = this.objectDict[o];
            if (s.logicObject instanceof TS_StorageObjectLogic) {
                e += s.logicObject.capacity;
                for (const e in s.logicObject.data.storageList) {
                    const o = s.logicObject.data.storageList[e];
                    o > 0 && (t[e] = t[e] || 0,
                    t[e] += o,
                    i += o)
                }
            }
            return t
        }
        ), {});
        return t.metaData ? {
            crafts: o,
            meta: {
                totalCapacity: e,
                totalUsed: i
            }
        } : o
    }
    RemoveStoredCraft(t, e, i, o) {
        const s = [];
        for (const a in this.objectDict) {
            const r = this.objectDict[a];
            if (r.logicObject instanceof TS_StorageObjectLogic) {
                if (r.logicObject.data.storageList[t] > 0) {
                    const a = r.RemoveCraft(t, e);
                    if (e -= a,
                    s.push({
                        x: r.townX,
                        z: r.townZ,
                        amount: a
                    }),
                    i) {
                        let e = r.entity.getPosition();
                        o || (o = {}),
                        EntitySpawner.spawnObject("DooberSpawner", e.x, 0, e.z, Game.app.root).fire("DooberSetup", i, t, a, o, !1)
                    }
                }
                if (r.logicObject.updateVFXEntities(),
                e <= 0)
                    break
            }
        }
        return s
    }
    _SubtractEffectFromProxMap(t, e, i, o) {
        let s = new pc.Vec3(t,0,e);
        if (!this.proxMap[s])
            return;
        if (!this.proxMap[s][i])
            return;
        this.proxMap[s][i] -= o,
        this.proxMap[s][i] <= 0 && delete this.proxMap[s][i];
        let a = this.GetObjectAt(t, e);
        a && a.UpdateGround()
    }
    _AddEffectToProxMap(t, e, i, o) {
        this._SetEffectOnProxMap(t, e, i, o)
    }
    _SetEffectOnProxMap(t, e, i, o) {
        let s = new pc.Vec3(t,0,e);
        this.proxMap[s] || (this.proxMap[s] = {}),
        this.proxMap[s][i] || (this.proxMap[s][i] = 0),
        this.proxMap[s][i] += o;
        let a = this.GetObjectAt(t, e);
        a && a.UpdateGround()
    }
    LocalXToWorldX(t) {
        return t + this.offsetX
    }
    LocalZToWorldZ(t) {
        return t + this.offsetZ
    }
    WorldXToLocalX(t) {
        return t - this.offsetX
    }
    WorldZToLocalZ(t) {
        return t - this.offsetZ
    }
    WorldSpacePositionToLocalPosition(t, e) {
        return {
            x: this.WorldXToLocalX(t),
            z: this.WorldZToLocalZ(e)
        }
    }
    LocalPositionToWorldSpacePosition(t, e) {
        return {
            x: this.LocalXToWorldX(t),
            z: this.LocalZToWorldZ(e)
        }
    }
    LocalPositionToGrid(t, e) {
        return {
            x: this._SnapToGrid(t),
            z: this._SnapToGrid(e)
        }
    }
    WorldSpacePositionToGrid(t, e) {
        return {
            x: this._SnapToGrid(t),
            z: this._SnapToGrid(e)
        }
    }
    WorldSpacePositionToLocalGrid(t, e) {
        return this.LocalPositionToGrid(this._SnapToGrid(this.WorldXToLocalX(t)), this._SnapToGrid(this.WorldZToLocalZ(e)))
    }
    _SnapToGrid(t) {
        return this.tileSize * Math.round(t / this.tileSize)
    }
    GetOffset() {
        return {
            x: this.offsetX,
            z: this.offsetZ
        }
    }
    GetTileSize() {
        return this.tileSize
    }
    FindObjectType(t) {
        for (let e in this.objectDict)
            if (this.objectDict[e].type === t)
                return this.objectDict[e]
    }
    FindObjectsOfType(t) {
        return Object.values(Game.town.objectDict).filter((e=>e.type == t))
    }
    forEachObject(t) {
        Object.keys(Game.town.objectDict).forEach((e=>{
            t(Game.town.objectDict[e])
        }
        ))
    }
    objectDictToArray() {
        return Object.keys(Game.town.objectDict).map((t=>Game.town.objectDict[t]))
    }
    getBlockChainObjects() {
        return this.objectDictToArray().filter((t=>"None" !== t.objData.BlockChainID))
    }
    findNonFungibleObject(t, e) {
        for (const i of Object.values(Game.town.objectDict))
            if (i.data?.contract === t && i.data?.tokenId === e)
                return i
    }
    getCurrentEarnings() {
        if (!Game.galaPower)
            return 0;
        const t = this.getBlockChainObjects()
          , e = Math.min(Game.galaPower, t.length);
        return e < 0 ? 0 : t.map((t=>Game.getObjectEarning(t))).sort(((t,e)=>t > e ? -1 : t < e ? 1 : 0)).slice(0, e).reduce(((t,e)=>t + e), 0)
    }
    setSkin(t, e, i=!0) {
        this.objectDictToArray().filter((e=>e.type == t)).forEach((t=>t.setSkinnedEntity(e))),
        e ? SKINS[t] = e : delete SKINS[t],
        SKINS.activePacks = Object.entries(SKINS).reduce(((t,e)=>{
            const i = Object.entries(Game.skinData).find((t=>t[1].object == e[0] && t[1].skin == e[1]));
            return i ? t.add(`${i[1].skin}:${i[1].set}`) : t
        }
        ), new Set),
        i && API.setUserData("skinSettings", SKINS)
    }
}
const RETRY_DELAY = 25
  , RETRY_RAND = 1.8
  , RETRY_MAX = 1e4;
class Realtime {
    constructor({baseUri: t, sessionId: e, gameId: s, token: i, msgpack: a}) {
        this.seq = 0,
        this.acks = {},
        this.ready = !1,
        this.error = null,
        this.attempts = 0,
        this.retryDelay = 25,
        this.queue = [],
        this.log = logger({
            context: "Realtime",
            color: "PaleVioletRed",
            timing: !0
        }),
        this.msgpack = a,
        this.app = pc.Application.getApplication(),
        t = "/" === t[0] ? "https:" === window.location.protocol ? `wss://${window.location.host}${t}` : `ws://${window.location.host}${t}` : t.replace("https://", "wss://").replace("http://", "ws://"),
        this.url = `${t}?gameId=${s}&sessionId=${e}&msgpack=${a}&token=${i || ""}`,
        this.log("Configuration", {
            baseUri: t,
            msgpack: a,
            gameId: s
        }),
        this.app.on("RealtimeRefresh", (()=>{
            "launch.playcanvas.com" !== window.location.host && setTimeout((()=>{
                Game && Game.town ? Game.saveAll().then((()=>{
                    window.location.reload()
                }
                )) : window.location.reload()
            }
            ), 1e3 * (5 * Math.random() + 5))
        }
        ))
    }
    view(t) {
        this.viewBox = t,
        this.send({
            type: "view",
            data: this.viewBox
        })
    }
    ping(t) {
        this.socket.send(API.encode({
            type: "ping",
            data: t
        })),
        PERF.realtime.start()
    }
    ledger(t) {
        this.send({
            type: "ledger",
            data: t
        })
    }
    status(t) {
        t && (this.users = t),
        this.send({
            type: "status",
            data: this.users
        })
    }
    rejectDrop(t) {
        this.send({
            type: "rejectDrop",
            data: t
        })
    }
    send(t) {
        this.queue.push(API.encode(t)),
        this._process()
    }
    sendAck(t) {
        return new Promise(((e,s)=>{
            const i = setTimeout((()=>s()), 5e3);
            this.acks[t.ack = this.seq] = ()=>{
                clearTimeout(i),
                e()
            }
            ,
            this.send(t),
            this.seq++
        }
        ))
    }
    onAck(t) {
        this.acks[t] && (this.acks[t](),
        delete this.acks[t])
    }
    isAlive() {
        return this.lastPongTime && Date.now() - this.lastPongTime < 8e3
    }
    connect() {
        this.attempts++,
        this.socket = new WebSocket(this.url),
        this.socket.onclose = t=>{
            this.log("close", t),
            this.ready = !1,
            4401 === t.code ? API.authenticate().then((()=>this.connect())) : (this.log("Reconnecting in", this.retryDelay),
            setTimeout((()=>{
                this.connect(),
                this.retryDelay = Math.min(this.retryDelay * (1.8 * Math.random() + 1), 1e4)
            }
            ), this.retryDelay))
        }
        ,
        this.socket.onerror = t=>{
            this.log("error", t),
            this.error = t
        }
        ,
        this.socket.onmessage = t=>{
            new Response(t.data).arrayBuffer().then((t=>{
                const e = API.decode(t);
                "Pong" != e.type && "Ack" != e.type && this.log("message", e),
                "Ready" === e.type && (this.ready = !0,
                this.error = null,
                this.attempts = 0,
                this.retryDelay = 25,
                this.serverTimeOffset = Date.now() - e.data.time,
                this.view(),
                this.status(),
                this.pingInterval && clearInterval(this.pingInterval),
                this.pingInterval = setInterval((()=>this.ping()), 5e3)),
                "Pong" === e.type && (this.lastPongTime = Date.now(),
                PERF.realtime.stop()),
                "Ack" === e.type && this.onAck(e.data),
                "TradeCreate" === e.type && e.data.forEach((t=>t.path = arrayToPath(t.path))),
                this.app.fire(`Realtime${e.type}`, e.data)
            }
            ))
        }
    }
    _process() {
        if (this.ready) {
            for (const t of this.queue)
                try {
                    this.socket.send(t)
                } catch (t) {
                    console.error(t)
                }
            this.queue.length = 0
        }
    }
}
let RT;
class TS_Game {
    constructor() {
        this.currentSeason = "",
        this.app = pc.Application.getApplication(),
        this.town = null,
        this.world = null,
        this.craftData = null,
        this.newPlayerData = null,
        this.objectData = null,
        this.worldObjectData = null,
        this.points = 0,
        this.currency = 0,
        this.gold = 0,
        this.playerName = null,
        this.gameData = null,
        this.log = logger({
            context: "Game",
            color: "orange",
            timing: !0
        }),
        this.internetConnected = !0,
        this.HudactiveOnConnectionLost = !1,
        this.challenge = null;
        const e = this.app.assets.find("TS_Master", "material");
        e ? this.masterMaterial = e.resource : console.warn("Could not find Master Material")
    }
    setMasterTex(e) {
        this.masterMaterial && e && this.masterMaterial.setParameter("texture_diffuseMap", e)
    }
    getDataCheckSum() {
        return ["objectData", "unitsData", "craftData", "worldObjectData", "constructionData"].reduce(((e,t)=>e + TS_Game.dataCheckSum(Game[t])), 0)
    }
    static dataCheckSum(e) {
        let t = 0;
        for (const a of JSON.stringify(e)) {
            const e = a.charCodeAt(0);
            (e > 47 && e < 58 || e > 64 && e < 91 || e > 96 && e < 123) && (t += e)
        }
        return t
    }
    IsTownViewActive() {
        return CameraCommander.instance.activeCamera == CameraCommander.instance.townCamera
    }
    IsWorldViewActive() {
        return CameraCommander.instance.activeCamera == CameraCommander.instance.worldCamera
    }
    OnConnection() {
        this.internetConnected || (this.internetConnected = !0,
        this.app.fire("InternetConnected"),
        this.app.autoRender = !0)
    }
    getObjectEarning(e) {
        if (!e)
            return 0;
        let t = "";
        if ("VOX_Home" === e.type) {
            t = `vox_series_1:${e.logicObject.tokenId}`
        } else
            t = e.objData.BlockChainID;
        return Game.earningsData && Game.earningsData[t] || 0
    }
    getCurrentChallengeGoal() {
        return this.challenge?.getGoalAmount()
    }
    getCurrentChallengeSum() {
        return this.challenge?.getGoalProgress()
    }
    getChallengeSecondsRemaining() {
        const e = this.challenge?.getTimeRemainingSeconds();
        return isNaN(e) || e < 0 ? 0 : e
    }
    OnLostConnection() {
        this.internetConnected && (this.internetConnected = !1,
        this.app.fire("InternetConnectionLost"),
        this.app.autoRender = !1)
    }
    addPoints(e) {
        this.points += e,
        this.app.fire("PlayerPointsChanged", this.points),
        this.log("PlayerPointsChanged", this.points)
    }
    addCurrency(e) {
        this.currency += e,
        this.app.fire("PlayerCurrencyChanged", this.currency),
        this.log("PlayerCurrencyChanged", this.currency)
    }
    addGold(e) {
        this.gold += e,
        this.app.fire("PlayerGoldChanged", this.gold),
        this.log("PlayerGoldChanged", this.gold)
    }
    removeObject(e, t) {
        const a = Game.town.GetObjectType(e, t)
          , n = Game.objectData[a];
        this.town.RemoveObject(e, t),
        this.addCurrency(n.DestroyCost),
        API.event("object_sell", {
            itemName: n.Name,
            itemCost: n.DestroyCost
        }),
        LEDGER.sellObject(e, t),
        this.saveAll()
    }
    addObject(e, t, a, n) {
        const i = this.objectData[a];
        let s = null;
        return "None" !== i.BlockChainID ? (this.town.AddObject(i.Name, e, t, void 0, n),
        LEDGER.buyObject(e, t, a)) : (this.addCurrency(-i.BuildCost),
        LEDGER.buyObject(e, t, a, {
            currency: i.BuildCost
        }),
        s = "None" === i.Construction ? this.town.AddObject(i.Name, e, t) : this.town.AddObject("Construction_Site", e, t, void 0, {
            type: a
        })),
        API.event("store_buy", {
            itemName: i.Name,
            itemCost: i.BuildCost
        }),
        this.saveAll(),
        s
    }
    tradeCraftsToCity(e, t, a, n) {
        const i = this.town.RemoveStoredCraft(e, t, a, n);
        return this.saveAll(),
        i
    }
    updateGameSelf() {
        return API.updateGameSelf(this.points, this.currency).catch((e=>{
            "NOT_JOINED" == e.code && location.reload()
        }
        ))
    }
    saveTown() {
        return API.saveTown(this.town.Serialize()).catch((e=>{
            "NOT_JOINED" == e.code && location.reload()
        }
        ))
    }
    collectEarnings() {
        return API.collectEarnings(this.town.Serialize()).catch((e=>{
            "NOT_JOINED" == e.code && location.reload()
        }
        ))
    }
    saveAll() {
        return this.updateGameSelf().then((()=>this.saveTown()))
    }
    Nuke() {
        API.deleteTown().then((()=>{
            const {earningsData: e} = Game;
            API.event("game_end", {
                earningsData: e
            }),
            location.reload()
        }
        ))
    }
    Update(e) {
        if (RT && (RT.isAlive() ? this.OnConnection() : this.OnLostConnection()),
        PhaseManager.instance.phase === PhaseManager.PlayingPhase) {
            if (this.gameData) {
                this.endDate = new Date(Game.gameData.end),
                Math.floor((this.endDate.getTime() - (new Date).getTime()) / 1e3) < 0 && PhaseManager.instance.change(PhaseManager.GameOverPhase)
            }
            this.challenge && this.challenge.isElapsed() && !this.challenge.disposing && (this.challenge.disposing = !0,
            this.app.fire("EarningChallengeExpired"),
            this.challenge.cleanUpEventListeners(),
            API.getQuestStatus().then((e=>{
                this.challenge = new TS_Challenge(e),
                this.app.fire("challengeProgressChanged")
            }
            )))
        }
        PERF.frame.add(e)
    }
}
const Game = new TS_Game;
var InitPhase = pc.createScript("initPhase");
InitPhase.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
InitPhase.attributes.add("EntitySpawner", {
    type: "entity",
    title: "Entity Spawner"
}),
InitPhase.attributes.add("SceneMerger", {
    type: "entity",
    title: "Scene Merger"
}),
InitPhase.attributes.add("CameraCommander", {
    type: "entity",
    title: "Camera Commander"
}),
InitPhase.prototype.initialize = function() {
    this.PhaseManager.script.phaseManager.onPhaseChanged(PhaseManager.InitPhase, (()=>{
        onAll(["PrefabLoadComplete", "SceneMergeComplete", "Authenticated"], (()=>{
            this.PhaseManager.script.phaseManager.change(PhaseManager.WorldInitPhase)
        }
        )),
        this.app.on("Authenticated", (()=>this.EntitySpawner.script.objectSpawner.LoadScenes())),
        this.app.on("PrefabLoadComplete", (()=>this.SceneMerger.script.sceneMerger.LoadScenes())),
        this.app.on("SceneMergeComplete", (()=>{
            this.CameraCommander.script.cameraCommander.FinalizeCameras()
        }
        )),
        function authenticateOrRegister() {
            if (API.token)
                return API.authenticate();
            {
                let e = LOCAL_STORAGE.get("userId")
                  , t = LOCAL_STORAGE.get("name")
                  , a = LOCAL_STORAGE.get("secret");
                return e && a ? (API.userId = e,
                API.secret = a,
                API.authenticate().catch((e=>{
                    if (400 === e.status)
                        return LOCAL_STORAGE.remove("userId"),
                        LOCAL_STORAGE.remove("name"),
                        LOCAL_STORAGE.remove("secret"),
                        authenticateOrRegister();
                    throw new Error("Failed to authenticate")
                }
                ))) : (t = btoa(crypto.getRandomValues(new Int8Array(12)).toString().toLocaleLowerCase()),
                a = btoa(crypto.getRandomValues(new Int8Array(12)).toString().toLocaleLowerCase()),
                API.register(t, a).then((n=>(e = n.userId,
                LOCAL_STORAGE.set("userId", e),
                LOCAL_STORAGE.set("name", t),
                LOCAL_STORAGE.set("secret", a),
                API.userId = e,
                API.secret = a,
                API.authenticate()))))
            }
        }().then((()=>SETTINGS.load())).then((()=>API.getSelf())).then((({userId: e, name: t, server: a, galaPowerLevel: n})=>{
            Game.playerName = t,
            Game.userId = e,
            Game.guestMode = TEMP_USER,
            Game.galaPower = Math.floor(n),
            API.getGames().then((e=>{
                let t = !1;
                if (a) {
                    for (let n of e)
                        if (a == n.gameId) {
                            t = !0;
                            break
                        }
                    t && (SERVER_CONFIG.gameId = a,
                    API.gameId = a,
                    RT = new Realtime(SERVER_CONFIG))
                }
                a && t || ServerSelectUi.instance.UI.OpenUI()
            }
            )).then((()=>{
                API.gameId && API.getGame().then((e=>{
                    RT.connect(),
                    Game.gameData = e,
                    console.log(e),
                    e && e.active ? this.app.fire("Authenticated") : API.gameId && this.PhaseManager.script.phaseManager.change(PhaseManager.GameOverPhase)
                }
                ))
            }
            ))
        }
        )).then((()=>{
            console.log("Loading Challenge status"),
            API.getQuestStatus().then((e=>{
                Game.challenge = new TS_Challenge(e)
            }
            ))
        }
        ))
    }
    ))
}
;
const WorldInitPhaseData = {};
var WorldInitPhase = pc.createScript("worldInitPhase");
WorldInitPhase.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
WorldInitPhase.prototype.initialize = function() {
    this.PhaseManager.script.phaseManager.onPhaseChanged(PhaseManager.WorldInitPhase, (()=>{
        this.app.on("WorldTownsLoaded", (()=>{
            this.PhaseManager.script.phaseManager.change(PhaseManager.TownLoadPhase)
        }
        )),
        Game.world = new TS_World(Game.worldMapData,Game.worldObjectData,0,0)
    }
    ))
}
;
var Start = pc.createScript("start");
Start.attributes.add("biomeEffectData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("gameSettings", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("objectData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("craftData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("skinData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("unitsData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("constructionData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("pathingData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("worldMapData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("northPlainsStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("southPlainsStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("westPlainsStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("eastPlainsStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("northDesertStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("southDesertStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("westDesertStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("eastDesertStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("northForestStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("southForestStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("westForestStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("eastForestStartMap", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("worldObjectData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("objectCraftData", {
    type: "asset",
    assetType: "json"
}),
Start.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
Start.prototype.initialize = function() {
    Game.objectData = this.objectData.resource,
    Game.worldObjectData = this.worldObjectData.resource,
    Game.worldMapData = this.worldMapData.resource,
    Game.craftData = this.craftData.resource,
    Game.unitsData = this.unitsData.resource,
    Game.constructionData = this.constructionData.resource,
    Game.objectCraftData = this.objectCraftData.resource,
    Game.skinData = this.skinData.resource,
    Game.pathingData = this.pathingData.resource,
    Game.gameSettings = this.gameSettings.resource,
    Game.startMap = {
        Forest: {
            north: this.northForestStartMap.resource,
            south: this.southForestStartMap.resource,
            east: this.eastForestStartMap.resource,
            west: this.westForestStartMap.resource
        },
        Plains: {
            north: this.northPlainsStartMap.resource,
            south: this.southPlainsStartMap.resource,
            east: this.eastPlainsStartMap.resource,
            west: this.westPlainsStartMap.resource
        },
        Desert: {
            north: this.northDesertStartMap.resource,
            south: this.southDesertStartMap.resource,
            east: this.eastDesertStartMap.resource,
            west: this.westDesertStartMap.resource
        }
    },
    BIOME_EFFECTS.setData(this.biomeEffectData.resource),
    Game.app = this.app,
    this.PhaseManager.script.phaseManager.change(PhaseManager.InitPhase)
}
,
Start.prototype.update = function(t) {
    Game && Game.Update(t),
    Game.internetConnected && (Game.town && Game.town.Update(t),
    Game.world && Game.world.Update(t))
}
;
var TownLoadPhase = pc.createScript("townLoadPhase");
TownLoadPhase.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
TownLoadPhase.attributes.add("CameraCommander", {
    type: "entity",
    title: "Camera Commander"
}),
TownLoadPhase.prototype.initialize = function() {
    onAll(["TownLoadComplete", "TownDataLoadComplete", "UserStart"], (()=>{
        this.PhaseManager.script.phaseManager.change(PhaseManager.PlayingPhase)
    }
    )),
    this.app.on("TownDataLoadComplete", (()=>{
        this.app.fire("SetTownView")
    }
    )),
    Game.TownDataResponseReceived = !1,
    Game.firstTimeUser = !0,
    this.PhaseManager.script.phaseManager.onPhaseChanged(PhaseManager.TownLoadPhase, (()=>{
        const {app: e, galaPower: a, gameData: o, gameSettings: n, gold: t} = Game;
        API.event("game_launch"),
        API.getUserData("onboardingProgress").then((e=>{
            Game.onboardingProgress = e,
            API.getGameSelf().then((e=>{
                e ? (Game.townName = e.name,
                Game.position = e.position,
                CameraCommander.instance.worldCamera.fire("SetPosition", e.position.x, e.position.y - 255),
                Game.addPoints(e.points),
                Game.addCurrency(e.currency),
                API.getTown().then((e=>{
                    this.app.fire("TownDataLoadComplete", e)
                }
                )),
                Game.app.on("playClicked", (()=>{
                    Game.guestMode && CustomConfirm.instance.UI.Open({
                        headerText: "Welcome, Guest!",
                        messageBodyText: "You're not currently logged in! We recommend you login or sign up now so you can save your game progress!",
                        declineText: "Maybe Later",
                        confirmText: "Create Account",
                        onConfirm: ()=>{
                            window.parent.location.replace("https://app.gala.games/?register=1")
                        }
                        ,
                        npcAssetID: "28965074",
                        footerContent: 'Already have a Gala Account? <a href="https://app.gala.games/?login=1">Log in!</a>'
                    })
                }
                ))) : (API.getSelf().then((({xPos: e, yPos: a})=>{
                    if (null !== e && null !== a) {
                        const o = Game.world.latLonToWorldPos(a, e);
                        Game.world.setCameraToClosestCity(o)
                    }
                }
                )),
                Game.app.fire("GameReady"),
                this.app.fire("SetWorldView"),
                this.app.on("UserStart", (()=>{
                    Game.onboardingProgress ? "ChooseSpot" === Game.onboardingProgress.progress ? Game.guestMode ? CustomConfirm.instance.UI.Open({
                        headerText: "Welcome, Guest!",
                        messageBodyText: "You're not currently logged in! We recommend you login or sign up now so you can save your game progress!",
                        declineText: "Maybe Later",
                        confirmText: "Create Account",
                        onOpen: ()=>{
                            OnboardingUI.instance.hideOnboarding()
                        }
                        ,
                        onConfirm: ()=>{
                            window.parent.location.replace("https://app.gala.games/?register=1")
                        }
                        ,
                        onClose: ()=>{
                            Game.app.fire("onboarding-progress", "ChooseSpot")
                        }
                        ,
                        onDecline: ()=>{
                            Game.app.fire("onboarding-progress", "ChooseSpot")
                        }
                        ,
                        npcAssetID: "28965074",
                        footerContent: 'Already have a Gala Account? <a href="https://app.gala.games/?login=1">Log in!</a>'
                    }) : this.app.fire("onboarding-progress", "ChooseSpot") : Game.guestMode ? CustomConfirm.instance.UI.Open({
                        headerText: "Welcome, Guest!",
                        messageBodyText: "You're not currently logged in! We recommend you login or sign up now so you can save your game progress!",
                        declineText: "Maybe Later",
                        confirmText: "Create Account",
                        onOpen: ()=>{
                            OnboardingUI.instance.hideOnboarding()
                        }
                        ,
                        onConfirm: ()=>{
                            window.parent.location.replace("https://app.gala.games/?register=1")
                        }
                        ,
                        onClose: ()=>{
                            Game.app.fire("toasterui-enable", "Pick a Location!")
                        }
                        ,
                        onDecline: ()=>{
                            Game.app.fire("toasterui-enable", "Pick a Location!")
                        }
                        ,
                        npcAssetID: "28965074",
                        footerContent: 'Already have a Gala Account? <a href="https://app.gala.games/?login=1">Log in!</a>'
                    }) : Game.app.fire("toasterui-enable", "Pick a Location!") : Game.guestMode ? CustomConfirm.instance.UI.Open({
                        headerText: "Welcome, Guest!",
                        messageBodyText: "You're not currently logged in! We recommend you login or sign up now so you can save your game progress!",
                        declineText: "Maybe Later",
                        confirmText: "Create Account",
                        onOpen: ()=>{
                            OnboardingUI.instance.hideOnboarding()
                        }
                        ,
                        onConfirm: ()=>{
                            window.parent.location.replace("https://app.gala.games/?register=1")
                        }
                        ,
                        onClose: ()=>{
                            Game.app.fire("onboarding-progress", "ChooseSpot")
                        }
                        ,
                        onDecline: ()=>{
                            Game.app.fire("onboarding-progress", "ChooseSpot")
                        }
                        ,
                        npcAssetID: "28965074",
                        footerContent: 'Already have a Gala Account? <a href="https://app.gala.games/?login=1">Log in!</a>'
                    }) : this.app.fire("onboarding-progress", "ChooseSpot"),
                    this.app.fire("NamePlayerStart"),
                    this.app.fire("SetWorldView")
                }
                ))),
                Game.TownDataResponseReceived = !0
            }
            ))
        }
        )),
        this.app.on("TownCreated", ((e,a)=>{
            this.app.fire("TownDataLoadComplete", null, e, a)
        }
        )),
        this.app.on("TownLoadComplete", (()=>{
            EntitySpawner.spawnObject("PlayerLocation", Game.position.x, .125, Game.position.y - 255, this.app.root)
        }
        ))
    }
    ))
}
;
var PlayingPhase = pc.createScript("playingPhase");
PlayingPhase.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
PlayingPhase.prototype.initialize = function() {
    this.PhaseManager.script.phaseManager.onPhaseChanged(PhaseManager.PlayingPhase, (()=>{
        LEDGER.sessionStart()
    }
    ))
}
;
var UiWatcher = pc.createScript("uiWatcher");
UiWatcher.prototype.initialize = function() {
    this.on("enable", (()=>UiWatcher.State[this.entity.name] = !0)),
    this.on("disable", (()=>UiWatcher.State[this.entity.name] = !1))
}
,
UiWatcher.UiOpen = function() {
    return Object.keys(UiWatcher.State).some((t=>UiWatcher.State[t]))
}
,
UiWatcher.State = {};
var BlockCameraMoveAndSelectWhileActive = pc.createScript("blockCameraMoveAndSelectWhileActive");
BlockCameraMoveAndSelectWhileActive.prototype.initialize = function() {
    this.on("enable", (()=>{
        Game.FullUI = !0
    }
    )),
    this.on("disable", (()=>{
        Game.FullUI = !1
    }
    ))
}
;
var TempPlayerTownDisplayer = pc.createScript("tempPlayerTownDisplayer");
TempPlayerTownDisplayer.attributes.add("PortraitObject", {
    type: "entity",
    title: "PortraitObject"
}),
TempPlayerTownDisplayer.prototype.initialize = function() {
    TempPlayerTownDisplayer.instance = this,
    this.PortraitObject.enabled = !1,
    this.markers = {},
    this.unitIcons = Object.keys(Game.unitsData).map((e=>Game.app.assets.find(UiTools.getIconFileName(e)))).filter((e=>e)),
    this.app.on("WorldTownCreate", (e=>this.pwnedByMal(e))),
    this.app.on("WorldTownDelete", (e=>this.removeTown(e))),
    this.app.loader.getHandler("texture").crossOrigin = "anonymous"
}
,
TempPlayerTownDisplayer.prototype.townNametoID = function(e) {
    let t = 0;
    for (const o of e)
        t += o.charCodeAt(0);
    return o = t,
    0 === (r = this.unitIcons.length - 1) ? 0 : o - r * Math.floor(o / r);
    var o, r
}
,
TempPlayerTownDisplayer.prototype.townNameToDefaultAsset = function(e) {
    const t = this.townNametoID(e);
    return this.unitIcons[t]
}
,
TempPlayerTownDisplayer.prototype.pwnedByMal = function(e) {
    const t = this.PortraitObject.clone();
    if (this.app.root.addChild(t),
    t.setPosition(e.x, .05, e.y - 255),
    t.enabled = !0,
    e.profilePhotoUrl) {
        const o = new pc.Asset(`${e.userId}_portrait32`,"texture",{
            url: e.profilePhotoUrl
        });
        this.app.assets.add(o),
        o.on("error", (e=>console.log(e))),
        o.on("load", (e=>t.findByName("PortraitUI").element.texture = e.resource)),
        this.app.assets.load(o)
    } else {
        const o = this.townNameToDefaultAsset(e.name);
        o && (t.findByName("PortraitUI").element.texture = o.resource)
    }
    this.markers[[e.x, e.y]] = t
}
,
TempPlayerTownDisplayer.prototype.removeTown = function(e) {
    const t = this.markers[[e.x, e.y]];
    t && (t.destroy(),
    delete this.markers[[e.x, e.y]])
}
;
class TS_ObjectLogic {
    constructor(t) {
        if (!t)
            throw "Cannot Create TS_ObjectLogic without a valid townObject";
        if (this.townObject = t,
        this.entity = t.entity,
        this.type = t.type,
        this.data = t.data,
        this.reqsValid = !0,
        this.idleVFX = EntitySpawner.spawnObject("VFX_Z", this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.entity),
        this.idleVFX.enabled = !1,
        this.reqsInvalidVFX = EntitySpawner.spawnObject("VFX_RequirementsNotMet", this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.entity),
        this.reqsInvalidVFX.enabled = !1,
        !this.entity || !this.type)
            throw "Cannot Create TS_ObjectLogic without a valid entity and type";
        this.Initialize()
    }
    static GetLogicType(t) {
        if ("VOX_Home" == t)
            return "VOX_Home";
        let e = Game.objectData[t];
        if (e)
            return "Construction_Site" == t ? "BuildSite" : "Holiday_Tree" == t || "SaltyBot_Shack" == t ? "HolidayTree" : "Trade" == e.Class ? "Trade" : "None" != e.Crafts ? "Crafter" : "None" != e.StorageType && "ActiveCrafter" != e.StorageType ? "Storage" : void 0;
        console.log(`Unable to find Object data for type ${t}`)
    }
    OnTapped() {}
    onRotate() {}
    OnPlaced() {}
    onReqsValid() {}
    onReqsInvalid() {}
    Update(t) {
        this.SetIdleVFXEnabled(),
        this.SetReqsInvalidVFXEnabled()
    }
    idleVFXCheck() {
        if (this.townObject.unitList.length > 0)
            for (let t of this.townObject.unitList) {
                const e = t.logicObject;
                if (!e.task && e.IsHome())
                    return !0
            }
        return !1
    }
    SetIdleVFXEnabled() {
        this.idleVFX.enabled = this.idleVFXCheck()
    }
    SetReqsInvalidVFXEnabled() {
        this.reqsInvalidVFX.enabled = !this.townObject.checkEdgeReqsValid()
    }
    Initialize() {}
    UpdateEntity(t) {
        this.entity = t
    }
    SetCraft(t) {}
    AddCraft(t, e=1) {
        return 0
    }
    RemoveCraft(t, e=1) {
        return 0
    }
    ApplyProxBonus(t, e) {}
    GetData() {
        return this.data
    }
    CanStoreType(t) {
        return !1
    }
    CanAcceptCraft(t) {
        return !1
    }
    CanDispenseCraft(t) {
        return !1
    }
    HasRoom() {
        return !1
    }
    GetState() {}
    OnRemove() {}
    GetCountOfType(t) {}
    GetDisplayData() {
        if (this.data) {
            return Object.assign(this.data)
        }
        return null
    }
}
class TS_StorageObjectLogic extends TS_ObjectLogic {
    Initialize() {
        this.data && this._VerifyData() || (this.data = {},
        this.data.storageList = {}),
        this.data.storageList || (this.data.storageList = {});
        let t = Game.objectData[this.type];
        t || console.log(`No Object Data for type : ${this.type}`),
        this.capacity = t.Capacity,
        this.vfxEntities = this.entity.findByTag("StorageCountVFX"),
        this.fullIndicatorVFX = EntitySpawner.spawnObject("VFX_StorageFull", this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.entity),
        this.fullIndicatorVFX.enabled = !1,
        this.storageMeter = EntitySpawner.spawnObject("Storage Progress", this.townObject.worldX, 3, this.townObject.worldZ, this.townObject.entity),
        this.storageProgress = this.storageMeter.findByTag("progressbar")[0],
        this.totalProgress = this.storageMeter.findByTag("totalprogress")[0],
        SETTINGS.onAndNow("statusOverlay", (()=>{
            this.storageMeter.enabled = SETTINGS.statusOverlay,
            SETTINGS.statusOverlay && this.updateVFXEntities()
        }
        )),
        this.townObject.town.townLoaded || this.townObject.town.objParent.once("Townloaded", this.updateVFXEntities, this)
    }
    _VerifyData() {
        return !0
    }
    AddCraft(t, e=1) {
        if (e <= 0)
            return console.log("Can not add non positive qty of craft"),
            0;
        if (!this.CanStoreType(t))
            return 0;
        let a = e;
        return this.GetTotalCraftsStored() + a > this.capacity && (a = this.capacity - this.GetTotalCraftsStored()),
        0 === a ? 0 : (this.data.storageList[t] ? this.data.storageList[t] += a : this.data.storageList[t] = a,
        Game.app.fire("StorageAmountChanged"),
        Game.app.fire("SpawnTextVFX", this.entity.getPosition(), `+${a} ${t.replace(/_/g, " ")}`, "#3c5b0b"),
        this.updateVFXEntities(),
        a)
    }
    FlushStorage() {
        const t = Object.keys(this.data.storageList);
        if (0 !== t.length) {
            for (let e of t)
                this.RemoveCraft(e, this.data.storageList[e], !1);
            Game.app.fire("SpawnTextVFX", this.entity.getPosition(), "Storage Cleared", "#ff002a")
        }
    }
    RemoveCraft(t, e=1, a=!1) {
        if (e <= 0)
            return console.log("Can not remove non positive qty of craft"),
            0;
        let s = e;
        return this.GetCountOfType(t) < s && (s = this.GetCountOfType(t),
        0 === s) ? 0 : (this.data.storageList[t] -= s,
        this.data.storageList[t] <= 0 && delete this.data.storageList[t],
        Game.app.fire("StorageAmountChanged"),
        a && Game.app.fire("SpawnTextVFX", this.entity.getPosition(), `-${s} ${t.replace(/_/g, " ")}`, "#ff002a"),
        this.updateVFXEntities(),
        s)
    }
    CanStoreType(t) {
        let e = Game.craftData[t];
        if (!e)
            return console.log(`No Craft data for type ${t}`),
            !1;
        let a = Game.objectData[this.type];
        if (!a)
            return console.log(`No Object data for type ${this.type}`),
            !1;
        let s = a.StorageType.split(",");
        return !!s.includes(t) || !!s.includes(e.Class)
    }
    CanAcceptCraft(t) {
        return this.CanStoreType(t) && this.HasRoom() && this.reqsValid
    }
    CanDispenseCraft(t) {
        return this.GetCountOfType(t) > 0 && this.reqsValid
    }
    GetCountOfType(t) {
        return this.data.storageList[t] ? this.data.storageList[t] : 0
    }
    GetTotalCraftsStored() {
        let t = 0;
        for (let e in this.data.storageList)
            t += this.data.storageList[e];
        return t
    }
    HasRoom() {
        return this.getAvailableSpace() > 0
    }
    getAvailableSpace() {
        return this.capacity - this.GetTotalCraftsStored()
    }
    Update(t) {
        super.Update(t),
        this.storageMeter.setRotation(CameraCommander.instance.townCamera.getRotation())
    }
    OnPlaced() {
        this.updateVFXEntities()
    }
    OnRemove() {
        const t = this.townObject.town.FindObjectsOfType(this.type).filter((t=>t.logicObject !== this))
          , e = t.reduce(((t,e)=>t + e.logicObject.GetTotalCraftsStored()), 0) / (t.length * this.capacity);
        t.forEach((t=>t.logicObject.updateTotalProgress(e)))
    }
    updateVFXEntities() {
        if (!this.townObject.exists)
            return;
        const t = this.GetTotalCraftsStored();
        if (this.storageMeter.enabled) {
            const e = t / this.capacity;
            this.storageProgress.element.width = 4.5 * e,
            this.storageProgress.element.color = e <= .79 ? (new pc.Color).fromString("#33e128") : (new pc.Color).fromString("#ff0048");
            const a = this.townObject.town.FindObjectsOfType(this.type)
              , s = a.reduce(((t,e)=>t + e.logicObject.GetTotalCraftsStored()), 0) / (a.length * this.capacity);
            a.forEach((t=>t.logicObject.updateTotalProgress(s)))
        }
        for (let e of this.vfxEntities) {
            const a = {}
              , s = e.tags.list();
            for (let t of s)
                t.startsWith("StorageCount") && (a.storageCount = t.split(":")[1]);
            (a.storageCount || 0 === a.storageCount) && (e.enabled = t == a.storageCount)
        }
        this.fullIndicatorVFX.enabled = !this.HasRoom()
    }
    updateTotalProgress(t) {
        this.storageMeter.enabled && (this.totalProgress.element.width = 4.5 * t,
        this.totalProgress.element.color = t <= .79 ? (new pc.Color).fromString("#91a7be") : (new pc.Color).fromString("#ff0048"))
    }
}
const app = pc.Application.getApplication();
function addSpriteSheet(e) {
    const n = app.assets.find(`${e}.css`).resource
      , t = app.assets.find(`${e}.png`).getFileUrl()
      , p = document.createElement("style");
    p.innerHTML = `\n.portrait {\n    background-image: url(${t});\n}\n${n}`,
    document.head.appendChild(p)
}
class TS_UnitLogic {
    constructor(t) {
        if (!t)
            throw "Cannot Create TS_UnitLogic without a valid townObject";
        if (this.unitObject = t,
        this.entity = t.entity,
        this.type = t.type,
        this.data = t.unitsData,
        !this.entity || !this.type)
            throw "Cannot Create TS_UnitLogic without a valid entity and type";
        this.pathArray = [],
        this.startPosition = new pc.Vec3,
        this.speed = 5,
        this.difference = new pc.Vec3,
        this.distance = 0,
        this.direction = new pc.Vec3,
        this.isReady = !1,
        this.targetPosition = new pc.Vec3,
        this.homePosition = new pc.Vec3,
        this.craft = null,
        this.task = null,
        this.path = null,
        this.node = null,
        this.Initializie(),
        this.lerpAmount = 0,
        this.lerpSpeed = 5,
        this.homeTimer = 0,
        this.homeTimeout = .5
    }
    static inTargetType(t, i, e) {
        const s = t.replace(/[()]/g, "").split(",");
        return s.includes(i) || e && s.includes("Home")
    }
    static targetStringToArray(t) {
        return t.replace(/[()]/g, "").split(",")
    }
    static targetDataStringToPriorityArray(t) {
        let i;
        const e = [];
        let s = !1
          , n = 0;
        for (let o in t) {
            if (i = t[o],
            "," == t[o] && !s) {
                let i = t.substring(n, parseInt(o));
                i && e.push(i.split(",")),
                n = parseInt(o) + 1
            }
            "(" == t[o] && (s = !0,
            n = parseInt(o) + 1),
            ")" == t[o] && (s = !1,
            e.push(t.substring(n, parseInt(o)).split(",")),
            n = parseInt(o) + 1)
        }
        return n < t.length && e.push(t.substring(n, t.length).split(",")),
        e
    }
    static getPriorityOfType(t, i, e) {
        const s = TS_UnitLogic.targetDataStringToPriorityArray(t);
        for (let t = 0; t < s.length; t++)
            if (s[t].includes(i) || e && s[t].includes("Home"))
                return t;
        return null
    }
    getPrioritySortedArray(t, i) {
        Date.now();
        const e = [...t];
        e.sort(((t,e)=>{
            let s = t;
            t.obj && (s = t.obj);
            let n = e;
            e.obj && (n = e.obj);
            const o = TS_UnitLogic.getPriorityOfType(i, s.type, s == this.unitObject.building)
              , a = TS_UnitLogic.getPriorityOfType(i, n.type, n == this.unitObject.building);
            return o > a ? 1 : o < a ? -1 : (isNaN(s.pathCost) && (s.pathCost = this.getRoughPathTo(s).map((t=>t.weight)).reduce(((t,i)=>t + i), 0)),
            isNaN(n.pathCost) && (n.pathCost = this.getRoughPathTo(n).map((t=>t.weight)).reduce(((t,i)=>t + i), 0)),
            o === a && s.pathCost > n.pathCost ? 1 : -1)
        }
        ));
        for (let t of e)
            t.obj ? t.obj.pathCost = void 0 : t.pathCost = void 0;
        return e
    }
    getDistanceSortedArray(t) {
        const i = [...t];
        i.sort(((t,i)=>{
            let e = t;
            t.obj && (e = t.obj);
            let s = i;
            return i.obj && (s = i.obj),
            isNaN(e.pathLength) && (e.pathLength = this.getPathTo(e).length),
            isNaN(i.pathLength) && (s.pathLength = this.getPathTo(s).length),
            e.pathLength > s.pathLength ? 1 : -1
        }
        ));
        for (let t of i)
            t.obj ? t.obj.pathLength = void 0 : t.pathLength = void 0;
        return i
    }
    findGetOutputTask() {
        const t = []
          , i = Game.objectData[this.unitObject.building.type].OutputPickup;
        for (let e of Object.keys(Game.town.objectDict)) {
            const s = Game.town.objectDict[e];
            TS_UnitLogic.inTargetType(i, s.type, s == this.unitObject.building) && TS_ObjectLogic.GetLogicType(s.type) && "Complete" == s.GetState() && t.push(s)
        }
        const e = this.getPrioritySortedArray(t, i);
        for (let t = 0; t < e.length; t++) {
            const i = e[t];
            if (!i.claimedBy)
                return new UnitGetOutputTask(this.unitObject,i,i.GetData().craft)
        }
        return null
    }
    findDeliverOutputTask(t) {
        const i = []
          , e = Game.objectData[this.unitObject.building.type].OutputDeliver;
        for (let s of Object.keys(Game.town.objectDict)) {
            const n = Game.town.objectDict[s];
            TS_UnitLogic.inTargetType(e, n.type, n == this.unitObject.building) && TS_ObjectLogic.GetLogicType(n.type) && n.CanAcceptCraft(t) && i.push(n)
        }
        if (0 === i.length)
            return null;
        const s = this.getPrioritySortedArray(i, e);
        return new UnitDeliverOutputTask(this.unitObject,s[0],t)
    }
    findGetInputTask() {
        const t = []
          , i = Game.objectData[this.unitObject.building.type].InputDeliver
          , e = Game.objectData[this.unitObject.building.type].InputPickup;
        for (let s of Object.keys(Game.town.objectDict)) {
            const n = Game.town.objectDict[s];
            if (TS_UnitLogic.inTargetType(i, n.type, n == this.unitObject.building) && TS_ObjectLogic.GetLogicType(n.type) && "WaitForReqs" == n.GetState()) {
                const i = Object.keys(n.logicObject.GetProxifiedReqList());
                Game.town.findObjectsThatDispenseCrafts(i, {
                    only: TS_UnitLogic.targetStringToArray(e)
                }).length > 0 && t.push(n)
            }
        }
        const s = this.getPrioritySortedArray(t, i);
        if (s.length > 0)
            for (let t = 0; t < s.length; t++) {
                const i = Object.keys(s[t].logicObject.GetProxifiedReqList())
                  , n = Game.town.findObjectsThatDispenseCrafts(i, {
                    only: TS_UnitLogic.targetStringToArray(e)
                })
                  , o = this.getPrioritySortedArray(n, e);
                for (let i = 0; i < o.length; i++) {
                    if (!o[i].obj.claimedBy)
                        return new UnitGetInputTask(this.unitObject,o[i].obj,o[i].crafts[0],s[t])
                }
            }
        return null
    }
    findOutputNukeTask() {
        const t = this.findNukeTarget();
        t ? this.setTask(new NukeOutputTask(this.unitObject,t)) : this.nukeCraft()
    }
    findNukeTarget() {
        const t = [];
        for (let i of Object.keys(Game.town.objectDict)) {
            const e = Game.town.objectDict[i];
            "Road" == e.objData.EdgeClass && t.push(e)
        }
        if (0 === t.length)
            return null;
        return this.getDistanceSortedArray(t)[0]
    }
    Initializie() {
        this.homePosition = this.entity.getPosition().clone(),
        this.lookat = new pc.Entity,
        Game.app.root.addChild(this.lookat)
    }
    LerpRotation(t) {
        this.lerpAmount += t;
        let i = (new pc.Quat).slerp(this.entity.getRotation(), this.lookat.getRotation(), this.lerpAmount * this.lerpSpeed);
        this.entity.setRotation(i)
    }
    GetData() {}
    setCraft(t) {
        this.craft = t
    }
    GetRemainingDistanceToTarget() {
        let t = 0;
        return this.path && (t = this.path.length - this.node - 1),
        t
    }
    HasTask(t) {
        return !!this.task
    }
    isCarrying() {
        return !!this.craft
    }
    GetCarriedCraft() {
        return this.craft
    }
    getRoughPathTo(t) {
        let i = this.entity.getPosition()
          , e = Game.town.WorldPositionToRoughNode(i.x, i.z)
          , s = t.GetWorldSpacePosition()
          , n = Game.town.WorldPositionToRoughNode(s.x, s.z);
        return astar.search(Game.town.pathingMapRough, e, n, {
            heuristic: astar.heuristics.diagonal
        })
    }
    getPathTo(t) {
        let i = this.entity.getPosition()
          , e = Game.town.WorldPositionToNode(i.x, i.z)
          , s = t.GetWorldSpacePosition()
          , n = Game.town.WorldPositionToNode(s.x, s.z);
        return astar.search(Game.town.pathingMap, e, n, {
            heuristic: astar.heuristics.diagonal
        })
    }
    resetPath() {
        this.node = 0,
        this.path = null,
        this.currentNode = 0,
        this.timeSinceLastNode = 0
    }
    setTask(t) {
        return this.task && this.task.targetObject && (this.task.targetObject.claimedBy = null),
        this.resetPath(),
        this.task = t,
        t && t.targetObject && "Complete" == t.targetObject.GetState() && (t.targetObject.claimedBy = this.unitObject),
        this.task
    }
    IsHome() {
        let t = this.entity.getPosition()
          , i = Game.town.WorldPositionToNode(t.x, t.z)
          , e = this.unitObject.building.GetWorldSpacePosition();
        return i == Game.town.WorldPositionToNode(e.x, e.z)
    }
    IsAvailable() {
        return !!Game.town.laborPaid && (!!this.unitObject.building.logicObject.reqsValid && ("Crafter" != TS_ObjectLogic.GetLogicType(this.unitObject.building.type) || "WaitForReqs" == this.unitObject.building.GetState()))
    }
    OnRemove() {
        this.task && this.task.targetObject && (this.task.targetObject.claimedBy = null),
        this.idleVFX && this.idleVFX.destroy()
    }
    canTarget(t) {
        let i = !1
          , e = this.unitObject.building.objData.TargetTypes.split(",");
        for (let s in e)
            e[s] != t.type && e[s] != t.objData.Class || (i = !0);
        return i
    }
    setPath(t) {
        this.resetPath(),
        this.path = t
    }
    move(t) {
        if (!this.task)
            return;
        if (!this.task.targetObject)
            return;
        this.path || this.setPath(this.getPathTo(this.task.targetObject));
        let i, e = !1;
        if (this.path.length > 0) {
            let t = Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y)
              , i = new pc.Vec3(t.x,0,t.z);
            e = this.entity.getPosition().distance(i) <= .01
        } else
            e = !0;
        if (e && (this.timeSinceLastNode = 0,
        this.node++,
        this.path && this.node >= this.path.length && this.path.length > 0))
            return void this.resetPath();
        if (0 === this.path.length)
            return i = new pc.Vec3(this.task.targetObject.worldX,0,this.task.targetObject.worldZ),
            void this.entity.setPosition(i);
        i = Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y);
        let s = new pc.Vec3(i.x,0,i.z);
        if (!this.path[this.node - 1]) {
            this.timeSinceLastNode = 0;
            let t = this.entity.getPosition()
              , i = {};
            i.x = t.x + 502,
            i.y = t.z + 2,
            this.path[this.node - 1] = i
        }
        this.timeSinceLastNode += t;
        Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y),
        new pc.Vec3(i.x,0,i.z);
        let n = new pc.Vec3
          , o = this.unitObject.building.town.NodeToWorldPosition(this.path[this.node - 1].x, this.path[this.node - 1].y)
          , a = this.unitObject.building.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y)
          , h = new pc.Vec3(o.x,0,o.z)
          , r = new pc.Vec3(a.x,0,a.z);
        this.rotate(r);
        let c = this.path[this.node].speedMod
          , l = 1
          , u = !1;
        o.x != a.x && o.z != a.z && (u = !0),
        u && (l = 1.4);
        const p = 1 + (Math.min(25, 2.5 * SKINS.getActivePacksOfSet("Mirandus").length) / 100 || 0);
        let g = 1 / (Game.unitsData[this.type].TravelSpeed * p) / c * l
          , d = this.timeSinceLastNode / g;
        d > 1 && (d = 1),
        n.lerp(h, r, d),
        this.entity.setPosition(n),
        this.IsHome() && this.task.targetObject != this.unitObject.building ? this.unitObject.building.entity.fire("PlayAnim", "Door.json") : this.path[this.node + 5] && (i = Game.town.NodeToWorldPosition(this.path[this.node + 5].x, this.path[this.node + 5].y),
        s = new pc.Vec3(i.x,0,i.z),
        s.equals(this.homePosition) && this.unitObject.building.entity.fire("PlayAnim", "Door.json"))
    }
    searchForTask() {
        let t;
        if (this.craft || (t = this.findGetOutputTask()),
        t)
            return this.setTask(t),
            void (t.targetObject.claimedBy = this.unitObject);
        if (t = this.findGetInputTask(),
        t)
            this.setTask(t);
        else if (!this.IsHome())
            if (this.craft) {
                const t = this.findNukeTarget();
                t ? this.setTask(new NukeCraftTask(this.unitObject,t)) : this.nukeCraft()
            } else
                this.setTask(new UnitTask(this.unitObject,this.unitObject.building))
    }
    setAnimation(t) {
        this.animation != t && (this.entity.fire("PlayAnim", t, !0),
        this.animation = t)
    }
    Update(t) {
        if (Game.town.townLoaded) {
            if (this.IsHome() || this.LerpRotation(t),
            this.task ? this.craft ? this.setAnimation("WalkCraft.json") : this.setAnimation("Walk.json") : this.IsHome() && this.setAnimation("Idle.json"),
            this.task)
                return UnitTask.goingHomeToIdle(this.unitObject) && this.IsAvailable() && (this.homeTimer += t,
                this.homeTimer >= this.homeTimeout && (this.homeTimer = 0,
                this.searchForTask())),
                void this.task.tick(t);
            this.IsAvailable() ? this.task || this.searchForTask() : (this.IsHome() || this.setTask(new UnitTask(this.unitObject,this.unitObject.building)),
            "Complete" == this.unitObject.building.GetState() && TS_UnitLogic.inTargetType(this.unitObject.building.objData.OutputPickup, "Home") && this.setTask(new UnitGetOutputTask(this.unitObject,this.unitObject.building,this.unitObject.building.GetData().craft)))
        }
    }
    findDeliverInputTask(t) {
        const i = Game.objectData[this.unitObject.building.type].InputDeliver;
        let e = Game.town.findObjectsThatAcceptCraft(t, {
            only: TS_UnitLogic.targetStringToArray(i)
        });
        if (e.length > 0) {
            const t = this.getPrioritySortedArray(e, i);
            for (let i of t)
                if (!i.claimedBy)
                    return new UnitDeliverInputTask(this.unitObject,i,this.craft)
        }
        console.log("No alternative deliver targets found");
        const s = Game.objectData[this.unitObject.building.type].InputPickup;
        if (e = Game.town.findObjectsThatAcceptCraft(t, {
            only: TS_UnitLogic.targetStringToArray(s)
        }),
        e.length > 0) {
            const t = this.getPrioritySortedArray(e, s);
            for (let i of t)
                if (!i.claimedBy)
                    return new UnitDeliverInputTask(this.unitObject,i,this.craft)
        }
        return null
    }
    nukeCraft() {
        this.setCraft(null);
        let t = this.entity.getPosition();
        EntitySpawner.spawnObject("VFX_CraftDestroy", t.x, 0, t.z, Game.app.root),
        this.entity.fire("UpdateUnitCraft", null),
        this.entity.fire("PlayAnim", "Walk.json", !0),
        this.setTask(null)
    }
    rotate(t) {
        this.lerpAmount = 0,
        this.lookat.setPosition(this.entity.getPosition()),
        this.lookat.lookAt(t),
        this.lookat.rotateLocal(0, 180, 0)
    }
}
TS_UnitLogic.prototype.log = logger({
    context: "TS_UnitLogic",
    color: "purple",
    timing: !0
});
class TS_CrafterObjectLogic extends TS_ObjectLogic {
    AddCraft(t, e=1) {
        let i = 0;
        if ("WaitForReqs" == this.data.state && this.data.reqList[t]) {
            if (this.data.reqList[t] < e && (e = this.data.reqList[t]),
            this.data.reqList[t] -= e,
            i = e,
            this.data.reqList[t] <= 0) {
                delete this.data.reqList[t];
                for (let e in this.townObject.unitList)
                    this.townObject.unitList[e].logicObject.task && this.townObject.unitList[e].logicObject.task.arrivalAction == `Remove:${t}` && (this.townObject.unitList[e].logicObject.task = null)
            }
            0 === Object.keys(this.GetProxifiedReqList()).length && this.entity.fire("ReqsEmpty")
        }
        return i
    }
    onReqsInvalid() {
        this.data.state = "Idle",
        this.entity.fire("PlayAnim", "Idle.json")
    }
    onReqsValid() {
        this.data.state = "Complete",
        this.SetState("Idle")
    }
    RemoveCraft(t, e=1) {
        return "Complete" != this.data.state ? 0 : t == this.data.craft ? (this.entity.fire("Harvested"),
        1) : 0
    }
    GetProxifiedReqList() {
        const t = {}
          , e = {};
        Object.assign(t, this.data.reqList);
        const i = Game.town.GetProximityEffects(this.townObject.townX, this.townObject.townZ);
        if (!i)
            return this.data.reqList;
        const a = this.getCraftData();
        if (!a)
            return {};
        const s = a.ProximityBonus.split(",");
        for (let e of Object.keys(i))
            for (let a of Object.keys(this.data.reqList || {}))
                a == e && s.includes(e) && t[e] && (t[e] -= i[e]);
        for (let i of Object.keys(t))
            t[i] > 0 && (e[i] = t[i]);
        return e
    }
    ApplyProxBonus(t, e) {
        if ("WaitForReqs" == this.data.state) {
            if (!this.data.craft)
                return;
            let i = this.craftData.ProximityBonus;
            i = i.split(","),
            i.includes(t) && (this.ReduceReqs(t, e),
            0 === Object.keys(this.GetProxifiedReqList()).length && this.entity.fire("ReqsEmpty"))
        }
    }
    ReduceReqs(t, e=1) {
        this.data.reqList[t] && this.data.reqList[t] <= 0 && delete this.data.reqList[t]
    }
    GetCraftProximityPenalty() {
        let t = this.townObject.GetTownPosition()
          , e = Game.town.GetProximityEffects(t.x, t.z);
        return TS_CrafterObjectLogic.calculateCraftProximityPenalty(Game.objectData[this.type], this.craftData, e)
    }
    getPackReduction() {
        return Math.min(10, 1 * SKINS.getActivePacksOfSet("Mirandus").length) / 100 || 0
    }
    GetCraftTime(t=this.data.craft) {
        let e = this.townObject.GetTownPosition()
          , i = Game.town.GetProximityEffects(e.x, e.z);
        const a = 1 - this.getPackReduction()
          , s = this.getCraftData(t);
        return TS_CrafterObjectLogic.calculateCraftTime(Game.objectData[this.type], s, i, a)
    }
    idleVFXCheck() {
        return "None" == this.data.craft
    }
    Update(t) {
        if (this.reqsValid) {
            if ("Produce" == this.data.state)
                this.data.craftTime += t,
                this.data.startTime + this.data.craftTime >= this.data.startTime + this.GetCraftTime() && this.entity.fire("ProduceComplete");
            else if ("WaitForUnits" == this.data.state) {
                let t = !0
                  , e = !0
                  , i = [];
                for (let a in this.townObject.unitList) {
                    const s = this.townObject.unitList[a]
                      , r = s.logicObject.IsHome()
                      , n = s.isCarrying();
                    r || (t = !1),
                    n && (e = !1),
                    r && n && (s.getTask() || i.push(s))
                }
                if (t)
                    if (e)
                        LEDGER.unitHome(this.townObject.townX, this.townObject.townZ),
                        this.SetState("Produce");
                    else
                        for (const t of i)
                            t.logicObject.findOutputNukeTask()
            } else
                "WaitForReqs" == this.data.state && 0 === Object.keys(this.GetProxifiedReqList()).length && this.entity.fire("ReqsEmpty");
            this.SetIdleVFXEnabled()
        }
    }
    Initialize() {
        const t = Game.objectData[this.type];
        t ? (this.nextState = {
            Idle: "WaitForReqs",
            WaitForReqs: "WaitForUnits",
            WaitForUnits: "Produce",
            Produce: "Complete",
            Complete: "Idle"
        },
        this.data && this._VerifyData() ? (this.entity.fire("PlayAnim", "Idle.json"),
        this.data.state,
        "Produce" == this.data.state && this.entity.fire("PlayAnim", "Crafting.json"),
        "Complete" == this.data.state && (this.townObject.claimedBy = null,
        this.entity.fire("PlayAnim", "Done.json"))) : (this.data = {},
        this.data.reqList = {},
        t.Crafts && 1 == t.Crafts.split(",").length ? (console.log("SET DEFAULT CRAFT"),
        this.data.craft = t.Crafts) : this.data.craft = "None",
        this.SetState("Idle")),
        this.craftData = this.getCraftData(),
        this.entity.on("ReqsEmpty", (()=>{
            this.SetState("WaitForUnits")
        }
        )),
        this.entity.on("UnitsAllHome", (()=>{
            this.SetState("Produce")
        }
        )),
        this.entity.on("ProduceComplete", (()=>{
            this.SetState("Complete")
        }
        )),
        this.entity.on("Harvested", (()=>{
            this.SetState("Idle")
        }
        )),
        this.entity.on("CraftSelected", this.CraftSelected.bind(this))) : console.log(`No Object Data for type : ${this.type}`)
    }
    _VerifyData() {
        return !0
    }
    ResetCraft() {
        this.data = {},
        this.data.craft = "None",
        this.data.reqList = {},
        this.craftData = null,
        this.SetState("Idle");
        for (let t in this.townObject.unitList)
            this.townObject.unitList[t].logicObject.task && this.townObject.unitList[t].logicObject.task.onInvalid()
    }
    SetCraft(t) {
        "None" != t && t != this.data.craft ? this.townObject.objData.Crafts.split(",").includes(t) && (this.data.state = null,
        this.data.craft = t,
        this.data.reqList = {},
        this.craftData = this.getCraftData(),
        this.SetState("Idle")) : this.ResetCraft()
    }
    CraftSelected(t) {
        LEDGER.craftSelect(this.townObject.townX, this.townObject.townZ, t),
        t || (t = "None"),
        this.SetCraft(t)
    }
    DebugStartCraft(t) {
        for (let t in this.data.reqList)
            this.data.reqList[t] = 0;
        this.data.craft = t,
        this.data.state = "WaitForUnits"
    }
    SetState(t) {
        if (!this.data.state || t == this.nextState[this.data.state]) {
            if ("Idle" == t && (this.entity.fire("PlayAnim", "Idle.json"),
            "None" != this.data.craft && (t = "WaitForReqs")),
            "WaitForReqs" == t) {
                const e = this.craftData;
                if (e)
                    if (Game.objectData[this.type].CraftReqsMet)
                        t = "WaitForUnits";
                    else {
                        this.data.reqList || (this.data.reqList = {}),
                        "none" != e.Req1 && (this.data.reqList[e.Req1] = e.Value1),
                        "none" != e.Req2 && (this.data.reqList[e.Req2] = e.Value2),
                        "none" != e.Req3 && (this.data.reqList[e.Req3] = e.Value3);
                        const i = this.townObject.GetTownPosition()
                          , a = Game.town.GetProximityEffects(i.x, i.z);
                        let s = e.ProximityBonus;
                        s = s.split(",");
                        for (let t in a)
                            s.includes(t) && this.ReduceReqs(t, a[t]);
                        0 === Object.keys(this.GetProxifiedReqList()).length && (t = "WaitForUnits")
                    }
                else
                    console.log(`No Craft Data for type ${this.data.craft}`)
            }
            "WaitForUnits" == t && "None" == Game.objectData[this.type].UnitType && (t = "Produce"),
            "Produce" == t && (this.entity.fire("PlayAnim", "Crafting.json"),
            this.data.startTime = Date.now(),
            this.data.craftTime = 0),
            "Complete" == t && (this.townObject.claimedBy = null,
            this.entity.fire("PlayAnim", "Done.json"),
            "Gasoline" === this.data.craft && API.event("made_gas")),
            this.entity.fire("PlaySound", t),
            this.data.state = t
        }
    }
    GetState() {
        return this.data.state
    }
    CanAcceptCraft(t) {
        return !("WaitForReqs" != this.data.state || !Object.keys(this.GetProxifiedReqList()).includes(t))
    }
    CanDispenseCraft(t) {
        return this.data.craft == t && "Complete" == this.data.state
    }
    getCraftData(t=this.data.craft) {
        if (!Game.craftData[t])
            return;
        const e = Object.assign({}, Game.craftData[t]);
        return Game.objectCraftData[this.type] && Game.objectCraftData[this.type][t] && Object.assign(e, Game.objectCraftData[this.type][t]),
        e
    }
    static calculateCraftProximityPenalty(t, e, i) {
        if (!e)
            return 0;
        if (t.ProximityImmune)
            return 0;
        if ("None" == e.ProximityPenalty)
            return 0;
        const a = e.ProximityPenalty.split(",")
          , s = t.ProximityEmit.split(",") || [];
        return a.reduce(((e,a)=>(i[a] && (e += i[a]),
        s.indexOf(a) > -1 && (e -= t.ProximityDist),
        e)), 0)
    }
    static calculateCraftTime(t, e, i, a) {
        return e[`Time${Math.min(TS_CrafterObjectLogic.calculateCraftProximityPenalty(t, e, i), 3)}`] * t.CraftTimeMod * a
    }
}
class TS_World {
    constructor(t, e, i, r) {
        this.mapData = t,
        this.worldObjectData = e,
        this.offsetX = i,
        this.offsetZ = r,
        this.citiesByPosition = [];
        for (const t in this.mapData) {
            const e = this.mapData[t]
              , i = this.worldObjectData[e.type.replace(/ /g, "_")];
            if (i && "City" === i.Class) {
                this.citiesByPosition[t] = i;
                const [e,r,a] = t.substring(1, t.length - 1).split(",");
                this.citiesByPosition.push({
                    name: i.Name,
                    position: new pc.Vec3(+e,+r,+a)
                })
            }
        }
        this.width = 512,
        this.height = 256,
        this.navGrids = {},
        this.GenerateNavGrids(),
        this.worldUnits = [],
        this.towns = {},
        Game.app.on("SetTownView", this.OnTownView.bind(this)),
        Game.app.on("SetWorldView", this.OnWorldView.bind(this)),
        Game.app.on("RealtimeTradeCreate", this.TradesCreate.bind(this)),
        Game.app.on("RealtimeTradeDelete", this.TradesDelete.bind(this));
        const pwnedByMal = t=>{
            this.towns[[t.x, t.y]] = t,
            Game.app.fire("WorldTownCreate", t)
        }
        ;
        Game.app.on("RealtimeTownCreate", pwnedByMal),
        Game.app.on("RealtimeTownDelete", (t=>{
            delete this.towns[[t.x, t.y]],
            Game.app.fire("WorldTownDelete", t)
        }
        )),
        API.viewMap(0, 0, 5e3, 5e3).then((t=>{
            for (const e of t)
                pwnedByMal(e);
            Game.app.fire("WorldTownsLoaded")
        }
        ))
    }
    setCameraToLatLon(t, e) {
        const i = CameraCommander.instance.worldCamera
          , r = this.width * e
          , a = this.height * t * -1;
        i.script.cameraController.SetPosition(r - 5, a + 20)
    }
    latLonToWorldPos(t, e) {
        const i = this.width * e
          , r = this.height * t * -1;
        return new pc.Vec3(i - 15,0,r + 10 + 255)
    }
    setCameraToClosestCity(t) {
        const e = this.GetClosestCityName(t);
        e && this.setCameraToCity(e.Name)
    }
    setCameraToCity(t) {
        const e = CameraCommander.instance.worldCamera
          , i = Game.world.citiesByPosition.find((e=>e.name == t));
        if (!i)
            return;
        const r = i.position;
        e.script.cameraController.SetPosition(r.x, r.z - 255)
    }
    raycastFromCameraCenter() {
        const t = Game.app.graphicsDevice.width / 2
          , e = Game.app.graphicsDevice.height / 2
          , i = CameraCommander.instance.worldCamera
          , r = i.camera.screenToWorld(t, e, i.camera.farClip);
        return Game.app.systems.rigidbody.raycastFirst(i.getPosition(), r)
    }
    findViewableWorldBounds() {
        const t = Game.app.graphicsDevice.width
          , e = Game.app.graphicsDevice.height
          , i = CameraCommander.instance.worldCamera
          , r = i.camera.screenToWorld(0, 0, i.camera.farClip)
          , a = i.camera.screenToWorld(t, 0, i.camera.farClip)
          , o = i.camera.screenToWorld(t, e, i.camera.farClip)
          , s = Game.app.systems.rigidbody.raycastFirst(i.getPosition(), r)
          , n = Game.app.systems.rigidbody.raycastFirst(i.getPosition(), a)
          , d = Game.app.systems.rigidbody.raycastFirst(i.getPosition(), o);
        return {
            boundsMinX: s.point.x,
            boundsMaxX: n.point.x,
            boundsMinZ: s.point.z,
            boundsMaxZ: d.point.z
        }
    }
    OnTownView() {
        this.worldViewActive = !1,
        this.ClearTradeVehicles()
    }
    OnWorldView() {
        API.scoreLeaderboard().then((t=>{
            t[0] && (this.leaderID = t[0].userId)
        }
        )),
        this.worldViewActive = !0,
        RT.view({
            from: {
                x: 0,
                z: 0
            },
            to: {
                x: 5e3,
                z: 5e3
            }
        })
    }
    TradesCreate(t) {
        if (this.worldViewActive)
            for (let e in t) {
                let i = {};
                if (i.startTime = Date.parse(t[e].startTime),
                i.endTime = i.startTime + t[e].duration,
                Date.now() >= i.endTime)
                    continue;
                i.unitType = t[e].unitType,
                i.craftType = t[e].craftType,
                i.path = t[e].path,
                i.source = t[e].source,
                i.userID = t[e].userId,
                i.isLeader = this.leaderID == i.userID;
                let r = !1;
                for (let t in this.worldUnits)
                    this.worldUnits[t].tradeData.userID == i.userID && this.worldUnits[t].tradeData.source.x == i.source.x && this.worldUnits[t].tradeData.source.z == i.source.z && (r = !0);
                r || this.AddTradeVehicle(i)
            }
    }
    TradesDelete(t) {
        for (let e in t) {
            let i = t[e];
            for (let t in this.worldUnits)
                if (this.worldUnits[t].tradeData.userID == i.userId && this.worldUnits[t].tradeData.source.x == i.source.x && this.worldUnits[t].tradeData.source.z == i.source.z) {
                    console.log("Removing unit"),
                    this.worldUnits[t].entity.destroy(),
                    this.worldUnits.splice(t, 1)
                }
        }
    }
    AddTradeVehicle(t) {
        this.worldUnits.push(new TS_WorldUnit(t))
    }
    ClearTradeVehicles() {
        for (; this.worldUnits.length > 0; ) {
            let t = this.worldUnits.pop();
            t && t.entity.destroy()
        }
    }
    GenerateNavGrids() {
        this.navGrids.WorldAir = [],
        this.navGrids.WorldOpen = [],
        this.navGrids.WorldWater = [];
        for (let t = 0; t < this.height; t++)
            for (let e = 0; e < this.width; e++) {
                let i = this.GetTypeAtPosition(e, t);
                if (!i) {
                    console.log(`Can not find Map Data for position : ${e},${t}`);
                    continue
                }
                if (i = i.replace(" ", "_"),
                !Game.worldObjectData[i]) {
                    console.log(`Can not find World Object Data for ${i} at ${e},${t}`);
                    continue
                }
                let r = Game.worldObjectData[i].NavType.split(",");
                this.navGrids.WorldAir[e] || (this.navGrids.WorldAir[e] = []),
                this.navGrids.WorldAir[e][t] = 1,
                this.navGrids.WorldOpen[e] || (this.navGrids.WorldOpen[e] = []),
                r.includes("WorldOpen") ? this.navGrids.WorldOpen[e][t] = 1 : this.navGrids.WorldOpen[e][t] = 0,
                this.navGrids.WorldWater[e] || (this.navGrids.WorldWater[e] = []),
                r.includes("WorldWater") || "City" == Game.worldObjectData[i].Class ? this.navGrids.WorldWater[e][t] = 1 : this.navGrids.WorldWater[e][t] = 0
            }
        this.navMaps = {},
        this.navMaps.airGraph = new Graph(this.navGrids.WorldAir,{
            diagonal: !1
        }),
        this.navMaps.groundGraph = new Graph(this.navGrids.WorldOpen,{
            diagonal: !1
        }),
        this.navMaps.waterGraph = new Graph(this.navGrids.WorldWater,{
            diagonal: !1
        })
    }
    GetWorldPositionFromTradeData(t) {
        let e = t.endTime - t.startTime
          , i = (Date.now() - t.startTime) / e;
        i = Math.min(1, i);
        let r, a = Math.floor(t.path.length * i), o = t.path.length * i - a, s = new pc.Vec3(t.path[Math.min(a, t.path.length - 1)].x,0,t.path[Math.min(a, t.path.length - 1)].y - 255);
        r = new pc.Vec3(t.path[Math.min(a + 1, t.path.length - 1)].x,0,t.path[Math.min(a + 1, t.path.length - 1)].y - 255),
        (new pc.Vec3).lerp(s, r, o)
    }
    Update(t) {
        for (let t in this.worldUnits)
            null === this.worldUnits[t].Update() && delete this.worldUnits[t]
    }
    GetTypeAtPosition(t, e) {
        let i = `(${t}.0,0.0,${e}.0)`;
        if (this.mapData[i])
            return this.mapData[i].type
    }
    GetObjectAtPosition(t, e) {
        let i = `(${t}.0,0.0,${e}.0)`;
        if (this.mapData[i])
            return this.mapData[i]
    }
    GetTownOKAtPosition(t, e) {
        let i = this.GetTypeAtPosition(t, e);
        if (Game.worldObjectData[i])
            return Game.worldObjectData[i].TownOk
    }
    GetTownPlacementDataAt(t, e) {
        let i = {};
        if (i.townOk = this.GetTownOKAtPosition(t, e),
        i.townOk) {
            for (let r = 0; r < 4; r++)
                if (this._TestValid(t, e, r, "WorldOpen"))
                    return i.tradeType = "WorldOpen",
                    i.startDirection = r,
                    i;
            for (let r = 0; r < 4; r++)
                if (this._TestValid(t, e, r, "WorldWater"))
                    return i.tradeType = "WorldWater",
                    i.startDirection = r,
                    i
        }
        return i
    }
    GetTradePlacementData(t, e) {
        let i = {};
        const r = [...Game.world.citiesByPosition]
          , a = ["groundGraph", "waterGraph"];
        for (let o in a)
            for (let s in r) {
                let n = Game.world.navMaps[a[o]]
                  , d = n.grid[t][e]
                  , l = n.grid[r[s].position.x][r[s].position.z]
                  , h = astar.search(n, d, l);
                if (i.pierSwap = !1,
                h.length > 0)
                    return "waterGraph" == a[o] && (i.pierSwap = !0,
                    h[0].y < e ? i.tradeDirection = "north" : h[0].x > t ? i.tradeDirection = "east" : h[0].y > e ? i.tradeDirection = "south" : h[0].x < t && (i.tradeDirection = "west")),
                    i.townOk = !0,
                    i
            }
        return {
            townOk: !1
        }
    }
    _TestValid(t, e, i, r) {
        let a = this.GetSurroundingTypesAt(t, e);
        if (a[offesets[i].x]) {
            let e = a[t][y];
            if (!e)
                return console.log("Invalid type in neighbors"),
                !1;
            if (e = e.replace(" ", "_"),
            !Game.worldObjectData[e])
                return console.log(`Can not find World Object Data for ${e}`),
                !1;
            if (Game.worldObjectData[e].NavType != r)
                return !1
        }
    }
    GetStartDirectionAtPosition(t, e, i="WorldOpen") {
        let r = this.GetSurroundingTypesAt(t, e);
        if (r[0]) {
            let t = r[0][-1];
            if (Game.worldObjectData[t].NavType == i)
                return "North"
        }
        return r[1] && Game.worldObjectData[r[1][0]].TownOk ? "East" : r[0] && Game.worldObjectData[r[0][1]].TownOk ? "South" : r[-1] && Game.worldObjectData[r[-1][0]].TownOk ? "West" : void 0
    }
    GetGroundTypeAtPosition(t, e) {
        let i = this.GetTypeAtPosition(t, e)
          , r = "P";
        return "Desert" == i ? r = "D" : "Forest" == i && (r = "F"),
        r
    }
    GetSurroundingTypesAt(t, e, i=1) {
        let r = [];
        for (let a = -1 * i; a <= i; a++)
            for (let o = -1 * i; o <= i; o++) {
                if (0 === a && 0 === o)
                    continue;
                let i = this.GetTypeAtPosition(t + o, e + a);
                r[o] || (r[o] = []),
                r[o][a] = i
            }
        return r
    }
    GetClosestCityName(t) {
        let e = Number.MAX_VALUE
          , i = null;
        for (const r of this.citiesByPosition) {
            const a = t.distance(r.position);
            a < e && (e = a,
            i = r.name)
        }
        return i && this.worldObjectData[i]
    }
    GetMapPositionFromWorldPosition(t, e) {
        return {
            x: this.GetMapXfromWorldX(t),
            z: this.GetMapZfromWorldZ(e)
        }
    }
    GetMapXfromWorldX(t) {
        return t - this.offsetX
    }
    GetMapZfromWorldZ(t) {
        return t - this.offsetZ
    }
    GetWorldPositionFromMapIndex(t, e) {
        return new pc.Vec3(t,.125,e - 255)
    }
    GetUserIdOfNeighbor(t) {
        const e = [[0, -1], [1, 0], [0, 1], [-1, 0]][t]
          , i = [Game.position.x + e[0], Game.position.y + e[1]]
          , r = this.towns[i];
        return r && r.userId
    }
}
class TS_Unit {
    constructor(t, i, e, s, n) {
        TS_Unit.pickRotationSpeed = 250,
        this.debug = !1,
        this.entity = null,
        this.exists = !0,
        this.type = t.replace(" ", "_"),
        this.worldX = i,
        this.worldZ = e,
        this.index = s,
        this.building = n,
        this.pathArray = [],
        this.startPosition = new pc.Vec3,
        this.speed = 1,
        this.difference = new pc.Vec3,
        this.distance = 0,
        this.direction = new pc.Vec3,
        this.isReady = !1,
        this.targetPosition = new pc.Vec3,
        this.homePosition = new pc.Vec3,
        this.unitsData = Game.unitsData[this.type],
        this.LoadEntity(),
        this.artLogicObject = new TS_ArtLogic(this.entity,this),
        this.entity.fire("PlayAnim", "Idle.json", !0),
        this.logicObject = new TS_UnitLogic(this)
    }
    nukeCraft() {
        this.logicObject.nukeCraft()
    }
    isHome() {
        return this.logicObject.IsHome()
    }
    move(t) {
        this.logicObject.move(t)
    }
    Update(t) {
        this.pickEntity && (this.pickEntity.enabled = this.pickStatus && !this.isHome(),
        this.pickEntity.rotate(0, t * TS_Unit.pickRotationSpeed, 0)),
        this.logicObject.Update(t)
    }
    Remove() {
        this.exists = !1,
        this.logicObject.OnRemove(),
        this.artLogicObject.OnRemove(),
        this.entity.destroy()
    }
    DebugLog(t) {
        this.debug && console.log(t)
    }
    LoadEntity() {
        this.entity = EntitySpawner.spawnObject(this.type, this.worldX, 0, this.worldZ, this.building.town.objParent),
        this.entity || (this.entity = new pc.Entity,
        this.building.town.objParent.addChild(this.entity),
        this.entity.setPosition(this.worldX, 0, this.worldZ)),
        this.pickEntity = EntitySpawner.spawnObject("UnitLocation", this.worldX, 3, this.worldZ, this.entity),
        this.pickEntity.enabled = !0,
        this.pickStatus = !1
    }
    setPickActive(t) {
        this.pickStatus = t
    }
    onHomeSelect() {
        this.setPickActive(!0)
    }
    onHomeDeselect() {
        this.setPickActive(!1)
    }
    AssignTask(t) {
        this.logicObject.AssignTask(t)
    }
    HasTask() {
        return this.logicObject.HasTask()
    }
    getTask() {
        return this.logicObject.task
    }
    GetRemainingDistanceToTarget() {
        return this.logicObject.GetRemainingDistanceToTarget()
    }
    isCarrying() {
        return this.logicObject.isCarrying()
    }
    GetCarriedCraft() {
        return this.logicObject.GetCarriedCraft()
    }
    setCraft(t) {
        return this.logicObject.setCraft(t)
    }
    canTarget(t) {
        return this.logicObject.canTarget(t)
    }
    DestroyEntity() {
        this.entity.destroy()
    }
    GetType() {
        return this.type
    }
    setTask(t) {
        return this.logicObject.setTask(t)
    }
    getPathTo(t) {
        return this.logicObject.GetPathTo(t)
    }
    taskCompare(t, i) {
        return this.logicObject.taskCompare(t, i)
    }
    setSkinnedEntity(t) {
        const i = []
          , e = []
          , s = this.artLogicObject.getAnimation()
          , n = this.artLogicObject.getAnimationTime();
        this.entity.children.filter((t=>t.tags.has("Skinnable"))).forEach((s=>{
            s.enabled = !1,
            !s.tags.has("Skin:Default") && s.tags.list().some((t=>t.startsWith("Skin:"))) || i.push(s),
            s.tags.has(`Skin:${t}`) && e.push(s)
        }
        ));
        if ((e.length > 0 ? e : i).forEach((t=>{
            t.enabled = !0
        }
        )),
        s) {
            const t = this.artLogicObject.getAnimationController() || {};
            (t.assets || []).forEach((i=>{
                Game.app.assets.get(i).ready((i=>{
                    if (i.name == s && (setTimeout((()=>{
                        t.play(s),
                        t.currentTime = n
                    }
                    ), 0),
                    this.artLogicObject.craftEntity)) {
                        const t = this.entity.children.find((t=>t.enabled)).findByName("CraftNode");
                        if (t) {
                            this.artLogicObject.craftEntity.reparent(t);
                            const i = t.getPosition();
                            this.artLogicObject.craftEntity.setPosition(i)
                        }
                    }
                }
                ))
            }
            ))
        }
    }
}
// TS_UnitManager.js

var LeaderboardUi = pc.createScript("leaderboardUi");
LeaderboardUi.prototype.initialize = function() {
    this.UI = new TS_LeaderboardUI({
        name: "leaderboard.html",
        divClass: "container",
        fullScreenUI: !0
    }),
    this.app.on("leaderboardui-enable", this.UI.OpenUI, this.UI),
    this.app.on("leaderboardui-disable", (()=>this.UI.CloseUI())),
    LeaderboardUi && (LeaderboardUi.instance = this)
}
;
class TS_LeaderboardUI extends TS_UIBase {
    Initialize() {
        Game.gameData && (this.endDate = new Date(Game.gameData.end)),
        setInterval((()=>this.updateTimeRemaining()), 1e3),
        this.wait = !1,
        this.footer = this.div.querySelector(".leaderboard .footer-row"),
        this.myRankButton = this.div.querySelector(".tab-buttons .button-my-rank"),
        this.top10Button = this.div.querySelector(".tab-buttons .button-top-10"),
        this.bottom10Button = this.div.querySelector(".tab-buttons .button-bottom-10"),
        this.playerTemplate = document.getElementById("player-template"),
        this.playerTarget = document.getElementById("player-target"),
        this.timeRemainingDays = this.div.querySelector(".time-remaining .days"),
        this.timeRemainingHours = this.div.querySelector(".time-remaining .hours"),
        this.timeRemainingMin = this.div.querySelector(".time-remaining .min"),
        this.timeRemainingSec = this.div.querySelector(".time-remaining .sec"),
        this.currentServer = this.div.querySelector("#currentServer"),
        this.myRankButton.addEventListener("click", (e=>{
            this.updateLeaderboard()
        }
        ), !1),
        this.top10Button.addEventListener("click", (e=>{
            this.playerTarget && API.scoreLeaderboard(0, 9).then((e=>{
                this.playerTarget.innerHTML = "",
                this.setLeaderboard(e, !0),
                this.div.querySelector(".player-rank-1").scrollIntoView()
            }
            ))
        }
        ), !1),
        this.bottom10Button.addEventListener("click", (e=>{
            this.playerTarget && API.scoreLeaderboardReverse(0, 9).then((e=>{
                this.playerTarget.innerHTML = "";
                let t = e[0].rank;
                this.setLeaderboard(e.reverse(), !0),
                this.div.querySelector(`.player-rank-${t}`).scrollIntoView()
            }
            ))
        }
        ), !1),
        this.div.querySelector(".close-button").addEventListener("click", (()=>this.CloseUI())),
        this.playerTarget.addEventListener("scroll", (e=>this.scrollLeaderboard()), !1)
    }
    checkShowFooter() {
        this.isVisible(document.querySelector(".me")) ? this.footer.style = "display:none" : this.footer.style = "display:"
    }
    isVisible(e) {
        const t = e.getBoundingClientRect();
        return t.top >= 0 && t.left >= 0 && t.bottom <= (window.innerHeight || document.documentElement.clientHeight) && t.right <= (window.innerWidth || document.documentElement.clientWidth)
    }
    OnOpen() {
        this.updateLeaderboard(),
        this.updateTimeRemaining(),
        API.event("leaderboard_open"),
        this.currentServer.innerHTML = "",
        API.getGame().then((e=>{
            this.currentServer.innerHTML = e.name
        }
        ))
    }
    OnClose() {
        Game.app.fire("LeaderboardUI-Closed")
    }
    OnReload() {
        this.isOpen && (this.updateTimeRemaining(),
        this.updateLeaderboard())
    }
    OnInternetConnectionLost() {
        this.CloseUI()
    }
    updateTimeRemaining() {
        if (!this.isOpen)
            return;
        let e = Math.floor((this.endDate.getTime() - (new Date).getTime()) / 1e3);
        const t = Math.floor(e / 86400);
        e -= 3600 * t * 24;
        const r = Math.floor(e / 3600);
        e -= 3600 * r;
        const i = Math.floor(e / 60);
        e -= 60 * i,
        e = Math.floor(e),
        this.timeRemainingDays.innerText = t.toString().padStart(2, "0"),
        this.timeRemainingHours.innerText = r.toString().padStart(2, "0"),
        this.timeRemainingMin.innerText = i.toString().padStart(2, "0"),
        this.timeRemainingSec.innerText = e.toString().padStart(2, "0")
    }
    updateLeaderboard() {
        this.playerTarget.innerHTML = "",
        Game.gameData.active || (this.div.querySelector(".time-remaining").style = "display:none"),
        API.getLastWinner().then((e=>{
            e && (this.div.querySelector(".winner").innerText = e.name,
            this.div.querySelector(".score span").innerText = e.score.toLocaleString(),
            UiTools.updateImageAssets(this.div),
            API.getUser(e.userId).then((e=>{
                if (console.log(e),
                e.avatarUrls)
                    delete this.div.querySelector(".player-pic img").dataset.srcAssetId,
                    this.div.querySelector(".player-pic img").src = e.avatarUrls[128];
                else {
                    const e = TempPlayerTownDisplayer.instance.townNameToDefaultAsset(Game.townName);
                    e && (this.div.querySelector(".player-pic").dataset.srcAssetName = e.name),
                    UiTools.updateImageAssets(this.div)
                }
            }
            )))
        }
        )),
        API.getGameSelf().then((e=>{
            this.scrollFirstItemNumber = 0,
            this.scrollLastItemNumber = 9,
            e && (e.pointsRank > 10 && (this.scrollFirstItemNumber = e.pointsRank - 10,
            this.scrollLastItemNumber = e.pointsRank + 10),
            this.myRankButton.querySelector("span").innerHTML = `MY RANK #${e.pointsRank}`),
            this.waitingForResponse || (this.waitingForResponse = !0,
            API.scoreLeaderboard(this.scrollFirstItemNumber, this.scrollLastItemNumber).then((e=>{
                this.waitingForResponse = !1,
                this.setLeaderboard(e, !0),
                document.querySelector(".me").scrollIntoView()
            }
            )))
        }
        ))
    }
    setLeaderboard(e, t) {
        var r = [];
        if (e.forEach((e=>{
            const i = document.importNode(this.playerTemplate.content, !0);
            i.querySelector(".rank").innerText = `${e.rank}`,
            i.querySelector(".name").innerText = e.name,
            i.querySelector(".score span").innerText = e.score.toLocaleString();
            const a = TempPlayerTownDisplayer.instance.townNameToDefaultAsset(e.name);
            if (a) {
                const e = a.id;
                i.querySelector(".avatar").innerHTML = `<img data-src-asset-id="${e}">`
            } else
                i.querySelector(".avatar").innerHTML = '<img data-src-asset-id="24639096">';
            const s = i.querySelector(".player");
            s.classList.add(`leaderboard-portrait-${e.userId}`),
            s.classList.add(`player-rank-${e.rank}`),
            e.userId === Game.userId && s.classList.add("me"),
            t ? this.playerTarget.appendChild(i) : r.push(i),
            API.getGameUser(e.userId).then((e=>{
                e.avatarUrls && (document.querySelector(`.leaderboard-portrait-${e.userId} .avatar`).innerHTML = `<img src=${e.avatarUrls[128]}>`)
            }
            ))
        }
        )),
        !t) {
            var i = document.getElementById("player-target").firstElementChild;
            r.reverse().forEach((e=>{
                this.playerTarget.prepend(e)
            }
            )),
            i.scrollIntoView()
        }
        const a = document.getElementById("player-target");
        a && (a.firstElementChild && (this.first = Number(a.firstElementChild.querySelector(".rank").innerText)),
        a.lastElementChild && (this.last = Number(a.lastElementChild.querySelector(".rank").innerText))),
        this.wait = !1,
        this.UpdateImagesAndTranslate(),
        Game.app.fire("LeaderboardUI-Loaded")
    }
    scrollLeaderboard() {
        let e = this.playerTarget
          , t = e.clientHeight
          , r = e.scrollHeight - t
          , i = e.scrollTop
          , a = Math.floor(i / r * 100);
        if (0 === a && !this.wait) {
            if (1 === this.first)
                return;
            let e = this.first - 11
              , t = e + 9;
            this.first <= 10 && (e = 0,
            t = this.first - 2),
            this.wait = !0,
            API.scoreLeaderboard(e, t).then((e=>{
                this.setLeaderboard(e, !1)
            }
            ))
        }
        if (a > 95 && !this.wait) {
            const e = this.last;
            let t = e + 10;
            this.wait = !0,
            API.scoreLeaderboard(e, t).then((e=>{
                this.setLeaderboard(e, !0)
            }
            ))
        }
    }
}
LeaderboardUi.prototype.log = window.logger && logger({
    context: "LeaderboardUi",
    color: "green",
    timing: !0
});
class TS_TradeObjectLogic extends TS_ObjectLogic {
    Initialize() {
        this.data && this._VerifyData() || (this.data = {},
        this.data.tradeID = null);
        let t = this.entity.getPosition();
        this.tapToCollectEntity = EntitySpawner.spawnObject("TapToCollect", t.x, t.y, t.z, this.entity),
        this.tapToCollectEntity.enabled = !1,
        Game.app.on("TownLoadComplete", this.SetInitialAnim.bind(this)),
        this.townObject.craftEntity = null,
        Game.town.townLoaded && this.SetInitialAnim(),
        this.townObject.entity.on("dooberTrainComplete", this.dooberTrainComplete, this)
    }
    dooberTrainComplete() {
        this.expectedDoobTrains ? (this.totalDoobersReceived++,
        this.totalDoobersReceived == this.expectedDoobTrains && (this.totalDoobersReceived = 0,
        this.expectedDoobTrains = 0,
        this.StartTradeAnim())) : this.StartTradeAnim()
    }
    StartTradeAnim() {
        this.townObject.entity.fire("PlayAnim", "DriveAway.json", !1),
        this.townObject.entity.fire("PlaySound", "DriveAway")
    }
    SetInitialAnim() {
        let t = this.townObject.town.GetActiveTradeData({
            x: this.townObject.townX,
            z: this.townObject.townZ
        });
        t ? Date.now() < Date.parse(t.startTime) + t.duration ? this.townObject.entity.fire("PlayAnim", "Away.json", !1) : (this.wasFinishedOnLoad = !0,
        this.townObject.entity.fire("PlayAnim", "Home.json", !0)) : this.townObject.entity.fire("PlayAnim", "Home.json", !0)
    }
    OnRemove() {
        this.townObject.craftEntity && this.townObject.craftEntity.destroy(),
        API.deleteTrade(this.townObject.townX, this.townObject.townZ),
        Game.town.RemoveActiveTrade({
            x: this.townObject.townX,
            z: this.townObject.townZ
        })
    }
    Update(t) {
        if (!this.tapToCollectEntity.enabled) {
            let t = this.townObject.town.GetActiveTradeData({
                x: this.townObject.townX,
                z: this.townObject.townZ
            });
            t && Date.now() > Date.parse(t.startTime) + t.duration && (this.tapToCollectEntity.enabled = !0,
            this.wasFinishedOnLoad || (this.townObject.entity.fire("PlayAnim", "DriveHome.json", !1, {
                animationName: "Home.json",
                looped: !0
            }),
            this.townObject.entity.fire("PlaySound", "DriveHome"),
            this.townObject.craftEntity && this.townObject.craftEntity.destroy()),
            Game.app.fire("TradeCollectionReady"))
        }
    }
    OnTapped() {
        let t = this.townObject.town.GetActiveTradeData({
            x: this.townObject.townX,
            z: this.townObject.townZ
        });
        if (t && Date.now() > Date.parse(t.startTime) + t.duration) {
            Game.town.RemoveActiveTrade({
                x: this.townObject.townX,
                z: this.townObject.townZ
            }),
            API.deleteTrade(this.townObject.townX, this.townObject.townZ).then((t=>{}
            )),
            this.tapToCollectEntity.enabled = !1,
            EntitySpawner.spawnObject("TapToCollectTapped", this.townObject.worldX, 0, this.townObject.worldZ, this.entity);
            let e = t.unitType
              , i = t.craftType
              , n = Game.unitsData[e].Capacity
              , a = Game.craftData[i].CityPrice * n
              , o = Math.ceil(Game.craftData[i].CityPoints * n);
            Game.addCurrency(a),
            Game.addPoints(o);
            const {destination: s, duration: r, gasCost: c} = t;
            API.event("trade_complete", {
                craftType: i,
                destination: s,
                duration: r,
                gas: c
            }),
            LEDGER.tradeEnd(this.townObject.townX, this.townObject.townZ),
            Game.saveAll(),
            Game.app.fire("TradeComplete")
        }
    }
    _VerifyData() {
        return !0
    }
    SetTradeID(t) {
        this.data.tradeID = t
    }
    GetTradeID() {}
}
class TS_ArtLogic {
    constructor(t, i) {
        if (this.entity = t,
        this.vfxDict = {},
        this.afxController = null,
        this.animControllers = [],
        this.type = i,
        !this.entity)
            throw "Cannot Create TS_ArtLogic without a valid entity";
        this.Initializie()
    }
    Initializie() {
        if (getSelfAndAllChildren(this.entity).forEach((t=>{
            t.tags.has("Anim") && t.animation && this.animControllers.push(t.animation);
            for (let i of t.tags.list())
                i.startsWith("VFX-") && (this.vfxDict[i.replace("VFX-", "")] || (this.vfxDict[i.replace("VFX-", "")] = []),
                this.vfxDict[i.replace("VFX-", "")].push(t.particlesystem))
        }
        )),
        this.entity.tags.has("AFX"))
            this.afxController = this.entity.sound;
        else
            for (let t = 0; t < this.entity.children.length; t++)
                this.entity.children[t].tags.has("AFX") && (this.afxController = this.entity.children[t].sound);
        this.entity.on("Idle", this.PlayAnim.bind(this)),
        this.entity.on("Crafting", this.PlayAnim.bind(this)),
        this.entity.on("Done", this.PlayAnim.bind(this)),
        this.entity.on("PlayAnim", this.PlayAnim.bind(this)),
        this.entity.on("PlaySound", this.PlaySound.bind(this)),
        this.entity.on("PlayVFX", this.PlayVFX.bind(this)),
        this.entity.on("StopVFX", this.StopVFX.bind(this)),
        this.entity.on("UpdateUnitCraft", this.UpdateUnitCraft.bind(this))
    }
    PlayVFX(t) {
        if (this.vfxDict[t])
            for (let i in this.vfxDict[t])
                this.vfxDict[t][i].loop || this.vfxDict[t][i].reset(),
                this.vfxDict[t][i].play()
    }
    StopVFX(t) {
        if (this.vfxDict[t])
            for (let i in this.vfxDict[t])
                this.vfxDict[t][i].stop()
    }
    PlaySound(t) {
        SETTINGS.soundEffectsEnabled && t && this.afxController && (this.afxController.stop(),
        "Produce" == t && (t = "Crafting"),
        "Complete" == t && (t = "Done"),
        this.afxController.slots[t] && this.afxController.slots[t].asset && (this.afxController.slots[t].loop || Game.town.townLoaded) && this.afxController.play(t))
    }
    PlayAnim(t, i, n) {
        if (this.currAnim = t,
        !this.animControllers.length)
            return;
        this.nextAnim = n;
        let e = t.split(".")[0];
        for (let t in this.vfxDict)
            for (let i in this.vfxDict[t])
                this.vfxDict[t][i].entity.tags.has("PersistentVFX") || this.vfxDict[t][i].stop();
        if (this.vfxDict[e])
            for (let t in this.vfxDict[e])
                this.vfxDict[e][t].loop || this.vfxDict[e][t].reset(),
                this.vfxDict[e][t].play();
        this.animControllers.forEach((n=>{
            !0 === i && (n.loop = !0),
            !1 === i && (n.loop = !1),
            n && n.getAnimation(t) && n.play(t)
        }
        )),
        this.playAnimationVFX(t.split(".")[0])
    }
    playAnimationVFX(t) {
        if (this.entity.findByTag("Anim-VFX").length > 0 && this.type.logicObject && this.type.isHome()) {
            const i = `${this.type.type}_vfx-on${t}`
              , {x: n, y: e, z: s} = this.entity.getPosition();
            EntitySpawner.spawnObject(i, n, e, s, Game.app.root)
        }
    }
    Update(t) {
        if (this.nextAnim && this.animControllers.length) {
            const t = this.animControllers.find((t=>t.entity.enabled));
            if (t && t.currentTime == t.duration) {
                const t = this.nextAnim.animationName
                  , i = this.nextAnim.looped
                  , n = this.nextAnim.nextAnim;
                this.nextAnim.onStart && this.nextAnim.onStart(),
                this.nextAnim = null,
                this.PlayAnim(t, i, n)
            }
        }
    }
    OnRemove() {
        this.craftEntity && this.craftEntity.destroy()
    }
    UpdateUnitCraft(t) {
        if (!t)
            return void (this.craftEntity && this.craftEntity.destroy());
        this.craftEntity && this.craftEntity.destroy();
        const i = [this.entity, ...this.entity.children].filter((t=>t.enabled)).reduce(((t,i)=>i.findByName("CraftNode") || t), null);
        if (i) {
            1 !== i.localScale.x && i.setLocalScale(1, 1, 1);
            const n = i.getPosition();
            this.craftEntity = EntitySpawner.spawnObject(t, i.x, i.y, i.z, i, !0),
            this.craftEntity.setPosition(n),
            this.craftEntity.scaleCompensation = !0
        }
    }
    getActiveEntity() {
        return this.entity.children.find((t=>!0 === t.enabled))
    }
    getAnimationController() {
        if (this.animControllers.length)
            return this.animControllers.find((t=>!0 === t.entity.enabled))
    }
    getAnimation() {
        return this.getAnimationController() && this.getAnimationController().currAnim || this.currAnim
    }
    getAnimationTime() {
        return this.getAnimationController() && this.getAnimationController().currentTime
    }
    setAnimationTime(t) {
        const i = this.getAnimationController();
        i && (i.currentTime = t,
        i.playing = !0)
    }
    setAnimationandTime(t, i) {
        this.setAnimationTime(i)
    }
    UpdateEntity(t) {
        this.entity = t
    }
}
var TownNameUI = pc.createScript("townNameUI");
TownNameUI.prototype.initialize = function() {
    TownNameUI.instance = this,
    this.UI = new TS_TownNameUI({
        name: "townNameUi.html",
        divClass: "container",
        fullScreenUI: !0
    })
}
;
class TS_TownNameUI extends TS_UIBase {
    Initialize() {
        this.inputElement = this.div.querySelector("input[type=text]"),
        this.errorElement = this.div.querySelector(".error-text"),
        this.confirmElement = this.div.querySelector(".confirm-button"),
        this.div.querySelector(".close-button").addEventListener("click", (()=>this.CloseUI())),
        this.inputElement.addEventListener("input", (()=>{
            if (this.errorElement.style.display = "none",
            this.inputElement.value.length > 20) {
                this.errorElement.style.display = "block",
                this.confirmElement.disabled = !0;
                let e = "8041_0";
                return this.errorElement.innerText = Grabbatron.pullEntry(e),
                void (this.confirmElement.disabled = !0)
            }
            "" === this.inputElement.value ? this.confirmElement.disabled = !0 : this.confirmElement.disabled = !1
        }
        )),
        Game.app.on("LocationConfirmed", ((e,t,i,n)=>{
            Game.world.GetTradePlacementData(e, t).townOk && (this.OpenUI(),
            this.x = e,
            this.z = t,
            this.pierSwap = i,
            this.tradeDir = n)
        }
        )),
        this.confirmElement.addEventListener("click", (()=>{
            this.ConfirmName(this.inputElement.value)
        }
        )),
        this.UpdateImagesAndTranslate()
    }
    OnOpen() {
        this.inputElement.focus(),
        this.inputElement.select(),
        this.inputElement.value = "",
        this.confirmElement && (this.confirmElement.disabled = !0,
        this.errorElement.style.display = "none"),
        Game.app.fire("onboarding-toaster-disable")
    }
    OnInternetConnectionLost() {
        this.CloseUI()
    }
    ConfirmName(e) {
        const {pierSwap: t, tradeDir: i, x: n, z: r} = this;
        API.joinGame(e, n, r).then((e=>{
            Game.townName = e.name,
            Game.position = e.position,
            Game.addPoints(e.points),
            Game.addCurrency(e.currency),
            API.event("game_join", {
                pointsRank: e.pointsRank
            }),
            Game.onboardingProgress && "ChooseSpot" === Game.onboardingProgress.progress ? Game.app.fire("onboarding-progress", "YouReady", {
                pierSwap: t,
                tradeDir: i
            }) : (Game.app.fire("TownCreated", t, i),
            Game.app.fire("onboarding-toaster-disable"),
            Game.app.fire("toasterui-disable")),
            this.CloseUI()
        }
        )).catch((e=>{
            this.errorElement.style.display = "block";
            let t = null;
            switch (e.code) {
            case "LOCATION_TAKEN":
                t = "8042_0";
                break;
            case "NAME_TAKEN":
            case "BAD_NAME":
            case "INVALID_NAME":
                t = "8041_0";
                break;
            default:
                e.error = "Error"
            }
            this.errorElement.innerText = Grabbatron.pullEntry(t) || e.error,
            this.confirmElement.disabled = !0
        }
        ))
    }
}
var RandomScaleOntownLoad = pc.createScript("randomScaleOntownLoad");
RandomScaleOntownLoad.attributes.add("uniformScaleMin", {
    type: "number",
    default: .8
}),
RandomScaleOntownLoad.attributes.add("uniformScaleMax", {
    type: "number",
    default: 1.2
}),
RandomScaleOntownLoad.prototype.initialize = function() {
    this.app.on("TownLoadComplete", this.TownLoadComplete.bind(this))
}
,
RandomScaleOntownLoad.prototype.TownLoadComplete = function(a) {
    var t = Math.random() * (this.uniformScaleMax - this.uniformScaleMin) + this.uniformScaleMin
      , n = this.entity.getLocalScale();
    this.entity.setLocalScale(new pc.Vec3(t * n.x,t * n.y,t * n.z))
}
;
var Trade = pc.createScript("trade");
function msToTime(t) {
    var e = (t = (t - t % 1e3) / 1e3) % 60
      , i = (t = (t - e) / 60) % 60
      , a = (t - i) / 60;
    return a < 10 && (a = "0" + a),
    i < 10 && (i = "0" + i),
    e < 10 && (e = "0" + e),
    a + ":" + i + ":" + e
}
Trade.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
Trade.attributes.add("craftData", {
    type: "asset",
    assetType: "json"
}),
Trade.attributes.add("worldMap", {
    type: "asset",
    assetType: "json"
}),
Trade.attributes.add("hud", {
    type: "entity"
}),
Trade.attributes.add("connectionHtml", {
    type: "asset",
    assetType: "html"
}),
TradeUI = {},
Trade.prototype.initialize = function() {
    TradeUI.instance = this;
    const {currency: t, galaPower: e, gameData: i, gold: a, points: s} = Game
      , {gameId: n, name: o, population: r, secondsRemaining: c} = i;
    this.div = document.createElement("div"),
    this.div.classList.add("container"),
    document.body.appendChild(this.div),
    this.div.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.div.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.div.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.on("enable", (()=>{
        this.div.style.display = "flex",
        this.app.fire("hud-disable"),
        this.app.fire("objectmenu-disable"),
        this.app.fire("object-float-disable"),
        this.updateCrafts(),
        this.firstLoad = !0
    }
    )),
    this.on("disable", (()=>{
        this.div.style.display = "none",
        PhaseManager.instance.phase === PhaseManager.PlayingPhase && (this.app.fire("hud-enable"),
        this.app.fire("objectmenu-enable"))
    }
    )),
    this.app.on("StorageAmountChanged", (()=>{
        this.enabled && this.updateCrafts()
    }
    )),
    this.app.on("SellClicked", (t=>{
        API.event("trade_open"),
        this.townObject = Game.town.GetObjectAt(t.x, t.z),
        this.entity.enabled = !0,
        this.reload()
    }
    )),
    this.entity.enabled = !1,
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    this.app.on("InternetConnectionLost", (()=>this.entity.enabled = !1)),
    this.onboarding = !0,
    this.reload()
}
,
Trade.prototype.SpawnConnection = function(t) {
    this.tradeData = t,
    this.connectionDiv = document.createElement("div"),
    this.connectionDiv.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.connectionDiv.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.connectionDiv.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.connectionDiv.classList.add("container"),
    document.body.appendChild(this.connectionDiv),
    this.connectionDiv.innerHTML = this.connectionHtml.resource,
    this.connectionDiv.querySelector(".anim img").dataset.srcAssetName = UiTools.getIconFileName(this.townObject.objData.UnitType),
    UiTools.updateImageAssets(this.connectionDiv),
    UiTools.translateTextAssets(this.connectionDiv),
    this.initialDisplayTimeout = setTimeout(this.OnConnectionDisplayTimeout.bind(this), 1500),
    this.connectionDisplayTimeout = setTimeout((()=>{
        this.connectionDiv.querySelector("#tradeconnection-text").innerText = Grabbatron.pullEntry("8025_0")
    }
    ), 500),
    this.connectionDiv.querySelector("#tradeconnection-text").innerText = Grabbatron.pullEntry("8004_0"),
    this.responseReceived = !1,
    this.displayTimeoutComplete = !1,
    this.cancelled = !1,
    this.requestFailed = !1,
    this.cancelButton = this.connectionDiv.querySelector(".no"),
    this.cancelButton && (this.cancelButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.cancelButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.cancelButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.cancelButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.CancelButtonClick(),
        API.event("trade_cancel", {
            destination: t.destination,
            duration: t.duration,
            gas: t.gasCost
        })
    }
    )));
    const e = SKINS[this.townObject.type] || "";
    API.createTrade(t.duration, t.unitType, t.craftType, t.destination, t.source, t.path, e).then((t=>{
        this.cancelled || t.success && (this.cancelled ? API.deleteTrade(this.tradeData.source.x, this.tradeData.source.z) : (this.requestFailed = !1,
        this.OnReceiveAPIResponse()))
    }
    ), (t=>{
        this.requestFailed = !0,
        this.OnReceiveAPIResponse(),
        API.deleteTrade(this.tradeData.source.x, this.tradeData.source.z)
    }
    ))
}
,
Trade.prototype.CloseUI = function() {
    this.connectionDiv && this.connectionDiv.remove(),
    clearTimeout(this.initialDisplayTimeout),
    clearTimeout(this.connectionDisplayTimeout),
    this.entity.enabled = !1,
    this.fire("Closed")
}
,
Trade.prototype.CancelButtonClick = function() {
    this.cancelled = !0,
    this.tradeData && API.deleteTrade(this.tradeData.source.x, this.tradeData.source.z),
    this.CloseUI()
}
,
Trade.prototype.TradeStartComplete = function() {
    if (this.cancelButton.disabled = !0,
    this.cancelled)
        return void this.CloseUI();
    if (this.requestFailed)
        return this.connectionDiv.querySelector("#tradeconnection-text").innerText = Grabbatron.pullEntry("8035_0"),
        void (this.connectionDisplayTimeout = setTimeout((()=>{
            this.CloseUI()
        }
        ), 500));
    this.connectionDiv.querySelector("#tradeconnection-text").innerText = Grabbatron.pullEntry("8023_0"),
    this.connectionDisplayTimeout = setTimeout((()=>{
        this.CloseUI()
    }
    ), 500),
    this.tradeData.startTime = Date().toString();
    const t = {
        [this.selectedCraftName]: [],
        Gasoline: []
    };
    let e = Game.unitsData[this.tradeData.unitType].Capacity;
    if ("Gasoline" == this.tradeData.craftType) {
        if (e += this.tradeData.gasCost,
        Game.town.GetStoredCrafts().Gasoline < e)
            return API.deleteTrade(this.tradeData.source.x, this.tradeData.source.z),
            void (this.connectionDiv.querySelector("#tradeconnection-text").innerText = "Trade Failed, Not Enough Craft");
        t[this.selectedCraftName].push(...Game.tradeCraftsToCity(this.selectedCraftName, e, this.townObject, {
            OnLast: "dooberTrainComplete"
        })),
        this.townObject.logicObject.expectedDoobTrains = Object.keys(t).reduce(((e,i)=>e + t[i].length), 0),
        this.townObject.logicObject.totalDoobersReceived = 0
    } else {
        if (Game.town.GetStoredCrafts().Gasoline < this.tradeData.gasCost || Game.town.GetStoredCrafts()[this.selectedCraftName] < e)
            return API.deleteTrade(this.tradeData.source.x, this.tradeData.source.z),
            void (this.connectionDiv.querySelector("#tradeconnection-text").innerText = "Trade Failed, Not Enough Craft");
        t[this.selectedCraftName].push(...Game.tradeCraftsToCity(this.selectedCraftName, e, this.townObject, {
            OnLast: "dooberTrainComplete"
        })),
        t.Gasoline.push(...Game.tradeCraftsToCity("Gasoline", this.tradeData.gasCost, this.townObject)),
        this.townObject.logicObject.expectedDoobTrains = Object.keys(t).filter((t=>"Gasoline" !== t)).reduce(((e,i)=>e + t[i].length), 0),
        this.townObject.logicObject.totalDoobersReceived = 0
    }
    Game.town.AddActiveTrade(this.tradeData),
    LEDGER.tradeStart(this.townObject.townX, this.townObject.townZ, this.tradeData.destination, this.tradeData.craftType, t);
    const i = this.townObject.entity.findByName("CraftNode");
    if (i) {
        const t = i.getPosition();
        this.townObject.craftEntity = EntitySpawner.spawnObject(this.tradeData.craftType, i.x, i.y, i.z, i),
        this.townObject.craftEntity && (this.townObject.craftEntity.setPosition(t),
        this.townObject.craftEntity.findByTag("craft-vfx").forEach((t=>t.enabled = !1)))
    }
    this.townObject.logicObject.wasFinishedOnLoad = !1,
    Game.saveAll()
}
,
Trade.prototype.OnReceiveAPIResponse = function() {
    this.responseReceived = !0,
    this.displayTimeoutComplete && this.TradeStartComplete()
}
,
Trade.prototype.OnConnectionDisplayTimeout = function() {
    this.displayTimeoutComplete = !0,
    this.responseReceived && this.TradeStartComplete()
}
,
Trade.prototype.reload = function() {
    if (this.div.innerHTML = this.html.resource,
    UiTools.translateTextAssets(this.div),
    this.entity.enabled && (this.div.querySelector(".left h1").innerText = this.townObject.type.replace("_", " ")),
    this.craftTemplate = document.getElementById("trade-craft-template"),
    this.craftTarget = document.getElementById("trade-craft-target"),
    this.destinationTemplate = document.getElementById("destination-template"),
    this.destinationTarget = document.getElementById("destination-target"),
    this.selectedCraftTarget = document.getElementById("selected-craft"),
    this.objectPortrait = document.getElementById("trade-portrait"),
    this.townObject && (this.objectPortrait.dataset.srcAssetName = UiTools.getIconFileName(`${this.townObject.type}UI`)),
    this.townObject) {
        const t = this.townObject.objData.UnitType
          , e = (Grabbatron.findId(t),
        Game.unitsData[t].Capacity);
        this.div.querySelector("#craft-required").innerText = Grabbatron.formatString("8019_0", [e])
    }
    this.div.querySelector(".close-button").addEventListener("click", (()=>{
        this.CloseUI(),
        this.fire("TradeCloseButtonTapped"),
        this.entity.enabled = !1
    }
    )),
    this.div.querySelector(".crafts").addEventListener("click", (t=>{
        const e = t.target.closest(".craft");
        e && this.selectCraft(e)
    }
    )),
    this.entity.enabled && this.updateCrafts(),
    UiTools.updateImageAssets(this.div),
    this.fire("Opened")
}
,
Trade.prototype.updateCrafts = function() {
    this.storedCrafts = Game.town.GetStoredCrafts(),
    this.div.querySelector(".bank.currency p").innerText = Game.currency.toLocaleString(),
    this.div.querySelector(".bank.gas p").innerText = this.storedCrafts.Gasoline && this.storedCrafts.Gasoline.toLocaleString() || "0",
    this.craftTarget.innerHTML = "";
    const t = Object.keys(this.storedCrafts).filter((t=>"Gasoline" !== t)).map((t=>({
        craft: t,
        amount: this.storedCrafts[t]
    })));
    t.sort(((t,e)=>e.amount - t.amount)),
    this.storedCrafts.Gasoline && t.push({
        craft: "Gasoline",
        amount: this.storedCrafts.Gasoline
    });
    for (const e of t) {
        const t = e.craft
          , i = this.storedCrafts[t]
          , a = document.importNode(this.craftTemplate.content, !0);
        a.querySelector(".craft").dataset.name = t,
        a.querySelector(".name").innerText = Grabbatron.pullEntry(Grabbatron.findId(t)),
        a.querySelector(".quantity").innerText = i.toLocaleString(),
        a.querySelector(".icon").dataset.srcAssetName = UiTools.getIconFileName(t),
        a.querySelector(".craft").classList.add(e.craft),
        this.craftTarget.appendChild(a)
    }
    UiTools.updateImageAssets(this.craftTarget);
    const e = this.selectedCraftName && this.craftTarget.querySelectorAll(`.craft[data-name='${this.selectedCraftName}']`)[0] || this.craftTarget.querySelectorAll(".craft")[0];
    e && this.selectCraft(e)
}
,
Trade.prototype.selectCraft = function(t) {
    this.destinationTarget.innerHTML = '<div class="LoadingOrders">Loading Orders <img data-src-asset-id="29052470"> </div>',
    UiTools.updateImageAssets(this.destinationTarget),
    UiTools.translateTextAssets(this.destinationTarget),
    this.selectedCraftName = t.dataset.name,
    console.log("trade craft selected"),
    this.fire("CraftSelected", this.selectedCraftName),
    this.craftTarget.querySelectorAll(".craft").forEach((t=>t.classList.remove("selected"))),
    t.classList.add("selected"),
    this.selectedCraftTarget.querySelector("#selected-craft-icon").dataset.srcAssetName = UiTools.getIconFileName(this.selectedCraftName),
    this.selectedCraftTarget.querySelector("p").innerText = Grabbatron.pullEntry(`${this.craftData.resource[this.selectedCraftName].Id}_0`),
    UiTools.updateImageAssets(this.selectedCraftTarget),
    this.gettingDestinations || (this.gettingDestinations = !0,
    this.cityPaths = [],
    this.hadPath = !1,
    this.cityIndex = 0,
    this.isSearching = !0);
    let e = this.townObject.objData.UnitType
      , i = Game.unitsData[e].NavType
      , a = Game.town.GetTradeOffsetAt(this.townObject.townX, this.townObject.townZ)
      , s = `${i}${a.x},${a.z}`;
    if (this.townObject.town.tradepaths[s])
        for (let t in this.townObject.town.tradepaths[s]) {
            this.cityPaths[t] = {},
            this.cityPaths[t].index = this.townObject.town.tradepaths[s][t].index,
            this.cityPaths[t].gasCost = this.townObject.town.tradepaths[s][t].gasCost,
            this.cityPaths[t].travelTime = this.townObject.town.tradepaths[s][t].travelTime,
            this.cityPaths[t].path = [];
            for (let e in this.townObject.town.tradepaths[s][t].path)
                this.cityPaths[t].path[e] = Object.assign({}, this.townObject.town.tradepaths[s][t].path[e]);
            this.hadPath = !0
        }
    let n = "";
    "WorldAir" == i && (n = "airGraph"),
    "WorldOpen" == i && (n = "groundGraph"),
    "WorldWater" == i && (n = "waterGraph"),
    this.navMap = Game.world.navMaps[n]
}
,
Trade.prototype.update = function(t) {
    if (this.gettingDestinations)
        if (Game.world.citiesByPosition[this.cityIndex] && !this.hadPath)
            if (this.pathingGenerator) {
                let t = this.pathingGenerator.next();
                if (t.done) {
                    if (0 !== t.value.length)
                        this.cityPaths.push({
                            index: this.cityIndex,
                            path: t.value
                        });
                    else {
                        let t = Game.town.GetTradeOffsetAt(this.townObject.townX, this.townObject.townZ)
                          , e = this.navMap.grid[Game.position.x + t.x][Game.position.y + t.z];
                        if (this.navMap.grid[Game.world.citiesByPosition[this.cityIndex].position.x][Game.world.citiesByPosition[this.cityIndex].position.z] == e) {
                            let t = [];
                            t.push(e),
                            this.cityPaths.push({
                                index: this.cityIndex,
                                path: t
                            })
                        }
                    }
                    this.cityIndex++,
                    this.pathingGenerator = null
                }
            } else {
                let t = Game.town.GetTradeOffsetAt(this.townObject.townX, this.townObject.townZ)
                  , e = this.navMap.grid[Game.position.x + t.x][Game.position.y + t.z]
                  , i = this.navMap.grid[Game.world.citiesByPosition[this.cityIndex].position.x][Game.world.citiesByPosition[this.cityIndex].position.z];
                this.pathingGenerator = astar.searchGen(this.navMap, e, i, {})
            }
        else {
            let t = this.townObject.objData.UnitType
              , e = Game.unitsData[t].NavType
              , i = Game.town.GetTradeOffsetAt(this.townObject.townX, this.townObject.townZ)
              , a = `${e}${i.x},${i.z}`;
            if (!this.hadPath) {
                Game.town.tradepaths[a] = [];
                for (let t in this.cityPaths) {
                    Game.town.tradepaths[a][t] = {},
                    Game.town.tradepaths[a][t].index = this.cityPaths[t].index,
                    Game.town.tradepaths[a][t].gasCost = this.cityPaths[t].gasCost,
                    Game.town.tradepaths[a][t].travelTime = this.cityPaths[t].travelTime,
                    Game.town.tradepaths[a][t].path = [];
                    for (let e in this.cityPaths[t].path)
                        Game.town.tradepaths[a][t].path[e] = Object.assign({}, this.cityPaths[t].path[e])
                }
            }
            for (let a in this.cityPaths) {
                i = Game.town.GetTradeOffsetAt(this.townObject.townX, this.townObject.townZ),
                this.cityPaths[a].path.unshift(this.navMap.grid[Game.position.x + i.x][Game.position.y + i.z]),
                "WorldWater" == e && this.cityPaths[a].length > 1 && this.cityPaths[a].path.pop();
                const s = Game.unitsData[t].GasReq;
                this.cityPaths[a].gasCost = Math.max(Math.floor(this.cityPaths[a].path.length * s), 1);
                let n = Array.from(this.cityPaths[a].path);
                for (let t = this.cityPaths[a].path.length - 2; t >= 0; t--)
                    n.push(this.cityPaths[a].path[t]);
                this.cityPaths[a].path = n;
                let o = 0;
                for (let e = 0; e < this.cityPaths[a].path.length - 1; e++)
                    o += 1e3 * Game.unitsData[t].TravelSpeed;
                this.cityPaths[a].travelTime = o
            }
            this.cityPaths.sort((function(t, e) {
                return t.travelTime - e.travelTime
            }
            )),
            this.gettingDestinations = !1,
            this.updateDestinations()
        }
}
,
Trade.prototype.updateDestinations = function() {
    if (!this.skipUpdateDestination) {
        const t = this.storedCrafts[this.selectedCraftName];
        let e = this.townObject.objData.UnitType
          , i = Game.unitsData[e].Capacity;
        Game.world.GetClosestCityName(new pc.Vec3(Game.position.x,0,Game.position.y));
        this.destinationTarget.innerHTML = "";
        for (let a in this.cityPaths) {
            let s = Game.world.citiesByPosition[this.cityPaths[a].index].name;
            const n = document.importNode(this.destinationTemplate.content, !0)
              , o = this.craftData.resource[this.selectedCraftName].CityPrice * Game.unitsData[e].Capacity;
            n.querySelector(".destination").dataset.name = s,
            n.querySelector(".destination").dataset.cityIndex = this.cityPaths[a].index,
            n.querySelector(".city").innerText = Grabbatron.pullEntry(Grabbatron.findId(s)),
            n.querySelector(".price p").innerText = o.toLocaleString(),
            n.querySelector(".vehicle img").dataset.srcAssetName = UiTools.getIconFileName(this.townObject.objData.Name),
            n.querySelector(".duration p").innerText = msToTime(this.cityPaths[a].travelTime);
            const r = n.querySelector("button");
            "Gasoline" == this.selectedCraftName && (i = Game.unitsData[e].Capacity + this.cityPaths[a].gasCost),
            t >= i && this.storedCrafts.Gasoline >= this.cityPaths[a].gasCost ? r.classList.remove("disabled") : r.classList.add("disabled"),
            r.addEventListener("click", this.sellButtonClick.bind(this)),
            r.innerHTML = r.innerHTML.replace("?", this.cityPaths[a].gasCost),
            this.destinationTarget.appendChild(n),
            UiTools.updateImageAssets(this.destinationTarget)
        }
    }
    console.log("loaded"),
    this.fire("Loaded")
}
,
Trade.prototype.sellButtonClick = function(t) {
    const e = t.target.closest(".destination");
    let i = e.dataset.name
      , a = +e.dataset.cityIndex
      , s = 0;
    for (let t in this.cityPaths)
        if (this.cityPaths[t].index == a) {
            s = t;
            break
        }
    let n = this.cityPaths[s].gasCost
      , o = this.townObject.objData.UnitType
      , r = [];
    for (let t in this.cityPaths[s].path) {
        let e = this.cityPaths[s].path[t];
        r.push({
            x: e.x,
            z: e.y
        })
    }
    Date.now();
    let c = {
        duration: this.cityPaths[s].travelTime,
        unitType: o,
        craftType: this.selectedCraftName,
        destination: i,
        source: {
            x: this.townObject.townX,
            z: this.townObject.townZ
        },
        path: r,
        gasCost: n
    };
    API.event("trade_start", {
        destination: i,
        duration: c.duration,
        gas: n
    }),
    this.fire("TradeStarted"),
    this.SpawnConnection(c)
}
;
class UiTools {
    static getIconFileName(t) {
        return `icon_${t[0].toLowerCase()}${t.substring(1).replace(/_/gi, "")}.png`
    }
    static getWorldObjectAttribute(t, e=0) {
        let r = Game.worldObjectData[t];
        if (!t)
            return t;
        if (!r)
            return r;
        let a = Grabbatron.pullEntry(`${r.Id}_${e}`);
        if (a)
            return a;
        switch (e) {
        case 0:
            return r.Name.replace(/_/g, " ");
        default:
            return
        }
    }
    static getObjectAttribute(t, e=0) {
        let r = Game.objectData[t];
        if (!t)
            return t;
        if (!r)
            return r;
        let a = Grabbatron.pullEntry(`${r.Id}_${e}`);
        if (a)
            return a;
        switch (e) {
        case 0:
            return r.Name.replace(/_/g, " ");
        case 1:
            return r.Description.replace(/_/g, " ");
        default:
            return
        }
    }
    static getUnitAttribute(t, e=0) {
        let r = Game.unitsData[t];
        if (!t)
            return t;
        if (!r)
            return r;
        let a = Grabbatron.pullEntry(`${r.Id}_${e}`);
        if (a)
            return a;
        switch (e) {
        case 0:
            return r.Name.replace(/_/g, " ");
        default:
            return
        }
    }
    static getCraftAttribute(t, e=0) {
        let r = Game.craftData[t];
        if (!t)
            return t;
        if (!r)
            return r;
        let a = Grabbatron.pullEntry(`${r.Id}_${e}`);
        if (a)
            return a;
        switch (e) {
        case 0:
            return r.Name.replace(/_/g, " ");
        case 1:
            return r.CraftingText.replace(/_/g, " ");
        default:
            return
        }
    }
    static updateImageAssets(t) {
        (t = t || document).querySelectorAll("img[data-src-asset-id]").forEach((t=>{
            const e = t.dataset.srcAssetId
              , r = app.assets.get(e);
            r ? (t.src = r.getFileUrl(),
            delete t.dataset.srcAssetId) : console.warn("no asset found with id", e)
        }
        )),
        t.querySelectorAll("img[data-src-asset-name]").forEach((t=>{
            const e = t.dataset.srcAssetName
              , r = app.assets.find(e);
            r ? (t.src = r.getFileUrl(),
            delete t.dataset.srcAssetName) : console.warn("no asset found with name", e)
        }
        ))
    }
    static translateTextAssets(t) {
        (t = t || document).querySelectorAll("[data-translation-id]").forEach((t=>{
            const e = t.dataset.translationId
              , r = Grabbatron.pullEntry(e);
            r && (t.innerText = r)
        }
        ))
    }
    static getDisplayText(t) {
        return t.replace(/_/g, " ")
    }
    static secondsToTimeString(t) {
        let e = "";
        t < 0 && (e += "-"),
        t = Math.abs(t);
        const r = Math.floor(t / 86400);
        t -= 3600 * r * 24;
        const a = Math.floor(t / 3600);
        t -= 3600 * a;
        const s = Math.floor(t / 60);
        t -= 60 * s;
        return r && (e += `${r}d `),
        a && (e += `${a}h `),
        s && (e += `${s}m `),
        (t = Math.floor(t)) && (e += `${t}s`),
        e
    }
}
var ShowPathNodes = pc.createScript("showPathNodes");
ShowPathNodes.attributes.add("openMat", {
    type: "asset",
    assetType: "material"
}),
ShowPathNodes.attributes.add("roadSlowMat", {
    type: "asset",
    assetType: "material"
}),
ShowPathNodes.attributes.add("roadFastMat", {
    type: "asset",
    assetType: "material"
}),
ShowPathNodes.attributes.add("blockedMat", {
    type: "asset",
    assetType: "material"
}),
ShowPathNodes.RefreshNodes = function() {
    ShowPathNodes.instance.showing && ShowPathNodes.ShowNodes()
}
,
ShowPathNodes.ShowNodes = function() {
    ShowPathNodes.HideNodes(),
    ShowPathNodes.instance.showing = !0;
    for (let t in Game.town.pathingMap.nodes) {
        let e = new pc.Entity;
        e.addComponent("model", {
            type: "sphere"
        }),
        e.setLocalScale(.25, .25, .25),
        ShowPathNodes.instance.app.root.addChild(e);
        let o = Game.town.offsetX + Game.town.pathingMap.nodes[t].x - Game.town.tileSize / 2 + .25
          , a = Game.town.offsetZ + Game.town.pathingMap.nodes[t].y - Game.town.tileSize / 2 + .5;
        e.setPosition(o, .25, a);
        let s = Game.town.pathingMap.nodes[t].weight;
        1 == s && (e.model.material = ShowPathNodes.instance.roadFastMat.resource),
        5 == s && (e.model.material = ShowPathNodes.instance.roadSlowMat.resource),
        25 == s && (e.model.material = ShowPathNodes.instance.openMat.resource),
        1e3 == s && (e.model.material = ShowPathNodes.instance.blockedMat.resource),
        ShowPathNodes.instance.entityList.push(e)
    }
}
,
ShowPathNodes.HideNodes = function() {
    ShowPathNodes.instance.showing = !1;
    for (let t in ShowPathNodes.instance.entityList)
        ShowPathNodes.instance.entityList[t].destroy()
}
,
ShowPathNodes.prototype.initialize = function() {
    ShowPathNodes.instance = this,
    this.entityList = [],
    this.showing = !1
}
,
ShowPathNodes.prototype.test = function() {
    console.log("Testing")
}
;
var AnimatedTexture = pc.createScript("animatedTexture");
AnimatedTexture.attributes.add("materialAsset", {
    type: "asset",
    assetType: "material"
}),
AnimatedTexture.attributes.add("numFrames", {
    type: "number",
    default: 1,
    description: "Number of frames to play before looping"
}),
AnimatedTexture.attributes.add("startFrame", {
    type: "number",
    default: 0,
    description: "Frame to start animation from"
}),
AnimatedTexture.attributes.add("width", {
    type: "number",
    default: 1,
    description: "Number of frames wide"
}),
AnimatedTexture.attributes.add("height", {
    type: "number",
    default: 1,
    description: "Number of frames high"
}),
AnimatedTexture.attributes.add("frameRate", {
    type: "number",
    default: 1,
    description: "Playback frames per second"
}),
AnimatedTexture.prototype.initialize = function() {
    this.materialAsset && (this.material = this.materialAsset.resource),
    this.timer = 1 / this.frameRate,
    this.frame = this.startFrame,
    this.transform = new pc.Vec4,
    this.updateMaterial(this.frame)
}
,
AnimatedTexture.prototype.update = function(t) {
    this.timer -= t,
    this.timer < 0 && (this.frame++,
    this.frame >= this.numFrames + this.startFrame && (this.frame = this.startFrame),
    this.updateMaterial(this.frame),
    this.timer = 1 / this.frameRate)
}
,
AnimatedTexture.prototype.updateMaterial = function(t) {
    var e = 1 / this.width
      , a = 1 / this.height
      , r = t % this.width
      , i = Math.floor(t / this.width)
      , s = this.entity.model.meshInstances;
    this.transform.set(e, a, r * e, 1 - a - i * a),
    s[0].setParameter("texture_diffuseMapTransform", this.transform.data),
    s[0].setParameter("texture_emissiveMapTransform", this.transform.data),
    s[0].setParameter("texture_opacityMapTransform", this.transform.data)
}
;
var NukeEntityAfterTimer = pc.createScript("nukeEntityAfterTimer");
NukeEntityAfterTimer.attributes.add("NukeTimer", {
    type: "number",
    default: 2
}),
NukeEntityAfterTimer.prototype.initialize = function() {
    this.count = 0
}
,
NukeEntityAfterTimer.prototype.update = function(t) {
    this.count += t,
    this.count > this.NukeTimer && this.entity.destroy()
}
;
var CraftUi = pc.createScript("craftUi");
CraftUi.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
CraftUi.prototype.initialize = function() {
    CraftUi.instance = this,
    this.UI = new TS_CraftUI({
        name: "CraftUI.html",
        divClass: "container",
        fullScreenUI: !0
    }),
    this.app.on("CraftClicked", (e=>this.Open(e.x, e.z)))
}
,
CraftUi.prototype.Open = function(e, t) {
    this.UI.x = e,
    this.UI.z = t,
    this.UI.selectedObject = Game.town.GetObjectAt(e, t),
    this.UI.selectedObject && Game.objectData[this.UI.selectedObject.type].CanSelectCraft && this.UI.OpenUI()
}
;
class TS_CraftUI extends TS_UIBase {
    Initialize() {}
    OnOpen() {
        this.ReloadUI(),
        this.timer = setInterval((()=>this.UpdateUIElements()), 1e3)
    }
    OnClose() {
        this.timer && clearInterval(this.timer)
    }
    OnReload() {
        this.craftTarget = document.getElementById("craftui-target"),
        this.defaultBodyContent = this.craftTarget.innerHTML,
        this.UpdateUIElements()
    }
    OnInternetConnectionLost() {
        this.CloseUI()
    }
    UpdateUIElements() {
        this.craftTarget.innerHTML = this.defaultBodyContent;
        this.div.querySelector(".close-button").addEventListener("click", (()=>this.CloseUI()));
        const e = Game.objectData[this.selectedObject.type].Crafts.split(",");
        for (let t in e)
            this.AddCraftOption(e[t]);
        this.UpdateImagesAndTranslate()
    }
    AddCraftOption(e) {
        const t = document.getElementById("craft-template")
          , a = document.getElementById("req-template")
          , s = document.importNode(t.content, !0)
          , i = s.querySelector(".reqs")
          , r = s.querySelector(".name")
          , n = s.querySelector(".craft-icon")
          , c = s.querySelector(".time")
          , l = s.querySelector(".progress-container")
          , o = s.querySelector(".progress-value")
          , d = s.querySelector(".transparent-cell");
        let f = this.selectedObject.GetDisplayData();
        f.craft || (f.craft = "None");
        const p = "None" !== f.craft
          , h = f.craft == e;
        r.innerText = Grabbatron.pullEntry(Grabbatron.findId(e)),
        n.dataset.srcAssetName = UiTools.getIconFileName(e),
        c.innerText = Grabbatron.formatString("8088_0", [this.selectedObject.logicObject.GetCraftTime(e).toFixed()]),
        c.classList.add("time-" + e),
        l.style.visibility = "hidden";
        const m = this.selectedObject.logicObject.getCraftData(e);
        if (("none" != m.Req1 || "none" != m.Req2 || "none" != m.Req3) && !this.selectedObject.objData.CraftReqsMet || (i.style.visibility = "hidden"),
        !this.selectedObject.objData.CraftReqsMet) {
            const t = {};
            "none" != m.Req1 && (t[m.Req1] = m.Value1),
            "none" != m.Req2 && (t[m.Req2] = m.Value2),
            "none" != m.Req3 && (t[m.Req3] = m.Value3);
            const s = this.selectedObject.logicObject.GetProxifiedReqList();
            for (let r in t) {
                const n = document.importNode(a.content, !0)
                  , c = n.querySelector(".req")
                  , l = n.querySelector(".craft-icon");
                if (c.innerText = t[r] + " " + r.replace(/_/g, " "),
                l.dataset.srcAssetName = UiTools.getIconFileName(r),
                "Idle" !== f.state && f.craft == e) {
                    let e = s[r] ? s[r] : 0;
                    c.innerText = t[r] - e + "/" + t[r] + " " + r.replace(/_/g, " ")
                }
                c.classList.add("req-" + e + "-" + r),
                i.appendChild(n)
            }
        }
        const u = s.querySelector(".make-button");
        if (u.classList.add("make-button-" + e),
        d.classList.add("can-craft"),
        p)
            if (h) {
                if (s.querySelector(".make-button span").innerText = "Stop",
                s.getElementById("craftui-make-button").classList.add("stop-button"),
                u.addEventListener("click", (t=>{
                    API.event("craft_stop", {
                        craftType: e
                    }),
                    t.stopPropagation(),
                    this.selectedObject.entity.fire("CraftSelected", null),
                    this.CloseUI()
                }
                )),
                "Produce" == f.state && f.craft == e) {
                    l.style.visibility = "visible";
                    let t = this.selectedObject.logicObject.GetCraftTime();
                    var b = Math.round(f.craftTime / t * 100);
                    c.innerText = Math.round(t - f.craftTime) + " secs",
                    l.classList.add("progress-container-" + e),
                    o.style.width = b + "%",
                    o.classList.add("progress-value-" + e)
                }
            } else
                d.classList.remove("can-craft"),
                u.classList.add("disabled");
        else
            u.addEventListener("click", (t=>{
                API.event("craft_start", {
                    craftType: e
                }),
                t.stopPropagation(),
                this.selectedObject.entity.fire("CraftSelected", e),
                this.CloseUI()
            }
            ));
        this.craftTarget.appendChild(s)
    }
}
var GameOverPhase = pc.createScript("gameOverPhase");
GameOverPhase.attributes.add("PhaseManager", {
    type: "entity",
    title: "Phase Manager"
}),
GameOverPhase.prototype.onKeyDown = function(e) {
    PhaseManager.instance.change(PhaseManager.GameOverPhase)
}
,
GameOverPhase.prototype.initialize = function() {
    this.PhaseManager.script.phaseManager.onPhaseChanged(PhaseManager.GameOverPhase, (()=>{
        this.app.root.destroy(),
        this.app.fire("gameover");
        this.app.scenes.loadSceneHierarchy("883141.json", (function(e) {
            e ? console.error(e) : console.log("loading game over scene")
        }
        ))
    }
    ))
}
;
var ScrollingTexture = pc.createScript("scrollingTexture");
ScrollingTexture.attributes.add("materialAsset", {
    type: "asset"
}),
ScrollingTexture.attributes.add("speed", {
    type: "vec2"
}),
ScrollingTexture.tmp = new pc.Vec2,
ScrollingTexture.prototype.initialize = function() {
    this.materialAsset && (this.material = this.materialAsset.resource)
}
,
ScrollingTexture.prototype.update = function(e) {
    const {material: t, speed: r} = this
      , {diffuseMapOffset: a, normalMapOffset: i, update: l} = t
      , {x: s, y: c} = r
      , {tmp: p} = ScrollingTexture;
    p.set(s, c),
    p.scale(e),
    a && a.add(p),
    i && a.add(p),
    l && this.material.update()
}
;
var nextGameUI = pc.createScript("nextgameui");
nextGameUI.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
nextGameUI.prototype.initialize = function() {
    this.html.on("change", (()=>{
        this.load()
    }
    )),
    this.load(),
    this.app.on("nextgameui-enable", (()=>{
        this.div.style.display = "flex"
    }
    )),
    this.app.on("nextgameui-disable", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.fire("nextgameui-enable"),
    this.app.fire("leaderboardui-disable"),
    this.app.fire("hud-disable"),
    this.app.fire("objectmenu-disable"),
    AirDropUi.instance && AirDropUi.instance.UI.CloseUI(),
    this.app.on("RealtimeGameState", (e=>{
        "start" == e && location.reload()
    }
    ))
}
,
nextGameUI.prototype.updateTimeRemaining = function() {
    var e = new Date(this.nextGame.start);
    let t = Math.floor((e.getTime() - (new Date).getTime()) / 1e3);
    const i = Math.floor(t / 86400);
    t -= 3600 * i * 24;
    const n = Math.floor(t / 3600);
    t -= 3600 * n;
    const a = Math.floor(t / 60);
    if (t -= 60 * a,
    t = Math.floor(t),
    this.timeRemainingDays = this.div.querySelector(".time-remaining .amount .days"),
    this.timeRemainingHours = this.div.querySelector(".time-remaining .amount .hours"),
    this.timeRemainingMin = this.div.querySelector(".time-remaining .amount .min"),
    this.timeRemainingSec = this.div.querySelector(".time-remaining .amount .sec"),
    this.timeRemainingDays.innerText = i.toString().padStart(2, "0"),
    this.timeRemainingHours.innerText = n.toString().padStart(2, "0"),
    this.timeRemainingMin.innerText = a.toString().padStart(2, "0"),
    this.timeRemainingSec.innerText = t.toString().padStart(2, "0"),
    this.nextGame) {
        if (this.startDate = new Date(this.nextGame.start),
        Math.floor((this.startDate.getTime() - (new Date).getTime()) / 1e3) < 1)
            return this.timeRemainingDays.innerText = "0".padStart(2, "0"),
            this.timeRemainingHours.innerText = "0".padStart(2, "0"),
            this.timeRemainingMin.innerText = "0".padStart(2, "0"),
            void (this.timeRemainingSec.innerText = "0".padStart(2, "0"))
    }
}
,
nextGameUI.prototype.load = function() {
    this.div = document.createElement("div"),
    this.div.classList.add("nextgameui-container"),
    this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.div.addEventListener("wheel", (e=>e.stopPropagation())),
    this.div.innerHTML = this.html.resource || "";
    const e = document.body.querySelector(".container:not(#application-splash-wrapper)");
    e ? document.body.insertBefore(this.div, e) : document.body.appendChild(this.div),
    this.currentServerSpan = this.div.querySelector("#selectedServer"),
    this.liveGameServersSpan = this.div.querySelector("#liveGameServers"),
    this.changeServerBtn = this.div.querySelector("#changeServerBtn"),
    this.div.addEventListener("click", (e=>{
        ServerSelectUi.instance.UI.OpenUI()
    }
    )),
    this.currentServerSpan.innerText = "",
    this.liveGameServersSpan.innerText = "",
    API.getGames().then((e=>{
        let t = 0;
        for (let i of e)
            i.gameId == API.gameId && (this.currentServerSpan.innerText = i.name),
            i.active && t++;
        this.liveGameServersSpan.innerText = t
    }
    )),
    this.div.querySelector(".hud-leaderboard-button").addEventListener("click", (e=>{
        this.app.fire("leaderboardui-enable"),
        e.stopPropagation()
    }
    )),
    this.playerTemplate = document.getElementById("nextgameui-player-template"),
    this.playerTarget = document.getElementById("nextgameui-player-target"),
    this.profileButton = this.div.querySelector(".profile-button"),
    this.profileButton.style.display = "none",
    API.getNextGame().then((e=>{
        this.nextGame = e,
        this.updateTimeRemaining(),
        this.timer = setInterval((()=>this.updateTimeRemaining()), 1e3)
    }
    ));
    var t = 0;
    API.scoreLeaderboard().then((e=>{
        e.forEach((e=>{
            if (t < 3) {
                const i = document.importNode(this.playerTemplate.content, !0);
                i.querySelector(".rank").innerText = `${e.rank}`,
                i.querySelector(".name").innerText = e.name,
                i.querySelector(".score span").innerText = e.score.toLocaleString(),
                i.querySelector(".med-icon").classList.add(`nextgame-portrait-${e.userId}`),
                e.userId,
                Game.userId,
                API.getGameUser(e.userId).then((t=>{
                    t.avatarUrls && (delete document.querySelector(`.nextgame-portrait-${e.userId}`).dataset.srcAssetId,
                    document.querySelector(`.nextgame-portrait-${e.userId}`).src = t.avatarUrls[128])
                }
                )),
                this.playerTarget.appendChild(i),
                t++
            }
        }
        )),
        UiTools.updateImageAssets(this.div),
        UiTools.translateTextAssets(this.div)
    }
    ))
}
,
nextGameUI.prototype.log = window.logger && logger({
    context: "nextgameui",
    color: "green",
    timing: !0
});
var CssBackground = pc.createScript("cssBackground");
CssBackground.attributes.add("className", {
    type: "string",
    title: "CSS class to apply background to"
}),
CssBackground.attributes.add("background", {
    type: "asset",
    assetType: "texture",
    title: "Background image"
}),
CssBackground.prototype.initialize = function() {
    this.styleElement = document.createElement("style"),
    document.head.appendChild(this.styleElement),
    this.on("attr", (()=>this.generate())),
    this.generate()
}
,
CssBackground.prototype.generate = function() {
    this.className && this.background && (this.styleElement.innerHTML = `.${this.className} { background-image: url(${this.background.getFileUrl()}); }`)
}
;
var DooberSpawner = pc.createScript("dooberSpawner");
DooberSpawner.attributes.add("archHeight", {
    type: "number",
    default: 5
}),
DooberSpawner.attributes.add("doobsPerSecond", {
    type: "number",
    default: 2.5
}),
DooberSpawner.attributes.add("secondsToTarget", {
    type: "number",
    default: 1.5
}),
DooberSpawner.attributes.add("dooberSound", {
    type: "asset",
    assetType: "audio"
}),
DooberSpawner.attributes.add("dooberCurve", {
    type: "curve"
}),
DooberSpawner.prototype.initialize = function() {
    this.dooberList = [],
    this.dooberSpawnCount = 0,
    this.timer = 0,
    this.secondPerDoober = 1 / this.doobsPerSecond;
    let t = this.entity.getPosition();
    this.x = t.x,
    this.y = t.y + 2.5,
    this.z = t.z,
    this.dooberDestroyCount = 0,
    this.entity.sound.slot("doober").asset = this.dooberSound,
    this.started = !1,
    this.entity.once("DooberSetup", this.SetupDoobs.bind(this))
}
,
DooberSpawner.prototype.SetupDoobs = function(t, e, o, i, s) {
    this.spawnAmount = o,
    this.craft = e,
    this.targetObject = t,
    this.targetDest = t.entity.getPosition(),
    this.craftNode = t.entity.children.filter((t=>t.enabled)).reduce(((t,e)=>t || e.findByName("CraftNode")), null),
    this.started = !0,
    this.vfxOnDoobs = s,
    this.completeEvents = i
}
,
DooberSpawner.prototype.update = function(t) {
    if (this.started) {
        if (this.dooberSpawnCount < this.spawnAmount && (this.timer += t,
        this.timer >= this.secondPerDoober || 0 === this.dooberSpawnCount)) {
            let t = this.entity.getPosition();
            this.x = t.x,
            this.y = t.y + 2.5,
            this.z = t.z;
            let e = EntitySpawner.spawnObject(this.craft, this.x, this.y, this.z, Game.app.root);
            e || (this.dooberDestroyCount = this.testSpawnAmount),
            this.vfxOnDoobs || e.findByTag("craft-vfx").forEach((t=>t.enabled = !1));
            let o = this.dooberList.push({}) - 1;
            this.dooberList[o].doober = e,
            this.dooberList[o].t = 0,
            this.dooberList[o].active = !0,
            SETTINGS.soundEffectsEnabled && this.entity.sound.play("doober"),
            0 === this.dooberSpawnCount && this.entity.fire("SpawnedFirstDoober"),
            this.dooberSpawnCount++,
            this.entity.fire("SpawnedDoober"),
            this.dooberSpawnCount == this.spawnAmount && this.entity.fire("SpawnedLastDoober"),
            this.timer = 0
        }
        for (let e in this.dooberList) {
            if (!this.dooberList[e].doober)
                break;
            this.targetDest = this.craftNode ? this.craftNode.getPosition() : this.targetObject.entity.getPosition();
            let o = this.dooberList[e].doober
              , i = (new pc.Vec3).lerp(this.entity.getPosition(), this.targetDest, this.dooberList[e].t);
            this.dooberList[e].t += t / this.secondsToTarget,
            this.dooberList[e].t < 1 ? (i.y = 2.5 + this.dooberCurve.value(this.dooberList[e].t) * this.archHeight,
            o.setPosition(i)) : this.dooberList[e].active && (o.destroy(),
            this.dooberDestroyCount++,
            this.dooberList[e].active = !1,
            1 === this.dooberDestroyCount && (this.completeEvents && this.completeEvents.OnFirst && this.targetObject.entity.fire(this.completeEvents.OnFirst),
            this.entity.fire("FirstDooberComplete")),
            this.completeEvents && this.completeEvents.OnEach && this.targetObject.entity.fire(this.completeEvents.OnEach),
            this.entity.fire("DooberComplete"),
            this.dooberDestroyCount == this.spawnAmount && (this.completeEvents && this.completeEvents.OnLast && this.targetObject.entity.fire(this.completeEvents.OnLast),
            this.entity.fire("LastDooberComplete")))
        }
        this.dooberDestroyCount == this.spawnAmount && this.onComplete()
    }
}
,
DooberSpawner.prototype.onComplete = function() {
    this.entity.destroy()
}
;
class TS_WorldUnit {
    constructor(t) {
        this.tradeData = t;
        let a = "";
        t.isLeader ? a = "Gold" : t.userID != Game.userId && (a = "Grey"),
        this.entity = EntitySpawner.spawnObject(t.unitType + a, this.tradeData.path[0].x, 0, this.tradeData.path[0].z - 255, Game.app.root),
        this.entity || (this.entity = new pc.Entity);
        let e = this.entity.findByName("CraftNode");
        if (e && (this.craftEntity = EntitySpawner.spawnObject(t.craftType, e.getPosition().x, e.getPosition().y, e.getPosition().z, e),
        this.craftEntity)) {
            let t = e.getLocalScale();
            this.craftEntity.setLocalScale(t.x, t.y, t.z),
            this.craftEntity.findByTag("craft-vfx").forEach((t=>t.enabled = !1))
        }
        this.totalTime = this.tradeData.endTime - this.tradeData.startTime,
        this.complete = !1
    }
    Update() {
        if (this.complete)
            return null;
        let t = Date.now() - this.tradeData.startTime;
        return this.UpdatePosition(t),
        !0
    }
    UpdatePosition(t) {
        let a = t / this.totalTime;
        if (a = Math.min(1, a),
        this.craftEntity && a >= .5 && (this.craftEntity.destroy(),
        delete this.craftEntity),
        a >= 1)
            return void this.OnComplete();
        const e = this.tradeData.path.length - 1;
        let i = Math.floor(e * a)
          , s = e * a - i;
        if (!this.tradeData || !this.tradeData.path)
            return;
        const n = Math.min(i, e)
          , h = Math.min(i + 1, e);
        if (!this.tradeData.path[n] || !this.tradeData.path[h])
            return;
        let r = new pc.Vec3(this.tradeData.path[n].x,0,this.tradeData.path[n].z - 255)
          , o = new pc.Vec3(this.tradeData.path[h].x,0,this.tradeData.path[h].z - 255)
          , c = new pc.Vec3;
        c.lerp(r, o, s),
        this.entity.lookAt(c),
        this.entity.setPosition(c)
    }
    OnComplete() {
        this.complete = !0,
        this.entity.destroy()
    }
}
pc.extend(pc, function() {
    var TweenManager = function(t) {
        this._app = t,
        this._tweens = [],
        this._add = []
    };
    TweenManager.prototype = {
        add: function(t) {
            return this._add.push(t),
            t
        },
        update: function(t) {
            for (var i = 0, e = this._tweens.length; i < e; )
                this._tweens[i].update(t) ? i++ : (this._tweens.splice(i, 1),
                e--);
            this._add.length && (this._tweens = this._tweens.concat(this._add),
            this._add.length = 0)
        }
    };
    var Tween = function(t, i, e) {
        pc.events.attach(this),
        this.manager = i,
        e && (this.entity = null),
        this.time = 0,
        this.complete = !1,
        this.playing = !1,
        this.stopped = !0,
        this.pending = !1,
        this.target = t,
        this.duration = 0,
        this._currentDelay = 0,
        this.timeScale = 1,
        this._reverse = !1,
        this._delay = 0,
        this._yoyo = !1,
        this._count = 0,
        this._numRepeats = 0,
        this._repeatDelay = 0,
        this._from = !1,
        this._slerp = !1,
        this._fromQuat = new pc.Quat,
        this._toQuat = new pc.Quat,
        this._quat = new pc.Quat,
        this.easing = pc.EASE_LINEAR,
        this._sv = {},
        this._ev = {}
    };
    Tween.prototype = {
        to: function(t, i, e, s, n, r) {
            return t instanceof pc.Vec3 ? this._properties = {
                x: t.x,
                y: t.y,
                z: t.z
            } : t instanceof pc.Color ? (this._properties = {
                r: t.r,
                g: t.g,
                b: t.b
            },
            void 0 !== t.a && (this._properties.a = t.a)) : this._properties = t,
            this.duration = i,
            e && (this.easing = e),
            s && this.delay(s),
            n && this.repeat(n),
            r && this.yoyo(r),
            this
        },
        from: function(t, i, e, s, n, r) {
            return t instanceof pc.Vec3 ? this._properties = {
                x: t.x,
                y: t.y,
                z: t.z
            } : t instanceof pc.Color ? (this._properties = {
                r: t.r,
                g: t.g,
                b: t.b
            },
            void 0 !== t.a && (this._properties.a = t.a)) : this._properties = t,
            this.duration = i,
            e && (this.easing = e),
            s && this.delay(s),
            n && this.repeat(n),
            r && this.yoyo(r),
            this._from = !0,
            this
        },
        rotate: function(t, i, e, s, n, r) {
            return t instanceof pc.Quat ? this._properties = {
                x: t.x,
                y: t.y,
                z: t.z,
                w: t.w
            } : t instanceof pc.Vec3 ? this._properties = {
                x: t.x,
                y: t.y,
                z: t.z
            } : t instanceof pc.Color ? (this._properties = {
                r: t.r,
                g: t.g,
                b: t.b
            },
            void 0 !== t.a && (this._properties.a = t.a)) : this._properties = t,
            this.duration = i,
            e && (this.easing = e),
            s && this.delay(s),
            n && this.repeat(n),
            r && this.yoyo(r),
            this._slerp = !0,
            this
        },
        start: function() {
            if (this.playing = !0,
            this.complete = !1,
            this.stopped = !1,
            this._count = 0,
            this.pending = this._delay > 0,
            this._reverse && !this.pending ? this.time = this.duration : this.time = 0,
            this._from) {
                for (var t in this._properties)
                    this._sv[t] = this._properties[t],
                    this._ev[t] = this.target[t];
                if (this._slerp) {
                    this._toQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z);
                    var i = void 0 !== this._properties.x ? this._properties.x : this.target.x
                      , e = void 0 !== this._properties.y ? this._properties.y : this.target.y
                      , s = void 0 !== this._properties.z ? this._properties.z : this.target.z;
                    this._fromQuat.setFromEulerAngles(i, e, s)
                }
            } else {
                for (var t in this._properties)
                    this._sv[t] = this.target[t],
                    this._ev[t] = this._properties[t];
                if (this._slerp) {
                    this._fromQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z);
                    i = void 0 !== this._properties.x ? this._properties.x : this.target.x,
                    e = void 0 !== this._properties.y ? this._properties.y : this.target.y,
                    s = void 0 !== this._properties.z ? this._properties.z : this.target.z;
                    this._toQuat.setFromEulerAngles(i, e, s)
                }
            }
            return this._currentDelay = this._delay,
            this.manager.add(this),
            this
        },
        pause: function() {
            this.playing = !1
        },
        resume: function() {
            this.playing = !0
        },
        stop: function() {
            this.playing = !1,
            this.stopped = !0
        },
        delay: function(t) {
            return this._delay = t,
            this.pending = !0,
            this
        },
        repeat: function(t, i) {
            return this._count = 0,
            this._numRepeats = t,
            this._repeatDelay = i || 0,
            this
        },
        loop: function(t) {
            return t ? (this._count = 0,
            this._numRepeats = 1 / 0) : this._numRepeats = 0,
            this
        },
        yoyo: function(t) {
            return this._yoyo = t,
            this
        },
        reverse: function() {
            return this._reverse = !this._reverse,
            this
        },
        chain: function() {
            for (var t = arguments.length; t--; )
                t > 0 ? arguments[t - 1]._chained = arguments[t] : this._chained = arguments[t];
            return this
        },
        update: function(t) {
            if (this.stopped)
                return !1;
            if (!this.playing)
                return !0;
            if (!this._reverse || this.pending ? this.time += t * this.timeScale : this.time -= t * this.timeScale,
            this.pending) {
                if (!(this.time > this._currentDelay))
                    return !0;
                this._reverse ? this.time = this.duration - (this.time - this._currentDelay) : this.time = this.time - this._currentDelay,
                this.pending = !1
            }
            var i = 0;
            (!this._reverse && this.time > this.duration || this._reverse && this.time < 0) && (this._count++,
            this.complete = !0,
            this.playing = !1,
            this._reverse ? (i = this.duration - this.time,
            this.time = 0) : (i = this.time - this.duration,
            this.time = this.duration));
            var e, s, n = this.time / this.duration, r = this.easing(n);
            for (var h in this._properties)
                e = this._sv[h],
                s = this._ev[h],
                this.target[h] = e + (s - e) * r;
            if (this._slerp && this._quat.slerp(this._fromQuat, this._toQuat, r),
            this.entity && (this.entity._dirtify(!0),
            this.element && this.entity.element && (this.entity.element[this.element] = this.target),
            this._slerp && this.entity.setLocalRotation(this._quat)),
            this.fire("update", t),
            this.complete) {
                var a = this._repeat(i);
                return a ? this.fire("loop") : (this.fire("complete", i),
                this._chained && this._chained.start()),
                a
            }
            return !0
        },
        _repeat: function(t) {
            if (this._count < this._numRepeats) {
                if (this._reverse ? this.time = this.duration - t : this.time = t,
                this.complete = !1,
                this.playing = !0,
                this._currentDelay = this._repeatDelay,
                this.pending = !0,
                this._yoyo) {
                    for (var i in this._properties)
                        tmp = this._sv[i],
                        this._sv[i] = this._ev[i],
                        this._ev[i] = tmp;
                    this._slerp && (this._quat.copy(this._fromQuat),
                    this._fromQuat.copy(this._toQuat),
                    this._toQuat.copy(this._quat))
                }
                return !0
            }
            return !1
        }
    };
    var BounceIn = function(t) {
        return 1 - BounceOut(1 - t)
    }
      , BounceOut = function(t) {
        return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
    };
    return {
        TweenManager: TweenManager,
        Tween: Tween,
        Linear: function(t) {
            return t
        },
        QuadraticIn: function(t) {
            return t * t
        },
        QuadraticOut: function(t) {
            return t * (2 - t)
        },
        QuadraticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t : -.5 * (--t * (t - 2) - 1)
        },
        CubicIn: function(t) {
            return t * t * t
        },
        CubicOut: function(t) {
            return --t * t * t + 1
        },
        CubicInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t : .5 * ((t -= 2) * t * t + 2)
        },
        QuarticIn: function(t) {
            return t * t * t * t
        },
        QuarticOut: function(t) {
            return 1 - --t * t * t * t
        },
        QuarticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t * t : -.5 * ((t -= 2) * t * t * t - 2)
        },
        QuinticIn: function(t) {
            return t * t * t * t * t
        },
        QuinticOut: function(t) {
            return --t * t * t * t * t + 1
        },
        QuinticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t * t * t : .5 * ((t -= 2) * t * t * t * t + 2)
        },
        SineIn: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : 1 - Math.cos(t * Math.PI / 2)
        },
        SineOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : Math.sin(t * Math.PI / 2)
        },
        SineInOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : .5 * (1 - Math.cos(Math.PI * t))
        },
        ExponentialIn: function(t) {
            return 0 === t ? 0 : Math.pow(1024, t - 1)
        },
        ExponentialOut: function(t) {
            return 1 === t ? 1 : 1 - Math.pow(2, -10 * t)
        },
        ExponentialInOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : (t *= 2) < 1 ? .5 * Math.pow(1024, t - 1) : .5 * (2 - Math.pow(2, -10 * (t - 1)))
        },
        CircularIn: function(t) {
            return 1 - Math.sqrt(1 - t * t)
        },
        CircularOut: function(t) {
            return Math.sqrt(1 - --t * t)
        },
        CircularInOut: function(t) {
            return (t *= 2) < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
        },
        BackIn: function(t) {
            var i = 1.70158;
            return t * t * ((i + 1) * t - i)
        },
        BackOut: function(t) {
            var i = 1.70158;
            return --t * t * ((i + 1) * t + i) + 1
        },
        BackInOut: function(t) {
            var i = 2.5949095;
            return (t *= 2) < 1 ? t * t * ((i + 1) * t - i) * .5 : .5 * ((t -= 2) * t * ((i + 1) * t + i) + 2)
        },
        BounceIn: BounceIn,
        BounceOut: BounceOut,
        BounceInOut: function(t) {
            return t < .5 ? .5 * BounceIn(2 * t) : .5 * BounceOut(2 * t - 1) + .5
        },
        ElasticIn: function(t) {
            var i, e = .1;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = .4 * Math.asin(1 / e) / (2 * Math.PI),
            -e * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / .4))
        },
        ElasticOut: function(t) {
            var i, e = .1;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = .4 * Math.asin(1 / e) / (2 * Math.PI),
            e * Math.pow(2, -10 * t) * Math.sin((t - i) * (2 * Math.PI) / .4) + 1)
        },
        ElasticInOut: function(t) {
            var i, e = .1, s = .4;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = s * Math.asin(1 / e) / (2 * Math.PI),
            (t *= 2) < 1 ? e * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / s) * -.5 : e * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / s) * .5 + 1)
        }
    }
}()),
function() {
    var t = pc.Application.getApplication();
    t && (t._tweenManager = new pc.TweenManager(t),
    t.on("update", (function(i) {
        t._tweenManager.update(i)
    }
    )),
    pc.Application.prototype.tween = function(t) {
        return new pc.Tween(t,this._tweenManager)
    }
    ,
    pc.Entity.prototype.tween = function(t, i) {
        var e = this._app.tween(t);
        return e.entity = this,
        this.on("destroy", (function() {
            e.stop()
        }
        )),
        i && i.element && (e.element = element),
        e
    }
    )
}();
var Trophy = pc.createScript("Trophy");
Trophy.prototype.initialize = function() {
    this.leader = null,
    API.scoreLeaderboard(0, 0).then((e=>{
        this.leaderId = e[0] && e[0].userId,
        this.leaderId && API.getGameUser(this.leaderId).then((e=>{
            this.leader = e,
            this.tweenToLeader()
        }
        ))
    }
    )),
    this.app.on("RealtimeGameLeader", (e=>{
        this.leader && this.leader.userId !== e.userId && (this.leader = e,
        this.tweenToLeader())
    }
    ))
}
,
Trophy.prototype.tweenToLeader = function() {
    var e = Game.world.GetWorldPositionFromMapIndex(this.leader.position.x, this.leader.position.y);
    this.entity.tween(this.entity.getLocalPosition()).to(e, 10, pc.SineInOut).start()
}
;
pc.extend(pc, function() {
    var TweenManager = function(t) {
        this._app = t,
        this._tweens = [],
        this._add = []
    };
    TweenManager.prototype = {
        add: function(t) {
            return this._add.push(t),
            t
        },
        update: function(t) {
            for (var i = 0, e = this._tweens.length; i < e; )
                this._tweens[i].update(t) ? i++ : (this._tweens.splice(i, 1),
                e--);
            this._add.length && (this._tweens = this._tweens.concat(this._add),
            this._add.length = 0)
        }
    };
    var Tween = function(t, i, e) {
        pc.events.attach(this),
        this.manager = i,
        e && (this.entity = null),
        this.time = 0,
        this.complete = !1,
        this.playing = !1,
        this.stopped = !0,
        this.pending = !1,
        this.target = t,
        this.duration = 0,
        this._currentDelay = 0,
        this.timeScale = 1,
        this._reverse = !1,
        this._delay = 0,
        this._yoyo = !1,
        this._count = 0,
        this._numRepeats = 0,
        this._repeatDelay = 0,
        this._from = !1,
        this._slerp = !1,
        this._fromQuat = new pc.Quat,
        this._toQuat = new pc.Quat,
        this._quat = new pc.Quat,
        this.easing = pc.Linear,
        this._sv = {},
        this._ev = {}
    }
      , _parseProperties = function(t) {
        var i;
        return t instanceof pc.Vec2 ? i = {
            x: t.x,
            y: t.y
        } : t instanceof pc.Vec3 ? i = {
            x: t.x,
            y: t.y,
            z: t.z
        } : t instanceof pc.Vec4 || t instanceof pc.Quat ? i = {
            x: t.x,
            y: t.y,
            z: t.z,
            w: t.w
        } : t instanceof pc.Color ? (i = {
            r: t.r,
            g: t.g,
            b: t.b
        },
        void 0 !== t.a && (i.a = t.a)) : i = t,
        i
    };
    Tween.prototype = {
        to: function(t, i, e, n, s, r) {
            return this._properties = _parseProperties(t),
            this.duration = i,
            e && (this.easing = e),
            n && this.delay(n),
            s && this.repeat(s),
            r && this.yoyo(r),
            this
        },
        from: function(t, i, e, n, s, r) {
            return this._properties = _parseProperties(t),
            this.duration = i,
            e && (this.easing = e),
            n && this.delay(n),
            s && this.repeat(s),
            r && this.yoyo(r),
            this._from = !0,
            this
        },
        rotate: function(t, i, e, n, s, r) {
            return this._properties = _parseProperties(t),
            this.duration = i,
            e && (this.easing = e),
            n && this.delay(n),
            s && this.repeat(s),
            r && this.yoyo(r),
            this._slerp = !0,
            this
        },
        start: function() {
            var t, i, e, n;
            if (this.playing = !0,
            this.complete = !1,
            this.stopped = !1,
            this._count = 0,
            this.pending = this._delay > 0,
            this._reverse && !this.pending ? this.time = this.duration : this.time = 0,
            this._from) {
                for (t in this._properties)
                    this._properties.hasOwnProperty(t) && (this._sv[t] = this._properties[t],
                    this._ev[t] = this.target[t]);
                this._slerp && (this._toQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z),
                i = void 0 !== this._properties.x ? this._properties.x : this.target.x,
                e = void 0 !== this._properties.y ? this._properties.y : this.target.y,
                n = void 0 !== this._properties.z ? this._properties.z : this.target.z,
                this._fromQuat.setFromEulerAngles(i, e, n))
            } else {
                for (t in this._properties)
                    this._properties.hasOwnProperty(t) && (this._sv[t] = this.target[t],
                    this._ev[t] = this._properties[t]);
                this._slerp && (this._fromQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z),
                i = void 0 !== this._properties.x ? this._properties.x : this.target.x,
                e = void 0 !== this._properties.y ? this._properties.y : this.target.y,
                n = void 0 !== this._properties.z ? this._properties.z : this.target.z,
                this._toQuat.setFromEulerAngles(i, e, n))
            }
            return this._currentDelay = this._delay,
            this.manager.add(this),
            this
        },
        pause: function() {
            this.playing = !1
        },
        resume: function() {
            this.playing = !0
        },
        stop: function() {
            this.playing = !1,
            this.stopped = !0
        },
        delay: function(t) {
            return this._delay = t,
            this.pending = !0,
            this
        },
        repeat: function(t, i) {
            return this._count = 0,
            this._numRepeats = t,
            this._repeatDelay = i || 0,
            this
        },
        loop: function(t) {
            return t ? (this._count = 0,
            this._numRepeats = 1 / 0) : this._numRepeats = 0,
            this
        },
        yoyo: function(t) {
            return this._yoyo = t,
            this
        },
        reverse: function() {
            return this._reverse = !this._reverse,
            this
        },
        chain: function() {
            for (var t = arguments.length; t--; )
                t > 0 ? arguments[t - 1]._chained = arguments[t] : this._chained = arguments[t];
            return this
        },
        update: function(t) {
            if (this.stopped)
                return !1;
            if (!this.playing)
                return !0;
            if (!this._reverse || this.pending ? this.time += t * this.timeScale : this.time -= t * this.timeScale,
            this.pending) {
                if (!(this.time > this._currentDelay))
                    return !0;
                this._reverse ? this.time = this.duration - (this.time - this._currentDelay) : this.time = this.time - this._currentDelay,
                this.pending = !1
            }
            var i = 0;
            (!this._reverse && this.time > this.duration || this._reverse && this.time < 0) && (this._count++,
            this.complete = !0,
            this.playing = !1,
            this._reverse ? (i = this.duration - this.time,
            this.time = 0) : (i = this.time - this.duration,
            this.time = this.duration));
            var e, n, s = this.time / this.duration, r = this.easing(s);
            for (var h in this._properties)
                this._properties.hasOwnProperty(h) && (e = this._sv[h],
                n = this._ev[h],
                this.target[h] = e + (n - e) * r);
            if (this._slerp && this._quat.slerp(this._fromQuat, this._toQuat, r),
            this.entity && (this.entity._dirtifyLocal(),
            this.element && this.entity.element && (this.entity.element[this.element] = this.target),
            this._slerp && this.entity.setLocalRotation(this._quat)),
            this.fire("update", t),
            this.complete) {
                var a = this._repeat(i);
                return a ? this.fire("loop") : (this.fire("complete", i),
                this.entity && this.entity.off("destroy", this.stop, this),
                this._chained && this._chained.start()),
                a
            }
            return !0
        },
        _repeat: function(t) {
            if (this._count < this._numRepeats) {
                if (this._reverse ? this.time = this.duration - t : this.time = t,
                this.complete = !1,
                this.playing = !0,
                this._currentDelay = this._repeatDelay,
                this.pending = !0,
                this._yoyo) {
                    for (var i in this._properties) {
                        var e = this._sv[i];
                        this._sv[i] = this._ev[i],
                        this._ev[i] = e
                    }
                    this._slerp && (this._quat.copy(this._fromQuat),
                    this._fromQuat.copy(this._toQuat),
                    this._toQuat.copy(this._quat))
                }
                return !0
            }
            return !1
        }
    };
    var BounceIn = function(t) {
        return 1 - BounceOut(1 - t)
    }
      , BounceOut = function(t) {
        return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
    };
    return {
        TweenManager: TweenManager,
        Tween: Tween,
        Linear: function(t) {
            return t
        },
        QuadraticIn: function(t) {
            return t * t
        },
        QuadraticOut: function(t) {
            return t * (2 - t)
        },
        QuadraticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t : -.5 * (--t * (t - 2) - 1)
        },
        CubicIn: function(t) {
            return t * t * t
        },
        CubicOut: function(t) {
            return --t * t * t + 1
        },
        CubicInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t : .5 * ((t -= 2) * t * t + 2)
        },
        QuarticIn: function(t) {
            return t * t * t * t
        },
        QuarticOut: function(t) {
            return 1 - --t * t * t * t
        },
        QuarticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t * t : -.5 * ((t -= 2) * t * t * t - 2)
        },
        QuinticIn: function(t) {
            return t * t * t * t * t
        },
        QuinticOut: function(t) {
            return --t * t * t * t * t + 1
        },
        QuinticInOut: function(t) {
            return (t *= 2) < 1 ? .5 * t * t * t * t * t : .5 * ((t -= 2) * t * t * t * t + 2)
        },
        SineIn: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : 1 - Math.cos(t * Math.PI / 2)
        },
        SineOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : Math.sin(t * Math.PI / 2)
        },
        SineInOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : .5 * (1 - Math.cos(Math.PI * t))
        },
        ExponentialIn: function(t) {
            return 0 === t ? 0 : Math.pow(1024, t - 1)
        },
        ExponentialOut: function(t) {
            return 1 === t ? 1 : 1 - Math.pow(2, -10 * t)
        },
        ExponentialInOut: function(t) {
            return 0 === t ? 0 : 1 === t ? 1 : (t *= 2) < 1 ? .5 * Math.pow(1024, t - 1) : .5 * (2 - Math.pow(2, -10 * (t - 1)))
        },
        CircularIn: function(t) {
            return 1 - Math.sqrt(1 - t * t)
        },
        CircularOut: function(t) {
            return Math.sqrt(1 - --t * t)
        },
        CircularInOut: function(t) {
            return (t *= 2) < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
        },
        BackIn: function(t) {
            var i = 1.70158;
            return t * t * ((i + 1) * t - i)
        },
        BackOut: function(t) {
            var i = 1.70158;
            return --t * t * ((i + 1) * t + i) + 1
        },
        BackInOut: function(t) {
            var i = 2.5949095;
            return (t *= 2) < 1 ? t * t * ((i + 1) * t - i) * .5 : .5 * ((t -= 2) * t * ((i + 1) * t + i) + 2)
        },
        BounceIn: BounceIn,
        BounceOut: BounceOut,
        BounceInOut: function(t) {
            return t < .5 ? .5 * BounceIn(2 * t) : .5 * BounceOut(2 * t - 1) + .5
        },
        ElasticIn: function(t) {
            var i, e = .1;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = .4 * Math.asin(1 / e) / (2 * Math.PI),
            -e * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / .4))
        },
        ElasticOut: function(t) {
            var i, e = .1;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = .4 * Math.asin(1 / e) / (2 * Math.PI),
            e * Math.pow(2, -10 * t) * Math.sin((t - i) * (2 * Math.PI) / .4) + 1)
        },
        ElasticInOut: function(t) {
            var i, e = .1, n = .4;
            return 0 === t ? 0 : 1 === t ? 1 : (!e || e < 1 ? (e = 1,
            i = .1) : i = n * Math.asin(1 / e) / (2 * Math.PI),
            (t *= 2) < 1 ? e * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / n) * -.5 : e * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - i) * (2 * Math.PI) / n) * .5 + 1)
        }
    }
}()),
function() {
    pc.Application.prototype.addTweenManager = function() {
        this._tweenManager = new pc.TweenManager(this),
        this.on("update", (function(t) {
            this._tweenManager.update(t)
        }
        ))
    }
    ,
    pc.Application.prototype.tween = function(t) {
        return new pc.Tween(t,this._tweenManager)
    }
    ,
    pc.Entity.prototype.tween = function(t, i) {
        var e = this._app.tween(t);
        return e.entity = this,
        this.once("destroy", e.stop, e),
        i && i.element && (e.element = i.element),
        e
    }
    ;
    var t = pc.Application.getApplication();
    t && t.addTweenManager()
}();
var objectui = pc.createScript("objectui");
objectui.attributes.add("html", {
    type: "asset",
    assetType: "html"
});
var ObjectMenu = {};
objectui.prototype.initialize = function() {
    ObjectMenu.instance = this,
    PhaseManager.instance.onPhaseChanged(PhaseManager.GameOver, (()=>{
        this.app.fire("objectmenu-disable")
    }
    )),
    this.div = document.createElement("div"),
    this.div.classList.add("object-menu-container"),
    this.div.style.pointerEvents = "none",
    this.app.on("TownTapped", this.TownTouched.bind(this)),
    this.app.on("TownObjectAdded", ((t,e)=>{
        this.ObjectPlaced(t, e)
    }
    )),
    this.app.on("PlayerConfirmRemove", ((t,e)=>this.playerConfirmRemove(t, e))),
    this.app.on("WorldTappedSelf", this.WorldTappedSelf.bind(this)),
    this.app.on("WorldTappedOther", this.DisableAllOptions.bind(this)),
    this.app.on("SetWorldView", (()=>this.DisableAllOptions.bind(this))),
    this.app.on("SetTownView", (()=>{
        this.reload()
    }
    )),
    Game.app.on("TradeComplete", (()=>{
        this.reload()
    }
    )),
    this.app.on("objectmenu-enable", (()=>{
        this.reload(),
        this.div.style.display = "flex"
    }
    )),
    this.app.on("gameover", (()=>{
        this.reload = ()=>{}
    }
    )),
    this.app.on("objectmenu-disable", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.on("SellClicked", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.on("CraftClicked", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.on("JimmyUIClicked", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.on("SellStarted", (()=>{
        this.reload()
    }
    )),
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    Game.app.on("RealtimeConveyorState", (t=>{
        this.RTUpdateConveyors(t)
    }
    )),
    this.reload()
}
,
objectui.prototype.RTUpdateConveyors = function(t) {
    this.reload()
}
,
objectui.prototype.reload = function() {
    this.log("reloading"),
    this.div.innerHTML = this.html.resource,
    document.body.appendChild(this.div),
    this.craftButton = this.div.querySelector(".menu-craft"),
    this.sellButton = this.div.querySelector(".menu-sell"),
    this.removeButton = this.div.querySelector(".menu-remove"),
    this.returnButton = this.div.querySelector(".menu-inventory"),
    this.jimmyButton = this.div.querySelector(".menu-jimmy"),
    this.jimmyButtonCancel = this.div.querySelector(".menu-jimmy-cancel"),
    this.rotateButton = this.div.querySelector(".menu-rotate"),
    this.npcPortraitDiv = this.div.querySelector(".npc"),
    this.removeButtonAmountText = this.removeButton.querySelector(".remove-amount span"),
    this.nukeTownButton = this.div.querySelector(".menu-nuketown"),
    this.flushButton = this.div.querySelector(".menu-flush"),
    this.upgradeButton = this.div.querySelector(".menu-upgrade"),
    this.upgradeButtonAmountText = this.div.querySelector(".upgrade-amount span"),
    this.treeProgressButton = this.div.querySelector(".menu-progress"),
    this.returnTreeButton = this.div.querySelector(".menu-returntree"),
    this.completeBuildButton = this.div.querySelector(".menu-complete"),
    this.cancelBuildButton = this.div.querySelector(".menu-cancel"),
    this.cancelBuildButton.addEventListener("click", (t=>this.app.fire("ConfirmRemove", this.x, this.z))),
    this.cancelButtonAmountText = this.cancelBuildButton.querySelector(".remove-amount span"),
    this._ClearClickThrough(this.completeBuildButton),
    this._ClearClickThrough(this.cancelBuildButton),
    this._ClearClickThrough(this.removeButton),
    this.removeButton.addEventListener("click", (t=>this.app.fire("ConfirmRemove", this.x, this.z))),
    this._ClearClickThrough(this.returnButton),
    this.returnButton.addEventListener("click", (t=>this.app.fire("ConfirmReturn", this.x, this.z))),
    this._ClearClickThrough(this.sellButton),
    this.sellButton.addEventListener("click", (t=>this.OnClick("sell", t))),
    this._ClearClickThrough(this.craftButton),
    this.craftButton.addEventListener("click", (t=>this.OnClick("craft", t))),
    this._ClearClickThrough(this.rotateButton),
    this.rotateButton.addEventListener("click", (t=>this.OnClick("rotate", t))),
    this._ClearClickThrough(this.jimmyButton),
    this.jimmyButton.addEventListener("click", (t=>this.OnClick("jimmy", t))),
    this._ClearClickThrough(this.jimmyButtonCancel),
    this.jimmyButtonCancel.addEventListener("click", (t=>this.OnClick("jimmyCancel", t))),
    this._ClearClickThrough(this.nukeTownButton),
    this.nukeTownButton.addEventListener("click", (t=>this.app.fire("NukeTownTapped"))),
    this._ClearClickThrough(this.flushButton),
    this.flushButton.addEventListener("click", (t=>this.app.fire("ConfirmFlush", this.x, this.z))),
    this._ClearClickThrough(this.upgradeButton),
    this.upgradeButton.addEventListener("click", (t=>{
        UpgradeUi.instance.UI.Open(Game.town.GetObjectAt(this.x, this.z))
    }
    )),
    this._ClearClickThrough(this.treeProgressButton),
    this.treeProgressButton.addEventListener("click", (t=>{
        HOLIDAY_TREE_QUEST.completed ? CryptoRewardUI.vm.open() : HolidayTreeUI.open(this.x, this.z, !0)
    }
    )),
    this._ClearClickThrough(this.returnTreeButton),
    this.returnTreeButton.addEventListener("click", (t=>{
        Game.town.GetObjectAt(this.x, this.z) && (Game.town.RemoveObject(this.x, this.z, !1),
        LEDGER.sellObject(this.x, this.z))
    }
    )),
    this.DisableAllOptions(),
    Game.IsTownViewActive() && this.EnableTownOptions(),
    this.div.addEventListener("animationend", (()=>this.app.fire("ObjectMenu-Loaded")))
}
,
objectui.prototype._ClearClickThrough = function(t) {
    t.addEventListener("mousedown", (t=>t.stopPropagation())),
    t.addEventListener("mouseup", (t=>t.stopPropagation())),
    t.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    })
}
,
objectui.prototype.playerConfirmRemove = function(t, e) {
    if (!Game || !Game.town)
        return;
    const i = Game.town.GetObjectType(t, e);
    if (!i)
        return;
    const o = Game.objectData[i];
    if (!o)
        return;
    const s = o.DestroyCost;
    Game.currency >= -s ? (Game.removeObject(t, e),
    this.ObjectRemoved()) : console.log("not enough currency to remove")
}
,
objectui.prototype.DisableAllOptions = function() {
    this.craftButton.style.display = "none",
    this.sellButton.style.display = "none",
    this.removeButton.style.display = "none",
    this.returnButton.style.display = "none",
    this.rotateButton.style.display = "none",
    this.jimmyButton.style.display = "none",
    this.jimmyButtonCancel.style.display = "none",
    this.npcPortraitDiv.style.display = "none",
    this.nukeTownButton.style.display = "none",
    this.completeBuildButton.style.display = "none",
    this.cancelBuildButton.style.display = "none",
    this.flushButton.style.display = "none",
    this.upgradeButton.style.display = "none",
    this.treeProgressButton.style.display = "none",
    this.returnTreeButton.style.display = "none"
}
,
objectui.prototype.OnClick = function(t, e) {
    if (e.stopPropagation(),
    Game.internetConnected) {
        if ("sell" === t && this.app.fire("SellClicked", this.townPosition),
        "buy" === t && this.app.fire("BuyClicked", this.townPosition),
        "craft" === t && this.app.fire("CraftClicked", this.townPosition),
        "rotate" === t && (Game.town.RotateObject(this.townPosition.x, this.townPosition.z),
        this.app.fire("RotateObjectClicked", this.townPosition.x, this.townPosition.z)),
        "jimmy" === t && this.app.fire("JimmyUIClicked", this.townPosition),
        "jimmyCancel" === t) {
            Game.town.GetObjectAt(this.x, this.z),
            Game.town.conveyors.outgoing.find((t=>t.x == this.x / 5 && t.z == this.z / 5));
            if (0 === this.x || 75 === this.x)
                for (let t = 0; t <= 15; t++) {
                    let e = Game.town.conveyors.outgoing.find((e=>e.x == this.x / 5 && t == e.z));
                    e && (API.rejectConveyor(e.conveyorId),
                    e.state = "rejected")
                }
            else if (0 === this.z || 75 === this.z)
                for (let t = 0; t <= 15; t++) {
                    let e = Game.town.conveyors.outgoing.find((e=>t == e.x && e.z == this.z / 5));
                    e && (API.rejectConveyor(e.conveyorId),
                    e.state = "rejected")
                }
            this.reload()
        }
        "flush" === t && this.app.fire("StorageFlushed", this.townPosition)
    }
}
,
objectui.prototype.EnableTownOptions = function() {
    if (!this.objectType || !this.townPosition)
        return;
    this.x = this.townPosition.x,
    this.z = this.townPosition.z;
    var t = Game.objectData[this.objectType];
    if (console.log("objectData " + t),
    !t)
        return void console.log(`Can not find object data for type ${this.objectType}`);
    const e = TS_ObjectLogic.GetLogicType(this.objectType);
    if (console.log(e),
    "None" != t.UnitType) {
        const e = new Image;
        let i = SKINS[this.objectType] ? `-${SKINS[this.objectType]}` : "";
        e.dataset.srcAssetName = UiTools.getIconFileName(t.UnitType + i),
        this.div.querySelector(".npc").innerHTML = "",
        this.div.querySelector(".npc").appendChild(e),
        this.npcPortraitDiv.style.visibility = "visible",
        this.npcPortraitDiv.style.display = ""
    }
    let i = !1
      , o = !1;
    if ("Neighbor_Delivery" == t.Name) {
        Game.town.GetObjectAt(this.x, this.z).GetData();
        let t = Game.town.conveyors.outgoing.find((t=>t.x == this.x / 5 && t.z == this.z / 5));
        t && ("accepted" == t.state && (i = !0,
        o = !1),
        "pending" == t.state && (i = !1,
        o = !0))
    } else if ("Trade" == t.Class) {
        let t = !0;
        if ("number" == typeof this.x && "number" == typeof this.z) {
            Game.town.GetActiveTradeData({
                x: this.x,
                z: this.z
            }) && (t = !1)
        }
        this.sellButton.style.display = t ? "" : "none"
    }
    if ("None" !== t.StorageType && "ActiveCrafter" !== t.StorageType && (this.flushButton.style.display = "flex"),
    "Construction_Site" == t.Name) {
        let t = Game.town.GetObjectAt(this.x, this.z).GetData();
        if ("Complete" != t.state) {
            this.cancelBuildButton.style.display = "";
            let e = Game.objectData[t.type].BuildCost;
            this.cancelButtonAmountText.innerText = Math.abs(e).toLocaleString()
        }
        return UiTools.updateImageAssets(this.div),
        void UiTools.translateTextAssets(this.div)
    }
    this.jimmyButton.style.display = i ? "" : "none",
    this.jimmyButtonCancel.style.display = o ? "" : "none";
    t.Crafts.split(",");
    if (t.CanSelectCraft && (this.craftButton.style.display = ""),
    t.Rotatable && (this.rotateButton.style.display = ""),
    "Holiday_Tree" != t.Name && "SaltyBot_Shack" != t.Name || (this.treeProgressButton.style.display = "flex",
    this.returnTreeButton.style.display = "flex"),
    t.Destroyable)
        if (t.BlockChainID && "None" != t.BlockChainID)
            this.returnButton.style.display = "";
        else {
            this.removeButton.style.display = "",
            this.removeButtonAmountText.style.display = "";
            let e = t.DestroyCost;
            this.removeButtonAmountText.innerText = Math.abs(e).toLocaleString(),
            this.removeButtonAmountText.classList.add("negative"),
            e < 0 ? this.removeButtonAmountText.classList.add("negative") : this.removeButtonAmountText.classList.remove("negative")
        }
    if ("Dirt_Road" == this.objectType) {
        this.upgradeButton.style.display = "";
        const t = Game.objectData.Paved_Road.BuildCost - Game.objectData.Dirt_Road.DestroyCost;
        this.upgradeButtonAmountText.innerText = Math.abs(t).toLocaleString()
    }
    UiTools.updateImageAssets(this.div),
    UiTools.translateTextAssets(this.div)
}
,
objectui.prototype.WorldTappedSelf = function(t) {
    this.div.style.display = "flex",
    this.DisableAllOptions(),
    this.nukeTownButton.style.display = "",
    UiTools.updateImageAssets(this.div),
    UiTools.translateTextAssets(this.div)
}
,
objectui.prototype.TownTouched = function(t) {
    this.DisableAllOptions(),
    Game.town && (this.townPosition = Game.town.WorldSpacePositionToLocalGrid(t.point.x, t.point.z),
    this.objectType = Game.town.GetObjectType(this.townPosition.x, this.townPosition.z),
    this.reload())
}
,
objectui.prototype.ObjectRemoved = function() {
    this.entity.enabled = !1,
    this.DisableAllOptions(),
    this.entity.enabled = !0
}
,
objectui.prototype.ObjectPlaced = function(t, e) {
    this.DisableAllOptions(),
    this.objectType = Game.town.GetObjectType(t, e),
    this.townPosition = new pc.Vec3(t,0,e),
    this.EnableTownOptions()
}
;
var ObjectFloatUi = pc.createScript("objectFloatUi");
function round(e) {
    return (e >= 0 || -1) * Math.round(Math.abs(e))
}
ObjectFloatUi.prototype.initialize = function() {
    this.camera = "",
    this.reqItemList = [],
    this.worldTapFinished = !0,
    this.app.on("gameover", (()=>{
        this.playingPhase = !1,
        this.entity.destroy()
    }
    )),
    this.app.on("object-float-enable", (()=>{
        this.entity.enabled = !0
    }
    )),
    this.app.on("object-float-disable", (()=>{
        this.entity.enabled = !1,
        this.closeUI()
    }
    )),
    PhaseManager.instance.onPhaseChanged(PhaseManager.PlayingPhase, (()=>{
        this.playingPhase = !0,
        this.app.on("TownTapped", this.onTownTapped.bind(this), this),
        this.app.on("TownObjectAdded", this.TownObjectAdd.bind(this))
    }
    )),
    PhaseManager.instance.onPhaseChanged(PhaseManager.TownLoadPhase, (()=>{
        this.app.on("WorldTapped", this.onWorldTapped.bind(this))
    }
    ))
}
,
ObjectFloatUi.prototype.onWorldTapped = function(e) {
    if (!this.worldTapFinished)
        return;
    this.worldTapFinished = !1,
    this.worldTap = !0;
    const t = new pc.Vec3(parseInt(Math.round(e.point.x) - MapDataManager.offset.x),0,parseInt(Math.round(e.point.z) - MapDataManager.offset.z))
      , i = new pc.Vec3(round(e.point.x),0,round(e.point.z))
      , n = new pc.Vec3(t.x,0,t.z)
      , a = `(${n.x}.0,${n.y}.0,${n.z}.0)`;
    this.ResetFloat(),
    this.entity.enabled = !1,
    this.entity.setLocalScale(new pc.Vec3(0,0,0)),
    this.entity.setPosition(i.x, i.y, i.z),
    this.camera = this.app.root.findByTag("WorldCamera")[0],
    this.entity.setRotation(this.camera.getRotation()),
    this.entity.enabled = !0,
    API.getGameUserAtPosition(t.x, t.z).then((e=>{
        if (e) {
            this.entity.findByName("typeTextCenteredWorld").enabled = !0,
            this.entity.findByName("bgImageCentered").enabled = !0;
            let t = "#" + e.pointsRank + " " + e.name;
            this.entity.findByName("typeTextCenteredWorld").element.text = t,
            this.entity.findByName("bgImageCentered").element.height = 150,
            this.entity.findByName("bgImageCentered").element.width = 15 * t.length + 70,
            this.FindAndSetImage("icon_star.png", this.entity.findByName("WorldPointsIcon")),
            this.entity.findByName("WorldPoints").element.text = e.points.toLocaleString() ? e.points.toLocaleString() : "0",
            this.entity.findByName("WorldPoints").enabled = !0
        } else {
            const e = MapDataManager.mapInfo[a];
            this.entity.findByName("typeTextCentered").enabled = !0,
            this.entity.findByName("bgImageCentered").enabled = !0,
            this.entity.findByName("typeTextCentered").element.text = e.type.replace(/_/g, " "),
            this.entity.findByName("bgImageCentered").element.height = 90,
            this.entity.findByName("bgImageCentered").element.width = 15 * e.type.length + 70,
            this.entity.findByName("typeTextCenteredWorld").element.text = e.type
        }
    }
    )),
    this.entity.tween(this.entity.getLocalScale()).to(new pc.Vec3(.025,.025,.025), 1, pc.CubicOut).start(),
    this.entity.tween(this.entity.getLocalPosition()).to(new pc.Vec3(i.x + .8,i.y + 3,i.z), .5, pc.CubicOut).start(),
    this.closeUITimerInterval && clearInterval(this.closeUITimerInterval),
    this.closeUITimerInterval = setInterval((()=>this.closeUI()), 5e3),
    this.worldTapFinished = !0
}
,
ObjectFloatUi.prototype.TownObjectAdd = function(e, t) {
    if (!this.touchLocationRoundedWorldSpace)
        return;
    Game.town.WorldSpacePositionToLocalGrid(this.entity.getLocalPosition().x, this.entity.getLocalPosition().z);
    this.entity.enabled = !1,
    this.entity.setLocalScale(new pc.Vec3(0,0,0)),
    this.entity.setPosition(this.touchLocationRoundedWorldSpace.x, this.touchLocationRoundedWorldSpace.y, this.touchLocationRoundedWorldSpace.z),
    this.entity.enabled = !1,
    this.reload()
}
,
ObjectFloatUi.prototype.swap = function(e) {
    console.log("swapping"),
    this.app.off("TownTapped", e.onTownTapped, e),
    this.app.on("TownTapped", this.onTownTapped, this),
    e.closeUITimerInterval && clearInterval(e.closeUITimerInterval),
    e.closeUI = this.closeUI
}
,
ObjectFloatUi.prototype.reload = function() {
    this.UpdateTownFloat(),
    this.entity.enabled = !0,
    this.entity.tween(this.entity.getLocalScale()).to(new pc.Vec3(.035,.035,.035), .5, pc.CubicOut).start(),
    this.entity.tween(this.entity.getLocalPosition()).to(new pc.Vec3(this.touchLocationSnapped.x,this.touchLocationSnapped.y + 10 + this.floatYOffset,this.touchLocationSnapped.z), .5, pc.CubicOut).start(),
    this.updateUIInterval && clearInterval(this.updateUIInterval),
    this.updateUIInterval = setInterval((()=>this.UpdateTownFloat()), 1e3),
    this.closeUITimerInterval && clearInterval(this.closeUITimerInterval),
    this.closeUITimerInterval = setInterval((()=>this.closeUI()), 5e3)
}
,
ObjectFloatUi.prototype.onTownTapped = function(e) {
    if (!this.playingPhase)
        return;
    this.worldTap = !1,
    this.entity.enabled = !1,
    this.ResetFloat(),
    this.entity.setLocalScale(0, 0, 0),
    this.touchLocationRoundedWorldSpace = new pc.Vec3(round(e.point.x),0,round(e.point.z));
    let t = Game.town.WorldSpacePositionToGrid(this.touchLocationRoundedWorldSpace.x, this.touchLocationRoundedWorldSpace.z);
    this.touchLocationSnapped = new pc.Vec3(t.x,0,t.z),
    this.entity.setPosition(this.touchLocationSnapped),
    this.camera = this.app.root.findByTag("TownCamera")[0],
    this.entity.setRotation(this.camera.getRotation()),
    this.reload()
}
,
ObjectFloatUi.prototype.closeUI = function() {
    const e = this.entity.getLocalPosition();
    this.worldTap ? (this.entity.tween(this.entity.getLocalScale()).to(new pc.Vec3(0,0,0), .5, pc.CubicOut).start(),
    this.entity.tween(this.entity.getLocalPosition()).to(new pc.Vec3(e.x,e.y,e.z), 1, pc.CubicOut).start()) : (this.entity.tween(this.entity.getLocalScale()).to(new pc.Vec3(0,0,0), .5, pc.CubicOut).start(),
    this.entity.tween(this.entity.getLocalPosition()).to(new pc.Vec3(e.x,e.y - 15,e.z), .5, pc.CubicOut).start())
}
,
ObjectFloatUi.prototype.GetOriginalReqData = function(e, t) {
    if (!e)
        return;
    let i = t.logicObject.getCraftData(e)
      , n = {};
    return "none" !== i.Req1 && (n[i.Req1] = i.Value1),
    "none" !== i.Req2 && (n[i.Req2] = i.Value2),
    "none" !== i.Req3 && (n[i.Req3] = i.Value3),
    n
}
,
ObjectFloatUi.prototype.update = function(e) {
    Game.town && Game.town.townLoaded && this.entity.setRotation(CameraCommander.instance.activeCamera.getRotation())
}
,
ObjectFloatUi.prototype.ResetFloat = function() {
    for (let e = 0; e < this.entity.children.length; e += 1)
        this.entity.children[e].enabled = !1;
    this.entity.findByName("laborText").enabled = !1,
    this.entity.findByName("laborIcon").enabled = !1,
    this.entity.findByName("laborTextCentered").element.fontSize = 34,
    this.entity.findByName("WorldPoints").enabled = !1
}
,
ObjectFloatUi.prototype.GetRemainingTimeInDisplayFormat = function(e) {
    e -= 3600 * Math.floor(e / 86400) * 24;
    const t = Math.floor(e / 3600);
    e -= 3600 * t;
    const i = Math.floor(e / 60);
    return e -= 60 * i,
    e = Math.floor(e),
    t ? `${t}hr ${i}m ${e}s` : i ? `${i}m ${e}s` : `${e}s`
}
,
ObjectFloatUi.prototype.UpdateTownFloat = function() {
    if (!this.playingPhase)
        return;
    if (this.worldTap)
        return;
    this.floatYOffset = 0;
    let e = Game.town.WorldSpacePositionToLocalGrid(this.touchLocationRoundedWorldSpace.x, this.touchLocationRoundedWorldSpace.z)
      , t = Game.town.GetObjectAt(e.x, e.z);
    if (!t)
        return;
    this.ResetFloat();
    let i = t.GetDisplayData();
    const GetFontSize = e=>{
        let t = e.length;
        return t > 20 ? 42 : t > 20 ? 40 : t > 10 ? 38 : t > 5 ? 34 : t > 1 ? 20 : void 0
    }
    ;
    let n = ""
      , a = !1;
    if (t.unitList.length > 0 && (n = t.unitList[0].type.replace(/_/g, " "),
    a = !0),
    !t.logicObject.reqsValid) {
        const e = this.entity.findByName("bgImage");
        e.enabled = !0,
        e.element.height = 120,
        e.element.width = 480;
        const i = this.entity.findByName("typeText");
        i.enabled = !0,
        i.element.text = "Edge Requirements Not Met";
        const n = this.entity.findByName("typeStatusNotes");
        return n.enabled = !0,
        n.element.text = Grabbatron.edgeRequirements(t.objData.EdgeRequirements),
        void (n.element.color = (new pc.Color).fromString("#eb0c00"))
    }
    if (this.entity.findByName("typeStatusNotes").element.color = (new pc.Color).fromString("#694E11"),
    "BuildSite" === t.logicType)
        switch (i.state) {
        case "Timer":
            {
                this.entity.findByName("bgImage").enabled = !0,
                this.entity.findByName("bgImage").element.height = 160,
                this.entity.findByName("ProgressBG").enabled = !0,
                this.entity.findByName("typeStatusNotes").enabled = !0,
                this.entity.findByName("typeStatusNotes").element.text = "Building : " + i.type.replace(/_/g, " ");
                let e = Game.objectData[t.type].Name.replace(/_/g, " ");
                this.entity.findByName("typeText").enabled = !0,
                this.entity.findByName("typeText").element.text = e,
                this.FindAndSetImage("icon_buildTime.png", this.entity.findByName("typeIcon"));
                const n = t.logicObject.GetProgress();
                this.entity.findByName("Progress").enabled = !0,
                this.entity.findByName("Progress").element.color = (new pc.Color).fromString("#009ecb"),
                this.entity.findByName("Progress").element.width = 250 * Math.max(1 - n, 0);
                const a = Math.max(t.logicObject.constructionData.Time0 - i.buildTime, 0);
                return this.entity.findByName("progressText").enabled = !0,
                void (this.entity.findByName("progressText").element.text = this.GetRemainingTimeInDisplayFormat(a))
            }
        case "WaitForReqs":
            {
                this.entity.findByName("typeText").enabled = !0,
                this.entity.findByName("bgImage").enabled = !0,
                this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " "),
                this.entity.findByName("typeStatusNotes").enabled = !0,
                this.entity.findByName("typeStatusNotes").element.text = "Building : " + i.type.replace(/_/g, " "),
                origReqData = t.logicObject.constructionData.reqs,
                this.entity.findByName("ProgressBG").enabled = !1,
                this.entity.findByName("Progress").enabled = !1;
                let e = 1
                  , n = 100;
                for (let i in origReqData) {
                    let a = t.logicObject.getRequirementAmountOfCraft(i);
                    void 0 === a && (a = 0);
                    const o = `${Math.min(a, t.GetProxifiedCountOfType(i))} / ${origReqData[i]}`
                      , s = this.entity.findByName(`itemTextReq${e}Status`);
                    s.element.depthTest = !1,
                    s.element.text = o + " " + i.replace(/_/g, " "),
                    s.enabled = !0,
                    this.FindAndSetImage(UiTools.getIconFileName(i), this.entity.findByName(`Req${e}itemIcon`)),
                    this.entity.findByName(`Req${e}BG`).enabled = !0,
                    n += 60,
                    e++
                }
                return this.floatYOffset = e,
                n += 10,
                void (this.entity.findByName("bgImage").element.height = n)
            }
        default:
            return this.entity.findByName("typeTextCentered").enabled = !0,
            this.entity.findByName("bgImageCentered").enabled = !0,
            this.entity.findByName("typeTextCentered").element.text = t.type.replace(/_/g, " "),
            this.entity.findByName("bgImageCentered").element.height = 90,
            void (this.entity.findByName("bgImageCentered").element.width = 15 * t.type.length + 70)
        }
    if ("Jimmy" === t.logicType) {
        let e = t.logicObject.GetDisplayData();
        if ("NameOnly" == e.displayState) {
            const e = this.entity.findByName("typeTextCenteredUnit");
            e.enabled = !0,
            e.element.text = t.type.replace(/_/g, " ");
            const i = this.entity.findByName("bgImageCenteredUnit");
            i.enabled = !0,
            i.element.height = 160,
            i.element.width = 15 * t.type.length + 120,
            this.entity.findByName("laborIconCentered").enabled = !0;
            const n = this.entity.findByName("bgLaborCentered");
            n.enabled = !0,
            n.element.width = 15 * t.type.length + 80;
            const a = this.entity.findByName("laborTextCentered");
            return a.enabled = !0,
            a.element.text = `$${t.objData.LaborCost}/min`,
            void (a.element.fontSize = GetFontSize(t.type))
        }
        if ("Message" == e.displayState) {
            const i = this.entity.findByName("bgImage");
            i.enabled = !0,
            i.element.height = 160,
            this.entity.findByName("laborIcon").enabled = !0,
            this.entity.findByName("bgLabor").enabled = !0;
            const n = this.entity.findByName("laborText");
            n.enabled = !0,
            n.element.text = `$${t.objData.LaborCost}/min`;
            const a = this.entity.findByName("typeText");
            a.enabled = !0,
            a.element.text = t.type.replace(/_/g, " ");
            const o = this.entity.findByName("typeStatusNotes");
            return o.enabled = !0,
            void (o.element.text = e.message)
        }
        if ("Active" == e.displayState) {
            const i = this.entity.findByName("typeText");
            i.enabled = !0,
            i.element.text = t.type.replace(/_/g, " ");
            const n = this.entity.findByName("bgImage");
            n.enabled = !0,
            n.element.height = 160;
            const a = this.entity.findByName("typeIcon");
            a.enabled = !0,
            this.FindAndSetImage(UiTools.getIconFileName(e.craft), a);
            const o = this.entity.findByName("progressText");
            o.enabled = !0,
            o.element.text = `${e.timeRemaining}s`,
            this.entity.findByName("ProgressBG").enabled = !0;
            const s = this.entity.findByName("Progress");
            s.enabled = !0,
            s.element.color = (new pc.Color).fromString("#52ab03"),
            s.element.width = 250 * e.timePercent;
            const l = this.entity.findByName("typeStatusNotes");
            return l.enabled = !0,
            void (l.element.text = `Sending ${e.craft.replace(/_/g, " ")}`)
        }
    }
    if (null === i || "Trade" === t.objData.Class || "Crafter" === t.logicType && "Idle" === i.state || "VOX_Home" === t.type) {
        if (t.objData.LaborCost > 0) {
            const e = this.entity.findByName("bgImageCenteredUnit")
              , i = this.entity.findByName("typeTextCenteredUnit")
              , n = this.entity.findByName("laborTextCentered")
              , a = this.entity.findByName("laborIconCentered")
              , o = this.entity.findByName("bgLaborCentered");
            return i.enabled = !0,
            e.enabled = !0,
            i.element.text = t.type.replace(/_/g, " "),
            e.element.height = 160,
            e.element.width = 15 * t.type.length + 120,
            n.enabled = !0,
            a.enabled = !0,
            o.enabled = !0,
            o.element.width = 15 * t.type.length + 80,
            n.element.text = `$${t.objData.LaborCost}/min`,
            void (n.element.fontSize = GetFontSize(t.type))
        }
        {
            const e = this.entity.findByName("bgImageCentered")
              , i = this.entity.findByName("typeTextCentered");
            return i.enabled = !0,
            e.enabled = !0,
            i.element.text = t.type.replace(/_/g, " "),
            e.element.height = 90,
            void (e.element.width = 15 * t.type.length + 70)
        }
    }
    this.entity.findByName("bgImage").element.width = 360;
    let o = t.logicObject instanceof TS_CrafterObjectLogic ? t.logicObject.getCraftData(i.craft) : Game.craftData[i.craft];
    this.entity.findByName("typeText").enabled = !0,
    this.entity.findByName("bgImage").enabled = !0,
    "Crafter" === t.logicType && "WaitForReqs" === i.state && (this.entity.findByName("typeStatusNotes").enabled = !0,
    this.entity.findByName("typeStatusNotes").element.text = `${o.CraftingText} ${i.craft.replace(/_/g, " ")}`),
    "Crafter" === t.logicType && "WaitForUnits" === i.state && (this.entity.findByName("typeStatusNotes").enabled = !0,
    this.entity.findByName("typeStatusNotes").element.text = "Waiting for  " + n),
    "Produce" === i.state && (this.entity.findByName("typeStatusNotes").enabled = !0,
    this.entity.findByName("typeStatusNotes").element.text = o.CraftingText + " " + i.craft.replace(/_/g, " "));
    if ("Crafter" === t.logicType && "WaitForReqs" === i.state || "WaitForUnits" === i.state) {
        let e = 100
          , n = 360
          , a = ""
          , o = 0;
        this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " "),
        o = t.type.length,
        origReqData = this.GetOriginalReqData(i.craft, t),
        this.entity.findByName("ProgressBG").enabled = !1,
        this.entity.findByName("Progress").enabled = !1,
        t.objData.LaborCost > 0 && (e = 152,
        this.entity.findByName("laborText").enabled = !0,
        this.entity.findByName("laborIcon").enabled = !0,
        this.entity.findByName("bgLabor").enabled = !0,
        this.entity.findByName("laborText").element.text = `$${t.objData.LaborCost}/min`,
        a = "Unit");
        let s = 1;
        const l = t.logicObject.GetProxifiedReqList();
        if (!t.objData.CraftReqsMet)
            for (let t in origReqData) {
                let i = l[t] ? l[t] : 0;
                const n = `${origReqData[t] - i} / ${origReqData[t]}`
                  , r = this.entity.findByName(`itemTextReq${s}Status${a}`)
                  , d = this.entity.findByName(`Req${s}BG${a}`);
                d.element.width = 250,
                o = t.length + 5 > o ? t.length + 5 : o,
                r.element.text = n + " " + t.replace(/_/g, " "),
                o = t.length + 5 > o ? t.length + 5 : o,
                t.length >= 13 && (d.element.width = 260 + 15 * (t.length - 10)),
                r.enabled = !0,
                this.FindAndSetImage(UiTools.getIconFileName(t), this.entity.findByName(`Req${s}itemIcon${a}`)),
                this.entity.findByName(`Req${s}BG${a}`).enabled = !0,
                e += 60,
                s++
            }
        this.floatYOffset = s,
        e += 10;
        const r = this.entity.findByName("bgImage");
        return r.element.height = e,
        o > 15 && (n = 370 + 15 * (o - 15)),
        void (r.element.width = n)
    }
    if ("Crafter" !== t.logicType || "Idle" !== i.state) {
        if ("Crafter" === t.logicType && "Produce" === i.state) {
            this.entity.findByName("progressText").enabled = !0,
            this.entity.findByName("bgImage").element.height = 160,
            this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " "),
            this.FindAndSetImage((e=>{
                const t = e.logicObject.GetCraftProximityPenalty();
                if (Game.objectData[e.type].ProximityImmune)
                    return "icon_clock.png";
                if (Game.craftData[e.logicObject.data.craft].ProximityReverse) {
                    if (t > 2)
                        return "icon_clock_prox0.png";
                    if (1 == t || 2 == t)
                        return "icon_clock_prox2.png";
                    if (0 === t)
                        return "icon_clock_prox3.png"
                } else {
                    if (0 === t)
                        return "icon_clock_prox0.png";
                    if (1 == t || 2 == t)
                        return "icon_clock_prox2.png";
                    if (t > 2)
                        return "icon_clock_prox3.png"
                }
            }
            )(t), this.entity.findByName("typeIcon"));
            const e = t.logicObject.GetCraftTime() - i.craftTime
              , n = e / t.logicObject.GetCraftTime();
            return this.entity.findByName("progressText").element.text = this.GetRemainingTimeInDisplayFormat(e),
            this.entity.findByName("Progress").element.color = (e=>{
                const t = Math.abs(e.logicObject.GetCraftProximityPenalty())
                  , i = "#52ab03"
                  , n = "#d1c100"
                  , a = "#ec7e60";
                if (Game.objectData[e.type].ProximityImmune)
                    return (new pc.Color).fromString("#009ecb");
                if (Game.craftData[e.logicObject.data.craft].ProximityReverse) {
                    if (t > 2)
                        return (new pc.Color).fromString(i);
                    if (1 == t || 2 == t)
                        return (new pc.Color).fromString(n);
                    if (0 === t)
                        return (new pc.Color).fromString(a)
                } else {
                    if (0 === t)
                        return (new pc.Color).fromString(i);
                    if (1 == t || 2 == t)
                        return (new pc.Color).fromString(n);
                    if (t > 2)
                        return (new pc.Color).fromString(a)
                }
            }
            )(t),
            this.entity.findByName("Progress").element.width = 250 * n,
            this.entity.findByName("ProgressBG").enabled = !0,
            void (this.entity.findByName("Progress").enabled = !0)
        }
        if ("Complete" === i.state)
            return this.entity.findByName("typeStatusNotes").enabled = !0,
            this.entity.findByName("typeStatusNotes").element.text = i.craft.replace(/_/g, " "),
            this.entity.findByName("bgImage").element.height = 160,
            this.entity.findByName("typeStatus").enabled = !0,
            this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " "),
            this.FindAndSetImage("icon_" + i.craft.toLowerCase() + ".png", this.entity.findByName("typeIcon")),
            this.entity.findByName("ProgressBG").enabled = !0,
            void (this.entity.findByName("typeStatus").element.text = "Ready!");
        if ("Complete" === i.state && n)
            return this.entity.findByName("bgImage").element.height = 220,
            this.entity.findByName("ReadyUnitStatus").enabled = !0,
            void (this.entity.findByName("ReadyUnitStatus").element.text = "Waiting for pickup...");
        if ("Storage" === t.logicType) {
            const e = this.entity.findByName("StorageCapacityText")
              , n = this.entity.findByName("bgImage");
            this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " "),
            e.element.text = t.logicObject.GetTotalCraftsStored() + "/" + t.logicObject.capacity,
            "{}" == JSON.stringify(i.storageList) && (n.element.height = 80);
            let a = 0
              , o = 360;
            e.enabled = !1,
            t.type.length >= 23 ? (o = 575,
            e.localPosition.x = -925) : t.type.length > 14 ? (o = 525,
            e.localPosition.x = -975) : e.localPosition.x = -1150,
            e.enabled = !0;
            let s = Object.keys(i.storageList);
            n.element.height = 90 + 60 * s.length;
            for (let e = 0; e < s.length; e++) {
                const t = s[e];
                t.length > a && (a = t.length);
                const n = this.entity.findByName("StorageTemplate").clone();
                n.element.margin.y -= 120 * e,
                n.enabled = !0,
                n.findByName("Status").element.text = i.storageList[t] + " " + t.replace(/_/g, " "),
                this.FindAndSetImage(UiTools.getIconFileName(t), n.findByName("Icon"));
                const o = n.findByName("BG");
                if (t.length >= 13) {
                    const e = 250 + 15 * (t.length - 10);
                    o.element.width = e > 250 ? e : 250
                }
                this.entity.addChild(n)
            }
            a >= 13 && (o = Math.max(o, 350 + 15 * (a - 10))),
            this.floatYOffset = s.length,
            n.element.width = o
        }
    } else
        this.entity.findByName("typeText").element.text = t.type.replace(/_/g, " ")
}
,
ObjectFloatUi.prototype.resetReqs = function() {
    for (let e = 0; e < this.reqItemList.length; e++)
        this.reqItemList[e].destroy();
    this.reqItemList = []
}
,
ObjectFloatUi.prototype.FindAndSetImage = function(e, t) {
    const i = this.app.assets.find(e, "texture");
    i ? (t.element.texture = i.resource,
    t.enabled = !0) : t.element.texture = void 0
}
;
var LoadingScreen = pc.createScript("loadingScreen");
LoadingScreen.prototype.initialize = function() {
    this.splash = document.getElementById("application-splash-wrapper"),
    this.splashLogoContainer = document.getElementById("application-splash-logo-container"),
    this.sbgLogo = this.splash.querySelector("#sbg-logo"),
    this.circleElement = this.splash.querySelector(".circle-progress"),
    this.progBar = this.splash.querySelector("#progress-bar"),
    this.container = this.splash.querySelector("#progress-bar-container"),
    this.play = this.splash.querySelector("#playButton");
    let e = !1;
    this.playContainer = this.splash.querySelector("#playnow-container"),
    this.guestContainer = this.splash.querySelector("#login-container"),
    this.setProgress(.6),
    this.app.on("PrefabLoadComplete", (()=>this.setProgress(.7))),
    this.app.on("SceneMergeComplete", (()=>this.setProgress(.85))),
    Game.app.once("GameReady", (()=>{
        if (API.getGame().then((e=>{
            this.splash.querySelector("#server-name").innerText = Game.gameData.name
        }
        )),
        this.playContainer.style.visibility = "",
        this.guestContainer) {
            const e = this.guestContainer.querySelector("#login-prompt");
            this.guestContainer.style.visibility = "",
            e && (Game.guestMode || (loginHeader = this.guestContainer.querySelector("h3"),
            loginHeader.innerText = `Welcome, ${"launch.playcanvas.com" === location.host ? "PlayCanvas" : Game.playerName}!`,
            e.style.display = "none"))
        }
        this.play.addEventListener("touchstart", (()=>e = !0), {
            passive: !0
        }),
        this.play.addEventListener("click", (t=>{
            Game.guestMode ? window.location.href = "https://app.gala.games/?register=1" : (Game.app.fire("playClicked"),
            Game.playClicked = !0,
            this.splash.parentElement.removeChild(this.splash),
            this.app.fire("UserStart"),
            e && (document.body.requestFullScreen ? document.body.requestFullscreen() : document.body.webkitRequestFullScreen && document.body.webkitRequestFullScreen()))
        }
        ));
        const t = this.playContainer.querySelector("#changeServer-button");
        console.log(t),
        t.addEventListener("click", (()=>{
            ServerSelectUi.instance.UI.OpenUI()
        }
        )),
        this.setProgress(1)
    }
    ))
}
,
LoadingScreen.prototype.setProgress = function(e) {
    const t = document.getElementById("progressText")
      , s = document.getElementById("ProgFull");
    s.parentElement.style.transform = "rotate(180deg)",
    s && (s.style.visibility = "",
    e = Math.min(1, Math.max(0, e)),
    t.innerText = `${parseInt(100 * e)}%`,
    s.style.transform = `rotate(${360 * (e - .5)}deg)`),
    1 == e && (this.circleElement.style.display = "none")
}
;
class TS_SuperTile {
    constructor(t, e) {
        this.superTileSize = 80,
        this.subTileSize = 20,
        this.offsetX = t,
        this.offsetZ = e;
        let i = Game.position.x + t
          , s = Game.position.y + e;
        const l = Game.world.GetTypeAtPosition(i, s);
        if (!l)
            return;
        if (this.type = l.replace(/ /g, "_"),
        !Game.worldObjectData[this.type])
            return void console.log(`Can not load super tile at ${t},${e} : No data for type "${this.type}"`);
        let n = Game.worldObjectData[this.type].SupTile;
        this.neighbors = [];
        for (let t = -1; t <= 1; t++)
            for (let e = -1; e <= 1; e++) {
                if (0 === t && 0 === e)
                    continue;
                let l = {
                    x: e,
                    z: t,
                    type: Game.world.GetTypeAtPosition(i + e, s + t)
                };
                this.neighbors.push(l)
            }
        Game.worldObjectData[this.type].Tiled ? this.SpawnTileEntities(n) : (this.SpawnProps(n),
        this.SpawnGroundEntities(n))
    }
    SpawnTileEntities(t) {
        this.tileEntities = new Array(4);
        for (let t = 0; t < this.tileEntities.length; t++) {
            this.tileEntities[t] = new Array(4);
            for (let e = 0; e < this.tileEntities[t].length; e++)
                this.tileEntities[t][e] = 0
        }
        let e, i, s = `SupTile_${t}`, l = 0;
        for (let t = 0; t < this.tileEntities.length; t++)
            for (let n = 0; n < this.tileEntities[t].length; n++) {
                e = "_Open";
                let o, h = !1, a = !1, r = 0 === n ? -1 : 1, m = 0 === t ? -1 : 1;
                const p = this.neighbors.filter((t=>t.x == r && 0 === t.z))[0];
                let E;
                p.type && (o = p.type.replace(/ /g, "_"));
                const f = this.neighbors.filter((t=>0 === t.x && t.z === m))[0];
                let w;
                f.type && (E = f.type.replace(/ /g, "_"));
                const G = this.neighbors.filter((t=>t.x == r && t.z === m))[0];
                G.type && (w = G.type.replace(/ /g, "_")),
                l = 0;
                let g = !1
                  , S = !1
                  , b = !1;
                Game.worldObjectData[o] && (g = Game.worldObjectData[o].Tiled),
                Game.worldObjectData[E] && (S = Game.worldObjectData[E].Tiled),
                Game.worldObjectData[w] && (b = Game.worldObjectData[w].Tiled),
                (0 === t && 0 === n || 0 === t && n === this.tileEntities.length - 1 || t === this.tileEntities.length - 1 && 0 === n || t === this.tileEntities.length - 1 && n === this.tileEntities.length - 1) && (h = !0,
                g && S && b ? e = "_Open" : g || S ? g && S && !b ? (e = "_OuterCorner",
                0 === t && 0 === n ? l = 0 : 0 === t && n === this.tileEntities.length - 1 ? l = 270 : t === this.tileEntities.length - 1 && 0 === n ? l = 90 : t === this.tileEntities.length - 1 && n === this.tileEntities.length - 1 && (l = 180)) : !g && S ? (e = "_Run",
                0 === n ? l = 0 : n === this.tileEntities.length - 1 && (l = 180)) : g && !S && (e = "_Run",
                0 === t ? l = 270 : t === this.tileEntities.length - 1 && (l = 90)) : (e = "_InnerCorner",
                0 === t && 0 === n ? l = 0 : 0 === t && n === this.tileEntities.length - 1 ? l = 270 : t === this.tileEntities.length - 1 && 0 === n ? l = 90 : t === this.tileEntities.length - 1 && n === this.tileEntities.length - 1 && (l = 180)),
                i = s + e),
                h || (0 === t && (a = !0,
                S || (e = "_Run",
                l = 270)),
                t == this.tileEntities.length - 1 && (a = !0,
                S || (e = "_Run",
                l = 90)),
                0 === n && (a = !0,
                g || (e = "_Run",
                l = 0)),
                n == this.tileEntities.length - 1 && (a = !0,
                g || (e = "_Run",
                l = 180))),
                i = s + e;
                let u = this.offsetX * this.superTileSize + n * this.subTileSize + Game.town.offsetX + this.subTileSize / 2 - Game.town.tileSize / 2
                  , c = this.offsetZ * this.superTileSize + t * this.subTileSize + Game.town.offsetZ + this.subTileSize / 2 - Game.town.tileSize / 2;
                this.tileEntities[t][n] = EntitySpawner.spawnObject(i, u, 0, c, Game.app.root),
                this.tileEntities[t][n] && this.tileEntities[t][n].setEulerAngles(0, l, 0)
            }
    }
    SpawnProps(t) {
        let e = this.superTileSize - (this.superTileSize / 2 + Game.town.tileSize / 2) + this.superTileSize * this.offsetX + Game.town.offsetX
          , i = this.superTileSize - (this.superTileSize / 2 + Game.town.tileSize / 2) + this.superTileSize * this.offsetZ + Game.town.offsetZ;
        EntitySpawner.spawnObject(t, e, 0, i, Game.app.root)
    }
    SpawnGroundEntities(t) {
        this.tileEntities = new Array(4);
        for (let t = 0; t < this.tileEntities.length; t++) {
            this.tileEntities[t] = new Array(4);
            for (let e = 0; e < this.tileEntities[t].length; e++)
                this.tileEntities[t][e] = 0
        }
        let e, i, s = `SupTile_${t}`;
        if ("None" !== Game.worldObjectData[t].ProximityEmit)
            for (let t = 0; t < this.tileEntities.length; t++)
                for (let l = 0; l < this.tileEntities[t].length; l++) {
                    e = "_0",
                    i = s + e;
                    let n = this.offsetX * this.superTileSize + l * this.subTileSize + Game.town.offsetX + this.subTileSize / 2 - Game.town.tileSize / 2
                      , o = this.offsetZ * this.superTileSize + t * this.subTileSize + Game.town.offsetZ + this.subTileSize / 2 - Game.town.tileSize / 2;
                    this.tileEntities[t][l] = EntitySpawner.spawnObject(i, n, 0, o, Game.app.root)
                }
        else
            for (let t = 0; t < this.tileEntities.length; t++)
                for (let l = 0; l < this.tileEntities[t].length; l++) {
                    e = "_4";
                    let n = 0
                      , o = l < 2 ? -1 : 1
                      , h = t < 2 ? -1 : 1
                      , a = this.neighbors.filter((t=>t.x == o && 0 === t.z))[0].type.replace(/ /g, "_")
                      , r = this.neighbors.filter((t=>0 === t.x && t.z === h))[0].type.replace(/ /g, "_")
                      , m = this.neighbors.filter((t=>t.x == o && t.z === h))[0].type.replace(/ /g, "_")
                      , p = !1;
                    0 === t && 0 === l || 0 === t && l === this.tileEntities.length - 1 || t === this.tileEntities.length - 1 && 0 === l || t === this.tileEntities.length - 1 && l === this.tileEntities.length - 1 ? (p = !0,
                    "None" != Game.worldObjectData[r].ProximityEmit && (n++,
                    e = "_0"),
                    "None" != Game.worldObjectData[a].ProximityEmit && (n++,
                    e = "_0"),
                    "None" != Game.worldObjectData[m].ProximityEmit && (n++,
                    e = "_0")) : 1 == t && 1 == l || 1 == t && 2 == l || 2 == t && 1 == l || 2 == t && 2 == l ? ("None" != Game.worldObjectData[r].ProximityEmit && (n++,
                    e = "_2"),
                    "None" != Game.worldObjectData[a].ProximityEmit && (n++,
                    e = "_2"),
                    "None" != Game.worldObjectData[m].ProximityEmit && (n++,
                    e = "_2")) : (0 !== t && t != this.tileEntities.length - 1 || ("None" != Game.worldObjectData[r].ProximityEmit ? (n++,
                    e = "_0") : "None" == Game.worldObjectData[m].ProximityEmit && "None" == Game.worldObjectData[a].ProximityEmit || (n++,
                    e = "_2")),
                    0 !== l && l != this.tileEntities.length - 1 || ("None" != Game.worldObjectData[a].ProximityEmit ? (n++,
                    e = "_0") : "None" == Game.worldObjectData[m].ProximityEmit && "None" == Game.worldObjectData[r].ProximityEmit || (n++,
                    e = "_2"))),
                    i = s + e;
                    let E = this.offsetX * this.superTileSize + l * this.subTileSize + Game.town.offsetX + this.subTileSize / 2 - Game.town.tileSize / 2
                      , f = this.offsetZ * this.superTileSize + t * this.subTileSize + Game.town.offsetZ + this.subTileSize / 2 - Game.town.tileSize / 2;
                    this.tileEntities[t][l] = EntitySpawner.spawnObject(i, E, 0, f, Game.app.root)
                }
    }
}
var BotAssemblyUI = pc.createScript("BotAssemblyUI");
BotAssemblyUI.prototype.initialize = function() {
    BotAssemblyUI.instance = this,
    this.UI = new TS_BotAssemblyUI({
        name: "botAssembly.html",
        divClass: "container",
        fullScreenUI: !0
    })
}
;
class TS_BotAssemblyUI extends TS_UIBase {
    Initialize() {
        console.log("Bot Assembly Initialize")
    }
    OnOpen() {
        console.log("Bot Assembly Open")
    }
    OnClose() {
        console.log("Bot Assembly Close")
    }
    OnReload() {
        console.log("Bot Assembly Reload")
    }
    OnInternetConnectionLost() {
        console.log("Bot Assembly OnInternetConnectionLost")
    }
}
class DataWriter {
    constructor() {
        this.data = []
    }
    writeUint8(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setUint8,
            s: 1,
            v: t
        }))))
    }
    writeBool(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setUint8,
            s: 1,
            v: t ? 1 : 0
        }))))
    }
    writeUint16(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setUint16,
            s: 2,
            v: t
        }))))
    }
    writeChar16(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setUint16,
            s: 2,
            v: t.charCodeAt(0)
        }))))
    }
    writeUint32(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setUint32,
            s: 4,
            v: t
        }))))
    }
    writeFloat64(...t) {
        this.data.push(...t.map((t=>({
            f: DataView.prototype.setFloat64,
            s: 8,
            v: t
        }))))
    }
    toBuffer() {
        const t = this.size()
          , e = new ArrayBuffer(t)
          , r = new DataView(e);
        let i = 0;
        return this.data.forEach((t=>{
            t.f.call(r, i, t.v),
            i += t.s
        }
        )),
        e
    }
    size() {
        return this.data.reduce(((t,e)=>t + e.s), 0)
    }
}
class Ledger {
    constructor() {
        this.ms = 0,
        this.seq = 0,
        this.queue = [],
        this.busy = !1
    }
    _getStreamId() {
        const t = Date.now() - RT.serverTimeOffset;
        return t > this.ms ? (this.ms = t,
        this.seq = 0) : this.seq++,
        {
            ms: this.ms,
            seq: this.seq
        }
    }
    _send(t) {
        this.queue.push(t),
        this._process()
    }
    _process() {
        if (this.busy)
            return;
        this.busy = !0;
        let t = Promise.resolve();
        for (this.log("Processing ledger queue", this.queue.length, this.busy); this.queue.length > 0; ) {
            const e = this.queue.shift();
            t = t.then((()=>RT.sendAck({
                type: "ledger",
                data: e.toBuffer()
            }))).catch((()=>{
                this.queue.unshift(e)
            }
            ))
        }
        t.finally((()=>{
            this.busy = !1,
            this.queue.length > 0 && this._process()
        }
        ))
    }
    _createWriter(t) {
        const e = this._getStreamId()
          , r = new DataWriter;
        return r.writeFloat64(e.ms),
        r.writeUint8(e.seq),
        r.writeChar16(t[0]),
        r.writeChar16(t[1]),
        r
    }
    sellObject(t, e) {
        const r = this._createWriter(Ledger.SELL_OBJECT);
        r.writeUint8(t / 5, e / 5),
        this._send(r)
    }
    buyObject(t, e, r, {currency: i, gold: s}={}) {
        const n = this._createWriter(Ledger.BUY_OBJECT);
        n.writeUint8(t / 5, e / 5),
        n.writeUint16(Game.objectData[r].Id),
        n.writeUint32(i, s),
        this._send(n)
    }
    craftSelect(t, e, r) {
        const i = this._createWriter(Ledger.CRAFT_SELECT);
        i.writeUint8(t / 5, e / 5),
        i.writeUint16(r && Game.craftData[r].Id || 0),
        this._send(i)
    }
    unitPickup(t, e, r, i, s, n) {
        const a = this._createWriter(Ledger.UNIT_PICKUP);
        a.writeUint8(t / 5, e / 5, r, i / 5, s / 5),
        a.writeUint16(Game.craftData[n].Id),
        this._send(a)
    }
    unitStore(t, e, r, i, s) {
        const n = this._createWriter(Ledger.UNIT_STORE);
        n.writeUint8(t / 5, e / 5, r, i / 5, s / 5),
        this._send(n)
    }
    unitDestroy(t, e, r) {
        const i = this._createWriter(Ledger.UNIT_DESTROY);
        i.writeUint8(t / 5, e / 5, r),
        this._send(i)
    }
    unitHome(t, e) {
        const r = this._createWriter(Ledger.UNIT_HOME);
        r.writeUint8(t / 5, e / 5),
        this._send(r)
    }
    tradeStart(t, e, r, i, s) {
        const n = this._createWriter(Ledger.TRADE_START);
        n.writeUint8(t / 5, e / 5),
        n.writeUint16(Game.worldObjectData[r].Id),
        n.writeUint16(Game.craftData[i].Id);
        const a = Object.keys(s);
        n.writeUint8(a.length);
        for (const t of a) {
            const e = s[t];
            n.writeUint16(Game.craftData[t].Id),
            n.writeUint8(e.length);
            for (const t of e)
                n.writeUint8(t.x / 5, t.z / 5, t.amount)
        }
        this._send(n)
    }
    tradeEnd(t, e) {
        const r = this._createWriter(Ledger.TRADE_END);
        r.writeUint8(t / 5, e / 5),
        this._send(r)
    }
    laborCost(t) {
        const e = this._createWriter(Ledger.LABOR_COST);
        e.writeUint32(t),
        this._send(e)
    }
    jimmyConfigure(t, e, r, i) {
        const s = this._createWriter(Ledger.JIMMY_CONFIGURE);
        s.writeUint8(t / 5, e / 5),
        s.writeUint16(r && Game.craftData[r].Id || 0),
        s.writeBool(i),
        this._send(s)
    }
    jimmySend(t, e, r, i) {
        const s = this._createWriter(Ledger.JIMMY_SEND);
        s.writeUint8(t / 5, e / 5, r / 5, i / 5),
        this._send(s)
    }
    jimmyReceive(t, e, r, i) {
        const s = this._createWriter(Ledger.JIMMY_RECEIVE);
        s.writeUint8(t / 5, e / 5),
        s.writeUint16(Game.craftData[r].Id),
        s.writeUint8(i),
        this._send(s)
    }
    rotateObject(t, e, r) {
        const i = this._createWriter(Ledger.ROTATE_OBJECT);
        i.writeUint8(t / 5, e / 5),
        i.writeUint16(r),
        this._send(i)
    }
    flushObject(t, e) {
        const r = this._createWriter(Ledger.FLUSH_OBJECT);
        r.writeUint8(t / 5, e / 5),
        this._send(r)
    }
    completeObject(t, e) {
        const r = this._createWriter(Ledger.COMPLETE_OBJECT);
        r.writeUint8(t / 5, e / 5),
        this._send(r)
    }
    sessionStart() {
        const t = this._createWriter(Ledger.SESSION_START);
        this._send(t)
    }
    claimDrop(t, e, r=0) {
        const i = this._createWriter(Ledger.CLAIM_DROP);
        i.writeUint16(t),
        i.writeUint32(r);
        const s = Object.keys(e);
        i.writeUint8(s.length);
        for (const t of s) {
            const r = e[t];
            i.writeUint16(Game.craftData[t].Id),
            i.writeUint8(r.length);
            for (const t of r)
                i.writeUint8(t.x / 5, t.z / 5, t.amount)
        }
        this._send(i)
    }
    townLoad() {
        const t = this._createWriter(Ledger.TOWN_LOAD);
        this._send(t)
    }
}
Ledger.SELL_OBJECT = "SO",
Ledger.BUY_OBJECT = "BO",
Ledger.ROTATE_OBJECT = "RO",
Ledger.FLUSH_OBJECT = "FO",
Ledger.COMPLETE_OBJECT = "CO",
Ledger.CRAFT_SELECT = "CC",
Ledger.TRADE_START = "TS",
Ledger.TRADE_END = "TC",
Ledger.UNIT_PICKUP = "UP",
Ledger.UNIT_STORE = "US",
Ledger.UNIT_DESTROY = "UD",
Ledger.UNIT_HOME = "UR",
Ledger.LABOR_COST = "LC",
Ledger.JIMMY_CONFIGURE = "JC",
Ledger.JIMMY_SEND = "JS",
Ledger.JIMMY_RECEIVE = "JR",
Ledger.SESSION_START = "S+",
Ledger.CLAIM_DROP = "CD",
Ledger.TOWN_LOAD = "TL",
Ledger.prototype.log = logger({
    context: "Ledger",
    color: "gold",
    timing: !0
});
const LEDGER = new Ledger;
var GLOBALDIV, PlayerConfirm = pc.createScript("playerConfirm");
PlayerConfirm.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
PlayerConfirm.prototype.initialize = function() {
    this.isOpen = !1,
    PhaseManager.instance.onPhaseChanged(PhaseManager.GameOver, (()=>{
        this.div.style.display = "none"
    }
    )),
    this.div = document.createElement("div"),
    this.div.classList.add("playerconfirm-container"),
    this.div.style.pointerEvents = "none",
    this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.div.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.div.addEventListener("contextmenu", (e=>(e.preventDefault(),
    !1))),
    this.div.innerHTML = this.html.resource,
    GLOBALDIV = this.div;
    let e = this.div.getElementsByClassName("dialog-cell");
    for (let t = 0; t < e.length; t++)
        e[t].style.display = "none";
    document.body.appendChild(this.div),
    this.nukeTown = this.div.querySelector("#NukeTown"),
    this.nukeTown.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.nukeTown.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.nukeTown.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.nukeTown.addEventListener("click", (e=>e.stopPropagation()));
    let t = this.nukeTown.getElementsByClassName("no")[0];
    t.addEventListener("mousedown", (e=>e.stopPropagation())),
    t.addEventListener("mouseup", (e=>e.stopPropagation())),
    t.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    t.addEventListener("click", (e=>{
        this.OpenNukeDialog(),
        e.stopPropagation()
    }
    ));
    let n = this.nukeTown.getElementsByClassName("yes")[0];
    n.addEventListener("mousedown", (e=>e.stopPropagation())),
    n.addEventListener("mouseup", (e=>e.stopPropagation())),
    n.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    n.addEventListener("click", (e=>{
        this.CloseUI()
    }
    ));
    let o = this.nukeTown.getElementsByClassName("close-button")[0];
    o.addEventListener("mousedown", (e=>e.stopPropagation())),
    o.addEventListener("mouseup", (e=>e.stopPropagation())),
    o.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    o.addEventListener("click", (e=>{
        this.CloseUI()
    }
    )),
    this.NukeTownConfirm = this.div.querySelector("#NukeTownConfirm"),
    this.NukeTownConfirm.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.NukeTownConfirm.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.NukeTownConfirm.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.NukeTownConfirm.addEventListener("click", (e=>e.stopPropagation())),
    o = this.NukeTownConfirm.getElementsByClassName("close-button")[0],
    o.addEventListener("mousedown", (e=>e.stopPropagation())),
    o.addEventListener("mouseup", (e=>e.stopPropagation())),
    o.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    o.addEventListener("click", (e=>{
        this.CloseUI()
    }
    )),
    this.returnInventory = this.div.querySelector("#Return-To-Inventory"),
    this.returnInventory.addEventListener("mousedown", (e=>{
        e.stopPropagation()
    }
    )),
    this.returnInventory.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.returnInventory.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.returnInventory.addEventListener("click", (e=>{
        e.stopPropagation()
    }
    )),
    o = this.returnInventory.getElementsByClassName("close-button")[0],
    o.addEventListener("mousedown", (e=>e.stopPropagation())),
    o.addEventListener("mouseup", (e=>e.stopPropagation())),
    o.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    o.addEventListener("click", (e=>{
        this.CloseUI()
    }
    )),
    t = this.returnInventory.querySelector(".yes"),
    t.addEventListener("mousedown", (e=>e.stopPropagation())),
    t.addEventListener("mouseup", (e=>e.stopPropagation())),
    t.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    t.addEventListener("click", (e=>{
        const t = Game.town.GetObjectAt(this.x, this.z);
        if (t) {
            const {logicType: e, objData: n, townX: o, townZ: i, type: s} = t;
            Game.town.RemoveObject(o, i),
            LEDGER.sellObject(o, i),
            API.event("nft_return", {
                blockchainId: n.BlockChainID,
                itemName: s,
                unitType: e
            })
        }
        this.CloseUI(),
        e.stopPropagation()
    }
    )),
    this.confirmButton = this.NukeTownConfirm.getElementsByClassName("confirm-button")[0],
    this.confirmButton.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.confirmButton.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.confirmButton.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.confirmButton.addEventListener("click", (e=>{
        this.LaunchNuke()
    }
    )),
    this.confirmButton.disabled = !0,
    this.launchInput = this.NukeTownConfirm.querySelector("input"),
    this.launchInput.addEventListener("input", this.TestLaunchCode.bind(this)),
    this.JimmyRequest = this.div.querySelector("#Deliver-Request"),
    this.JimmyRequest.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.JimmyRequest.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.JimmyRequest.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.JimmyRequest.addEventListener("click", (e=>e.stopPropagation())),
    t = this.JimmyRequest.getElementsByClassName("no")[0],
    t.addEventListener("mousedown", (e=>e.stopPropagation())),
    t.addEventListener("mouseup", (e=>e.stopPropagation())),
    t.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    t.addEventListener("click", (e=>{
        console.log("Decline Button");
        let t = Game.town.conveyors.incoming.find((e=>e.conveyorId == this.conveyorId))
          , n = Game.town.conveyors.incoming.filter((e=>e.userId == t.userId));
        for (let e in n)
            API.rejectConveyor(this.conveyorId),
            n[e].state = "rejected";
        this.CloseUI(),
        t = Game.town.conveyors.incoming.find((e=>"pending" == e.state)),
        t && Game.app.fire("OpenJimmyDialog", t.conveyorId)
    }
    )),
    n = this.JimmyRequest.getElementsByClassName("yes")[0],
    n.addEventListener("mousedown", (e=>e.stopPropagation())),
    n.addEventListener("mouseup", (e=>e.stopPropagation())),
    n.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    n.addEventListener("click", (e=>{
        console.log("Accept Button");
        let t = Game.town.conveyors.incoming.find((e=>e.conveyorId == this.conveyorId))
          , n = Game.town.conveyors.incoming.filter((e=>e.userId == t.userId));
        console.log(`Found ${n.length} conveyors`);
        for (let e in n)
            API.acceptConveyor(n[e].conveyorId),
            n[e].state = "accepted";
        Game.town.SpawnDeliveryManageIcon(t.incomingCardinalDirection, t.userId),
        this.CloseUI(),
        t = Game.town.conveyors.incoming.find((e=>"pending" == e.state)),
        t && Game.app.fire("OpenJimmyDialog", t.conveyorId)
    }
    )),
    o = this.JimmyRequest.getElementsByClassName("close-button")[0],
    o.addEventListener("mousedown", (e=>e.stopPropagation())),
    o.addEventListener("mouseup", (e=>e.stopPropagation())),
    o.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    o.addEventListener("click", (e=>{
        console.log("Close Button"),
        this.CloseUI()
    }
    )),
    this.JimmyRequestRejectDialog = this.div.querySelector("#Deliver-Request-Rejected"),
    this.JimmyRequestRejectDialog.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.JimmyRequestRejectDialog.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.JimmyRequestRejectDialog.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.JimmyRequestRejectDialog.addEventListener("click", (e=>e.stopPropagation())),
    t = this.JimmyRequestRejectDialog.getElementsByClassName("yes")[0],
    t.addEventListener("mousedown", (e=>e.stopPropagation())),
    t.addEventListener("mouseup", (e=>e.stopPropagation())),
    t.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    t.addEventListener("click", (e=>{
        console.log("Accept Button"),
        this.callBack && (this.callBack(),
        this.callBack = null),
        this.CloseUI()
    }
    )),
    o = this.JimmyRequestRejectDialog.getElementsByClassName("close-button")[0],
    o.addEventListener("mousedown", (e=>e.stopPropagation())),
    o.addEventListener("mouseup", (e=>e.stopPropagation())),
    o.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    o.addEventListener("click", (e=>{
        console.log("Close Button"),
        this.CloseUI()
    }
    )),
    this.app.on("NukeTownTapped", this.OpenUI.bind(this)),
    this.app.on("ConfirmReturn", this.OpenReturnUI.bind(this)),
    this.app.on("OpenJimmyDialog", this.OpenJimmyDialog.bind(this)),
    this.app.on("OpenJimmyRejectDialog", this.OpenJimmyRejectDialog.bind(this)),
    this.app.on("WorldTappedOther", this.CloseUI.bind(this)),
    this.app.on("SetTownView", this.CloseUI.bind(this)),
    this.app.on("RealtimeConveyorState", this.RTUpdateConveyors, this)
}
,
PlayerConfirm.prototype.RTUpdateConveyors = function(e) {
    this.isOpen && e.conveyorId == this.conveyorId && this.CloseUI()
}
,
PlayerConfirm.prototype.LaunchNuke = function(e) {
    "6583" == this.launchInput.value && Game.Nuke()
}
,
PlayerConfirm.prototype.OpenJimmyDialog = function(e) {
    if (this.isOpen)
        return;
    this.conveyorId = e;
    let t = Game.town.conveyors.incoming.find((t=>t.conveyorId == e));
    t ? API.getGameUser(t.userId).then((e=>{
        console.log(e),
        this.JimmyRequest.querySelector("#player-name").innerHTML = e.name,
        this.div.style.pointerEvents = "auto",
        this.JimmyRequest.style = "display: block",
        this.currentDialog = this.JimmyRequest,
        Game.app.fire("hud-disable"),
        Game.app.fire("objectmenu-disable"),
        this.isOpen = !0
    }
    )) : console.log("Can not find conveyor Id")
}
,
PlayerConfirm.prototype.OpenJimmyRejectDialog = function(e) {
    if (this.isOpen)
        return;
    e.action && (this.action = e.action);
    let t = this.JimmyRequestRejectDialog.querySelector("#ReqRejected-Msg");
    t && (t.innerHTML = e.msg),
    this.div.style.pointerEvents = "auto",
    this.JimmyRequestRejectDialog.style = "display: block",
    this.currentDialog = this.JimmyRequestRejectDialog,
    Game.app.fire("hud-disable"),
    Game.app.fire("objectmenu-disable"),
    this.isOpen = !0
}
,
PlayerConfirm.prototype.TestLaunchCode = function(e) {
    "6583" == this.launchInput.value ? this.confirmButton.disabled = !1 : this.confirmButton.disabled = !0
}
,
PlayerConfirm.prototype.OpenNukeDialog = function() {
    console.log("Opening Nuke Dialog"),
    this.nukeTown.style = "display: none",
    this.div.style.pointerEvents = "auto",
    this.NukeTownConfirm.style = "display: block",
    this.currentDialog = this.NukeTownConfirm,
    this.launchInput.value = "",
    UiTools.translateTextAssets(this.div)
}
,
PlayerConfirm.prototype.OpenReturnUI = function(e, t) {
    this.isOpen || (Game.app.fire("hud-disable"),
    Game.app.fire("objectmenu-disable"),
    this.x = e,
    this.z = t,
    this.div.style.pointerEvents = "auto",
    this.returnInventory.style = "display: block",
    this.currentDialog = this.returnInventory,
    this.isOpen = !0,
    UiTools.translateTextAssets(this.div))
}
,
PlayerConfirm.prototype.OpenUI = function() {
    this.isOpen || (console.log("Opening UI"),
    this.div.style.pointerEvents = "auto",
    this.nukeTown.style = "display: block",
    this.currentDialog = this.nukeTown,
    this.isOpen = !0,
    UiTools.translateTextAssets(this.div))
}
,
PlayerConfirm.prototype.CloseUI = function() {
    if (this.action && (console.log(this.action),
    "edge" == this.action.target.type)) {
        let e = [0, 0, 75, 75];
        if (this.action.target.position % 2 == 0) {
            let t = e[this.action.target.position];
            for (let e = 0; e <= 15; e++) {
                let n = Game.town.GetObjectAt(5 * e, t);
                n && n.entity.fire(this.action.event)
            }
        } else {
            let t = e[this.action.target.position];
            for (let e = 0; e <= 15; e++) {
                let n = Game.town.GetObjectAt(t, 5 * e);
                n && n.entity.fire(this.action.event)
            }
        }
    }
    this.action = null,
    this.isOpen && (Game.app.fire("hud-enable"),
    Game.app.fire("objectmenu-enable"),
    console.log("Closing UI"),
    this.div.style.pointerEvents = "none",
    this.currentDialog.style = "display: none",
    this.isOpen = !1)
}
;
var ConfirmLocationUI = pc.createScript("ConfirmLocationUI");
ConfirmLocationUI.prototype.initialize = function() {
    this.UI = new TS_ConfirmLocationUI({
        name: "confirmLocation.html",
        divClass: "confirmlocationui-container",
        fullScreenUI: !1
    })
}
;
class TS_ConfirmLocationUI extends TS_UIBase {
    Initialize() {
        Game.app.on("WorldTapped", (t=>{
            this.WorldTapped(t)
        }
        ));
        const t = this.div.querySelector(".confirm-buttons .yes")
          , i = this.div.querySelector(".confirm-buttons .no");
        t.addEventListener("click", (t=>{
            t.stopPropagation(),
            Game.app.fire("LocationConfirmed", this.touchLocation.x, this.touchLocation.y, this.pierSwap, this.tradeDir),
            this.CloseUI()
        }
        )),
        i.addEventListener("click", (t=>{
            t.stopPropagation(),
            this.CloseUI()
        }
        )),
        this.UpdateImagesAndTranslate()
    }
    OnOpen() {
        Game.app.fire("hud-disable"),
        Game.app.fire("toasterui-disable")
    }
    WorldTapped(t) {
        if (this.pierSwap = !1,
        this.tradeDir = 0,
        !UiWatcher.UiOpen() && PhaseManager.instance.phase === PhaseManager.TownLoadPhase && Game.TownDataResponseReceived && !Game.town && (this.CloseUI(),
        this.touchLocation = new pc.Vec2(parseInt(Math.round(t.point.x) - MapDataManager.offset.x),parseInt(Math.round(t.point.z) - MapDataManager.offset.z)),
        Game.world.GetTownOKAtPosition(this.touchLocation.x, this.touchLocation.y))) {
            let t = Game.world.GetTradePlacementData(this.touchLocation.x, this.touchLocation.y);
            t.townOk && (this.pierSwap = t.pierSwap,
            this.tradeDir = t.tradeDirection,
            API.getGameUserAtPosition(this.touchLocation.x, this.touchLocation.y).then((t=>{
                t || this.OpenUI()
            }
            )))
        }
    }
}
var ConfirmDialogUI = pc.createScript("ConfirmDialogUI");
ConfirmDialogUI.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
ConfirmDialogUI.prototype.initialize = function() {
    ConfirmDialogUI.instance = this,
    this.div = document.createElement("div"),
    this.div.classList.add("confirmdialogui-container"),
    document.body.appendChild(this.div),
    this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.div.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.on("enable", (()=>{
        this.div.style.display = "flex",
        UiTools.updateImageAssets(this.div),
        UiTools.translateTextAssets(this.div),
        Game.app.fire("hud-disable"),
        Game.app.fire("objectmenu-disable"),
        Game.app.fire("object-float-disable")
    }
    )),
    this.on("disable", (()=>{
        "none" !== this.div.style.display && (this.div.style.display = "none",
        this.app.fire("objectmenu-enable"),
        this.app.fire("object-float-enable"),
        Game.app.fire("hud-enable"),
        Game.app.fire("objectmenu-enable"),
        Game.app.fire("object-float-enable"))
    }
    )),
    this.app.on("ConfirmRemove", ((e,t)=>{
        this.confirmRemove(e, t)
    }
    )),
    this.app.on("ConfirmFlush", ((e,t)=>{
        this.confirmFlush(e, t)
    }
    )),
    this.nonObstacleEventsRegistered = !1,
    this.obstacleEventsRegistered = !1,
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    this.reload()
}
,
ConfirmDialogUI.prototype.reload = function() {
    this.log("reloading"),
    this.div.innerHTML = this.html.resource
}
,
ConfirmDialogUI.prototype.confirmFlush = function(e, t) {
    this.x = e,
    this.z = t,
    this.selectedObj = Game.town.GetObjectAt(e, t),
    this.nukeTownHtml = document.getElementById("NukeTown-confirm"),
    this.nukeTownConfirmHtml = document.getElementById("NukeTownConfirm-confirm"),
    this.removeItemHtml = document.getElementById("RemoveItem-confirm"),
    this.removeObstacleHtml = document.getElementById("RemoveObstacle-confirm"),
    this.flushStorageHtml = document.getElementById("FlushStorage-confirm"),
    this.nukeTownHtml.style.display = "none",
    this.nukeTownConfirmHtml.style.display = "none",
    this.removeItemHtml.style.display = "none",
    this.removeObstacleHtml.style.display = "none";
    this.app.fire("objectmenu-disable"),
    this.app.fire("object-float-disable"),
    this.flushStorageHtml.style.display = "block";
    const i = this.flushStorageHtml.querySelector(".yes")
      , o = this.flushStorageHtml.querySelector(".no")
      , s = this.flushStorageHtml.querySelector(".close-button")
      , onClose = ()=>{
        i.removeEventListener("click", onYes),
        o.removeEventListener("click", onClose),
        s.removeEventListener("click", onClose),
        this.fire("disable"),
        this.app.fire("objectmenu-enable"),
        this.app.fire("object-float-enable")
    }
      , onYes = ()=>{
        LEDGER.flushObject(e, t),
        this.selectedObj.logicObject.FlushStorage();
        const i = this.selectedObj.entity.getPosition();
        EntitySpawner.spawnObject("VFX_CraftDestroy", i.x, 0, i.z, Game.app.root),
        onClose()
    }
    ;
    i.addEventListener("click", onYes),
    o.addEventListener("click", onClose),
    s.addEventListener("click", onClose),
    this.fire("enable")
}
,
ConfirmDialogUI.prototype.confirmRemove = function(e, t) {
    this.x = e,
    this.z = t,
    this.selectedObj = Game.town.GetObjectAt(e, t),
    this.nukeTownHtml = document.getElementById("NukeTown-confirm"),
    this.nukeTownConfirmHtml = document.getElementById("NukeTownConfirm-confirm"),
    this.removeItemHtml = document.getElementById("RemoveItem-confirm"),
    this.removeObstacleHtml = document.getElementById("RemoveObstacle-confirm"),
    this.flushStorageHtml = document.getElementById("FlushStorage-confirm"),
    this.nukeTownHtml.style.display = "none",
    this.nukeTownConfirmHtml.style.display = "none",
    this.removeItemHtml.style.display = "none",
    this.removeObstacleHtml.style.display = "none",
    this.flushStorageHtml.style.display = "none";
    if (this.app.fire("objectmenu-disable"),
    this.app.fire("object-float-disable"),
    "Construction_Site" == this.selectedObj.type) {
        const e = this.selectedObj.GetData()
          , t = Game.objectData[e.type];
        return this.clearText = this.removeItemHtml.querySelector("h1"),
        this.clearAmount = this.removeItemHtml.querySelector("h3"),
        this.clearText.innerHTML = Grabbatron.formatString("8087_0", [Grabbatron.findId(e.type)]),
        this.removeAmount = t.BuildCost,
        this.yesButton = this.removeItemHtml.querySelector("button.yes"),
        Game.currency + this.removeAmount > 0 ? this.yesButton.classList.remove("disabled") : this.yesButton.classList.add("disabled"),
        this.nonObstacleEventsRegistered || (this.noButton = this.removeItemHtml.querySelector("button.no"),
        this.closeButton = this.removeItemHtml.querySelector("button.close-button"),
        this.yesButton.addEventListener("click", (e=>{
            e.stopPropagation(),
            this.yesClicked()
        }
        )),
        this.noButton.addEventListener("click", (e=>{
            e.stopPropagation(),
            this.noClicked()
        }
        )),
        this.closeButton.addEventListener("click", (e=>{
            e.stopPropagation(),
            this.noClicked()
        }
        )),
        this.nonObstacleEventsRegistered = !0),
        this.clearAmount.innerHTML = Math.abs(this.removeAmount).toLocaleString(),
        this.removeItemHtml.style.display = "",
        void this.fire("enable")
    }
    this.selectedObj.objData.DestroyCost >= 0 && (this.clearText = this.removeItemHtml.querySelector("h1"),
    this.clearAmount = this.removeItemHtml.querySelector("h3"),
    this.clearText.innerHTML = Grabbatron.formatString("8063_0", [Grabbatron.findId(this.selectedObj.type)]),
    this.removeAmount = this.selectedObj.objData.DestroyCost,
    this.yesButton = this.removeItemHtml.querySelector("button.yes"),
    Game.currency + this.removeAmount > 0 ? this.yesButton.classList.remove("disabled") : this.yesButton.classList.add("disabled"),
    this.nonObstacleEventsRegistered || (this.noButton = this.removeItemHtml.querySelector("button.no"),
    this.closeButton = this.removeItemHtml.querySelector("button.close-button"),
    this.yesButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.yesClicked()
    }
    )),
    this.noButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.noClicked()
    }
    )),
    this.closeButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.noClicked()
    }
    )),
    this.nonObstacleEventsRegistered = !0),
    this.clearAmount.innerHTML = Math.abs(this.removeAmount).toLocaleString(),
    this.removeItemHtml.style.display = "",
    this.fire("enable")),
    this.selectedObj.objData.DestroyCost < 0 && (this.clearText = this.removeObstacleHtml.querySelector("h1"),
    this.clearCurrencyAmount = this.removeObstacleHtml.querySelector("button.buy-currency span"),
    this.clearText.innerHTML = Grabbatron.formatString("8063_0", [Grabbatron.findId(this.selectedObj.objData.Name)]),
    this.removeAmount = this.selectedObj.objData.DestroyCost,
    this.currencyButton = this.removeObstacleHtml.querySelector("button.buy-currency"),
    Game.currency + this.removeAmount > 0 ? this.currencyButton.classList.remove("disabled") : this.currencyButton.classList.add("disabled"),
    this.obstacleEventsRegistered || (this.closeButton = this.removeObstacleHtml.querySelector("button.close-button"),
    this.goldButton = this.removeObstacleHtml.querySelector("button.buy-gold"),
    this.goldButton.style.display = "none",
    this.closeButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.closeClicked()
    }
    )),
    this.currencyButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.currencyClicked()
    }
    )),
    this.goldButton.addEventListener("click", (e=>{
        e.stopPropagation(),
        this.goldClicked()
    }
    )),
    this.obstacleEventsRegistered = !0),
    this.clearCurrencyAmount.innerHTML = Math.abs(this.removeAmount).toLocaleString(),
    this.removeObstacleHtml.style.display = "",
    this.fire("enable"))
}
,
ConfirmDialogUI.prototype.goldClicked = function(e, t) {
    this.fire("disable")
}
,
ConfirmDialogUI.prototype.currencyClicked = function() {
    this.app.fire("PlayerConfirmRemove", this.x, this.z),
    this.fire("disable"),
    this.app.fire("objectmenu-enable"),
    this.app.fire("object-float-enable")
}
,
ConfirmDialogUI.prototype.closeClicked = function() {
    this.fire("disable"),
    this.app.fire("objectmenu-enable"),
    this.app.fire("object-float-enable")
}
,
ConfirmDialogUI.prototype.yesClicked = function(e, t) {
    if ("Construction_Site" == this.selectedObj.type)
        return Game.addCurrency(this.removeAmount),
        Game.town.RemoveObject(this.x, this.z),
        LEDGER.sellObject(this.x, this.z),
        void this.fire("disable");
    this.app.fire("PlayerConfirmRemove", this.x, this.z),
    this.fire("disable"),
    this.app.fire("objectmenu-enable"),
    this.app.fire("object-float-enable")
}
,
ConfirmDialogUI.prototype.noClicked = function() {
    this.fire("disable"),
    this.app.fire("objectmenu-enable"),
    this.app.fire("object-float-enable")
}
;
var LostConnection = pc.createScript("lostConnection");
LostConnection.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
LostConnection.prototype.initialize = function() {
    this.app.on("InternetConnected", this.OnConnect.bind(this)),
    this.app.on("InternetConnectionLost", this.OnLoseConnection.bind(this))
}
,
LostConnection.prototype.OnConnect = function() {
    this.div && this.div.remove()
}
,
LostConnection.prototype.OnLoseConnection = function() {
    this.div = document.createElement("div"),
    this.div.classList.add("container"),
    document.body.appendChild(this.div),
    this.div.innerHTML = this.html.resource,
    UiTools.updateImageAssets(this.div)
}
;
var dof, dofPassThru, sample, Bokeh = pc.createScript("bokeh");
Bokeh.attributes.add("focalDepth", {
    type: "number"
}),
Bokeh.attributes.add("focalRange", {
    type: "number",
    min: 1
}),
Bokeh.attributes.add("focalZone", {
    type: "number",
    min: 0
}),
Bokeh.attributes.add("xRange", {
    type: "number",
    min: 0
}),
Bokeh.attributes.add("xZone", {
    type: "number",
    min: 0
}),
Bokeh.attributes.add("strength", {
    type: "number",
    min: 0,
    max: 1
}),
Bokeh.prototype.initialize = function() {
    var e = this.entity.camera
      , t = this;
    e.camera.requestDepthMap(),
    dof = this.app.assets.find("dof").resource,
    dofPassThru = this.app.assets.find("dofpassthru").resource,
    sample = this.app.assets.find("sample").resource;
    var a = this.effect = new DOFEffect(this.app.graphicsDevice);
    function updateEffect() {
        a.focalDepth = t.focalDepth,
        a.focalRange = t.focalRange,
        a.focalZone = t.focalZone,
        a.strength = t.strength,
        a.xRange = t.xRange,
        a.xZone = t.xZone
    }
    this.effect.camera = e,
    updateEffect(),
    e.postEffects.addEffect(a),
    this.on("attr", updateEffect)
}
,
Bokeh.prototype.update = function(e) {}
;
var SAMPLE_COUNT = 40;
function calculateBlurValues(e, t, a) {
    var r, s;
    for (r = 0,
    s = SAMPLE_COUNT / 2; r < s; r++) {
        var h, o, i = Math.random();
        h = Math.floor(Math.cos(2 * Math.PI * i) * r),
        o = Math.floor(Math.sin(2 * Math.PI * i) * r),
        e[4 * r] = h * t,
        e[4 * r + 1] = o * a,
        e[4 * r + 2] = h * -t,
        e[4 * r + 3] = o * -a
    }
}
function createTarget(e, t, a, r) {
    r = r || !1;
    var s = new pc.Texture(e,{
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        width: t,
        height: a
    });
    return s.minFilter = pc.FILTER_LINEAR,
    s.magFilter = pc.FILTER_LINEAR,
    s.addressU = pc.ADDRESS_CLAMP_TO_EDGE,
    s.addressV = pc.ADDRESS_CLAMP_TO_EDGE,
    new pc.RenderTarget(e,s,{
        depth: r
    })
}
function mirrorUv(e) {
    return e.addressU = pc.ADDRESS_MIRRORED_REPEAT,
    e.addressV = pc.ADDRESS_MIRRORED_REPEAT,
    e
}
var DOFEffect = pc.inherits((function(e) {
    var t = this.device = e;
    this.strength = 1,
    this.xRange = 4,
    this.xZone = .35,
    this.dofShader = pc.shaderChunks.createShaderFromCode(t, pc.shaderChunks.fullscreenQuadVS, dof, "dof"),
    this.doffPassThru = pc.shaderChunks.createShaderFromCode(t, pc.shaderChunks.fullscreenQuadVS, dofPassThru, "dofpass"),
    this.sample = pc.shaderChunks.createShaderFromCode(t, pc.shaderChunks.fullscreenQuadVS, sample, "sample"),
    this.sampleOffsets = new Float32Array(2 * SAMPLE_COUNT),
    this.downSample = mirrorUv(createTarget(t, t.width / 2, t.height / 2)),
    this.target = mirrorUv(createTarget(t, t.width / 2, t.height / 2))
}
), pc.PostEffect);
DOFEffect.prototype.configure = function() {
    var e = this.device;
    this._lastWidth === e.width && this._lastHeight === e.height || (this._lastWidth = e.width,
    this._lastHeight = e.height,
    calculateBlurValues(this.sampleOffsets, 1 / (e.width >> 1), 1 / (e.height >> 1)))
}
,
DOFEffect.prototype.render = function(e, t) {
    var a = this.device
      , r = a.scope
      , s = this.camera;
    if (s) {
        this.configure();
        var h = (this.focalDepth - s.nearClip) / (s.farClip - s.nearClip)
          , o = this.focalRange / (s.farClip - s.nearClip)
          , i = this.focalZone / (s.farClip - s.nearClip);
        r.resolve("uInputTexture").setValue(e.colorBuffer),
        pc.drawQuadWithShader(a, this.downSample, this.sample),
        r.resolve("uBlurOffsets[0]").setValue(this.sampleOffsets),
        r.resolve("uBlurTexture").setValue(this.downSample.colorBuffer),
        r.resolve("uFocus").setValue(h),
        r.resolve("uFocalZone").setValue(i),
        r.resolve("uFocalRange").setValue(o),
        r.resolve("uStrength").setValue(this.strength),
        r.resolve("uXRange").setValue(this.xRange),
        r.resolve("uXZone").setValue(this.xZone),
        pc.drawQuadWithShader(a, this.target, this.dofShader),
        r.resolve("uBlurTexture").setValue(this.target.colorBuffer),
        pc.drawQuadWithShader(a, this.downSample, this.dofShader),
        r.resolve("uBlurTexture").setValue(e.colorBuffer),
        r.resolve("uBlurredTexture").setValue(this.downSample.colorBuffer),
        pc.drawQuadWithShader(a, t, this.doffPassThru)
    }
}
;
pc.extend(pc, function() {
    var FxaaEffect = function(e) {
        var o = {
            aPosition: pc.SEMANTIC_POSITION
        }
          , r = ["attribute vec2 aPosition;", "", "void main(void)", "{", "    gl_Position = vec4(aPosition, 0.0, 1.0);", "}"].join("\n")
          , a = ["precision " + e.precision + " float;", "", "uniform sampler2D uColorBuffer;", "uniform vec2 uResolution;", "", "#define FXAA_REDUCE_MIN   (1.0/128.0)", "#define FXAA_REDUCE_MUL   (1.0/8.0)", "#define FXAA_SPAN_MAX     8.0", "", "void main()", "{", "    vec3 rgbNW = texture2D( uColorBuffer, ( gl_FragCoord.xy + vec2( -1.0, -1.0 ) ) * uResolution ).xyz;", "    vec3 rgbNE = texture2D( uColorBuffer, ( gl_FragCoord.xy + vec2( 1.0, -1.0 ) ) * uResolution ).xyz;", "    vec3 rgbSW = texture2D( uColorBuffer, ( gl_FragCoord.xy + vec2( -1.0, 1.0 ) ) * uResolution ).xyz;", "    vec3 rgbSE = texture2D( uColorBuffer, ( gl_FragCoord.xy + vec2( 1.0, 1.0 ) ) * uResolution ).xyz;", "    vec4 rgbaM  = texture2D( uColorBuffer,  gl_FragCoord.xy  * uResolution );", "    vec3 rgbM  = rgbaM.xyz;", "    float opacity  = rgbaM.w;", "", "    vec3 luma = vec3( 0.299, 0.587, 0.114 );", "", "    float lumaNW = dot( rgbNW, luma );", "    float lumaNE = dot( rgbNE, luma );", "    float lumaSW = dot( rgbSW, luma );", "    float lumaSE = dot( rgbSE, luma );", "    float lumaM  = dot( rgbM,  luma );", "    float lumaMin = min( lumaM, min( min( lumaNW, lumaNE ), min( lumaSW, lumaSE ) ) );", "    float lumaMax = max( lumaM, max( max( lumaNW, lumaNE) , max( lumaSW, lumaSE ) ) );", "", "    vec2 dir;", "    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));", "    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));", "", "    float dirReduce = max( ( lumaNW + lumaNE + lumaSW + lumaSE ) * ( 0.25 * FXAA_REDUCE_MUL ), FXAA_REDUCE_MIN );", "", "    float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );", "    dir = min( vec2( FXAA_SPAN_MAX, FXAA_SPAN_MAX), max( vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * uResolution;", "", "    vec3 rgbA = 0.5 * (", "        texture2D( uColorBuffer, gl_FragCoord.xy  * uResolution + dir * ( 1.0 / 3.0 - 0.5 ) ).xyz +", "        texture2D( uColorBuffer, gl_FragCoord.xy  * uResolution + dir * ( 2.0 / 3.0 - 0.5 ) ).xyz );", "", "    vec3 rgbB = rgbA * 0.5 + 0.25 * (", "        texture2D( uColorBuffer, gl_FragCoord.xy  * uResolution + dir * -0.5 ).xyz +", "        texture2D( uColorBuffer, gl_FragCoord.xy  * uResolution + dir * 0.5 ).xyz );", "", "    float lumaB = dot( rgbB, luma );", "", "    if ( ( lumaB < lumaMin ) || ( lumaB > lumaMax ) )", "    {", "        gl_FragColor = vec4( rgbA, opacity );", "    }", "    else", "    {", "        gl_FragColor = vec4( rgbB, opacity );", "    }", "}"].join("\n");
        this.fxaaShader = new pc.Shader(e,{
            attributes: o,
            vshader: r,
            fshader: a
        }),
        this.resolution = new Float32Array(2)
    };
    return (FxaaEffect = pc.inherits(FxaaEffect, pc.PostEffect)).prototype = pc.extend(FxaaEffect.prototype, {
        render: function(e, o, r) {
            var a = this.device
              , t = a.scope;
            this.resolution[0] = 1 / e.width,
            this.resolution[1] = 1 / e.height,
            t.resolve("uResolution").setValue(this.resolution),
            t.resolve("uColorBuffer").setValue(e.colorBuffer),
            pc.drawFullscreenQuad(a, o, this.vertexBuffer, this.fxaaShader, r)
        }
    }),
    {
        FxaaEffect: FxaaEffect
    }
}());
var Fxaa = pc.createScript("fxaa");
Fxaa.prototype.initialize = function() {
    this.effect = new pc.FxaaEffect(this.app.graphicsDevice);
    var e = this.entity.camera.postEffects;
    e.addEffect(this.effect),
    this.on("state", (function(o) {
        o ? e.addEffect(this.effect) : e.removeEffect(this.effect)
    }
    )),
    this.on("destroy", (function() {
        e.removeEffect(this.effect)
    }
    ))
}
;
pc.extend(pc, function() {
    function computeGaussian(e, t) {
        return 1 / Math.sqrt(2 * Math.PI * t) * Math.exp(-e * e / (2 * t * t))
    }
    function calculateBlurValues(e, t, s, o, r) {
        e[0] = computeGaussian(0, r),
        t[0] = 0,
        t[1] = 0;
        var i, a, l = e[0];
        for (i = 0,
        a = Math.floor(7.5); i < a; i++) {
            var u = computeGaussian(i + 1, r);
            e[2 * i] = u,
            e[2 * i + 1] = u,
            l += 2 * u;
            var h = 2 * i + 1.5;
            t[4 * i] = s * h,
            t[4 * i + 1] = o * h,
            t[4 * i + 2] = -s * h,
            t[4 * i + 3] = -o * h
        }
        for (i = 0,
        a = e.length; i < a; i++)
            e[i] /= l
    }
    var BloomEffect = function(e) {
        var t = {
            aPosition: pc.SEMANTIC_POSITION
        }
          , s = ["attribute vec2 aPosition;", "", "varying vec2 vUv0;", "", "void main(void)", "{", "    gl_Position = vec4(aPosition, 0.0, 1.0);", "    vUv0 = (aPosition + 1.0) * 0.5;", "}"].join("\n")
          , o = ["precision " + e.precision + " float;", "", "varying vec2 vUv0;", "", "uniform sampler2D uBaseTexture;", "uniform float uBloomThreshold;", "", "void main(void)", "{", "    vec4 color = texture2D(uBaseTexture, vUv0);", "", "    gl_FragColor = clamp((color - uBloomThreshold) / (1.0 - uBloomThreshold), 0.0, 1.0);", "}"].join("\n")
          , r = ["precision " + e.precision + " float;", "", "#define SAMPLE_COUNT 15", "", "varying vec2 vUv0;", "", "uniform sampler2D uBloomTexture;", "uniform vec2 uBlurOffsets[SAMPLE_COUNT];", "uniform float uBlurWeights[SAMPLE_COUNT];", "", "void main(void)", "{", "    vec4 color = vec4(0.0);", "    for (int i = 0; i < SAMPLE_COUNT; i++)", "    {", "        color += texture2D(uBloomTexture, vUv0 + uBlurOffsets[i]) * uBlurWeights[i];", "    }", "", "    gl_FragColor = color;", "}"].join("\n")
          , i = ["precision " + e.precision + " float;", "", "varying vec2 vUv0;", "", "uniform float uBloomEffectIntensity;", "uniform sampler2D uBaseTexture;", "uniform sampler2D uBloomTexture;", "", "void main(void)", "{", "    vec4 bloom = texture2D(uBloomTexture, vUv0) * uBloomEffectIntensity;", "    vec4 base = texture2D(uBaseTexture, vUv0);", "", "    base *= (1.0 - clamp(bloom, 0.0, 1.0));", "", "    gl_FragColor = base + bloom;", "}"].join("\n");
        this.extractShader = new pc.Shader(e,{
            attributes: t,
            vshader: s,
            fshader: o
        }),
        this.blurShader = new pc.Shader(e,{
            attributes: t,
            vshader: s,
            fshader: r
        }),
        this.combineShader = new pc.Shader(e,{
            attributes: t,
            vshader: s,
            fshader: i
        });
        var a = e.width
          , l = e.height;
        this.targets = [];
        for (var u = 0; u < 2; u++) {
            var h = new pc.Texture(e,{
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                width: a >> 1,
                height: l >> 1
            });
            h.minFilter = pc.FILTER_LINEAR,
            h.magFilter = pc.FILTER_LINEAR,
            h.addressU = pc.ADDRESS_CLAMP_TO_EDGE,
            h.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
            var n = new pc.RenderTarget(e,h,{
                depth: !1
            });
            this.targets.push(n)
        }
        this.bloomThreshold = .25,
        this.blurAmount = 4,
        this.bloomIntensity = 1.25,
        this.sampleWeights = new Float32Array(15),
        this.sampleOffsets = new Float32Array(30)
    };
    return (BloomEffect = pc.inherits(BloomEffect, pc.PostEffect)).prototype = pc.extend(BloomEffect.prototype, {
        render: function(e, t, s) {
            var o = this.device
              , r = o.scope;
            r.resolve("uBloomThreshold").setValue(this.bloomThreshold),
            r.resolve("uBaseTexture").setValue(e.colorBuffer),
            pc.drawFullscreenQuad(o, this.targets[0], this.vertexBuffer, this.extractShader),
            calculateBlurValues(this.sampleWeights, this.sampleOffsets, 1 / this.targets[1].width, 0, this.blurAmount),
            r.resolve("uBlurWeights[0]").setValue(this.sampleWeights),
            r.resolve("uBlurOffsets[0]").setValue(this.sampleOffsets),
            r.resolve("uBloomTexture").setValue(this.targets[0].colorBuffer),
            pc.drawFullscreenQuad(o, this.targets[1], this.vertexBuffer, this.blurShader),
            calculateBlurValues(this.sampleWeights, this.sampleOffsets, 0, 1 / this.targets[0].height, this.blurAmount),
            r.resolve("uBlurWeights[0]").setValue(this.sampleWeights),
            r.resolve("uBlurOffsets[0]").setValue(this.sampleOffsets),
            r.resolve("uBloomTexture").setValue(this.targets[1].colorBuffer),
            pc.drawFullscreenQuad(o, this.targets[0], this.vertexBuffer, this.blurShader),
            r.resolve("uBloomEffectIntensity").setValue(this.bloomIntensity),
            r.resolve("uBloomTexture").setValue(this.targets[0].colorBuffer),
            r.resolve("uBaseTexture").setValue(e.colorBuffer),
            pc.drawFullscreenQuad(o, t, this.vertexBuffer, this.combineShader, s)
        }
    }),
    {
        BloomEffect: BloomEffect
    }
}());
var Bloom = pc.createScript("bloom");
Bloom.attributes.add("bloomIntensity", {
    type: "number",
    default: 1,
    min: 0,
    title: "Intensity"
}),
Bloom.attributes.add("bloomThreshold", {
    type: "number",
    default: .25,
    min: 0,
    max: 1,
    precision: 2,
    title: "Threshold"
}),
Bloom.attributes.add("blurAmount", {
    type: "number",
    default: 4,
    min: 1,
    title: "Blur amount"
}),
Bloom.prototype.initialize = function() {
    this.effect = new pc.BloomEffect(this.app.graphicsDevice),
    this.effect.bloomThreshold = this.bloomThreshold,
    this.effect.blurAmount = this.blurAmount,
    this.effect.bloomIntensity = this.bloomIntensity;
    var e = this.entity.camera.postEffects;
    e.addEffect(this.effect),
    this.on("attr", (function(e, t) {
        this.effect[e] = t
    }
    ), this),
    this.on("state", (function(t) {
        t ? e.addEffect(this.effect) : e.removeEffect(this.effect)
    }
    )),
    this.on("destroy", (function() {
        e.removeEffect(this.effect)
    }
    ))
}
;
pc.extend(pc, function() {
    var BrightnessContrastEffect = function(t) {
        this.shader = new pc.Shader(t,{
            attributes: {
                aPosition: pc.SEMANTIC_POSITION
            },
            vshader: ["attribute vec2 aPosition;", "", "varying vec2 vUv0;", "", "void main(void)", "{", "    gl_Position = vec4(aPosition, 0.0, 1.0);", "    vUv0 = (aPosition.xy + 1.0) * 0.5;", "}"].join("\n"),
            fshader: ["precision " + t.precision + " float;", "uniform sampler2D uColorBuffer;", "uniform float uBrightness;", "uniform float uContrast;", "varying vec2 vUv0;", "void main() {", "gl_FragColor = texture2D( uColorBuffer, vUv0 );", "gl_FragColor.rgb += uBrightness;", "if (uContrast > 0.0) {", "gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) / (1.0 - uContrast) + 0.5;", "} else {", "gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (1.0 + uContrast) + 0.5;", "}", "}"].join("\n")
        }),
        this.brightness = 0,
        this.contrast = 0
    };
    return (BrightnessContrastEffect = pc.inherits(BrightnessContrastEffect, pc.PostEffect)).prototype = pc.extend(BrightnessContrastEffect.prototype, {
        render: function(t, e, r) {
            var s = this.device
              , i = s.scope;
            i.resolve("uBrightness").setValue(this.brightness),
            i.resolve("uContrast").setValue(this.contrast),
            i.resolve("uColorBuffer").setValue(t.colorBuffer),
            pc.drawFullscreenQuad(s, e, this.vertexBuffer, this.shader, r)
        }
    }),
    {
        BrightnessContrastEffect: BrightnessContrastEffect
    }
}());
var BrightnessContrast = pc.createScript("brightnessContrast");
BrightnessContrast.attributes.add("brightness", {
    type: "number",
    default: 0,
    min: -1,
    max: 1,
    precision: 5,
    title: "Brightness"
}),
BrightnessContrast.attributes.add("contrast", {
    type: "number",
    default: 0,
    min: -1,
    max: 1,
    precision: 5,
    title: "Contrast"
}),
BrightnessContrast.prototype.initialize = function() {
    this.effect = new pc.BrightnessContrastEffect(this.app.graphicsDevice),
    this.effect.brightness = this.brightness,
    this.effect.contrast = this.contrast,
    this.on("attr", (function(t, e) {
        this.effect[t] = e
    }
    ), this);
    var t = this.entity.camera.postEffects;
    t.addEffect(this.effect),
    this.on("state", (function(e) {
        e ? t.addEffect(this.effect) : t.removeEffect(this.effect)
    }
    )),
    this.on("destroy", (function() {
        t.removeEffect(this.effect)
    }
    ))
}
;
var SettingsUI = pc.createScript("settingsUi");
SettingsUI.prototype.initialize = function() {
    SettingsUI.instance = this,
    this.UI = new TS_SettingsUI({
        name: "settings.html",
        divClass: "container",
        fullScreenUI: !0
    }),
    console.log(this.UI)
}
;
class TS_SettingsUI extends TS_UIBase {
    onResize() {
        switch (SETTINGS.resolutionLevel) {
        case "HI":
            this.resizeCanvas(1);
            break;
        case "MED":
            this.resizeCanvas(.75);
            break;
        case "LOW":
            this.resizeCanvas(.5)
        }
    }
    resizeCanvas(t) {
        pc.app.setCanvasResolution("RESOLUTION_FIXED", Math.ceil(window.innerWidth * t), Math.ceil(window.innerHeight * t))
    }
    Initialize() {
        SettingsUI.instance.fire("Opened"),
        this.ReloadUI()
    }
    OnReload() {
        window.addEventListener("resize", (()=>this.onResize())),
        window.addEventListener("fullscreenchange", (()=>this.onResize())),
        this.closeButton = this.div.querySelector(".close-button"),
        this.lowButton = this.div.querySelector("#Settings-Low"),
        this.medButton = this.div.querySelector("#Settings-Med"),
        this.highButton = this.div.querySelector("#Settings-High"),
        this.galaButton = this.div.querySelector(".gala"),
        this.musicEnabledButton = this.div.querySelector(".music"),
        this.soundEffectsEnabledButton = this.div.querySelector(".sound-effects"),
        this.shadowsButton = this.div.querySelector(".settings-shadows"),
        this.antiAliasButton = this.div.querySelector(".settings-antialias"),
        this.fpsCounterButton = this.div.querySelector(".settings-fps"),
        this.statusOverlayButton = this.div.querySelector(".settings-status"),
        this.changeServerBtn = this.div.querySelector("#changeServerbtn"),
        this.newTownBtn = this.div.querySelector("#newTownbtn"),
        this.musicImage = this.div.querySelector(".music span img"),
        this.soundEffectsImage = this.div.querySelector(".sound-effects span img"),
        this.languageSelect = this.div.querySelector("#Settings-Language"),
        this.closeButton.addEventListener("click", (()=>this.CloseUI())),
        this.lowButton.addEventListener("click", (()=>{
            SETTINGS.resolutionLevel = "LOW",
            Game.app.root.findByTag("SnowParticleSys")[0].enabled = !1
        }
        )),
        this.medButton.addEventListener("click", (()=>{
            SETTINGS.resolutionLevel = "MED",
            Game.app.root.findByTag("SnowParticleSys")[0].enabled = !1
        }
        )),
        this.highButton.addEventListener("click", (()=>{
            SETTINGS.resolutionLevel = "HI",
            Game.app.root.findByTag("SnowParticleSys")[0].enabled = !0
        }
        )),
        this.shadowsButton.addEventListener("click", (()=>SETTINGS.showShadows = !SETTINGS.showShadows)),
        this.antiAliasButton.addEventListener("click", (()=>SETTINGS.antiAliasing = !SETTINGS.antiAliasing)),
        this.fpsCounterButton.addEventListener("click", (()=>SETTINGS.showFps = !SETTINGS.showFps)),
        this.musicEnabledButton.addEventListener("click", (()=>SETTINGS.musicEnabled = !SETTINGS.musicEnabled)),
        this.soundEffectsEnabledButton.addEventListener("click", (()=>SETTINGS.soundEffectsEnabled = !SETTINGS.soundEffectsEnabled)),
        this.languageSelect.addEventListener("change", (()=>{
            SETTINGS.language = this.languageSelect.value,
            this.ReloadUI()
        }
        )),
        this.statusOverlayButton.addEventListener("click", (()=>SETTINGS.statusOverlay = !SETTINGS.statusOverlay)),
        SETTINGS.onAndNow("resolutionLevel", (()=>{
            switch (this.onResize(),
            this.lowButton.classList.remove("selected"),
            this.medButton.classList.remove("selected"),
            this.highButton.classList.remove("selected"),
            SETTINGS.resolutionLevel) {
            case "LOW":
                this.lowButton.classList.add("selected");
                break;
            case "MED":
                this.medButton.classList.add("selected");
                break;
            case "HI":
                this.highButton.classList.add("selected")
            }
        }
        )),
        SETTINGS.onAndNow("antiAliasing", (()=>{
            this.antiAliasButton.querySelector("span").innerHTML = SETTINGS.antiAliasing ? "ON" : "OFF",
            this.antiAliasButton.setAttribute("data-active", SETTINGS.antiAliasing)
        }
        )),
        SETTINGS.onAndNow("showShadows", (()=>{
            this.shadowsButton.querySelector("span").innerHTML = SETTINGS.showShadows ? "ON" : "OFF",
            this.shadowsButton.setAttribute("data-active", SETTINGS.showShadows)
        }
        )),
        SETTINGS.onAndNow("statusOverlay", (()=>{
            this.statusOverlayButton.querySelector("span").innerHTML = SETTINGS.statusOverlay ? "ON" : "OFF",
            this.statusOverlayButton.setAttribute("data-active", SETTINGS.statusOverlay)
        }
        )),
        this.newTownBtn.addEventListener("click", (()=>{
            this.CloseUI(),
            Game.app.fire("NukeTownTapped")
        }
        )),
        this.changeServerBtn.addEventListener("click", (()=>{
            this.CloseUI(),
            ServerSelectUi.instance.UI.OpenUI()
        }
        )),
        SETTINGS.onAndNow("showFps", (()=>{
            this.fpsCounterButton.querySelector("span").innerHTML = SETTINGS.showFps ? "ON" : "OFF",
            this.fpsCounterButton.setAttribute("data-active", SETTINGS.showFps)
        }
        )),
        SETTINGS.onAndNow("language", (()=>this.languageSelect.value = SETTINGS.language)),
        SETTINGS.onAndNow("musicEnabled", (()=>{
            this.musicImage.dataset.srcAssetName = `icon_music${SETTINGS.musicEnabled ? "On" : "Off"}.png`,
            this.musicEnabledButton.classList[SETTINGS.musicEnabled ? "add" : "remove"]("selected"),
            this.UpdateImagesAndTranslate()
        }
        )),
        SETTINGS.onAndNow("soundEffectsEnabled", (()=>{
            this.soundEffectsImage.dataset.srcAssetName = `icon_sound${SETTINGS.soundEffectsEnabled ? "On" : "Off"}.png`,
            this.soundEffectsEnabledButton.classList[SETTINGS.soundEffectsEnabled ? "add" : "remove"]("selected"),
            this.UpdateImagesAndTranslate()
        }
        )),
        this.galaButton.addEventListener("click", (()=>{
            IFRAME.within ? IFRAME.close() : window.location.href = "https://app.gala.games/"
        }
        )),
        this.UpdateImagesAndTranslate()
    }
}
// hammer.min.js
/*! Hammer.JS - v2.0.8 - 2016-04-23
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
!function(a, b, c, d) {
    "use strict";
    function e(a, b, c) {
        return setTimeout(j(a, c), b)
    }
    function f(a, b, c) {
        return Array.isArray(a) ? (g(a, c[b], c),
        !0) : !1
    }
    function g(a, b, c) {
        var e;
        if (a)
            if (a.forEach)
                a.forEach(b, c);
            else if (a.length !== d)
                for (e = 0; e < a.length; )
                    b.call(c, a[e], e, a),
                    e++;
            else
                for (e in a)
                    a.hasOwnProperty(e) && b.call(c, a[e], e, a)
    }
    function h(b, c, d) {
        var e = "DEPRECATED METHOD: " + c + "\n" + d + " AT \n";
        return function() {
            var c = new Error("get-stack-trace")
              , d = c && c.stack ? c.stack.replace(/^[^\(]+?[\n$]/gm, "").replace(/^\s+at\s+/gm, "").replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@") : "Unknown Stack Trace"
              , f = a.console && (a.console.warn || a.console.log);
            return f && f.call(a.console, e, d),
            b.apply(this, arguments)
        }
    }
    function i(a, b, c) {
        var d, e = b.prototype;
        d = a.prototype = Object.create(e),
        d.constructor = a,
        d._super = e,
        c && la(d, c)
    }
    function j(a, b) {
        return function() {
            return a.apply(b, arguments)
        }
    }
    function k(a, b) {
        return typeof a == oa ? a.apply(b ? b[0] || d : d, b) : a
    }
    function l(a, b) {
        return a === d ? b : a
    }
    function m(a, b, c) {
        g(q(b), function(b) {
            a.addEventListener(b, c, !1)
        })
    }
    function n(a, b, c) {
        g(q(b), function(b) {
            a.removeEventListener(b, c, !1)
        })
    }
    function o(a, b) {
        for (; a; ) {
            if (a == b)
                return !0;
            a = a.parentNode
        }
        return !1
    }
    function p(a, b) {
        return a.indexOf(b) > -1
    }
    function q(a) {
        return a.trim().split(/\s+/g)
    }
    function r(a, b, c) {
        if (a.indexOf && !c)
            return a.indexOf(b);
        for (var d = 0; d < a.length; ) {
            if (c && a[d][c] == b || !c && a[d] === b)
                return d;
            d++
        }
        return -1
    }
    function s(a) {
        return Array.prototype.slice.call(a, 0)
    }
    function t(a, b, c) {
        for (var d = [], e = [], f = 0; f < a.length; ) {
            var g = b ? a[f][b] : a[f];
            r(e, g) < 0 && d.push(a[f]),
            e[f] = g,
            f++
        }
        return c && (d = b ? d.sort(function(a, c) {
            return a[b] > c[b]
        }) : d.sort()),
        d
    }
    function u(a, b) {
        for (var c, e, f = b[0].toUpperCase() + b.slice(1), g = 0; g < ma.length; ) {
            if (c = ma[g],
            e = c ? c + f : b,
            e in a)
                return e;
            g++
        }
        return d
    }
    function v() {
        return ua++
    }
    function w(b) {
        var c = b.ownerDocument || b;
        return c.defaultView || c.parentWindow || a
    }
    function x(a, b) {
        var c = this;
        this.manager = a,
        this.callback = b,
        this.element = a.element,
        this.target = a.options.inputTarget,
        this.domHandler = function(b) {
            k(a.options.enable, [a]) && c.handler(b)
        }
        ,
        this.init()
    }
    function y(a) {
        var b, c = a.options.inputClass;
        return new (b = c ? c : xa ? M : ya ? P : wa ? R : L)(a,z)
    }
    function z(a, b, c) {
        var d = c.pointers.length
          , e = c.changedPointers.length
          , f = b & Ea && d - e === 0
          , g = b & (Ga | Ha) && d - e === 0;
        c.isFirst = !!f,
        c.isFinal = !!g,
        f && (a.session = {}),
        c.eventType = b,
        A(a, c),
        a.emit("hammer.input", c),
        a.recognize(c),
        a.session.prevInput = c
    }
    function A(a, b) {
        var c = a.session
          , d = b.pointers
          , e = d.length;
        c.firstInput || (c.firstInput = D(b)),
        e > 1 && !c.firstMultiple ? c.firstMultiple = D(b) : 1 === e && (c.firstMultiple = !1);
        var f = c.firstInput
          , g = c.firstMultiple
          , h = g ? g.center : f.center
          , i = b.center = E(d);
        b.timeStamp = ra(),
        b.deltaTime = b.timeStamp - f.timeStamp,
        b.angle = I(h, i),
        b.distance = H(h, i),
        B(c, b),
        b.offsetDirection = G(b.deltaX, b.deltaY);
        var j = F(b.deltaTime, b.deltaX, b.deltaY);
        b.overallVelocityX = j.x,
        b.overallVelocityY = j.y,
        b.overallVelocity = qa(j.x) > qa(j.y) ? j.x : j.y,
        b.scale = g ? K(g.pointers, d) : 1,
        b.rotation = g ? J(g.pointers, d) : 0,
        b.maxPointers = c.prevInput ? b.pointers.length > c.prevInput.maxPointers ? b.pointers.length : c.prevInput.maxPointers : b.pointers.length,
        C(c, b);
        var k = a.element;
        o(b.srcEvent.target, k) && (k = b.srcEvent.target),
        b.target = k
    }
    function B(a, b) {
        var c = b.center
          , d = a.offsetDelta || {}
          , e = a.prevDelta || {}
          , f = a.prevInput || {};
        b.eventType !== Ea && f.eventType !== Ga || (e = a.prevDelta = {
            x: f.deltaX || 0,
            y: f.deltaY || 0
        },
        d = a.offsetDelta = {
            x: c.x,
            y: c.y
        }),
        b.deltaX = e.x + (c.x - d.x),
        b.deltaY = e.y + (c.y - d.y)
    }
    function C(a, b) {
        var c, e, f, g, h = a.lastInterval || b, i = b.timeStamp - h.timeStamp;
        if (b.eventType != Ha && (i > Da || h.velocity === d)) {
            var j = b.deltaX - h.deltaX
              , k = b.deltaY - h.deltaY
              , l = F(i, j, k);
            e = l.x,
            f = l.y,
            c = qa(l.x) > qa(l.y) ? l.x : l.y,
            g = G(j, k),
            a.lastInterval = b
        } else
            c = h.velocity,
            e = h.velocityX,
            f = h.velocityY,
            g = h.direction;
        b.velocity = c,
        b.velocityX = e,
        b.velocityY = f,
        b.direction = g
    }
    function D(a) {
        for (var b = [], c = 0; c < a.pointers.length; )
            b[c] = {
                clientX: pa(a.pointers[c].clientX),
                clientY: pa(a.pointers[c].clientY)
            },
            c++;
        return {
            timeStamp: ra(),
            pointers: b,
            center: E(b),
            deltaX: a.deltaX,
            deltaY: a.deltaY
        }
    }
    function E(a) {
        var b = a.length;
        if (1 === b)
            return {
                x: pa(a[0].clientX),
                y: pa(a[0].clientY)
            };
        for (var c = 0, d = 0, e = 0; b > e; )
            c += a[e].clientX,
            d += a[e].clientY,
            e++;
        return {
            x: pa(c / b),
            y: pa(d / b)
        }
    }
    function F(a, b, c) {
        return {
            x: b / a || 0,
            y: c / a || 0
        }
    }
    function G(a, b) {
        return a === b ? Ia : qa(a) >= qa(b) ? 0 > a ? Ja : Ka : 0 > b ? La : Ma
    }
    function H(a, b, c) {
        c || (c = Qa);
        var d = b[c[0]] - a[c[0]]
          , e = b[c[1]] - a[c[1]];
        return Math.sqrt(d * d + e * e)
    }
    function I(a, b, c) {
        c || (c = Qa);
        var d = b[c[0]] - a[c[0]]
          , e = b[c[1]] - a[c[1]];
        return 180 * Math.atan2(e, d) / Math.PI
    }
    function J(a, b) {
        return I(b[1], b[0], Ra) + I(a[1], a[0], Ra)
    }
    function K(a, b) {
        return H(b[0], b[1], Ra) / H(a[0], a[1], Ra)
    }
    function L() {
        this.evEl = Ta,
        this.evWin = Ua,
        this.pressed = !1,
        x.apply(this, arguments)
    }
    function M() {
        this.evEl = Xa,
        this.evWin = Ya,
        x.apply(this, arguments),
        this.store = this.manager.session.pointerEvents = []
    }
    function N() {
        this.evTarget = $a,
        this.evWin = _a,
        this.started = !1,
        x.apply(this, arguments)
    }
    function O(a, b) {
        var c = s(a.touches)
          , d = s(a.changedTouches);
        return b & (Ga | Ha) && (c = t(c.concat(d), "identifier", !0)),
        [c, d]
    }
    function P() {
        this.evTarget = bb,
        this.targetIds = {},
        x.apply(this, arguments)
    }
    function Q(a, b) {
        var c = s(a.touches)
          , d = this.targetIds;
        if (b & (Ea | Fa) && 1 === c.length)
            return d[c[0].identifier] = !0,
            [c, c];
        var e, f, g = s(a.changedTouches), h = [], i = this.target;
        if (f = c.filter(function(a) {
            return o(a.target, i)
        }),
        b === Ea)
            for (e = 0; e < f.length; )
                d[f[e].identifier] = !0,
                e++;
        for (e = 0; e < g.length; )
            d[g[e].identifier] && h.push(g[e]),
            b & (Ga | Ha) && delete d[g[e].identifier],
            e++;
        return h.length ? [t(f.concat(h), "identifier", !0), h] : void 0
    }
    function R() {
        x.apply(this, arguments);
        var a = j(this.handler, this);
        this.touch = new P(this.manager,a),
        this.mouse = new L(this.manager,a),
        this.primaryTouch = null,
        this.lastTouches = []
    }
    function S(a, b) {
        a & Ea ? (this.primaryTouch = b.changedPointers[0].identifier,
        T.call(this, b)) : a & (Ga | Ha) && T.call(this, b)
    }
    function T(a) {
        var b = a.changedPointers[0];
        if (b.identifier === this.primaryTouch) {
            var c = {
                x: b.clientX,
                y: b.clientY
            };
            this.lastTouches.push(c);
            var d = this.lastTouches
              , e = function() {
                var a = d.indexOf(c);
                a > -1 && d.splice(a, 1)
            };
            setTimeout(e, cb)
        }
    }
    function U(a) {
        for (var b = a.srcEvent.clientX, c = a.srcEvent.clientY, d = 0; d < this.lastTouches.length; d++) {
            var e = this.lastTouches[d]
              , f = Math.abs(b - e.x)
              , g = Math.abs(c - e.y);
            if (db >= f && db >= g)
                return !0
        }
        return !1
    }
    function V(a, b) {
        this.manager = a,
        this.set(b)
    }
    function W(a) {
        if (p(a, jb))
            return jb;
        var b = p(a, kb)
          , c = p(a, lb);
        return b && c ? jb : b || c ? b ? kb : lb : p(a, ib) ? ib : hb
    }
    function X() {
        if (!fb)
            return !1;
        var b = {}
          , c = a.CSS && a.CSS.supports;
        return ["auto", "manipulation", "pan-y", "pan-x", "pan-x pan-y", "none"].forEach(function(d) {
            b[d] = c ? a.CSS.supports("touch-action", d) : !0
        }),
        b
    }
    function Y(a) {
        this.options = la({}, this.defaults, a || {}),
        this.id = v(),
        this.manager = null,
        this.options.enable = l(this.options.enable, !0),
        this.state = nb,
        this.simultaneous = {},
        this.requireFail = []
    }
    function Z(a) {
        return a & sb ? "cancel" : a & qb ? "end" : a & pb ? "move" : a & ob ? "start" : ""
    }
    function $(a) {
        return a == Ma ? "down" : a == La ? "up" : a == Ja ? "left" : a == Ka ? "right" : ""
    }
    function _(a, b) {
        var c = b.manager;
        return c ? c.get(a) : a
    }
    function aa() {
        Y.apply(this, arguments)
    }
    function ba() {
        aa.apply(this, arguments),
        this.pX = null,
        this.pY = null
    }
    function ca() {
        aa.apply(this, arguments)
    }
    function da() {
        Y.apply(this, arguments),
        this._timer = null,
        this._input = null
    }
    function ea() {
        aa.apply(this, arguments)
    }
    function fa() {
        aa.apply(this, arguments)
    }
    function ga() {
        Y.apply(this, arguments),
        this.pTime = !1,
        this.pCenter = !1,
        this._timer = null,
        this._input = null,
        this.count = 0
    }
    function ha(a, b) {
        return b = b || {},
        b.recognizers = l(b.recognizers, ha.defaults.preset),
        new ia(a,b)
    }
    function ia(a, b) {
        this.options = la({}, ha.defaults, b || {}),
        this.options.inputTarget = this.options.inputTarget || a,
        this.handlers = {},
        this.session = {},
        this.recognizers = [],
        this.oldCssProps = {},
        this.element = a,
        this.input = y(this),
        this.touchAction = new V(this,this.options.touchAction),
        ja(this, !0),
        g(this.options.recognizers, function(a) {
            var b = this.add(new a[0](a[1]));
            a[2] && b.recognizeWith(a[2]),
            a[3] && b.requireFailure(a[3])
        }, this)
    }
    function ja(a, b) {
        var c = a.element;
        if (c.style) {
            var d;
            g(a.options.cssProps, function(e, f) {
                d = u(c.style, f),
                b ? (a.oldCssProps[d] = c.style[d],
                c.style[d] = e) : c.style[d] = a.oldCssProps[d] || ""
            }),
            b || (a.oldCssProps = {})
        }
    }
    function ka(a, c) {
        var d = b.createEvent("Event");
        d.initEvent(a, !0, !0),
        d.gesture = c,
        c.target.dispatchEvent(d)
    }
    var la, ma = ["", "webkit", "Moz", "MS", "ms", "o"], na = b.createElement("div"), oa = "function", pa = Math.round, qa = Math.abs, ra = Date.now;
    la = "function" != typeof Object.assign ? function(a) {
        if (a === d || null === a)
            throw new TypeError("Cannot convert undefined or null to object");
        for (var b = Object(a), c = 1; c < arguments.length; c++) {
            var e = arguments[c];
            if (e !== d && null !== e)
                for (var f in e)
                    e.hasOwnProperty(f) && (b[f] = e[f])
        }
        return b
    }
    : Object.assign;
    var sa = h(function(a, b, c) {
        for (var e = Object.keys(b), f = 0; f < e.length; )
            (!c || c && a[e[f]] === d) && (a[e[f]] = b[e[f]]),
            f++;
        return a
    }, "extend", "Use `assign`.")
      , ta = h(function(a, b) {
        return sa(a, b, !0)
    }, "merge", "Use `assign`.")
      , ua = 1
      , va = /mobile|tablet|ip(ad|hone|od)|android/i
      , wa = "ontouchstart"in a
      , xa = u(a, "PointerEvent") !== d
      , ya = wa && va.test(navigator.userAgent)
      , za = "touch"
      , Aa = "pen"
      , Ba = "mouse"
      , Ca = "kinect"
      , Da = 25
      , Ea = 1
      , Fa = 2
      , Ga = 4
      , Ha = 8
      , Ia = 1
      , Ja = 2
      , Ka = 4
      , La = 8
      , Ma = 16
      , Na = Ja | Ka
      , Oa = La | Ma
      , Pa = Na | Oa
      , Qa = ["x", "y"]
      , Ra = ["clientX", "clientY"];
    x.prototype = {
        handler: function() {},
        init: function() {
            this.evEl && m(this.element, this.evEl, this.domHandler),
            this.evTarget && m(this.target, this.evTarget, this.domHandler),
            this.evWin && m(w(this.element), this.evWin, this.domHandler)
        },
        destroy: function() {
            this.evEl && n(this.element, this.evEl, this.domHandler),
            this.evTarget && n(this.target, this.evTarget, this.domHandler),
            this.evWin && n(w(this.element), this.evWin, this.domHandler)
        }
    };
    var Sa = {
        mousedown: Ea,
        mousemove: Fa,
        mouseup: Ga
    }
      , Ta = "mousedown"
      , Ua = "mousemove mouseup";
    i(L, x, {
        handler: function(a) {
            var b = Sa[a.type];
            b & Ea && 0 === a.button && (this.pressed = !0),
            b & Fa && 1 !== a.which && (b = Ga),
            this.pressed && (b & Ga && (this.pressed = !1),
            this.callback(this.manager, b, {
                pointers: [a],
                changedPointers: [a],
                pointerType: Ba,
                srcEvent: a
            }))
        }
    });
    var Va = {
        pointerdown: Ea,
        pointermove: Fa,
        pointerup: Ga,
        pointercancel: Ha,
        pointerout: Ha
    }
      , Wa = {
        2: za,
        3: Aa,
        4: Ba,
        5: Ca
    }
      , Xa = "pointerdown"
      , Ya = "pointermove pointerup pointercancel";
    a.MSPointerEvent && !a.PointerEvent && (Xa = "MSPointerDown",
    Ya = "MSPointerMove MSPointerUp MSPointerCancel"),
    i(M, x, {
        handler: function(a) {
            var b = this.store
              , c = !1
              , d = a.type.toLowerCase().replace("ms", "")
              , e = Va[d]
              , f = Wa[a.pointerType] || a.pointerType
              , g = f == za
              , h = r(b, a.pointerId, "pointerId");
            e & Ea && (0 === a.button || g) ? 0 > h && (b.push(a),
            h = b.length - 1) : e & (Ga | Ha) && (c = !0),
            0 > h || (b[h] = a,
            this.callback(this.manager, e, {
                pointers: b,
                changedPointers: [a],
                pointerType: f,
                srcEvent: a
            }),
            c && b.splice(h, 1))
        }
    });
    var Za = {
        touchstart: Ea,
        touchmove: Fa,
        touchend: Ga,
        touchcancel: Ha
    }
      , $a = "touchstart"
      , _a = "touchstart touchmove touchend touchcancel";
    i(N, x, {
        handler: function(a) {
            var b = Za[a.type];
            if (b === Ea && (this.started = !0),
            this.started) {
                var c = O.call(this, a, b);
                b & (Ga | Ha) && c[0].length - c[1].length === 0 && (this.started = !1),
                this.callback(this.manager, b, {
                    pointers: c[0],
                    changedPointers: c[1],
                    pointerType: za,
                    srcEvent: a
                })
            }
        }
    });
    var ab = {
        touchstart: Ea,
        touchmove: Fa,
        touchend: Ga,
        touchcancel: Ha
    }
      , bb = "touchstart touchmove touchend touchcancel";
    i(P, x, {
        handler: function(a) {
            var b = ab[a.type]
              , c = Q.call(this, a, b);
            c && this.callback(this.manager, b, {
                pointers: c[0],
                changedPointers: c[1],
                pointerType: za,
                srcEvent: a
            })
        }
    });
    var cb = 2500
      , db = 25;
    i(R, x, {
        handler: function(a, b, c) {
            var d = c.pointerType == za
              , e = c.pointerType == Ba;
            if (!(e && c.sourceCapabilities && c.sourceCapabilities.firesTouchEvents)) {
                if (d)
                    S.call(this, b, c);
                else if (e && U.call(this, c))
                    return;
                this.callback(a, b, c)
            }
        },
        destroy: function() {
            this.touch.destroy(),
            this.mouse.destroy()
        }
    });
    var eb = u(na.style, "touchAction")
      , fb = eb !== d
      , gb = "compute"
      , hb = "auto"
      , ib = "manipulation"
      , jb = "none"
      , kb = "pan-x"
      , lb = "pan-y"
      , mb = X();
    V.prototype = {
        set: function(a) {
            a == gb && (a = this.compute()),
            fb && this.manager.element.style && mb[a] && (this.manager.element.style[eb] = a),
            this.actions = a.toLowerCase().trim()
        },
        update: function() {
            this.set(this.manager.options.touchAction)
        },
        compute: function() {
            var a = [];
            return g(this.manager.recognizers, function(b) {
                k(b.options.enable, [b]) && (a = a.concat(b.getTouchAction()))
            }),
            W(a.join(" "))
        },
        preventDefaults: function(a) {
            var b = a.srcEvent
              , c = a.offsetDirection;
            if (this.manager.session.prevented)
                return void b.preventDefault();
            var d = this.actions
              , e = p(d, jb) && !mb[jb]
              , f = p(d, lb) && !mb[lb]
              , g = p(d, kb) && !mb[kb];
            if (e) {
                var h = 1 === a.pointers.length
                  , i = a.distance < 2
                  , j = a.deltaTime < 250;
                if (h && i && j)
                    return
            }
            return g && f ? void 0 : e || f && c & Na || g && c & Oa ? this.preventSrc(b) : void 0
        },
        preventSrc: function(a) {
            this.manager.session.prevented = !0,
            a.preventDefault()
        }
    };
    var nb = 1
      , ob = 2
      , pb = 4
      , qb = 8
      , rb = qb
      , sb = 16
      , tb = 32;
    Y.prototype = {
        defaults: {},
        set: function(a) {
            return la(this.options, a),
            this.manager && this.manager.touchAction.update(),
            this
        },
        recognizeWith: function(a) {
            if (f(a, "recognizeWith", this))
                return this;
            var b = this.simultaneous;
            return a = _(a, this),
            b[a.id] || (b[a.id] = a,
            a.recognizeWith(this)),
            this
        },
        dropRecognizeWith: function(a) {
            return f(a, "dropRecognizeWith", this) ? this : (a = _(a, this),
            delete this.simultaneous[a.id],
            this)
        },
        requireFailure: function(a) {
            if (f(a, "requireFailure", this))
                return this;
            var b = this.requireFail;
            return a = _(a, this),
            -1 === r(b, a) && (b.push(a),
            a.requireFailure(this)),
            this
        },
        dropRequireFailure: function(a) {
            if (f(a, "dropRequireFailure", this))
                return this;
            a = _(a, this);
            var b = r(this.requireFail, a);
            return b > -1 && this.requireFail.splice(b, 1),
            this
        },
        hasRequireFailures: function() {
            return this.requireFail.length > 0
        },
        canRecognizeWith: function(a) {
            return !!this.simultaneous[a.id]
        },
        emit: function(a) {
            function b(b) {
                c.manager.emit(b, a)
            }
            var c = this
              , d = this.state;
            qb > d && b(c.options.event + Z(d)),
            b(c.options.event),
            a.additionalEvent && b(a.additionalEvent),
            d >= qb && b(c.options.event + Z(d))
        },
        tryEmit: function(a) {
            return this.canEmit() ? this.emit(a) : void (this.state = tb)
        },
        canEmit: function() {
            for (var a = 0; a < this.requireFail.length; ) {
                if (!(this.requireFail[a].state & (tb | nb)))
                    return !1;
                a++
            }
            return !0
        },
        recognize: function(a) {
            var b = la({}, a);
            return k(this.options.enable, [this, b]) ? (this.state & (rb | sb | tb) && (this.state = nb),
            this.state = this.process(b),
            void (this.state & (ob | pb | qb | sb) && this.tryEmit(b))) : (this.reset(),
            void (this.state = tb))
        },
        process: function(a) {},
        getTouchAction: function() {},
        reset: function() {}
    },
    i(aa, Y, {
        defaults: {
            pointers: 1
        },
        attrTest: function(a) {
            var b = this.options.pointers;
            return 0 === b || a.pointers.length === b
        },
        process: function(a) {
            var b = this.state
              , c = a.eventType
              , d = b & (ob | pb)
              , e = this.attrTest(a);
            return d && (c & Ha || !e) ? b | sb : d || e ? c & Ga ? b | qb : b & ob ? b | pb : ob : tb
        }
    }),
    i(ba, aa, {
        defaults: {
            event: "pan",
            threshold: 10,
            pointers: 1,
            direction: Pa
        },
        getTouchAction: function() {
            var a = this.options.direction
              , b = [];
            return a & Na && b.push(lb),
            a & Oa && b.push(kb),
            b
        },
        directionTest: function(a) {
            var b = this.options
              , c = !0
              , d = a.distance
              , e = a.direction
              , f = a.deltaX
              , g = a.deltaY;
            return e & b.direction || (b.direction & Na ? (e = 0 === f ? Ia : 0 > f ? Ja : Ka,
            c = f != this.pX,
            d = Math.abs(a.deltaX)) : (e = 0 === g ? Ia : 0 > g ? La : Ma,
            c = g != this.pY,
            d = Math.abs(a.deltaY))),
            a.direction = e,
            c && d > b.threshold && e & b.direction
        },
        attrTest: function(a) {
            return aa.prototype.attrTest.call(this, a) && (this.state & ob || !(this.state & ob) && this.directionTest(a))
        },
        emit: function(a) {
            this.pX = a.deltaX,
            this.pY = a.deltaY;
            var b = $(a.direction);
            b && (a.additionalEvent = this.options.event + b),
            this._super.emit.call(this, a)
        }
    }),
    i(ca, aa, {
        defaults: {
            event: "pinch",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [jb]
        },
        attrTest: function(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.scale - 1) > this.options.threshold || this.state & ob)
        },
        emit: function(a) {
            if (1 !== a.scale) {
                var b = a.scale < 1 ? "in" : "out";
                a.additionalEvent = this.options.event + b
            }
            this._super.emit.call(this, a)
        }
    }),
    i(da, Y, {
        defaults: {
            event: "press",
            pointers: 1,
            time: 251,
            threshold: 9
        },
        getTouchAction: function() {
            return [hb]
        },
        process: function(a) {
            var b = this.options
              , c = a.pointers.length === b.pointers
              , d = a.distance < b.threshold
              , f = a.deltaTime > b.time;
            if (this._input = a,
            !d || !c || a.eventType & (Ga | Ha) && !f)
                this.reset();
            else if (a.eventType & Ea)
                this.reset(),
                this._timer = e(function() {
                    this.state = rb,
                    this.tryEmit()
                }, b.time, this);
            else if (a.eventType & Ga)
                return rb;
            return tb
        },
        reset: function() {
            clearTimeout(this._timer)
        },
        emit: function(a) {
            this.state === rb && (a && a.eventType & Ga ? this.manager.emit(this.options.event + "up", a) : (this._input.timeStamp = ra(),
            this.manager.emit(this.options.event, this._input)))
        }
    }),
    i(ea, aa, {
        defaults: {
            event: "rotate",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [jb]
        },
        attrTest: function(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.rotation) > this.options.threshold || this.state & ob)
        }
    }),
    i(fa, aa, {
        defaults: {
            event: "swipe",
            threshold: 10,
            velocity: .3,
            direction: Na | Oa,
            pointers: 1
        },
        getTouchAction: function() {
            return ba.prototype.getTouchAction.call(this)
        },
        attrTest: function(a) {
            var b, c = this.options.direction;
            return c & (Na | Oa) ? b = a.overallVelocity : c & Na ? b = a.overallVelocityX : c & Oa && (b = a.overallVelocityY),
            this._super.attrTest.call(this, a) && c & a.offsetDirection && a.distance > this.options.threshold && a.maxPointers == this.options.pointers && qa(b) > this.options.velocity && a.eventType & Ga
        },
        emit: function(a) {
            var b = $(a.offsetDirection);
            b && this.manager.emit(this.options.event + b, a),
            this.manager.emit(this.options.event, a)
        }
    }),
    i(ga, Y, {
        defaults: {
            event: "tap",
            pointers: 1,
            taps: 1,
            interval: 300,
            time: 250,
            threshold: 9,
            posThreshold: 10
        },
        getTouchAction: function() {
            return [ib]
        },
        process: function(a) {
            var b = this.options
              , c = a.pointers.length === b.pointers
              , d = a.distance < b.threshold
              , f = a.deltaTime < b.time;
            if (this.reset(),
            a.eventType & Ea && 0 === this.count)
                return this.failTimeout();
            if (d && f && c) {
                if (a.eventType != Ga)
                    return this.failTimeout();
                var g = this.pTime ? a.timeStamp - this.pTime < b.interval : !0
                  , h = !this.pCenter || H(this.pCenter, a.center) < b.posThreshold;
                this.pTime = a.timeStamp,
                this.pCenter = a.center,
                h && g ? this.count += 1 : this.count = 1,
                this._input = a;
                var i = this.count % b.taps;
                if (0 === i)
                    return this.hasRequireFailures() ? (this._timer = e(function() {
                        this.state = rb,
                        this.tryEmit()
                    }, b.interval, this),
                    ob) : rb
            }
            return tb
        },
        failTimeout: function() {
            return this._timer = e(function() {
                this.state = tb
            }, this.options.interval, this),
            tb
        },
        reset: function() {
            clearTimeout(this._timer)
        },
        emit: function() {
            this.state == rb && (this._input.tapCount = this.count,
            this.manager.emit(this.options.event, this._input))
        }
    }),
    ha.VERSION = "2.0.8",
    ha.defaults = {
        domEvents: !1,
        touchAction: gb,
        enable: !0,
        inputTarget: null,
        inputClass: null,
        preset: [[ea, {
            enable: !1
        }], [ca, {
            enable: !1
        }, ["rotate"]], [fa, {
            direction: Na
        }], [ba, {
            direction: Na
        }, ["swipe"]], [ga], [ga, {
            event: "doubletap",
            taps: 2
        }, ["tap"]], [da]],
        cssProps: {
            userSelect: "none",
            touchSelect: "none",
            touchCallout: "none",
            contentZooming: "none",
            userDrag: "none",
            tapHighlightColor: "rgba(0,0,0,0)"
        }
    };
    var ub = 1
      , vb = 2;
    ia.prototype = {
        set: function(a) {
            return la(this.options, a),
            a.touchAction && this.touchAction.update(),
            a.inputTarget && (this.input.destroy(),
            this.input.target = a.inputTarget,
            this.input.init()),
            this
        },
        stop: function(a) {
            this.session.stopped = a ? vb : ub
        },
        recognize: function(a) {
            var b = this.session;
            if (!b.stopped) {
                this.touchAction.preventDefaults(a);
                var c, d = this.recognizers, e = b.curRecognizer;
                (!e || e && e.state & rb) && (e = b.curRecognizer = null);
                for (var f = 0; f < d.length; )
                    c = d[f],
                    b.stopped === vb || e && c != e && !c.canRecognizeWith(e) ? c.reset() : c.recognize(a),
                    !e && c.state & (ob | pb | qb) && (e = b.curRecognizer = c),
                    f++
            }
        },
        get: function(a) {
            if (a instanceof Y)
                return a;
            for (var b = this.recognizers, c = 0; c < b.length; c++)
                if (b[c].options.event == a)
                    return b[c];
            return null
        },
        add: function(a) {
            if (f(a, "add", this))
                return this;
            var b = this.get(a.options.event);
            return b && this.remove(b),
            this.recognizers.push(a),
            a.manager = this,
            this.touchAction.update(),
            a
        },
        remove: function(a) {
            if (f(a, "remove", this))
                return this;
            if (a = this.get(a)) {
                var b = this.recognizers
                  , c = r(b, a);
                -1 !== c && (b.splice(c, 1),
                this.touchAction.update())
            }
            return this
        },
        on: function(a, b) {
            if (a !== d && b !== d) {
                var c = this.handlers;
                return g(q(a), function(a) {
                    c[a] = c[a] || [],
                    c[a].push(b)
                }),
                this
            }
        },
        off: function(a, b) {
            if (a !== d) {
                var c = this.handlers;
                return g(q(a), function(a) {
                    b ? c[a] && c[a].splice(r(c[a], b), 1) : delete c[a]
                }),
                this
            }
        },
        emit: function(a, b) {
            this.options.domEvents && ka(a, b);
            var c = this.handlers[a] && this.handlers[a].slice();
            if (c && c.length) {
                b.type = a,
                b.preventDefault = function() {
                    b.srcEvent.preventDefault()
                }
                ;
                for (var d = 0; d < c.length; )
                    c[d](b),
                    d++
            }
        },
        destroy: function() {
            this.element && ja(this, !1),
            this.handlers = {},
            this.session = {},
            this.input.destroy(),
            this.element = null
        }
    },
    la(ha, {
        INPUT_START: Ea,
        INPUT_MOVE: Fa,
        INPUT_END: Ga,
        INPUT_CANCEL: Ha,
        STATE_POSSIBLE: nb,
        STATE_BEGAN: ob,
        STATE_CHANGED: pb,
        STATE_ENDED: qb,
        STATE_RECOGNIZED: rb,
        STATE_CANCELLED: sb,
        STATE_FAILED: tb,
        DIRECTION_NONE: Ia,
        DIRECTION_LEFT: Ja,
        DIRECTION_RIGHT: Ka,
        DIRECTION_UP: La,
        DIRECTION_DOWN: Ma,
        DIRECTION_HORIZONTAL: Na,
        DIRECTION_VERTICAL: Oa,
        DIRECTION_ALL: Pa,
        Manager: ia,
        Input: x,
        TouchAction: V,
        TouchInput: P,
        MouseInput: L,
        PointerEventInput: M,
        TouchMouseInput: R,
        SingleTouchInput: N,
        Recognizer: Y,
        AttrRecognizer: aa,
        Tap: ga,
        Pan: ba,
        Swipe: fa,
        Pinch: ca,
        Rotate: ea,
        Press: da,
        on: m,
        off: n,
        each: g,
        merge: ta,
        extend: sa,
        assign: la,
        inherit: i,
        bindFn: j,
        prefixed: u
    });
    var wb = "undefined" != typeof a ? a : "undefined" != typeof self ? self : {};
    wb.Hammer = ha,
    "function" == typeof define && define.amd ? define(function() {
        return ha
    }) : "undefined" != typeof module && module.exports ? module.exports = ha : a[c] = ha
}(window, document, "Hammer");
//# sourceMappingURL=hammer.min.js.map

const JimmyStates = {
    ARRIVING: 0,
    LEAVING: 1,
    TOWNDELIVER: 2,
    TOWNEXIT: 3
};
class TS_JimmyLogic {
    constructor(t, i) {
        if (this.timeoutFunction = setTimeout((()=>{
            this.TimeOut()
        }
        ), 3e4),
        this.craft = i,
        this.target = null,
        !Game.craftData[i])
            return void console.log(`Jimmy : Can not find craft data for craft : "${i}"`);
        this.pathArray = [],
        this.startPosition = new pc.Vec3,
        this.speed = 1,
        this.difference = new pc.Vec3,
        this.distance = 0,
        this.direction = new pc.Vec3,
        this.isReady = !1,
        this.targetPosition = new pc.Vec3,
        this.jimmyUnit = t,
        this.startPosition = new pc.Vec3,
        this.jimmyUnit.entity.fire("PlayAnim", "WalkCraft.json", !0),
        this.jimmyUnit.entity.fire("UpdateUnitCraft", this.craft);
        let e = this.jimmyUnit.entity.getPosition();
        this.startPosition.x = e.x,
        this.startPosition.y = e.y,
        this.startPosition.z = e.z,
        this.unitsPerSecond = 7,
        this.targetPosition.y = 0;
        let s = 15 * Math.random() - 7.5;
        2 == this.jimmyUnit.homeSide && (this.targetPosition.x = this.startPosition.x + s,
        this.targetPosition.z = this.startPosition.z - 75),
        3 == this.jimmyUnit.homeSide && (this.targetPosition.x = this.startPosition.x + 75,
        this.targetPosition.z = this.startPosition.z + s),
        0 === this.jimmyUnit.homeSide && (this.targetPosition.x = this.startPosition.x + s,
        this.targetPosition.z = this.startPosition.z + 75),
        1 == this.jimmyUnit.homeSide && (this.targetPosition.x = this.startPosition.x - 75,
        this.targetPosition.z = this.startPosition.z + s),
        this.travelDist = this.startPosition.distance(this.targetPosition),
        this.path = null,
        this.node = null,
        this.hasEntered = !1,
        this.state = JimmyStates.ARRIVING,
        this.jimmyUnit.entity.lookAt(this.targetPosition)
    }
    Update(t) {
        switch (this.state) {
        case JimmyStates.ARRIVING:
            this.ArrivingUpdate(t);
            break;
        case JimmyStates.LEAVING:
            this.LeavingUpdate(t);
            break;
        case JimmyStates.TOWNDELIVER:
            this.TownDeliverUpdate(t);
            break;
        case JimmyStates.TOWNEXIT:
            this.TownExitUpdate(t)
        }
    }
    TimeOut() {
        if (console.log("Timeout. force deliver and remove unit"),
        this.craft) {
            let t = this.FindTarget();
            if (t) {
                t.AddCraft(this.craft),
                LEDGER.jimmyReceive(t.townX, t.townZ, this.craft, this.jimmyUnit.homeSide);
                let i = this.jimmyUnit.entity.getPosition();
                EntitySpawner.spawnObject("DooberSpawner", i.x, 0, i.z, Game.app.root).fire("DooberSetup", t, this.craft, 1),
                this.jimmyUnit.entity.fire("UpdateUnitCraft"),
                this.craft = null
            } else
                this.NukeCraft()
        }
        this.state = null,
        Game.town.RemoveJimmy(this.jimmyUnit)
    }
    ArrivingUpdate(t) {
        if (this.enterProgress || (this.enterProgress = 0),
        this.enterProgress >= 1)
            return void this.ArrivalComplete();
        this.enterProgress += t / (this.travelDist / this.unitsPerSecond);
        let i = (new pc.Vec3).lerp(this.startPosition, this.targetPosition, this.enterProgress);
        this.jimmyUnit.entity.setPosition(i)
    }
    ArrivalComplete() {
        this.state = JimmyStates.TOWNDELIVER,
        this.hasEntered = !0;
        let t = this.FindTarget();
        if (t) {
            t.AddCraft(this.craft),
            LEDGER.jimmyReceive(t.townX, t.townZ, this.craft, this.jimmyUnit.homeSide);
            let i = this.jimmyUnit.entity.getPosition();
            EntitySpawner.spawnObject("DooberSpawner", i.x, 0, i.z, Game.app.root).fire("DooberSetup", t, this.craft, 1),
            this.jimmyUnit.entity.fire("PlayAnim", "Walk.json", !0),
            this.jimmyUnit.entity.fire("UpdateUnitCraft"),
            this.craft = null
        } else
            this.NukeCraft();
        this.jimmyUnit.entity.lookAt(this.startPosition)
    }
    LeavingUpdate(t) {
        if (this.enterProgress || (this.enterProgress = 1),
        this.enterProgress <= 0)
            return void this.LeavingComplete();
        this.enterProgress -= t / (this.travelDist / this.unitsPerSecond);
        let i = (new pc.Vec3).lerp(this.startPosition, this.targetPosition, this.enterProgress);
        this.jimmyUnit.entity.setPosition(i)
    }
    LeavingComplete() {
        this.state = null,
        Game.town.RemoveJimmy(this.jimmyUnit),
        clearTimeout(this.timeoutFunction)
    }
    TownDeliverUpdate(t) {
        this.TownDeliverComplete()
    }
    TownDeliverComplete() {
        this.state = JimmyStates.TOWNEXIT
    }
    TownExitUpdate(t) {
        this.TownExitComplete()
    }
    TownExitComplete() {
        this.state = JimmyStates.LEAVING
    }
    FindTarget() {
        let t = [];
        const i = this.jimmyUnit.entity.getPosition();
        let e = null;
        for (let i in Game.town.objectDict) {
            const e = Game.town.objectDict[i];
            e.logicObject instanceof TS_StorageObjectLogic && e.CanAcceptCraft(this.craft) && t.push(e)
        }
        if (t.length > 0)
            if (1 == t.length)
                e = t[0];
            else {
                let s = null;
                for (let n in t) {
                    let o = i.distance(t[n].entity.getPosition());
                    (null === s || o < s) && (s = o,
                    e = t[n])
                }
            }
        return e
    }
    NukeCraft() {
        this.craft = null;
        let t = this.jimmyUnit.entity.getPosition();
        EntitySpawner.spawnObject("VFX_CraftDestroy", t.x, 0, t.z, Game.app.root),
        this.jimmyUnit.entity.fire("UpdateUnitCraft")
    }
}
var WorldAmbientAudio = pc.createScript("WorldAmbientAudio");
WorldAmbientAudio.prototype.initialize = function() {
    this.entity.sound.slot("world").volume = 0,
    this.entity.sound.volume = 1,
    this.entity.sound.play("world"),
    console.log("World volume", this.entity.sound.volume),
    this.app.on("SetWorldView", (()=>{
        this.fadeUp()
    }
    )),
    this.app.on("SetTownView", (()=>{
        this.fadeOut()
    }
    )),
    SETTINGS.onAndNow("musicEnabled", (()=>this.entity.sound.enabled = SETTINGS.musicEnabled))
}
,
WorldAmbientAudio.prototype.fadeUp = function() {
    var t = {
        volume: this.entity.sound.slot("world").volume
    };
    this.app.tween(t).to({
        volume: 1
    }, 3, pc.Linear).on("update", (()=>{
        this.entity.sound.slot("world").volume = t.volume
    }
    )).start()
}
,
WorldAmbientAudio.prototype.fadeOut = function() {
    var t = {
        volume: this.entity.sound.slot("world").volume
    };
    this.app.tween(t).to({
        volume: 0
    }, 3, pc.Linear).on("update", (()=>{
        this.entity.sound.slot("world").volume = t.volume
    }
    )).start()
}
;
var TextVfxui = pc.createScript("TextVfxui");
TextVfxui.prototype.initialize = function() {
    this.app.on("SpawnTextVFX", this.SpawnTextVFX.bind(this), this),
    this.entityToClone = this.entity.findByName("typeTextCentered")
}
,
TextVfxui.prototype.swap = function(t) {
    t.app.off("SpawnTextVFX", t.SpawnTextVFX.bind(this), t),
    this.app.on("SpawnTextVFX", this.SpawnTextVFX.bind(this), this)
}
,
TextVfxui.prototype.SpawnTextVFX = function(t, e, i) {
    if (this.entity.enabled = !0,
    this.camera || (this.camera = this.app.root.findByTag("TownCamera")[0]),
    this.entityToClone || (this.entityToClone = this.entity.findByName("typeTextCentered")),
    !this.camera || !this.entityToClone)
        return;
    const n = this.entityToClone.clone();
    n.setLocalScale(new pc.Vec3(.015,.015,.015)),
    this.entity.addChild(n),
    n.setPosition(t),
    n.setRotation(this.camera.getRotation()),
    n.element.text = e,
    n.element.color = (new pc.Color).fromString(i),
    n.enabled = !0;
    n.tween(n.getLocalScale()).to(new pc.Vec3(.015,.015,.015), 6, pc.SineOut).start(),
    n.tween(n.getLocalPosition()).to(new pc.Vec3(t.x + .8,t.y + 10,t.z), 6, pc.SineOut).start();
    const o = {
        value: 1
    }
      , updateFunction = ()=>{
        n && n.element && (n.element.opacity = o.value,
        n.setRotation(this.camera.getRotation()))
    }
    ;
    this.app.tween(o).to({
        value: 0
    }, 6, pc.QuadraticIn).on("update", updateFunction).on("complete", (()=>{
        this.app.off("update", updateFunction),
        n && n.destroy()
    }
    )).start()
}
;
var TownAmbientAudio = pc.createScript("TownAmbientAudio");
TownAmbientAudio.prototype.initialize = function() {
    this.entity.sound.slot("town").volume = 0,
    this.entity.sound.volume = 1,
    this.entity.sound.play("town"),
    console.log("town volume", this.entity.sound.volume),
    this.app.on("SetTownView", (()=>{
        this.fadeUp()
    }
    )),
    this.app.on("SetWorldView", (()=>{
        this.fadeOut()
    }
    )),
    SETTINGS.onAndNow("musicEnabled", (()=>this.entity.sound.enabled = SETTINGS.musicEnabled))
}
,
TownAmbientAudio.prototype.fadeUp = function() {
    var t = {
        volume: this.entity.sound.slot("town").volume
    };
    this.app.tween(t).to({
        volume: 1
    }, 3, pc.Linear).on("update", (()=>{
        this.entity.sound.slot("town").volume = t.volume
    }
    )).start()
}
,
TownAmbientAudio.prototype.fadeOut = function() {
    var t = {
        volume: this.entity.sound.slot("town").volume
    };
    this.app.tween(t).to({
        volume: 0
    }, 3, pc.Linear).on("update", (()=>{
        this.entity.sound.slot("town").volume = t.volume
    }
    )).start()
}
;
class TS_Jimmy {
    constructor(t, i, e) {
        this.entity = null,
        this.homeSide = i;
        let s = [[37.5, -82.5], [157.5, 37.5], [37.5, 157.5], [-82.5, 37.5]]
          , h = [[1, 0], [0, 1], [1, 0], [0, 1]]
          , o = 15 * Math.random() - 7.5;
        this.homeSide = i,
        this.worldX = Game.town.offsetX + s[this.homeSide][0] + h[this.homeSide][0] * o,
        this.worldZ = Game.town.offsetZ + s[this.homeSide][1] + h[this.homeSide][1] * o,
        this.town = t,
        this.craft = e,
        this.LoadEntity(),
        this.artLogicObject = new TS_ArtLogic(this.entity),
        this.logicObject = new TS_JimmyLogic(this,this.craft)
    }
    LoadEntity() {
        this.entity = EntitySpawner.spawnObject("Jimmy", this.worldX, 0, this.worldZ, this.town.objParent),
        this.entity || (this.entity = new pc.Entity,
        this.town.objParent.addChild(this.entity),
        this.entity.setPosition(this.worldX, 0, this.worldZ))
    }
    Update(t) {
        this.logicObject.Update(t)
    }
    DestroyEntity() {
        this.entity.destroy()
    }
}
class TS_JimmySenderLogic extends TS_ObjectLogic {
    Initialize() {
        this.data ? (this.timerActive = this.data.active,
        Game.app.once("TownLoadComplete", this.SetInitialState, this)) : (this.data = {},
        this.data.craft = "none",
        this.data.active = !1,
        this.data.conveyorId = "",
        this.data.target = "",
        this.data.connectionStatus = "",
        this.data.pendingMessage = {},
        this.data.pendingMessage.read = !0,
        this.data.pendingMessage.message = "",
        this.data.pendingMessage.action = ""),
        this.gateOpenEntity = this.entity.findByName("GateOpen"),
        this.gateClosedEntity = this.entity.findByName("GateClosed"),
        this.gateOpenEntity.enabled = !1,
        this.gateClosedEntity.enabled = !1,
        this.targetOnline = !1,
        this.timerTarget = 30,
        this.timer = this.timerTarget,
        Game.app.on("RealtimeConveyorState", (t=>{
            this.RTUpdateConveyors(t)
        }
        )),
        Game.app.on("RealtimeOnlineStatus", this.OnlineStatusUpdate, this),
        this.idleVFX = EntitySpawner.spawnObject("VFX_Notif", this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.entity),
        this.idleVFX.enabled = !1,
        this.SetNeighborConnected(!1),
        this.townObject.entity.fire("PlayAnim", "Home.json", !0),
        this.entity.on("ClearJimmyMessage", this.ClearMessage.bind(this)),
        this.entity.on("SetJimmyState", this.SetState.bind(this)),
        this.entity.on("actionclear", this.ClearMessage.bind(this)),
        this.entity.on("actionremove", this.ActionRemove.bind(this)),
        this.entity.on("SpawnCraft", this.SpawnCraft, this)
    }
    GetDisplayData() {
        let t = {}
          , e = this.IsPaused()
          , i = this.targetOnline
          , a = ""
          , n = Game.town.conveyors.outgoing.find((t=>t.x == this.townObject.townX / 5 && t.z == this.townObject.townZ / 5));
        n && (a = n.state);
        let s = this.data.active;
        if (!Game.town.laborPaid)
            return t;
        if ("rejected" == a)
            return t;
        if ("pending" == a)
            return t.displayState = "Message",
            t.message = "Connection Pending",
            t;
        if ("accepted" == a) {
            if (!s)
                return t.displayState = "Message",
                t.message = "Deliveries Stopped",
                t;
            if (!i)
                return t.displayState = "Message",
                t.message = "Receiver Is Offline",
                t;
            if (e)
                return t.displayState = "Message",
                t.message = "Deliveries Paused From Receiver",
                t;
            if (i && !e && "none" != this.data.craft)
                return t.displayState = "Active",
                t.timePercent = Math.abs(this.timer / this.timerTarget - 1),
                t.timeRemaining = Math.round(this.timerTarget - this.timer),
                t.craft = this.data.craft,
                t
        }
        return t
    }
    SetInitialState() {
        console.log("set intial state");
        let t = Game.town.conveyors.outgoing.find((t=>t.x == this.townObject.townX / 5 && t.z == this.townObject.townZ / 5));
        if (!t)
            return void this.ClearMessage();
        let e = t.state
          , i = this.IsPaused();
        "accepted" != e || i ? "rejected" == e ? this.SetRejectedMessage() : "accepted" == e && i && this.SetPausedMessage() : this.ClearMessage()
    }
    OnlineStatusUpdate(t) {
        t.status != this.targetOnline && t.userId == this.data.target && t.gameId === API.gameId && this.SetNeighborConnected(t.status)
    }
    Update(t) {
        Game.town.conveyors.outgoing && (this.timer < this.timerTarget && (this.timer += t),
        this.timer >= this.timerTarget && this.data.active && this.timerActive && this.OnTimer(),
        this.data.pendingMessage.read || (this.idleVFX.enabled = !0))
    }
    ActionRemove() {
        Game.town.RemoveObject(this.townObject.townX, this.townObject.townZ),
        Game.currency += Game.objectData.Neighbor_Delivery.BuildCost,
        Game.saveAll()
    }
    SetState(t) {
        let e = Game.town.conveyors.outgoing.find((t=>t.x == this.townObject.townX / 5 && t.z == this.townObject.townZ / 5));
        e && (e.state = t),
        "rejected" == t && this.SetRejectedMessage(),
        "accepted" == t && this.ClearMessage()
    }
    OnTapped() {
        if (this.data.pendingMessage && !this.data.pendingMessage.read) {
            let t, e = {};
            e.msg = this.data.pendingMessage.message,
            0 === this.townObject.townX ? t = 1 : 75 === this.townObject.townX ? t = 3 : 0 === this.townObject.townZ ? t = 0 : 75 === this.townObject.townZ && (t = 2),
            e.action = {
                event: this.data.pendingMessage.action,
                target: {
                    type: "edge",
                    position: t
                }
            },
            Game.app.fire("OpenJimmyRejectDialog", e)
        }
    }
    SetMessage(t, e) {
        this.data.pendingMessage.read = !1,
        this.data.pendingMessage.message = t,
        this.data.pendingMessage.action = e,
        this.idleVFX.enabled = !0
    }
    ClearMessage(t) {
        this.data.pendingMessage.read = !0,
        this.data.pendingMessage.message = "",
        this.data.pendingMessage.action = null,
        this.idleVFX.enabled = !1
    }
    IsPaused() {
        return !0 !== Game.town.conveyors.receivers[this.data.target] && !1 === Game.town.conveyors.receivers[this.data.target]
    }
    SetRejectedMessage() {
        API.getGameUser(this.data.target).then((t=>{
            this.SetMessage(`Sorry,  ${t.name} has denied your delivery request. ${Game.objectData.Neighbor_Delivery.BuildCost.toLocaleString()} will be reimbursed to your account`, "actionremove")
        }
        ))
    }
    SetPausedMessage() {
        API.getGameUser(this.data.target).then((t=>{
            this.SetMessage(`Sorry, ${t.name} has stopped receiving your goods for now.`, "actionclear")
        }
        ))
    }
    RTUpdateConveyors(t) {
        t.conveyorId || t.userId == this.data.target && (t.state ? this.ClearMessage() : this.SetPausedMessage()),
        t.conveyorId == this.data.conveyorId && ("rejected" == t.state && Game.town.SetJimmyStateOnEdge("rejected", this.townObject.townX, this.townObject.townZ),
        "accepted" == t.state && this.ClearMessage(),
        ObjectMenu.instance.reload())
    }
    SendCraft() {
        if (!this.data.craft || "none" == this.data.craft)
            return;
        Game.town.conveyors.outgoing.find((t=>t.x == this.townObject.townX / 5 && t.z == this.townObject.townZ / 5));
        let t = [];
        for (let e in Game.town.objectDict)
            Game.town.objectDict[e].logicObject instanceof TS_StorageObjectLogic && Game.town.objectDict[e].CanDispenseCraft(this.data.craft) && t.push(Game.town.objectDict[e]);
        if (0 === t.length)
            return;
        console.log(t);
        let e = null;
        if (1 == t.length)
            e = t[0];
        else {
            let i = this.townObject.entity.getPosition()
              , a = NaN;
            for (let n in t)
                if (isNaN(a))
                    e = t[n],
                    a = i.distance(e.entity.getPosition());
                else {
                    let s = i.distance(t[n].entity.getPosition());
                    s < a && (a = s,
                    e = t[n])
                }
        }
        this.StartTimer(),
        this.townObject.entity.fire("PlayAnim", "DriveAway.json", !1, {
            animationName: "Away.json",
            onStart: this.ClearCraftNode.bind(this),
            looped: !1,
            nextAnim: {
                animationName: "DriveHome.json",
                looped: !1,
                nextAnim: {
                    animationName: "Home.json",
                    looped: !0
                }
            }
        }),
        e.RemoveCraft(this.data.craft);
        let i = e.entity.getPosition();
        EntitySpawner.spawnObject("DooberSpawner", i.x, 0, i.z, Game.app.root).fire("DooberSetup", this, this.data.craft, 1, {
            OnLast: "SpawnCraft"
        }),
        LEDGER.jimmySend(this.townObject.townX, this.townObject.townZ, e.townX, e.townZ),
        API.sendOnConveyor(this.data.conveyorId, this.data.craft)
    }
    SpawnCraft() {
        let t = this.townObject.entity.findByName("CraftNode");
        if (t) {
            let e = t.getPosition();
            if (this.townObject.craftEntity && this.townObject.craftEntity.destroy(),
            this.townObject.craftEntity = EntitySpawner.spawnObject(this.data.craft, t.x, t.y, t.z, t),
            this.townObject.craftEntity) {
                this.townObject.craftEntity.setPosition(e);
                for (let t in this.townObject.craftEntity.children)
                    this.townObject.craftEntity.children[t].name.startsWith("VFX_") && (this.townObject.craftEntity.children[t].enabled = !1)
            }
        }
    }
    StartTimer() {
        this.ResetTimer()
    }
    ClearCraftNode() {
        this.townObject.craftEntity && this.townObject.craftEntity.destroy()
    }
    ResetTimer() {
        this.timer = 0,
        this.timerActive = !0
    }
    OnTimer() {
        let t = Game.town.conveyors.outgoing.find((t=>t.x == this.townObject.townX / 5 && t.z == this.townObject.townZ / 5));
        if (!t)
            return this.StartTimer(),
            void this.RenewConveyor();
        "accepted" == t.state && (this.IsPaused() || this.targetOnline && Game.town.laborPaid && this.SendCraft())
    }
    RenewConveyor() {
        API.createConveyor(this.townObject.townX / 5, this.townObject.townZ / 5).then((t=>{
            this.data.conveyorId = t.conveyorId,
            this.data.target = t.target,
            Game.town.conveyors.outgoing = Game.town.conveyors.outgoing.filter((t=>t.conveyorId != this.data.conveyorId)),
            Game.town.conveyors.outgoing.push(t),
            Object.keys(Game.town.conveyors.receivers).includes(this.data.target) ? this.data.connectionStatus = Game.town.conveyors.receivers[this.data.target] : this.data.connectionStatus = !0,
            Game.town.neighborListeners.includes(t.target) || Game.town.neighborListeners.push(t.target),
            RT.status(Game.town.neighborListeners)
        }
        ))
    }
    CreateConveyor() {
        API.createConveyor(this.townObject.townX / 5, this.townObject.townZ / 5).then((t=>{
            this.data.conveyorId = t.conveyorId,
            this.data.target = t.target,
            Game.town.conveyors.outgoing = Game.town.conveyors.outgoing.filter((t=>t.conveyorId != this.data.conveyorId)),
            Game.town.conveyors.outgoing.push(t),
            Object.keys(Game.town.conveyors.receivers).includes(this.data.target) ? this.data.connectionStatus = Game.town.conveyors.receivers[this.data.target] : this.data.connectionStatus = !0,
            Game.town.neighborListeners.includes(t.target) || Game.town.neighborListeners.push(t.target),
            this.targetOnline = !1,
            RT.status(Game.town.neighborListeners),
            "pending" == t.state && (Game.town.ClearJimmyMessagesOnEdge(this.townObject.townX, this.townObject.townZ),
            API.getConveyors().then((t=>{
                console.log(t);
                let e = this.townObject.townX
                  , i = this.townObject.townZ
                  , a = [];
                if (0 === e || 75 === e)
                    for (let i = 0; i <= 75; i += 5) {
                        let n = Game.town.GetObjectAt(e, i);
                        if (n && n.logicObject instanceof TS_JimmySenderLogic) {
                            if (t.outgoing.find((t=>t.conveyorId == n.logicObject.data.conveyorId))) {
                                Game.town.conveyors.outgoing.find((t=>t.conveyorId == n.logicObject.data.conveyorId)).state = "pending"
                            } else
                                a.push(n)
                        }
                    }
                else if (0 === i || 75 === i)
                    for (let e = 0; e <= 75; e += 5) {
                        let n = Game.town.GetObjectAt(e, i);
                        if (n && n.logicObject instanceof TS_JimmySenderLogic) {
                            if (t.outgoing.find((t=>t.conveyorId == n.logicObject.data.conveyorId))) {
                                Game.town.conveyors.outgoing.find((t=>t.conveyorId == n.logicObject.data.conveyorId)).state = "pending"
                            } else
                                a.push(n)
                        }
                    }
                console.log(`Jimmys missing conveyors ${a.length}`);
                for (let t in a)
                    a[t].logicObject.RenewConveyor()
            }
            ))),
            "accepted" == t.state && this.IsPaused() && this.SetPausedMessage(),
            ObjectMenu.instance.reload()
        }
        )).catch((t=>{
            console.log("Conveyor Already Existed")
        }
        ))
    }
    OnPlaced() {
        this.CreateConveyor()
    }
    OnRemove() {
        this.ClearCraftNode(),
        API.rejectConveyor(this.data.conveyorId),
        Game.app.off("RealtimeOnlineStatus", this.OnlineStatusUpdate, this),
        Game.town.conveyors.outgoing = Game.town.conveyors.outgoing.filter((t=>t.conveyorId != this.data.conveyorId))
    }
    SetCraft(t) {
        return !!Game.craftData[t] && (this.data.craft = t,
        LEDGER.jimmyConfigure(this.townObject.townX, this.townObject.townZ, this.data.craft, this.data.active),
        !0)
    }
    GetCraft() {
        return this.data.craft
    }
    SetNeighborConnected(t) {
        this.targetOnline = t,
        !0 === t ? (this.gateOpenEntity.enabled = !0,
        this.gateClosedEntity.enabled = !1,
        this.gateOpenEntity.animation && this.gateOpenEntity.animation.play("GateOpen.json")) : (this.gateOpenEntity.enabled = !1,
        this.gateClosedEntity.enabled = !0,
        this.gateOpenEntity.animation && this.gateClosedEntity.animation.play("GateClosed.json"))
    }
    SetActive(t) {
        t != this.data.active && (this.timerActive = t,
        this.data.active = t,
        LEDGER.jimmyConfigure(this.townObject.townX, this.townObject.townZ, this.data.craft, this.data.active),
        t && API.event("jimmy_active", {
            craft: this.data.craft
        }),
        console.log(`Set Active ${t}`))
    }
    GetActive() {
        return this.data.active
    }
}
var JimmyUI = pc.createScript("JimmyUI");
JimmyUI.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
JimmyUI.prototype.initialize = function() {
    this.selectedObj = null,
    this.div = document.createElement("div"),
    this.div.classList.add("container"),
    document.body.appendChild(this.div),
    this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.div.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.app.on("JimmyUIClicked", this.JimmyUIClicked.bind(this)),
    this.div.style.display = "none",
    this.app.on("jimmyui-enable", (()=>{
        this.app.fire("hud-disable"),
        this.reload(),
        this.div.style.display = "flex",
        this.timer = setInterval((()=>this.updateUiElements()), 1e3)
    }
    )),
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    this.app.on("InternetConnectionLost", this.Close.bind(this)),
    this.toggle = this.div.querySelector(".switch-checkbox"),
    this.craftsInUI = {}
}
,
JimmyUI.prototype.Close = function() {
    this.app.fire("jimmyui-disable"),
    this.app.fire("objectmenu-enable"),
    this.app.fire("hud-enable"),
    this.div.style.display = "none",
    this.timer && clearInterval(this.timer),
    this.craftsInUI = {}
}
,
JimmyUI.prototype.JimmyUIClicked = function(e) {
    this.selectedObj = Game.town.GetObjectAt(e.x, e.z),
    this.craftList = Game.objectData[this.selectedObj.type].Crafts.split(","),
    this.selectedObj.logicObject instanceof TS_JimmySenderLogic && API.getGameUser(this.selectedObj.logicObject.data.target).then((e=>{
        this.playerName = e.name,
        this.app.fire("jimmyui-enable"),
        e.avatarUrls && (delete this.div.querySelector(".receiver img").dataset.srcAssetId,
        this.div.querySelector(".receiver img").src = e.avatarUrls[32])
    }
    ))
}
,
JimmyUI.prototype.ClearCrafts = function() {
    for (let e in this.craftsInUI)
        this.div.querySelector(".body-row").removeChild(this.craftsInUI[e]);
    this.craftsInUI = {}
}
,
JimmyUI.prototype.reload = function() {
    this.div.innerHTML = this.html.resource;
    let e = this.div.querySelector(".close-button")
      , t = this.div.querySelector(".switch-checkbox");
    t.addEventListener("click", (e=>{
        "none" != this.selectedCraft && this.selectedCraft ? (this.selectedObj.logicObject.SetActive(t.checked),
        this.Close(),
        e.stopPropagation()) : (this.Close(),
        e.stopPropagation())
    }
    )),
    t.checked = this.selectedObj.logicObject.GetActive(),
    e.addEventListener("mousedown", (e=>e.stopPropagation())),
    e.addEventListener("mouseup", (e=>e.stopPropagation())),
    e.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    e.addEventListener("click", (e=>{
        this.Close(),
        e.stopPropagation()
    }
    )),
    this.div.querySelector("#player-name").innerHTML = this.playerName,
    this.setSelectedCraft(this.selectedObj.logicObject.GetCraft()),
    this.craftTemplate = this.div.querySelector(".craft"),
    this.craftTemplate.style.display = "none",
    this.updateUiElements()
}
,
JimmyUI.prototype.setSelectedCraft = function(e) {
    if (!e || "none" == e)
        return;
    this.selectedCraft = e;
    let t = this.div.querySelector(".sender")
      , i = t.querySelector(".selected-crafticon")
      , s = t.querySelector(".selected-craft-name");
    i.dataset.srcAssetName = UiTools.getIconFileName(e),
    s.innerHTML = e.replace(/_/g, " "),
    UiTools.updateImageAssets(t)
}
,
JimmyUI.prototype.createCraftIcon = function(e, t) {
    let i = this.craftTemplate.cloneNode(!0);
    return i.craft = e,
    i.name = i.querySelector(".name"),
    i.quantity = i.querySelector(".quantity"),
    i.icon = i.querySelector(".icon"),
    i.name.innerHTML = e.replace(/_/g, " "),
    i.quantity.innerHTML = t,
    e.length >= 12 && (i.name.style.marginTop = "-25px"),
    i.icon.dataset.srcAssetName = UiTools.getIconFileName(e),
    i.style.display = "",
    UiTools.updateImageAssets(i),
    i
}
,
JimmyUI.prototype.updateUiElements = function() {
    this.selectedCraft = this.selectedObj.logicObject.data.craft;
    let e = Game.town.GetStoredCrafts()
      , t = Object.keys(e).sort();
    t.sort((function(t, i) {
        return e[i] - e[t]
    }
    )),
    "none" == this.selectedCraft && t.length > 0 && (this.setSelectedCraft(t[0]),
    this.selectedObj.logicObject.SetCraft(t[0]));
    for (let i in t) {
        if (!(t[i]in this.craftsInUI)) {
            let s = this.createCraftIcon(t[i], e[t[i]]);
            this.craftsInUI[t[i]] = s,
            s.addEventListener("mousedown", (e=>e.stopPropagation())),
            s.addEventListener("mouseup", (e=>e.stopPropagation())),
            s.addEventListener("wheel", (e=>e.stopPropagation()), {
                passive: !0
            }),
            s.addEventListener("click", (e=>{
                this.selectedObj.logicObject.SetCraft(s.craft),
                this.setSelectedCraft(s.craft),
                this.updateUiElements(),
                e.stopPropagation()
            }
            ));
            this.div.querySelector(".body-row").appendChild(s)
        }
        this.craftsInUI[t[i]].querySelector(".quantity").innerHTML = e[t[i]]
    }
    for (let e in this.craftsInUI)
        t.includes(e) || (this.div.querySelector(".body-row").removeChild(this.craftsInUI[e]),
        delete this.craftsInUI[e]);
    for (let e in this.craftsInUI)
        e === this.selectedCraft ? (this.craftsInUI[e].className = "craft selected",
        this.craftsInUI[e].removeAttribute("style")) : (this.craftsInUI[e].style.filter = "grayscale(0.1) opacity(75%)",
        this.craftsInUI[e].className = "craft");
    UiTools.updateImageAssets(this.div)
}
;
var DeliverManagemenetIcon = pc.createScript("deliverManagemenetIcon");
DeliverManagemenetIcon.attributes.add("imageEntity", {
    type: "entity"
}),
DeliverManagemenetIcon.prototype.initialize = function() {
    this.entity.once("setData", this.setUserId.bind(this)),
    this.imageEntity.on("tapped", this.onTap.bind(this)),
    Game.app.on("RealtimeOnlineStatus", this.OnlineStatusUpdate, this),
    this.setNeighborOffline()
}
,
DeliverManagemenetIcon.prototype.update = function(e) {
    CameraCommander && CameraCommander.instance && CameraCommander.instance.townCamera && this.entity.setRotation(CameraCommander.instance.townCamera.getRotation())
}
,
DeliverManagemenetIcon.prototype.OnlineStatusUpdate = function(e) {
    e.userId == this.userId && e.gameId === API.gameId && (e.status ? this.setNeighborOnline(this.userId) : this.setNeighborOffline())
}
,
DeliverManagemenetIcon.prototype.setNeighborOnline = function(e) {
    API.getGameUser(e).then((t=>{
        if (t.avatarUrls) {
            this.app.loader.getHandler("texture").crossOrigin = "anonymous";
            let n = new pc.Asset(`${e}_portrait32`,"texture",{
                url: t.avatarUrls[32]
            });
            this.app.assets.add(n),
            n.on("error", (function(e) {
                console.log(e)
            }
            )),
            n.on("load", (e=>{
                this.imageEntity.element.texture = e.resource
            }
            )),
            this.app.assets.load(n)
        }
        this.imageEntity && this.imageEntity.element && (this.imageEntity.element.opacity = 1)
    }
    ))
}
,
DeliverManagemenetIcon.prototype.setNeighborOffline = function() {
    this.imageEntity && this.imageEntity.element && (this.imageEntity.element.opacity = .3)
}
,
DeliverManagemenetIcon.prototype.setUserId = function(e) {
    this.userId = e
}
,
DeliverManagemenetIcon.prototype.onTap = function(e) {
    Game.app.fire("OpenUI:NeighborManage", this.userId)
}
;
var toasterUI = pc.createScript("toasterUI");
toasterUI.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
toasterUI.prototype.initialize = function() {
    this.pierSwap = !1,
    this.div = document.createElement("div"),
    this.div.classList.add("confirmLocationUI-container"),
    this.div.classList.add("toasterUI-container"),
    document.body.appendChild(this.div),
    this.div.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.div.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.div.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.on("enable", (()=>{
        this.div.style.display = "flex",
        this.app.fire("hud-disable")
    }
    )),
    this.app.on("NamePlayerStart", (()=>{
        this.app.on("UserStart", (()=>{
            this.fire("enable")
        }
        ))
    }
    )),
    this.app.on("toasterui-enable", (()=>{
        this.div.style.display = "flex",
        this.app.fire("hud-disable")
    }
    )),
    this.on("disable", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.app.on("toasterui-disable", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    this.reload()
}
,
toasterUI.prototype.reload = function() {
    this.log("reloading"),
    this.div.innerHTML = this.html.resource,
    this.div.querySelector(".main-text").innerHTML = "Pick a Location!",
    UiTools.translateTextAssets(),
    UiTools.updateImageAssets(this.div)
}
;
var SocialCard = pc.createScript("socialCard");
SocialCard.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
SocialCard.prototype.initialize = function() {
    this.div = document.createElement("div"),
    this.div.classList.add("container"),
    this.div.style.pointerEvents = "none",
    this.div.innerHTML = this.html.resource,
    this.div.style.display = "none",
    document.body.appendChild(this.div),
    this.div.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.div.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.div.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.div.addEventListener("click", (e=>e.stopPropagation())),
    this.playerName = this.div.querySelector("#player-name"),
    this.playerRank = this.div.querySelector("#player-rank"),
    this.playerPoints = this.div.querySelector("#player-points"),
    this.closeButton = this.div.querySelector(".close-button"),
    this.closeButton.addEventListener("click", (e=>this.CloseUI())),
    this.startDeliverButton = this.div.querySelector("#start-deliver-btn"),
    this.startDeliverButton.addEventListener("click", (e=>this.StartDeliver())),
    this.rejectConnectButton = this.div.querySelector("#reject-connect-btn"),
    this.rejectConnectButton.addEventListener("click", (e=>this.RejectConnection())),
    this.stopDeliverButton = this.div.querySelector("#stop-deliver-btn"),
    this.stopDeliverButton.addEventListener("click", (e=>this.StopDeliver())),
    this.app.on("OpenUI:NeighborManage", this.getUserData.bind(this)),
    this.app.on("SetWorldView", this.CloseUI.bind(this)),
    UiTools.updateImageAssets(this.div)
}
,
SocialCard.prototype.getUserData = function(e) {
    API.getGameUser(e).then((e=>{
        this.OpenUI(e)
    }
    ))
}
,
SocialCard.prototype.OpenUI = function(e) {
    this.userId = e.userId,
    void 0 === Game.town.conveyors.incomingReceivers[this.userId] && (Game.town.conveyors.incomingReceivers[this.userId] = !0);
    let t = Game.town.conveyors.incomingReceivers[e.userId];
    console.log(`Receiver State : ${t}`),
    !0 === t ? (this.startDeliverButton.style.display = "none",
    this.stopDeliverButton.style.display = "flex") : !1 === t && (this.startDeliverButton.style.display = "flex",
    this.stopDeliverButton.style.display = "none"),
    this.app.fire("hud-disable"),
    this.app.fire("objectmenu-disable"),
    console.log(e),
    this.playerName.innerHTML = e.name,
    this.playerPoints.innerHTML = Number(e.points).toLocaleString(),
    this.playerRank.innerHTML = `RANK: #${Number(e.pointsRank).toLocaleString()}`,
    e.avatarUrls && (delete this.div.querySelector(".player-info img").dataset.srcAssetId,
    this.div.querySelector(".player-info img").src = e.avatarUrls[128]),
    this.div.style.display = "flex",
    this.div.style.pointerEvents = "auto"
}
,
SocialCard.prototype.CloseUI = function() {
    this.div.style.display = "none",
    this.div.style.pointerEvents = "none",
    this.app.fire("hud-enable"),
    this.app.fire("objectmenu-enable")
}
,
SocialCard.prototype.StartDeliver = function() {
    API.setConveyorReceiverState(this.userId, !0),
    Game.town.conveyors.incomingReceivers[this.userId] = !0,
    this.CloseUI()
}
,
SocialCard.prototype.StopDeliver = function() {
    API.setConveyorReceiverState(this.userId, !1),
    Game.town.conveyors.incomingReceivers[this.userId] = !1,
    this.CloseUI()
}
,
SocialCard.prototype.RejectConnection = function() {
    this.CloseUI();
    let e = 0;
    for (let t in Game.town.conveyors.incoming)
        e = Game.town.conveyors.incoming[t].incomingCardinalDirection,
        Game.town.conveyors.incoming[t].userId == this.userId && API.rejectConveyor(Game.town.conveyors.incoming[t].conveyorId);
    delete Game.town.conveyors.incomingReceivers[this.userId],
    Game.town.DestroyDeliveryManageIcon(e)
}
;
var Uitemplate = pc.createScript("uitemplate");
Uitemplate.prototype.initialize = function() {
    Uitemplate.instance = this,
    this.UI = new TS_TemplateUI({
        html: this.html,
        divClass: "container",
        fullScreenUI: !0
    })
}
;
class TS_TemplateUI extends TS_UIBase {
    Initialize() {
        console.log("UI Initialize")
    }
    OnOpen() {
        console.log("UI Open")
    }
    OnClose() {
        console.log("UI Close")
    }
    OnReload() {
        console.log("UI Reload")
    }
    OnInternetConnectionLost() {
        console.log("UI OnInternetConnectionLost")
    }
}
var NextGameLeaderboard = pc.createScript("nextGameLeaderboard");
NextGameLeaderboard.attributes.add("leaderboard", {
    type: "entity",
    title: "Leaderboard"
}),
NextGameLeaderboard.prototype.initialize = function() {
    LeaderboardUi && (LeaderboardUi = null);
    let e = document.querySelector(".leaderboard");
    e && e.parentElement.remove();
    let a = this.leaderboard.clone();
    this.app.root.addChild(a),
    a.enabled = !0
}
,
NextGameLeaderboard.prototype.update = function(e) {}
;
var Grabbatron = pc.createScript("grabbatron");
Grabbatron.attributes.add("translations", {
    type: "asset",
    assetType: "json"
}),
Grabbatron.IdFormat = /^\d{4}_\d{1}$/,
Grabbatron.PlaceholderFormat = /{#}/,
Grabbatron.language = SETTINGS.language,
Grabbatron.prototype.initialize = function() {
    Game.translationData = this.app.assets.find("translations.json").resource,
    Grabbatron.language = SETTINGS.language
}
,
Grabbatron.replacePlaceholder = function(r, a="") {
    const {IdFormat: t, PlaceholderFormat: n, getTranslationFromId: o} = Grabbatron
      , e = a.shift();
    let b = t.test(r)
      , i = r;
    if (b && (i = o(r)),
    e) {
        if (b = t.test(e),
        b) {
            let r = o(e)
              , t = i.replace(n, r);
            return Grabbatron.replacePlaceholder(t, a)
        }
        return a.length ? Grabbatron.replacePlaceholder(i.replace(n, e), a) : i.replace(n, e)
    }
    return i
}
,
Grabbatron.getTranslationFromId = function(r) {
    Grabbatron.language = SETTINGS.language;
    const {IdFormat: a, language: t} = Grabbatron
      , {translationData: n} = Game
      , o = a.test(r);
    if (n && o) {
        const a = n[r];
        if (a) {
            const o = a[t];
            if (o)
                return o;
            console.log(`Missing ${t} translation`);
            const e = n[r].en;
            return e || (Grabbatron.errorHandler(4, r),
            "")
        }
        return Grabbatron.errorHandler(2, r),
        ""
    }
    console.log("No data object in Game.translationData")
}
,
Grabbatron.formatString = function(r, a) {
    return Grabbatron.replacePlaceholder(r, a)
}
,
Grabbatron.pullEntry = function(r) {
    const {translationData: a, language: t} = Game
      , {IdFormat: n} = Grabbatron;
    if (n.test(r))
        if (r = r.padStart(4, "0"),
        a) {
            const n = Grabbatron.getTranslationFromId(r)
              , o = a[r];
            if (n)
                return n;
            if (o) {
                if (o[t])
                    return o[t];
                if (Grabbatron.errorHandler(3, r),
                "en" != t)
                    return o.en ? o.en : (Grabbatron.errorHandler(4, r),
                    "")
            } else
                Grabbatron.errorHandler(2, r)
        } else
            Grabbatron.errorHandler(1, r)
}
,
Grabbatron.errorHandler = function(r, a) {
    switch (r) {
    case 1:
        return void Grabbatron.log("Missing data file");
    case 2:
        return void Grabbatron.log(`'${a}' Missing`);
    case 3:
        return void Grabbatron.log(`'${a}' '${SETTINGS.language}' Missing`);
    case 4:
        return void Grabbatron.log(`'${a}' 'en' Missing'`)
    }
}
,
Grabbatron.findId = function(r, a) {
    if (exceptions = {
        Road: "8094_0",
        Mountains: "8095_0",
        Waterway: "8096_0",
        OpenWorld: "8097_0"
    },
    exceptions[r])
        return exceptions[r];
    const {craftData: t, objectData: n, unitsData: o, worldObjectData: e} = Game
      , b = {
        ...e,
        ...n,
        ...o,
        ...t
    }
      , i = b[r];
    let l, s = i ? i.Id : r;
    Object.entries(b).forEach((([a,t])=>{
        const {Id: n} = t;
        a == r && (l = n)
    }
    ));
    let c = `${s.toString().padStart(4, "0")}_0`;
    return Grabbatron.IdFormat.test(c) || (c = s.toString()),
    c
}
,
Grabbatron.edgeRequirements = function(r) {
    const a = /:OR:|:AND:/g;
    if (void 0 !== r && "None" != r) {
        if (null === r.match(a)) {
            let a = "8084_0"
              , t = Grabbatron.findId(r);
            return Grabbatron.formatString(a, [t])
        }
        if (":AND:" == r.match(a)) {
            let a = "8017_0"
              , t = (r.split(/:AND:/),
            []);
            return r.split(/:AND:/).forEach(((r,a)=>t[a] = Grabbatron.findId(r))),
            Grabbatron.formatString(a, t)
        }
        if (r.match(a) != [":AND:", ":AND:"] && ":OR:" == r.match(a)) {
            let a = "8083_0"
              , t = (r.split(/:OR:/),
            []);
            return r.split(/:OR:/).forEach(((r,a)=>t[a] = Grabbatron.findId(r))),
            Grabbatron.formatString(a, t)
        }
    }
}
,
Grabbatron.edgeExclusions = function(r) {
    const a = /:OR:|:AND:/g;
    if (void 0 !== r && "None" != r) {
        if (null === r.match(a)) {
            let a = "8084_1"
              , t = Grabbatron.findId(r);
            return Grabbatron.formatString(a, [t])
        }
        if (":AND:" == r.match(a)) {
            let a = "8017_1"
              , t = (r.split(/:AND:/),
            []);
            return r.split(/:AND:/).forEach(((r,a)=>t[a] = Grabbatron.findId(r))),
            Grabbatron.formatString(a, t)
        }
        if (r.match(a) != [":AND:", ":AND:"] && ":OR:" == r.match(a)) {
            let a = "8083_1"
              , t = (r.split(/:OR:/),
            []);
            return r.split(/:OR:/).forEach(((r,a)=>t[a] = Grabbatron.findId(r))),
            Grabbatron.formatString(a, t)
        }
    }
}
,
Grabbatron.log = logger && logger({
    context: "Grabbatron",
    color: "MediumTurquoise",
    timing: !0
});
var HudUi = pc.createScript("hudUi");
HudUi.attributes.add("html", {
    type: "asset",
    assetType: "html"
});
var HUD = {};
HudUi.prototype.initialize = function() {
    HUD.instance = this,
    PhaseManager.instance.onPhaseChanged(PhaseManager.PlayingPhase, (()=>{
        this.loadui()
    }
    )),
    PhaseManager.instance.onPhaseChanged(PhaseManager.GameOver, (()=>{
        this.app.fire("hud-disable")
    }
    ))
}
,
HudUi.prototype.isActive = function() {
    return "none" != this.div.style.display
}
,
HudUi.prototype.loadui = function() {
    this.div = document.createElement("div"),
    this.div.classList.add("container"),
    this.div.style.pointerEvents = "none",
    this.div.innerHTML = this.html.resource,
    document.body.appendChild(this.div),
    this.app.on("TownObjectAdded", (()=>this.setStoreButtonVisibility())),
    this.app.on("gameover", (()=>{
        this.app.off("hud-enable")
    }
    )),
    this.app.on("hud-enable", (()=>{
        this.updateUI(),
        this.div.style.display = "flex"
    }
    )),
    this.app.on("hud-disable", (()=>{
        this.div.style.display = "none"
    }
    )),
    this.html.on("change", (()=>{
        this.reload()
    }
    )),
    this.challengeIndicator = document.querySelector("#daily-challenge-status"),
    this.challengeIndicatorTimeText = document.querySelector("#challenge-indicator-time-text"),
    this.challengeIndicatorProgressTrack = document.querySelector("#challenge-indicator-progress-track"),
    this.bottonDiv = this.div.querySelector(".bottom"),
    this.craftTemplate = document.getElementById("hud-craft-template"),
    this.craftTarget = document.getElementById("hud-craft-target"),
    this.worldButton = this.div.querySelector(".hud-world-button"),
    this.objectStoreButton = this.div.querySelector(".hud-store-button"),
    this.objectInventoryButton = this.div.querySelector(".hud-inventory-button"),
    this.objectInventoryButton.querySelector(".notif-badge").style.visibility = "hidden",
    this.leaderboardButton = this.div.querySelector(".right-hud"),
    this.playerStatsButton = this.div.querySelector(".left"),
    this.playerStatsSection = this.div.querySelector(".hud-player-stats"),
    this.expandCraftButton = this.div.querySelector(".hud-expand-craft-button"),
    this.addCoinButton = this.div.querySelector(".hud-goto-wallet"),
    this.playerCurrency = this.div.querySelector(".hud-currency"),
    this.playerPoints = this.div.querySelector(".hud-points"),
    this.laborCost = this.div.querySelector(".hud-labor-costs"),
    this.playerGold = this.div.querySelector("#coinqty"),
    this.galaPowerLevel = this.div.querySelector(".gp-level span"),
    this.objectInventoryButton.style.visibility = "hidden",
    this.holidayIcon = this.div.querySelector(".hud-holiday-button"),
    this.dropIcon = this.div.querySelector(".hud-airdrop-button"),
    this.objectStoreButton.style.visibility = "hidden",
    this.leaderboardButton.style.visibility = "hidden",
    this.playerStatsSection.style.visibility = "hidden",
    this.craftTarget.style.visibility = "hidden",
    this.worldButton.style.visibility = "hidden",
    this.bottonDiv.style.visibility = "hidden",
    this.activeView = "Town",
    this.craftTarget.querySelector(".hud-busy-icon").style.visibility = "hidden",
    this.div.querySelector(".hud-town-name").innerText = Game.townName,
    this.challengeIndicator.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.challengeIndicator.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.challengeIndicator.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.challengeIndicator.addEventListener("click", (t=>{
        t.stopPropagation(),
        Game.challenge.isComplete() ? ChallengeCompleteUI.vm.open() : ChallengeUI.vm.open()
    }
    )),
    this.app.on("TownTapped", (t=>{
        Game.town && (this.townPosition = Game.town.WorldSpacePositionToLocalGrid(t.point.x, t.point.z))
    }
    )),
    this.holidayIcon.addEventListener("click", (t=>{
        if (HOLIDAY_TREE_QUEST.completed) {
            const {x: t, z: e} = this.townPosition || {};
            CryptoRewardUI.vm.open(t, e)
        } else {
            const {x: t, z: e} = this.townPosition || {};
            HolidayTreeUI.open(t, e)
        }
    }
    )),
    this.holidayIcon.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.holidayIcon.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.holidayIcon.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.holidayIcon.style.display = "none",
    this.dropIcon.addEventListener("click", (t=>{
        AirDropUi.instance.UI.OpenUI(Game.town.pendingDrops[0])
    }
    )),
    this.dropIcon.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.dropIcon.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.dropIcon.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.addCoinButton.addEventListener("click", (t=>{
        this.JumpToWallet(),
        t.stopPropagation()
    }
    )),
    this.addCoinButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.addCoinButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.addCoinButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.expandCraftButton.addEventListener("click", (t=>{
        t.stopPropagation(),
        this.collapseCraft()
    }
    )),
    this.expandCraftButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.expandCraftButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.expandCraftButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.playerStatsButton.addEventListener("click", (t=>{
        this.JumpToWallet(),
        t.stopPropagation()
    }
    )),
    this.playerStatsButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.playerStatsButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.playerStatsButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.worldButton.addEventListener("click", (t=>{
        this.app.fire("SwitchView"),
        t.stopPropagation()
    }
    )),
    this.viewTarget = "World",
    this.worldButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.worldButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.worldButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.objectStoreButton.addEventListener("click", (t=>{
        t.stopPropagation(),
        Game.internetConnected && StoreUI.open(this.townPosition.x, this.townPosition.z)
    }
    )),
    this.objectStoreButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.objectStoreButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.objectStoreButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.objectInventoryButton.addEventListener("click", (t=>{
        t.stopPropagation(),
        Game.internetConnected && InventoryUI.open(this.townPosition.x, this.townPosition.z)
    }
    )),
    this.objectInventoryButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.objectInventoryButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.objectInventoryButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.leaderboardButton.addEventListener("click", (t=>{
        t.stopPropagation(),
        Game.internetConnected && this.app.fire("leaderboardui-enable")
    }
    )),
    this.leaderboardButton.addEventListener("mousedown", (t=>t.stopPropagation())),
    this.leaderboardButton.addEventListener("mouseup", (t=>t.stopPropagation())),
    this.leaderboardButton.addEventListener("wheel", (t=>t.stopPropagation()), {
        passive: !0
    }),
    this.app.on("TownTapped", this.TownTouched.bind(this)),
    this.app.on("TownObjectAdded", this.ObjectAddedToTown.bind(this)),
    this.app.on("SwitchView", this.SwitchView.bind(this)),
    this.app.on("SetTownView", this.SwitchToTown.bind(this)),
    this.app.on("SetWorldView", this.SwitchToWorld.bind(this)),
    this.app.on("PlayerCurrencyChanged", (t=>{
        this.playerCurrency.innerText = t.toLocaleString()
    }
    )),
    this.app.on("PlayerPointsChanged", (t=>this.playerPoints.innerText = t.toLocaleString())),
    this.timer = 0,
    this.craftList = [],
    this.activeTradeUiItems = [],
    this.updateLaborTimer(),
    setInterval((()=>this.updateTownCoinBalance()), 1e4),
    setInterval((()=>this.updateLaborTimer()), 1e3),
    setInterval((()=>this.updateUI()), 1e3),
    this.updateChallengeTimer(),
    setInterval((()=>this.updateChallengeTimer()), 1e3),
    this.app.on("challengeProgressChanged", this.updateChallengeProgressTrack, this),
    this.app.on("challengeProgressChanged", this.updateChallengeStatus, this);
    let t = this.div.querySelector(".hud-jimmy-button");
    t && (t.addEventListener("click", (t=>{
        t.stopPropagation();
        let e = Game.town.conveyors.incoming.find((t=>"pending" == t.state));
        e ? Game.app.fire("OpenJimmyDialog", e.conveyorId) : console.log("No Pending Conveyor Connections")
    }
    )),
    t.addEventListener("mousedown", (t=>t.stopPropagation())),
    t.addEventListener("mouseup", (t=>t.stopPropagation()))),
    API.getGameUser(Game.userId).then((t=>{
        if (t.profilePhotoUrl)
            document.querySelector(".hud-player-button img").src = t.profilePhotoUrl,
            UiTools.updateImageAssets(this.div);
        else {
            const t = TempPlayerTownDisplayer.instance.townNameToDefaultAsset(Game.townName);
            t && (document.querySelector(".hud-player-button img").dataset.srcAssetName = t.name),
            UiTools.updateImageAssets(this.div)
        }
    }
    ));
    const updateHolidayTreeButton = ()=>{
        this.div.querySelector(".hud-holiday-button .ornament-notif")
    }
    ;
    REFERRALS.onAndNow("Changed", (()=>updateHolidayTreeButton())),
    HOLIDAY_TREE_QUEST.on("Completed", (()=>updateHolidayTreeButton())),
    this.app.on("OnboardingFinished", (()=>updateHolidayTreeButton())),
    this.div.style.display = "none",
    this.app.fire("hud-enable")
}
,
HudUi.prototype.reload = function() {
    this.div.innerHTML = this.html.resource
}
,
HudUi.prototype.updateUI = function() {
    this.div.querySelector(".hud-expand-craft-button").style.display = "none",
    this.leaderboardButton.style.visibility = "visible",
    this.playerStatsSection.style.visibility = "visible",
    this.craftTarget.style.visibility = "visible",
    this.craftTarget.querySelector(".hud-busy-icon").style.visibility = "visible",
    this.worldButton.style.visibility = "visible",
    this.bottonDiv.style.visibility = "visible",
    this.playerCurrency.innerText = Game.currency.toLocaleString(),
    this.playerPoints.innerText = Game.points.toLocaleString(),
    this.laborCost.innerText = Game.town.GetTotalLaborCost().toLocaleString(),
    this.galaPowerLevel.innerText = Game.galaPower.toLocaleString(),
    Game.currency <= Game.town.GetTotalLaborCost() ? this.craftTarget.querySelector(".bank.contextual").classList.add("bank-warning") : this.craftTarget.querySelector(".bank-warning") && this.craftTarget.querySelector(".bank.contextual").classList.remove("bank-warning");
    var t = Math.floor((new Date(Game.gameData.end).getTime() - (new Date).getTime()) / 1e3)
      , e = Math.floor(t / 86400)
      , i = Math.floor(t / 3600)
      , o = Math.floor(t / 60)
      , n = Math.floor(t);
    Game.town.pendingDrops.length > 0 && !Game.town.pendingDrops[0].claiming ? this.dropIcon.style.display = "" : this.dropIcon.style.display = "none",
    this.div.querySelector(".hud-days-left").innerText = `${e} days left`,
    e > 1 && (this.div.querySelector(".hud-days-left").innerText = Grabbatron.formatString("8007_0", [e])),
    i < 24 && (this.div.querySelector(".hud-days-left").innerText = Grabbatron.formatString("8011_0", [i])),
    o < 60 && (this.div.querySelector(".hud-days-left").innerText = `${o} minutes left`),
    n < 60 && (this.div.querySelector(".hud-days-left").innerText = `${n} seconds left`),
    this.timer++,
    this.pendingJimmys = [];
    for (let t in Game.town.conveyors.incoming)
        "pending" == Game.town.conveyors.incoming[t].state && this.pendingJimmys.push(Game.town.conveyors.incoming[t]);
    let s = this.div.querySelector(".hud-jimmy-button");
    if (s)
        if (this.pendingJimmys.length > 0) {
            let t = [];
            for (let e in this.pendingJimmys)
                t.includes(this.pendingJimmys.userId) || t.push(this.pendingJimmys.userId);
            s.style.display = "block";
            let e = s.querySelector(".notif-badge");
            e && (e.innerHTML = t.length)
        } else
            s.style.display = "none";
    else
        console.log("Can not locate Jimmy button element");
    this.checkForStorageUpdate(),
    this.updateTradeDisplay(Game.town.tradesList)
}
,
HudUi.prototype.updateTownCoinBalance = function() {}
,
HudUi.prototype.updateLaborTimer = function() {
    var t = Game.town.laborTick / 60
      , e = Math.ceil(9 * t);
    0 !== e && (this.craftTarget.querySelector(".hud-busy-icon").dataset.srcAssetName = "LaborTimer_0" + e + ".png"),
    UiTools.updateImageAssets(this.div)
}
,
HudUi.prototype.updateChallengeStatus = function() {
    const t = Game.challenge.getGoalAmount();
    Game.challenge.goalProgress >= t ? this.challengeIndicator.classList.add("daily-challenge-done") : this.challengeIndicator.classList.remove("daily-challenge-done")
}
,
HudUi.prototype.updateChallengeTimer = function() {
    const t = Game.getChallengeSecondsRemaining()
      , e = Number(t)
      , i = String(Math.floor(e / 3600)).padStart(2, "0")
      , o = String(Math.floor(e % 3600 / 60)).padStart(2, "0")
      , n = String(Math.floor(e % 3600 % 60)).padStart(2, "0");
    this.updateChallengeProgressTrack({
        progress: Game.challenge.goalProgress
    }),
    this.challengeIndicatorTimeText.innerHTML = `${i}:${o}:${n}`
}
,
HudUi.prototype.updateChallengeProgressTrack = function(t) {
    const {progress: e} = t || {}
      , i = Game.challenge.getGoalAmount()
      , o = e
      , n = Math.min(1, o / i);
    this.challengeIndicatorProgressTrack.style.strokeDashoffset = -1 * (227 - 227 * n)
}
,
HudUi.prototype.checkForStorageUpdate = function() {
    const {crafts: t, meta: e} = Game.town.GetStoredCrafts({
        metaData: !0
    });
    t !== this.lastStorageJson && this.updateCraftsDisplay(t, e),
    this.lastStorageJson = t
}
,
HudUi.prototype.updateCraftsDisplay = function(t, e) {
    for (let e in t) {
        let i = t[e];
        if (!this.div.querySelector(".hud-craft-display-" + e)) {
            const t = document.importNode(this.craftTemplate.content, !0);
            this.craftList.push(e),
            t.querySelector(".crafts").classList.add("hud-craft-display-" + e),
            t.querySelector(".hud-craft-amount").innerText = i,
            t.querySelector(".hud-craft-icon").dataset.srcAssetName = UiTools.getIconFileName(e),
            this.craftTarget.appendChild(t)
        }
        this.craftTarget.querySelector(".hud-craft-display-" + e).querySelector(".hud-craft-amount").innerText = i
    }
    for (const e of this.craftList)
        if (!(e in t)) {
            let t = this.craftTarget.querySelector(".hud-craft-display-" + e);
            t.parentNode.removeChild(t),
            this.craftList.splice(this.craftList.indexOf(e), 1)
        }
    UiTools.updateImageAssets(this.div)
}
,
HudUi.prototype.updateTradeDisplay = function(t) {
    tradeDict = {},
    t.forEach((t=>{
        if (t && t.startTime) {
            let e = `ID${Math.floor(new Date(t.startTime).getTime() / 1e3)}_${t.source.x}_${t.source.z}`;
            tradeDict[e] = t
        }
    }
    ));
    for (const t in tradeDict) {
        let i = tradeDict[t];
        if (!this.div.querySelector(".hud .hud-right").querySelector(".trade-" + t)) {
            var e = document.importNode(document.getElementById("hud-trade-template").content, !0);
            e.querySelector(".stroke").dataset.srcAssetName = UiTools.getIconFileName(i.unitType),
            e.querySelector(".progress-container").classList.add("trade-" + t),
            this.div.querySelector(".hud .hud-right").appendChild(e),
            this.activeTradeUiItems.push(t)
        }
    }
    this.activeTradeUiItems.forEach((t=>{
        if (!(t in tradeDict)) {
            this.div.querySelector(".hud .hud-right").querySelectorAll(".trade-" + t).forEach((e=>{
                e.parentElement.removeChild(e),
                this.activeTradeUiItems.splice(this.activeTradeUiItems.indexOf(t), 1)
            }
            ))
        }
    }
    )),
    this.activeTradeUiItems.forEach((t=>{
        if (!tradeDict[t])
            return;
        const e = (new Date).getTime() - new Date(tradeDict[t].startTime).getTime()
          , i = Math.floor(e / tradeDict[t].duration * 100)
          , o = Math.floor((tradeDict[t].duration - e) / 1e3)
          , n = this.div.querySelector(".hud .hud-right");
        if (i < 100) {
            n.querySelector(".trade-" + t + " .progress-value").style.width = `${i}%`;
            const e = o > 60 ? `${Math.floor(o / 60)}m${o % 60}s` : `${o}s`;
            n.querySelector(".trade-" + t + " .progress-value span").innerText = `${e}`
        } else
            n.querySelector(".trade-" + t).style.display = "none"
    }
    )),
    UiTools.updateImageAssets(this.div)
}
,
HudUi.prototype.SwitchView = function() {
    Game.internetConnected && ("World" == this.viewTarget ? this.app.fire("SetWorldView") : "Town" == this.viewTarget && this.app.fire("SetTownView"))
}
,
HudUi.prototype.SwitchToTown = function() {
    this.activeView = "Town",
    PhaseManager.instance.phase === PhaseManager.PlayingPhase && (this.playerStatsSection.style.visibility = "visible",
    this.leaderboardButton.style.visibility = "visible",
    this.div.querySelector(".hud-world-button img").dataset.srcAssetId = "24639098",
    this.craftVisible && (this.craftTarget.style.visibility = "visibile"),
    this.viewTarget = "World",
    UiTools.updateImageAssets(this.div),
    this.app.fire("objectmenu-enable"))
}
,
HudUi.prototype.SwitchToWorld = function() {
    this.activeView = "World",
    this.objectStoreButton.style.visibility = "hidden",
    this.objectInventoryButton.style.visibility = "hidden",
    this.div.querySelector(".hud-world-button img").dataset.srcAssetId = "30211476",
    this.app.fire("objectmenu-disable"),
    this.viewTarget = "Town",
    UiTools.updateImageAssets(this.div)
}
,
HudUi.prototype.test = function() {
    console.log("test")
}
,
HudUi.prototype.JumpToWallet = function() {
    SettingsUI.instance.UI.OpenUI()
}
,
HudUi.prototype.expandCraft = function() {
    this.craftVisible = !0,
    this.craftTarget.style.visibility = "visible",
    this.craftTarget.querySelector(".hud-busy-icon").style.visibility = "visible",
    this.div.querySelector(".hud-expand-craft-button img").style.transform = "rotate(0deg)",
    this.expandCraftButton.addEventListener("click", (t=>{
        this.collapseCraft(),
        t.stopPropagation()
    }
    ))
}
,
HudUi.prototype.collapseCraft = function() {
    this.craftVisible = !1,
    this.craftTarget.style.visibility = "hidden",
    this.craftTarget.querySelector(".hud-busy-icon").style.visibility = "hidden",
    this.div.querySelector(".hud-expand-craft-button img").style.transform = "rotate(180deg)",
    this.expandCraftButton.addEventListener("click", (t=>{
        this.expandCraft(),
        t.stopPropagation()
    }
    ))
}
,
HudUi.prototype.ObjectAddedToTown = function(t, e) {}
,
HudUi.prototype.TownTouched = function(t) {
    Game.town && Game.town.townLoaded && (this.objectStoreButton.enabled = !1,
    this.objectInventoryButton.enabled = !1,
    this.townPosition = Game.town.WorldSpacePositionToLocalGrid(t.point.x, t.point.z),
    this.townPosition && "World" !== this.activeView && this.setStoreButtonVisibility())
}
,
HudUi.prototype.setStoreButtonVisibility = function() {
    if (!this.townPosition)
        return;
    let t = Game.town.GetObjectType(this.townPosition.x, this.townPosition.z);
    Game.objectData[t] && (Game.objectData[t].CanBuildUpon ? (this.objectStoreButton.style.visibility = "visible",
    this.objectInventoryButton.style.visibility = "visible") : (this.objectStoreButton.style.visibility = "hidden",
    this.objectInventoryButton.style.visibility = "hidden"))
}
,
HudUi.prototype.addPendingJimmyIcon = function(t) {}
,
HudUi.prototype.removePendingJimmyIcon = function(t) {}
;
var Vfxsound = pc.createScript("vfxsound");
Vfxsound.attributes.add("autoPlaySound", {
    type: "string",
    array: !1
}),
Vfxsound.prototype.initialize = function() {
    SETTINGS.soundEffectsEnabled && Game && Game.town && Game.town.townLoaded && this.entity.sound.play(this.autoPlaySound)
}
,
Vfxsound.prototype.update = function(t) {}
;
class TS_ConstructionSiteLogic extends TS_ObjectLogic {
    Initialize() {
        const t = Game.objectData[this.data.type].Construction;
        this.constructionData = Game.constructionData[t],
        this.constructionData.reqs = {},
        "none" !== this.constructionData.Req1 && (this.constructionData.reqs[this.constructionData.Req1] = this.constructionData.Value1),
        "none" !== this.constructionData.Req2 && (this.constructionData.reqs[this.constructionData.Req2] = this.constructionData.Value2),
        "none" !== this.constructionData.Req3 && (this.constructionData.reqs[this.constructionData.Req3] = this.constructionData.Value3),
        this.data.buildTime || (this.data.buildTime = 0),
        void 0 === this.data.receivedCrafts && (this.data.receivedCrafts = {}),
        void 0 === this.data.state && (this.HasRoom() ? this.data.state = "WaitForReqs" : this.data.state = "Timer");
        let e = ""
          , i = 0;
        if ("None" !== Game.objectData[this.data.type].TileWith ? e = "_Alone" : i = Game.town.GetRotationToEdgeClass(this.townObject.townX, this.townObject.townZ, this.data.type),
        !Game.objectData[this.data.type].HasDynamicGround)
            for (let t in this.entity.children)
                this.entity.children[t].name.startsWith("Ground") && this.entity.children[t].destroy();
        if (this.objectGhost = EntitySpawner.spawnObject(`${this.data.type}${e}`, this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.town.objParent),
        this.buildEntity = EntitySpawner.spawnObject(t, this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.town.objParent),
        this.buildEntity.children.filter((t=>t.particlesystem)).forEach((t=>t.particlesystem.reset())),
        this.setSkinnedEntity(SKINS.Construction_Site, this.buildEntity),
        this.objectGhost) {
            Game.town.townLoaded ? this.setRotation(i) : Game.town.objParent.once("Townloaded", (()=>{
                i = Game.town.GetRotationToEdgeClass(this.townObject.townX, this.townObject.townZ, this.data.type),
                this.setRotation(i)
            }
            )),
            this.ghostAndChildren = getSelfAndAllChildren(this.objectGhost);
            this.ghostAndChildren.filter((t=>{
                const e = t.model ? Game.app.assets.get(t.model.asset) : null
                  , i = e && e.loaded;
                return t.model && !i
            }
            )).map((t=>Game.app.assets.get(t.model.asset))).forEach((t=>{
                t && t.ready((t=>{
                    this.setMaterialOnGhost()
                }
                ))
            }
            )),
            this.setMaterialOnGhost();
            const t = this.objectGhost.findComponents("animation");
            for (let e of t)
                e.enabled = !1
        }
        if ("Complete" == this.data.state) {
            const t = this.buildEntity.findComponents("sound");
            for (let e of t)
                e.enabled = !1;
            this.SpawnNotifEntity()
        }
    }
    setMaterialOnGhost() {
        const t = pc.app.assets.find("BuildComplete");
        t && this.ghostAndChildren.forEach((e=>{
            if (e.name.startsWith("VFX") && (e.enabled = !1),
            e.model) {
                const i = e.model.meshInstances;
                i && i.forEach((e=>{
                    e.material = t.resource
                }
                ))
            }
            if (e.tags.has(Game.currentSeason)) {
                e.enabled = !0,
                e.children.forEach((t=>{}
                ));
                for (let i of e.children)
                    if (i.model) {
                        const e = i.model.meshInstances;
                        for (let i = 0; i < e.length; ++i) {
                            e[i].material = t.resource
                        }
                    }
            }
        }
        ))
    }
    setSkinnedEntity(t, e) {
        const i = []
          , s = [];
        e.children.filter((t=>t.tags.has("Skinnable"))).forEach((e=>{
            e.enabled = !1,
            !e.tags.has("Skin:Default") && e.tags.list().some((t=>t.startsWith("Skin:"))) || i.push(e),
            e.tags.has(`Skin:${t}`) && s.push(e)
        }
        ));
        a = t,
        Game.skinData[Object.keys(Game.skinData).find((t=>"Construction_Site" == Game.skinData[t].object && Game.skinData[t].skin == a))];
        var a;
        (s.length > 0 ? s : i).forEach((t=>{
            t.enabled = !0
        }
        ))
    }
    setRotation(t) {
        this.objectGhost.setEulerAngles(0, t, 0)
    }
    SpawnNotifEntity() {
        this.notifEntity && this.notifEntity.destroy();
        let t = this.entity.getPosition();
        this.notifEntity = EntitySpawner.spawnObject("TapToComplete", t.x, t.y, t.z, this.entity)
    }
    OnTapped() {
        "Complete" == this.data.state && this.CompleteBuild()
    }
    GetCountOfType(t) {
        return this.data.receivedCrafts[t] ? this.data.receivedCrafts[t] : 0
    }
    GetProxifiedCountOfType(t) {
        const e = Game.town.GetProximityEffects(this.townObject.townX, this.townObject.townZ)
          , i = this.constructionData.ProximityBonus.split(",");
        let s = 0;
        return this.data.receivedCrafts[t] && (s += this.data.receivedCrafts[t]),
        Object.keys(e).includes(t) && i.includes(t) && (s += e[t]),
        s
    }
    CanAcceptCraft(t) {
        const e = this.constructionData.reqs[t]
          , i = this.GetProxifiedCountOfType(t);
        return !!e && (!i || i < e)
    }
    HasRoom() {
        return Object.keys(this.GetProxifiedReqList()).length > 0
    }
    GetState() {
        return this.data.state
    }
    GetProxifiedReqList() {
        const t = Game.town.GetProximityEffects(this.townObject.townX, this.townObject.townZ)
          , e = this.constructionData.ProximityBonus.split(",")
          , i = {};
        for (let s of e)
            Object.keys(t).includes(s) && (i[s] = t[s]);
        const s = {};
        for (let t of Object.keys(this.constructionData.reqs)) {
            let e = this.constructionData.reqs[t];
            this.data.receivedCrafts[t] && (e -= this.data.receivedCrafts[t]),
            i[t] && (e -= i[t]),
            e > 0 && (s[t] = e)
        }
        return s
    }
    AddCraft(t, e=1) {
        let i = 0;
        return this.constructionData.reqs[t] && this.CanAcceptCraft(t) ? (this.data.receivedCrafts[t] ? this.data.receivedCrafts[t] += e : this.data.receivedCrafts[t] = e,
        i = e,
        this.data.receivedCrafts[t] > this.constructionData.reqs[t] && (i -= this.data.receivedCrafts[t] - this.constructionData.reqs[t],
        this.data.receivedCrafts[t] = this.constructionData.reqs[t]),
        this.HasRoom() || this.setState("Timer"),
        i) : 0
    }
    CompleteBuild() {
        LEDGER.completeObject(this.townObject.townX, this.townObject.townZ);
        const t = Game.town.AddObject(this.data.type, this.townObject.townX, this.townObject.townZ);
        Game.town.selectObject(t),
        setTimeout((()=>{
            const t = this.constructionData.BuildComplete;
            EntitySpawner.spawnObject(t, this.townObject.worldX, 0, this.townObject.worldZ, Game.app.root)
        }
        ), .1),
        Game.saveAll()
    }
    OnRemove() {
        this.buildAnimEntity && this.buildAnimEntity.destroy(),
        this.objectGhost && this.objectGhost.destroy(),
        this.buildEntity && this.buildEntity.destroy(),
        this.notifEntity && this.notifEntity.destroy()
    }
    GetProgress() {
        return this.data.buildTime / this.constructionData.Time0
    }
    setState(t) {
        this.data.state = t,
        "Timer" == t && (this.buildAnimEntity || (this.buildAnimEntity = EntitySpawner.spawnObject(this.constructionData.BuildVFX, this.townObject.worldX, 0, this.townObject.worldZ, this.entity)))
    }
    Update(t) {
        "WaitForReqs" == this.data.state && (this.HasRoom() || this.setState("Timer")),
        "Timer" == this.data.state && (this.data.buildTime += t,
        this.data.buildTime >= this.constructionData.Time0 && (this.setState("Complete"),
        this.buildAnimEntity && this.buildAnimEntity.destroy(),
        this.SpawnNotifEntity()))
    }
    getRequirementAmountOfCraft(t) {
        return this.constructionData.reqs[t]
    }
}
const UnitTask = (arrive = function() {
    this.log("Arrived"),
    this.hasArrived = !0,
    this.onArrive()
}
,
hasReachedTarget = function() {
    return this.unit.entity.getPosition().distance(this.targetObject.entity.getPosition()) < .01
}
,
class UnitTask {
    static goingHomeToIdle(t) {
        if (!t)
            return !1;
        const i = t.getTask();
        return !!i && i.targetObject == t.building && "WaitForUnits" !== i.targetObject.GetState() && !t.GetCarriedCraft()
    }
    constructor(t, i) {
        this.hasArrived = !1,
        this.targetObject = i,
        this.unit = t
    }
    onArrive() {
        this.unit.setTask(null)
    }
    onInvalid(t) {
        this.log(`Unit Task no longer valid [${this.targetObject}]`),
        this.onFail()
    }
    onSuccess() {}
    onFail() {
        this.log("Unit Task Failed"),
        this.unit.setTask(null)
    }
    validate() {
        return !(!this.unit.exists || !this.targetObject.exists)
    }
    tick(t) {
        this.validate() ? (this.unit.move(t),
        this.hasArrived || hasReachedTarget.bind(this)() && arrive.bind(this)()) : this.onInvalid()
    }
}
);
class UnitGetTask extends UnitTask {
    constructor(t, i, e) {
        super(t, i),
        this.craft = e
    }
    onArrive() {
        this.targetObject.claimedBy = null,
        this.targetObject.RemoveCraft(this.craft) ? (this.unit.setCraft(this.craft),
        LEDGER.unitPickup(this.unit.building.townX, this.unit.building.townZ, this.unit.index, this.targetObject.townX, this.targetObject.townZ, this.craft),
        this.onSuccess()) : this.onFail()
    }
    onSuccess() {
        setTimeout((()=>{
            this.targetObject.entity.fire("PlaySound", "Harvest"),
            this.targetObject.entity.fire("PlayVFX", "Harvest"),
            this.unit.entity.fire("PlayAnim", "WalkCraft.json", !0),
            this.unit.entity.fire("UpdateUnitCraft", this.craft)
        }
        ), .1),
        this.unit.setTask(null)
    }
    validate() {
        return super.validate() && !this.unit.GetCarriedCraft() && this.targetObject.CanDispenseCraft(this.craft) && Game.town.laborPaid && this.unit.building.logicObject.reqsValid
    }
}
class UnitDeliverTask extends UnitTask {
    constructor(t, i, e) {
        super(t, i),
        this.craft = e
    }
    onArrive() {
        this.log("Arrived At Deliver Target"),
        this.targetObject.AddCraft(this.craft) ? (LEDGER.unitStore(this.unit.building.townX, this.unit.building.townZ, this.unit.index, this.targetObject.townX, this.targetObject.townZ),
        this.onSuccess()) : this.onFail()
    }
    onSuccess() {
        if (this.unit.setCraft(null),
        this.unit.entity.fire("UpdateUnitCraft", null),
        TS_ObjectLogic.GetLogicType(this.targetObject.type)) {
            const t = this.targetObject.entity.getPosition();
            EntitySpawner.spawnObject(Game.craftData[this.craft].OnDestroy, t.x, 0, t.z, Game.app.root)
        }
        this.unit.entity.fire("PlayAnim", "Walk.json", !0),
        this.unit.setTask(null)
    }
    validate() {
        return super.validate() && this.unit.GetCarriedCraft() == this.craft && this.targetObject.CanAcceptCraft(this.craft) && Game.town.laborPaid
    }
}
class UnitGetOutputTask extends UnitGetTask {
    onSuccess() {
        super.onSuccess();
        const t = this.unit.logicObject.findDeliverOutputTask(this.unit.GetCarriedCraft());
        t ? this.unit.setTask(t) : this.unit.logicObject.findOutputNukeTask()
    }
    validate() {
        return super.validate()
    }
}
class UnitGetInputTask extends UnitGetTask {
    constructor(t, i, e, s) {
        super(t, i),
        this.craft = e,
        this.forTarget = s,
        this.deliverTask = new UnitDeliverInputTask(this.unit,this.forTarget,this.craft)
    }
    onSuccess() {
        super.onSuccess(),
        this.unit.setTask(this.deliverTask)
    }
    validate() {
        return super.validate() && this.forTarget.exists && this.forTarget.CanAcceptCraft(this.craft)
    }
}
class UnitDeliverOutputTask extends UnitDeliverTask {
    validate() {
        return super.validate()
    }
    onFail() {
        let t = null;
        if (Game.town.laborPaid && (t = this.unit.logicObject.findDeliverOutputTask(this.unit.GetCarriedCraft())),
        t)
            this.unit.setTask(t);
        else {
            const t = this.unit.logicObject.findNukeTarget();
            t ? this.unit.setTask(new NukeOutputTask(this.unit,t)) : this.unit.logicObject.nukeCraft()
        }
    }
}
class UnitDeliverInputTask extends UnitDeliverTask {
    validate() {
        return super.validate()
    }
    onFail() {
        let t = null;
        if (Game.town.laborPaid && (t = this.unit.logicObject.findDeliverInputTask(this.unit.GetCarriedCraft())),
        t)
            this.unit.setTask(t);
        else {
            const t = this.unit.logicObject.findNukeTarget();
            t ? this.unit.setTask(new NukeInputTask(this.unit,t)) : this.unit.logicObject.nukeCraft()
        }
    }
}
class NukeCraftTask extends UnitTask {
    onArrive() {
        this.unit.nukeCraft(),
        LEDGER.unitDestroy(this.unit.building.townX, this.unit.building.townZ, this.unit.index),
        this.unit.setTask(null)
    }
}
class NukeOutputTask extends NukeCraftTask {
    onArrive() {
        let t = null;
        Game.town.laborPaid && (t = this.unit.logicObject.findDeliverOutputTask(this.unit.GetCarriedCraft())),
        t ? this.unit.setTask(t) : (this.unit.nukeCraft(),
        this.unit.setTask(null))
    }
}
class NukeInputTask extends NukeCraftTask {
    onArrive() {
        Game.town.laborPaid && this.unit.logicObject.findDeliverInputTask(this.unit.GetCarriedCraft()),
        this.unit.nukeCraft(),
        this.unit.setTask(null)
    }
}
UnitTask.prototype.log = logger({
    context: "UnitTask",
    color: "orange",
    timing: !0
});
"undefined" != typeof document && (/*! FPSMeter 0.3.1 - 9th May 2013 | https://github.com/Darsain/fpsmeter */
function(t, e) {
    function s(t, e) {
        for (var n in e)
            try {
                t.style[n] = e[n]
            } catch (t) {}
        return t
    }
    function H(t) {
        return null == t ? String(t) : "object" == typeof t || "function" == typeof t ? Object.prototype.toString.call(t).match(/\s([a-z]+)/i)[1].toLowerCase() || "object" : typeof t
    }
    function R(t, e) {
        if ("array" !== H(e))
            return -1;
        if (e.indexOf)
            return e.indexOf(t);
        for (var n = 0, o = e.length; n < o; n++)
            if (e[n] === t)
                return n;
        return -1
    }
    function I() {
        var t, e = arguments;
        for (t in e[1])
            if (e[1].hasOwnProperty(t))
                switch (H(e[1][t])) {
                case "object":
                    e[0][t] = I({}, e[0][t], e[1][t]);
                    break;
                case "array":
                    e[0][t] = e[1][t].slice(0);
                    break;
                default:
                    e[0][t] = e[1][t]
                }
        return 2 < e.length ? I.apply(null, [e[0]].concat(Array.prototype.slice.call(e, 2))) : e[0]
    }
    function N(t) {
        return 1 === (t = Math.round(255 * t).toString(16)).length ? "0" + t : t
    }
    function S(t, e, n, o) {
        t.addEventListener ? t[o ? "removeEventListener" : "addEventListener"](e, n, !1) : t.attachEvent && t[o ? "detachEvent" : "attachEvent"]("on" + e, n)
    }
    function D(t, e) {
        function g(t, e, n, o) {
            return h[0 | t][Math.round(Math.min((e - n) / (o - n) * E, E))]
        }
        function r() {
            O.legend.fps !== q && (O.legend.fps = q,
            O.legend[c] = q ? "FPS" : "ms"),
            b = q ? v.fps : v.duration,
            O.count[c] = 999 < b ? "999+" : b.toFixed(99 < b ? 0 : F.decimals)
        }
        function m() {
            for (l = n(),
            A < l - F.threshold && (v.fps -= v.fps / Math.max(1, 60 * F.smoothing / F.interval),
            v.duration = 1e3 / v.fps),
            w = F.history; w--; )
                P[w] = 0 === w ? v.fps : P[w - 1],
                j[w] = 0 === w ? v.duration : j[w - 1];
            if (r(),
            F.heat) {
                if (M.length)
                    for (w = M.length; w--; )
                        M[w].el.style[o[M[w].name].heatOn] = q ? g(o[M[w].name].heatmap, v.fps, 0, F.maxFps) : g(o[M[w].name].heatmap, v.duration, F.threshold, 0);
                if (O.graph && o.column.heatOn)
                    for (w = C.length; w--; )
                        C[w].style[o.column.heatOn] = q ? g(o.column.heatmap, P[w], 0, F.maxFps) : g(o.column.heatmap, j[w], F.threshold, 0)
            }
            if (O.graph)
                for (y = 0; y < F.history; y++)
                    C[y].style.height = (q ? P[y] ? Math.round(x / F.maxFps * Math.min(P[y], F.maxFps)) : 0 : j[y] ? Math.round(x / F.threshold * Math.min(j[y], F.threshold)) : 0) + "px"
        }
        function k() {
            20 > F.interval ? (p = i(k),
            m()) : (p = setTimeout(k, F.interval),
            f = i(m))
        }
        function G(t) {
            (t = t || window.event).preventDefault ? (t.preventDefault(),
            t.stopPropagation()) : (t.returnValue = !1,
            t.cancelBubble = !0),
            v.toggle()
        }
        function U() {
            F.toggleOn && S(O.container, F.toggleOn, G, 1),
            t.removeChild(O.container)
        }
        function V() {
            if (O.container && U(),
            o = D.theme[F.theme],
            !(h = o.compiledHeatmaps || []).length && o.heatmaps.length) {
                for (y = 0; y < o.heatmaps.length; y++)
                    for (h[y] = [],
                    w = 0; w <= E; w++) {
                        var e, n = h[y], a = w;
                        e = .33 / E * w;
                        var i = o.heatmaps[y].saturation
                          , l = o.heatmaps[y].lightness
                          , p = void 0
                          , c = void 0
                          , u = void 0
                          , d = u = void 0
                          , f = p = c = void 0;
                        f = void 0;
                        0 === (u = .5 >= l ? l * (1 + i) : l + i - l * i) ? e = "#000" : (c = (u - (d = 2 * l - u)) / u,
                        f = (e *= 6) - (p = Math.floor(e)),
                        f *= u * c,
                        0 === p || 6 === p ? (p = u,
                        c = d + f,
                        u = d) : 1 === p ? (p = u - f,
                        c = u,
                        u = d) : 2 === p ? (p = d,
                        c = u,
                        u = d + f) : 3 === p ? (p = d,
                        c = u - f) : 4 === p ? (p = d + f,
                        c = d) : (p = u,
                        c = d,
                        u -= f),
                        e = "#" + N(p) + N(c) + N(u)),
                        n[a] = e
                    }
                o.compiledHeatmaps = h
            }
            for (var b in O.container = s(document.createElement("div"), o.container),
            O.count = O.container.appendChild(s(document.createElement("div"), o.count)),
            O.container.classList.add("hud-fps"),
            O.legend = O.container.appendChild(s(document.createElement("div"), o.legend)),
            O.graph = F.graph ? O.container.appendChild(s(document.createElement("div"), o.graph)) : 0,
            M.length = 0,
            O)
                O[b] && o[b].heatOn && M.push({
                    name: b,
                    el: O[b]
                });
            if (C.length = 0,
            O.graph)
                for (O.graph.style.width = F.history * o.column.width + (F.history - 1) * o.column.spacing + "px",
                w = 0; w < F.history; w++)
                    C[w] = O.graph.appendChild(s(document.createElement("div"), o.column)),
                    C[w].style.position = "absolute",
                    C[w].style.bottom = 0,
                    C[w].style.right = w * o.column.width + w * o.column.spacing + "px",
                    C[w].style.width = o.column.width + "px",
                    C[w].style.height = "0px";
            s(O.container, F),
            r(),
            t.appendChild(O.container),
            O.graph && (x = O.graph.clientHeight),
            F.toggleOn && ("click" === F.toggleOn && (O.container.style.cursor = "pointer"),
            S(O.container, F.toggleOn, G))
        }
        "object" === H(t) && undefined === t.nodeType && (e = t,
        t = document.body),
        t || (t = document.body);
        var o, h, l, p, f, x, b, w, y, v = this, F = I({}, D.defaults, e || {}), O = {}, C = [], E = 100, M = [], z = F.threshold, T = 0, A = n() - z, P = [], j = [], q = "fps" === F.show;
        v.options = F,
        v.fps = 0,
        v.duration = 0,
        v.isPaused = 0,
        v.tickStart = function() {
            T = n()
        }
        ,
        v.tick = function() {
            l = n(),
            z += (l - A - z) / F.smoothing,
            v.fps = 1e3 / z,
            v.duration = T < A ? z : l - T,
            A = l
        }
        ,
        v.pause = function() {
            return p && (v.isPaused = 1,
            clearTimeout(p),
            a(p),
            a(f),
            p = f = 0),
            v
        }
        ,
        v.resume = function() {
            return p || (v.isPaused = 0,
            k()),
            v
        }
        ,
        v.set = function(t, e) {
            return F[t] = e,
            q = "fps" === F.show,
            -1 !== R(t, u) && V(),
            -1 !== R(t, d) && s(O.container, F),
            v
        }
        ,
        v.showDuration = function() {
            return v.set("show", "ms"),
            v
        }
        ,
        v.showFps = function() {
            return v.set("show", "fps"),
            v
        }
        ,
        v.toggle = function() {
            return v.set("show", q ? "ms" : "fps"),
            v
        }
        ,
        v.hide = function() {
            return v.pause(),
            O.container.style.display = "none",
            v
        }
        ,
        v.show = function() {
            return v.resume(),
            O.container.style.display = "block",
            v
        }
        ,
        v.destroy = function() {
            v.pause(),
            U(),
            v.tick = v.tickStart = function() {}
        }
        ,
        V(),
        k()
    }
    var n, o = t.performance;
    n = o && (o.now || o.webkitNow) ? o[o.now ? "now" : "webkitNow"].bind(o) : function() {
        return +new Date
    }
    ;
    for (var a = t.cancelAnimationFrame || t.cancelRequestAnimationFrame, i = t.requestAnimationFrame, h = 0, l = 0, p = (o = ["moz", "webkit", "o"]).length; l < p && !a; ++l)
        i = (a = t[o[l] + "CancelAnimationFrame"] || t[o[l] + "CancelRequestAnimationFrame"]) && t[o[l] + "RequestAnimationFrame"];
    a || (i = function(e) {
        var o = n()
          , a = Math.max(0, 16 - (o - h));
        return h = o + a,
        t.setTimeout((function() {
            e(o + a)
        }
        ), a)
    }
    ,
    a = function(t) {
        clearTimeout(t)
    }
    );
    var c = "string" === H(document.createElement("div").textContent) ? "textContent" : "innerText";
    D.extend = I,
    window.FPSMeter = D,
    D.defaults = {
        interval: 100,
        smoothing: 10,
        show: "fps",
        toggleOn: "click",
        decimals: 1,
        maxFps: 60,
        threshold: 100,
        position: "absolute",
        zIndex: 10,
        left: "5px",
        top: "5px",
        right: "auto",
        bottom: "auto",
        margin: "0 0 0 0",
        theme: "dark",
        heat: 0,
        graph: 0,
        history: 20
    };
    var u = ["toggleOn", "theme", "heat", "graph", "history"]
      , d = "position zIndex left top right bottom margin".split(" ")
}(window),
function(t, e) {
    e.theme = {};
    var n = e.theme.base = {
        heatmaps: [],
        container: {
            heatOn: null,
            heatmap: null,
            padding: "5px",
            minWidth: "95px",
            height: "30px",
            lineHeight: "30px",
            textAlign: "right",
            textShadow: "none"
        },
        count: {
            heatOn: null,
            heatmap: null,
            position: "absolute",
            top: 0,
            right: 0,
            padding: "5px 10px",
            height: "30px",
            fontSize: "24px",
            fontFamily: "Consolas, Andale Mono, monospace",
            zIndex: 2
        },
        legend: {
            heatOn: null,
            heatmap: null,
            position: "absolute",
            top: 0,
            left: 0,
            padding: "5px 10px",
            height: "30px",
            fontSize: "12px",
            lineHeight: "32px",
            fontFamily: "sans-serif",
            textAlign: "left",
            zIndex: 2
        },
        graph: {
            heatOn: null,
            heatmap: null,
            position: "relative",
            boxSizing: "padding-box",
            MozBoxSizing: "padding-box",
            height: "100%",
            zIndex: 1
        },
        column: {
            width: 4,
            spacing: 1,
            heatOn: null,
            heatmap: null
        }
    };
    e.theme.dark = e.extend({}, n, {
        heatmaps: [{
            saturation: .8,
            lightness: .8
        }],
        container: {
            background: "#222",
            color: "#fff",
            border: "1px solid #1a1a1a",
            textShadow: "1px 1px 0 #222"
        },
        count: {
            heatOn: "color"
        },
        column: {
            background: "#3f3f3f"
        }
    }),
    e.theme.light = e.extend({}, n, {
        heatmaps: [{
            saturation: .5,
            lightness: .5
        }],
        container: {
            color: "#666",
            background: "#fff",
            textShadow: "1px 1px 0 rgba(255,255,255,.5), -1px -1px 0 rgba(255,255,255,.5)",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1)"
        },
        count: {
            heatOn: "color"
        },
        column: {
            background: "#eaeaea"
        }
    }),
    e.theme.colorful = e.extend({}, n, {
        heatmaps: [{
            saturation: .5,
            lightness: .6
        }],
        container: {
            heatOn: "backgroundColor",
            background: "#888",
            color: "#fff",
            textShadow: "1px 1px 0 rgba(0,0,0,.2)",
            boxShadow: "0 0 0 1px rgba(0,0,0,.1)"
        },
        column: {
            background: "#777",
            backgroundColor: "rgba(0,0,0,.2)"
        }
    }),
    e.theme.transparent = e.extend({}, n, {
        heatmaps: [{
            saturation: .8,
            lightness: .5
        }],
        container: {
            padding: 0,
            color: "#fff",
            textShadow: "1px 1px 0 rgba(0,0,0,.5)"
        },
        count: {
            padding: "0 5px",
            height: "40px",
            lineHeight: "40px"
        },
        legend: {
            padding: "0 5px",
            height: "40px",
            lineHeight: "42px"
        },
        graph: {
            height: "40px"
        },
        column: {
            width: 5,
            background: "#999",
            heatOn: "backgroundColor",
            opacity: .5
        }
    })
}(window, FPSMeter));
var Fps = pc.createScript("Fps");
Fps.prototype.initialize = function() {
    this.fps = new FPSMeter({
        heat: !0,
        graph: !0
    }),
    SETTINGS.onAndNow("showFps", (()=>{
        const t = document.querySelector(".hud-fps");
        t.style.visibility = SETTINGS.showFps ? "visible" : "hidden",
        t.style.left = "50%"
    }
    ))
}
,
Fps.prototype.update = function(t) {
    SETTINGS.showFps && this.fps.tick()
}
;
var CustomConfirm = pc.createScript("customConfirm");
CustomConfirm.attributes.add("html", {
    type: "asset",
    assetType: "html"
}),
CustomConfirm.prototype.initialize = function() {
    CustomConfirm.instance = this,
    this.UI = new TS_CustomConfirmUI({
        html: this.html,
        divClass: "container",
        fullScreenUI: !1
    })
}
;
class TS_CustomConfirmUI extends TS_UIBase {
    Open(t) {
        t.npcAssetID && (this.npcAssetID = t.npcAssetID),
        this.footerContent = t.footerContent,
        this.ReloadUI(),
        this.header.innerText = t.headerText,
        this.messageBody.innerText = t.messageBodyText,
        this.confirmButtonText.innerText = t.confirmText,
        this.declineButtonText.innerText = t.declineText,
        this.closeButton.addEventListener("click", (()=>{
            this.CloseUI()
        }
        )),
        this.confirmButtonText.addEventListener("click", (()=>{
            this.CloseUI()
        }
        )),
        this.declineButtonText.addEventListener("click", (()=>{
            this.CloseUI()
        }
        )),
        this.closeButton.addEventListener("click", t.onClose),
        this.confirmButtonText.addEventListener("click", t.onConfirm),
        this.declineButtonText.addEventListener("click", t.onDecline),
        this.OpenUI(),
        t.onOpen && t.onOpen()
    }
    OnReload() {
        this.header = this.div.querySelector("#headerText"),
        this.messageBody = this.div.querySelector("#messageText"),
        this.closeButton = this.div.querySelector("#closeBtn"),
        this.confirmButton = this.div.querySelector("#confirmBtn"),
        this.declineButton = this.div.querySelector("#declineBtn"),
        this.confirmButtonText = this.confirmButton.querySelector("span"),
        this.declineButtonText = this.declineButton.querySelector("span"),
        this.npcIcon = this.div.querySelector("#npcIcon"),
        this.npcAssetID && (this.npcIcon.dataset.srcAssetId = this.npcAssetID),
        this.footerArea = this.div.querySelector("#footer-area"),
        this.footerContent ? (this.footerArea.style.display = "",
        this.footerArea.innerHTML = this.footerContent) : this.footerArea.style.display = "none",
        this.UpdateImageAssets()
    }
}
var UpgradeUi = pc.createScript("upgradeUi");
UpgradeUi.prototype.initialize = function() {
    UpgradeUi.instance = this,
    this.UI = new TS_UpgradeUI({
        name: "upgrade.html",
        divClass: "container",
        fullScreenUI: !0
    })
}
;
class TS_UpgradeUI extends TS_UIBase {
    Open(e) {
        const t = e.type;
        "Dirt_Road" == t && (this.townObject = e,
        this.upgradeTotype = "Paved_Road",
        this.currentIcon.dataset.srcAssetName = UiTools.getIconFileName(t),
        this.upgradeIcon.dataset.srcAssetName = UiTools.getIconFileName(this.upgradeTotype),
        this.currentName.innerText = `${Grabbatron.pullEntry(`${Game.objectData[t].Id}_0`)}`,
        this.upgradeName.innerText = `${Grabbatron.pullEntry(`${Game.objectData[this.upgradeTotype].Id}_0`)}`,
        this.upgradeCost = Game.objectData[this.upgradeTotype].BuildCost - Game.objectData[t].DestroyCost,
        this.upgradecost.innerText = this.upgradeCost.toLocaleString(),
        this.UpdatePurchaseButton(),
        this.currencyEventRegistered || (Game.app.on("PlayerCurrencyChanged", this.UpdatePurchaseButton, this),
        this.currencyEventRegistered = !0),
        this.OpenUI())
    }
    UpdatePurchaseButton() {
        Game.currency >= this.upgradeCost ? this.upgradeButton.disabled = !1 : this.upgradeButton.disabled = !0
    }
    Initialize() {
        this.closeButton = this.div.querySelector(".close-button"),
        this.closeButton.addEventListener("click", (e=>{
            this.CloseUI()
        }
        )),
        this.closeButton.addEventListener("mousedown", (e=>e.stopPropagation())),
        this.closeButton.addEventListener("mouseup", (e=>e.stopPropagation())),
        this.closeButton.addEventListener("wheel", (e=>e.stopPropagation()), {
            passive: !0
        }),
        this.upgradeButton = this.div.querySelector(".buy-currency"),
        this.upgradeButton.addEventListener("click", (e=>{
            this.upgradeClicked()
        }
        )),
        this.upgradeButton.addEventListener("mousedown", (e=>e.stopPropagation())),
        this.upgradeButton.addEventListener("mouseup", (e=>e.stopPropagation())),
        this.upgradeButton.addEventListener("wheel", (e=>e.stopPropagation()), {
            passive: !0
        }),
        this.upgradecost = this.div.querySelector(".buy-currency span"),
        this.currentIcon = this.div.querySelector("#currentObjectIcon"),
        this.currentName = this.div.querySelector("#CurrentType"),
        this.upgradeIcon = this.div.querySelector("#upgradeObjectIcon"),
        this.upgradeName = this.div.querySelector("#UpgradeToType"),
        this.upgradeMessageText = this.div.querySelector(".bubble span")
    }
    OnOpen() {
        this.UpdateImagesAndTranslate()
    }
    OnInternetConnectionLost() {
        this.CloseUI()
    }
    upgradeClicked() {
        if (Game.currency >= this.upgradeCost) {
            Game.addCurrency(-1 * this.upgradeCost);
            const e = this.townObject.townX
              , t = this.townObject.townZ;
            Game.town.RemoveObject(e, t, !1),
            Game.town.AddObject("Construction_Site", e, t, 0, {
                type: this.upgradeTotype
            }),
            LEDGER.buyObject(e, t, this.upgradeTotype, {
                currency: this.upgradeCost
            })
        }
        this.CloseUI()
    }
}
var AirDropUi = pc.createScript("AirDropUi");
AirDropUi.prototype.initialize = function() {
    AirDropUi.instance = this,
    this.UI = new TS_AirDropUI({
        name: "airDrop.html",
        divClass: "container",
        fullScreenUI: !0
    })
}
;
class TS_AirDropUI extends TS_UIBase {
    OpenUI(t) {
        t && (this.dropData = t,
        super.OpenUI())
    }
    OnOpen() {
        this.ReloadUI()
    }
    OnReload() {
        this.titleText = this.div.querySelector(".header-row h1"),
        this.messageText = this.div.querySelector(".body-row .bubble"),
        this.contentTitle = this.div.querySelector(".body-row h2"),
        this.contentArea = this.div.querySelector(".body-row .text-bg"),
        this.dropCriteriaMet = this.div.querySelector(".body-row #drop-criteria-met"),
        this.craftImageElement = this.contentArea.querySelector("img"),
        this.craftNameElement = this.contentArea.querySelector("h3"),
        this.closeButton = this.div.querySelector(".close-button"),
        this.yesButton = this.div.querySelector(".confirm-buttons .yes"),
        this.noButton = this.div.querySelector(".confirm-buttons .no"),
        this.closeButton.addEventListener("click", (t=>{
            this.CloseUI()
        }
        )),
        this.closeButton.addEventListener("mousedown", (t=>t.stopPropagation())),
        this.closeButton.addEventListener("mouseup", (t=>t.stopPropagation())),
        this.closeButton.addEventListener("wheel", (t=>t.stopPropagation()), {
            passive: !0
        }),
        this.yesButton.addEventListener("click", this.acceptDrop.bind(this)),
        this.yesButton.addEventListener("mousedown", (t=>t.stopPropagation())),
        this.yesButton.addEventListener("mouseup", (t=>t.stopPropagation())),
        this.yesButton.addEventListener("wheel", (t=>t.stopPropagation()), {
            passive: !0
        }),
        this.noButton.addEventListener("click", this.rejectDrop.bind(this)),
        this.noButton.addEventListener("mousedown", (t=>t.stopPropagation())),
        this.noButton.addEventListener("mouseup", (t=>t.stopPropagation())),
        this.noButton.addEventListener("wheel", (t=>t.stopPropagation()), {
            passive: !0
        });
        const t = Object.keys(this.dropData.drop.crafts)
          , e = Game.craftData[t[0]];
        this.craftNameElement.innerText = `${this.dropData.drop.crafts[e.Name]} ${Grabbatron.pullEntry(e.Id)}`,
        this.craftImageElement.dataset.srcAssetName = UiTools.getIconFileName(e.Name),
        this.dropData.balance && (this.dropCriteriaMet.innerText = `Congrats! You have over ${this.dropData.balance.toLocaleString()} Gala Coins in your account. You are eligible for a staking reward!`),
        this.UpdateImagesAndTranslate()
    }
    OnInternetConnectionLost() {
        this.CloseUI()
    }
    acceptDrop() {
        this.dropData.claiming = !0,
        setTimeout((()=>{
            this.spawnDoobs(this.planeEntity, this.dropData),
            Game.town.pendingDrops.pop()
        }
        ), 8e3),
        this.planeEntity = EntitySpawner.spawnObject("VFX_AirDropPlane", -462.5, 0, 37.5, Game.town.objParent),
        this.CloseUI()
    }
    spawnDoobs(t, e) {
        const o = Object.keys(e.drop.crafts)[0]
          , s = e.drop.crafts[o]
          , i = t.findByName("CraftNode")
          , r = i.getPosition()
          , n = Game.town.addCraft(o, s)
          , a = {
            [o]: n.storage.map((t=>({
                x: t.obj.townX,
                z: t.obj.townZ,
                amount: t.amount
            })))
        };
        LEDGER.claimDrop(e.id, a);
        const p = [];
        for (let t of n.storage)
            p.push(EntitySpawner.spawnObject("DooberSpawner_AirDrop", r.x, r.y, r.z, i));
        if (p[0] && p[0].fire("DooberSetup", n.storage[0].obj, o, n.storage[0].amount),
        p.length > 1)
            for (let t = 0; t < p.length; t++)
                p[t + 1] && p[t].once("LastDooberComplete", (()=>{
                    console.log("Last Doober"),
                    p[t + 1].fire("DooberSetup", n.storage[t + 1].obj, o, n.storage[t + 1].amount)
                }
                ))
    }
    rejectDrop() {
        RT.rejectDrop(this.dropData.id),
        Game.town.pendingDrops.pop(),
        this.CloseUI()
    }
}
var AnimateOnevent = pc.createScript("animateOnevent");
AnimateOnevent.attributes.add("eventName", {
    type: "string"
}),
AnimateOnevent.prototype.initialize = function() {
    this.entity.animation && Game.app.on(this.eventName, (()=>{
        this.entity.animation.play(this.entity.animation.currAnim)
    }
    ))
}
,
AnimateOnevent.prototype.update = function(t) {}
;
var ServerSelectUi = pc.createScript("serverSelectUi");
ServerSelectUi.prototype.initialize = function() {
    ServerSelectUi.instance = this,
    this.UI = new TS_ServerSelectUi({
        name: "serverSelect.html",
        divClass: "container",
        fullScreenUI: !0
    })
}
;
const getHumanizeTimeFormat = e=>{
    if (e / 86400 > 1) {
        const t = Math.floor(e / 86400);
        return `${t} ${1 === t ? "Day" : "Days"}`
    }
    if (e > 3600) {
        const t = Math.floor(e / 3600);
        return `${t} ${1 === t ? "Hour" : "Hours"}`
    }
    if (e > 60) {
        const t = Math.floor(e / 60);
        return `${t} ${t > 1 ? "Minutes" : "Minute"}`
    }
    return `${e} ${e > 1 ? "Seconds" : "Second"}`
}
;
class TS_ServerSelectUi extends TS_UIBase {
    Initialize() {
        this.serverTemplate = this.div.querySelector("#server-template"),
        this.bodyRow = this.div.querySelector(".body-row")
    }
    addServerToBodyRow(e) {
        const t = document.importNode(this.serverTemplate.content, !0)
          , r = t.querySelector("div")
          , n = t.querySelector(".name")
          , i = t.querySelector(".population p")
          , o = t.querySelector("#remainingTime")
          , s = t.querySelector(".join-button p")
          , a = t.querySelector("#startsIn")
          , l = t.querySelector("#gameActive");
        if (a.style.display = "none",
        n.innerText = e.name,
        i.innerText = e.population.toLocaleString(),
        e.active) {
            const t = e.secondsRemaining;
            o.innerText = getHumanizeTimeFormat(t)
        } else {
            const t = (new Date(e.next.start) - Date.now()) / 1e3;
            l.innerText = "INACTIVE",
            l.classList.add("inactive"),
            a.style.display = "",
            o.innerText = "3 Days",
            o.innerText = getHumanizeTimeFormat(t)
        }
        return API.gameId == e.gameId ? (r.classList.add("me"),
        s.innerText = "RETURN",
        s.addEventListener("click", (e=>{
            API.event("server_select"),
            this.CloseUI()
        }
        ))) : s.addEventListener("click", (t=>{
            API.setServer(e.gameId).then((()=>{
                API.event("server_select"),
                location.reload()
            }
            ))
        }
        )),
        this.bodyRow.appendChild(t),
        t
    }
    OnOpen() {
        this.bodyRow.innerHTML = "",
        this.UpdateImageAssets(),
        API.getGames().then((e=>{
            console.log(e);
            for (let t of e.sort(((e,t)=>"weekly" === e.gameId ? 1 : "weekly" === t.gameId ? -1 : e.population - t.population)))
                this.addServerToBodyRow(t);
            this.UpdateImageAssets()
        }
        ))
    }
}
var CurrencyMixin = {
    data: ()=>({
        currency: 0,
        gold: 0
    }),
    methods: {
        currencyChanged(e) {
            this.currency = e
        },
        goldChanged(e) {
            this.gold = e
        }
    },
    created() {
        this.gold = Game.gold,
        this.currency = Game.currency,
        pc.app.on("PlayerCurrencyChanged", this.currencyChanged),
        pc.app.on("PlayerGoldChanged", this.goldChanged)
    },
    destroyed() {
        pc.app.off("PlayerCurrencyChanged", this.currencyChanged),
        pc.app.off("PlayerGoldChanged", this.goldChanged)
    }
}
  , ObjectMixin = (()=>{
    const update = function() {
        this.crafts = ("None" !== this.object.Crafts ? this.object.Crafts.split(",") : []).map((e=>Game.craftData[e])),
        this.hasUnit = "None" !== this.object.UnitType,
        this.edgeRequirementMet = Game.town.CheckEdgeRequirementsMet(this.object.Name, this.x, this.z),
        console.log("this.edgeRequirementMet" + this.edgeRequirementMet),
        this.constructionData = Game.constructionData[this.object.Construction];
        const e = [this.constructionData.Req1, this.constructionData.Req2, this.constructionData.Req3]
          , t = [this.constructionData.Value1, this.constructionData.Value2, this.constructionData.Value3];
        if (this.constructionRequirements = e.map(((e,n)=>({
            craft: e,
            amount: t[n]
        }))).filter((e=>"none" !== e.craft)),
        this.fungible)
            this.placed = Game.town.GetCountOfObject(this.object.Name);
        else if (this.nonFungible) {
            const e = Game.town.findNonFungibleObject(this.contract, this.tokenId);
            this.placed = e ? 1 : 0
        }
    };
    return {
        data: ()=>({
            crafts: [],
            hasUnit: !1,
            edgeRequirementMet: !1,
            constructionData: null,
            constructionRequirements: [],
            placed: 0
        }),
        computed: {
            canAcquire() {
                return this.fungible || this.nonFungible ? !this.pending && (this.edgeRequirementMet && this.placed < this.count) : (this.hasCurrency || this.hasGold) && this.edgeRequirementMet
            },
            hasCurrency() {
                return this.currency >= this.object.BuildCost
            },
            hasGold() {
                return this.gold >= this.object.GoldCost
            },
            count() {
                return this.fungible ? INVENTORY.getAvailable(this.object.BlockChainID) : this.nonFungible ? INVENTORY.getAvailable(this.contract, this.tokenId) : 0
            }
        },
        watch: {
            object: function() {
                update.apply(this)
            }
        },
        methods: {
            worldTownChanged(e) {
                if (!Game.position)
                    return;
                const t = new pc.Vec2(Game.position.x,Game.position.y)
                  , n = new pc.Vec2(e.x,e.y);
                1 === t.distance(n) && update.apply(this)
            }
        },
        created() {
            this.object && (update.apply(this),
            pc.app.on("WorldTownCreate", this.worldTownChanged),
            pc.app.on("WorldTownDelete", this.worldTownChanged))
        },
        destroyed() {
            pc.app.off("WorldTownCreate", this.worldTownChanged),
            pc.app.off("WorldTownDelete", this.worldTownChanged)
        }
    }
}
)()
  , ScreenMixin = {
    data: ()=>({
        visible: !1,
        fullscreen: !1
    }),
    methods: {
        open() {
            this.visible || (this.visible = !0,
            this.$emit("open"),
            this.fullscreen && (Game.app.fire("hud-disable"),
            Game.app.fire("objectmenu-disable"),
            Game.app.fire("object-float-disable")))
        },
        close() {
            this.visible && (this.visible = !1,
            this.$emit("close"),
            this.fullscreen && (Game.app.fire("hud-enable"),
            Game.app.fire("objectmenu-enable"),
            Game.app.fire("object-float-enable")))
        },
        onInternetDisconnected() {
            this.close()
        }
    },
    created() {
        pc.app.on("InternetConnectionLost", this.onInternetDisconnected)
    },
    destroyed() {
        pc.app.off("InternetConnectionLost", this.onInternetDisconnected)
    }
}
  , BoardScreenMixin = {
    mixins: [ScreenMixin],
    data: ()=>({
        x: 0,
        z: 0
    }),
    methods: {
        open(e, t) {
            Game.town.GetObjectAt(e, t) && (this.x = e,
            this.z = t,
            ScreenMixin.methods.open.apply(this))
        }
    }
};
var InventoryUI = pc.createScript("v-ts-inventory");
INVENTORY = {
    blockchainObjects: [],
    selectedRecipe: null,
    selectedPart: null,
    recipes: [],
    objects: [],
    vox: [],
    skins: [],
    skinCategory: "Mirandus",
    items: {},
    fullscreen: !0,
    selectedClass: "All",
    skinLoading: !1,
    classes: [{
        name: "All",
        grabId: "",
        iconAssetId: "46481624"
    }, {
        name: "Items",
        grabId: "8092_0",
        iconAssetId: "29397904"
    }, {
        name: "Skins",
        grabId: "",
        iconAssetId: "46481623"
    }, {
        name: "Sets",
        grabId: "",
        iconAssetId: "29397903"
    }, {
        name: "VOX",
        grabId: "",
        iconAssetId: "29397903"
    }],
    get placedTokens() {
        return Game.town ? Math.min(Game.town.getBlockChainObjects().length, Game.galaPower) : 0
    },
    get galaPower() {
        return Game.galaPower || 0
    },
    get hasItems() {
        return Object.keys(INVENTORY.items).length
    },
    getAvailable(e, t) {
        const n = INVENTORY.items[e];
        if (Array.isArray(n)) {
            return n.find((e=>e.voxNumber === t)) ? 1 : 0
        }
        return n && (Math.min(n.confirmed, n.pending) || 0) + (n.treasureChest || 0)
    },
    getRecipeProgress(e, t) {
        let n = 0
          , s = 0;
        (t ? [t] : e.requiredPieces).forEach((e=>{
            const {pending: t, confirmed: i} = INVENTORY.items[e.baseId] || {}
              , a = Math.min(i || 0, t || 0) || 0;
            n += e.quantityNeeded,
            s += Math.min(a, e.quantityNeeded)
        }
        ));
        const i = Math.min(s / n, 1)
          , a = 100 * i;
        let o = a.toFixed(1);
        const [c,r] = o.split(".");
        return "0" === r && (o = c),
        {
            progress: i,
            percentage: a,
            text: o,
            itemsNeeded: n,
            itemsOwned: s,
            canAssemble: s >= n
        }
    }
},
InventoryUI.open = function(e, t) {
    InventoryUI.vm.open(e, t)
}
,
InventoryUI.close = function() {
    InventoryUI.vm.close()
}
,
InventoryUI.vue = {
    vm: !0,
    html: "ts-inventory.html",
    mixins: [window.BoardScreenMixin],
    data: ()=>INVENTORY,
    methods: {
        acquire(e, t, n) {
            let s;
            t && n && (s = {
                contract: t,
                tokenId: n
            });
            const {x: i, z: a} = this
              , {BlockChainID: o, Name: c, UnitType: r} = (Game.town.GetObjectAt(i, a),
            e);
            Game.addObject(i, a, c, s),
            API.event("nft_placed", {
                blockChainId: o,
                contract: t,
                tokenId: n,
                itemName: c,
                unitType: r
            }),
            this.close()
        },
        selectRecipe(e) {
            INVENTORY.getRecipeProgress(e).canAssemble && "FarmBot" !== e.name ? IFRAME.craft(e.baseId) : this.selectedRecipe = e
        },
        toggleSkin(e) {
            this.skinLoading = !0,
            e.active = !e.active,
            Game.town.setSkin(e.object.Name, e.active ? e.skin : null)
        },
        applyAllSkins(e, t) {
            this.skinLoading = !0,
            this.skins.forEach((n=>{
                n.skin === e && n.active != t && (n.active = t,
                Game.town.setSkin(n.object.Name, t ? n.skin : null, !1))
            }
            )),
            t ? API.setUserData("skinSettings", SKINS) : API.setUserData("skinSettings", {})
        },
        async loadItems() {
            console.log(this.items),
            this.items = await API.getItems();
            const e = Object.keys(this.items);
            e.sort(),
            this.objects.length = 0;
            for (const t of e) {
                const e = this.items[t];
                if (this.blockchainObjects[t]) {
                    const n = Math.min(e.confirmed, e.pending) + (e.treasureChest || 0)
                      , s = e.pending - e.confirmed
                      , i = this.blockchainObjects[t]
                      , a = {
                        object: i,
                        fungible: !0,
                        earning: e.earning
                    };
                    n > 0 && this.objects.push({
                        ...a,
                        count: n,
                        key: i.Name + "-available"
                    }),
                    0 !== s && this.objects.push({
                        ...a,
                        key: i.Name + "-pending",
                        count: Math.abs(s),
                        pending: s > 0 ? "Assembling" : "Transferring"
                    })
                } else if ("vox_series_1" === t)
                    for (const t of e) {
                        const e = {
                            ...Game.objectData.VOX_Home,
                            image: t.image,
                            NameOverride: t.name
                        };
                        this.vox.find((e=>e.key === `vox-${t.tokenId}`)) || this.vox.push({
                            key: `vox-${t.tokenId}`,
                            object: e,
                            nonFungible: !0,
                            contract: "vox_series_1",
                            tokenId: t.voxNumber,
                            earning: t.earning,
                            count: 1
                        })
                    }
            }
        },
        loadRecipes() {
            return API.getItemRecipes().then((e=>this.recipes = e))
        },
        redirect(e) {
            window.location.href = e
        },
        loadSkins() {
            return API.getItems().then((e=>{
                this.skins = Object.keys(e).filter((t=>Game.skinData[t] && ((e[t].confirmed > 0 && e[t].pending) > 0 || e[t].treasureChest > 0))).map((e=>{
                    const t = Game.skinData[e];
                    return {
                        object: Game.objectData[t.object],
                        skin: t.skin,
                        active: !1
                    }
                }
                ))
            }
            ))
        }
    },
    created() {
        this.blockchainObjects = Object.values(Game.objectData).reduce(((e,t)=>("None" !== t.BlockChainID && (e[t.BlockChainID] = t),
        e)), {}),
        this.loadItems(),
        this.loadRecipes(),
        this.loadSkins().then((()=>{
            API.getUserData("skinSettings").then((e=>{
                Object.keys(e || []).forEach((t=>{
                    const n = this.skins.find((n=>n.object.Name == t && n.skin == e[t]));
                    n && (n.active = !0)
                }
                ))
            }
            ))
        }
        )),
        this.$on("open", (()=>{
            this.interval = setInterval((()=>this.loadItems()), 6e4),
            OnboardingUI.instance.hideOnboarding()
        }
        )),
        this.$on("close", (()=>{
            clearInterval(this.interval),
            OnboardingUI.instance.showOnboarding()
        }
        ))
    },
    computed: {
        applyAllEnabled: function() {
            return 0 !== this.skins.length && this.skins.reduce(((e,t)=>!t.active || e), !1)
        }
    }
};
class TS_JoyTreeLogic extends TS_ObjectLogic {
    Initialize() {
        this.count = 0,
        this.vfxEntities = this.entity.findByTag("StorageCountVFX"),
        this.entity.onAndNow("doober", (()=>this.setOrnaments(HOLIDAY_TREE_QUEST.set.length)))
    }
    setOrnaments(t) {
        this.count = t;
        for (let e of this.vfxEntities) {
            e.enabled = !1;
            for (let n = 0; n < t; n++) {
                if (e.tags.has(`StorageCount:${n + 1}`)) {
                    e.enabled = !0;
                    break
                }
                e.enabled = !1
            }
        }
    }
    OnPlaced() {
        super.OnPlaced();
        const t = this.entity.getPosition();
        EntitySpawner.spawnObject("VFX_TreePlaced", t.x, t.y, t.z, this.entity)
    }
}
var ImageComponent = pc.createScript("v-ts-img");
ImageComponent.vue = {
    props: ["asset-id", "asset-name", "icon", "css-class", "skin-set"],
    template: '<img :class="cssClass" :src="src" @click="$emit(\'click\')" @mouseover="$emit(\'mouseover\')" @mouseleave="$emit(\'mouseleave\')">',
    data: ()=>({
        src: ""
    }),
    created() {
        let s;
        if (this.assetId)
            s = app.assets.get(this.assetId);
        else {
            let e = this.assetName;
            this.icon && (e = this.skinSet ? UiTools.getIconFileName(`${this.icon}-${this.skinSet}`) : UiTools.getIconFileName(this.icon)),
            s = app.assets.find(e)
        }
        s && (this.src = s.getFileUrl())
    }
};
var ObjectComponent = pc.createScript("v-ts-object");
ObjectComponent.vue = {
    props: ["x", "z", "object", "pending", "currency", "gold", "fungible", "nonFungible", "earning", "tokenId", "contract"],
    mixins: [window.ObjectMixin],
    methods: {
        info() {
            StoreInfoUI.open(this.object, this.x, this.z, this.skinSelection, this.fungible, this.nonFungible, this.tokenId, this.contract)
        }
    },
    computed: {
        skinSelection() {
            return SKINS[this.object.Name]
        }
    },
    template: '\n    <div :class="{\'can-purchase\': canAcquire, \'status-pending\': pending, \'status-confirmed\': !pending}" class="product transparent-cell">\n        <v-ts-img class="info" asset-id="32401612" @click="info()"></v-ts-img>\n\n        <h2 v-if="object.NameOverride">{{object.NameOverride}}</h2>\n        <h2 v-if="!object.NameOverride" v-ts-grab.object-name="object.Name"></h2>\n        <p class="requirement" v-if="!edgeRequirementMet" style="visibility: visible" v-ts-grab.edge-requirements="object.EdgeRequirements"></p>\n        <p class="requirement" v-if="!edgeRequirementMet" style="visibility: visible" v-ts-grab.edge-exclusions="object.EdgeExclusions"></p>\n        <div class="portrait">\n            <div class="unit-pic">\n                <v-ts-img :icon="object.Name" :skin-set="skinSelection"></v-ts-img>                \n            </div>\n            <div class="npc-pic" v-if="object.UnitType !== \'None\'">\n                <v-ts-img :icon="object.UnitType" :skin-set="skinSelection"></v-ts-img>                                \n            </div>\n            <div class="npc-pic" v-if="object.image">\n                <img :src="object.image">\n            </div>\n            <span class="quantity" v-if="fungible">\n                <span v-if="pending">x{{count}}</span>\n                <span v-if="!pending">x{{count - placed}}</span>\n            </span>\n        </div>\n        <div class="construction-cost">\n\n            <div class="construction-req" v-for="req in constructionRequirements"> \n                <v-ts-img css-class="sm-icon" :icon="req.craft"></v-ts-img>                                \n                <span>{{req.amount}}</span>\n            </div>  \n\n            <div class="separator-short"></div>\n            <div class="labor-requirement" :class="{\'can-purchase\': canAcquire}" v-if="object.LaborCost > 0">\n                <v-ts-img css-class="sm-icon" asset-id="28292607"></v-ts-img>                \n                <span>\n                    ${{object.LaborCost}}/<span v-ts-grab="8016_0"></span>\n                </span>\n            </div>\n            <div class="labor-requirement" :class="{\'can-purchase\': canAcquire}" v-if="earning">\n                <v-ts-img asset-id="24639100"></v-ts-img>                \n                <span>\n                    {{earning.toLocaleString()}}                    \n                </span>\n            </div>\n        </div>\n        <div class="buy-buttons">\n            <button class="buy-currency" :disabled="!canAcquire" v-if="fungible || nonFungible" @click="$emit(\'acquire\', object.Name)">\n                <span>{{pending || \'Place\'}}</span>\n            </button>\n            \x3c!--\n                <button class="buy-gold" :disabled="!(canAcquire && hasGold)" v-if="!fungible && !nonFungible" @click="$emit(\'acquire\', object.Name)">\n                <v-ts-img asset-id="24639100"></v-ts-img>                \n                <span>\n                    {{object.GoldCost.toLocaleString()}}\n                </span>\n            </button>\n            --\x3e\n            <button class="buy-currency" :disabled="!(canAcquire && hasCurrency)" v-if="!fungible && !nonFungible" @click="$emit(\'acquire\', object.Name)">\n                <v-ts-img asset-id="24639092"></v-ts-img>                \n                <span>\n                    {{object.BuildCost.toLocaleString()}}\n                </span>\n            </button>\n        </div>\n    </div>\n'
};
var recipe = pc.createScript("v-ts-recipe");
recipe.vue = {
    props: ["recipe"],
    data: ()=>({
        progress: null
    }),
    created() {
        this.progress = INVENTORY.getRecipeProgress(this.recipe),
        this.progress.canAssemble = !1
    },
    template: '\n   <div class="product recipe transparent-cell can-purchase">\n        <h2>{{recipe.name}}</h2>\n        <div class="portrait">\n            <div class="npc-pic">\n                <v-ts-img css-class="xl-icon" :icon="recipe.name"></v-ts-img>\n            </div>\n            <div class="unit-progress">\n                <span class="percent">{{progress.text}}% complete</span>\n                <v-ts-progress :value="progress.percentage"></v-ts-progress>\n            </div>\n        </div>\n        <div class="buy-buttons">       \n            <button class="yes" disabled>\n                <span>\n                    Crafting Coming Soon!\n                </span>\n            </button>\n        </div> \n    </div>\n'
};
var OnboardingUI = pc.createScript("onboardingUI");
OnboardingUI.attributes.add("dialogHtml", {
    type: "asset",
    assetType: "html"
}),
OnboardingUI.attributes.add("toasterHtml", {
    type: "asset",
    assetType: "html"
}),
OnboardingUI.attributes.add("rewardHtml", {
    type: "asset",
    assetType: "html"
}),
OnboardingUI.prototype.initialize = function() {
    OnboardingUI.instance = this,
    PhaseManager.instance.onPhaseChanged(PhaseManager.PlayingPhase, (()=>{
        Game.onboardingProgress && setTimeout((()=>{
            Game.onboardingProgress.progress && "Finished" !== Game.onboardingProgress.progress && (this.app.fire("onboarding-progress", Game.onboardingProgress.progress),
            this.app.on("SetWorldView", (()=>{
                this.resetAllElements(),
                this.app.once("SetTownView", (()=>this.fire("progress", Game.onboardingProgress.progress)))
            }
            )))
        }
        ), 500)
    }
    )),
    this.app.on("gameover", (()=>{
        this.fire("progress", "Reset")
    }
    )),
    this.tradeCraftSelected = "",
    this.on("dialog-enable", (()=>{
        this.dialogDiv.style.display = "flex",
        UiTools.updateImageAssets(this.dialogDiv),
        UiTools.translateTextAssets(this.dialogDiv)
    }
    )),
    this.dialogHtml.on("change", (()=>{
        this.reloadDialog()
    }
    )),
    this.app.on("WorldTapped", (()=>{
        this.app.fire("onboarding-progress", "Reset")
    }
    )),
    this.app.on("SellClicked", (()=>this.fire("SellClicked"))),
    TradeUI.instance.on("Closed", (()=>this.fire("TradeClosed"))),
    SettingsUI.instance.UI.on("Opened", this.hideOnboarding, this),
    SettingsUI.instance.UI.on("Closed", this.showOnboarding, this),
    StoreUI.events.on("Opened", this.hideOnboarding, this),
    StoreUI.events.on("Closed", this.showOnboarding, this),
    LeaderboardUi.instance.UI.on("Opened", this.hideOnboarding, this),
    LeaderboardUi.instance.UI.on("Closed", this.showOnboarding, this),
    TradeUI.instance.on("Opened", this.hideOnboarding, this),
    TradeUI.instance.on("Closed", this.showOnboarding, this),
    TradeUI.instance.on("Test", (()=>{}
    )),
    TradeUI.instance.on("Closed", (()=>{}
    )),
    TradeUI.instance.on("Opened", (()=>{}
    )),
    this.app.on("TownObjectAdded", (()=>{}
    )),
    this.on("TradeClosed", (()=>{}
    )),
    this.on("HideOnboarding", (()=>{
        this.fire("progress", "Reset")
    }
    )),
    this.on("ShowOnboarding", (()=>{
        this.fire("progress", Game.onboardingProgress.progress)
    }
    )),
    this.app.on("TownObjectAdded", (()=>this.fire("TownObjectAdded"))),
    this.app.on("onboarding-progress", ((e,t)=>{
        this.fire("progress", e, t)
    }
    )),
    this.on("progress", ((e,t)=>{
        this.resetAllElements(),
        "ChooseSpot" === e && this.chooseSpot(),
        "YouReady" === e && this.youReady(t),
        "TapTruck" === e && this.tapTruck(),
        "TapSellObjectMenu" === e && this.tapSellObjectMenu(),
        "TapSellTradeMenu" === e && this.tapSellTradeMenu(),
        "TapSellTradeMenuConfirm" === e && this.tapSellTradeMenuConfirm(),
        "TradeSelectCraft" === e && this.tradeSelectCraft(),
        "TapSellTradeMenuArrow" === e && this.tapSellTradeMenuArrow(),
        "WaitForTruck" === e && this.waitForTruck(),
        "TruckIsBack" === e && this.truckIsBack(),
        "PickGrass" === e && this.pickGrass(),
        "BuildGrow" === e && this.buildGrow(),
        "FarmHouse" === e && this.farmHouse(),
        "SeeRank" === e && this.seeRank(),
        "KeepSellingConfirm" === e && this.keepSellingConfirm(),
        "Congrats" === e && this.congrats()
    }
    )),
    this.reloadDialog()
}
,
OnboardingUI.prototype.showOnboarding = function() {
    this.fire("ShowOnboarding")
}
,
OnboardingUI.prototype.hideOnboarding = function() {
    this.fire("HideOnboarding")
}
,
OnboardingUI.prototype.cancelOnboarding = function(e) {
    clearInterval(this.checkReqsInterval),
    this.resetAllElements(),
    this.setProgress("Finished")
}
,
OnboardingUI.prototype.resetAllElements = function() {
    this.vfxArrow && this.vfxArrow.destroy(),
    clearInterval(this.updateInterval),
    clearInterval(this.tradeReqInterval);
    const removeAll = e=>{
        document.querySelectorAll(e).forEach((e=>{
            e.parentElement.removeChild(e)
        }
        ))
    }
    ;
    this.app.off("ObjectSelected", this.detectGrassTap, this),
    this.app.off("ObjectSelected", this.detectTradeTap, this),
    this.app.off("SellClicked", this.tapSellArrowFinish, this),
    this.app.off("ObjectSelected", this.detectTradeTapCollect, this),
    this.app.off("ObjectSelected", this.detectNonTradeTap, this),
    this.app.off("ObjectSelected", this.detectNonGrassTap, this),
    TradeUI.instance.off("TradeCloseButtonTapped", this.tapTruck, this),
    TradeUI.instance.off("TradeCloseButtonTapped", this.resetTapTruck, this),
    removeAll(".onboarding-toaster"),
    removeAll(".onboarding-isolate-container"),
    removeAll(".onboarding-arrow-container_"),
    removeAll(".onboarding-confirm-container")
}
,
OnboardingUI.prototype.checkTradeReqs = function() {
    if (!Game.town.FindObjectType("Trade_Depot") && !Game.town.FindObjectType("Trade_Pier"))
        return !1;
    Game.town.GetStoredCrafts().Gasoline,
    Game.town.GetStoredCrafts().Wheat;
    return !!Game.town.GetStoredCrafts().Gasoline && (!!Game.town.GetStoredCrafts().Wheat && (!(Game.town.GetStoredCrafts().Gasoline < 10) && !(Game.town.GetStoredCrafts().Wheat < 10)))
}
,
OnboardingUI.prototype.chooseSpot = function() {
    document.querySelector(".location-confirm .no").addEventListener("click", (()=>{
        this.createToaster("It helps to be near a city!", "onboarding-toaster-world")
    }
    ));
    this.confirmOnboarding("Choose a spot to build your town!", "LET'S GO!", (()=>{
        this.app.fire("toasterui-disable"),
        this.createToaster("It helps to be near a city!", "onboarding-toaster-world"),
        this.app.fire("toasterui-enable", "Pick a Location!")
    }
    )),
    this.setProgress("ChooseSpot"),
    API.event("ftue_start")
}
,
OnboardingUI.prototype.youReady = function(e) {
    this.confirmOnboarding("You Ready?", "LET'S GO!", (()=>{
        this.app.fire("TownCreated", e.pierSwap, e.tradeDir),
        this.app.fire("toasterui-disable"),
        this.app.fire("onboarding-toaster-disable"),
        this.app.fire("objectmenu-enable")
    }
    )),
    this.setProgress("TapTruck"),
    API.event("ftue_step_1")
}
,
OnboardingUI.prototype.tapTruck = function() {
    TradeUI.instance.off("Opened", this.hideOnboarding, this),
    this.tradeReqInterval = setInterval((()=>{
        this.checkTradeReqs() || this.fire("progress", "PickGrass")
    }
    ));
    let e = Game.town.FindObjectType("Trade_Depot")
      , t = "truck";
    if (e || (e = Game.town.FindObjectType("Trade_Pier"),
    t = "boat"),
    e) {
        let o = e.entity.getPosition();
        this.vfxArrow = EntitySpawner.spawnObject("VFX_Arrow", o.x, 0, o.z, Game.app.root),
        this.createToaster(`Tap the ${t} to make a sale!`, "bottom-left"),
        this.app.on("ObjectSelected", this.detectTradeTap, this),
        UiTools.updateImageAssets(this.arrowDiv)
    }
}
,
OnboardingUI.prototype.tapSellObjectMenu = function() {
    this.tradeReqInterval = setInterval((()=>{
        this.checkTradeReqs() || this.fire("progress", "PickGrass")
    }
    )),
    this.app.on("ObjectSelected", this.detectNonTradeTap, this),
    this.createToaster("Now tap sell to trade goods!", "bottom-left"),
    this.createArrow("onboarding-arrow-object-menu", document.querySelector(".menu-sell")),
    document.querySelector(".menu-sell").addEventListener("click", (()=>{}
    )),
    TradeUI.instance.once("CraftSelected", (e=>{
        this.tradeCraftSelected = e,
        TradeUI.instance.on("TradeCloseButtonTapped", this.resetTapTruck, this),
        this.fire("progress", "TapSellTradeMenu")
    }
    )),
    this.setProgress("TapTruck")
}
,
OnboardingUI.prototype.tapSellTradeMenu = function() {
    this.createIsolateDiv();
    this.confirmOnboarding("Tap on the Sell button to make money from Wheat", "OKAY", (()=>{
        this.fire("progress", "TapSellTradeMenuArrow"),
        this.checkCraftSelected(this.tradeCraftSelected),
        TradeUI.instance.onCheck("CraftSelected", (e=>this.checkCraftSelected(e)))
    }
    )),
    this.setProgress("TapTruck")
}
,
OnboardingUI.prototype.resetTapTruck = function() {
    this.fire("progress", "TapTruck")
}
,
OnboardingUI.prototype.checkCraftSelected = function(e) {
    "Wheat" !== e ? this.fire("progress", "TradeSelectCraft") : this.fire("progress", "TapSellTradeMenuArrow")
}
,
OnboardingUI.prototype.tradeSelectCraft = function(e) {
    this.createArrow("onboarding-arrow-trade-craft"),
    this.updateInterval = setInterval((()=>{
        this.positionWithOffset(document.querySelector(".footer-row .craft.Wheat"), this.arrowDiv, -120, 0, 0, 0, 180, !0)
    }
    ), 10),
    TradeUI.instance.on("TradeCloseButtonTapped", this.resetTapTruck, this)
}
,
OnboardingUI.prototype.onTradeStarted = function() {
    TradeUI.instance.offCheck("CraftSelected"),
    TradeUI.instance.onCheck("Closed", (()=>this.onTradeClosed()))
}
,
OnboardingUI.prototype.onTradeClosed = function() {
    this.fire("progress", "PickGrass"),
    TradeUI.instance.offCheck("TradeStarted"),
    TradeUI.instance.offCheck("Closed")
}
,
OnboardingUI.prototype.tapSellTradeMenuArrow = function() {
    TradeUI.instance.off("Closed", this.showOnboarding, this),
    TradeUI.instance.onCheck("TradeStarted", (()=>this.onTradeStarted())),
    TradeUI.instance.on("TradeCloseButtonTapped", this.resetTapTruck, this);
    this.createArrow("onboarding-arrow-trade"),
    this.updateInterval = setInterval((()=>{
        this.positionWithOffset(document.querySelector("#destination-target").children[0].querySelector(".sell-button"), this.arrowDiv, 80, 0, 0, 0, 0, !0)
    }
    ), 100)
}
,
OnboardingUI.prototype.tapSellArrowFinish = function() {
    this.setProgress("WaitForTruck"),
    this.off("TradeClosed", this.tapTruck, this),
    TradeUI.instance.on("Opened", this.hideOnboarding, this),
    TradeUI.instance.on("Closed", this.showOnboarding, this),
    this.fire("progress", "Reset")
}
,
OnboardingUI.prototype.waitForTruck = function() {
    this.app.on("TradeCollectionReady", (()=>{
        this.truckIsBack(),
        this.app.off("ObjectSelected", this.detectTradeTap, this),
        this.app.on("ObjectSelected", this.detectTradeTapCollect, this)
    }
    ))
}
,
OnboardingUI.prototype.truckIsBack = function() {
    this.createToaster("Your truck is back. Time to collect!", "bottom-left"),
    this.setProgress("PickGrass")
}
,
OnboardingUI.prototype.pickGrass = function() {
    this.setProgress("PickGrass"),
    API.event("ftue_step_2"),
    TradeUI.instance.offCheck("CraftSelected"),
    clearInterval(this.tradeReqInterval),
    this.app.on("ObjectSelected", this.detectGrassTap, this),
    this.createToaster("Pick an empty spot to activate the store !", "bottom-left")
}
,
OnboardingUI.prototype.buildGrow = function() {
    this.app.off("ObjectSelected", this.detectGrassTap, this),
    this.app.on("ObjectSelected", this.detectNonGrassTap, this),
    this.createToaster("Build and grow your town at the shop!", "bottom-left"),
    this.createArrow("onboarding-arrow-container-hud-store", document.querySelector(".hud .bottom")),
    this.setProgress("PickGrass"),
    StoreUI.events.once("Opened", (()=>{
        Vue.nextTick((()=>this.fire("progress", "FarmHouse")))
    }
    ))
}
,
OnboardingUI.prototype.farmHouse = function() {
    this.setProgress("SeeRank"),
    API.event("ftue_step_3")
}
,
OnboardingUI.prototype.seeRank = function() {
    StoreUI.events.off("Opened", this.hideOnboarding, this),
    StoreUI.events.off("Closed", this.showOnboarding, this),
    StoreUI.events.on("Opened", this.hideOnboarding, this),
    StoreUI.events.on("Closed", this.showOnboarding, this);
    this.createToaster("See how you rank in the Weekly Contest!", "onboarding-toaster-hud"),
    this.createArrow("onboarding-arrow-container-hud-leaderboard"),
    LeaderboardUi.instance.UI.off("Opened", this.hideOnboarding, this),
    LeaderboardUi.instance.UI.off("Closed", this.showOnboarding, this),
    LeaderboardUi.instance.UI.once("Opened", (()=>{
        this.fire("progress", "KeepSellingConfirm")
    }
    ))
}
,
OnboardingUI.prototype.keepSellingConfirm = function() {
    document.querySelector(".leaderboard .body-row .me");
    this.confirmOnboarding("Keep selling goods and you'll make your way to the top!", "OKAY", (()=>{
        this.fire("progress", "Reset")
    }
    )),
    this.createIsolateDiv("onboarding-isolate-container"),
    this.dialogDiv.classList.add("leaderboard"),
    this.setProgress("Congrats"),
    LeaderboardUi.instance.UI.on("Closed", this.showOnboarding, this)
}
,
OnboardingUI.prototype.congrats = function() {
    LeaderboardUi.instance.UI.off("Opened", this.hideOnboarding, this),
    LeaderboardUi.instance.UI.off("Closed", this.showOnboarding, this),
    this.setProgress("Congrats"),
    API.event("ftue_complete");
    this.rewardOnboarding("You're off to a great start! Here's a first time bonus to help you on your way!", "Accept", (()=>{
        Game.addCurrency(1e4),
        LEDGER.claimDrop(1, {}, 1e4),
        this.setProgress("Finished"),
        this.resetAllElements(),
        this.app.fire("OnboardingFinished")
    }
    ))
}
,
OnboardingUI.prototype.createToaster = function(e, t, o=null) {
    this.toasterDiv = document.createElement("div"),
    this.toasterDiv.innerHTML = this.toasterHtml.resource,
    this.toasterDiv.classList.add("onboarding-toaster", t),
    this.toasterDiv.querySelector(".bubble").innerHTML = e,
    o ? o.appendChild(this.toasterDiv) : document.body.appendChild(this.toasterDiv),
    UiTools.translateTextAssets(this.toasterDiv),
    UiTools.updateImageAssets(this.toasterDiv)
}
,
OnboardingUI.prototype.createIsolateDiv = function() {
    this.isolateDiv && this.isolateDiv.remove(),
    this.isolateDiv = document.createElement("div"),
    this.isolateDiv.classList.add("onboarding-isolate-container"),
    this.isolateDiv.innerHTML = "<div></div>",
    document.body.appendChild(this.isolateDiv)
}
,
OnboardingUI.prototype.createArrow = function(e, t=null) {
    this.arrowDiv = document.createElement("div"),
    this.arrowDiv.classList.add("onboarding-arrow-container_", e),
    this.arrowDiv.innerHTML = '<img data-src-asset-id="36985893">',
    t ? t.appendChild(this.arrowDiv) : (document.body.appendChild(this.arrowDiv),
    this.arrowDiv.style.position = "fixed"),
    UiTools.updateImageAssets(this.arrowDiv)
}
,
OnboardingUI.prototype.detectTradeTap = function() {
    "Trade_Depot" !== Game.town.selectedObject.type && "Trade_Pier" !== Game.town.selectedObject.type || this.app.once("ObjectMenu-Loaded", (()=>this.fire("progress", "TapSellObjectMenu")))
}
,
OnboardingUI.prototype.detectNonTradeTap = function() {
    "Trade_Depot" !== Game.town.selectedObject.type ? this.fire("progress", "TapTruck") : this.app.once("ObjectMenu-Loaded", (()=>this.fire("progress", "TapSellObjectMenu")))
}
,
OnboardingUI.prototype.detectTradeTapCollect = function() {
    "Trade_Depot" === Game.town.selectedObject.type && this.fire("progress", "PickGrass")
}
,
OnboardingUI.prototype.detectGrassTap = function() {
    Game.town.selectedObject.objData.CanBuildUpon && this.fire("progress", "BuildGrow")
}
,
OnboardingUI.prototype.detectNonGrassTap = function() {
    "Grass" !== Game.town.selectedObject.type && this.fire("progress", Game.onboardingProgress.progress)
}
,
OnboardingUI.prototype.setProgress = function(e) {
    switch (Game.onboardingProgress = {
        progress: e
    },
    e) {
    case "ChooseSpot":
    case "TapTruck":
    case "PickGrass":
    case "SeeRank":
    case "Congrats":
    case "Finished":
        break;
    default:
        API.event("ftue_missed_step")
    }
    API.setUserData("onboardingProgress", {
        progress: e
    })
}
,
OnboardingUI.prototype.positionWithOffset = function(e, t, o, r, i, s, a, n) {
    e ? (t.style.top = e.getBoundingClientRect().top + o + "px",
    t.style.left = e.getBoundingClientRect().left + r + "px",
    n && (t.style.height = e.offsetHeight + i + "px",
    t.style.width = e.offsetWidth + s + "px"),
    t.style.position = "absolute",
    t.style.transform = "rotate(" + a + "deg)") : console.log("target is null")
}
,
OnboardingUI.prototype.reloadDialog = function() {
    this.log("reloading"),
    this.dialogDiv && (this.dialogDiv.innerHTML = this.dialogHtml.resource)
}
,
OnboardingUI.prototype.reloadToaster = function(e) {
    this.log("reloading toaster ", e),
    this.toasterDiv.innerHTML = this.toasterHtml.resource,
    this.toasterDiv.querySelector(".bubble-onboarding").innerHTML = e,
    UiTools.translateTextAssets(this.toasterDiv),
    UiTools.updateImageAssets(this.toasterDiv)
}
,
OnboardingUI.prototype.reloadDialog = function() {
    this.log("reloading"),
    this.dialogDiv && (this.dialogDiv.innerHTML = this.dialogHtml.resource)
}
,
OnboardingUI.prototype.confirmOnboarding = function(e, t, o) {
    this.dialogDiv = document.createElement("div"),
    this.dialogDiv.classList.add("container", "onboarding-confirm-container"),
    this.dialogDiv.innerHTML = this.dialogHtml.resource,
    this.dialogDiv.style.display = "flex",
    document.body.appendChild(this.dialogDiv),
    this.dialogDiv.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.dialogDiv.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.dialogDiv.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.dialogDiv.querySelector(".bubble").innerHTML = e,
    this.app.fire("object-float-disable");
    const r = this.dialogDiv.querySelector(".yes");
    r.querySelector("span").innerHTML = t;
    const onClose = ()=>{
        this.dialogDiv.style.display = "none"
    }
    ;
    r.addEventListener("click", (()=>{
        o(),
        onClose()
    }
    )),
    this.fire("dialog-enable")
}
,
OnboardingUI.prototype.rewardOnboarding = function(e, t, o) {
    this.rewardDiv = document.createElement("div"),
    this.rewardDiv.classList.add("container", "onboarding-confirm-container"),
    this.rewardDiv.innerHTML = this.rewardHtml.resource,
    this.rewardDiv.style.display = "flex",
    document.body.appendChild(this.rewardDiv),
    this.rewardDiv.addEventListener("mousedown", (e=>e.stopPropagation())),
    this.rewardDiv.addEventListener("mouseup", (e=>e.stopPropagation())),
    this.rewardDiv.addEventListener("wheel", (e=>e.stopPropagation()), {
        passive: !0
    }),
    this.rewardDiv.querySelector(".bubble").innerHTML = e,
    this.app.fire("object-float-disable");
    const r = this.rewardDiv.querySelector(".yes");
    r.querySelector("span").innerHTML = t;
    const onClose = ()=>{
        this.app.fire("objectmenu-enable"),
        this.rewardDiv.style.display = "none"
    }
    ;
    r.addEventListener("click", (()=>{
        o(),
        onClose(),
        this.app.fire("objectmenu-enable"),
        this.rewardDiv.style.display = "none"
    }
    )),
    UiTools.updateImageAssets(this.rewardDiv),
    UiTools.translateTextAssets(this.rewardDiv)
}
,
OnboardingUI.prototype.log = window.logger && logger({
    context: "onboarding ui",
    color: "green",
    timing: !0
});
var DialogComponent = pc.createScript("v-ts-dialog");
DialogComponent.vue = {
    props: ["visible", "css-class", "header-css-class", "title", "fullscreen"],
    template: '\n<div>\n    <div class="container" v-if="visible" @mousedown.stop @mouseup.stop @wheel.stop>\n        <div :class="[cssClass, {fullscreen}]">\n            <div class="header-row" :class="headerCssClass">\n                <slot name="header">\n                    <div class="left">\n                        <h1>{{title}}</h1>\n                    </div>\n                </slot>\n                <button class="close-button" @click="$emit(\'close\')"></button>\n            </div>\n            <slot></slot> \n        </div>\n    </div> \n</div>\n'
};
var StoreInfoUI = pc.createScript("v-ts-store-info");
StoreInfoUIState = {
    object: null,
    pending: !1,
    fungible: !1,
    nonFungible: !1,
    contract: null,
    tokenId: null
},
StoreInfoUI.open = function(t, e, o, n, I, r, i, S) {
    StoreInfoUIState.object = t,
    StoreInfoUIState.x = e,
    StoreInfoUIState.z = o,
    StoreInfoUIState.visible = !0,
    StoreInfoUIState.skinSelection = n,
    StoreInfoUIState.fungible = I,
    StoreInfoUIState.nonFungible = r,
    StoreInfoUIState.tokenId = i,
    StoreInfoUIState.contract = S,
    StoreInfoUI.vm.$forceUpdate()
}
,
StoreInfoUI.vue = {
    vm: !0,
    html: "ts-store-info.html",
    data: ()=>StoreInfoUIState,
    mixins: [window.BoardScreenMixin, window.ObjectMixin, window.CurrencyMixin],
    methods: {
        acquire(t) {
            let e;
            this.contract && this.tokenId && (e = {
                contract: this.contract,
                tokenId: this.tokenId
            }),
            Game.addObject(this.x, this.z, t.Name, e),
            StoreUI.close(),
            InventoryUI.close(),
            this.close()
        }
    }
};
Vue.directive("ts-grab", {
    bind(e, t) {
        let r;
        if (t.modifiers["object-name"] && (r = UiTools.getObjectAttribute(t.value, 0)),
        t.modifiers["object-desc"] && (r = UiTools.getObjectAttribute(t.value, 1)),
        t.modifiers["craft-name"] && (r = UiTools.getCraftAttribute(t.value, 0)),
        t.modifiers.format) {
            const e = Object.keys(t.modifiers).find((e=>"format" !== e));
            e && (r = Grabbatron.formatString(e, t.value))
        }
        if (t.modifiers["edge-requirements"] && (r = Grabbatron.edgeRequirements(t.value)),
        t.modifiers["edge-exclusions"] && (r = Grabbatron.edgeExclusions(t.value)),
        !r) {
            r = Grabbatron.pullEntry(t.value);
            Grabbatron.pullEntry(t.value) || Grabbatron.pullEntry(t.expression)
        }
        r || (r = Grabbatron.pullEntry(t.expression)),
        r && (e.innerText = r)
    }
}),
Vue.directive("ts-time-remaining", {
    bind(e, t) {
        var r = Math.floor((t.value.getTime() - (new Date).getTime()) / 1e3)
          , i = Math.floor(r / 86400)
          , a = Math.floor(r / 3600)
          , o = Math.floor(r / 60)
          , n = Math.floor(r);
        let l;
        i > 1 && (l = Grabbatron.formatString("8007_0", [i])),
        a < 24 && (l = Grabbatron.formatString("8011_0", [a])),
        o < 60 && (l = `${o} minutes left`),
        n < 60 && (l = `${n} seconds left`),
        e.innerText = l
    }
});
var StoreUI = pc.createScript("v-ts-store");
StoreUIState = {
    products: {},
    selectedClass: "Farm",
    fullscreen: !0,
    classes: [{
        name: "Farm",
        grabId: "8009_0",
        iconAssetId: "27673774"
    }, {
        name: "Ranch",
        grabId: "8026_0",
        iconAssetId: "28858551"
    }, {
        name: "Terrain",
        grabId: "8033_0",
        iconAssetId: "27673775"
    }, {
        name: "Industrial",
        grabId: "8012_0",
        iconAssetId: "27673776"
    }, {
        name: "Trade",
        grabId: "8034_0",
        iconAssetId: "27673777"
    }]
},
StoreUI.events = new pc.EventHandler,
StoreUI.open = function(e, t) {
    StoreUI.vm.open(e, t)
}
,
StoreUI.close = function() {
    StoreUI.vm.close()
}
,
StoreUI.vue = {
    vm: !0,
    html: "ts-store.html",
    mixins: [window.BoardScreenMixin, window.CurrencyMixin],
    data: ()=>StoreUIState,
    methods: {
        acquire(e) {
            Game.addObject(this.x, this.z, e.Name),
            this.close()
        }
    },
    created() {
        StoreUIState.products = Object.keys(Game.objectData).reduce(((e,t)=>{
            const s = Game.objectData[t];
            return s.InStore && "Neighbor_Delivery" !== s.Name && (e[s.Class] = e[s.Class] || [],
            e[s.Class].push(s)),
            e
        }
        ), {}),
        this.$on("open", (()=>{
            API.event("store_open"),
            Vue.nextTick((()=>StoreUI.events.fire("Opened")))
        }
        )),
        this.$on("close", (()=>{
            Vue.nextTick((()=>StoreUI.events.fire("Closed")))
        }
        ))
    },
    watch: {
        selectedClass() {
            API.event("store_class_change", {
                class: this.selectedClass
            })
        }
    }
};
var RecipeDetailUI = pc.createScript("v-ts-recipe-detail");
RecipeDetailUI.vue = {
    html: "ts-recipe-detail.html",
    props: ["recipe"],
    data: ()=>({
        inventory: INVENTORY,
        progress: null,
        selectedPart: null,
        partProgress: null
    }),
    created() {
        this.progress = INVENTORY.getRecipeProgress(this.recipe)
    },
    methods: {
        selectPart(e) {
            this.selectedPart = e,
            this.partProgress = INVENTORY.getRecipeProgress(this.recipe, this.selectedPart)
        }
    }
};
var ProgressComponent = pc.createScript("v-ts-progress");
ProgressComponent.vue = {
    props: {
        value: Number,
        "css-class": {
            default: "progress-value"
        },
        "value-css-class": {
            default: "progress-value"
        }
    },
    data: ()=>({
        progress: 0
    }),
    methods: {
        update() {
            this.progress = 0,
            setTimeout((()=>this.progress = this.value), 250)
        }
    },
    watch: {
        value() {
            this.update()
        }
    },
    created() {
        this.update()
    },
    template: '\n<div class="progress-container" :class="cssClass">         \n    <div class="progress">\n        <div :class="valueCssClass" style="animation: none" :style="{width: progress + \'%\'}">  \n        </div>\n    </div>    \n</div>\n'
};
function debounce(e, t, s) {
    var r;
    return function() {
        var i = this
          , n = arguments
          , later = function() {
            r = null,
            s || e.apply(i, n)
        }
          , c = s && !r;
        clearTimeout(r),
        r = setTimeout(later, t),
        c && e.apply(i, n)
    }
}
REFERRALS = new class extends pc.EventHandler {
    constructor() {
        super(),
        this.users = [],
        this.link = null,
        pc.app.ever("Authenticated", (()=>{
            const add = e=>{
                !this.users.find((t=>t.userId === e.userId)) && HOLIDAY_TREE_QUEST.set.length + this.users.length < 10 && (this.users.push(e),
                this.fire("Changed"))
            }
            ;
            pc.app.on("RealtimeReferralClaimed", (e=>add(e))),
            API.getReferrals().then((e=>{
                e.forEach((e=>add(e.user))),
                this.fire("Changed")
            }
            )),
            API.getReferralLink().then((e=>{
                e.link && (this.link = e.link)
            }
            ))
        }
        ))
    }
    accept(e) {
        const t = this.users.findIndex((t=>t.userId === e));
        t > -1 && (this.users.splice(t, 1),
        API.event("referral_accept"),
        API.acceptReferral(e),
        this.fire("Accepted", e),
        this.fire("Changed"),
        0 === this.users.length && this.fire("AllAccepted"))
    }
}
;
Quest = class extends pc.EventHandler {
    constructor(t) {
        super(),
        this.step = t,
        this.progress = 0,
        this.set = [],
        this.started = null,
        this.completed = null,
        this.sum = 0,
        pc.app.ever("Authenticated", (()=>{
            pc.app.on("RealtimeQuestStepStarted", (({step: t, started: s})=>{
                t === this.step && (this.started = s,
                this.fire("Started", s))
            }
            )),
            pc.app.on("RealtimeQuestStepProgress", (({step: t, member: s, progress: e, sum: p})=>{
                t === this.step && (this.progress = e,
                this.sum = p,
                -1 === this.set.indexOf(s) && this.set.push({
                    member: s
                }),
                this.fire("Progress", this.progress, s))
            }
            )),
            pc.app.on("RealtimeQuestStepCompleted", (({step: t, completed: s})=>{
                t === this.step && (this.completed = s,
                this.fire("Completed", s))
            }
            )),
            this.load()
        }
        ))
    }
    load() {
        return API.getQuest(this.step).then((t=>(this.started = t.started,
        this.completed = t.completed,
        this.progress = t.progress,
        this.set = t.set,
        this.sum = t.sum,
        this)))
    }
}
;
var HolidayTreeUI = pc.createScript("v-ts-holiday-tree");
HOLIDAY_TREE_QUEST = new Quest("salty_shack_2021"),
HolidayTreeUIState = {
    fullscreen: !0,
    endDate: new Date("2021-02-28T00:00:00.000Z"),
    referral: null,
    referees: [],
    copiedToasterVisible: !1,
    canPlaceTree: !0,
    referrals: REFERRALS,
    boardObject: "SaltyBot_Shack",
    quest: HOLIDAY_TREE_QUEST,
    popup: !1
},
HolidayTreeUI.vue = {
    vm: !0,
    mixins: [window.BoardScreenMixin],
    html: "genericViral.html",
    data: ()=>HolidayTreeUIState,
    created() {
        this.loadUsers()
    },
    methods: {
        copyToClipboard() {
            API.event("referral_link_copy"),
            this.copiedToasterVisible = !0;
            const e = document.createElement("input");
            e.setAttribute("value", REFERRALS.link),
            document.body.appendChild(e),
            e.select(),
            document.execCommand("copy"),
            document.body.removeChild(e),
            setTimeout((()=>this.copiedToasterVisible = !1), 750)
        },
        loadUsers() {
            Promise.all(this.quest.set.map((e=>API.getUser(e.member)))).then((e=>this.referees = e))
        },
        placeTree() {
            Game.addObject(this.x, this.z, this.boardObject),
            this.close()
        },
        open(e, t, s) {
            if (API.event("referral_open"),
            BoardScreenMixin.methods.open.apply(this, [e, t]),
            void 0 !== e && void 0 !== t) {
                if (0 === Game.town.GetCountOfObject(this.boardObject)) {
                    const s = Game.town.GetObjectAt(e, t);
                    s && s.objData.CanBuildUpon ? this.canPlaceTree = !0 : this.canPlaceTree = !1
                } else
                    this.canPlaceTree = !1
            } else
                this.canPlaceTree = !1;
            if (!s) {
                this.visible = !1;
                let e = Promise.resolve();
                const t = Math.min(10 - this.quest.set.length, REFERRALS.users.length);
                for (let s = 0; s < t; s++) {
                    const t = REFERRALS.users[s];
                    e = e.then((()=>(this.referral = t,
                    this.$refs.confirm.open().then((e=>{
                        REFERRALS.accept(this.referral.userId)
                    }
                    )))))
                }
                e.then((()=>{
                    this.visible = !0,
                    t > 0 && this.close()
                }
                ))
            }
        }
    },
    watch: {
        "quest.set"() {
            this.loadUsers()
        }
    }
},
HolidayTreeUI.open = function(e, t, s) {
    HolidayTreeUI.vm.open(e, t, s)
}
,
HolidayTreeUI.close = function() {
    HolidayTreeUI.vm.close()
}
;
var PopupComponent = pc.createScript("v-ts-popup");
PopupComponent.vue = [{
    name: "v-ts-popup-trigger",
    props: ["value"],
    template: "\n<div @mouseover=\"$emit('input', true)\" @mouseleave=\"$emit('input', false)\">\n    <slot></slot>\n</div>"
}, {
    name: "v-ts-popup",
    props: ["value"],
    data: ()=>({
        active: !1,
        debouncer: null
    }),
    created() {
        this.active = this.value,
        this.debouncer = debounce((e=>this.active = e), 250)
    },
    watch: {
        value() {
            this.debouncer(this.value)
        }
    },
    template: ' \n<div @mouseover="$emit(\'input\', true)" @mouseleave="$emit(\'input\', false)"> \n    <slot v-if="active"></slot>  \n</div>'
}];
var LinkCopiedComponent = pc.createScript("v-ts-linkCopied");
LinkCopiedComponent.vue = {
    html: "linkCopied.html",
    methods: {
        Show() {
            console.log("Show Link Copied")
        }
    }
};
var OrnamentComponent = pc.createScript("v-ts-ornament");
OrnamentComponent.vue = [{
    name: "v-ts-ornament",
    props: ["ornament", "css-class", "num"],
    data: ()=>({
        popup: !1
    }),
    template: '\n<div class="ornament" :class="cssClass" style="width: 72px; height: 72px;">  \x3c!-- todo put in sass --\x3e\n    <v-ts-popup-trigger v-model="popup">\n        <v-ts-img v-if="ornament && num % 2 == 0" asset-name="icon_ornament.png"></v-ts-img>\n        <v-ts-img v-if="ornament && num % 2 !== 0" asset-name="icon_ornament_gold.png"></v-ts-img>\n    </v-ts-popup-trigger>\n    <v-ts-popup v-model="popup">\n        <div v-if="ornament" class="Tooltip">  \n            <img v-if="ornament.avatarUrls" :src="ornament.avatarUrls[\'64\']"> \x3c!-- todo make ts-avatar --\x3e\n            Gifted by {{ornament.name}}\n        </div>\n    </v-ts-popup> \n</div>\n'
}];
var HolidayTreeIntro = pc.createScript("v-ts-holiday-tree-intro");
getSpiralPositionAtStep = function(e, t, o) {
    if (getSpiralVector = function(e) {
        returnObj = {
            x: 0,
            y: 0
        };
        const t = Math.round((e + 1) / 2);
        return mod = 1,
        t % 2 == 0 && (mod = -1),
        e % 2 == 0 ? returnObj.y = t * mod : returnObj.x = t * mod,
        returnObj
    }
    ,
    o <= 0)
        return {
            x: e,
            y: t
        };
    let r, a, n = e, i = t, l = 0, s = 0, c = null;
    for (; l < o; )
        r != a && c || (c = getSpiralVector(s),
        r = 0,
        a = Math.abs(c.x + c.y),
        s++),
        0 !== c.x && (n += Math.abs(c.x) / c.x),
        0 !== c.y && (i += Math.abs(c.y) / c.y),
        r++,
        l++;
    return {
        x: n,
        y: i
    }
}
,
HolidayTreeIntro.vue = {
    vm: !0,
    data: ()=>({
        fullscreen: !0
    }),
    mixins: [window.ScreenMixin],
    html: "holidayTreeIntro.html",
    methods: {
        placeTree() {
            0 === Game.town.GetCountOfObject("SaltyBot_Shack") && Game.town.placeNearPosition("SaltyBot_Shack", 7, 7),
            this.close()
        }
    },
    created() {
        pc.app.on("NewTownLoaded", (()=>{
            Game.onboardingProgress && Game.onboardingProgress.progress
        }
        )),
        pc.app.on("playClicked", (()=>{
            Game.town && 0 === Game.town.GetCountOfObject("Holiday_Tree") && API.getUserData("HolidayIntroSeen", (e=>{
                e || API.setUserData("HolidayIntroSeen", {
                    seen: !0
                })
            }
            ))
        }
        ))
    }
};
var ConfirmComponent = pc.createScript("v-ts-confirm");
ConfirmComponent.vue = {
    mixins: [window.ScreenMixin],
    props: {
        title: {
            type: String,
            default: "Confirm"
        },
        acceptText: {
            type: String,
            default: "OK"
        },
        rejectText: {
            type: String,
            default: "Cancel"
        },
        buttons: {
            type: Object,
            default: ()=>({
                accept: !0,
                reject: !0
            })
        }
    },
    data: ()=>({
        fullscreen: !1
    }),
    template: '\n<div>\n    <div class="container" v-if="visible" @mousedown.stop @mouseup.stop @wheel.stop> \n        <div class="darkscreen">\n            <div class="center upgrade">\n                <div class="dialog-cell"> \n                    <div class="header-row">\n                        <div class="left">       \n                            <h1>{{title}}</h1>\n                        </div>\n                        <button class="close-button" @click="close()"></button>\n                    </div>\n                    <div class="body-row">\n                        <slot>\n                            Confirm a thing?\n                        </slot>\n                    </div>\n                    <div class="footer-row">\n                        <div class="confirm-buttons">\n                            <button v-if="buttons.reject" class="no" @click="reject()">\n                                <span>{{rejectText}}</span>\n                            </button>\n                            <button v-if="buttons.accept" class="yes" @click="accept()">\n                                <span>{{acceptText}}</span>\n                            </button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n',
    methods: {
        accept() {
            this.$emit("accept"),
            this.close()
        },
        reject() {
            this.$emit("reject"),
            this.close()
        },
        open() {
            return ScreenMixin.methods.open.apply(this),
            new Promise(((t,e)=>{
                let n = null;
                this.$on("accept", (()=>n = !0)),
                this.$on("reject", (()=>n = !1)),
                this.$on("close", (()=>t(n)))
            }
            ))
        }
    }
};
var AvatarComponent = pc.createScript("v-ts-avatar");
AvatarComponent.vue = {
    props: {
        user: {
            type: Object
        },
        size: {
            type: Number,
            default: 128
        },
        "css-class": {
            type: String
        }
    },
    template: '\n<div>\n    <img :class="cssClass" v-if="user?.avatarUrls" :src="user?.avatarUrls[size.toString()]">\n    <v-ts-img :css-class="cssClass" v-if="!user?.avatarUrls" asset-name="icon_profile.png"></v-ts-img>\n</div>\n'
};
var GenericRewardUI = pc.createScript("v-ts-holiday-generic-reward");
GenericRewardUI.vue = {
    vm: !0,
    mixins: [window.ScreenMixin],
    data: ()=>({
        fullscreen: !0
    }),
    html: "genericReward.html",
    methods: {
        openGift() {
            console.log("Open Gift"),
            this.close(),
            CryptoRewardUI.vm.open()
        }
    }
};
var CryptoRewardUI = pc.createScript("v-ts-holiday-crypto-reward");
CryptoRewardUI.vue = {
    vm: !0,
    mixins: [window.BoardScreenMixin],
    data: ()=>({
        fullscreen: !0,
        canPlaceTree: !0
    }),
    html: "cryptoReward.html",
    methods: {
        acceptReward() {
            this.close()
        },
        open(e, t) {
            if (BoardScreenMixin.methods.open.apply(this, [e, t]),
            void 0 !== e && void 0 !== t) {
                if (0 === Game.town.GetCountOfObject("SaltyBot_Shack")) {
                    const a = Game.town.GetObjectAt(e, t);
                    a && a.objData.CanBuildUpon ? this.canPlaceTree = !0 : this.canPlaceTree = !1
                } else
                    this.canPlaceTree = !1
            } else
                this.canPlaceTree = !1
        },
        placeTree() {
            Game.addObject(this.x, this.z, "SaltyBot_Shack"),
            this.close()
        }
    }
};
var HolidayTreeRemind = pc.createScript("v-ts-holiday-tree-remind");
HolidayTreeRemind.vue = {
    vm: !0,
    data: ()=>({
        fullscreen: !0,
        endDate: new Date("2021-02-28T00:00:00.000Z"),
        galaPower: Game.galaPower
    }),
    mixins: [window.ScreenMixin],
    html: "holidayTreeRemind.html",
    methods: {
        open() {
            return ScreenMixin.methods.open.apply(this),
            this.$refs.confirm.open()
        },
        viewTree() {
            this.close()
        },
        openStore() {
            window.open("https://app.gala.games/games/town-star/#buildings", "_blank")
        },
        openChallenge() {
            this.close(),
            Game.challenge.isComplete() ? ChallengeCompleteUI.open() : ChallengeUI.open()
        }
    },
    created() {
        Game.app.on("playClicked", (()=>{
            Game.town && API.getUserData("holidayRemind").then((e=>{
                if (Game.onboardingProgress && Game.onboardingProgress.progress && "Finished" == Game.onboardingProgress.progress)
                    if (e) {
                        const n = new Date(e.lastSeen)
                          , a = (n.getDate(),
                        n.getMonth(),
                        new Date);
                        a.getDate(),
                        a.getMonth();
                        HolidayTreeRemind.open()
                    } else
                        HolidayTreeRemind.open()
            }
            ))
        }
        )),
        Game.app.on("OnboardingFinished", (()=>{
            HolidayTreeRemind.open()
        }
        ))
    }
},
HolidayTreeRemind.open = function() {
    API.setUserData("holidayRemind", {
        lastSeen: Date.now()
    }),
    Game.guestMode || HolidayTreeRemind.vm.open()
}
;
var uiParticles = pc.createScript("uiParticles");
UIParticles = {},
uiParticles.prototype.initialize = function() {
    div = document.createElement("div"),
    div.classList.add("particle-hud-currency"),
    document.body.appendChild(div),
    div = document.createElement("div"),
    div.classList.add("particle-hud-points"),
    document.body.appendChild(div),
    PhaseManager.instance.onPhaseChanged(PhaseManager.PlayingPhase, (()=>{
        this.currency = Game.currency,
        this.points = Game.points,
        UIParticles = this,
        this.on("CreateUIParicle", ((t,e)=>{
            this.createParticleDiv(t, amount, e)
        }
        )),
        this.app.on("PlayerCurrencyChanged", (t=>{
            let e = t - this.currency;
            e > 0 && this.createParticleDiv("cash", amountToParticle(e), ".particle-hud-currency"),
            this.currency = Game.currency
        }
        )),
        this.app.on("PlayerPointsChanged", (t=>{
            let e = t - this.points;
            e > 0 && this.createParticleDiv("points", amountToParticle(e), ".particle-hud-points"),
            this.points = Game.points
        }
        ))
    }
    ));
    const amountToParticle = t=>t >= 5e3 ? 100 : t < 5e3 && t >= 2500 ? 50 : t > 0 && t < 2500 ? 25 : void 0;
    this.urls = {};
    let t = app.assets.get(29003893);
    this.urls.cash = t.getFileUrl(),
    t = app.assets.get(24639095),
    this.urls.points = t.getFileUrl(),
    this.activeParticles = 0,
    this.adds = 0
}
,
uiParticles.prototype.createParticleDiv = function(t, e, a) {
    const createParticle = (t,e,a)=>{
        this.activeParticles++;
        const i = document.createElement("particle");
        document.body.appendChild(i);
        let r = Math.floor(30 * Math.random() + 8)
          , s = r
          , c = 1e3 * (Math.random() - .5)
          , n = 1e3 * (Math.random() - .5)
          , o = 1e3 * Math.random()
          , l = 200 * Math.random();
        i.style.backgroundImage = `url(${this.urls[a]})`,
        i.style.width = `${r}px`,
        i.style.height = `${s}px`;
        i.animate([{
            transform: `translate(-50%, -50%) translate(${t}px, ${e}px) rotate(0deg) scaleX(1) scaleY(1) `,
            opacity: 1
        }, {
            transform: `translate(-50%, -50%) translate(${t + c}px, ${e + n}px) rotate(${o}deg) scaleX(2) scaleY(2)`,
            opacity: 0
        }], {
            duration: 1e3 * Math.random() + 2e3,
            easing: "cubic-bezier(0, .9, .57, 1)",
            delay: l
        }).onfinish = removeParticle
    }
      , removeParticle = t=>{
        this.activeParticles--,
        t.srcElement.effect.target.remove()
    }
    ;
    ((t,e,a)=>{
        const i = t.getBoundingClientRect()
          , r = i.left + i.width / 2
          , s = i.top + i.height / 2;
        for (let t = 0; t < e; t++)
            this.activeParticles < 100 && createParticle(r, s, a)
    }
    )(document.querySelector(a), e, t),
    SETTINGS.soundEffectsEnabled && EntitySpawner.spawnObject("RewardSound", 0, 0, 0, this.app.root)
}
,
uiParticles.prototype.log = window.logger && logger({
    context: "ui particles",
    color: "green",
    timing: !0
});
var SKINS = {
    getActivePacksOfSet: t=>SKINS.activePacks ? [...SKINS.activePacks].filter((a=>a.startsWith(`${t}:`))) : 0,
    getActivePacks: ()=>SKINS.activePacks ? [...SKINS.activePacks] : 0
};
var SkinComponent = pc.createScript("v-ts-skin");
SkinComponent.vue = {
    props: ["object", "skin", "active"],
    template: '\n    <div class="product can-purchase transparent-cell">\n        <h2>{{skin}} <span v-ts-grab.object-name="object.Name"></span> Skin</h2>\n        <div class="portrait">\n            <div class="unit-pic">\n                <v-ts-img :icon="object.Name" :skin-set="skin"></v-ts-img>   \n                <v-ts-img class="palette-icon" asset-id="46943102"></v-ts-img>\n            </div>\n            <div class="npc-pic" v-if="object.UnitType !== \'None\'">\n                <v-ts-img :icon="object.UnitType" :skin-set="skin"></v-ts-img>                                \n            </div>\n        </div>\n        <div class="buy-buttons">\n            <button :class="{\'yes\': !active, \'no\': active}" @click="$emit(\'click\')">\n                <span>{{active ? \'Remove Skin\' : \'Apply Skin\'}}</span>\n            </button>\n        </div>\n    </div>\n'
};
var SkinLoadingUI = pc.createScript("v-ts-skin-loading");
SkinLoadingUI.vue = {
    html: "ts-skin-loading.html",
    data: ()=>({
        progress: 0
    }),
    created() {
        this.progress = 0,
        setTimeout((()=>{
            this.progress = 25
        }
        ), 500),
        setTimeout((()=>{
            this.progress = 50
        }
        ), 1e3),
        setTimeout((()=>{
            this.progress = 75
        }
        ), 1500),
        setTimeout((()=>{
            this.$emit("close")
        }
        ), 2e3)
    },
    methods: {
        update() {}
    }
};
BiomeEffects = (biomeData = {},
class {
    getRaw() {
        return biomeData
    }
    setData(e) {
        biomeData = e
    }
    getEffectsForBiomeType(e) {
        return biomeData && biomeData[e] ? Object.keys(biomeData[e]) : []
    }
    getEffectForBiomeType(e, a) {
        return biomeData && biomeData[e] && biomeData[e][a] || {}
    }
}
),
BIOME_EFFECTS = new BiomeEffects;
class TS_TeslaCoilLogic extends TS_ObjectLogic {
    Initialize() {
        this.count = 0,
        console.log("Tesla Coil Initialized ")
    }
    OnPlaced() {
        super.OnPlaced()
    }
}
class TS_Vox {
    static isNonAnimated(t) {
        return VOX_NONANIMATEDIDS.includes(t)
    }
    constructor(t) {
        if (this.pickRotationSpeed = 250,
        !this.template) {
            const t = Game.app.assets.find("Vox_Template", "template");
            t && (this.template = t.resource)
        }
        if (!this.template)
            return;
        this.voxHome = t,
        this.homeTileObject = this.voxHome.townObject,
        this.entity = null,
        this.exists = !0,
        this.type = "VOX",
        this.tokenId = this.voxHome.tokenId,
        this.nonAnimated = this.voxHome.nonAnimated,
        this.entity = this.template.instantiate(),
        this.entity.enabled = !1,
        Game.app.root.addChild(this.entity);
        const i = this.voxHome.townObject.GetWorldSpacePosition();
        this.setPosition(i.x, .25, i.z),
        this.building = this.voxHome.townObject,
        this.unitsData = Game.unitsData[this.type],
        this.logicObject = new TS_VoxLogic(this)
    }
    Initialize() {
        this.logicObject.Initialize(),
        LoadEntity()
    }
    setModelFromURL(t, i) {
        this.tokenId = t,
        Game.app.assets.loadFromUrl(`https://d6zjjlec5433l.cloudfront.net/${t}.glb`, "container", ((t,e)=>{
            if (t)
                return;
            this.entity.findComponent("model").asset = e.resource.model;
            const o = this.entity.findByName("Armature.001");
            o && o.setLocalRotation(0, 0, 0, 1),
            this.entity.enabled = !0,
            this.isLoaded = !0,
            this.setAnimation("Walk"),
            "function" == typeof i && i()
        }
        ))
    }
    LoadEntity() {
        this.pickEntity = EntitySpawner.spawnObject("UnitLocation", voxHome.worldX, 3, voxHome.worldZ, this.entity),
        this.pickEntity.enabled = !1,
        this.pickStatus = !1
    }
    setPickActive(t) {
        this.pickStatus = t
    }
    onHomeSelect() {
        this.setPickActive(!0)
    }
    onHomeDeselect() {
        this.setPickActive(!1)
    }
    setPosition(t, i, e) {
        this.entity.setPosition(t, i, e)
    }
    setRotation(t) {
        this.entity.setRotation(t)
    }
    isHome() {
        return !0
    }
    setAnimation(t, i={}) {
        if (!t)
            return;
        const e = this.entity.findComponent("animation");
        if (!e)
            return console.log("Could not find animation controller");
        Object.keys(i).includes("loop") && (e.loop = i.loop);
        const o = `${t}.glb`;
        if (!Object.keys(e.animations).includes(o))
            return console.log(`Can not find animation ${o}`);
        e.play(o)
    }
    remove() {
        this.entity && this.entity.destroy()
    }
    move(t) {
        this.logicObject.move(t)
    }
    Update(t) {
        this.pickEntity && (this.pickEntity.enabled = this.pickStatus && !this.isHome(),
        this.pickEntity.rotate(0, t * TS_Unit.pickRotationSpeed, 0)),
        this.logicObject.Update(t)
    }
}
VOX_NONANIMATEDIDS = [4638, 2432, 6596, 4813, 454, 1805, 6315, 7789, 1653, 2767, 7485, 4270, 339, 4851, 6058, 7020, 7555, 5831, 7959, 6980, 2302, 7349, 3975, 1839, 1992, 3369, 1300, 4742, 8558, 2082, 4318, 6631, 8014, 2417, 7676, 1597, 6490, 6228, 8017, 7831, 3770, 4577, 2070, 4591, 6987, 8835, 2218, 4752, 2902, 4902, 596, 8729, 2474, 6195, 6436, 5518, 7039, 3348, 4086, 8184, 3541, 6389, 585, 3430, 5992, 5499, 167, 6920, 471, 6746, 2009, 2105, 1171, 5449, 8259, 8484, 5307, 639, 6975, 1496, 783, 6334, 800, 7151, 4320, 5509, 7099, 5364, 8541, 5318, 2616, 562, 8866, 5251, 4650, 7200, 6961, 249, 5174, 6619, 7013, 4793, 7568, 8164, 552, 4628, 6762, 7524, 4988, 7898, 7873, 8096, 4642, 3400, 2870, 1765, 8123, 491, 297, 464, 4217, 5092, 3796, 8640, 8471, 1195, 6965, 3891, 4098, 6767, 1886, 4237, 3403, 4201, 5840, 7333, 1519, 551, 1653, 2767, 7485, 4270, 339, 4851, 6058, 7020, 7555, 5831, 7959, 6980, 2302, 7349, 3975, 1839, 1992, 3369, 1300, 4742, 8558, 2082, 4318];
class TS_VoxHomeLogic extends TS_ObjectLogic {
    constructor(t) {
        if (super(t),
        !t)
            throw "Cannot Create TS_ObjectLogic without a valid townObject";
        if (this.townObject = t,
        this.entity = t.entity,
        this.type = t.type,
        this.data = t.data || {},
        this.tokenId = isNaN(this.data.tokenId) ? 0 : this.data.tokenId,
        this.reqsValid = !0,
        this.reqsInvalidVFX = EntitySpawner.spawnObject("VFX_RequirementsNotMet", this.townObject.worldX, 0, this.townObject.worldZ, this.townObject.entity),
        this.reqsInvalidVFX.enabled = !1,
        !this.entity || !this.type)
            throw "Cannot Create TS_ObjectLogic without a valid entity and type";
        this.voxLoaded = !1,
        this.nonAnimated = TS_Vox.isNonAnimated(this.tokenId),
        this.vox = new TS_Vox(this),
        this.matchVoxRotation(),
        this.vox.setModelFromURL(this.tokenId, this.onVoxLoadComplete.bind(this))
    }
    onVoxLoadComplete() {
        this.voxLoaded = !0
    }
    changeVoxRotation() {
        var t = this.entity.getEulerAngles();
        t.y = 0,
        this.vox.entity.setEulerAngles(t)
    }
    matchVoxRotation() {
        this.vox.setRotation(this.entity.getRotation())
    }
    onRotate(t) {
        this.vox.isHome() && this.matchVoxRotation()
    }
    OnRemove() {
        this.vox.remove()
    }
    Update(t) {
        this.voxLoaded && this.vox.Update(t)
    }
}
var ChallengeUI = pc.createScript("v-ts-challengeUI");
CHALLENGE = {
    fullscreen: !0,
    timeRemaining: Game.getChallengeSecondsRemaining(),
    timer: void 0,
    challengeProgress: Game.challenge?.goalProgress,
    currentEarnings: Game.town?.getCurrentEarnings()
},
ChallengeUI.open = function() {
    ChallengeUI.vm.open()
}
,
ChallengeUI.close = function() {
    ChallengeUI.vm.close()
}
,
ChallengeUI.vue = {
    vm: !0,
    html: "challengeUI.html",
    mixins: [window.ScreenMixin],
    data: ()=>CHALLENGE,
    created() {},
    methods: {
        secondsToHms: e=>{
            const n = Number(e);
            return `${String(Math.floor(n / 3600)).padStart(2, "0")}:${String(Math.floor(n % 3600 / 60)).padStart(2, "0")}:${String(Math.floor(n % 3600 % 60)).padStart(2, "0")}`
        }
        ,
        startTimer: ()=>{
            CHALLENGE.timer = setInterval((()=>{
                CHALLENGE.timeRemaining = Game.getChallengeSecondsRemaining(),
                0 == Game.getChallengeSecondsRemaining() && ChallengeUI.vm.close()
            }
            ), 1e3)
        }
        ,
        progressChanged(e) {
            CHALLENGE.challengeProgress = Game.challenge.goalProgress
        },
        townObjectAdded() {
            CHALLENGE.currentEarnings = Game.town?.getCurrentEarnings()
        },
        reset() {
            this.close()
        }
    },
    mounted() {
        this.startTimer(),
        this.challengeProgress = Game.challenge?.goalProgress,
        Game.app.on("challengeProgressChanged", this.progressChanged, this),
        Game.app.on("TownObjectAdded", this.townObjectAdded, this),
        Game.app.on("TownLoadComplete", this.townObjectAdded, this),
        Game.app.on("EarningChallengeExpired", this.reset, this)
    },
    computed: {
        getChallengeGoal: function() {
            return Game.getCurrentChallengeGoal()
        },
        getTimeRemaining: function() {
            return `Rewards Expire in: ${this.secondsToHms(this.timeRemaining)}`
        }
    },
    watch: {}
};
var ChallengeCompleteUI = pc.createScript("v-ts-challengeCompleteUI");
ChallengeCompleteUI.open = function() {
    ChallengeCompleteUI.vm.open()
}
,
ChallengeCompleteUI.close = function() {
    ChallengeCompleteUI.vm.close()
}
,
ChallengeCompleteUI.vue = {
    vm: !0,
    html: "challengeCompleteUI.html",
    mixins: [window.ScreenMixin],
    data: ()=>({
        fullscreen: !0,
        timeRemaining: Game.getChallengeSecondsRemaining(),
        timer: void 0,
        rewardsCollected: Game.challenge?.isClaimed(),
        challengeCompleted: Game.challenge?.isComplete(),
        currentEarnings: Game.town?.getCurrentEarnings(),
        earnedAmount: Game.challenge?.rewardAmount
    }),
    methods: {
        collect() {
            Game.challenge.collect(),
            this.rewardsCollected = !0,
            this.close()
        },
        secondsToHms: e=>{
            const n = Number(e);
            return `${String(Math.floor(n / 3600)).padStart(2, "0")}:${String(Math.floor(n % 3600 / 60)).padStart(2, "0")}:${String(Math.floor(n % 3600 % 60)).padStart(2, "0")}`
        }
        ,
        startTimer: ()=>{
            this.timer = setInterval((()=>{
                this.timeRemaining = Game.getChallengeSecondsRemaining(),
                0 == Game.getChallengeSecondsRemaining() && ChallengeCompleteUI.vm.close()
            }
            ), 1e3)
        }
        ,
        checkChallengeComplete(e) {
            const {progress: n, earned: t} = e || {};
            this.rewardsCollected = Game.challenge.isClaimed(),
            this.challengeCompleted = Game.challenge.isComplete(),
            this.currentEarnings = Game.town?.getCurrentEarnings(),
            this.earnedAmount = Game.challenge?.rewardAmount ?? t
        },
        townObjectAdded() {
            this.currentEarnings = Game.town?.getCurrentEarnings()
        },
        challengeClaimed() {
            this.rewardsCollected = Game.challenge.isClaimed(),
            this.earnedAmount = Game.challenge?.rewardAmount
        },
        challengeComplete() {
            const e = Game.challenge?.rewardAmount;
            this.challengeCompleted = !0,
            API.event("challenge_complete"),
            this.earnedAmount = e
        },
        reset() {
            this.close(),
            this.rewardsCollected = !1,
            this.currentEarnings = Game.town?.getCurrentEarnings(),
            this.challengeCompleted = !1,
            this.earnedAmount = Game.challenge?.rewardAmount
        }
    },
    mounted() {
        this.startTimer(),
        this.rewardsCollected = Game.challenge?.isClaimed(),
        this.earnedAmount = Game.challenge?.rewardAmount,
        Game.app.on("challengeProgressChanged", this.checkChallengeComplete, this),
        Game.app.on("TownObjectAdded", this.townObjectAdded, this),
        Game.app.on("TownLoadComplete", this.checkChallengeComplete, this),
        Game.app.on("ChallengeClaimed", this.challengeClaimed, this),
        Game.app.on("EarningChallengeExpired", this.reset, this),
        Game.app.on("ChallengeStatusComplete", this.challengeComplete, this)
    },
    computed: {
        getChallengeTotal: function() {
            return Game.getCurrentChallengeSum()
        },
        getTimeRemaining: function() {
            return `Rewards Expire in: ${this.secondsToHms(this.timeRemaining)}`
        },
        getNextChallenge: function() {
            return `Next challenge Starts in: ${this.secondsToHms(this.timeRemaining)}`
        },
        getChallengeGoal: function() {
            return Game.getCurrentChallengeGoal()
        },
        getCurrentEarnings: function() {
            return Game.town.getCurrentEarnings()
        },
        getClaimedEarnings: function() {
            return Game.challenge?.rewardAmount
        },
        getChallengeComplete: function() {
            let e = this.challengeCompleted
              , n = this.currentEarnings > 0;
            return console.log("button status ", e, n),
            e && n
        }
    }
};
class TS_VoxLogic {
    constructor(t) {
        if (!t)
            throw "Cannot Create TS_ObjectLogic without a valid townObject";
        if (this.townObject = t,
        this.entity = t.entity,
        this.type = t.type,
        this.data = t.data || {},
        this.voxHome = t.voxHome,
        this.building = this.townObject.building,
        this.nonAnimated = t.nonAnimated,
        !this.entity || !this.type)
            throw "Cannot Create TS_ObjectLogic without a valid entity and type";
        this.xNew = this.getRandomInt(),
        this.zNew = this.getRandomInt(),
        this.targetObject = null,
        this.homeTileTest = this.building,
        this.pathArray = [],
        this.startPosition = new pc.Vec3,
        this.speed = 5,
        this.difference = new pc.Vec3,
        this.distance = 0,
        this.direction = new pc.Vec3,
        this.targetPosition = new pc.Vec3,
        this.homePosition = new pc.Vec3,
        this.node = 0,
        this.path = null,
        this.currentNode = 0,
        this.timeSinceLastNode = 0,
        this.timer = 1,
        this.timer2 = 1,
        this.Initialize(),
        this.lerpAmount = 0,
        this.lerpSpeed = 5,
        this.path = null,
        this.node = null,
        this.voxMove = !1,
        this.moveOK = !0,
        this.timer = 0,
        this.voxHomeTimer = 1e3,
        this.voxMovesNum = 0,
        this.voxMoves = ["Wave", "Dab", "Floss", "OverHere", "Clap"],
        Game.town.townLoaded ? this.firstTarget() : Game.app.on("TownLoadComplete", this.firstTarget, this)
    }
    firstTarget() {
        this.homeTileTest = this.building,
        this.voxlight1 = this.building.entity.findByTag("voxlight1"),
        this.xNew = this.getRandomInt(),
        this.zNew = this.getRandomInt(),
        this.targetObject = Game.town.GetObjectAt(this.xNew, this.zNew),
        this.voxMove = !0
    }
    Initialize() {
        this.homePosition = this.entity.getPosition().clone(),
        console.log(" this.homePosition " + this.homePosition),
        this.lookat = new pc.Entity,
        Game.app.root.addChild(this.lookat)
    }
    getRoughPathTo(t) {
        let i = this.entity.getPosition()
          , e = Game.town.WorldPositionToRoughNode(i.x, i.z)
          , s = this.targetObject.GetWorldSpacePosition()
          , o = Game.town.WorldPositionToRoughNode(s.x, s.z);
        return astar.search(Game.town.pathingMapRough, e, o, {
            heuristic: astar.heuristics.diagonal
        })
    }
    getPathTo(t) {
        let i = this.entity.getPosition()
          , e = Game.town.WorldPositionToNode(i.x, i.z)
          , s = this.targetObject.GetWorldSpacePosition()
          , o = Game.town.WorldPositionToNode(s.x, s.z);
        return astar.search(Game.town.pathingMap, e, o, {
            heuristic: astar.heuristics.diagonal
        })
    }
    getRandomInt() {
        return this.min = Math.ceil(10),
        this.max = Math.floor(65),
        this.x = Math.floor(Math.random() * (this.max - this.min) + this.min),
        this.tileNum = 5 * Math.ceil(this.x / 5),
        this.tileNum
    }
    checkMatchedTiles(t, i) {
        return t.townX == i.townX && t.townZ == i.townZ
    }
    setVoxHomeAction() {
        this.voxHome.matchVoxRotation(),
        this.voxlight1[0].enabled = !0,
        this.voxMovesNum <= 3 ? (this.danceMove = this.voxMoves[this.voxMovesNum],
        this.townObject.setAnimation(this.danceMove),
        this.voxMovesNum++) : this.voxMovesNum = 0
    }
    setTargetObject() {
        this.xNew = this.getRandomInt(),
        this.zNew = this.getRandomInt(),
        this.currentTargetObject = this.targetObject,
        this.currentTargetObject == this.homeTileTest && (this.moveOK = !1,
        this.setVoxHomeAction()),
        this.targetObject = Game.town.GetObjectAt(this.xNew, this.zNew),
        this.homeTileTest = this.building,
        this.homeTileTest2 = Game.town.GetObjectAt(70, 70),
        this.tileType = Game.town.GetObjectAt(this.xNew, this.zNew).type,
        "Pond" !== this.tileType && "Marsh" !== this.tileType || (this.targetObject = this.homeTileTest),
        this.sameDestination = this.checkMatchedTiles(this.currentTargetObject, this.targetObject),
        this.sameDestination && (this.sameDestination2 = this.checkMatchedTiles(this.homeTileTest, this.targetObject),
        0 == this.sameDestination2 ? this.targetObject = this.homeTileTest : this.targetObject = this.homeTileTest2)
    }
    resetPath() {
        this.node = 0,
        this.path = null,
        this.currentNode = 0,
        this.timeSinceLastNode = 0
    }
    setPath(t) {
        this.resetPath(),
        this.path = t
    }
    onRotate(t) {}
    OnRemove() {}
    rotate(t) {
        this.lerpAmount = 0,
        this.lookat.setPosition(this.entity.getPosition()),
        this.lookat.lookAt(t),
        this.lookat.rotateLocal(0, 180, 0)
    }
    LerpRotation(t) {
        this.lerpAmount += t;
        let i = (new pc.Quat).slerp(this.entity.getRotation(), this.lookat.getRotation(), this.lerpAmount * this.lerpSpeed);
        this.entity.setRotation(i)
    }
    Update(t) {
        if (this.moveOK) {
            if (!Game.town.townLoaded)
                return;
            if (!this.targetObject)
                return;
            this.LerpRotation(t),
            this.move(t)
        } else {
            if (this.nonAnimated) {
                this.timer2 += 16 * t;
                var i = Math.max(Math.sin(this.timer2), -1.6);
                this.entity.rotateLocal(0, i, 0)
            }
            this.timer++,
            this.timer >= this.voxHomeTimer && (this.timer = 0,
            this.moveOK = !0,
            this.entity.setLocalScale(1, 1, 1),
            this.townObject.setAnimation("Walk"),
            this.voxlight1[0].enabled = !1,
            console.log("Timer Reset"))
        }
    }
    move(t) {
        if (!this.targetObject)
            return;
        if (this.path || this.setPath(this.getPathTo(this.targetObject)),
        this.nonAnimated) {
            this.timer2 += 16 * t;
            var i = Math.max(Math.sin(this.timer2) + -1, -1.2);
            this.entity.rotateLocal(i + .5, 0, 0)
        }
        let e, s = !1;
        if (this.path.length > 0) {
            let t = Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y)
              , i = new pc.Vec3(t.x,0,t.z);
            s = this.entity.getPosition().distance(i) <= .01
        } else
            s = !0;
        if (s && (this.timeSinceLastNode = 0,
        this.node++,
        this.path && this.node >= this.path.length && this.path.length > 0))
            return this.setTargetObject(),
            void this.resetPath();
        if (0 === this.path.length)
            return e = new pc.Vec3(this.targetObject.worldX,0,this.targetObject.worldZ),
            void this.entity.setPosition(e);
        e = Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y);
        new pc.Vec3(e.x,0,e.z);
        if (!this.path[this.node - 1]) {
            this.timeSinceLastNode = 0;
            let t = this.entity.getPosition()
              , i = {};
            i.x = t.x + 502,
            i.y = t.z + 2,
            this.path[this.node - 1] = i
        }
        this.timeSinceLastNode += t;
        Game.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y),
        new pc.Vec3(e.x,0,e.z);
        let o = new pc.Vec3
          , h = this.townObject.building.town.NodeToWorldPosition(this.path[this.node - 1].x, this.path[this.node - 1].y)
          , n = this.townObject.building.town.NodeToWorldPosition(this.path[this.node].x, this.path[this.node].y)
          , a = new pc.Vec3(h.x,0,h.z)
          , r = new pc.Vec3(n.x,0,n.z);
        this.rotate(r);
        this.path[this.node].speedMod;
        let c = 1
          , l = !1;
        h.x != n.x && h.z != n.z && (l = !0);
        let d = this.timeSinceLastNode / .5;
        d > 1 && (d = 1),
        o.lerp(a, r, d),
        this.entity.setPosition(o)
    }
}
var Billboard = pc.createScript("billboard");
Billboard.prototype.initialize = function() {
    this.camera = this.app.root.findByName("Camera")
}
,
Billboard.prototype.update = function(t) {
    this.entity.setRotation(CameraCommander.instance?.townCamera.getRotation())
}
;
class TS_Challenge {
    constructor({goalAmount: e, sum: t, duration: s, id: a, completed: l, claimed: i, rewardAmount: o}) {
        this.completed = l,
        this.claimed = !!i,
        this.goalAmount = e,
        this.goalProgress = t ?? 0,
        this.rewardAmount = o ?? 0;
        const n = parseInt(a);
        this.endTime = n + s,
        this.challengeId = a,
        this.disposing = !1,
        pc.app.fire("challengeProgressChanged", {
            progress: this.goalProgress,
            earned: this.rewardAmount
        }),
        pc.app.fire("ChallengeClaimed", this.claimed),
        pc.app.on("RealtimeQuestStepProgress", this.onChallengeProgress.bind(this)),
        pc.app.on("RealtimeQuestStepCompleted", this.onChallengeStatusComplete.bind(this)),
        pc.app.on("RealtimeQuestRewardClaimed", this.onChallengeClaimed.bind(this))
    }
    cleanUpEventListeners() {
        pc.app.off("RealtimeQuestStepProgress"),
        pc.app.off("RealtimeQuestStepCompleted"),
        pc.app.off("RealtimeQuestRewardClaimed")
    }
    getEndTime() {
        return this.endTime
    }
    getTimeRemainingMS() {
        return this.endTime - Date.now()
    }
    getTimeRemainingSeconds() {
        return Math.floor(this.getTimeRemainingMS() / 1e3)
    }
    getGoalAmount() {
        return this.goalAmount
    }
    getGoalProgress() {
        return this.goalProgress
    }
    setGoalProgress(e) {
        this.goalProgress = e ?? 0,
        pc.app.fire("challengeProgressChanged", e)
    }
    collect() {
        Game.collectEarnings().then((e=>{
            if (e.success) {
                const t = e.earning ?? 0;
                console.log(e),
                console.log(e.data?.claimedTownCoin),
                this.claimed = !0,
                this.rewardAmount = t,
                API.event("town_claimed", {
                    townClaimed: t
                }),
                Game.app.fire("ChallengeClaimed")
            }
        }
        ))
    }
    onChallengeClaimed(e) {
        console.log(e)
    }
    onChallengeProgress({challenge: e, sum: t}) {
        "Daily Quest" === e && this.setGoalProgress(t)
    }
    onChallengeStatusComplete(e) {
        pc.app.fire("ChallengeStatusComplete", e),
        this.completed = e?.completed
    }
    isComplete() {
        return Boolean(this.completed)
    }
    isClaimed() {
        return Boolean(this.claimed)
    }
    isElapsed() {
        return Date.now() > this.endTime
    }
}
var TeslaArc = pc.createScript("teslaArc");
let arcCountDown = Math.floor(180 * Math.random()) + 1
  , arcCountDown2 = 20
  , arcCountDown3 = 102
  , theRandomScale = .5 * Math.random()
  , theRandomNumber = Math.floor(180 * Math.random()) + 1;
TeslaArc.prototype.initialize = function() {
    this.entity.setLocalScale(.5, .5, .5)
}
,
TeslaArc.prototype.arcLight = function() {
    this.entity.model.show(),
    theRandomNumber = Math.floor(180 * Math.random()) + 1,
    theRandomScale = .4 * Math.random(),
    arcCountDown3 -= 1,
    arcCountDown3 <= 5 && (this.entity.setLocalScale(theRandomScale, theRandomScale, theRandomScale),
    this.entity.rotateLocal(theRandomNumber, theRandomNumber, theRandomNumber),
    arcCountDown3 = 10)
}
,
TeslaArc.prototype.arcLightOff = function() {
    this.entity.model.hide(),
    this.entity.setLocalScale(0, 0, 0)
}
,
TeslaArc.prototype.update = function(t) {
    this.entity.model.hide(),
    this.move(t)
}
,
TeslaArc.prototype.move = function(t) {
    arcCountDown2 -= 1,
    arcCountDown2 <= 1700 && this.arcLight(),
    arcCountDown2 <= 0 && (this.arcLightOff(),
    arcCountDown2 = Math.floor(1e3 * Math.random()) + 3e3,
    this.entity.setLocalScale(0, 0, 0),
    this.entity.model.hide())
}
;
function onAll(c, o) {
    const t = pc.Application.getApplication()
      , n = {};
    c.forEach((c=>{
        n[c] = !1,
        t.once(c, (t=>{
            n[c] = !0,
            Object.keys(n).every((c=>n[c])) && o()
        }
        ))
    }
    ))
}
class EventAggregator {
    constructor(c, o) {
        const t = pc.Application.getApplication();
        onAll(c, (()=>t.fire(o)))
    }
}
class TS_BlockchainObjectLogic extends TS_ObjectLogic {
    Initialize() {
        this.earnings = 0
    }
    OnPlaced() {
        super.OnPlaced()
    }
}
