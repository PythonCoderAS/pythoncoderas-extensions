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
exports.NovelCool = exports.NovelCoolInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NovelCoolParser_1 = require("./NovelCoolParser");
const BASE = "https://www.novelcool.com";
exports.NovelCoolInfo = {
    icon: "icon.png",
    version: "1.0.2",
    name: "NovelCool",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from NovelCool",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
};
class NovelCool extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new NovelCoolParser_1.NovelCoolParser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 10000
        });
    }
    getMangaShareUrl(mangaId) {
        return `${BASE}/novel/${mangaId}.html`;
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/search?name=awdasdsadsa`,
                method: 'GET'
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
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let carouselItems = this.parser.parseCarousel($, BASE);
            sectionCallback(createHomeSection({
                id: "carousel",
                title: "Popular",
                items: carouselItems
            }));
            const sections = this.parser.parseHomepage($, BASE);
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                sectionCallback(createHomeSection({
                    id: section.name.toLowerCase(),
                    title: section.name,
                    items: section.items,
                    view_more: true
                }));
            }
        });
    }
    doGetWebsiteMangaDirectory(page = 1, end = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/category/index_${page}.html`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let results = this.parser.parseMangaListingPage($, BASE);
            if (!end) {
                end = Number($("div.dis-inline-block.para-h8").first().text().trim());
                for (let i = 2; i <= end; i++) {
                    results = results.concat(yield this.doGetWebsiteMangaDirectory(i, end));
                }
            }
            return results;
        });
    }
    getWebsiteMangaDirectory(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return createPagedResults({
                results: yield this.doGetWebsiteMangaDirectory()
            });
        });
    }
    doGetPages(chapterId, page = 1, end = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/chapter/${chapterId}-10-${page}.html`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let pages = this.parser.parsePages($);
            if (end === null) {
                end = $("select.sl-page option").length;
                for (let i = 2; i < end; i++) {
                    pages = pages.concat(yield this.doGetPages(chapterId, page + 1, end));
                }
            }
            return pages;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                longStrip: false,
                pages: yield this.doGetPages(chapterId)
            });
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: this.getMangaShareUrl(mangaId),
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseChapterList($, mangaId, BASE, this.convertTime);
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: this.getMangaShareUrl(mangaId),
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            return this.parser.parseManga($, mangaId, BASE, this.convertTime);
        });
    }
    doSearchRequest(url, page = 1, end = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const original_url = url;
            url += `&page=${page}.html`;
            const options = createRequestObject({
                url: url,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            if ($("div.search-nores-hint").length !== 0) {
                return [];
            }
            else {
                let results = this.parser.parseMangaListingPage($, BASE);
                if (!end) {
                    end = Number($("div.dis-inline-block.para-h8").first().text().trim());
                    for (let i = 2; i <= end; i++) {
                        results = results.concat(yield this.doSearchRequest(original_url, i, end));
                    }
                }
                return results;
            }
        });
    }
    searchRequest(query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `${BASE}/search/?name_sel=contain`;
            if (query.title) {
                url += `&name=${query.title}`;
            }
            if (query.author) {
                url += `&author_sel=contain&author=${query.author}`;
            }
            return createPagedResults({
                results: yield this.doSearchRequest(url)
            });
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = createRequestObject({
                url: `${BASE}/category/${homepageSectionId}.html`,
                method: 'GET'
            });
            let response = yield this.requestManager.schedule(options, 1);
            let $ = this.cheerio.load(response.data);
            let results = this.parser.parseMangaListingPage($, BASE);
            return createPagedResults({
                results: results
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
}
exports.NovelCool = NovelCool;

},{"./NovelCoolParser":27,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovelCoolParser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class NovelCoolParser {
    constructor() {
        this.chapterRegex = /(Vol(ume|)(\.| |\. |)(\d+)|)( |)(Ch(apter|)(\.| |\. |)([\d.]+))((:| |: )([\S ]+)|)$/i;
        this.monthMap = new Map(Object.entries({
            "jan": 0,
            "feb": 1,
            "mar": 2,
            "apr": 3,
            "may": 4,
            "jun": 5,
            "jul": 6,
            "aug": 7,
            "sep": 8,
            "oct": 9,
            "nov": 10,
            "dec": 11
        }));
    }
    getHomepageTile($, element, base) {
        const link = $("a", element).first();
        let linkId = link.attr("href");
        if (linkId) {
            linkId = linkId.replace(`${base}/novel/`, "").replace(".html", "");
            return createMangaTile({
                id: linkId,
                image: $("img", link).attr("src") || "",
                title: createIconText({
                    text: $("div.book-name", element).first().text()
                })
            });
        }
        return null;
    }
    parseCarousel($, base) {
        const tiles = [];
        $("div.index-carousel div.book-item").map((index, element) => {
            const tile = this.getHomepageTile($, element, base);
            if (tile) {
                tiles.push(tile);
            }
        });
        return tiles;
    }
    parseHomepage($, base) {
        const sections = [];
        $("div.index-book-list").map((index, element) => {
            const name = $("div.index-book-list-title", element).first().children().remove().end().text().trim();
            const tiles = [];
            $("div.book-item", element).map((index1, element1) => {
                const tile = this.getHomepageTile($, element1, base);
                if (tile) {
                    tiles.push(tile);
                }
            });
            sections.push({
                name: name,
                items: tiles
            });
        });
        return sections;
    }
    parseGlobalTagList($) {
        const tagList = [];
        $("div.search-group").map((index, element) => {
            if (index > 1) {
                const name = $("div.category-list-title.style-trigger.pointer", element).first().text().replace(":", "");
                const tags = [];
                $("div.search-list-item", element).map((index1, element1) => {
                    const label = $(element1).text();
                    tags.push(createTag({
                        id: label,
                        label: label
                    }));
                });
                tagList.push(createTagSection({
                    id: name,
                    label: name,
                    tags: tags
                }));
            }
        });
        return tagList;
    }
    parseMangaListingPage($, base) {
        const tiles = [];
        $("div.book-list div.book-item").map((index, element) => {
            const tile = this.getHomepageTile($, element, base);
            if (tile) {
                tiles.push(tile);
            }
        });
        return tiles;
    }
    parseChapterList($, mangaId, base, convertTime) {
        const chapters = [];
        $("div.chapter-item-list a").map((index, element) => {
            const title = element.attribs["title"];
            const match = title.match(this.chapterRegex);
            let volume = null;
            let chapTitle = null;
            let chapterObj;
            if (match && match[9]) {
                if (match[4]) {
                    volume = Number(match[4]);
                }
                const chapter = Number(match[9]);
                if ((match[12] || "").trim()) {
                    chapTitle = match[12].trim();
                }
                const timeText = $("span.chapter-item-time", element).text();
                let time = null;
                if (timeText.toLowerCase().includes("ago")) {
                    time = convertTime(timeText);
                }
                else {
                    const parts = timeText.split(" ");
                    if (parts.length === 3) {
                        const month = this.monthMap.get(parts[0].toLowerCase());
                        if (month) {
                            const day = Number(parts[1].replace(",", ""));
                            const year = Number(parts[2]);
                            time = new Date(year, month, day);
                        }
                    }
                }
                chapterObj = {
                    chapNum: chapter,
                    id: element.attribs["href"].replace(`${base}/chapter/`, "").slice(0, -1),
                    langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                    mangaId: mangaId
                };
                if (volume) {
                    chapterObj.volume = volume;
                }
                if (chapTitle) {
                    chapterObj.name = chapTitle;
                }
                if (time) {
                    chapterObj.time = time;
                }
            }
            else {
                chapterObj = {
                    chapNum: 0,
                    id: element.attribs["href"].replace(`${base}/chapter/`, ""),
                    langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                    mangaId: mangaId,
                    name: title
                };
            }
            chapters.push(createChapter(chapterObj));
        });
        return chapters;
    }
    parseManga($, mangaId, base, convertTime) {
        const tagList = [];
        let summary = $("span[itemprop=\"description\"]").text();
        summary = summary.trim();
        $("span[itemprop=\"keywords\"] a").map(((index, element) => {
            if ("attribs" in element) {
                tagList.push(createTag({
                    id: element.attribs["href"].replace("/category/", "").replace(".html", ""),
                    label: ($(element).text())
                }));
            }
        }));
        const chapterList = this.parseChapterList($, mangaId, base, convertTime);
        const statusPart = $("a", $("div.bookinfo-category-list").toArray()[1]).first().text().toLowerCase();
        let status;
        if (statusPart === "ongoing") {
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
        }
        else {
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
        }
        const rating = Number($("span.bookinfo-rate-val").first().text());
        const statObj = $("div.bookinfo-refer-count-item");
        const mangaObj = {
            author: $("span[itemprop=\"creator\"]").first().text(),
            desc: summary,
            id: mangaId,
            image: $("img.bookinfo-pic-img").attr("src") || "",
            rating: rating,
            avgRating: rating,
            status: status,
            titles: [$("h1.bookinfo-title").first().text()],
            tags: [createTagSection({
                    id: "1",
                    label: "1",
                    tags: tagList
                })],
            views: Number(statObj.first().text()),
            follows: Number($(statObj.toArray()[1]).text()),
            langName: $("span[itemprop=\"inLanguage\"]").first().text(),
        };
        if (chapterList) {
            const chapterObj = chapterList[chapterList.length - 1];
            if (chapterObj.time) {
                mangaObj.lastUpdate = chapterObj.time.toString();
            }
        }
        return createManga(mangaObj);
    }
    parsePages($) {
        if ($("div.chapter-reading-section").length !== 0) {
            return ["https://cdn.discordapp.com/attachments/480523985151459329/827922569234612264/Error-1.png"];
        }
        else {
            const pages = [];
            $("img.manga_pic").map((index, element) => {
                pages.push(element.attribs["src"]);
            });
            return pages;
        }
    }
}
exports.NovelCoolParser = NovelCoolParser;

},{"paperback-extensions-common":4}]},{},[26])(26)
});
