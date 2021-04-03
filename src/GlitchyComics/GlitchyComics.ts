import {
    Chapter,
    ChapterDetails,
    HomeSection,
    Manga, MangaUpdates,
    PagedResults,
    Request,
    SearchRequest,
    Source,
    SourceInfo,
} from "paperback-extensions-common"
import {GlitchyComicsParser} from "./GlitchyComicsParser";

const BASE = "https://glitchycomics.com"

export const GlitchyComicsInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.1.1",
    name: "GlitchyComics",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from GlitchyComics",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class GlitchyComics extends Source {

    private readonly parser: GlitchyComicsParser = new GlitchyComicsParser();

    getMangaShareUrl(mangaId: string): string | null {
        return `${BASE}/${mangaId}`;
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
            url: `${BASE}/series-list`,
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
            url: `${BASE}/${mangaId}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parseManga($, mangaId, BASE);
    }

    async doSearch(query: SearchRequest, page: number | null = null){
        let url = `${BASE}`
        if (page !== null){
            url += `/page/${page}`;
        }
        if (query.title) {
            url += `/?s=${query.title}`
        }
        const options: Request = createRequestObject({
            url: url,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        let tiles = this.parser.parseSearchResult($, BASE);
        if ($("a.next").length !== 0){
            tiles = tiles.concat(await this.doSearch(query, (page || 1)+1));
        }
        return tiles;
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        return createPagedResults({
            results: await this.doSearch(query)
        });
    }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        mangaUpdatesFoundCallback(createMangaUpdates({
            ids: ids
        }));
    }
}