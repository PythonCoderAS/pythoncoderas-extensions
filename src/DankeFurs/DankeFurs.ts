import {Request, SourceInfo, TagType} from "paperback-extensions-common"
import {GuyaTemplate} from "../GuyaTemplate";

const BASE = "https://danke.moe"

export const DankeFursInfo: SourceInfo = {
    icon: "icon.png",
    version: "1.1.1",
    name: "DankeFurs",
    author: "PythonCoderAS",
    authorWebsite: "https://github.com/PythonCoderAS",
    description: "Extension that pulls manga from DankeFurs",
    language: "en",
    hentaiSource: false,
    websiteBaseURL: BASE,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        },
        {
            text: "Cloudflare",
            type: TagType.RED
        }
    ]
}

export class DankeFurs extends GuyaTemplate {
    readonly baseUrl: string = BASE;


    getCloudflareBypassRequest(): Request  {
        return createRequestObject({
            url: this.baseUrl,
            method: "GET"
        });
    }
}