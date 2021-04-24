import cheerio from "cheerio";
import {Dridespoon} from "../Dridespoon/Dridespoon";
import {APIWrapper, Source} from "paperback-extensions-common";

describe("Dridespoon Tests", function () {
    let wrapper: APIWrapper = new APIWrapper();
    let source: Source = new Dridespoon(cheerio);
    let chai = require("chai"),
        expect = chai.expect;
    let chaiAsPromised = require("chai-as-promised");
    chai.use(chaiAsPromised);

    let mangaId = "GT-giRl";

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, mangaId);
        expect(
            details,
            "No results found with test-defined ID [" + mangaId + "]"
        ).to.exist;

        // Validate that the fields are filled
        let data = details;
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.image, "Missing Image").to.exist;
        expect(data.status, "Missing Status").to.exist;
        expect(data.titles, "Missing Titles").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
        expect(data.desc, "Missing Description").to.be.not.empty;
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaId);

        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

        let entry = data[0];
        expect(entry.id, "No ID present").to.not.be.empty;
        expect(entry.chapNum, "No chapter number present").to.exist;
    });

    it("Get Chapter Details", async () => {
        let chapters = await wrapper.getChapters(source, mangaId);
        let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Testing search", async () => {
        let testSearch = createSearchRequest({
            title: "GT",
        });

        let search = await wrapper.searchRequest(source, testSearch);
        let result = search.results[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.title, "No title").to.be.not.empty;
    });

    it("Testing Home Page", async () => {
        let result = await wrapper.getHomePageSections(source);
        expect(result, "No response from server").to.exist;
        let item = result[0];
        expect(item, "Empty response from server").to.exist;
        if (item.items) {
            let subitem = item.items[0];

            expect(subitem.id, "No ID found for homepage item").to.not.be.empty;
            expect(subitem.title, "No Title found for homepage item").to.not.be.empty;
            expect(subitem.image, "No Image found for homepage item").to.not.be.empty;
        }
    })

    it("Testing Notifications", async () => {
        let updates = await wrapper.filterUpdatedManga(source, new Date("2021-1-27"), [mangaId])
        expect(updates, "No server response").to.exist
        expect(updates, "Empty server response").to.not.be.empty
        expect(updates[0], "No updates").to.not.be.empty;
    })
});