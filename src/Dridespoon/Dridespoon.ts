import {
    Chapter,
    ChapterDetails,
    HomeSection,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
    MangaUpdates,
    PagedResults,
    Request,
    RequestManager,
    SearchRequest,
    Source,
    SourceInfo,
    TagType,
} from "paperback-extensions-common"
import {DridespoonParser} from "./DridespoonParser";

const BASE = "http://dridesp.ooo"

export const DridespoonInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.0.0",
    name: "Dridespoon",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from Dridespoon",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class Dridespoon extends Source {

    private readonly parser: DridespoonParser = new DridespoonParser();


    readonly requestManager: RequestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 10000
    });

    getMangaShareUrl(mangaId: string): string {
        return `${BASE}/n/${mangaId}`;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const options: Request = createRequestObject({
            url: `${BASE}/n/`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        sectionCallback(createHomeSection({
            id: "1",
            items: this.parser.parseMangaList($, BASE, "sfw"),
            title: "Involvements"
        }));
        sectionCallback(createHomeSection({
            id: "2",
            items: this.parser.parseMangaList($, BASE, "collapseOne"),
            title: "Past Involvements"
        }));
        sectionCallback(createHomeSection({
            id: "3",
            items: this.parser.parseMangaList($, BASE, "collapseThree"),
            title: "Finished Projects"
        }));
    }


    async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        const options: Request = createRequestObject({
            url: `${BASE}/n/`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return createPagedResults({
            results: this.parser.parseMangaList($, BASE, "main")
        })
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        let url = this.getMangaShareUrl(mangaId);
        if (chapterId !== "Paperback-iOS-sentinel-id"){
            url += "/" + chapterId
        }
        const options: Request = createRequestObject({
            url: url,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        const pages = this.parser.parsePages($, BASE)
        return createChapterDetails({
            id: chapterId,
            longStrip: false,
            mangaId: mangaId,
            pages: pages
        })
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const options: Request = createRequestObject({
            url: this.getMangaShareUrl(mangaId),
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        let parsedPages = this.parser.parsePages($, BASE);
        if (parsedPages.length !== 0) {
            return [createChapter({
                chapNum: 1,
                id: "Paperback-iOS-sentinel-id",
                langCode: LanguageCode.ENGLISH,
                mangaId: mangaId
            })]
        } else {
            return this.parser.parseChapterList($, mangaId);
        }
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const options: Request = createRequestObject({
            url: this.getMangaShareUrl(mangaId),
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        let parsedPages = this.parser.parsePages($, BASE);
        if (parsedPages.length !== 0){
            return createManga({
                id: mangaId,
                image: parsedPages[0],
                rating: 0,
                status: MangaStatus.COMPLETED,
                titles: [mangaId]
            })
        } else {
            return this.parser.parseManga($, mangaId, BASE);
        }
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        // TODO: Wait for search to be implemented on the website.
        const results = (await this.getWebsiteMangaDirectory(null)).results;
        const data: MangaTile[] = [];
        for (let i = 0; i < results.length; i++) {
            const key = results[i];
            if (query.title) {
                if ((key.title.text || "").toLowerCase().includes((query.title.toLowerCase()))) {
                    data.push(key);
                }
            }
        }
        return createPagedResults({
            results: data
        });
    }


    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        mangaUpdatesFoundCallback(createMangaUpdates({ids: ids}));
    }
}