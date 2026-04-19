/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 5.8.0
 * @description 提取 v5.0 核心逻辑：聚合 星海/溯音/念心/长青/汽水，多链路自动回退
 */

const { axios } = require("@musicfree/util");

// --- 核心配置 (完全保留自 v5.0 原稿) ---
const XINGHAI_MAIN_API = "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im";
const QISHUI_API = "https://api.vsaa.cn/api/music.qishui.vip";
const CHANGQING_WY = "http://175.27.166.236/wy/wy.php?type=mp3&id={id}&level={level}";
const NIANXIN_WY = "http://music.nxinxz.com/wy.php?id={id}&level={level}&type=mp3";

/**
 * 搜索逻辑 (复刻 v5.0 汽水搜索)
 */
async function search(keyword, page, type) {
    if (type !== "music") return null;
    try {
        const res = await axios.get(QISHUI_API, {
            params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
        });
        const list = res.data?.data?.lists || [];
        return {
            isEnd: list.length < 20,
            data: list.map(item => ({
                id: String(item.id || item.vid),
                name: String(item.name),
                artist: String(item.artists),
                album: String(item.album || ""),
                img: String(item.cover || item.pic || ""),
                platform: "netease" // 内部逻辑锚点
            }))
        };
    } catch (e) { return null; }
}

/**
 * 播放链接回退逻辑 (核心手术：将 v5.0 的并发尝试转为 MusicFree 兼容的顺序回退)
 */
async function getMediaSource(item, quality) {
    const id = item.id;
    const level = quality === 'low' ? 'standard' : 'lossless';
    const br = { 'low': '128', 'standard': '320', 'high': '320', 'super': '740' }[quality] || '128';

    // 链路1：星海主接口
    try {
        const r1 = await axios.get(`${XINGHAI_MAIN_API}&types=url&source=netease&id=${id}&br=${br}`);
        if (r1.data?.url) return { url: r1.data.url };
    } catch (e) {}

    // 链路2：长青SVIP
    try {
        const url2 = CHANGQING_WY.replace("{id}", id).replace("{level}", level);
        const r2 = await axios.get(url2);
        if (r2.data?.url) return { url: r2.data.url };
    } catch (e) {}

    // 链路3：念心SVIP
    try {
        const url3 = NIANXIN_WY.replace("{id}", id).replace("{level}", level);
        const r3 = await axios.get(url3);
        if (r3.data?.url) return { url: r3.data.url };
    } catch (e) {}

    // 链路4：溯音/汽水保底
    try {
        const r4 = await axios.get(QISHUI_API, { params: { act: "song", id: id } });
        const songUrl = r4.data?.data?.[0]?.url || r4.data?.data?.url;
        if (songUrl) return { url: songUrl };
    } catch (e) {}

    return null;
}

/**
 * 歌词逻辑
 */
async function getLyric(item) {
    try {
        const res = await axios.get(QISHUI_API, { params: { act: "song", id: item.id } });
        const data = res.data?.data?.[0] || res.data?.data;
        return { lyric: data?.lyric || "" };
    } catch (e) { return null; }
}

// --- 模块化外壳 (完全参照 Xiaoqiu.js 规范) ---
module.exports = {
    platform: "全豆要聚合",
    version: "5.8.0",
    author: "iamcool666",
    search,
    getMediaSource,
    getLyric
};
