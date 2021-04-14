import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile, Tag} from "paperback-extensions-common";

export class RainOfSnowParser {

    decodeHTMLEntity(str: string): string {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        })
    }

    parseMangaList($: CheerioStatic, base: string, filterElement: Cheerio | null = null) {
        if (filterElement === null){
            filterElement = $.root()
        }
        const mangaTiles: MangaTile[] = [];
        $("div.col-xs-6.col-md-3.col-lg-2", filterElement).map(((index, element) => {
            const link = $("h3 a", element).first();
            const linkId = link.attr("href");
            const imgSrc = $("a img", element).first().attr("src");
            if (linkId && linkId.includes("comic")) {
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
        $("div#chapter li").map((index, element) => {
            const link = $("a", element).first();
            const linkId = link.attr("href");
            if (linkId) {
                const chapParts = link.text().split(".");
                chapters.push(createChapter({
                    chapNum: Number(chapParts[0]),
                    id: linkId.replace(base + "/comic_chapters/", ""),
                    langCode: LanguageCode.ENGLISH,
                    mangaId: mangaId,
                    time: new Date($("small", element).first().text()),
                    name: chapParts[1] || undefined
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
        const tagList: Tag[] = [];
        const summary: string = $("div#synop").text().replace(/\s{2,}/, "").trim();
        $("a[rel=\"tag\"]", $("ul.vbtcolor1").first()).map(((index, element) => {
            if ("attribs" in element) {
                tagList.push(createTag({
                    id: element.attribs["href"].replace(`${base}/tag/`, "").slice(0, -1),
                    label: RainOfSnowParser.titleCaseString($(element).text())
                }))
            }
        }))
        const chapterList = this.parseChapterList($, mangaId, base)
        const mangaObj: Manga = {
            author: this.decodeHTMLEntity($("small", $("ul.vbtcolor1 li").first()).text().trim()),
            desc: summary,
            id: mangaId,
            image: $("img", $("div.container div.row").first()).first().attr("src") || "",
            rating: 0,
            status: MangaStatus.ONGOING,
            titles: [this.decodeHTMLEntity($("div.text h2").first().text())],
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