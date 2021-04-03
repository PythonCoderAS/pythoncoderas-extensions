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
                        text: ""
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

    parsePage($: CheerioStatic): string | null {
        return $("img").attr("src") || null;
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