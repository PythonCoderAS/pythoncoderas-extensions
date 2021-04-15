import {
    Chapter,
    ChapterDetails,
    HomeSection,
    Manga, MangaTile, MangaUpdates,
    PagedResults,
    Request, RequestManager,
    SearchRequest,
    Source,
    SourceInfo,
} from "paperback-extensions-common"
import {RainOfSnowParser} from "./RainOfSnowParser";

const BASE = "https://rainofsnow.com"

export const RainOfSnowInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.3.3",
    name: "RainOfSnow",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from RainOfSnow",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class RainOfSnow extends Source {

    private readonly parser: RainOfSnowParser = new RainOfSnowParser();

    readonly requestManager: RequestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 10000
    });

    getMangaShareUrl(mangaId: string): string | null {
        return `${BASE}/comic/${mangaId}`;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        let tiles: MangaTile[] = this.parser.parseMangaList($, BASE, $($("div.row").toArray()[2]));
        sectionCallback(createHomeSection({
            id: "comics",
            items: tiles,
            title: "Popular Comics",
            view_more: true
        }));
    }

    async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        if (typeof metadata !== "object" && metadata !== null){
            metadata = {page: metadata};
        } else if (metadata === null){
            metadata = {};
        }
        let page = 1;
        if (metadata.page){
            page = metadata.page;
        }
        if (page === null){
            return createPagedResults({results: []});
        }
        const options: Request = createRequestObject({
            url: `${BASE}/comics/page/${page}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        let tiles: MangaTile[] = this.parser.parseMangaList($, BASE);
        let newPage: number | null = page + 1;
        if ($("a.next").length === 0){
            newPage = null;
        }
        metadata.page = newPage
        if (newPage === null){
            return createPagedResults({results: []});
        }
        return createPagedResults({
            results: tiles,
            metadata: metadata
        });
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const options: Request = createRequestObject({
            url: `${BASE}/${chapterId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return createChapterDetails({
            id: chapterId,
            longStrip: true,
            mangaId: mangaId,
            pages: this.parser.parsePages($)
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const options: Request = createRequestObject({
            url: `${BASE}/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseChapterList($, mangaId, BASE);
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const options: Request = createRequestObject({
            url: `${BASE}/comic/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseManga($, mangaId, BASE);
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let url = `${BASE}/`
        if (query.title){
            url += `?s=${query.title}`
        }
        const options: Request = createRequestObject({
            url: url,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return createPagedResults({
            results: this.parser.parseMangaList($, BASE)
        });
    }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        mangaUpdatesFoundCallback(createMangaUpdates({
            ids: ids
        }));
    }


    getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        return this.getWebsiteMangaDirectory(metadata);
    }
}