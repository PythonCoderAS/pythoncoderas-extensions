import {SourceInfo, TagType} from "paperback-extensions-common"
import {GuyaTemplate} from "../GuyaTemplate";

const BASE = "https://mahoushoujobu.com"

export const MahouShoujoBuInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.0.6",
    name: "MahouShoujoBu",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from MahouShoujoBu",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        },
        {
            text: "Deprecated - Will Not Be Updated",
            type: TagType.RED
        }
    ]
}

export class MahouShoujoBu extends GuyaTemplate {
    readonly baseUrl: string = BASE;
}