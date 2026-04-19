/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 5.7.0
 */

const { axios } = require("@musicfree/util");

// 核心接口定义
const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com"
};

// 1. 搜索函数
async function search(keyword, page, type) {
    if (type !== "music") return null;
    try {
        const res = await axios.get(APIS.qishui, {
            params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
        });
        const list = res.data?.data?.lists || [];
        return {
            isEnd: list.length < 20,
            data: list.map((item) => ({
                id: String(item.id || item.vid),
                name: String(item.name || "未知歌曲"),
                artist: String(item.artists || "未知歌手"),
                album: String(item.album || ""),
                img: String(item.cover || item.pic || ""),
                platform: "netease" 
            }))
        };
    } catch (e) { return null; }
}

// 2. 播放链接获取（多链路回退）
async function getMediaSource(item, quality) {
    const id = item.id;
    const br = { low: "128", standard: "320", high: "320", super: "740" }[quality] || "128";
    const level = quality === "low" ? "standard" : "lossless";

    // 链路1：星海
    try {
        const r1 = await axios.get(`${APIS.xinghai}&types=url&source=netease&id=${id}&br=${br}`);
        if (r1.data?.url) return { url: r1.data.url };
    } catch (e) {}

    // 链路2：长青
    try {
        const r2 = await axios.get(`${APIS.changqing}/wy/wy.php?type=mp3&id=${id}&level=${level}`);
        if (r2.data?.url) return { url: r2.data.url };
    } catch (e) {}

    // 链路3：念心
    try {
        const r3 = await axios.get(`${APIS.nianxin}/wy.php?id=${id}&level=${level}&type=mp3`);
        if (r3.data?.url) return { url: r3.data.url };
    } catch (e) {}

    return null;
}

// 3. 歌词获取
async function getLyric(item) {
    try {
        const res = await axios.get(APIS.qishui, { params: { act: "song", id: item.id } });
        const data = res.data?.data?.[0] || res.data?.data;
        return { lyric: data?.lyric || "" };
    } catch (e) { return null; }
}

// 4. 导出对象 (MusicFree 必须包含此项)
module.exports = {
    platform: "全豆要聚合",
    version: "5.7.0",
    author: "iamcool666",
    search,
    getMediaSource,
    getLyric
};
