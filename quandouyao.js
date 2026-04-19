/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 5.3.0
 */

const { axios } = require("@musicfree/util");

// --- 接口定义 ---
const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com"
};

async function search(keyword, page, type) {
    if (type !== "music") return null;
    const res = await axios.get(APIS.qishui, {
        params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
    });
    const list = res.data?.data?.lists || [];
    return {
        isEnd: list.length < 20,
        data: list.map((item) => ({
            id: item.id || item.vid,
            name: item.name,
            artist: item.artists,
            album: item.album,
            img: item.cover || item.pic,
            platform: "netease" // 内部逻辑锚点
        }))
    };
}

async function getMediaSource(item, quality) {
    const id = item.id;
    const br = { low: "128", standard: "320", high: "320", super: "740" }[quality] || "128";
    const level = quality === "low" ? "standard" : "lossless";

    // 链路1：星海
    try {
        const res = await axios.get(`${APIS.xinghai}&types=url&source=netease&id=${id}&br=${br}`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    // 链路2：长青
    try {
        const res = await axios.get(`${APIS.changqing}/wy/wy.php?type=mp3&id=${id}&level=${level}`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    // 链路3：念心
    try {
        const res = await axios.get(`${APIS.nianxin}/wy.php?id=${id}&level=${level}&type=mp3`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    return null;
}

async function getLyric(item) {
    const res = await axios.get(APIS.qishui, { params: { act: "song", id: item.id } });
    const data = res.data?.data?.[0] || res.data?.data;
    return { lyric: data?.lyric || "" };
}

// 仿照 xiaoqiu.js 的导出结构
module.exports = {
    platform: "全豆要聚合",
    version: "5.3.0",
    author: "iamcool666",
    search,
    getMediaSource,
    getLyric
};
