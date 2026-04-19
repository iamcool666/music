/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 5.4.0
 */

const { axios } = require("@musicfree/util");

// --- 从原脚本提取的核心 API ---
const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com"
};

// 搜索功能：使用原脚本中的汽水接口逻辑
async function search(keyword, page, type) {
    if (type !== "music") return null;
    const res = await axios.get(APIS.qishui, {
        params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
    });
    const list = Array.isArray(res.data?.data?.lists) ? res.data.data.lists : [];
    return {
        isEnd: list.length < 20,
        data: list.map((item) => ({
            id: String(item.id || item.vid),
            name: String(item.name || "未知"),
            artist: String(item.artists || "未知"),
            album: String(item.album || ""),
            img: String(item.cover || item.pic || ""),
            platform: "netease" 
        }))
    };
}

// 播放源获取：复刻原脚本的多链路自动回退逻辑
async function getMediaSource(item, quality) {
    const id = item.id;
    const br = { low: "128", standard: "320", high: "320", super: "740" }[quality] || "128";
    const level = quality === "low" ? "standard" : "lossless";

    // 链路1：星海主接口
    try {
        const res = await axios.get(`${APIS.xinghai}&types=url&source=netease&id=${id}&br=${br}`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    // 链路2：长青SVIP接口
    try {
        const res = await axios.get(`${APIS.changqing}/wy/wy.php?type=mp3&id=${id}&level=${level}`);
        const url = res.data?.url || (typeof res.data === 'string' && res.data.startsWith('http') ? res.data : null);
        if (url) return { url };
    } catch (e) {}

    // 链路3：念心SVIP接口
    try {
        const res = await axios.get(`${APIS.nianxin}/wy.php?id=${id}&level=${level}&type=mp3`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    return null;
}

// 歌词获取：使用汽水接口
async function getLyric(item) {
    try {
        const res = await axios.get(APIS.qishui, { params: { act: "song", id: item.id } });
        const data = res.data?.data?.[0] || res.data?.data;
        return { lyric: data?.lyric || "" };
    } catch (e) {
        return null;
    }
}

// 导出插件对象 (MusicFree 规范)
module.exports = {
    platform: "全豆要聚合",
    version: "5.4.0",
    author: "iamcool666",
    search,
    getMediaSource,
    getLyric
};
