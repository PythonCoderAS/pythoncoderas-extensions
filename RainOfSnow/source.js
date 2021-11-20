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
exports.RainOfSnow = exports.RainOfSnowInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const RainOfSnowParser_1 = require("./RainOfSnowParser");
const BASE = "https://rainofsnow.com";
exports.RainOfSnowInfo = {
    icon: "icon.png",
    version: "1.4.2",
    name: "RainOfSnow",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from RainOfSnow",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE,
    sourceTags: [
        {
            text: "Deprecated - Will Not Be Updated",
            type: paperback_extensions_common_1.TagType.RED
        }
    ]
};
class RainOfSnow extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new RainOfSnowParser_1.RainOfSnowParser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 10000
        });
    }
    getMangaShareUrl(mangaId) {
        return `${BASE}/comic/${mangaId}`;
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let tiles = this.parser.parseMangaList($, BASE, $($("div.row").toArray()[2]));
            sectionCallback(createHomeSection({
                id: "comics",
                items: tiles,
                title: "Popular Comics",
                view_more: true
            }));
        });
    }
    getWebsiteMangaDirectory(metadata) {
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
            const options = createRequestObject({
                url: `${BASE}/comics/page/${page}`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let tiles = this.parser.parseMangaList($, BASE);
            let newPage = page + 1;
            if ($("a.next").length === 0) {
                newPage = null;
            }
            metadata.page = newPage;
            if (newPage === null) {
                return createPagedResults({ results: [] });
            }
            return createPagedResults({
                results: tiles,
                metadata: metadata
            });
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/${chapterId}`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let more = true;
            let pages = this.parser.parsePages($, $("div.bb-item[style=\"display: block;\"]").first().toArray()[0]);
            let more_data = this.parser.parseMoreData($);
            let offset;
            if (!more_data) {
                more = false;
            }
            else {
                offset = more_data.offset;
            }
            while (more) {
                const ajax = createRequestObject({
                    url: `${BASE}/wp-admin/admin-ajax.php`,
                    method: 'POST',
                    data: Object.entries(this.urlEncodeObject({
                        action: "my_repeater_show_more",
                        post_id: Number(more_data === null || more_data === void 0 ? void 0 : more_data.post_id),
                        offset: Number(offset),
                        nonce: more_data === null || more_data === void 0 ? void 0 : more_data.nonce
                    })).map(e => e.join('=')).join('&')
                    // This is important because otherwise it gives me a 400, and I don't know why
                });
                let ajaxResponse = yield this.requestManager.schedule(ajax, 1);
                let ajaxData = typeof ajaxResponse.data === "string" ? JSON.parse(ajaxResponse.data) : ajaxResponse.data;
                let $ajax = this.cheerio.load(ajaxData.content);
                pages = pages.concat(this.parser.parsePages($ajax, $ajax.root().toArray()[0]));
                more = ajaxData.more;
                offset = ajaxData.offset;
            }
            return createChapterDetails({
                id: chapterId,
                longStrip: true,
                mangaId: mangaId,
                pages: pages
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/${mangaId}`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseChapterList($, mangaId, BASE);
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/comic/${mangaId}`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseManga($, mangaId, BASE);
        });
    }
    searchRequest(query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `${BASE}/`;
            if (query.title) {
                url += `?s=${query.title}`;
            }
            const options = createRequestObject({
                url: url,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return createPagedResults({
                results: this.parser.parseMangaList($, BASE)
            });
        });
    }
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            mangaUpdatesFoundCallback(createMangaUpdates({
                ids: ids
            }));
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        return this.getWebsiteMangaDirectory(metadata);
    }
}
exports.RainOfSnow = RainOfSnow;

},{"./RainOfSnowParser":27,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RainOfSnowParser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class RainOfSnowParser {
    decodeHTMLEntity(str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }
    parseMangaList($, base, filterElement = null) {
        if (filterElement === null) {
            filterElement = $.root();
        }
        const mangaTiles = [];
        $("div.col-xs-6.col-md-3.col-lg-2", filterElement).map(((index, element) => {
            const link = $("h3 a", element).first();
            const linkId = link.attr("href");
            const imgSrc = $("a img", element).first().attr("src");
            if (linkId && linkId.includes("comic")) {
                mangaTiles.push(createMangaTile({
                    id: linkId.replace(`${base}/comic/`, "").slice(0, -1),
                    image: imgSrc || "",
                    title: createIconText({
                        text: link.text()
                    })
                }));
            }
        }));
        return mangaTiles;
    }
    static repeater_field_regex(field_name) {
        return new RegExp(`(var|let|const) my_repeater_field_${field_name}\\s*=\\s*["'\`]?([^"'\`\\n;]+)["'\`]?`, "i");
    }
    parseMoreData($) {
        const data = $("div.bb-item[style=\"display: block;\"] script").first().html();
        if (data) {
            const post_id = data.match(RainOfSnowParser.repeater_field_regex("post_id"));
            const offset = data.match(RainOfSnowParser.repeater_field_regex("offset"));
            const nonce = data.match(RainOfSnowParser.repeater_field_regex("nonce"));
            if (post_id && offset && nonce) {
                return {
                    post_id: post_id[2],
                    offset: offset[2],
                    nonce: nonce[2]
                };
            }
        }
        return null;
    }
    parsePages($, element) {
        const pages = [];
        $("img", element).map((index, element1) => {
            if ("attribs" in element1 && element1.attribs["data-src"]) {
                pages.push(element1.attribs["data-src"]);
            }
        });
        return pages;
    }
    parseChapterList($, mangaId, base) {
        const chapters = [];
        $("div#chapter li").map((index, element) => {
            const link = $("a", element).first();
            const linkId = link.attr("href");
            if (linkId) {
                const chapParts = link.text().split(".");
                chapters.push(createChapter({
                    chapNum: Number(chapParts[0]),
                    id: linkId.replace(base + "/comic_chapters/", ""),
                    langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                    mangaId: mangaId,
                    time: new Date($("small", element).first().text()),
                    name: chapParts[1] || undefined
                }));
            }
        });
        return chapters;
    }
    static titleCaseString(str) {
        return str.toLowerCase().split(' ').map(function (word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }
    parseManga($, mangaId, base) {
        const tagList = [];
        const summary = $("div#synop").text().replace(/\s{2,}/, "").trim();
        $("a[rel=\"tag\"]", $("ul.vbtcolor1").first()).map(((index, element) => {
            if ("attribs" in element) {
                tagList.push(createTag({
                    id: element.attribs["href"].replace(`${base}/tag/`, "").slice(0, -1),
                    label: RainOfSnowParser.titleCaseString($(element).text())
                }));
            }
        }));
        const chapterList = this.parseChapterList($, mangaId, base);
        const mangaObj = {
            author: this.decodeHTMLEntity($("small", $("ul.vbtcolor1 li").first()).text().trim()),
            desc: summary,
            id: mangaId,
            image: $("img", $("div.container div.row").first()).first().attr("src") || "",
            rating: 0,
            status: paperback_extensions_common_1.MangaStatus.ONGOING,
            titles: [this.decodeHTMLEntity($("div.text h2").first().text())],
            tags: [createTagSection({
                    id: "1",
                    label: "1",
                    tags: tagList
                })]
        };
        if (chapterList) {
            const chapterObj = chapterList[chapterList.length - 1];
            if (chapterObj.time) {
                mangaObj.lastUpdate = chapterObj.time.toString();
            }
        }
        return createManga(mangaObj);
    }
    parseSearchResult($, base) {
        const children = $("ul.boxhover1 li");
        if (children.length === 0) {
            return [];
        }
        else {
            return this.parseMangaList($, base);
        }
    }
}
exports.RainOfSnowParser = RainOfSnowParser;

},{"paperback-extensions-common":4}]},{},[26])(26)
});
