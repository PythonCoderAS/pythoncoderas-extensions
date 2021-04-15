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
import {VoidScansParser} from "./VoidScansParser";

const BASE = "https://voidscans.net"

export const VoidScansInfo: SourceInfo = {
    icon: "icon.svg",
    version: "1.3.2",
    name: "VoidScans",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from VoidScans",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class VoidScans extends Source {

    private readonly parser: VoidScansParser = new VoidScansParser();


    readonly requestManager: RequestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 10000
    });

    getMangaShareUrl(mangaId: string): string | null {
        return `${BASE}/library/${mangaId}`;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        sectionCallback(createHomeSection({
            id: "1",
            items: (await this.getWebsiteMangaDirectory(null)).results,
            title: "All Manga"
        }));
    }

    async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        const options: Request = createRequestObject({
            url: `${BASE}/library`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return createPagedResults({
            results: this.parser.parseMangaList($, BASE)
        });
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const options: Request = createRequestObject({
            url: `${BASE}/read/${mangaId}/${chapterId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        const pages = this.parser.parsePages($)
        return createChapterDetails({
            id: chapterId,
            longStrip: true,
            mangaId: mangaId,
            pages: pages
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const options: Request = createRequestObject({
            url: `${BASE}/library/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseChapterList($, mangaId);
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const options: Request = createRequestObject({
            url: `${BASE}/library/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseManga($, mangaId);
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        // TODO: Wait for search to be implemented on the website.
        const results = (await this.getWebsiteMangaDirectory(null)).results;
        const data: MangaTile[] = [];
        for (let i = 0; i < results.length; i++) {
            const key = results[i];
            if (query.title) {
                if ((key.primaryText?.text || "").toLowerCase().includes((query.title.toLowerCase()))) {
                    data.push(key);
                }
            }
        }
        return createPagedResults({
            results: data
        });
    }


    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        mangaUpdatesFoundCallback(createMangaUpdates({
            ids: this.parser.parseUpdatedManga($, BASE, time)
        }));
    }
}