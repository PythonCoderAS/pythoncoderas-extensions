import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile} from "paperback-extensions-common";

export class DridespoonParser {

    pageRegex = /src:"(https:\/\/beta\.voidscans\.net\/[^\s"']+)"/g

    parseMangaList($: CheerioStatic, base: string, id: string) {
        const mangaTiles: MangaTile[] = [];
        $(`#${id} div.col-md-4.picture-item:not(.manga-card)`).map((index, element) => {
            const link = $("a", $("li.list-group-item", element).last());
            let linkId = link.attr("href");
            if (!linkId){
                const link2 = $("a", element).first().attr("href")
                if (link2 && link2.match(/\/$/)){
                    // Exception for manga where there are no chapters but the manga itself is the chapter.
                    linkId = link2;
                }
            }
            if (linkId){
                mangaTiles.push(createMangaTile({
                    id: linkId.replace(`/n/`, "").replace("/", ""),
                    title: createIconText({
                        text: $("p", element).first().text().trim().replaceAll(/\s{2,}/g, "")
                    }),
                    image: `${base}/${($("img", element).first().attr("src") || "").replace(/^\//, "")}`
                }))
            }
        })
        return mangaTiles;
    }

    parsePages($: CheerioStatic, base: string): string[] {
        const pages: string[] = [];
        $("img[data-src]").map((index, element) => {
            pages.push(element.attribs["data-src"].replace("/../..", base))
        })
        return pages;
    }

    parseChapterList($: CheerioStatic, mangaId: string) {
        const chapters: Chapter[] = [];
        $("table[data-sort-name] tbody tr").map((index, element) => {
            const chapNum = Number($("th", element).first().text());
            const data: Chapter = {
                chapNum: chapNum,
                id: String(chapNum),
                langCode: LanguageCode.ENGLISH,
                mangaId: mangaId,
                time: new Date($("td", element).last().text()),
                name: $("td", element).first().text()
            }
            chapters.push(createChapter(data))
        })
        return chapters
    }

    parseManga($: CheerioStatic, mangaId: string, base: string) {
        const mangaObj: Manga = {
            desc: $("p#series_desc").first().text().trim(),
            id: mangaId,
            image: base + ($("img").attr("src") || ""),
            rating: 0,
            status: MangaStatus.ONGOING,
            titles: [$("h1").first().text()],
        }
        return createManga(mangaObj)
    }

}