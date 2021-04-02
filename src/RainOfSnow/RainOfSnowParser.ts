import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile, Tag} from "paperback-extensions-common";

export class RainOfSnowParser {

    parseMangaList($: CheerioStatic, base: string) {
        const mangaTiles: MangaTile[] = [];
        $("ul.boxhover1 li").map(((index, element) => {
            const link = $("h4 a", element).first();
            const linkId = link.attr("href");
            const imgSrc = $("a img", element).first().attr("src");
            if (linkId) {
                mangaTiles.push(createMangaTile({
                    id: linkId.replace(`${base}/comic/`, "").slice(0, -1),
                    image: imgSrc || "",
                    title: createIconText({
                        text: link.text()
                    })
                }))
            }
        }))
        return mangaTiles;
    }

    parsePages($: CheerioStatic) {
        const pages: string[] = [];
        $("div.bb-item[style=\"display: block;\"] img").map((index, element) => {
            if ("attribs" in element && element.attribs["src"]){
                pages.push(element.attribs["src"])
            }
        });
        return pages;
    }

    parseChapterList($: CheerioStatic, mangaId: string, base: string) {
        const chapters: Chapter[] = [];
        $("ul.chapter1 li").map((index, element) => {
            const link = $("a", element).first();
            const linkId = link.attr("href");
            if (linkId) {
                chapters.push(createChapter({
                    chapNum: Number(link.text().split(".")[0]),
                    id: linkId.replace(base + "/comic_chapters/", ""),
                    langCode: LanguageCode.ENGLISH,
                    mangaId: mangaId,
                    time: new Date($("small", element).first().text()),
                }))
            }
        })
        return chapters
    }

    static titleCaseString(str: string): string {
        return str.toLowerCase().split(' ').map(function (word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }

    parseManga($: CheerioStatic, mangaId: string, base: string) {
        const items = $("ul.rat1 li");
        const tagList: Tag[] = [];
        let summary: string = ""
        $("div.summery div.text p").map(((index, element) => {
            summary += $(element).text() + "\n"
        }))
        summary = summary.trim();
        $("a[rel=\"tag\"]", items).map(((index, element) => {
            if ("attribs" in element) {
                tagList.push(createTag({
                    id: element.attribs["href"].replace(`${base}/tag/`, "").slice(0, -1),
                    label: RainOfSnowParser.titleCaseString($(element).text())
                }))
            }
        }))
        const chapterList = this.parseChapterList($, mangaId, base)
        const mangaObj: Manga = {
            author: $(".n2", items.first()).text(),
            desc: summary,
            id: mangaId,
            image: $("div.imgbox img").first().attr("src") || "",
            rating: 0,
            status: MangaStatus.ONGOING,
            titles: [$("div.container h3").first().text()],
            tags: [createTagSection({
                id: "1",
                label: "1",
                tags: tagList
            })]
        }
        if (chapterList) {
            const chapterObj = chapterList[chapterList.length - 1]
            if (chapterObj.time) {
                mangaObj.lastUpdate = chapterObj.time.toString();
            }
        }
        return createManga(mangaObj);
    }

    parseSearchResult($: CheerioStatic, base: string) {
        const children = $("ul.boxhover1 li");
        if (children.length === 0) {
            return [];
        } else {
            return this.parseMangaList($, base);
        }
    }
}