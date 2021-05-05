import {SourceInfo} from "paperback-extensions-common"
import {GuyaTemplate} from "../GuyaTemplate";

const BASE = "https://danke.moe"

export const DankeFursInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.0.0",
    name: "DankeFurs",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from DankeFurs",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE
}

export class DankeFurs extends GuyaTemplate {
    readonly baseUrl: string = BASE;
}