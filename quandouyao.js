/**
 * @name 全豆要聚合音源
 * @version 5.1.0
 * @author iamcool666
 * @description 适配 MusicFree 订阅，聚合多链路回退
 */

const { axios } = require("@musicfree/util");

const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com"
};

// 内部搜索函数
async function search(keyword, page) {
    try {
        const res = await axios.get(APIS.qishui, {
            params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
        });
        const list = res.data?.data?.lists || [];
        return {
            isEnd: list.length < 20,
            data: list.map(item => ({
                id: item.id || item.vid,
                name: item.name,
                artist: item.artists,
                album: item.album,
                img: item.cover || item.pic,
                // 这里统一挂载到一个逻辑，方便获取链接时处理
                platform: "netease" 
            }))
        };
    } catch (e) { return { isEnd: true, data: [] }; }
}

// 核心：获取播放链接
async function getMediaSource(item, quality) {
    const id = item.id;
    const br = { 'low': '128', 'standard': '320', 'high': '320', 'super': '740' }[quality] || '128';
    const level = quality === 'low' ? 'standard' : 'lossless';

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

// 获取歌词
async function getLyric(item) {
    try {
        const res = await axios.get(APIS.qishui, { params: { act: "song", id: item.id } });
        const data = res.data?.data?.[0] || res.data?.data;
        return { lyric: data?.lyric || "" };
    } catch (e) { return null; }
}

module.exports = {
    platform: "全豆要聚合",
    version: "5.1.0",
    search,
    getMediaSource,
    getLyric
};
