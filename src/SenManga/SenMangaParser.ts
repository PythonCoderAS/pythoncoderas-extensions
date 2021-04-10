import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile, Tag} from "paperback-extensions-common";

interface PageData {
    max: number,
    data: MangaTile[]
}

interface Page {
    url: string,
    type: string
}

export class SenMangaParser {

    private readonly chapterRegex = /^(Chapter ([\d.]+|))(\s*-\s*|)(.+|)/i
    private readonly pageRegex = /var imglist = \[(\S+)]/i


    parseLatestUpdates($: CheerioStatic, base: string, includeTimestampAsPrimaryText: boolean = false){
        const tiles: MangaTile[] = [];
        $("div.mng").map((index, element) => {
            const link = $("a", element);
            const title = link.attr("title");
            const linkId = link.attr("href");
            if (title && linkId){
                const tileObj: MangaTile = {
                    id: linkId.replace(base + "/", ""),
                    title: createIconText({
                        text: title
                    }),
                    image: $("img", element).first().attr("src") || ""
                }
                if (includeTimestampAsPrimaryText){
                    tileObj.primaryText = createIconText({
                        text: $("time[datetime]").first().attr("datetime") || ""
                    })
                }
                tiles.push(createMangaTile(tileObj));
            }
        })
        return tiles;
    }

    parseDateTime(dateTimeString: string, returnVal: any = null){
        if (dateTimeString){
            return new Date(dateTimeString.replace(" ", "T")+"+00:00")
        } else {
            return returnVal;
        }
    }

    /**
     * Function to serve as callback to {@link parseMostPopular} and {@link parseNewSeries}.
     * @private Because it should not be used outside of this class.
     */
    private static parseListingTiles($: CheerioStatic, element: CheerioElement, tiles: MangaTile[], base: string){
        const link = $("a", element).first();
        const linkId = link.attr("href")
        const img = $("img", element).first();
        const name = img.attr("alt");
        if (name && linkId){
            tiles.push(createMangaTile({
                id: linkId.replace(base + "/", ""),
                title: createIconText({
                    text: name
                }),
                image: img.attr("src") || ""
            }));
        }
    }

    parseMostPopular($: CheerioStatic, base: string){
        const tiles: MangaTile[] = [];
        $("ul.most_popular li").map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        })
        return tiles;
    }

    parseNewSeries($: CheerioStatic, base: string){
        const tiles: MangaTile[] = [];
        $("ul li", $("div.serieslist").last()).map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        })
        return tiles;
    }

    parseGlobalTagList($: CheerioStatic){
        const tagList: Tag[] = [];
        $("ul[aria-labelledby] li").map((index, element) => {
            const text = $(element).text();
            if (text){
                tagList.push(createTag({
                    id: text,
                    label: text
                }))
            }
        })
        return [createTagSection({
            id: "genres",
            label: "Genres",
            tags: tagList
        })];
    }

    parseDirectory($: CheerioStatic, base: string): PageData{
        const tiles: MangaTile[] = [];
        const pageLinks = $("li.page-item a").toArray();
        const maxPage = Number($(pageLinks[pageLinks.length - 2]).text())
        $("div.upd").map((index, element) => {
            SenMangaParser.parseListingTiles($, element, tiles, base);
        })
        return {
            data: tiles,
            max: maxPage
        };
    }

    parseChapterList($: CheerioStatic, mangaId: string, base: string) {
        const chapters: Chapter[] = [];
        $("ul.chapter-list li").map((index, element) => {
            const link = $("a", element).first()
            const linkId = link.attr("href")
            if (linkId){
                const match = link.text().trim().match(this.chapterRegex);
                if (match){
                chapters.push(createChapter({
                    id: linkId.replace(`${base}/${mangaId}/`, ""),
                    chapNum: Number(match[2] || "0"),
                    name: match[4] || undefined,
                    time: this.parseDateTime($("time", element).attr("datetime") || ""),
                    mangaId: mangaId,
                    langCode: LanguageCode.JAPANESE,
                }))
                }
            }
        })
        return chapters
    }

    parseManga($: CheerioStatic, mangaId: string) {
        const tagList: Tag[] = [];
        let summary: string = $("div.summary").text();
        summary = summary.replaceAll(/\s+/g, " ").trim();
        const parts: (CheerioElement|null)[] = [
            null, // Genres
            null, // Status
            null, // Author
            null // Views
        ]
        $("div.info .item").map((index, element) => {
            const label = $("strong", element).first().text().replace(":", "").toLowerCase();
            switch (true) {
                case /genre(\(s\)|s|)/.test(label): parts[0] = element; break;
                case /status(es|)/.test(label): parts[1] = element; break;
                case /author(\(s\)|s|)/.test(label): parts[2] = element; break;
                case /view(\(s\)|s|)/.test(label): parts[3] = element; break;
            }
        })
        if (parts[0]){
        $("a", parts[0]).map(((index, element) => {
            if ("attribs" in element) {
                const label = $(element).text()
                tagList.push(createTag({
                    id: label.replaceAll(" ", "%20"),
                    label: label
                }))
            }
        }))
        }
        const statusPart = $(parts[1]).first().children().remove().end().text().replace(/\s{2,}/, " ").trim().toLowerCase();
        let status: MangaStatus;
        if (statusPart === "ongoing"){
            status = MangaStatus.ONGOING;
        } else {
            status = MangaStatus.COMPLETED;
        }
        const rating = Number($("div#rating").attr("data-score") || "0")
        const mangaObj: Manga = {
            desc: summary,
            id: mangaId,
            image: $("div.cover img").attr("src") || "",
            rating: rating,
            avgRating: rating,
            status: status,
            titles: [$("h1.series").first().text()].concat($("div.alt-name").text().split(/\s*[,;]\s*/)),
            tags: [createTagSection({
                id: "1",
                label: "1",
                tags: tagList
            })],
            langName: "Japanese",
            langFlag: "jp",
            lastUpdate: $("div.item time").first().text().trim()
        }
        if (parts[2]){
            mangaObj.author = $("a", parts[2]).text()
        }
        if (parts[3]){
            mangaObj.views = Number($(parts[3]).first().children().remove().end().text().replace(/\s{2,}/, " ").trim().toLowerCase())
        }
        return createManga(mangaObj);
    }

    parsePages(data: string){
        const match = data.match(this.pageRegex);
        const pages = [];
        if (match){
            const json: Page[] = JSON.parse(`[${match[1]}]`)
            for (let i = 0; i < json.length; i++) {
                const item = json[i];
                pages.push(item.url);
            }
        }
        return pages;
    }
}