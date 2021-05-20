/**
 * This is <b>not</b> a dedicated Guya.moe template repo. However, I feel that it is pointless to introduce yet another
 * repository for what is essentially 2-3 sources.
 */

import {
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    LanguageCode,
    MangaStatus,
    MangaUpdates,
    PagedResults,
} from "paperback-extensions-common"

const SPLIT_VAR = "|"

export abstract class GuyaTemplate extends Source {
    readonly abstract baseUrl: string;
    async getMangaDetails(mangaId: string): Promise<Manga> {

        let request = createRequestObject({
            metadata: { mangaId },
            url: `${this.baseUrl}/api/get_all_series/`,
            method: "GET",
        })

        let response = await this.requestManager.schedule(request, 1)

        let result = typeof response.data === "string" ? JSON.parse(response.data) : response.data

        let mangas = []
        for (let series in result) {
            let seriesDetails = result[series]
            if (mangaId.includes(seriesDetails["slug"])) {
                mangas.push(
                    createManga({
                        id: seriesDetails["slug"],
                        titles: [series],
                        image: `${this.baseUrl}/${seriesDetails["cover"]}`,
                        rating: 5,
                        status: MangaStatus.ONGOING,
                        artist: seriesDetails["artist"],
                        author: seriesDetails["author"],
                        desc: seriesDetails["description"],
                    })
                )
            }
        }

        return mangas[0]
    }


    async getChapters(mangaId: string): Promise<Chapter[]> {
        let request = createRequestObject({
            metadata: { mangaId },
            url: `${this.baseUrl}/api/series/${mangaId}/`,
            method: "GET",
        })

        let response = await this.requestManager.schedule(request, 1)

        let result = typeof response.data === "string" ? JSON.parse(response.data) : response.data
        let rawChapters = result["chapters"]
        let groupMap = result["groups"]

        let chapters = []
        for (let chapter in rawChapters) {
            let chapterMetadata = rawChapters[chapter]
            for (let group in chapterMetadata["groups"]) {
                chapters.push(
                    createChapter({
                        id: `${chapter}${SPLIT_VAR}${group}`,
                        mangaId: mangaId,
                        chapNum: Number(chapter),
                        langCode: LanguageCode.ENGLISH,
                        name: chapterMetadata["title"],
                        volume: chapterMetadata["volume"],
                        group: groupMap[group],
                        time: new Date(
                            Number(chapterMetadata["release_date"][group]) * 1000
                        ),
                    })
                )
            }
        }
        return chapters
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

        const request = createRequestObject({
            url: `${this.baseUrl}/api/series/${mangaId}/`,
            method: "GET",
        })

        const data = await this.requestManager.schedule(request, 1)

        let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data
        let rawChapters = result["chapters"]
        let [chapter, group] = chapterId.split(SPLIT_VAR)
        return createChapterDetails({
            id: chapterId,
            longStrip: false,
            mangaId: mangaId,
            pages: rawChapters[chapter]["groups"][group].map(
                (page: string) =>
                    `${this.baseUrl}/media/manga/${mangaId}/chapters/${rawChapters[chapter]["folder"]}/${group}/${page}`
            ),
        })
    }

    async searchRequest(searchQuery: SearchRequest, metadata: any): Promise<PagedResults> {

        const request = createRequestObject({
            url: `${this.baseUrl}/api/get_all_series/`,
            method: "GET",
        })

        const data = await this.requestManager.schedule(request, 1)

        let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data
        let query = searchQuery.title ?? ''
        if (query){
            query = query.replace(/\+/g, " ").trim();
        }
        let filteredResults = Object.keys(result).filter((e) =>
            e.toLowerCase().includes(query.toLowerCase())
        )

        let tiles = filteredResults.map((series) => {
            let seriesMetadata = result[series]
            return createMangaTile({
                id: seriesMetadata["slug"],
                image: `${this.baseUrl}/${seriesMetadata["cover"]}`,
                title: createIconText({ text: series }),
            })
        })

        return createPagedResults({
            results: tiles
        })
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {

        // Send the empty homesection back so the app can preload the section
        var homeSection = createHomeSection({ id: "all", title: "ALL MANGAS" })
        sectionCallback(homeSection)

        const request = createRequestObject({
            url: `${this.baseUrl}/api/get_all_series/`,
            method: "GET"
        })

        const data = await this.requestManager.schedule(request, 1)

        let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

        let mangas = []
        for (let series in result) {
            let seriesDetails = result[series]
            mangas.push(
                createMangaTile({
                    id: seriesDetails["slug"],
                    image: `${this.baseUrl}/${seriesDetails["cover"]}`,
                    title: createIconText({ text: series }),
                })
            )
        }
        homeSection.items = mangas

        sectionCallback(homeSection)
    }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {

        const request = createRequestObject({
            url: `${this.baseUrl}/api/get_all_series/`,
            method: "GET"
        })

        const data = await this.requestManager.schedule(request, 1)

        let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

        let foundIds: string[] = []

        for (let series in result) {
            const seriesDetails = result[series]
            const seriesUpdated = new Date(seriesDetails["last_updated"] * 1000)
            const id = seriesDetails["slug"];
            if (seriesUpdated >= time && ids.includes(id)) {
                foundIds.push(id);
            }
        }
        mangaUpdatesFoundCallback(createMangaUpdates({ ids: foundIds }))
    }

    getMangaShareUrl(mangaId: string) {
        return `${this.baseUrl}/read/manga/${mangaId}/`
    }
}