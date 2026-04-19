/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 6.0.0
 * @description 终极兼容版：补齐 MusicFree 引擎所需的全部声明
 */

// 修正 1：改用最标准的 axios 引入方式，防止底层包路径不兼容
const axios = require("axios");

const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com",
    suyin: "https://oiapi.net/api/QQ_Music"
};

async function search(keyword, page, type) {
    if (type !== "music") return null;
    try {
        const res = await axios.get(APIS.qishui, {
            params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
        });
        const list = res?.data?.data?.lists || [];
        return {
            isEnd: list.length < 20,
            data: list.map(item => ({
                id: String(item.id || item.vid),
                name: String(item.name || "未知歌曲"),
                artist: String(item.artists || "未知歌手"),
                album: String(item.album || ""),
                img: String(item.cover || item.pic || ""),
                platform: "netease" 
            }))
        };
    } catch (e) {
        return { isEnd: true, data: [] };
    }
}

async function getMediaSource(item, quality) {
    const id = item.id;
    const level = quality === 'low' ? 'standard' : 'lossless';
    const br = { 'low': '128', 'standard': '320', 'high': '320', 'super': '740' }[quality] || '128';

    try {
        const r1 = await axios.get(`${APIS.xinghai}&types=url&source=netease&id=${id}&br=${br}`);
        if (r1?.data?.url) return { url: r1.data.url };
    } catch (e) {}

    try {
        const r2 = await axios.get(`${APIS.changqing}/wy/wy.php?type=mp3&id=${id}&level=${level}`);
        if (r2?.data?.url) return { url: r2.data.url };
    } catch (e) {}

    try {
        const r3 = await axios.get(`${APIS.nianxin}/wy.php?id=${id}&level=${level}&type=mp3`);
        if (r3?.data?.url) return { url: r3.data.url };
    } catch (e) {}

    try {
        const r4 = await axios.get(APIS.suyin, {
            params: { mid: id, type: "json", br: 4, key: "oiapi-ef6133b7-ac2f-dc7d-878c-d3e207a82575" }
        });
        if (r4?.data?.music) return { url: r4.data.music };
    } catch (e) {}

    try {
        const r5 = await axios.get(APIS.qishui, { params: { act: "song", id: id } });
        const url5 = r5?.data?.data?.[0]?.url || r5?.data?.data?.url;
        if (url5) return { url: url5 };
    } catch (e) {}

    return null;
}

async function getLyric(item) {
    try {
        const res = await axios.get(APIS.qishui, { params: { act: "song", id: item.id } });
        const lyric = res?.data?.data?.[0]?.lyric || res?.data?.data?.lyric;
        return { lyric: lyric || "" };
    } catch (e) {
        return { lyric: "" };
    }
}

// 修正 2：补齐所有严格要求的声明字段
module.exports = {
    platform: "全豆要聚合",
    author: "iamcool666",
    version: "6.0.0",
    appVersion: ">=0.1.0", // 兜底声明：告诉引擎支持的版本
    supportedSearchType: ["music"], // 致命修复：告诉引擎本插件支持搜索"单曲"，不加此项会导致引擎读取 undefined
    search,
    getMediaSource,
    getLyric
};
