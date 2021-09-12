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
import {CatMangaParser} from "./CatMangaParser";

const BASE = "https://catmanga.org"

export const CatMangaInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.2.10",
    name: "CatManga",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from CatManga",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class CatManga extends Source {

    private readonly parser: CatMangaParser = new CatMangaParser();

    readonly requestManager: RequestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 10000
    });

    getMangaShareUrl(mangaId: string): string | null {
        return `${BASE}/series/${mangaId}`;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const $ = await this.getHomePageData()
        sectionCallback(createHomeSection({
            id: "all",
            items: (await this.getWebsiteMangaDirectory(null)).results,
            title: "All Manga"
        }));
    }

    async getHomePageData(): Promise<CheerioStatic> {
        const options: Request = createRequestObject({
            url: `${BASE}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        return this.cheerio.load(response.data);
    }

    async getWebsiteMangaDirectory(metadata: any): Promise<PagedResults> {
        return createPagedResults({
            results: this.parser.parseHomeTiles(await this.getHomePageData(), BASE)
        });
    }


    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const options: Request = createRequestObject({
            url: `${BASE}/series/${mangaId}/${chapterId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return createChapterDetails({
            id: chapterId,
            longStrip: true,
            mangaId: mangaId,
            pages: this.parser.parsePages($)
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const options: Request = createRequestObject({
            url: `${BASE}/series/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseChapterList($, mangaId);
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const options: Request = createRequestObject({
            url: `${BASE}/series/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseManga($, mangaId);
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        // TODO: Wait for search to be implemented on the website.
        const results = (await this.getWebsiteMangaDirectory(null)).results;

        let data: MangaTile[];
        if (query.title){
            const filterTitle = query.title.replace(/\+/g, " ").trim().toLowerCase();
            data = results.filter((key) => (key.title.text || "").toLowerCase().includes(filterTitle))
        } else {
            data = results;
        }

        console.log(data.length)
        return createPagedResults({
            results: data
        });
    }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        // TODO: Wait for upload times to be shown.
        /*
        const tiles: MangaTile[] = this.getLatest(await this.getHomePageData());
        const idsFound: string[] = [];
        for (let i = 0; i < tiles.length; i++) {
            const id = tiles[i].id;
            if (ids.includes(id)){
                idsFound.push(id)
            }
        }
        mangaUpdatesFoundCallback(createMangaUpdates({
            ids: idsFound
        }));
        */
    }
}
