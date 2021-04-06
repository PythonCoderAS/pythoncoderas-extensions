import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile, Tag} from "paperback-extensions-common";

export class CatMangaParser {
    parseTileList($: CheerioStatic, className: string, className2: string | null = null) {
        if (className2 === null){
            className2 = className;
        }
        const mangaTiles: MangaTile[] = [];
        $(`div[class^=${className}_grid] *[class^=${className2}_element]`).map((index, element) => {
            const linkId = element.attribs["href"];
            if (linkId) {
                const tile: MangaTile = {
                    id: linkId.replace(`/series/`, "").split("/")[0],
                    title: createIconText({
                        text: $("p", element).first().text().trim()
                    }),
                    image: $("img", element).attr("src") || ""
                }
                if ($("p", element).length > 1){
                    tile.primaryText = createIconText({
                        text: $("p", element).last().text().trim()
                    });
                }
                mangaTiles.push(createMangaTile(tile));
            }
        })
        return mangaTiles;
    }

    parseFeatured($: CheerioStatic, base: string){
        const seen: string[] = [];
        const mangaTiles: MangaTile[] = [];
        $("ul.slider li.slide").map((index, element) => {
            const link = $("a", element);
            const linkId = link.attr("href")
            if (linkId){
                const id = linkId.replace(`/series/`, "").split("/")[0];
                if (!seen.includes(id)){
                    seen.push(id);
                    mangaTiles.push(createMangaTile({
                        id: id,
                        title: createIconText({
                            text: $("h1", element).first().text().trim()
                        }),
                        image: base + $("img", element).attr("src") || "",
                        primaryText: createIconText({
                            text: $("div p", $("a", element).parent()).first().text().trim()
                        })
                    }))
                }
            }
        })
        return mangaTiles;
    }

    parsePages($: CheerioStatic): string[] {
        const json = JSON.parse($("script#__NEXT_DATA__").html() || "{}");
        return json.props.pageProps.pages;
    }

    parseChapterList($: CheerioStatic, mangaId: string) {
        const chapters: Chapter[] = [];
        $('a[class^="chaptertile_element"]').map((index, element) => {
            const chapNumString = $("p", element).first().text().replace("Chapter ", "")
            const chapNum = Number(chapNumString) || 0;
            let title: string | null = null;
            if (chapNum === 0){
                title = chapNumString
            }
            const data: Chapter = {
                chapNum: chapNum,
                id: String(chapNum),
                langCode: LanguageCode.ENGLISH,
                mangaId: mangaId,
                name: title || $("p", element).last().text().trim()
            };
            chapters.push(createChapter(data));
        })
        return chapters
    }

    parseManga($: CheerioStatic, mangaId: string) {
        const tags: Tag[] = [];
        $('div[class^="series_tags"] p').map((index, element) => {
            const text = $(element).text().trim();
            tags.push(createTag({
                id: text,
                label: text
            }));
        });
        let status;
        if ($('p[class^="series_seriesStatus"]').first().text().trim().toLowerCase().includes("ongoing")){
            status = MangaStatus.ONGOING;
        } else {
            status = MangaStatus.COMPLETED;
        }
        const mangaObj: Manga = {
            desc: $('div[class^="series_seriesDesc"]').first().text().trim(),
            id: mangaId,
            image: $("img").attr("src") || "",
            rating: 0,
            status: status,
            titles: [$("h1").first().text()],
            tags: [createTagSection({
                id: "tags",
                label: "Tags",
                tags: tags
            })]
        }
        return createManga(mangaObj)
    }

}