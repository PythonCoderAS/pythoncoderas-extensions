import {
    Chapter,
    ChapterDetails,
    HomeSection,
    Manga,
    MangaUpdates,
    PagedResults,
    Request, RequestHeaders, RequestManager,
    SearchRequest,
    Source,
    SourceInfo,
    TagSection,
} from "paperback-extensions-common"
import {SenMangaParser} from "./SenMangaParser";

const BASE = "https://raw.senmanga.com"

export const SenMangaInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.0.0",
    name: "SenManga",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from SenManga",
    language: "jp",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class SenManga extends Source {

    private readonly parser: SenMangaParser = new SenMangaParser();

    private readonly header: RequestHeaders = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
    }

    readonly requestManager: RequestManager = createRequestManager({
        requestTimeout: 15000,
        requestsPerSecond: 4
    });

    globalRequestHeaders(): RequestHeaders {
        return this.header;
    }

    getMangaShareUrl(mangaId: string): string {
        return `${BASE}/${mangaId}`;
    }

    async getTags(): Promise<TagSection[]> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseGlobalTagList($);
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
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
    }

    private async getPagedResults(url: string, metadata: { page?: number | null, [key: string]: any }){
        if (typeof metadata !== "object"){
            metadata = {page: metadata}
        }
        let page = 1;
        if (metadata.page){
            page = metadata.page;
        }
        if (page === null){
            return createPagedResults({results: []});
        }
        let pageAdder = `?page=${page}`;
        if (url.includes("?")){
            pageAdder = `&page=${page}`;
        }
        const options: Request = createRequestObject({
            url: url+pageAdder,
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        const data = this.parser.parseDirectory($, BASE);
        let newPage: number | null = page + 1;
        if (data.max >= newPage){
            newPage = null;
        }
        metadata.page = newPage;
        return createPagedResults({
            results: data.data
        });
    }

    async getWebsiteMangaDirectory(metadata: { page?: number | null, [key: string]: any }): Promise<PagedResults> {
        return await this.getPagedResults(`${BASE}/directory`, metadata)
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const options: Request = createRequestObject({
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
        let response = await this.requestManager.schedule(options, 1);
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            longStrip: false,
            pages: await this.parser.parsePages(response.data)
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const options: Request = createRequestObject({
            url: this.getMangaShareUrl(mangaId),
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseChapterList($, mangaId, BASE);
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const options: Request = createRequestObject({
            url: this.getMangaShareUrl(mangaId),
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseManga($, mangaId);
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        return await this.getPagedResults(`${BASE}/search?s=${query.title}`, metadata);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return await this.getPagedResults(`${BASE}/directory/${homepageSectionId}`, metadata);
    }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET',
            headers: this.header
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        const idList: string[] = [];
        let tiles = this.parser.parseLatestUpdates($, BASE, true);
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const parsedTime = this.parser.parseDateTime(tile.primaryText?.text || "")
            if (parsedTime && parsedTime > time && ids.includes(tile.id)){
                idList.push(tile.id);
            }
        }
        mangaUpdatesFoundCallback(createMangaUpdates({
            ids: idList
        }));
    }
}