import {Chapter, LanguageCode, Manga, MangaStatus, MangaTile} from "paperback-extensions-common";

export class GlitchyComicsParser {
    parseMangaList($: CheerioStatic, base: string) {
        const mangaTiles: MangaTile[] = [];
        $("div.vc_row.wpb_row.vc_row-fluid.vc_row-o-equal-height.vc_row-flex").map(((index, element) => {
            $("div.wpb_column.vc_column_container.vc_col-sm-3.vc_col-xs-6", element).map(((index1, element1) => {
                const link = $("a.vc_single_image-wrapper.vc_box_rounded.vc_box_border_grey", element1).first();
                const cover = $("img", link).first();
                const linkId = link.attr("href")
                const imageLink = cover.attr("src") || "";
                if (linkId) {
                    mangaTiles.push(createMangaTile({
                        id: linkId.replace(base + "/", "").replace("category/", ""),
                        image: imageLink || "",
                        title: createIconText({
                            text: $("a", $("h6.vc_custom_heading", element1).first()).first().text()
                        })
                    }))
                }
            }))
        }))
        return mangaTiles;
    }

    parsePages($: CheerioStatic) {
        const pages: string[] = [];
        $("div.wp-block-image img", $("div.s-post-content.s-post-small-el.bb-mb-el").first()).map((index, element) => {
            if ("attribs" in element && element.attribs["src"]){
            pages.push(element.attribs["src"])
            }
        })
        return pages;
    }

    parseChapterList($: CheerioStatic, mangaId: string, base: string) {
        const chapters: Chapter[] = [];
        $("ul#post-items").first().children().map(((index, element) => {
            const header = $("header.entry-header", element).first();
            const link = $("a", header).first();
            const linkId = link.attr("href");
            const time = $("time.entry-date.updated", element).first().attr("datetime");
            if (linkId) {
                const data: Chapter = {
                    chapNum: Number(link.text().replace("Chapter ", "")),
                    id: linkId.replace(base + "/", ""),
                    langCode: LanguageCode.ENGLISH,
                    mangaId: mangaId,
                }
                if (time) {
                    data.time = new Date(time);
                }
                chapters.push(createChapter(data))
            }
        }))
        return chapters
    }

    parseManga($: CheerioStatic, mangaId: string, base: string) {
        const authorAndArtistBlock = $("h4.ult-responsive.info-list-heading", $("div.vc_row.wpb_row.vc_inner.vc_row-fluid").first());
        const chapterList = this.parseChapterList($, mangaId, base)[0];
        const mangaObj: Manga = {
            artist: authorAndArtistBlock.first().text(),
            author: authorAndArtistBlock.last().text(),
            desc: $("div.wpb_text_column.wpb_content_element").first().text(),
            id: mangaId,
            image: $("img.vc_single_image-img.attachment-full").attr("src") || "",
            rating: 0,
            status: MangaStatus.ONGOING,
            titles: [$("h2.vc_custom_heading").first().text()],
        }
        if (chapterList) {
            const lastTime = chapterList.time;
            if (lastTime) {
                mangaObj.lastUpdate = lastTime.toString();
            }
        }
        return createManga(mangaObj)
    }

    parseSearchResult($: CheerioStatic, base: string) {
        if ($("section.no-results.not-found").length !== 0) {
            return [];
        } else {
            const tiles: MangaTile[] = [];
            $("li.post-item", $("ul#post-items").first()).map(((index, element) => {
                const link = $("a", $("h2.entry-title", element));
                const linkId = link.attr("href");
                if (linkId) {
                    tiles.push(createMangaTile({
                        id: linkId.replace(base + "/", "").replace("category/", ""),
                        image: "",
                        title: createIconText({
                            text: link.text()
                        })
                    }))
                }
            }))
            return tiles;
        }
    }
}