import {SourceInfo, TagType} from "paperback-extensions-common"
import {GuyaTemplate} from "../GuyaTemplate";

const BASE = "https://hachirumi.com"

export const HachirumiInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.0.1",
    name: "Hachirumi",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from Hachirumi",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class Hachirumi extends GuyaTemplate {
    readonly baseUrl: string = BASE;
}