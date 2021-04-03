import {
    Chapter,
    ChapterDetails,
    HomeSection,
    Manga, MangaTile,
    PagedResults,
    Request,
    SearchRequest,
    Source,
    SourceInfo,
} from "paperback-extensions-common"
import {VoidScansParser} from "./VoidScansParser";

const BASE = "https://voidscans.net"

export const VoidScansInfo: SourceInfo = {
    icon: "",
    version: "1.2.0",
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

    async getChapterPage(mangaId: string, chapterId: string, page: number = 1): Promise<string | null>{
        const options: Request = createRequestObject({
            url: `${BASE}/read/${mangaId}/${chapterId}/${page}`,
            method: 'GET'
        });
        let response = await this.requestManager.schedule(options, 1);
        let $ = this.cheerio.load(response.data);
        return this.parser.parsePage($)
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const pages: string[] = [];
        let page = await this.getChapterPage(mangaId, chapterId);
        let num = 2;
        while (page && !pages.includes(page)){
            pages.push(page)
            page = await this.getChapterPage(mangaId, chapterId, num);
            num++;
        }
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
}