import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile} from "paperback-extensions-common";

export class VoidScansParser {
    parseMangaList($: CheerioStatic, base: string) {
        const mangaTiles: MangaTile[] = [];
        $("div.col").map((index, element) => {
            const link = $("a.btn", element);
            const linkId = link.attr("href");
            if (linkId){
                mangaTiles.push(createMangaTile({
                    id: linkId.replace(`${base}/library/`, ""),
                    title: createIconText({
                        text: $("h2", element).text()
                    }),
                    image: $("img", element).attr("src") || "",
                    primaryText: createIconText({
                        text: $("p.card-text", element).text()
                    })
                }))
            }
        })
        return mangaTiles;
    }

    parseUpdatedManga($: CheerioStatic, base: string, dateToCheck: Date){
        const ids: string[] = [];
        $("div.col").map((index, element) => {
            const link = $("a.btn", element);
            const linkId = link.attr("href");
            if (linkId){
                const dateUpdated = $("small.text-muted").text();
                const parts = dateUpdated.split(" ");
                if (parts.length === 2){
                    const date = parts[0];
                    const dateParts = date.split("/");
                    let day = 0, month = 0, year = 0;
                    if (dateParts.length === 3){
                        year = Number(dateParts[0]);
                        month = Number(dateParts[1]) - 1;
                        day = Number(dateParts[2]);
                    }
                        const time = parts[1];
                        const timeParts = time.split("/");
                        let second = 0, minute = 0, hour = 0;
                        if (timeParts.length === 3){
                            hour = Number(timeParts[0])
                            minute = Number(timeParts[1])
                            second = Number(timeParts[2])
                            const dateObj = new Date(Date.UTC(year, month, day, hour, minute, second));
                            if (dateObj > dateToCheck){
                                ids.push(linkId.replace(`${base}/library/`, ""))
                            }
                        }
                }
            }
        })
        return ids;
    }

    parsePages($: CheerioStatic): string[] {
        const pages: string[] = [];

        $("#slideshow-container img").map((index, element) => {
            if (element.attribs["src"]){
                pages.push(element.attribs["src"])
            }
        })
        return pages;
    }

    parseChapterList($: CheerioStatic, mangaId: string) {
        const chapters: Chapter[] = [];
        $("ul.list-group").first().children().map((index, element) => {
            const link = $(element).first();
            const chapNum = Number(link.text().replace("Chapter ", ""));
            const data: Chapter = {
                chapNum: chapNum,
                id: String(chapNum),
                langCode: LanguageCode.ENGLISH,
                mangaId: mangaId,
            }
            chapters.push(createChapter(data))
        })
        return chapters
    }

    parseManga($: CheerioStatic, mangaId: string) {
        const mangaObj: Manga = {
            desc: $("p").first().text().trim(),
            id: mangaId,
            image: $("img#manga-img").attr("src") || "",
            rating: 0,
            status: MangaStatus.ONGOING,
            titles: [$("h1").first().text()],
        }
        return createManga(mangaObj)
    }

}