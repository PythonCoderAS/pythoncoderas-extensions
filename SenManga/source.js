(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);

},{"./Source":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":3,"./models":25}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],24:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":5,"./ChapterDetails":6,"./Constants":7,"./HomeSection":8,"./Languages":9,"./Manga":10,"./MangaTile":11,"./MangaUpdate":12,"./OAuth":13,"./PagedResults":14,"./RequestHeaders":15,"./RequestManager":16,"./RequestObject":17,"./ResponseObject":18,"./SearchRequest":19,"./SourceInfo":20,"./SourceTag":21,"./TagSection":22,"./TrackObject":23,"./UserForm":24}],26:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenManga = exports.SenMangaInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const SenMangaParser_1 = require("./SenMangaParser");
const BASE = "https://raw.senmanga.com";
exports.SenMangaInfo = {
    icon: "icon.png",
    version: "1.0.3",
    name: "SenManga",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from SenManga",
    language: "jp",
    hentaiSource: false,
    websiteBaseURL: BASE
};
class SenManga extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new SenMangaParser_1.SenMangaParser();
        this.header = {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
        };
        this.requestManager = createRequestManager({
            requestTimeout: 15000,
            requestsPerSecond: 4
        });
    }
    globalRequestHeaders() {
        return this.header;
    }
    getMangaShareUrl(mangaId) {
        return `${BASE}/${mangaId}`;
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}`,
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseGlobalTagList($);
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}`,
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            sectionCallback(createHomeSection({
                id: "last_update",
                items: this.parser.parseLatestUpdates($, BASE),
                title: "Latest Updates",
                view_more: true
            }));
            sectionCallback(createHomeSection({
                id: "popular",
                items: this.parser.parseMostPopular($, BASE),
                title: "Popular Manga",
                view_more: true
            }));
            sectionCallback(createHomeSection({
                id: "new_series",
                items: this.parser.parseNewSeries($, BASE),
                title: "New Series",
                view_more: true
            }));
        });
    }
    getPagedResults(url, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof metadata !== "object" && metadata !== null) {
                metadata = { page: metadata };
            }
            else if (metadata === null) {
                metadata = {};
            }
            let page = 1;
            if (metadata.page) {
                page = metadata.page;
            }
            if (page === null) {
                return createPagedResults({ results: [] });
            }
            let pageAdder = `?page=${page}`;
            if (url.includes("?")) {
                pageAdder = `&page=${page}`;
            }
            const options = createRequestObject({
                url: url + pageAdder,
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            const data = this.parser.parseDirectory($, BASE);
            let newPage = page + 1;
            if (data.max >= newPage) {
                newPage = null;
            }
            metadata.page = newPage;
            return createPagedResults({
                results: data.data,
                metadata: metadata
            });
        });
    }
    getWebsiteMangaDirectory(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getPagedResults(`${BASE}/directory`, metadata);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: this.getMangaShareUrl(mangaId) + "/" + chapterId,
                method: 'GET',
                headers: this.header,
                cookies: [
                    createCookie({
                        name: "viewer",
                        value: "1",
                        domain: BASE,
                        path: "/",
                        created: new Date(),
                        expires: new Date(2147483647)
                    })
                ]
            });
            let response = yield this.requestManager.schedule(options, 1);
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                longStrip: false,
                pages: yield this.parser.parsePages(response.data)
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: this.getMangaShareUrl(mangaId),
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseChapterList($, mangaId, BASE);
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: this.getMangaShareUrl(mangaId),
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseManga($, mangaId);
        });
    }
    searchRequest(query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getPagedResults(`${BASE}/search?s=${query.title}`, metadata);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getPagedResults(`${BASE}/directory/${homepageSectionId}`, metadata);
        });
    }
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}`,
                method: 'GET',
                headers: this.header
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            const idList = [];
            let tiles = this.parser.parseLatestUpdates($, BASE, true);
            for (let i = 0; i < tiles.length; i++) {
                const tile = tiles[i];
                const parsedTime = this.parser.parseDateTime(((_a = tile.primaryText) === null || _a === void 0 ? void 0 : _a.text) || "");
                if (parsedTime && parsedTime > time && ids.includes(tile.id)) {
                    idList.push(tile.id);
                }
            }
            mangaUpdatesFoundCallback(createMangaUpdates({
                ids: idList
            }));
        });
    }
}
exports.SenManga = SenManga;

},{"./SenMangaParser":27,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenMangaParser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class SenMangaParser {
    constructor() {
        this.chapterRegex = /^(Chapter ([\d.]+|))(\s*-\s*|)(.+|)/i;
        this.pageRegex = /var imglist = \[(\S+)]/i;
    }
    parseLatestUpdates($, base, includeTimestampAsPrimaryText = false) {
        const tiles = [];
        $("div.mng").map((index, element) => {
            const link = $("a", element);
            const title = link.attr("title");
            const linkId = link.attr("href");
            if (title && linkId) {
                const tileObj = {
                    id: linkId.replace(base + "/", ""),
                    title: createIconText({
                        text: title
                    }),
                    image: $("img", element).first().attr("src") || ""
                };
                if (includeTimestampAsPrimaryText) {
                    tileObj.primaryText = createIconText({
                        text: $("time[datetime]").first().attr("datetime") || ""
                    });
                }
                tiles.push(createMangaTile(tileObj));
            }
        });
        return tiles;
    }
    parseDateTime(dateTimeString, returnVal = null) {
        if (dateTimeString) {
            return new Date(dateTimeString.replace(" ", "T") + "+00:00");
        }
        else {
            return returnVal;
        }
    }
    /**
     * Function to serve as callback to {@link parseMostPopular} and {@link parseNewSeries}.
     * @private Because it should not be used outside of this class.
     */
    static parseListingTiles($, element, tiles, base) {
        const link = $("a", element).first();
        const linkId = link.attr("href");
        const img = $("img", element).first();
        const name = img.attr("alt");
        if (name && linkId) {
            tiles.push(createMangaTile({
                id: linkId.replace(base + "/", ""),
                title: createIconText({
                    text: name
                }),
                image: img.attr("src") || ""
            }));
        }
    }
    parseMostPopular($, base) {
        const tiles = [];
        $("ul.most_popular li").map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        });
        return tiles;
    }
    parseNewSeries($, base) {
        const tiles = [];
        $("ul li", $("div.serieslist").last()).map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        });
        return tiles;
    }
    parseGlobalTagList($) {
        const tagList = [];
        $("ul[aria-labelledby] li").map((index, element) => {
            const text = $(element).text();
            if (text) {
                tagList.push(createTag({
                    id: text,
                    label: text
                }));
            }
        });
        return [createTagSection({
                id: "genres",
                label: "Genres",
                tags: tagList
            })];
    }
    parseDirectory($, base) {
        const tiles = [];
        const pageLinks = $("li.page-item a").toArray();
        const maxPage = Number($(pageLinks[pageLinks.length - 2]).text());
        $("div.upd").map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        });
        return {
            data: tiles,
            max: maxPage
        };
    }
    parseChapterList($, mangaId, base) {
        const chapters = [];
        $("ul.chapter-list li").map((index, element) => {
            const link = $("a", element).first();
            const linkId = link.attr("href");
            if (linkId) {
                const match = link.text().trim().match(this.chapterRegex);
                if (match) {
                    chapters.push(createChapter({
                        id: linkId.replace(`${base}/${mangaId}/`, ""),
                        chapNum: Number(match[2] || "0"),
                        name: match[4] || undefined,
                        time: this.parseDateTime($("time", element).attr("datetime") || ""),
                        mangaId: mangaId,
                        langCode: paperback_extensions_common_1.LanguageCode.JAPANESE,
                    }));
                }
            }
        });
        return chapters;
    }
    parseManga($, mangaId) {
        const tagList = [];
        let summary = $("div.summary").text();
        summary = summary.replaceAll(/\s+/g, " ").trim();
        const parts = [
            null,
            null,
            null,
            null // Views
        ];
        $("div.info .item").map((index, element) => {
            const label = $("strong", element).first().text().replace(":", "").toLowerCase();
            switch (true) {
                case /genre(\(s\)|s|)/.test(label):
                    parts[0] = element;
                    break;
                case /status(es|)/.test(label):
                    parts[1] = element;
                    break;
                case /author(\(s\)|s|)/.test(label):
                    parts[2] = element;
                    break;
                case /view(\(s\)|s|)/.test(label):
                    parts[3] = element;
                    break;
            }
        });
        if (parts[0]) {
            $("a", parts[0]).map(((index, element) => {
                if ("attribs" in element) {
                    const label = $(element).text();
                    tagList.push(createTag({
                        id: label.replaceAll(" ", "%20"),
                        label: label
                    }));
                }
            }));
        }
        const statusPart = $(parts[1]).first().children().remove().end().text().replace(/\s{2,}/, " ").trim().toLowerCase();
        let status;
        if (statusPart === "ongoing") {
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
        }
        else {
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
        }
        const rating = Number($("div#rating").attr("data-score") || "0");
        const mangaObj = {
            desc: summary,
            id: mangaId,
            image: $("div.cover img").attr("src") || "",
            rating: rating,
            avgRating: rating,
            status: status,
            titles: [$("h1.series").first().text()].concat($("div.alt-name").text().split(/\s*[,;]\s*/)),
            tags: [createTagSection({
                    id: "1",
                    label: "1",
                    tags: tagList
                })],
            langName: "Japanese",
            langFlag: "jp",
            lastUpdate: $("div.item time").first().text().trim()
        };
        if (parts[2]) {
            mangaObj.author = $("a", parts[2]).text();
        }
        if (parts[3]) {
            mangaObj.views = Number($(parts[3]).first().children().remove().end().text().replace(/\s{2,}/, " ").trim().toLowerCase());
        }
        return createManga(mangaObj);
    }
    parsePages(data) {
        const match = data.match(this.pageRegex);
        const pages = [];
        if (match) {
            const json = JSON.parse(`[${match[1]}]`);
            for (let i = 0; i < json.length; i++) {
                const item = json[i];
                pages.push(item.url);
            }
        }
        return pages;
    }
}
exports.SenMangaParser = SenMangaParser;

},{"paperback-extensions-common":4}]},{},[26])(26)
});
